#!/usr/bin/env node

/**
 * Script pour créer facilement un job de test
 * Usage: node create-test-job.js
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
  console.log('🔍 Fetching available articles...\n');

  // Récupérer les articles disponibles (draft ou ready)
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, price, status, photos, created_at')
    .in('status', ['draft', 'ready'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (articlesError) {
    console.error('❌ Error fetching articles:', articlesError.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log('❌ No articles found with status "draft" or "ready"');
    console.log('\n💡 Create an article first in the EasyVinted app!');
    process.exit(1);
  }

  console.log('📦 Available articles:\n');

  articles.forEach((article, index) => {
    const photosCount = article.photos ? article.photos.length : 0;
    console.log(`${index + 1}. ${article.title}`);
    console.log(`   ID: ${article.id}`);
    console.log(`   Price: ${article.price}€`);
    console.log(`   Status: ${article.status}`);
    console.log(`   Photos: ${photosCount}`);
    console.log(`   Created: ${new Date(article.created_at).toLocaleString()}\n`);
  });

  // Prendre le premier article
  const selectedArticle = articles[0];

  console.log(`\n✨ Creating test job for article: "${selectedArticle.title}"\n`);

  // Créer le job
  const { data: job, error: jobError } = await supabase
    .from('publication_jobs')
    .insert({
      article_id: selectedArticle.id,
      run_at: new Date().toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (jobError) {
    console.error('❌ Error creating job:', jobError.message);
    process.exit(1);
  }

  console.log('✅ Test job created successfully!\n');
  console.log('📋 Job Details:');
  console.log(`   Job ID: ${job.id}`);
  console.log(`   Article ID: ${job.article_id}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Run at: ${new Date(job.run_at).toLocaleString()}\n`);

  console.log('🚀 Next steps:');
  console.log('   1. Run the worker in visible mode:');
  console.log('      HEADLESS=false npm run dev\n');
  console.log('   2. Watch the browser window and terminal logs\n');
  console.log('   3. Check the results in Supabase after completion\n');
}

main().catch(console.error);
