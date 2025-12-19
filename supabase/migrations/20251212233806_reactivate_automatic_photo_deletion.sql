/*
  # Réactivation de la suppression automatique des photos

  ## Problème résolu
  Les photos dans le bucket 'article-photos' ne sont pas supprimées automatiquement
  lors de la suppression d'articles ou de lots, créant des fichiers orphelins.

  ## Modifications

  1. **Fonction améliorée de suppression de photos**
     - Accorde les permissions nécessaires pour accéder au storage
     - Gère les photos des articles (jsonb array + cover_photo)
     - Ajoute une meilleure gestion des erreurs

  2. **Fonction pour supprimer les photos des lots**
     - Gère les photos des lots (text[] array + cover_photo)
     - Supprime les fichiers du storage lors de la suppression du lot

  3. **Triggers automatiques**
     - Réactive le trigger pour les articles
     - Active le trigger pour les lots

  ## Sécurité
  - Utilise SECURITY DEFINER avec les permissions appropriées
  - Vérifie que les chemins sont valides avant suppression
  - Ne bloque pas la suppression si la suppression de photo échoue
*/

-- Grant necessary permissions to the postgres role for storage operations
-- This allows SECURITY DEFINER functions to access storage
DO $$
BEGIN
  -- Grant permission to delete from storage.objects if not already granted
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee = 'postgres'
    AND table_name = 'objects'
    AND table_schema = 'storage'
    AND privilege_type = 'DELETE'
  ) THEN
    GRANT DELETE ON storage.objects TO postgres;
  END IF;
END $$;

-- Improved function to delete article photos from storage
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
  
  -- Delete cover_photo if it exists
  IF OLD.cover_photo IS NOT NULL AND OLD.cover_photo != '' THEN
    IF OLD.cover_photo LIKE '%article-photos/%' THEN
      storage_path := substring(OLD.cover_photo from 'article-photos/(.+)$');
      
      IF storage_path IS NOT NULL AND storage_path != '' THEN
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'article-photos' 
          AND name = storage_path;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to delete cover photo: % (error: %)', storage_path, SQLERRM;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Function to delete lot photos from storage
CREATE OR REPLACE FUNCTION delete_lot_photos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql
AS $$
DECLARE
  photo_url text;
  storage_path text;
BEGIN
  -- Delete photos from the photos array (text[])
  IF OLD.photos IS NOT NULL AND array_length(OLD.photos, 1) > 0 THEN
    FOREACH photo_url IN ARRAY OLD.photos
    LOOP
      -- Extract the storage path after 'article-photos/'
      IF photo_url LIKE '%article-photos/%' THEN
        storage_path := substring(photo_url from 'article-photos/(.+)$');
        
        IF storage_path IS NOT NULL AND storage_path != '' THEN
          BEGIN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'article-photos' 
            AND name = storage_path;
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to delete lot photo: % (error: %)', storage_path, SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Delete cover_photo if it exists
  IF OLD.cover_photo IS NOT NULL AND OLD.cover_photo != '' THEN
    IF OLD.cover_photo LIKE '%article-photos/%' THEN
      storage_path := substring(OLD.cover_photo from 'article-photos/(.+)$');
      
      IF storage_path IS NOT NULL AND storage_path != '' THEN
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'article-photos' 
          AND name = storage_path;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to delete lot cover photo: % (error: %)', storage_path, SQLERRM;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Reactivate trigger for articles
DROP TRIGGER IF EXISTS trigger_delete_article_photos ON articles;
CREATE TRIGGER trigger_delete_article_photos
  BEFORE DELETE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION delete_article_photos();

-- Create trigger for lots
DROP TRIGGER IF EXISTS trigger_delete_lot_photos ON lots;
CREATE TRIGGER trigger_delete_lot_photos
  BEFORE DELETE ON lots
  FOR EACH ROW
  EXECUTE FUNCTION delete_lot_photos();
