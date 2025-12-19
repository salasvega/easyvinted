/*
  # Fix delete article photos function

  1. Changes
    - Updates the delete_article_photos function to properly handle jsonb array type
    - Converts jsonb array to text array before iterating
    - Adds better error handling

  2. Notes
    - The photos column is jsonb, not a native PostgreSQL array
    - Must use jsonb functions to extract and iterate over values
*/

-- Drop and recreate the function with proper jsonb handling
CREATE OR REPLACE FUNCTION delete_article_photos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  photo_url text;
  storage_path text;
  photo_record jsonb;
BEGIN
  -- Check if photos exist and is not null
  IF OLD.photos IS NOT NULL AND jsonb_array_length(OLD.photos) > 0 THEN
    -- Loop through each photo URL in the jsonb array
    FOR photo_record IN SELECT * FROM jsonb_array_elements_text(OLD.photos)
    LOOP
      photo_url := photo_record::text;
      
      -- Extract the storage path from the full URL
      -- URL format: https://[project].supabase.co/storage/v1/object/public/article-photos/[user_id]/[filename]
      -- We need to extract everything after 'article-photos/'
      IF photo_url LIKE '%article-photos/%' THEN
        -- Get everything after 'article-photos/'
        storage_path := substring(photo_url from 'article-photos/(.+)$');
        
        -- Delete the file from storage
        IF storage_path IS NOT NULL AND storage_path != '' THEN
          BEGIN
            PERFORM storage.delete_object('article-photos', storage_path);
          EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the delete operation
            RAISE WARNING 'Failed to delete photo from storage: %', storage_path;
          END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$;
