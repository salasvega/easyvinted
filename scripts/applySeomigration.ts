import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(process.cwd(), 'add_seo_to_lots_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const cleanSQL = migrationSQL
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    console.log('Applying SEO fields migration to lots table...');
    console.log('SQL to execute:', cleanSQL.substring(0, 200) + '...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: cleanSQL })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response status:', response.status);
      console.error('Response body:', errorText);
      throw new Error(`Migration failed with status ${response.status}: ${errorText}`);
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\nThe following columns have been added to the lots table:');
    console.log('  - seo_keywords (text array)');
    console.log('  - hashtags (text array)');
    console.log('  - search_terms (text array)');
    console.log('  - ai_confidence_score (integer)');

  } catch (error: any) {
    if (error.message.includes('404')) {
      console.error('\n❌ Error: The exec_sql RPC function does not exist.');
      console.error('\nPlease apply this migration manually:');
      console.error('1. Go to your Supabase dashboard');
      console.error('2. Navigate to SQL Editor');
      console.error('3. Copy and paste the contents of add_seo_to_lots_migration.sql');
      console.error('4. Execute the SQL');
    } else {
      console.error('Error applying migration:', error);
    }
    process.exit(1);
  }
}

applyMigration();
