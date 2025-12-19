import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSeoColumns() {
  console.log('🔍 Vérification des colonnes SEO dans la base de données...\n');

  try {
    // Vérifier les colonnes dans la table articles
    console.log('📋 Table ARTICLES:');
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('seo_keywords, hashtags, search_terms, ai_confidence_score')
      .limit(1);

    if (articlesError) {
      if (articlesError.message.includes('column') && articlesError.message.includes('does not exist')) {
        console.log('  ❌ Colonnes SEO manquantes dans la table articles');
        console.log('  → La migration 20251213215832_add_seo_fields_to_articles.sql n\'a pas été appliquée\n');
      } else {
        console.log('  ⚠️ Erreur:', articlesError.message, '\n');
      }
    } else {
      console.log('  ✅ Toutes les colonnes SEO sont présentes');
      console.log('     - seo_keywords');
      console.log('     - hashtags');
      console.log('     - search_terms');
      console.log('     - ai_confidence_score\n');
    }

    // Vérifier les colonnes dans la table lots
    console.log('📦 Table LOTS:');
    const { data: lotsData, error: lotsError } = await supabase
      .from('lots')
      .select('seo_keywords, hashtags, search_terms, ai_confidence_score')
      .limit(1);

    if (lotsError) {
      if (lotsError.message.includes('column') && lotsError.message.includes('does not exist')) {
        console.log('  ❌ Colonnes SEO manquantes dans la table lots');
        console.log('  → La migration add_seo_to_lots_migration.sql n\'a PAS été appliquée');
        console.log('\n📝 ACTIONS REQUISES:');
        console.log('1. Allez sur votre dashboard Supabase : https://app.supabase.com');
        console.log('2. Sélectionnez votre projet');
        console.log('3. Cliquez sur "SQL Editor"');
        console.log('4. Copiez et exécutez le contenu du fichier: add_seo_to_lots_migration.sql');
        console.log('\nOu utilisez la commande:');
        console.log('npm run seo:apply\n');
      } else {
        console.log('  ⚠️ Erreur:', lotsError.message, '\n');
      }
    } else {
      console.log('  ✅ Toutes les colonnes SEO sont présentes');
      console.log('     - seo_keywords');
      console.log('     - hashtags');
      console.log('     - search_terms');
      console.log('     - ai_confidence_score\n');
    }

    // Résumé
    const articlesOk = !articlesError;
    const lotsOk = !lotsError;

    console.log('📊 RÉSUMÉ:');
    if (articlesOk && lotsOk) {
      console.log('  ✅ Configuration complète - tous les champs SEO sont disponibles');
      console.log('  ✅ Les formulaires peuvent maintenant sauvegarder les données SEO');
    } else {
      console.log('  ⚠️ Configuration incomplète:');
      if (!articlesOk) console.log('     - Table articles: colonnes manquantes');
      if (!lotsOk) console.log('     - Table lots: colonnes manquantes');
      console.log('\n  📖 Consultez le fichier APPLIQUER_MIGRATION_SEO.md pour les instructions détaillées');
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

checkSeoColumns();
