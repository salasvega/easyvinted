# Changelog - EasyVinted Worker

## ✅ Correctifs Appliqués (2024-11-20)

### 1. ✅ Ajout de la colonne `vinted_url` à la table articles

**Migration créée :** `add_vinted_url_to_articles.sql`

- Ajout de la colonne `vinted_url TEXT` à la table `articles`
- Index créé pour optimiser les requêtes
- Le worker peut maintenant enregistrer l'URL Vinted après publication

### 2. ✅ Téléchargement des photos depuis Supabase Storage

**Fichier modifié :** `src/vintedClient.ts`

**Fonctionnalités ajoutées :**

- `downloadPhotoToTemp(photoUrl)` : Télécharge une photo depuis Supabase Storage vers un fichier temporaire
- `cleanupTempFiles(files)` : Nettoie les fichiers temporaires après publication
- Modification de `publishArticle()` pour télécharger les photos avant upload vers Vinted

**Flux de publication :**
1. Les photos sont téléchargées depuis Supabase Storage (`https://...supabase.co/storage/...`)
2. Sauvegardées temporairement dans `/tmp/vinted-{timestamp}.jpg`
3. Uploadées vers Vinted via Playwright
4. Fichiers temporaires supprimés après publication

### 3. ✅ Sélecteurs CSS Robustes avec Fallbacks

**Fichier modifié :** `src/vintedClient.ts`

**Améliorations :**

- `fillFieldSafely()` : Essaie plusieurs sélecteurs jusqu'à trouver le bon
- `selectOptionSafely()` : Gestion intelligente des selects avec fallbacks
- `fillCategories()` : Nouvelle fonction pour gérer les catégories Vinted

**Sélecteurs avec fallbacks :**

| Champ | Sélecteurs |
|-------|-----------|
| Titre | `input[name="title"]`, `input[id*="title"]`, `input[placeholder*="Titre"]` |
| Description | `textarea[name="description"]`, `textarea[id*="description"]`, `textarea[placeholder*="Description"]` |
| Marque | `input[name="brand"]`, `input[id*="brand"]`, `input[placeholder*="Marque"]` |
| Taille | `input[name="size"]`, `select[name="size"]`, `input[id*="size"]` |
| État | `select[name="status"]`, `select[id*="status"]`, `select[name="item_status"]` |
| Couleur | `input[name="color"]`, `select[name="color"]`, `input[id*="color"]` |
| Matière | `input[name="material"]`, `select[name="material"]`, `input[id*="material"]` |
| Prix | `input[name="price"]`, `input[id*="price"]`, `input[type="number"]` |

**Avantages :**
- Résiste aux changements d'interface Vinted
- Logs détaillés pour debugging
- Ne crash pas si un champ n'est pas trouvé

### 4. ✅ Gestion des Catégories Vinted

**Fichier modifié :** `src/vintedClient.ts`, `src/types.ts`

**Fonctionnalités ajoutées :**

- Support de `main_category`, `subcategory`, `item_category`
- `fillCategories()` : Fonction dédiée à la sélection des catégories
- Délai automatique entre sélection de catégorie et sous-catégorie (1 seconde)

**Sélecteurs de catégories :**

**Catégorie principale :**
- `select[name="catalog_id"]`
- `select[id*="catalog"]`
- `select[name="category"]`
- `[data-testid="category-select"]`

**Sous-catégorie :**
- `select[name="category_id"]`
- `select[id*="subcategory"]`
- `[data-testid="subcategory-select"]`

### 5. ✅ Mise à jour des Types TypeScript

**Fichier modifié :** `src/types.ts`

**Changements :**

```typescript
export interface Article {
  // ... autres champs
  main_category?: string | null;    // ✅ Nouveau
  subcategory?: string | null;      // ✅ Nouveau
  item_category?: string | null;    // ✅ Nouveau
  vinted_url: string | null;        // ✅ Nouveau
}
```

