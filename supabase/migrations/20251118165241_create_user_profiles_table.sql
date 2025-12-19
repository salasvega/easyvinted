/*
  # Create user profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - references auth.users
      - `name` (text) - user's full name
      - `phone_number` (text) - user's phone number
      - `clothing_size` (text) - user's clothing size (XS, S, M, L, XL, XXL, etc.)
      - `shoe_size` (text) - user's shoe size
      - `dressing_name` (text) - name of user's dressing/store
      - `created_at` (timestamptz) - when profile was created
      - `updated_at` (timestamptz) - when profile was last updated

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for authenticated users to read their own profile
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to update their own profile
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  phone_number text DEFAULT '',
  clothing_size text DEFAULT '',
  shoe_size text DEFAULT '',
  dressing_name text DEFAULT 'Mon Dressing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
