/*
  # Add SEO & Marketing fields to lots table

  1. Changes
    - Add `seo_keywords` (text array) - SEO keywords for better search visibility
    - Add `hashtags` (text array) - Trending hashtags for social media
    - Add `search_terms` (text array) - Common search terms buyers use
    - Add `ai_confidence_score` (integer) - AI analysis confidence score (0-100)

  2. Notes
    - These fields help optimize lot visibility on Vinted
    - AI analysis can populate these fields automatically
    - All fields are optional and default to empty arrays or null
    - Execute this migration manually in your Supabase dashboard
*/

-- Add SEO & Marketing columns to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'seo_keywords'
  ) THEN
    ALTER TABLE lots ADD COLUMN seo_keywords text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE lots ADD COLUMN hashtags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'search_terms'
  ) THEN
    ALTER TABLE lots ADD COLUMN search_terms text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'ai_confidence_score'
  ) THEN
    ALTER TABLE lots ADD COLUMN ai_confidence_score integer;
  END IF;
END $$;
