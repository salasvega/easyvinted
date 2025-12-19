#!/usr/bin/env node

/**
 * Script pour vérifier l'état des jobs de publication
 * Usage: node check-jobs.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📊 Publication Jobs Status Report\n');
  console.log('='.repeat(80));
  console.log('');

  // Récupérer tous les jobs récents
  const { data: jobs, error } = await supabase
    .from('publication_jobs')
    .select(`
      id,
      status,
      run_at,
      vinted_url,
      error_message,
      created_at,
      updated_at,
      articles (
        title,
        price,
        photos
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error fetching jobs:', error.message);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    console.log('📭 No publication jobs found');
    console.log('\n💡 Create a test job with: node create-test-job.js');
    process.exit(0);
  }

  // Statistiques
  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    success: jobs.filter((j) => j.status === 'success').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  console.log('📈 Statistics:');
  console.log(`   Pending:  ${stats.pending}`);
  console.log(`   Running:  ${stats.running}`);
  console.log(`   Success:  ${stats.success} ✅`);
  console.log(`   Failed:   ${stats.failed} ❌`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // Afficher les jobs
  console.log('📋 Recent Jobs:\n');

  jobs.forEach((job, index) => {
    const article = job.articles;
    const statusEmoji = {
      pending: '⏳',
      running: '🔄',
      success: '✅',
      failed: '❌',
    }[job.status];

    console.log(`${index + 1}. ${statusEmoji} ${job.status.toUpperCase()}`);
    console.log(`   Job ID: ${job.id}`);

    if (article) {
      console.log(`   Article: "${article.title}" - ${article.price}€`);
      const photosCount = article.photos ? article.photos.length : 0;
      console.log(`   Photos: ${photosCount}`);
    }

    console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
    console.log(`   Scheduled: ${new Date(job.run_at).toLocaleString()}`);

    if (job.status === 'success' && job.vinted_url) {
      console.log(`   Vinted URL: ${job.vinted_url}`);
    }

    if (job.status === 'failed' && job.error_message) {
      console.log(`   Error: ${job.error_message}`);
    }

    console.log('');
  });

  console.log('='.repeat(80));
  console.log('');

  // Afficher les jobs en attente
  const pendingJobs = jobs.filter((j) => j.status === 'pending');

  if (pendingJobs.length > 0) {
    console.log('⏳ Pending jobs ready to process:');
    console.log(`   ${pendingJobs.length} job(s) waiting`);
    console.log('');
    console.log('🚀 Run the worker to process them:');
    console.log('   HEADLESS=false npm run dev');
    console.log('');
  }

  // Afficher les jobs échoués
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  if (failedJobs.length > 0) {
    console.log('❌ Failed jobs require attention:');
    failedJobs.forEach((job) => {
      console.log(`   - ${job.articles?.title || 'Unknown'}`);
      console.log(`     Error: ${job.error_message}`);
    });
    console.log('');
  }

  // Afficher les succès récents
  const recentSuccess = jobs.filter((j) => j.status === 'success').slice(0, 3);

  if (recentSuccess.length > 0) {
    console.log('✅ Recent successful publications:');
    recentSuccess.forEach((job) => {
      console.log(`   - ${job.articles?.title || 'Unknown'}`);
      console.log(`     ${job.vinted_url}`);
    });
    console.log('');
  }
}

main().catch(console.error);
