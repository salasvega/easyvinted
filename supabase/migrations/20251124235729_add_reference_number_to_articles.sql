/*
  # Add Reference Number to Articles

  1. Changes
    - Add `reference_number` column to `articles` table
      - Type: text
      - Unique constraint to ensure no duplicates
      - Can be null initially for existing articles
    - Add index on reference_number for quick lookups
  
  2. Purpose
    - Enable automatic label generation for each article
    - Provide unique identifier for package identification
    - Facilitate quick article lookup by reference number
*/

-- Add reference_number column to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE articles ADD COLUMN reference_number text;
  END IF;
END $$;

-- Add unique constraint on reference_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'articles_reference_number_key'
  ) THEN
    ALTER TABLE articles ADD CONSTRAINT articles_reference_number_key UNIQUE (reference_number);
  END IF;
END $$;

-- Add index on reference_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_reference_number ON articles(reference_number);
