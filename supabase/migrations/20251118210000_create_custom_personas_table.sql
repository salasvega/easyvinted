/*
  # Create Custom Personas Table

  1. New Tables
    - `custom_personas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Name of the custom persona
      - `description` (text) - Short description
      - `writing_style` (text) - Detailed writing style prompt for AI
      - `emoji` (text) - Emoji icon for the persona
      - `color` (text) - Tailwind CSS color classes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `custom_personas` table
    - Add policy for users to read their own custom personas
    - Add policy for users to create their own custom personas
    - Add policy for users to update their own custom personas
    - Add policy for users to delete their own custom personas
*/

CREATE TABLE IF NOT EXISTS custom_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  writing_style text NOT NULL,
  emoji text NOT NULL DEFAULT '🎨',
  color text NOT NULL DEFAULT 'bg-blue-100 border-blue-300 hover:border-blue-500',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom personas"
  ON custom_personas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom personas"
  ON custom_personas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom personas"
  ON custom_personas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom personas"
  ON custom_personas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_personas_user_id ON custom_personas(user_id);
