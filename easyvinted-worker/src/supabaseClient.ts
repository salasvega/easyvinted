import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article, PublicationJob } from './types.js';

let supabaseInstance: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✓ Supabase client initialized');
  }

  return supabaseInstance;
}

export async function getPendingJobs(): Promise<PublicationJob[]> {
  const supabase = initSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('publication_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', now)
    .order('run_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pending jobs: ${error.message}`);
  }

  return data as PublicationJob[];
}

export async function updateJobStatus(
  jobId: string,
  status: 'running' | 'success' | 'failed',
  vintedUrl?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = initSupabase();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (vintedUrl) {
    updateData.vinted_url = vintedUrl;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('publication_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  console.log(`✓ Job ${jobId} updated to status: ${status}`);
}

export async function getArticleById(articleId: string): Promise<Article | null> {
  const supabase = initSupabase();

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch article: ${error.message}`);
  }

  return data as Article | null;
}

export async function markArticleAsPublished(
  articleId: string,
  vintedUrl: string
): Promise<void> {
  const supabase = initSupabase();

  const { error } = await supabase
    .from('articles')
    .update({
      status: 'published',
      vinted_url: vintedUrl,
      published_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (error) {
    throw new Error(`Failed to mark article as published: ${error.message}`);
  }

  console.log(`✓ Article ${articleId} marked as published`);
}
