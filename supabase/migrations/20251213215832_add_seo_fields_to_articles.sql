/*
  # Ajout des champs SEO aux articles

  1. Nouveaux champs
    - `seo_keywords` (text array): Mots-cles SEO pour optimiser la visibilite
    - `hashtags` (text array): Hashtags tendance pour les reseaux sociaux
    - `search_terms` (text array): Termes de recherche populaires
    - `ai_confidence_score` (integer): Score de confiance de l'analyse IA (0-100)

  2. Objectif
    - Ameliorer le referencement des annonces sur Vinted
    - Permettre aux vendeurs de voir les mots-cles generes par l'IA
    - Suivre la qualite des analyses IA
*/

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_terms text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence_score integer DEFAULT NULL;

COMMENT ON COLUMN articles.seo_keywords IS 'Mots-cles SEO generes par l''IA pour optimiser la visibilite sur Vinted';
COMMENT ON COLUMN articles.hashtags IS 'Hashtags tendance generes par l''IA pour les reseaux sociaux';
COMMENT ON COLUMN articles.search_terms IS 'Termes de recherche populaires que les acheteurs utilisent';
COMMENT ON COLUMN articles.ai_confidence_score IS 'Score de confiance de l''analyse IA (0-100)';