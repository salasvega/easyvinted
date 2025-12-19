/*
  # Add Writing Style to User Profiles

  1. Changes
    - Add `writing_style` column to `user_profiles` table
      - Type: text
      - Nullable: true (optional field)
      - Default: null
  
  2. Purpose
    - Allow users to define their preferred writing style for AI-generated article descriptions
    - The style will be used as context when analyzing articles with OpenAI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'writing_style'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN writing_style text DEFAULT null;
  END IF;
END $$;
