# Guide de débogage pour les champs SEO

## Diagnostic étape par étape

### Étape 1: Vérifier que les colonnes existent
```bash
npm run seo:check
```

✅ Si vous voyez "Configuration complète", passez à l'étape 2.
❌ Si vous voyez des erreurs, suivez les instructions affichées.

### Étape 2: Tester l'insertion directe en base
```bash
npm run seo:test
```

Ce script teste si les données SEO peuvent être insérées/mises à jour dans la base de données.

✅ Si le test réussit, le problème vient de l'interface utilisateur.
❌ Si le test échoue, le problème vient de la base de données.

### Étape 3: Tester dans l'interface

1. Ouvrez l'application dans votre navigateur
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet Console
4. Créez ou éditez un article/lot
5. Ajoutez des valeurs SEO :
   - Dans "Mots-clés SEO", tapez "test" et appuyez sur Entrée
   - Dans "Hashtags", tapez "test" et appuyez sur Entrée
   - Dans "Termes de recherche", tapez "test" et appuyez sur Entrée

6. **Vérifiez dans la console** :
   - Les valeurs s'affichent-elles sous les champs d'input ?
   - Voyez-vous des erreurs dans la console ?

7. Cliquez sur "Sauvegarder"

8. **Vérifiez à nouveau** :
   - Voyez-vous des erreurs dans la console ?
   - Le message "Article/Lot modifié avec succès" s'affiche-t-il ?

9. Fermez et rouvrez le formulaire d'édition

10. **Vérifiez si les données sont présentes** :
    - Les mots-clés SEO sont-ils affichés ?
    - Les hashtags sont-ils affichés ?
    - Les termes de recherche sont-ils affichés ?

### Étape 4: Vérifier directement dans Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "Table Editor"
4. Ouvrez la table `articles` ou `lots`
5. Trouvez l'article/lot que vous venez de modifier
6. Regardez les colonnes `seo_keywords`, `hashtags`, `search_terms`
7. **Les données sont-elles présentes ?**

## Résolution selon les résultats

### Cas 1: Les données sont dans Supabase mais pas dans l'interface

**Problème** : Les données sont sauvegardées mais pas rechargées correctement.

**Solution** : Le problème est dans la fonction de chargement. Vérifiez que :
- La fonction `fetchAllData` est bien appelée après la sauvegarde
- Les champs SEO sont bien dans le `.select()` de Supabase

### Cas 2: Les données ne sont pas dans Supabase

**Problème** : Les données ne sont pas envoyées lors de la sauvegarde.

**Solution** : Activez les logs de débogage :

1. Ouvrez le fichier `src/components/admin/ArticleFormDrawer.tsx`
2. Trouvez la fonction `handleSave` (ligne ~552)
3. Juste avant l'appel à Supabase, ajoutez :
   ```typescript
   console.log('📝 Données à sauvegarder:', articleData);
   console.log('📊 Champs SEO:', {
     seo_keywords: articleData.seo_keywords,
     hashtags: articleData.hashtags,
     search_terms: articleData.search_terms,
   });
   ```

4. Faites la même chose dans `src/components/LotBuilder.tsx` ligne ~545

5. Sauvegardez, rechargez l'app, et regardez la console lors de la sauvegarde

### Cas 3: Les données sont ajoutées à l'état mais disparaissent

**Problème** : Les valeurs sont ajoutées au state local mais ne persistent pas.

**Solution** : Ajoutez des logs dans les handlers `onKeyDown` :

```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = e.currentTarget.value.trim();
    console.log('🔑 Valeur à ajouter:', value);
    console.log('📋 Keywords actuels:', formData.seo_keywords);
    if (value && !formData.seo_keywords.includes(value)) {
      const newKeywords = [...formData.seo_keywords, value];
      console.log('✅ Nouveaux keywords:', newKeywords);
      setFormData({ ...formData, seo_keywords: newKeywords });
      e.currentTarget.value = '';
    }
  }
}}
```

## Contact et support

Si après tous ces tests le problème persiste, fournissez :
- Les résultats de `npm run seo:check`
- Les résultats de `npm run seo:test`
- Les screenshots de la console DevTools
- Un screenshot de la table Supabase
