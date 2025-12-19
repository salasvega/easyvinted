/*
  # Add automatic photo deletion when articles are deleted

  1. Changes
    - Creates a trigger function that automatically deletes photos from storage when an article is deleted
    - The function extracts photo URLs from the deleted article and removes them from the 'article-photos' bucket
    - Adds a trigger on the articles table that fires before deletion

  2. Security
    - Function runs with security definer privileges to access storage
    - Only deletes photos that belong to the deleted article
*/

-- Create function to delete photos from storage when article is deleted
CREATE OR REPLACE FUNCTION delete_article_photos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  photo_url text;
  storage_path text;
BEGIN
  -- Loop through each photo URL in the deleted article
  IF OLD.photos IS NOT NULL THEN
    FOREACH photo_url IN ARRAY OLD.photos
    LOOP
      -- Extract the storage path from the full URL
      -- URL format: https://[project].supabase.co/storage/v1/object/public/article-photos/[path]
      storage_path := substring(photo_url from 'article-photos/(.*)$');
      
      -- Delete the file from storage if path was found
      IF storage_path IS NOT NULL THEN
        -- Remove the 'article-photos/' prefix to get just the file path
        storage_path := substring(storage_path from 'article-photos/(.*)$');
        IF storage_path IS NULL OR storage_path = '' THEN
          storage_path := substring(photo_url from 'article-photos/(.*)$');
        END IF;
        
        PERFORM storage.delete_object('article-photos', storage_path);
      END IF;
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger to automatically delete photos when article is deleted
DROP TRIGGER IF EXISTS trigger_delete_article_photos ON articles;

CREATE TRIGGER trigger_delete_article_photos
  BEFORE DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION delete_article_photos();
