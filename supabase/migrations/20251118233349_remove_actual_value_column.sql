/*
  # Remove actual_value column from articles table

  1. Changes
    - Remove `actual_value` column from `articles` table

  2. Rationale
    - The actual_value field is no longer needed in the application
    - The net_profit calculation now uses: sold_price - fees - shipping_cost
    - This simplifies the data model and removes unnecessary complexity

  3. Impact
    - Existing net_profit values remain unchanged
    - Future sales calculations will not include actual_value
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'actual_value'
  ) THEN
    ALTER TABLE articles DROP COLUMN actual_value;
  END IF;
END $$;
