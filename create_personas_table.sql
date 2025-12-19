/*
  # Create personas table with predefined personas

  1. New Tables
    - `personas`
      - `id` (text, primary key) - Unique identifier for the persona
      - `name` (text) - Display name (e.g., "La Minimaliste")
      - `description` (text) - Short description of the persona
      - `writing_style` (text) - Detailed writing style instructions
      - `emoji` (text) - Emoji icon for UI display
      - `color` (text) - CSS color classes for UI styling
      - `created_at` (timestamptz) - When the persona was created

  2. Security
    - Enable RLS on `personas` table
    - Add policy for all authenticated users to read personas (public read)
    - Only admin can insert/update/delete (no policies for write operations)

  3. Data
    - Insert 6 predefined personas from the application
*/

CREATE TABLE IF NOT EXISTS personas (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  writing_style text NOT NULL,
  emoji text NOT NULL DEFAULT '✨',
  color text NOT NULL DEFAULT 'bg-slate-100 border-slate-300 hover:border-slate-500',
  created_at timestamptz DEFAULT now()
);

-- Insert predefined personas
INSERT INTO personas (id, name, description, writing_style, emoji, color) VALUES
  (
    'minimalist',
    'La Minimaliste',
    'Descriptions courtes, claires et efficaces',
    'Style minimaliste et direct : décris l''article de manière concise et factuelle, en allant à l''essentiel. Phrases courtes, informations précises, sans fioritures.',
    '✨',
    'bg-slate-100 border-slate-300 hover:border-slate-500'
  ),
  (
    'enthusiast',
    'L''Enthousiaste',
    'Dynamique, positive et pleine d''énergie',
    'Style enthousiaste et dynamique : utilise un ton enjoué et positif ! Mets en avant les points forts avec énergie, utilise des points d''exclamation et des expressions enthousiastes. Rends l''article irrésistible !',
    '🌟',
    'bg-yellow-100 border-yellow-300 hover:border-yellow-500'
  ),
  (
    'fashion_pro',
    'La Pro de la Mode',
    'Experte, technique et détaillée',
    'Style professionnel mode : démontre ton expertise avec un vocabulaire technique précis. Décris les coupes, matières, finitions avec précision. Ton expert et détaillé, mentionne les tendances actuelles si pertinent.',
    '👗',
    'bg-purple-100 border-purple-300 hover:border-purple-500'
  ),
  (
    'friendly',
    'La Copine Sympa',
    'Chaleureuse, accessible et décontractée',
    'Style copine sympa : parle comme à une amie ! Ton décontracté et chaleureux, tutoiement naturel, comme si tu présentais ton vêtement à une copine autour d''un café. Accessible et convivial.',
    '💕',
    'bg-pink-100 border-pink-300 hover:border-pink-500'
  ),
  (
    'elegant',
    'L''Élégante',
    'Raffinée, sophistiquée et chic',
    'Style élégant et raffiné : utilise un vocabulaire recherché et sophistiqué. Mets en valeur la qualité, l''élégance et le raffinement de la pièce. Ton chic et distingué, comme dans un magazine haut de gamme.',
    '🎩',
    'bg-amber-100 border-amber-300 hover:border-amber-500'
  ),
  (
    'eco_conscious',
    'L''Écolo Engagée',
    'Responsable avec focus sur la durabilité',
    'Style écolo engagé : mets en avant l''aspect durable et responsable de la seconde main. Souligne la qualité qui dure, l''impact positif de l''achat d''occasion. Ton conscient et authentique avec des valeurs écologiques.',
    '🌱',
    'bg-green-100 border-green-300 hover:border-green-500'
  )
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read personas
CREATE POLICY "All authenticated users can read personas"
  ON personas FOR SELECT
  TO authenticated
  USING (true);
