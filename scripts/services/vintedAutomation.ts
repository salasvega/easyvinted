import { Browser, Page, chromium } from 'playwright';
import { promises as fs } from 'fs';
import { ArticleToPublish, VintedPublishResult, VintedSession } from '../types/vinted.js';
import path from 'path';
import os from 'os';

export class VintedAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private sessionPath: string;

  constructor(sessionPath: string = './vinted-session.json') {
    this.sessionPath = sessionPath;
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'fr-FR',
    });

    await this.loadSession(context);

    this.page = await context.newPage();
  }

  private async loadSession(context: any): Promise<void> {
    try {
      const sessionData = await fs.readFile(this.sessionPath, 'utf-8');
      const session: VintedSession = JSON.parse(sessionData);

      if (session.cookies && session.cookies.length > 0) {
        await context.addCookies(session.cookies);
        console.log('✓ Session loaded successfully');
      }
    } catch (error) {
      console.warn('⚠ No session file found. You will need to authenticate manually.');
    }
  }

  async saveSession(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = this.browser.contexts()[0];
    const cookies = await context.cookies();

    const session: VintedSession = {
      cookies: cookies,
    };

    await fs.writeFile(this.sessionPath, JSON.stringify(session, null, 2), 'utf-8');
    console.log('✓ Session saved successfully');
  }

  async navigateToNewItemPage(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto('https://www.vinted.fr/items/new', {
      waitUntil: 'networkidle',
    });

    await this.page.waitForTimeout(2000);
  }

  async checkAuthentication(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto('https://www.vinted.fr', { waitUntil: 'networkidle' });

    const isLoggedIn = await this.page.evaluate(() => {
      const userMenu = document.querySelector('[data-testid="user-menu"]');
      return userMenu !== null;
    });

    return isLoggedIn;
  }

  async loginWithCredentials(email: string, password: string): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    await this.page.goto('https://www.vinted.fr/member/login', {
      waitUntil: 'networkidle',
    });

    await this.page.waitForTimeout(2000);

    await this.page.fill('input[name="login"]', email);
    await this.page.fill('input[name="password"]', password);

    await this.page.click('button[type="submit"]');

    await this.page.waitForTimeout(5000);

    const isLoggedIn = await this.checkAuthentication();

    if (!isLoggedIn) {
      throw new Error('Failed to login with provided credentials');
    }

    console.log('✓ Successfully logged in');
  }

  private async downloadPhoto(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const urlObj = new URL(url);
    const filename = path.basename(urlObj.pathname);
    const timestamp = Date.now();
    const uniqueFilename = `vinted-${timestamp}-${filename}`;
    const tempPath = path.join(os.tmpdir(), uniqueFilename);

    await fs.writeFile(tempPath, buffer);
    console.log(`✓ Photo downloaded to: ${tempPath}`);
    return tempPath;
  }

  async uploadPhotos(photoPaths: string[]): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log(`📸 Attempting to upload ${photoPaths.length} photos...`);

    const fileInput = this.page.locator('input[type="file"]').first();
    const isVisible = await fileInput.isVisible().catch(() => false);
    console.log(`File input visible: ${isVisible}`);

    const localPaths: string[] = [];

    for (let i = 0; i < photoPaths.length; i++) {
      const photoPath = photoPaths[i];
      console.log(`\n📷 Processing photo ${i + 1}/${photoPaths.length}`);
      let localPath = photoPath;

      if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        console.log(`📥 Downloading from: ${photoPath.substring(0, 80)}...`);
        localPath = await this.downloadPhoto(photoPath);
        localPaths.push(localPath);
      } else {
        console.log(`⚠️  Local path detected, attempting to download as URL: ${photoPath}`);
        try {
          localPath = await this.downloadPhoto(photoPath);
          localPaths.push(localPath);
        } catch (error) {
          throw new Error(`Cannot access local file path: ${photoPath}. Please ensure photos are stored as URLs in the database.`);
        }
      }

      console.log(`⬆️  Uploading file: ${localPath}`);
      await fileInput.setInputFiles(localPath);
      console.log(`✓ File set, waiting for upload...`);
      await this.page.waitForTimeout(2000);
    }

    console.log(`\n🧹 Cleaning up temporary files...`);
    for (const localPath of localPaths) {
      try {
        await fs.unlink(localPath);
        console.log(`✓ Deleted: ${localPath}`);
      } catch (error) {
        console.warn(`⚠ Failed to delete temp file: ${localPath}`);
      }
    }

    console.log(`\n✓ Successfully uploaded ${photoPaths.length} photos`);
  }

  async fillArticleForm(article: ArticleToPublish): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log('\n📝 Filling article form...');

    console.log('⏸️  PAUSED - Please fill the form manually in the browser');
    console.log('Once done, return here and press Enter to continue...\n');

    await new Promise<void>((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });

    console.log('✓ Continuing...');
  }

  async submitArticle(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const submitButton = this.page.locator('button[type="submit"]').last();
    await submitButton.click();

    await this.page.waitForURL('**/items/*', {
      timeout: 30000,
      waitUntil: 'networkidle',
    });

    const vintedUrl = this.page.url();
    console.log(`✓ Article published: ${vintedUrl}`);

    return vintedUrl;
  }

  async publishArticle(article: ArticleToPublish): Promise<VintedPublishResult> {
    try {
      console.log(`\n📦 Publishing: ${article.title}`);

      await this.navigateToNewItemPage();

      if (article.photos && article.photos.length > 0) {
        await this.uploadPhotos(article.photos);
      }

      await this.fillArticleForm(article);

      const vintedUrl = await this.submitArticle();

      await this.page?.waitForTimeout(2000);

      return {
        success: true,
        articleId: article.id,
        vintedUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ Failed to publish article: ${errorMessage}`);

      return {
        success: false,
        articleId: article.id,
        error: errorMessage,
      };
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
