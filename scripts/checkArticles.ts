import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkArticles(): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, status, scheduled_for, photos')
    .in('status', ['ready', 'scheduled']);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`\n📋 Articles prêts à publier: ${data?.length || 0}\n`);

  if (data && data.length > 0) {
    data.forEach(article => {
      console.log(`  ✓ ${article.title}`);
      console.log(`    - Statut: ${article.status}`);
      console.log(`    - Photos: ${article.photos?.length || 0}`);
      if (article.scheduled_for) {
        console.log(`    - Programmé pour: ${article.scheduled_for}`);
      }
      console.log('');
    });
  } else {
    console.log('⚠️  Aucun article prêt à publier.');
    console.log('\nPour tester, créez un article avec:');
    console.log('  - Statut: "ready" ou "scheduled"');
    console.log('  - Tous les champs requis remplis');
    console.log('  - Au moins une photo\n');
  }
}

checkArticles();
