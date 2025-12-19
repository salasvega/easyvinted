/*
  # Add scheduled_for and sold fields to articles

  1. Changes
    - Add `scheduled_for` column (timestamptz) to articles table for scheduling publications
    - Add `sold_at` column (timestamptz) to articles table to track when items were sold
    - Add `sold_price` column (numeric) to articles table to track actual sale price
    - Update status enum to include 'scheduled' and 'sold' states
  
  2. Notes
    - scheduled_for is nullable - only set when user schedules a publication
    - sold_at and sold_price are nullable - only set when article is marked as sold
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE articles ADD COLUMN scheduled_for timestamptz;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'sold_at'
  ) THEN
    ALTER TABLE articles ADD COLUMN sold_at timestamptz;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'sold_price'
  ) THEN
    ALTER TABLE articles ADD COLUMN sold_price numeric(10, 2);
  END IF;
END $$;
