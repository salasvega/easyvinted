import dotenv from 'dotenv';
import { SupabaseService } from './services/supabaseService.js';
import { VintedAutomation } from './services/vintedAutomation.js';
import { ArticleToPublish } from './types/vinted.js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SESSION_PATH = process.env.VINTED_SESSION_PATH || './vinted-session.json';
const MAX_ARTICLES_PER_RUN = parseInt(process.env.MAX_ARTICLES_PER_RUN || '5', 10);
const DELAY_BETWEEN_POSTS_MS = parseInt(process.env.DELAY_BETWEEN_POSTS_MS || '60000', 10);

interface PublicationStats {
  total: number;
  successful: number;
  failed: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }

  console.log('🚀 Starting Vinted publication automation...\n');

  const supabaseService = new SupabaseService(SUPABASE_URL, SUPABASE_KEY);
  const vintedAutomation = new VintedAutomation(SESSION_PATH);

  const stats: PublicationStats = {
    total: 0,
    successful: 0,
    failed: 0,
  };

  try {
    console.log('📥 Fetching articles to publish...');
    const articles = await supabaseService.getArticlesToPublish();

    if (articles.length === 0) {
      console.log('✓ No articles to publish');
      return;
    }

    const articlesToProcess = articles.slice(0, MAX_ARTICLES_PER_RUN);
    stats.total = articlesToProcess.length;

    console.log(`📋 Found ${articles.length} article(s) to publish`);
    console.log(`📊 Processing ${articlesToProcess.length} article(s) in this run\n`);

    await vintedAutomation.initialize();

    const isAuthenticated = await vintedAutomation.checkAuthentication();
    if (!isAuthenticated) {
      console.error('❌ Not authenticated on Vinted. Please run the setup script first.');
      process.exit(1);
    }

    console.log('✓ Authenticated on Vinted\n');

    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];

      console.log(`\n[${ i + 1}/${articlesToProcess.length}] Processing article: ${article.title}`);

      try {
        const result = await vintedAutomation.publishArticle(article);

        if (result.success && result.vintedUrl) {
          await supabaseService.markArticleAsPublished(article.id, result.vintedUrl);
          await supabaseService.logPublicationAttempt(article.id, true, `Published to ${result.vintedUrl}`);
          stats.successful++;
          console.log(`✅ Successfully published and updated in database`);
        } else {
          await supabaseService.markArticleAsFailed(article.id, result.error || 'Unknown error');
          await supabaseService.logPublicationAttempt(article.id, false, result.error || 'Unknown error');
          stats.failed++;
          console.log(`❌ Failed to publish: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabaseService.markArticleAsFailed(article.id, errorMessage);
        await supabaseService.logPublicationAttempt(article.id, false, errorMessage);
        stats.failed++;
        console.error(`❌ Error processing article: ${errorMessage}`);
      }

      if (i < articlesToProcess.length - 1) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_POSTS_MS / 1000} seconds before next publication...`);
        await sleep(DELAY_BETWEEN_POSTS_MS);
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await vintedAutomation.close();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Publication Summary:');
    console.log('='.repeat(50));
    console.log(`Total articles processed: ${stats.total}`);
    console.log(`✅ Successful: ${stats.successful}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log('='.repeat(50));
  }
}

export async function publishArticles(): Promise<void> {
  await main();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}
