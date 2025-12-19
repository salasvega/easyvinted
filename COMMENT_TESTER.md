# 🧪 Comment Tester le Worker EasyVinted

## 📍 Tu es ici

Tous les correctifs ont été appliqués. Le worker est prêt à être testé !

---

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Ouvre un terminal et va dans le dossier worker

```bash
cd easyvinted-worker
```

### 2️⃣ Installe les dépendances

```bash
npm install
```

Cela va prendre 2-3 minutes (télécharge Chromium).

### 3️⃣ Crée un article de test

**Option A - Via l'app web (Recommandé) :**
1. Ouvre http://localhost:5173
2. Va dans "Créer un article"
3. Remplis :
   - Titre : "Test Publication"
   - Prix : 15
   - Ajoute 2-3 photos
   - Remplis les autres champs
4. Enregistre comme brouillon

**Option B - Utilise un article existant :**
Si tu as déjà des articles, passe directement à l'étape suivante.

### 4️⃣ Crée un job de test automatiquement

```bash
npm run test:create-job
```

Cela va :
- Chercher tes articles disponibles
- Créer un job de publication pour le premier
- Afficher les détails du job

### 5️⃣ Lance le worker en mode visible

```bash
HEADLESS=false npm run dev
```

**Ce qui va se passer :**
- ✅ Une fenêtre de navigateur Chrome s'ouvre
- ✅ Le worker se connecte à Vinted
- ✅ Il ouvre le formulaire de création d'article
- ✅ Il télécharge les photos depuis Supabase
- ✅ Il remplit tous les champs automatiquement
- ✅ Il soumet le formulaire
- ✅ Il récupère l'URL Vinted

**Regarde les deux :**
- **La fenêtre du navigateur** : tu vois les actions en temps réel
- **Le terminal** : tu vois les logs détaillés

### 6️⃣ Vérifie les résultats

```bash
npm run test:check-jobs
```

Tu verras les statistiques et l'état de tous tes jobs.

---

## 📋 Ce Que Tu Vas Voir

### Dans le Terminal

```
╔════════════════════════════════════════╗
║     EasyVinted Worker v1.0.0          ║
╚════════════════════════════════════════╝

✓ Environment variables loaded
✓ Supabase URL: https://qgjbouumpuhodhcwpfvl...
✓ Vinted Email: monadressemailssv1@gmail.com

=================================
🚀 Starting job processor...
=================================

📋 Fetching pending jobs...
📊 Found 1 pending job(s)

---------------------------------
🔄 Processing job: abc-123...
   Article: def-456...
---------------------------------

🌐 Launching Chromium browser...
✓ Browser initialized
🔐 Checking authentication status...
✓ Already authenticated

📝 Navigating to new item page...

📥 Downloading 3 photos from Supabase...
📥 Downloading photo: https://qgjbouumpuhodhcwpfvl...
✓ Photo saved to: /tmp/vinted-1234567890-abc.jpg
[...]

📷 Uploading 3 photos...
✓ Uploaded 3 photos

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

🚀 Submitting article...
✓ Article submitted: https://www.vinted.fr/items/1234567890
✅ Article published successfully

🗑️  Deleted temp file: vinted-1234567890-abc.jpg
[...]

✓ Job abc-123 completed successfully

✅ Worker completed successfully
```

### Dans le Navigateur

Tu vas voir :
1. La page Vinted qui se charge
2. La connexion automatique (si pas déjà connecté)
3. Le formulaire de création d'article
4. Les photos qui apparaissent une par une
5. Les champs qui se remplissent automatiquement
6. Le bouton "Publier" qui est cliqué
7. La page de l'article publié

---

## ✅ Critères de Succès

Le test est réussi si :

