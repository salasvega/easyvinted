/*
  # Create user_settings table

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - unique per user
      - `vinted_email` (text) - Email for Vinted account
      - `vinted_password_encrypted` (text) - Encrypted password for Vinted
      - `max_posts_per_day` (integer) - Maximum number of posts per day
      - `min_delay_minutes` (integer) - Minimum delay between posts in minutes
      - `created_at` (timestamptz) - When settings were first created
      - `updated_at` (timestamptz) - When settings were last updated

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to insert their own settings
    - Add policy for users to update their own settings
  
  3. Notes
    - One settings record per user (enforced by unique constraint on user_id)
    - Default values for automation settings to ensure safe defaults
    - Password will be encrypted at application level before storage
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vinted_email text DEFAULT '',
  vinted_password_encrypted text DEFAULT '',
  max_posts_per_day integer DEFAULT 10,
  min_delay_minutes integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
