/*
  # Add base_persona_id to custom_personas

  1. Changes
    - Add `base_persona_id` column to track which base persona is being customized
    - Add unique constraint to ensure one customization per base persona per user

  2. Important Notes
    - Allows users to override default personas with their own versions
    - The base_persona_id links to PERSONAS constant IDs (minimalist, enthusiast, etc.)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_personas' AND column_name = 'base_persona_id'
  ) THEN
    ALTER TABLE custom_personas ADD COLUMN base_persona_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'custom_personas_user_base_unique'
  ) THEN
    ALTER TABLE custom_personas ADD CONSTRAINT custom_personas_user_base_unique UNIQUE(user_id, base_persona_id);
  END IF;
END $$;
