/*
  # Disable automatic photo deletion trigger temporarily
  
  The trigger is causing 400 errors when deleting articles because it tries to access
  storage.objects directly, which requires special permissions. We'll handle photo
  deletion in the application code instead.
  
  ## Changes
  - Drop the trigger on articles table
  - Drop the trigger on lots table
  - Keep the functions for potential future use
*/

-- Disable trigger on articles
DROP TRIGGER IF EXISTS delete_article_photos_trigger ON articles;

-- Disable trigger on lots
DROP TRIGGER IF EXISTS delete_lot_photos_trigger ON lots;
