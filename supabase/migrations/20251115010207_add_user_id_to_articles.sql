/*
  # Add User Authentication to Articles

  1. Schema Changes
    - Add `user_id` column to `articles` table
    - Set up foreign key relationship to `auth.users`
    - Add default value for existing records (temporary)

  2. Security Updates
    - Drop existing public policies
    - Add RLS policies for authenticated users
    - Users can only view, create, update, and delete their own articles

  3. Notes
    - Existing articles will be assigned a NULL user_id initially
    - Users can only access their own articles after this migration
*/

-- Add user_id column to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view all articles" ON articles;
DROP POLICY IF EXISTS "Public can insert articles" ON articles;
DROP POLICY IF EXISTS "Public can update articles" ON articles;
DROP POLICY IF EXISTS "Public can delete articles" ON articles;
DROP POLICY IF EXISTS "Users can view own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert own articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage their own articles
CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
