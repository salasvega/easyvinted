/*
  # Add sold_at field to lots table

  ## Description
  Add the sold_at timestamp field to the lots table to track when lots are sold.
  This field is essential for displaying the correct date for sold lots in the admin interface.

  ## Changes
  - Add `sold_at` (timestamptz) - Date when the lot was sold

  ## Important Notes
  - This field mirrors the sold_at field in the articles table
  - It should be set when a lot's status changes to 'sold'
  - It allows proper tracking and display of sale dates
*/

-- Add sold_at field to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'sold_at'
  ) THEN
    ALTER TABLE lots ADD COLUMN sold_at timestamptz;
  END IF;
END $$;
