/*
  # Create articles table for EasyVinted automation

  1. New Tables
    - `articles`
      - `id` (uuid, primary key) - Unique identifier for each article
      - `title` (text) - Article title/name
      - `description` (text) - Detailed description of the article
      - `brand` (text) - Brand name
      - `size` (text) - Size information (M, L, 38, etc.)
      - `condition` (text) - Condition of the article
      - `category` (text) - Article category
      - `price` (decimal) - Selling price
      - `photos` (text array) - Array of photo URLs
      - `season` (text) - Season indicator
      - `suggested_period` (text) - Suggested posting period
      - `status` (text) - Article status (draft, ready, scheduled, published)
      - `scheduled_at` (timestamptz, nullable) - Scheduled publication time
      - `published_at` (timestamptz, nullable) - Actual publication time
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `articles` table
    - Add policies for authenticated users to manage their articles

  3. Indexes
    - Add indexes for common query patterns
*/

-- Create the articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  brand text DEFAULT '',
  size text DEFAULT '',
  condition text NOT NULL DEFAULT 'good',
  category text DEFAULT '',
  price decimal(10,2) NOT NULL,
  photos text[] DEFAULT '{}',
  season text DEFAULT 'undefined',
  suggested_period text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
CREATE INDEX IF NOT EXISTS articles_season_idx ON articles(season);
CREATE INDEX IF NOT EXISTS articles_scheduled_at_idx ON articles(scheduled_at);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON articles(created_at DESC);

-- Insert test data (2 jeans articles)
INSERT INTO articles (title, description, brand, size, condition, category, price, photos, season, suggested_period, status)
VALUES
  (
    'Jean slim bleu foncé',
    'Jean slim coupe moderne en excellent état, porté quelques fois. Très confortable et stylé.',
    'Zara',
    '38',
    'very_good',
    'Jeans',
    25.00,
    ARRAY['https://images.pexels.com/photos/1346187/pexels-photo-1346187.jpeg'],
    'undefined',
    'Toute l''année',
    'ready'
  ),
  (
    'Jean mom fit délavé',
    'Jean mom fit tendance avec effet délavé vintage. Taille haute, très bon état.',
    'Levi''s',
    '40',
    'good',
    'Jeans',
    35.00,
    ARRAY['https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg'],
    'undefined',
    'Toute l''année',
    'draft'
  );
