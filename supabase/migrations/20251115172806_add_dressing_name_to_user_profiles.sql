/*
  # Add dressing name to user profiles

  1. Changes
    - Add `dressing_name` column to `user_profiles` table
      - `dressing_name` (text) - the name of the user's dressing/store
      - Default value: 'Mon Dressing'

  2. Notes
    - This field will allow users to name their dressing (sales space)
    - In the future, this will support multiple dressings per user
    - For now, each user has one dressing that they can name
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dressing_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dressing_name text DEFAULT 'Mon Dressing';
  END IF;
END $$;