- [ ] Le navigateur s'ouvre sans erreur
- [ ] La connexion à Vinted fonctionne
- [ ] Les photos sont téléchargées (tu vois les logs)
- [ ] Les photos sont uploadées vers Vinted
- [ ] Tous les champs sont remplis
- [ ] Le formulaire est soumis
- [ ] Tu arrives sur la page de l'article publié
- [ ] L'URL Vinted est affichée dans les logs
- [ ] Le job passe en `status = 'success'` dans la base
- [ ] L'article est visible sur ton profil Vinted

---

## ❌ Problèmes Courants

### "No articles found"

**Solution :** Crée un article dans l'app avec au moins 1 photo.

### "Login failed"

**Solution :** Vérifie les credentials dans `easyvinted-worker/.env`
```bash
cd easyvinted-worker
cat .env | grep VINTED
```

### Le formulaire ne se remplit pas correctement

**Normal si Vinted a changé son interface.**

**Solution :**
1. Laisse le navigateur ouvert
2. Clique droit sur un champ vide
3. "Inspecter l'élément"
4. Note le `name`, `id` ou `class`
5. Ajoute-le dans `src/vintedClient.ts`

**Consulte le guide détaillé :** `easyvinted-worker/TESTING_GUIDE.md`

### "Photo upload failed"

**Solution :** Vérifie que les photos sont bien dans Supabase Storage :
```sql
SELECT id, title, photos FROM articles WHERE id = 'ton-article-id';
```

Les URLs doivent commencer par `https://qgjbouumpuhodhcwpfvl.supabase.co/storage/...`

---

## 🔧 Commandes Utiles

### Créer un job de test
```bash
cd easyvinted-worker
npm run test:create-job
```

### Vérifier l'état des jobs
```bash
npm run test:check-jobs
```

### Lancer le worker (mode visible - pour debug)
```bash
HEADLESS=false npm run dev
```

### Lancer le worker (mode production - sans fenêtre)
```bash
npm run build
npm start
```

### Voir les articles disponibles (SQL)
```sql
SELECT id, title, status, photos
FROM articles
WHERE status IN ('draft', 'ready')
ORDER BY created_at DESC;
```

### Voir les jobs (SQL)
```sql
SELECT
  j.id,
  j.status,
  j.vinted_url,
  j.error_message,
  a.title
FROM publication_jobs j
JOIN articles a ON j.article_id = a.id
ORDER BY j.created_at DESC
LIMIT 10;
```

---

## 📚 Documentation Complète

Si tu veux plus de détails, consulte :

1. **Guide de démarrage rapide** : `easyvinted-worker/QUICK_START.md`
2. **Guide de test détaillé** : `easyvinted-worker/TESTING_GUIDE.md`
3. **Documentation complète** : `easyvinted-worker/README.md`
4. **Changelog des modifications** : `easyvinted-worker/CHANGELOG.md`

---

## 🎯 Étapes Suivantes

### Une fois le test réussi :

1. **Teste avec plusieurs articles**
   ```bash
   npm run test:create-job  # Répète 2-3 fois
   npm run dev
   ```

2. **Déploie sur un serveur**
   - Utilise Hetzner, DigitalOcean, ou n'importe quel VPS
   - Consulte `DEPLOYMENT.md` ou `HETZNER-DEPLOYMENT.md`

3. **Configure l'automatisation**
   - Cron job : Exécute toutes les 5 minutes
   - Systemd : Service qui tourne en continu

4. **Intègre avec le frontend**
   - Les utilisateurs pourront planifier des publications depuis l'app
   - Le worker traitera automatiquement les jobs

---

## 🆘 Besoin d'Aide ?

1. **Lis les logs** - Ils sont très détaillés et te diront exactement ce qui se passe
2. **Lance en mode visible** - `HEADLESS=false` pour voir ce que fait le navigateur
3. **Vérifie la base de données** - Les tables `publication_jobs` et `articles`
4. **Consulte les guides** - Tout est documenté dans `easyvinted-worker/`

---

**Prêt ? Lance le premier test !** 🚀

```bash
cd easyvinted-worker
npm install
npm run test:create-job
HEADLESS=false npm run dev
```
