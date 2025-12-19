/*
  # Update articles table with category fields

  1. Changes
    - Drop old `category` column
    - Add `main_category` (text) - Main category like "Femmes", "Hommes", etc.
    - Add `subcategory` (text) - Subcategory like "Vêtements", "Chaussures", etc.
    - Add `item_category` (text, optional) - Specific item type like "Robes", "T-shirts", etc.

  2. Notes
    - Existing data in `category` column will be lost during migration
    - New fields allow hierarchical category selection matching Vinted structure
    - `item_category` is optional as some subcategories don't have items
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'category'
  ) THEN
    ALTER TABLE articles DROP COLUMN category;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'main_category'
  ) THEN
    ALTER TABLE articles ADD COLUMN main_category text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE articles ADD COLUMN subcategory text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'item_category'
  ) THEN
    ALTER TABLE articles ADD COLUMN item_category text DEFAULT '';
  END IF;
END $$;
