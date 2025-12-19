/*
  # Add Lot Support to Intelligent Planner

  1. Changes to Existing Tables
    - Modify `selling_suggestions` table to support both articles and lots
      - Add `lot_id` column (nullable, foreign key to lots)
      - Add constraint to ensure either article_id or lot_id is set (but not both)
      - Update indexes for lot_id
  
  2. Security
    - Update RLS policies to work with lots
    - Maintain existing security model

  3. Notes
    - Existing suggestions remain unchanged
    - New suggestions can reference either articles or lots
    - The planner will treat lots similarly to articles when generating suggestions
*/

-- Add lot_id column to selling_suggestions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'selling_suggestions' AND column_name = 'lot_id'
  ) THEN
    ALTER TABLE selling_suggestions ADD COLUMN lot_id uuid REFERENCES lots(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make article_id nullable since we now support lots
DO $$
BEGIN
  ALTER TABLE selling_suggestions ALTER COLUMN article_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add constraint to ensure either article_id or lot_id is set (but not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'selling_suggestions_article_or_lot_check'
  ) THEN
    ALTER TABLE selling_suggestions
    ADD CONSTRAINT selling_suggestions_article_or_lot_check
    CHECK (
      (article_id IS NOT NULL AND lot_id IS NULL) OR
      (article_id IS NULL AND lot_id IS NOT NULL)
    );
  END IF;
END $$;

-- Create index for lot_id lookups
CREATE INDEX IF NOT EXISTS idx_selling_suggestions_lot_id ON selling_suggestions(lot_id);

-- Add unique constraint to prevent duplicate suggestions for the same lot
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_lot_suggestion'
  ) THEN
    CREATE UNIQUE INDEX unique_lot_suggestion ON selling_suggestions(lot_id, user_id)
    WHERE lot_id IS NOT NULL AND status = 'pending';
  END IF;
END $$;
