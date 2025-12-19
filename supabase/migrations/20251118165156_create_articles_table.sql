/*
  # Create Articles Table

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Article title
      - `description` (text) - Article description
      - `price` (numeric) - Selling price
      - `brand` (text) - Brand name
      - `size` (text) - Size information
      - `condition` (text) - Item condition
      - `main_category` (text) - Main category
      - `subcategory` (text) - Subcategory
      - `item_category` (text) - Specific item type
      - `color` (text) - Item color
      - `material` (text) - Item material
      - `status` (text) - Publication status
      - `photos` (jsonb) - Array of photo URLs
      - `scheduled_for` (timestamptz) - Scheduled publication date
      - `sold_at` (timestamptz) - Sale date
      - `sold_price` (numeric) - Actual sale price
      - `actual_value` (numeric) - Item's actual value/cost
      - `platform` (text) - Where item was sold
      - `buyer_name` (text) - Buyer information
      - `shipping_cost` (numeric) - Shipping fees
      - `fees` (numeric) - Platform fees
      - `net_profit` (numeric) - Net profit after costs
      - `sale_notes` (text) - Additional sale notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `articles` table
    - Add policies for authenticated users to manage their own articles
*/

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric(10, 2) DEFAULT 0,
  brand text DEFAULT '',
  size text DEFAULT '',
  condition text DEFAULT '',
  main_category text DEFAULT '',
  subcategory text DEFAULT '',
  item_category text DEFAULT '',
  color text,
  material text,
  status text DEFAULT 'draft',
  photos jsonb DEFAULT '[]'::jsonb,
  scheduled_for timestamptz,
  sold_at timestamptz,
  sold_price numeric(10, 2),
  actual_value numeric(10, 2),
  platform text,
  buyer_name text,
  shipping_cost numeric(10, 2) DEFAULT 0,
  fees numeric(10, 2) DEFAULT 0,
  net_profit numeric(10, 2),
  sale_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles(user_id);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
