/*
  # Add top_size and bottom_size to family_members table

  1. Changes
    - Add `top_size` column to `family_members` table (text)
    - Add `bottom_size` column to `family_members` table (text)

  2. Notes
    - These fields match the user_profiles structure
    - They allow separate sizing for tops and bottoms instead of a single clothing_size
    - Fields are optional (nullable) to maintain backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'top_size'
  ) THEN
    ALTER TABLE family_members ADD COLUMN top_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'bottom_size'
  ) THEN
    ALTER TABLE family_members ADD COLUMN bottom_size text;
  END IF;
END $$;
