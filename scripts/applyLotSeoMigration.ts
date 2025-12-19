import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration() {
  try {
    console.log('📖 Lecture du fichier de migration...');
    const migrationPath = join(process.cwd(), 'supabase/migrations/20251217120000_add_seo_fields_to_lots.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const cleanSQL = migrationSQL
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    console.log('🔧 Application de la migration SEO à la table lots...');

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
      console.error('❌ Statut de la réponse:', response.status);
      console.error('❌ Corps de la réponse:', errorText);
      throw new Error(`Migration échouée avec le statut ${response.status}: ${errorText}`);
    }

    console.log('\n✅ Migration appliquée avec succès!');
    console.log('\nLes colonnes suivantes ont été ajoutées à la table lots:');
    console.log('  - seo_keywords (text array)');
    console.log('  - hashtags (text array)');
    console.log('  - search_terms (text array)');
    console.log('  - ai_confidence_score (integer)');

  } catch (error: any) {
    if (error.message.includes('404')) {
      console.error('\n❌ Erreur: La fonction RPC exec_sql n\'existe pas.');
      console.error('\nVeuillez appliquer cette migration manuellement:');
      console.error('1. Allez dans votre dashboard Supabase');
      console.error('2. Naviguez vers SQL Editor');
      console.error('3. Copiez et collez le contenu de supabase/migrations/20251217120000_add_seo_fields_to_lots.sql');
      console.error('4. Exécutez le SQL');
    } else {
      console.error('❌ Erreur lors de l\'application de la migration:', error);
    }
    process.exit(1);
  }
}

applyMigration();
