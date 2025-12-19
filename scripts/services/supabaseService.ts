import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ArticleToPublish } from '../types/vinted.js';
import { config } from 'dotenv';

config();

export class SupabaseService {
  private client: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and key are required');
    }

    this.client = createClient(url, key);
  }

  async getArticlesToPublish(): Promise<ArticleToPublish[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('articles')
      .select('*')
      .in('status', ['ready', 'scheduled'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order('scheduled_for', { ascending: true, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }

    return data as ArticleToPublish[];
  }

  async markArticleAsPublished(
    articleId: string,
    vintedUrl: string
  ): Promise<void> {
    const { error } = await this.client
      .from('articles')
      .update({
        status: 'published',
        vinted_url: vintedUrl,
        published_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) {
      throw new Error(`Failed to update article: ${error.message}`);
    }
  }

  async markArticleAsFailed(
    articleId: string,
    errorMessage: string
  ): Promise<void> {
    const { error } = await this.client
      .from('articles')
      .update({
        status: 'draft',
        error_message: errorMessage,
      })
      .eq('id', articleId);

    if (error) {
      console.error(`Failed to mark article as failed: ${error.message}`);
    }
  }

  async logPublicationAttempt(
    articleId: string,
    success: boolean,
    details: string
  ): Promise<void> {
    const { error } = await this.client.from('publication_logs').insert({
      article_id: articleId,
      success,
      details,
      attempted_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to log publication attempt: ${error.message}`);
    }
  }

  async getArticleById(articleId: string): Promise<any> {
    const { data, error } = await this.client
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch article: ${error.message}`);
    }

    return data;
  }

  async getUserSettings(userId: string): Promise<any> {
    const { data, error } = await this.client
      .from('user_settings')
      .select('vinted_email, vinted_password_encrypted')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }

    return data;
  }
}
