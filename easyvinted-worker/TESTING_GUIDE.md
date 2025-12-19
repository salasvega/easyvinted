# 🧪 Guide de Test - EasyVinted Worker

## 📋 Prérequis

Avant de commencer les tests, assure-toi d'avoir :

- ✅ Un compte Vinted actif (monadressemailssv1@gmail.com)
- ✅ Au moins 1 article créé dans l'application EasyVinted avec des photos
- ✅ Node.js installé (version 18 ou supérieure)
- ✅ Accès au terminal

---

## 🚀 Étape 1 : Préparer l'Environnement de Test

### 1.1 Naviguer vers le dossier du worker

```bash
cd easyvinted-worker
```

### 1.2 Installer les dépendances

```bash
npm install
```

Cela va automatiquement installer Playwright et Chromium (peut prendre 2-3 minutes).

### 1.3 Vérifier que le fichier .env existe

```bash
cat .env
```

Tu devrais voir :
```env
SUPABASE_URL=https://qgjbouumpuhodhcwpfvl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VINTED_EMAIL=monadressemailssv1@gmail.com
VINTED_PASSWORD=Chilaquiles1+
HEADLESS=true
LOG_LEVEL=info
```

✅ Si le fichier existe avec ces valeurs, tu es prêt !

---

## 🎯 Étape 2 : Créer un Article de Test

### Option A : Via l'Interface Web (Recommandé)

1. Ouvre ton application EasyVinted : http://localhost:5173
2. Va dans "Créer un article"
3. Remplis **tous les champs** :
   - Titre : "Test Publication Worker"
   - Description : "Article de test pour vérifier le worker"
   - Prix : 15
   - Catégorie : Sélectionne n'importe quelle catégorie
   - Marque : "Nike" (ou autre)
   - Taille : "M"
   - État : "Très bon état"
   - Couleur : "Noir"
   - Matière : "Coton"
4. **Ajoute 2-3 photos** (important !)
5. Clique sur "Enregistrer comme brouillon"

### Option B : Via la Base de Données (Avancé)

Si tu as déjà un article, tu peux le récupérer :

```sql
-- Dans Supabase SQL Editor
SELECT id, title, status, photos
FROM articles
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
```

Note l'`id` de l'article que tu veux tester.

---

## 🔧 Étape 3 : Créer un Job de Publication

### 3.1 Via Supabase SQL Editor

1. Va sur https://supabase.com/dashboard
2. Ouvre ton projet
3. Va dans "SQL Editor"
4. Colle cette requête :

```sql
-- Remplace 'ID_DE_TON_ARTICLE' par l'ID de ton article
INSERT INTO publication_jobs (article_id, run_at, status)
VALUES (
  'ID_DE_TON_ARTICLE',  -- ⚠️ REMPLACE ICI
  NOW(),
  'pending'
);
```

5. Clique sur "Run"

### 3.2 Vérifier que le job a été créé

```sql
SELECT
  j.id,
  j.status,
  j.run_at,
  a.title,
  a.price,
  a.photos
FROM publication_jobs j
JOIN articles a ON j.article_id = a.id
WHERE j.status = 'pending'
ORDER BY j.created_at DESC;
```

Tu devrais voir ton job avec `status = 'pending'`.

---

## 🎬 Étape 4 : Lancer le Test en Mode Visible

### 4.1 Première exécution (Mode VISIBLE)

C'est **IMPORTANT** de lancer en mode visible la première fois pour voir ce qui se passe !

```bash
HEADLESS=false npm run dev
```

### 4.2 Ce qui va se passer :

1. **Fenêtre de navigateur s'ouvre** (Chromium)
2. **Logs dans le terminal** :
   ```
   ╔════════════════════════════════════════╗
   ║     EasyVinted Worker v1.0.0          ║
   ║  Automated Vinted Publication Worker  ║
   ╚════════════════════════════════════════╝

   ✓ Environment variables loaded
   ✓ Supabase URL: https://qgjbouumpuhodhcwpfvl...
   ✓ Vinted Email: monadressemailssv1@gmail.com
   ✓ Headless mode: false

   =================================
   🚀 Starting job processor...
   =================================

   📋 Fetching pending jobs...
   📊 Found 1 pending job(s)
   ```

3. **Connexion à Vinted** :
   ```
   🌐 Launching Chromium browser...
   ✓ Browser initialized
   🔐 Checking authentication status...
   ⚠ Not authenticated, logging in...
   🔑 Logging in as monadressemailssv1@gmail.com...
   ✓ Successfully logged in
   ✓ Session saved
   ```

