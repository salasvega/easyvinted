/*
  # Add actual_value field to articles table

  1. Changes
    - Add `actual_value` column to `articles` table
      - Type: decimal (numeric) to store monetary values
      - Nullable: true (for backward compatibility with existing articles)
      - Description: Stores the estimated value of the article (what it's actually worth or what you paid for it)

  2. Notes
    - This field represents the estimated value or cost of acquisition of the article
    - Used for profit calculation: profit = sold_price - actual_value - fees - shipping_cost
    - Existing articles will have NULL for this field until updated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'actual_value'
  ) THEN
    ALTER TABLE articles ADD COLUMN actual_value numeric(10,2);
  END IF;
END $$;
