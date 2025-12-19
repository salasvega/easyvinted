/*
  # Fix: Disable photo deletion triggers with correct names
  
  The previous migration used incorrect trigger names. This migration uses
  the actual trigger names found in the database.
  
  ## Changes
  - Drop trigger_delete_article_photos on articles table
  - Drop trigger_delete_lot_photos on lots table
*/

-- Disable trigger on articles (using correct name)
DROP TRIGGER IF EXISTS trigger_delete_article_photos ON articles;

-- Disable trigger on lots (using correct name)
DROP TRIGGER IF EXISTS trigger_delete_lot_photos ON lots;
