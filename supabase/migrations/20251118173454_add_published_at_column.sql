/*
  # Add published_at column to articles table

  1. Changes
    - Add `published_at` column (timestamptz, nullable) to track when articles are published
  
  2. Notes
    - Uses IF NOT EXISTS to make migration idempotent
    - Column is nullable as not all articles are published
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN published_at timestamptz;
  END IF;
END $$;
