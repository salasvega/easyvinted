# Migration SEO pour la table `lots`

## Problème
Les champs SEO (seo_keywords, hashtags, search_terms) ne se sauvegardent pas dans les lots car les colonnes n'existent pas dans la table `lots`.

## Solution
Appliquer la migration SQL pour ajouter ces colonnes à la table `lots`.

## Méthode 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**
5. Copiez et collez le SQL suivant :

```sql
-- Add SEO & Marketing columns to lots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'seo_keywords'
  ) THEN
    ALTER TABLE lots ADD COLUMN seo_keywords text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE lots ADD COLUMN hashtags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'search_terms'
  ) THEN
    ALTER TABLE lots ADD COLUMN search_terms text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lots' AND column_name = 'ai_confidence_score'
  ) THEN
    ALTER TABLE lots ADD COLUMN ai_confidence_score integer;
  END IF;
END $$;
```

6. Cliquez sur **Run** (ou appuyez sur Ctrl/Cmd + Enter)
7. Vérifiez que la requête s'est exécutée avec succès

## Méthode 2 : Via le CLI Supabase (si configuré)

```bash
npx supabase db push --file add_seo_to_lots_migration.sql
```

## Vérification

Après avoir appliqué la migration, vous pouvez vérifier que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lots'
  AND column_name IN ('seo_keywords', 'hashtags', 'search_terms', 'ai_confidence_score');
```

Vous devriez voir 4 lignes avec ces colonnes.

## Après la migration

Une fois la migration appliquée :
1. Rechargez votre application
2. Les champs SEO dans le formulaire de lot se sauvegarderont correctement
3. Vous pourrez ajouter des mots-clés, hashtags et termes de recherche
