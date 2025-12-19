/*
  # Create Family Members Table

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - Owner of this family profile
      - `name` (text) - Display name (e.g., Nina, Tom, Papa, Maman)
      - `age` (integer) - Age of the family member
      - `persona_id` (text) - Writing style persona identifier
      - `custom_persona_id` (uuid, nullable, foreign key to custom_personas) - Optional custom persona
      - `is_default` (boolean) - Whether this is the default seller for new articles
      - `created_at` (timestamptz) - When the member was created
      - `updated_at` (timestamptz) - When the member was last updated

  2. Security
    - Enable RLS on `family_members` table
    - Add policy for authenticated users to view their own family members
    - Add policy for authenticated users to create their own family members
    - Add policy for authenticated users to update their own family members
    - Add policy for authenticated users to delete their own family members

  3. Important Notes
    - Each user can have multiple family members
    - One family member can be marked as default seller
    - Family members can use either predefined personas or custom personas
    - This enables multi-seller functionality within a single account
*/

CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer NOT NULL,
  persona_id text NOT NULL DEFAULT 'casual',
  custom_persona_id uuid REFERENCES custom_personas(id) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_custom_persona_id ON family_members(custom_persona_id);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family members"
  ON family_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own family members"
  ON family_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