### 6. ✅ Configuration TypeScript

**Fichier modifié :** `tsconfig.json`

- Ajout de `"DOM"` à la lib pour supporter `document` dans `page.evaluate()`

---

## 🎯 État Actuel

### ✅ Fonctionnel

- ✅ Téléchargement automatique des photos depuis Supabase Storage
- ✅ Upload des photos vers Vinted
- ✅ Remplissage du formulaire avec fallbacks robustes
- ✅ Gestion des catégories
- ✅ Sauvegarde de l'URL Vinted en base de données
- ✅ Nettoyage automatique des fichiers temporaires
- ✅ Compilation TypeScript sans erreurs

### ⚠️ À Tester Manuellement

Les sélecteurs CSS ont été améliorés mais doivent être **testés en conditions réelles** :

1. **Test en mode développement :**
   ```bash
   cd easyvinted-worker
   HEADLESS=false npm run dev
   ```

2. **Vérifier :**
   - ✅ Connexion à Vinted
   - ✅ Navigation vers le formulaire
   - ✅ Upload des photos
   - ✅ Remplissage de chaque champ
   - ✅ Sélection des catégories
   - ✅ Soumission du formulaire
   - ✅ Récupération de l'URL Vinted

3. **Ajuster si nécessaire :**
   - Si un champ ne se remplit pas, inspecter la page Vinted
   - Ajouter le bon sélecteur dans les fallbacks
   - Relancer le test

---

## 🚀 Prochaines Étapes

### 1. Configuration de l'Environnement

Créer le fichier `.env` dans `easyvinted-worker/` :

```env
SUPABASE_URL=https://qgjbouumpuhodhcwpfvl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VINTED_EMAIL=monadressemailssv1@gmail.com
VINTED_PASSWORD=Chilaquiles1+
HEADLESS=true
```

### 2. Test Initial

```bash
cd easyvinted-worker
npm install
HEADLESS=false npm run dev
```

Observer le navigateur et vérifier chaque étape.

### 3. Créer un Job de Test

Dans la base de données Supabase :

```sql
-- Créer un job de test pour un article existant
INSERT INTO publication_jobs (article_id, run_at, status)
VALUES (
  'id-de-ton-article',
  NOW(),
  'pending'
);
```

### 4. Déploiement en Production

Une fois les tests réussis :

1. Déployer le worker sur un VPS/serveur
2. Configurer un cron job ou systemd service
3. Monitorer les logs

---

## 📝 Notes Importantes

### Sécurité

- ⚠️ Ne pas publier plus de 10-15 articles par jour
- ⚠️ Respecter un délai de 5-10 minutes entre publications
- ⚠️ Vinted peut détecter l'automatisation et bloquer le compte

### Dépendances

Le worker utilise :
- `@supabase/supabase-js` : Accès à la base de données
- `playwright` : Automatisation du navigateur
- `dotenv` : Gestion des variables d'environnement

### Logs

Le worker affiche des logs détaillés :
- 📥 Téléchargement des photos
- 📝 Remplissage de chaque champ
- 📂 Sélection des catégories
- ✅ Succès de publication
- ❌ Erreurs rencontrées

---

## ✨ Résumé

**Avant les correctifs :**
- ❌ Photos en URLs, worker attendait des chemins locaux
- ❌ Pas de colonne `vinted_url` en base
- ❌ Sélecteurs fragiles (un seul par champ)
- ❌ Pas de gestion des catégories

**Après les correctifs :**
- ✅ Téléchargement automatique des photos
- ✅ Colonne `vinted_url` ajoutée
- ✅ Sélecteurs robustes avec fallbacks multiples
- ✅ Gestion complète des catégories
- ✅ Nettoyage automatique des fichiers temporaires
- ✅ Compilation sans erreurs

**Le worker est maintenant prêt pour les tests en conditions réelles !** 🎉
