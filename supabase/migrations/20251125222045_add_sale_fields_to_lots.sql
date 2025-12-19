/*
  # Add sale tracking fields to lots table

  ## Description
  Add missing sale-related fields to the lots table to match the articles table.
  This allows tracking complete sale information for lots.

  ## Changes
  - Add `shipping_cost` (numeric) - Cost of shipping the lot
  - Add `fees` (numeric) - Platform fees for the lot sale
  - Add `net_profit` (numeric) - Net profit after fees and shipping
  - Add `buyer_name` (text) - Name of the buyer (optional)
  - Add `sale_notes` (text) - Additional notes about the sale (optional)
  - Add `seller_id` (uuid) - Reference to family_members table for who sold it

  ## Important Notes
  - These fields allow complete tracking of lot sales
  - Mirrors the sale tracking structure of individual articles
*/

-- Add sale tracking fields to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE lots ADD COLUMN shipping_cost numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'fees'
  ) THEN
    ALTER TABLE lots ADD COLUMN fees numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE lots ADD COLUMN net_profit numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'buyer_name'
  ) THEN
    ALTER TABLE lots ADD COLUMN buyer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'sale_notes'
  ) THEN
    ALTER TABLE lots ADD COLUMN sale_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE lots ADD COLUMN seller_id uuid REFERENCES family_members(id) ON DELETE SET NULL;
  END IF;
END $$;