4. **Téléchargement des photos** :
   ```
   📥 Downloading 3 photos from Supabase...
   📥 Downloading photo: https://qgjbouumpuhodhcwpfvl...
   ✓ Photo saved to: /tmp/vinted-1234567890-abc.jpg
   📥 Downloading photo: https://qgjbouumpuhodhcwpfvl...
   ✓ Photo saved to: /tmp/vinted-1234567891-def.jpg
   ```

5. **Remplissage du formulaire** :
   ```
   ✍️  Filling article form...
     📝 Setting title...
     📝 Setting description...
     📝 Setting brand...
     📂 Setting categories...
     📝 Setting size...
     📝 Setting condition...
     🎨 Setting color...
     🧵 Setting material...
     💰 Setting price...
   ✓ Form filled successfully
   ```

6. **Soumission** :
   ```
   🚀 Submitting article...
   ✓ Article submitted: https://www.vinted.fr/items/1234567890
   ✅ Article published successfully
   ```

7. **Nettoyage** :
   ```
   🗑️  Deleted temp file: vinted-1234567890-abc.jpg
   🗑️  Deleted temp file: vinted-1234567891-def.jpg
   ✓ Browser closed
   ```

### 4.3 Que surveiller pendant l'exécution ?

**Dans la fenêtre du navigateur :**
- ✅ La page Vinted se charge
- ✅ La connexion se fait automatiquement
- ✅ Le formulaire de création d'article s'ouvre
- ✅ Les photos apparaissent
- ✅ Les champs se remplissent un par un
- ✅ Le formulaire est soumis
- ✅ Tu arrives sur la page de l'article publié

**Dans le terminal :**
- ✅ Pas d'erreurs rouges
- ✅ Tous les steps affichent "✓"
- ✅ L'URL Vinted finale est affichée

---

## 🔍 Étape 5 : Vérifier les Résultats

### 5.1 Vérifier dans la Base de Données

```sql
-- Vérifier le job
SELECT
  id,
  status,
  vinted_url,
  error_message,
  updated_at
FROM publication_jobs
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu :**
- `status` = `'success'`
- `vinted_url` = `'https://www.vinted.fr/items/...'`
- `error_message` = `null`

```sql
-- Vérifier l'article
SELECT
  id,
  title,
  status,
  vinted_url,
  published_at
FROM articles
WHERE id = 'ID_DE_TON_ARTICLE';
```

**Résultat attendu :**
- `status` = `'published'`
- `vinted_url` = `'https://www.vinted.fr/items/...'`
- `published_at` = Date et heure de la publication

### 5.2 Vérifier sur Vinted

1. Ouvre l'URL Vinted retournée par le worker
2. Vérifie que l'article est bien publié :
   - ✅ Titre correct
   - ✅ Description correcte
   - ✅ Prix correct
   - ✅ Photos affichées
   - ✅ Toutes les informations correctes

3. Va sur ton profil Vinted :
   - https://www.vinted.fr/member/profile

4. Tu devrais voir ton article dans "Mes articles"

---

## ❌ Que Faire en Cas d'Erreur ?

### Erreur : "Login failed"

**Symptômes :**
```
❌ Login failed - please check credentials
```

**Solutions :**
1. Vérifie que l'email et le mot de passe sont corrects dans `.env`
2. Essaie de te connecter manuellement sur Vinted
3. Vinted a peut-être changé la page de login :
   - Va sur https://www.vinted.fr/member/login
   - Inspecte les champs (F12)
   - Note les vrais `name` des inputs
   - Mets à jour `vintedClient.ts` ligne 113-114

### Erreur : "Photo upload failed"

**Symptômes :**
```
❌ Failed to download photo https://...
```

**Solutions :**
1. Vérifie que les photos existent dans Supabase Storage
2. Vérifie que les URLs sont accessibles publiquement
3. Teste l'URL dans ton navigateur

**Vérification :**
```sql
SELECT photos FROM articles WHERE id = 'TON_ID';
```

Les URLs doivent commencer par `https://qgjbouumpuhodhcwpfvl.supabase.co/storage/...`

### Erreur : "Could not find field"

**Symptômes :**
```
⚠️  Could not find field with selectors: input[name="title"]...
```

**Solution :**
Vinted a changé son interface. Tu dois inspecter la page :

