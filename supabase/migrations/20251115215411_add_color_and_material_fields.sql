/*
  # Add Color and Material Fields to Articles

  1. Changes
    - Add `color` column to articles table (text)
    - Add `material` column to articles table (text)
  
  2. Notes
    - These fields are optional and allow users to specify the color and material of their items
    - Values will be validated on the client side using predefined lists
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'color'
  ) THEN
    ALTER TABLE articles ADD COLUMN color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'material'
  ) THEN
    ALTER TABLE articles ADD COLUMN material text;
  END IF;
END $$;
