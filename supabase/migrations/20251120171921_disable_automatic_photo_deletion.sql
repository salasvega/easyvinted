/*
  # Disable automatic photo deletion trigger

  1. Changes
    - Drops the trigger that was causing 400 errors during article deletion
    - Keeps the function for potential future use
    - Photo deletion will be handled from the frontend instead

  2. Reason
    - The SECURITY DEFINER function doesn't have proper permissions to access storage
    - Frontend already has the user's authentication context to delete photos
*/

-- Drop the trigger (keep the function for now)
DROP TRIGGER IF EXISTS trigger_delete_article_photos ON articles;
