import { config } from 'dotenv';
import { VintedAutomation } from './services/vintedAutomation.js';
import { SupabaseService } from './services/supabaseService.js';
import { ArticleToPublish } from './types/vinted.js';

config();

const articleId = process.argv[2];

if (!articleId) {
  console.error('Usage: npm run vinted:publish:single <article-id>');
  process.exit(1);
}

async function publishSingleArticle(articleId: string) {
  let automation: VintedAutomation | null = null;

  try {
    console.log(`\n📦 Publishing article ${articleId} to Vinted...`);

    const supabaseService = new SupabaseService();

    const article = await supabaseService.getArticleById(articleId);

    if (!article) {
      console.error(`✗ Article ${articleId} not found`);
      process.exit(1);
    }

    const userSettings = await supabaseService.getUserSettings(article.user_id);

    if (!userSettings || !userSettings.vinted_email || !userSettings.vinted_password_encrypted) {
      console.error('✗ Vinted credentials not configured for this user');
      process.exit(1);
    }

    console.log(`📝 Article: ${article.title}`);
    console.log(`👤 User: ${userSettings.vinted_email}`);
    console.log(`📷 Photos (${article.photos?.length || 0}):`, JSON.stringify(article.photos, null, 2));

    automation = new VintedAutomation();
    await automation.initialize();

    const isAuthenticated = await automation.checkAuthentication();

    if (!isAuthenticated) {
      console.log('\n🔐 Not authenticated. Logging in with credentials...');

      try {
        await automation.loginWithCredentials(
          userSettings.vinted_email,
          userSettings.vinted_password
        );
        await automation.saveSession();
        console.log('✓ Session saved');
      } catch (error) {
        throw new Error(`Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const articleToPublish: ArticleToPublish = {
      id: article.id,
      title: article.title,
      description: article.description || '',
      brand: article.brand || '',
      size: article.size || '',
      condition: article.condition,
      price: parseFloat(article.price),
      photos: article.photos || [],
      color: article.color || undefined,
      material: article.material || undefined,
    };

    const result = await automation.publishArticle(articleToPublish);

    if (result.success && result.vintedUrl) {
      await supabaseService.markArticleAsPublished(article.id, result.vintedUrl);
      console.log(`\n✅ Article published successfully!`);
      console.log(`🔗 Vinted URL: ${result.vintedUrl}`);
    } else {
      console.error(`\n✗ Failed to publish article: ${result.error}`);
      process.exit(1);
    }

    await automation.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error);
    if (automation) {
      await automation.close();
    }
    process.exit(1);
  }
}

publishSingleArticle(articleId);
