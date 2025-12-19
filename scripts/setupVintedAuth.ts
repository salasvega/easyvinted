import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import { VintedSession } from './types/vinted.js';

const SESSION_PATH = process.env.VINTED_SESSION_PATH || './vinted-session.json';

async function setupAuthentication(): Promise<void> {
  console.log('🔐 Vinted Authentication Setup\n');
  console.log('This script will open a browser window.');
  console.log('Please log in to your Vinted account manually.');
  console.log('Once logged in, press Enter in this terminal to save the session.\n');

  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'fr-FR',
  });

  const page: Page = await context.newPage();

  await page.goto('https://www.vinted.fr', {
    waitUntil: 'networkidle',
  });

  console.log('✓ Browser opened at vinted.fr');
  console.log('📝 Steps to follow:');
  console.log('   1. Click "Se connecter" in the top right');
  console.log('   2. Enter your email and password');
  console.log('   3. Complete login');
  console.log('   4. Once logged in, return here and press Enter\n');

  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });

  const isLoggedIn = await page.evaluate(() => {
    const userMenu = document.querySelector('[data-testid="user-menu"]');
    return userMenu !== null;
  });

  if (!isLoggedIn) {
    console.warn('⚠ Warning: Could not detect successful login.');
    console.log('Saving session anyway. You may need to run this script again if it doesn\'t work.\n');
  } else {
    console.log('✓ Login detected successfully!\n');
  }

  const cookies = await context.cookies();

  const session: VintedSession = {
    cookies: cookies,
  };

  await fs.writeFile(SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');

  console.log(`✅ Session saved to: ${SESSION_PATH}`);
  console.log('You can now run the publication script.\n');

  await browser.close();
}

setupAuthentication().catch((error) => {
  console.error('❌ Error during setup:', error);
  process.exit(1);
});
