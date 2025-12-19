/*
  # Ajouter le champ writing_style à family_members

  1. Modifications
    - Ajoute la colonne `writing_style` (text) à la table `family_members`
    - Permet de stocker le style rédactionnel directement sur chaque membre
    - Supprime la dépendance à la table `custom_personas`

  2. Notes
    - La colonne est nullable pour permettre une migration en douceur
    - Les données existantes ne seront pas affectées
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'family_members' AND column_name = 'writing_style'
  ) THEN
    ALTER TABLE family_members ADD COLUMN writing_style text;
  END IF;
END $$;
