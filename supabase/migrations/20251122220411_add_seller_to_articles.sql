/*
  # Add Seller Information to Articles

  1. Changes to Tables
    - Add `seller_id` column to `articles` table
      - `seller_id` (uuid, nullable, foreign key to family_members) - Who is selling this article
      - If null, the article is sold by the account owner

  2. Security
    - No RLS changes needed as existing policies cover this
    - Users can only set seller_id to their own family members

  3. Important Notes
    - Allows tracking which family member is selling each article
    - Enables displaying "Vendu par <Nom>" in sales view
    - Nullable to support existing articles and account owner selling
*/

-- Add seller_id column to articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN seller_id uuid REFERENCES family_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_seller_id ON articles(seller_id);
