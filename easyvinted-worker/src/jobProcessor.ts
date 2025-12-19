import {
  getPendingJobs,
  updateJobStatus,
  getArticleById,
  markArticleAsPublished,
} from './supabaseClient.js';
import { VintedClient } from './vintedClient.js';
import { VintedCredentials } from './types.js';

export async function processJobs(): Promise<void> {
  console.log('\n=================================');
  console.log('🚀 Starting job processor...');
  console.log('=================================\n');

  const vintedEmail = process.env.VINTED_EMAIL;
  const vintedPassword = process.env.VINTED_PASSWORD;
  const headless = process.env.HEADLESS !== 'false';

  if (!vintedEmail || !vintedPassword) {
    throw new Error('Missing VINTED_EMAIL or VINTED_PASSWORD environment variables');
  }

  const credentials: VintedCredentials = {
    email: vintedEmail,
    password: vintedPassword,
  };

  console.log('📋 Fetching pending jobs...');
  const pendingJobs = await getPendingJobs();

  if (pendingJobs.length === 0) {
    console.log('✓ No pending jobs found');
    return;
  }

  console.log(`📊 Found ${pendingJobs.length} pending job(s)\n`);

  let client: VintedClient | null = null;

  try {
    client = new VintedClient(credentials, headless);
    await client.initialize();

    for (const job of pendingJobs) {
      await processJob(job.id, job.article_id, client);
    }
  } catch (error) {
    console.error('❌ Fatal error in job processor:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }

  console.log('\n=================================');
  console.log('✅ Job processor finished');
  console.log('=================================\n');
}

async function processJob(
  jobId: string,
  articleId: string,
  client: VintedClient
): Promise<void> {
  console.log(`\n---------------------------------`);
  console.log(`🔄 Processing job: ${jobId}`);
  console.log(`   Article: ${articleId}`);
  console.log(`---------------------------------`);

  try {
    console.log('📝 Updating job status to "running"...');
    await updateJobStatus(jobId, 'running');

    console.log('📖 Fetching article data...');
    const article = await getArticleById(articleId);

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    console.log(`✓ Article loaded: "${article.title}"`);

    const result = await client.publishArticle(article);

    if (result.success && result.vintedUrl) {
      console.log('✅ Publication successful!');

      await updateJobStatus(jobId, 'success', result.vintedUrl);

      await markArticleAsPublished(articleId, result.vintedUrl);

      console.log(`✓ Job ${jobId} completed successfully`);
    } else {
      throw new Error(result.error || 'Unknown publication error');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Job ${jobId} failed:`, errorMessage);

    try {
      await updateJobStatus(jobId, 'failed', undefined, errorMessage);
    } catch (updateError) {
      console.error('⚠ Failed to update job status:', updateError);
    }
  }

  console.log(`---------------------------------\n`);
}
