/*
  # Add season and suggested_period fields to articles table

  1. Changes
    - Add `season` column to articles table
    - Add `suggested_period` column to articles table

  2. Notes
    - season: stores the season for the article (spring, summer, autumn, winter, all-seasons, undefined)
    - suggested_period: stores the suggested selling period (e.g., "Avril - Juin")
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'season'
  ) THEN
    ALTER TABLE articles ADD COLUMN season text DEFAULT 'undefined';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'suggested_period'
  ) THEN
    ALTER TABLE articles ADD COLUMN suggested_period text DEFAULT '';
  END IF;
END $$;
