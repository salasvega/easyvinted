/*
  # Improve Storage RLS Policies with User ID Path Verification

  1. Changes
    - Update RLS policies to verify that user_id is in the file path
    - Enforce folder structure: {user_id}/{article_id}/{filename}
    - Users can only upload/update/delete photos in their own folders
    - Public read access remains unchanged

  2. Security Improvements
    - Users cannot access or modify photos in other users' folders
    - Path-based authorization ensures isolation between users
    - Prevents accidental or malicious cross-user data access

  3. Important Notes
    - File paths MUST follow the pattern: user_id/article_id/filename.jpg
    - The user_id in the path must match the authenticated user's ID
    - This enables better organization and cleanup when deleting articles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Allow authenticated users to upload only to their own folder
CREATE POLICY "Users can upload photos to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update only their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'article-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete only their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
