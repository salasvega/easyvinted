/*
  # Add Persona ID to User Profiles

  1. Changes
    - Add `persona_id` column to `user_profiles` table
      - Type: text
      - Nullable: true (optional field)
      - Default: null
  
  2. Purpose
    - Store the selected persona ID for each user
    - The persona determines the writing style used by the AI when generating article descriptions
    - Personas include: minimalist, enthusiast, fashion_pro, friendly, elegant, eco_conscious
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'persona_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN persona_id text DEFAULT null;
  END IF;
END $$;
