/*
  # Create Storage Bucket for Article Photos

  1. Storage Setup
    - Create `article-photos` bucket for storing article images
    - Make bucket public for easy image access
    - Set file size limits and allowed MIME types

  2. Security Policies
    - Allow public read access to all photos
    - Allow public upload access (anyone can upload)
    - Allow public update access (anyone can replace photos)
    - Allow public delete access (anyone can remove photos)

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
DROP POLICY IF EXISTS "Public upload access for article photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for article photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for article photos" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public read access for article photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-photos');

-- Allow public insert access
CREATE POLICY "Public upload access for article photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-photos');

-- Allow public update access
CREATE POLICY "Public update access for article photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-photos')
WITH CHECK (bucket_id = 'article-photos');

-- Allow public delete access
CREATE POLICY "Public delete access for article photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-photos');
