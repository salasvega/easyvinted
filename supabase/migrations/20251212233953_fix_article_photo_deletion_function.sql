/*
  # Fix article photo deletion function

  ## Problem
  The delete_article_photos() function tries to access a cover_photo column that doesn't exist on the articles table.

  ## Changes
  - Update delete_article_photos() function to only handle the photos jsonb array
  - Remove references to non-existent cover_photo column

  ## Notes
  - Only the lots table has a cover_photo column
  - Articles only have photos (jsonb array)
*/

-- Update function to delete article photos from storage (without cover_photo)
CREATE OR REPLACE FUNCTION delete_article_photos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql
AS $$
DECLARE
  photo_url text;
  storage_path text;
  photo_record jsonb;
BEGIN
  -- Delete photos from the photos array (jsonb)
  IF OLD.photos IS NOT NULL AND jsonb_array_length(OLD.photos) > 0 THEN
    FOR photo_record IN SELECT * FROM jsonb_array_elements_text(OLD.photos)
    LOOP
      photo_url := photo_record::text;
      
      -- Extract the storage path after 'article-photos/'
      IF photo_url LIKE '%article-photos/%' THEN
        storage_path := substring(photo_url from 'article-photos/(.+)$');
        
        IF storage_path IS NOT NULL AND storage_path != '' THEN
          BEGIN
            -- Delete from storage.objects table directly
            DELETE FROM storage.objects 
            WHERE bucket_id = 'article-photos' 
            AND name = storage_path;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to delete photo: % (error: %)', storage_path, SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$;
