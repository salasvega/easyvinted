/*
  # Add comprehensive sales tracking fields

  1. Changes
    - Add `platform` column to track where item was sold (vinted, other platforms)
    - Add `buyer_name` column to optionally track buyer information
    - Add `shipping_cost` column to track shipping fees
    - Add `fees` column to track platform fees
    - Add `net_profit` column to track actual profit after all costs
    - Add `notes` column for additional sale notes

  2. Notes
    - All new fields are nullable as they're only relevant for sold items
    - This enables comprehensive sales analytics and profit tracking
    - net_profit = sold_price - original_price - shipping_cost - fees
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'platform'
  ) THEN
    ALTER TABLE articles ADD COLUMN platform text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'buyer_name'
  ) THEN
    ALTER TABLE articles ADD COLUMN buyer_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE articles ADD COLUMN shipping_cost numeric(10, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'fees'
  ) THEN
    ALTER TABLE articles ADD COLUMN fees numeric(10, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE articles ADD COLUMN net_profit numeric(10, 2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'sale_notes'
  ) THEN
    ALTER TABLE articles ADD COLUMN sale_notes text;
  END IF;
END $$;
