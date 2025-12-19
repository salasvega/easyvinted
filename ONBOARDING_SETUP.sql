-- INSTRUCTIONS: Exécutez ce script SQL dans l'éditeur SQL de Supabase
-- pour ajouter les colonnes nécessaires à la fonctionnalité d'onboarding.

-- Ajouter les colonnes d'onboarding à user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS top_size text DEFAULT '';

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bottom_size text DEFAULT '';

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS default_seller_id uuid REFERENCES family_members(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_complet boolean DEFAULT false NOT NULL;

-- Note: Tous les utilisateurs existants auront onboarding_complet = false
-- et seront donc redirigés vers le flux d'onboarding à leur prochaine connexion.
-- Si vous voulez que certains utilisateurs existants ne passent pas par l'onboarding,
-- exécutez cette requête pour les marquer comme complétés:
--
-- UPDATE user_profiles SET onboarding_complet = true WHERE id = 'USER_ID_HERE';
