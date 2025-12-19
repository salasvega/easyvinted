/*
  # Add Reference Number to Lots

  1. Changes
    - Add `reference_number` column to `lots` table
      - Type: text
      - Unique constraint to ensure no duplicates
      - Can be null initially for existing lots
    - Add index on reference_number for quick lookups
  
  2. Purpose
    - Enable automatic label generation for each lot
    - Provide unique identifier for package identification with "LOT_" prefix
    - Facilitate quick lot lookup by reference number
    - Follow same structure as articles but with LOT_ prefix
*/

-- Add reference_number column to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE lots ADD COLUMN reference_number text;
  END IF;
END $$;

-- Add unique constraint on reference_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lots_reference_number_key'
  ) THEN
    ALTER TABLE lots ADD CONSTRAINT lots_reference_number_key UNIQUE (reference_number);
  END IF;
END $$;

-- Add index on reference_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_lots_reference_number ON lots(reference_number);
