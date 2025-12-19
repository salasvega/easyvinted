/*
  # Ajouter les champs SEO à la table lots

  1. Modifications
    - Ajoute les colonnes SEO à la table `lots` pour l'optimisation et le marketing
    - `seo_keywords` : Mots-clés pour l'optimisation SEO
    - `hashtags` : Hashtags pour les réseaux sociaux
    - `search_terms` : Termes de recherche courants
    - `ai_confidence_score` : Score de confiance de l'analyse IA (0-100)

  2. Compatibilité
    - Utilise `IF NOT EXISTS` pour éviter les erreurs si les colonnes existent déjà
    - Colonnes nullables par défaut pour la compatibilité avec les lots existants
*/

-- Ajouter les colonnes SEO à la table lots
ALTER TABLE lots
ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS search_terms text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_confidence_score integer DEFAULT NULL;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN lots.seo_keywords IS 'Mots-clés pour l''optimisation SEO (marques, types, couleurs, tailles, saisons)';
COMMENT ON COLUMN lots.hashtags IS 'Hashtags pour les réseaux sociaux (sans le #)';
COMMENT ON COLUMN lots.search_terms IS 'Termes de recherche courants utilisés par les acheteurs';
COMMENT ON COLUMN lots.ai_confidence_score IS 'Score de confiance de l''analyse IA (0-100)';