1. En mode `HEADLESS=false`, quand le formulaire s'ouvre
2. Clique droit sur le champ qui ne se remplit pas
3. "Inspecter l'élément"
4. Note le `name`, `id` ou `class` de l'input
5. Ajoute-le dans `vintedClient.ts` dans les sélecteurs

**Exemple :**
Si tu trouves `<input id="item_title">`, ajoute :
```typescript
await this.fillFieldSafely(
  'input[name="title"], input[id="item_title"], input[id*="title"]',
  article.title
);
```

### Erreur : "Form submission failed"

**Symptômes :**
```
❌ Article submission failed: Timeout
```

**Solutions :**
1. Le bouton submit a peut-être changé
2. Inspecte le bouton "Publier" sur Vinted
3. Mets à jour le sélecteur dans `submitArticle()` ligne 268

---

## 🎯 Tests Supplémentaires

### Test 2 : Publication Multiple

Une fois le premier test réussi, teste avec plusieurs articles :

```sql
-- Créer 3 jobs espacés de 2 minutes
INSERT INTO publication_jobs (article_id, run_at, status)
VALUES
  ('ARTICLE_1', NOW(), 'pending'),
  ('ARTICLE_2', NOW() + INTERVAL '2 minutes', 'pending'),
  ('ARTICLE_3', NOW() + INTERVAL '4 minutes', 'pending');
```

Puis lance :
```bash
npm run dev
```

Le worker va traiter les 3 jobs les uns après les autres.

### Test 3 : Mode Headless (Production)

Une fois que tout fonctionne en mode visible :

```bash
npm run build
npm start
```

Le navigateur s'exécutera en arrière-plan (headless).

---

## 📊 Monitoring

### Voir les logs en temps réel

```bash
# Si tu utilises systemd (serveur)
sudo journalctl -u easyvinted-worker -f

# Si tu utilises cron
tail -f /var/log/easyvinted.log
```

### Requêtes SQL utiles

**Voir tous les jobs récents :**
```sql
SELECT
  j.id,
  j.status,
  j.created_at,
  j.run_at,
  j.vinted_url,
  j.error_message,
  a.title
FROM publication_jobs j
JOIN articles a ON j.article_id = a.id
ORDER BY j.created_at DESC
LIMIT 10;
```

**Voir les jobs échoués :**
```sql
SELECT
  j.id,
  j.error_message,
  j.created_at,
  a.title
FROM publication_jobs j
JOIN articles a ON j.article_id = a.id
WHERE j.status = 'failed'
ORDER BY j.created_at DESC;
```

**Voir les articles publiés aujourd'hui :**
```sql
SELECT
  title,
  price,
  vinted_url,
  published_at
FROM articles
WHERE status = 'published'
  AND published_at::date = CURRENT_DATE
ORDER BY published_at DESC;
```

---

## ✅ Checklist de Test

Avant de considérer le test réussi, vérifie :

- [ ] Le worker se connecte à Vinted
- [ ] Les photos sont téléchargées depuis Supabase
- [ ] Les photos sont uploadées vers Vinted
- [ ] Le titre est rempli
- [ ] La description est remplie
- [ ] La marque est remplie
- [ ] La catégorie est sélectionnée
- [ ] La taille est remplie
- [ ] L'état est sélectionné
- [ ] La couleur est remplie
- [ ] La matière est remplie
- [ ] Le prix est rempli
- [ ] Le formulaire est soumis
- [ ] L'URL Vinted est récupérée
- [ ] Le job passe en `status = 'success'`
- [ ] L'article passe en `status = 'published'`
- [ ] L'URL Vinted est enregistrée dans la base
- [ ] L'article est visible sur Vinted
- [ ] Les fichiers temporaires sont supprimés

---

## 🎉 Si Tout Fonctionne

**Félicitations !** Le worker est opérationnel. Tu peux maintenant :

1. **Déployer sur un serveur** (VPS Hetzner, DigitalOcean, etc.)
2. **Configurer un cron job** pour exécuter automatiquement
3. **Planifier des publications** depuis l'interface EasyVinted

---

## 🆘 Besoin d'Aide ?

Si tu rencontres un problème :

1. **Lis attentivement les logs** dans le terminal
2. **Prends des screenshots** du navigateur en mode visible
3. **Note le message d'erreur exact**
4. **Vérifie la base de données** (table `publication_jobs`)

Les logs te diront exactement où ça bloque !
