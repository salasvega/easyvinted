# Comment tester la sauvegarde des champs SEO

J'ai ajouté des logs de débogage pour identifier exactement où se situe le problème.

## Étape 1: Vérifier la base de données

```bash
npm run seo:check
```

Cela vérifie si les colonnes SEO existent bien dans les tables `articles` et `lots`.

## Étape 2: Tester l'insertion directe

```bash
npm run seo:test
```

Cela teste si vous pouvez insérer et lire des données SEO directement dans Supabase.

## Étape 3: Tester dans l'application avec les logs

1. **Ouvrez l'application dans votre navigateur**

2. **Ouvrez les DevTools** (Appuyez sur F12)

3. **Allez dans l'onglet Console**

4. **Créez ou éditez un article ou un lot**

5. **Ajoutez des valeurs dans les champs SEO** :
   - Tapez "test keyword" dans le champ "Mots-clés SEO" et appuyez sur Entrée
   - Tapez "testhashtag" dans le champ "Hashtags" et appuyez sur Entrée
   - Tapez "terme test" dans le champ "Termes de recherche" et appuyez sur Entrée

6. **Vérifiez que les valeurs apparaissent** :
   - Les tags doivent s'afficher sous les champs d'input
   - Vous devez pouvoir les supprimer en cliquant sur le X

7. **Cliquez sur "Sauvegarder"**

8. **Regardez la console** :

   Vous devriez voir :
   ```
   📝 ArticleFormDrawer - Données SEO à sauvegarder:
   {
     seo_keywords: ['test keyword'],
     hashtags: ['#testhashtag'],
     search_terms: ['terme test'],
     ai_confidence_score: null
   }
   ```

   Ou pour un lot :
   ```
   📦 LotBuilder - Données SEO à sauvegarder:
   {
     seo_keywords: ['test keyword'],
     hashtags: ['#testhashtag'],
     search_terms: ['terme test'],
     ai_confidence_score: null
   }
   ```

9. **Ensuite, vous devriez voir** :
   - `✅ Article mis à jour avec succès` ou `✅ Lot mis à jour avec succès`
   - OU `❌ Erreur lors de la mise à jour:` suivi des détails de l'erreur

10. **Fermez et rouvrez le formulaire**

11. **Vérifiez si les données sont toujours là**
    - Les mots-clés SEO sont-ils affichés ?
    - Les hashtags sont-ils affichés ?
    - Les termes de recherche sont-ils affichés ?

## Étape 4: Vérifier directement dans Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "Table Editor"
4. Ouvrez la table `articles` ou `lots`
5. Trouvez l'article/lot que vous venez de modifier
6. Vérifiez les colonnes :
   - `seo_keywords`
   - `hashtags`
   - `search_terms`
   - `ai_confidence_score`

## Résultats possibles

### ✅ Cas 1: Tout fonctionne

Si vous voyez les logs dans la console ET les données dans Supabase, tout fonctionne ! Le problème était peut-être temporaire.

### ❌ Cas 2: Logs OK mais pas de données dans Supabase

Si vous voyez les logs `📝/📦 Données SEO à sauvegarder` avec les bonnes valeurs, MAIS aucun `✅` ou `❌` après, alors il y a un problème dans la requête Supabase.

### ❌ Cas 3: Les valeurs dans les logs sont vides

Si les logs montrent :
```
{
  seo_keywords: [],
  hashtags: [],
  search_terms: [],
  ai_confidence_score: null
}
```

Alors le problème est dans l'interface : les valeurs ne sont pas ajoutées au state local correctement.

### ❌ Cas 4: Erreur dans la console

Si vous voyez `❌ Erreur lors de...`, copiez le message d'erreur complet et envoyez-le moi.

## Scripts de diagnostic disponibles

```bash
# Vérifier les colonnes
npm run seo:check

# Tester l'insertion/lecture directe
npm run seo:test

# Appliquer la migration (si nécessaire)
npm run seo:apply
```

## Informations à me fournir

Si le problème persiste, envoyez-moi :

1. La sortie de `npm run seo:check`
2. La sortie de `npm run seo:test`
3. Les logs de la console DevTools (copier/coller le texte)
4. Un screenshot de la table Supabase
5. Description exacte de ce qui se passe (les valeurs s'affichent, disparaissent, etc.)
