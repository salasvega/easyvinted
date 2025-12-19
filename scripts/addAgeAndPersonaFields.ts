import * as dotenv from 'dotenv';

dotenv.config();

async function addFields() {
  console.log('NOTE: Please apply this migration manually to your Supabase database.');
  console.log('You can use the Supabase SQL Editor or run these commands:');
  console.log('\n--- SQL Migration ---\n');

  console.log(`
-- Add age column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN age integer;
  END IF;
END $$;

-- Add custom_persona_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'custom_persona_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_persona_id uuid REFERENCES custom_personas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add writing_style column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'writing_style'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN writing_style text DEFAULT '';
  END IF;
END $$;

-- Create index for custom_persona_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_persona_id ON user_profiles(custom_persona_id);
  `);

  console.log('\n--- End of SQL ---\n');
  console.log('Copy and paste the SQL above into your Supabase SQL Editor.');
}

addFields();
