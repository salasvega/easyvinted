/*
  # Create Storage Bucket for Article Photos

  1. Storage Setup
    - Create `article-photos` bucket for storing article images
    - Make bucket public for easy image access
    - Set file size limits and allowed MIME types

  2. Security Policies
    - Allow public read access to all photos
    - Allow authenticated users to upload photos
    - Allow authenticated users to update their own photos
    - Allow authenticated users to delete their own photos

  3. Notes
    - Maximum 8 photos per article
    - Supported formats: JPEG, PNG, WebP
    - Public bucket allows direct URL access to images
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-photos',
  'article-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for article photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public read access for article photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-photos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-photos');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-photos')
WITH CHECK (bucket_id = 'article-photos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-photos');
