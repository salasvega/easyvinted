/*
  # Add size fields to family_members table

  1. Changes
    - Add `clothing_size` column to `family_members` table (text)
    - Add `shoe_size` column to `family_members` table (text)
  
  2. Notes
    - These fields allow each family member to have their own clothing and shoe sizes
    - Fields are optional (nullable) to maintain backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'clothing_size'
  ) THEN
    ALTER TABLE family_members ADD COLUMN clothing_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'shoe_size'
  ) THEN
    ALTER TABLE family_members ADD COLUMN shoe_size text;
  END IF;
END $$;
