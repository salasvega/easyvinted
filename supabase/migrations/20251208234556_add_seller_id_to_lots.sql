/*
  # Add seller_id to lots table

  1. Changes
    - Add `seller_id` column to `lots` table
    - Create foreign key constraint to `family_members` table
    - Allow null values (optional seller assignment)

  2. Security
    - No RLS changes needed
    - Existing policies already handle user_id verification
*/

-- Add seller_id column to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE lots ADD COLUMN seller_id uuid REFERENCES family_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lots_seller_id ON lots(seller_id);
