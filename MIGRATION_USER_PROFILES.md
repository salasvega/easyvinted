# Migration de consolidation des profils utilisateurs

## Objectif

Consolidation des champs de profil utilisateur dans une seule table `user_profiles` au lieu de les répartir entre `user_profiles` et `family_members`.

## Modifications apportées

### 1. Nouveaux champs ajoutés à `user_profiles`

- `age` (integer) - L'âge de l'utilisateur
- `custom_persona_id` (uuid) - Référence vers un persona personnalisé (nullable)
- `writing_style` (text) - Style d'écriture personnalisé

### 2. Modifications du flux d'onboarding

#### ProfileStep
- Ajout du champ "Age" obligatoire dans le formulaire de profil
- L'utilisateur doit maintenant renseigner son âge lors de la création de son profil

#### OnboardingPage
- Sauvegarde de l'âge dans `user_profiles.age`
- Sauvegarde du style d'écriture personnalisé dans `user_profiles.writing_style`
- Sauvegarde de la référence au persona personnalisé dans `user_profiles.custom_persona_id`

### 3. Améliorations

- Les personas personnalisés créés pendant l'onboarding sont maintenant liés au profil utilisateur
- Le profil utilisateur contient toutes les informations nécessaires sans dépendre de `family_members`
- Meilleure cohérence des données

## Migration SQL à appliquer

**IMPORTANT**: Vous devez appliquer cette migration SQL manuellement dans votre base de données Supabase.

### Étapes d'application

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL (SQL Editor)
3. Copiez et exécutez le script SQL suivant :

```sql
-- Add age column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN age integer;
  END IF;
END $$;

-- Add custom_persona_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'custom_persona_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_persona_id uuid REFERENCES custom_personas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add writing_style column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'writing_style'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN writing_style text DEFAULT '';
  END IF;
END $$;

-- Create index for custom_persona_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_persona_id ON user_profiles(custom_persona_id);
```

### Vérification

Pour vérifier que la migration a été appliquée avec succès, exécutez :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('age', 'custom_persona_id', 'writing_style');
```

Vous devriez voir les trois nouvelles colonnes listées.

## Script de migration alternatif

Si vous préférez utiliser un script Node.js, vous pouvez exécuter :

```bash
npm run tsx scripts/addAgeAndPersonaFields.ts
```

Ce script affichera le SQL à exécuter dans votre éditeur SQL Supabase.

## Impact sur les utilisateurs existants

- Les utilisateurs existants verront leurs profils avec des valeurs NULL pour `age` et `custom_persona_id`
- Le champ `writing_style` sera une chaîne vide par défaut
- Les nouveaux utilisateurs devront obligatoirement renseigner leur âge lors de l'onboarding
- Aucune perte de données

## Compatibilité

Cette migration est rétrocompatible et ne casse pas les fonctionnalités existantes.
