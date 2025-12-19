import { Browser, Page, chromium } from 'playwright';
import { Article, VintedCredentials, PublicationResult } from './types.js';
import { promises as fs } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

const SESSION_FILE = './playwright-state/vinted-session.json';

export class VintedClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private credentials: VintedCredentials;
  private headless: boolean;

  constructor(credentials: VintedCredentials, headless = true) {
    this.credentials = credentials;
    this.headless = headless;
  }

  async initialize(): Promise<void> {
    console.log('🌐 Launching Chromium browser...');

    this.browser = await chromium.launch({
      headless: this.headless,
      slowMo: 100,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'fr-FR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    await this.loadSession(context);

    this.page = await context.newPage();
    console.log('✓ Browser initialized');
  }

  private async loadSession(context: any): Promise<void> {
    try {
      await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true });
      const sessionData = await fs.readFile(SESSION_FILE, 'utf-8');
      const session = JSON.parse(sessionData);

      if (session.cookies && session.cookies.length > 0) {
        await context.addCookies(session.cookies);
        console.log('✓ Session loaded from cache');
      }
    } catch (error) {
      console.log('⚠ No cached session found, will need to authenticate');
    }
  }

  private async saveSession(): Promise<void> {
    if (!this.browser) return;

    try {
      const context = this.browser.contexts()[0];
      const cookies = await context.cookies();

      await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true });
      await fs.writeFile(
        SESSION_FILE,
        JSON.stringify({ cookies }, null, 2),
        'utf-8'
      );
      console.log('✓ Session saved');
    } catch (error) {
      console.error('⚠ Failed to save session:', error);
    }
  }

  async checkAuthentication(): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🔐 Checking authentication status...');

    try {
      await this.page.goto('https://www.vinted.fr', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const isLoggedIn = await this.page.evaluate(() => {
        return document.querySelector('[data-testid="user-menu"]') !== null;
      });

      if (isLoggedIn) {
        console.log('✓ Already authenticated');
        return true;
      }

      console.log('⚠ Not authenticated, logging in...');
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async login(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`🔑 Logging in as ${this.credentials.email}...`);

    await this.page.goto('https://www.vinted.fr/member/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await this.page.waitForSelector('input[name="login"]', { timeout: 10000 });

    await this.page.fill('input[name="login"]', this.credentials.email);
    await this.page.fill('input[name="password"]', this.credentials.password);

    await this.page.click('button[type="submit"]');

    await this.page.waitForNavigation({
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const isLoggedIn = await this.page.evaluate(() => {
      return document.querySelector('[data-testid="user-menu"]') !== null;
    });

    if (!isLoggedIn) {
      throw new Error('Login failed - please check credentials');
    }

    console.log('✓ Successfully logged in');
    await this.saveSession();
  }

  async publishArticle(article: Article): Promise<PublicationResult> {
    if (!this.page) throw new Error('Browser not initialized');

    const downloadedPhotos: string[] = [];

    try {
      console.log(`\n📦 Publishing article: ${article.title}`);

      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        await this.login();
      }

      console.log('📝 Navigating to new item page...');
      await this.page.goto('https://www.vinted.fr/items/new', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await this.page.waitForTimeout(2000);

      if (article.photos && article.photos.length > 0) {
        console.log(`📥 Downloading ${article.photos.length} photos from Supabase...`);

        for (const photoUrl of article.photos) {
          const localPath = await this.downloadPhotoToTemp(photoUrl);
          downloadedPhotos.push(localPath);
        }

        await this.uploadPhotos(downloadedPhotos);
      }

      await this.fillArticleForm(article);

      const vintedUrl = await this.submitArticle();

      console.log(`✅ Article published successfully: ${vintedUrl}`);

      await this.cleanupTempFiles(downloadedPhotos);

      return {
        success: true,
        vintedUrl,
      };
    } catch (error) {
      await this.cleanupTempFiles(downloadedPhotos);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to publish article: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async uploadPhotos(photoPaths: string[]): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`📷 Uploading ${photoPaths.length} photos...`);

    try {
      const fileInput = await this.page.locator('input[type="file"][accept*="image"]').first();

      for (const photoPath of photoPaths) {
        await fileInput.setInputFiles(photoPath);
        await this.page.waitForTimeout(1500);
      }

      console.log(`✓ Uploaded ${photoPaths.length} photos`);
    } catch (error) {
      console.error('⚠ Photo upload failed:', error);
      throw new Error(`Photo upload failed: ${error}`);
    }
  }

  private async fillArticleForm(article: Article): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('✍️  Filling article form...');

    try {
      console.log('  📝 Setting title...');
      await this.fillFieldSafely('input[name="title"], input[id*="title"], input[placeholder*="Titre"]', article.title);

      if (article.description) {
        console.log('  📝 Setting description...');
        await this.fillFieldSafely('textarea[name="description"], textarea[id*="description"], textarea[placeholder*="Description"]', article.description);
      }

      if (article.brand) {
        console.log('  📝 Setting brand...');
        await this.fillFieldSafely('input[name="brand"], input[id*="brand"], input[placeholder*="Marque"]', article.brand);
      }

      if (article.main_category || article.subcategory || article.item_category) {
        console.log('  📂 Setting categories...');
        await this.fillCategories(article);
      }

      if (article.size) {
        console.log('  📝 Setting size...');
        await this.fillFieldSafely('input[name="size"], select[name="size"], input[id*="size"]', article.size);
      }

      console.log('  📝 Setting condition...');
      await this.selectOptionSafely('select[name="status"], select[id*="status"], select[name="item_status"]', article.condition);

      if (article.color) {
        console.log('  🎨 Setting color...');
        await this.fillFieldSafely('input[name="color"], select[name="color"], input[id*="color"]', article.color);
      }

      if (article.material) {
        console.log('  🧵 Setting material...');
        await this.fillFieldSafely('input[name="material"], select[name="material"], input[id*="material"]', article.material);
      }

      console.log('  💰 Setting price...');
      const priceValue = parseFloat(article.price).toFixed(2);
      await this.fillFieldSafely('input[name="price"], input[id*="price"], input[type="number"]', priceValue);

      console.log('✓ Form filled successfully');
    } catch (error) {
      console.error('⚠ Form filling failed:', error);
      throw new Error(`Form filling failed: ${error}`);
    }
  }

  private async fillFieldSafely(selectors: string, value: string): Promise<void> {
    const selectorList = selectors.split(',').map(s => s.trim());

    for (const selector of selectorList) {
      try {
        const element = this.page!.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 });

        if (isVisible) {
          await element.fill(value);
          await this.page!.waitForTimeout(500);
          return;
        }
      } catch (error) {
        continue;
      }
    }

    console.warn(`⚠️  Could not find field with selectors: ${selectors}`);
  }

  private async selectOptionSafely(selectors: string, value: string): Promise<void> {
    const selectorList = selectors.split(',').map(s => s.trim());

    for (const selector of selectorList) {
      try {
        const element = this.page!.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 });

        if (isVisible) {
          await element.selectOption(value);
          await this.page!.waitForTimeout(500);
          return;
        }
      } catch (error) {
        continue;
      }
    }

    console.warn(`⚠️  Could not find select with selectors: ${selectors}`);
  }

  private async fillCategories(article: Article): Promise<void> {
    try {
      if (article.main_category) {
        const categorySelectors = [
          'select[name="catalog_id"]',
          'select[id*="catalog"]',
          'select[name="category"]',
          '[data-testid="category-select"]'
        ];

        for (const selector of categorySelectors) {
          try {
            const element = this.page!.locator(selector).first();
            const isVisible = await element.isVisible({ timeout: 2000 });

            if (isVisible) {
              await element.selectOption({ label: article.main_category });
              await this.page!.waitForTimeout(1000);
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      if (article.subcategory) {
        await this.page!.waitForTimeout(1000);

        const subcategorySelectors = [
          'select[name="category_id"]',
          'select[id*="subcategory"]',
          '[data-testid="subcategory-select"]'
        ];

        for (const selector of subcategorySelectors) {
          try {
            const element = this.page!.locator(selector).first();
            const isVisible = await element.isVisible({ timeout: 2000 });

            if (isVisible) {
              await element.selectOption({ label: article.subcategory });
              await this.page!.waitForTimeout(500);
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not set categories:', error);
    }
  }

  private async submitArticle(): Promise<string> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('🚀 Submitting article...');

    try {
      const submitButton = this.page.locator('button[type="submit"]').last();
      await submitButton.click();

      await this.page.waitForURL('**/items/*', {
        timeout: 30000,
        waitUntil: 'networkidle',
      });

      const vintedUrl = this.page.url();
      console.log(`✓ Article submitted: ${vintedUrl}`);

      await this.page.waitForTimeout(2000);

      return vintedUrl;
    } catch (error) {
      console.error('⚠ Submission failed:', error);
      throw new Error(`Article submission failed: ${error}`);
    }
  }

  private async downloadPhotoToTemp(photoUrl: string): Promise<string> {
    console.log(`📥 Downloading photo: ${photoUrl}`);

    try {
      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download photo: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const fileName = `vinted-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const tempPath = path.join(tmpdir(), fileName);

      await writeFile(tempPath, Buffer.from(buffer));
      console.log(`✓ Photo saved to: ${tempPath}`);

      return tempPath;
    } catch (error) {
      console.error(`❌ Failed to download photo ${photoUrl}:`, error);
      throw error;
    }
  }

  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await unlink(file);
        console.log(`🗑️  Deleted temp file: ${path.basename(file)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete temp file ${file}`);
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('✓ Browser closed');
    }
  }
}
