/*
  # Create publication_jobs table

  1. New Tables
    - `publication_jobs`
      - `id` (uuid, primary key)
      - `article_id` (uuid, foreign key to articles)
      - `status` (text: 'pending' | 'running' | 'success' | 'failed')
      - `run_at` (timestamptz) - When the job should be executed
      - `vinted_url` (text, nullable) - The resulting Vinted URL after publication
      - `error_message` (text, nullable) - Error message if job failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `publication_jobs` table
    - Add policies for authenticated users to manage their own jobs
*/

CREATE TABLE IF NOT EXISTS publication_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  run_at timestamptz NOT NULL DEFAULT now(),
  vinted_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publication_jobs_article_id ON publication_jobs(article_id);
CREATE INDEX IF NOT EXISTS idx_publication_jobs_status ON publication_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publication_jobs_run_at ON publication_jobs(run_at);

ALTER TABLE publication_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publication jobs"
  ON publication_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = publication_jobs.article_id
      AND articles.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create publication jobs for their articles"
  ON publication_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = publication_jobs.article_id
      AND articles.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own publication jobs"
  ON publication_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = publication_jobs.article_id
      AND articles.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = publication_jobs.article_id
      AND articles.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own publication jobs"
  ON publication_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = publication_jobs.article_id
      AND articles.user_id = (select auth.uid())
    )
  );
