# Migration SEO pour les Lots - Instructions

## Problème résolu
L'erreur `invalid input syntax for type integer: "0.9"` lors de la création d'un lot est maintenant corrigée.

## Ce qui a été fait

### 1. Code corrigé
- Le score de confiance de l'IA est maintenant converti de 0-1 à 0-100
- Le code gère automatiquement cette conversion dans `src/lib/lotAnalysisService.ts`

### 2. Migration créée
Une migration a été créée pour ajouter les colonnes SEO à la table `lots` :
- `seo_keywords` (text array) - Mots-clés SEO
- `hashtags` (text array) - Hashtags pour réseaux sociaux
- `search_terms` (text array) - Termes de recherche
- `ai_confidence_score` (integer) - Score de confiance IA (0-100)

## Comment appliquer la migration

### Option 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. Allez dans votre dashboard Supabase
2. Naviguez vers **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez et collez le contenu du fichier :
   `supabase/migrations/20251217120000_add_seo_fields_to_lots.sql`
5. Cliquez sur **Run** pour exécuter le SQL

### Option 2 : Via Supabase CLI (si installé)

```bash
supabase migration up
```

## Vérification

Une fois la migration appliquée, vous pourrez :
- Créer des lots sans erreur
- Les données SEO seront automatiquement générées et sauvegardées
- Le score de confiance sera affiché correctement (0-100)

## Fichiers modifiés

- ✅ `src/lib/lotAnalysisService.ts` - Conversion du score 0-1 vers 0-100
- ✅ `supabase/migrations/20251217120000_add_seo_fields_to_lots.sql` - Migration SQL
- ✅ `scripts/applyLotSeoMigration.ts` - Script d'application (nécessite RPC)
- ✅ `package.json` - Ajout de `npm run seo:apply-lots`

## Note importante

Le score `ai_confidence_score` représente la confiance de l'IA dans son analyse :
- 0-30 : Faible confiance (données incomplètes)
- 31-60 : Confiance moyenne
- 61-80 : Bonne confiance
- 81-100 : Excellente confiance
