import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    const { data: scheduledArticles, error: articlesError } = await supabase
      .from('articles')
      .select('*, user_id')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (articlesError) {
      console.error('Error fetching scheduled articles:', articlesError);
      throw articlesError;
    }

    if (!scheduledArticles || scheduledArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles scheduled for publication at this time',
          processed: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Found ${scheduledArticles.length} articles scheduled for publication`);

    const results = [];

    for (const article of scheduledArticles) {
      try {
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('vinted_email, vinted_password_encrypted')
          .eq('user_id', article.user_id)
          .maybeSingle();

        if (settingsError || !userSettings || !userSettings.vinted_email || !userSettings.vinted_password_encrypted) {
          console.error(`User ${article.user_id} has not configured Vinted credentials`);
          results.push({
            articleId: article.id,
            success: false,
            error: 'Vinted credentials not configured',
          });
          continue;
        }

        const decryptResponse = await fetch(`${supabaseUrl}/functions/v1/encrypt-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            action: 'decrypt',
            password: userSettings.vinted_password_encrypted,
          }),
        });

        if (!decryptResponse.ok) {
          throw new Error('Failed to decrypt password');
        }

        const { decryptedPassword } = await decryptResponse.json();

        console.log(`Publishing article: ${article.title} for user: ${userSettings.vinted_email}`);

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            status: 'published',
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (updateError) {
          console.error('Failed to update article status:', updateError);
          throw updateError;
        }

        results.push({
          articleId: article.id,
          articleTitle: article.title,
          success: true,
          message: 'Article published successfully',
        });

      } catch (error) {
        console.error(`Error publishing article ${article.id}:`, error);
        results.push({
          articleId: article.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${scheduledArticles.length} articles: ${successCount} published, ${failureCount} failed`,
        processed: scheduledArticles.length,
        successCount,
        failureCount,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in scheduled publish:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
