/*
  # Create lots (packs) management system

  ## Overview
  This migration creates the infrastructure for managing "lots" (packs) of articles.
  A lot allows selling multiple articles as a single Vinted listing.

  ## New Tables

  ### `lots`
  Main table for storing lot information
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text) - Name of the lot
  - `description` (text) - Optional description
  - `category_id` (integer) - Main Vinted category
  - `season` (text) - Season (spring, summer, autumn, winter, all-seasons)
  - `price` (numeric) - Lot sale price
  - `original_total_price` (numeric) - Sum of individual article prices
  - `discount_percentage` (numeric) - Calculated discount percentage
  - `cover_photo` (text) - Main photo URL for the lot
  - `photos` (text[]) - Array of photo URLs
  - `status` (text) - Status: draft, ready, scheduled, published, sold
  - `scheduled_for` (timestamptz) - Scheduled publication date
  - `published_at` (timestamptz) - Actual publication date
  - `vinted_url` (text) - Vinted listing URL once published
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `lot_items`
  Junction table linking articles to lots
  - `id` (uuid, primary key)
  - `lot_id` (uuid, foreign key to lots)
  - `article_id` (uuid, foreign key to articles)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Users can only access their own lots
  - Users can only link their own articles to their lots

  ## Important Notes
  - An article can only belong to one active (non-sold) lot at a time
  - When a lot is published, all articles in it are marked as published
  - When a lot is sold, all articles in it are marked as sold
  - Deleting a lot does not delete the articles, they return to their previous state
*/

-- Create lots table
CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category_id integer,
  season text CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all-seasons')),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  original_total_price numeric(10,2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) DEFAULT 0,
  cover_photo text,
  photos text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'scheduled', 'published', 'sold')),
  scheduled_for timestamptz,
  published_at timestamptz,
  vinted_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create lot_items junction table
CREATE TABLE IF NOT EXISTS lot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(article_id, lot_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lots_user_id ON lots(user_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_lot_items_lot_id ON lot_items(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_items_article_id ON lot_items(article_id);

-- Enable Row Level Security
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lots table
CREATE POLICY "Users can view own lots"
  ON lots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lots"
  ON lots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lots"
  ON lots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lots"
  ON lots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for lot_items table
CREATE POLICY "Users can view own lot items"
  ON lot_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own lot items"
  ON lot_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = lot_items.article_id
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lot items"
  ON lot_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_lots_updated_at ON lots;
CREATE TRIGGER trigger_update_lots_updated_at
  BEFORE UPDATE ON lots
  FOR EACH ROW
  EXECUTE FUNCTION update_lots_updated_at();

-- Function to check article availability for lots
-- Ensures an article is not in multiple active lots
CREATE OR REPLACE FUNCTION check_article_lot_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM lot_items li
    JOIN lots l ON l.id = li.lot_id
    WHERE li.article_id = NEW.article_id
    AND l.status NOT IN ('sold')
    AND l.id != NEW.lot_id
  ) THEN
    RAISE EXCEPTION 'Article is already in an active lot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce article availability
DROP TRIGGER IF EXISTS trigger_check_article_lot_availability ON lot_items;
CREATE TRIGGER trigger_check_article_lot_availability
  BEFORE INSERT ON lot_items
  FOR EACH ROW
  EXECUTE FUNCTION check_article_lot_availability();
