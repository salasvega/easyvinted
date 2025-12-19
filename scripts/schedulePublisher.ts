import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runScheduledPublisher() {
  try {
    console.log('\n=== Running Scheduled Publisher ===');
    console.log(`Time: ${new Date().toISOString()}\n`);

    const response = await fetch(`${supabaseUrl}/functions/v1/scheduled-publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('✓ Scheduled publisher executed successfully');
    console.log(`  Processed: ${result.processed} articles`);
    console.log(`  Success: ${result.successCount}`);
    console.log(`  Failed: ${result.failureCount}`);

    if (result.results && result.results.length > 0) {
      console.log('\nDetails:');
      result.results.forEach((r: any) => {
        if (r.success) {
          console.log(`  ✓ ${r.articleTitle || r.articleId} - Published`);
        } else {
          console.log(`  ✗ ${r.articleId} - Failed: ${r.error}`);
        }
      });
    }

    console.log('\n=== End of Scheduled Publisher Run ===\n');
  } catch (error) {
    console.error('✗ Error running scheduled publisher:', error);
    process.exit(1);
  }
}

runScheduledPublisher();
