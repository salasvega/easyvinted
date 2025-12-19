/*
  # Add vinted_url column to articles table

  1. Changes
    - Add `vinted_url` column to `articles` table
    - This will store the Vinted item URL after successful publication
    - Add index for performance when querying by vinted_url

  2. Notes
    - Column is nullable as not all articles will be published to Vinted
    - Index helps with lookups and reporting
*/

-- Add vinted_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'vinted_url'
  ) THEN
    ALTER TABLE articles ADD COLUMN vinted_url TEXT;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_vinted_url ON articles(vinted_url) WHERE vinted_url IS NOT NULL;
