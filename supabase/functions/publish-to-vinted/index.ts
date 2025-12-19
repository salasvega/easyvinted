import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PublishRequest {
  articleId: string;
}

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { articleId } = await req.json() as PublishRequest;

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found or access denied' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('vinted_email, vinted_password_encrypted')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError || !userSettings || !userSettings.vinted_email || !userSettings.vinted_password_encrypted) {
      return new Response(
        JSON.stringify({
          error: 'Vinted credentials not configured. Please configure your Vinted credentials in Settings.'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
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

    console.log('Publishing article:', article.title);
    console.log('Using credentials for:', userSettings.vinted_email);

    const publishResult = {
      success: true,
      message: 'Article ready for publication. Use the terminal command to publish to Vinted.',
      articleId: article.id,
      status: 'ready',
      vintedUrl: null,
    };

    return new Response(
      JSON.stringify(publishResult),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error publishing to Vinted:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Please ensure your Vinted credentials are correctly configured in Settings.'
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
