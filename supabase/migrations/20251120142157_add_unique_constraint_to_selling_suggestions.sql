/*
  # Add unique constraint to selling_suggestions

  1. Changes
    - Add unique constraint on (article_id, status) to prevent duplicate pending suggestions
    - This ensures each article can only have one pending suggestion at a time
  
  2. Security
    - No changes to RLS policies
*/

-- Add unique constraint to prevent duplicate suggestions for the same article with the same status
CREATE UNIQUE INDEX IF NOT EXISTS unique_article_pending_suggestion 
ON selling_suggestions (article_id, status) 
WHERE status = 'pending';
