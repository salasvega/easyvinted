import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { publishArticles } from './publishArticles.js';

dotenv.config();

async function autoPublish(): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  console.log('🔍 Vérification des articles à publier...\n');

  const { data: readyArticles, error } = await supabase
    .from('articles')
    .select('id, title, status')
    .eq('status', 'ready');

  if (error) {
    console.error('❌ Erreur lors de la récupération des articles:', error);
    process.exit(1);
  }

  if (!readyArticles || readyArticles.length === 0) {
    console.log('✅ Aucun article à publier pour le moment.\n');
    return;
  }

  console.log(`📦 ${readyArticles.length} article(s) trouvé(s):\n`);
  readyArticles.forEach(article => {
    console.log(`  • ${article.title}`);
  });
  console.log('');

  const sessionPath = './vinted-session.json';
  const fs = await import('fs');

  if (!fs.existsSync(sessionPath)) {
    console.error('❌ Session Vinted non trouvée !');
    console.log('\n💡 Lancez d\'abord: npm run vinted:setup\n');
    process.exit(1);
  }

  console.log('🚀 Démarrage de la publication automatique...\n');

  try {
    await publishArticles();
    console.log('\n✅ Publication automatique terminée avec succès !\n');
  } catch (error) {
    console.error('\n❌ Erreur lors de la publication:', error);
    process.exit(1);
  }
}

autoPublish();
