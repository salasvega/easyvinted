# 🚀 Guide d'Implémentation - Publication Planifiée sur Vinted

## 📊 État Actuel du Projet

### ✅ Ce qui est DÉJÀ en place

#### 1. Base de données Supabase
- ✅ Table `articles` complète avec tous les champs nécessaires
- ✅ Table `publication_jobs` créée et fonctionnelle
- ✅ RLS (Row Level Security) configurée sur toutes les tables
- ✅ Indexes optimisés pour les requêtes du worker

#### 2. Worker EasyVinted
- ✅ Code complet dans `easyvinted-worker/`
- ✅ Client Playwright pour automatisation Vinted
- ✅ Gestion des sessions (sauvegarde/restauration)
- ✅ Processeur de jobs avec gestion d'erreurs
- ✅ Client Supabase configuré
- ✅ Types TypeScript définis

#### 3. Frontend
- ✅ Interface de création d'articles
- ✅ Gestion des photos avec nouvelle structure organisée
- ✅ Modal de planification (ScheduleModal)
- ✅ Statuts d'articles (draft/ready/scheduled/published/sold)

---

## ⚠️ PROBLÈMES CRITIQUES À CORRIGER

### 🔴 Problème #1 : Gestion des Photos

**Situation actuelle :**
- Les photos sont stockées dans Supabase Storage
- Format : URLs publiques (`https://...supabase.co/storage/v1/object/public/article-photos/...`)
- Le worker attend des **chemins locaux** (ex: `/tmp/photo.jpg`)

**Impact :**
- ❌ Le worker ne peut PAS uploader les photos vers Vinted
- ❌ Vinted a besoin de fichiers physiques, pas d'URLs

**Solution requise :**
Le worker doit télécharger les photos depuis Supabase Storage avant de les uploader vers Vinted.

### 🔴 Problème #2 : Sélecteurs Vinted à Vérifier

**Situation :**
- Les sélecteurs CSS dans `vintedClient.ts` peuvent être obsolètes
- Vinted change régulièrement son interface
- Exemple actuel : `input[name="title"]`, `textarea[name="description"]`

**Impact :**
- ❌ Risque d'échec de publication
- ❌ Le formulaire ne sera pas rempli correctement

**Solution requise :**
Tester et mettre à jour les sélecteurs CSS en inspectant la vraie page Vinted.

### 🟡 Problème #3 : Catégories Vinted

**Situation :**
- Le frontend a des catégories (`main_category`, `subcategory`, `item_category`)
- Le worker ne gère PAS les catégories dans le formulaire

**Impact :**
- ⚠️ Les articles seront publiés sans catégorie ou avec une catégorie par défaut

**Solution requise :**
Ajouter la logique de sélection de catégories dans `fillArticleForm()`.

### 🟡 Problème #4 : Champ `vinted_url` manquant

**Situation :**
- La table `articles` N'A PAS de colonne `vinted_url`
- Le worker essaie de mettre à jour ce champ après publication

**Impact :**
- ❌ Erreur SQL lors de la mise à jour de l'article

**Solution requise :**
Ajouter une migration pour créer la colonne `vinted_url`.

---

## 🛠️ ÉTAPES DÉTAILLÉES D'IMPLÉMENTATION

## Phase 1 : Corrections Critiques (OBLIGATOIRE)

### Étape 1.1 : Ajouter la colonne `vinted_url` à la table `articles`

**Fichier :** Nouvelle migration Supabase

```sql
-- Migration: add_vinted_url_to_articles.sql

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS vinted_url TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_vinted_url ON articles(vinted_url);
```

**Actions :**
1. Créer la migration dans `supabase/migrations/`
2. Appliquer la migration avec l'outil MCP Supabase

---

### Étape 1.2 : Télécharger les photos depuis Supabase Storage

**Fichier à modifier :** `easyvinted-worker/src/vintedClient.ts`

**Ajouter cette fonction :**

```typescript
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

private async downloadPhotoToTemp(photoUrl: string): Promise<string> {
  console.log(`📥 Downloading photo: ${photoUrl}`);

  const response = await fetch(photoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const fileName = `vinted-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const tempPath = join(tmpdir(), fileName);

  await writeFile(tempPath, Buffer.from(buffer));
  console.log(`✓ Photo saved to: ${tempPath}`);

  return tempPath;
}
```

**Modifier la méthode `publishArticle()` :**

```typescript
async publishArticle(article: Article): Promise<PublicationResult> {
  if (!this.page) throw new Error('Browser not initialized');

  const downloadedPhotos: string[] = [];

  try {
    console.log(`\n📦 Publishing article: ${article.title}`);

    const isAuthenticated = await this.checkAuthentication();
    if (!isAuthenticated) {
      await this.login();
    }

    console.log('📝 Navigating to new item page...');
    await this.page.goto('https://www.vinted.fr/items/new', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await this.page.waitForTimeout(2000);

    // Télécharger les photos depuis Supabase Storage
    if (article.photos && article.photos.length > 0) {
      console.log(`📥 Downloading ${article.photos.length} photos from Supabase...`);

      for (const photoUrl of article.photos) {
        const localPath = await this.downloadPhotoToTemp(photoUrl);
        downloadedPhotos.push(localPath);
      }

      await this.uploadPhotos(downloadedPhotos);
    }

    await this.fillArticleForm(article);
    const vintedUrl = await this.submitArticle();

    console.log(`✅ Article published successfully: ${vintedUrl}`);

    // Nettoyer les fichiers temporaires
    await this.cleanupTempFiles(downloadedPhotos);

    return {
      success: true,
      vintedUrl,
    };
  } catch (error) {
    // Nettoyer les fichiers temporaires en cas d'erreur
    await this.cleanupTempFiles(downloadedPhotos);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to publish article: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

private async cleanupTempFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await unlink(file);
      console.log(`🗑️  Deleted temp file: ${file}`);
    } catch (error) {
      console.warn(`⚠️  Could not delete temp file ${file}:`, error);
    }
  }
}
```

**Installation de dépendances supplémentaires :**

```bash
cd easyvinted-worker
npm install node-fetch@2
```

---

### Étape 1.3 : Vérifier et Mettre à Jour les Sélecteurs Vinted

**Action manuelle OBLIGATOIRE :**

1. **Ouvrir Vinted en mode développeur :**
   - Va sur https://www.vinted.fr/items/new
   - Connecte-toi avec ton compte
   - Ouvre les DevTools (F12)
   - Inspecte chaque champ du formulaire

2. **Vérifier ces sélecteurs :**

| Champ | Sélecteur actuel | À vérifier |
|-------|------------------|------------|
| Titre | `input[name="title"]` | ✅ ou ❌ |
| Description | `textarea[name="description"]` | ✅ ou ❌ |
| Marque | `input[name="brand"]` | ✅ ou ❌ |
| Taille | `input[name="size"]` | ✅ ou ❌ |
| État | `select[name="status"]` | ✅ ou ❌ |
| Couleur | `input[name="color"]` | ✅ ou ❌ |
| Matière | `input[name="material"]` | ✅ ou ❌ |
| Prix | `input[name="price"]` | ✅ ou ❌ |
| Upload photos | `input[type="file"][accept*="image"]` | ✅ ou ❌ |
| Bouton submit | `button[type="submit"]` | ✅ ou ❌ |

3. **Mettre à jour `vintedClient.ts` si nécessaire**

---

### Étape 1.4 : Ajouter la Gestion des Catégories

**Fichier à modifier :** `easyvinted-worker/src/vintedClient.ts`

**Dans la méthode `fillArticleForm()`, ajouter :**

```typescript
// Après la gestion du titre, description, etc.

// Gérer la catégorie principale
if (article.main_category) {
  console.log(`📂 Setting category: ${article.main_category}`);

  // Option 1 : Si Vinted utilise un select
  await this.page.selectOption('select[name="catalog_id"]', { label: article.main_category });
  await this.page.waitForTimeout(1000);

  // Sous-catégorie
  if (article.subcategory) {
    await this.page.selectOption('select[name="category_id"]', { label: article.subcategory });
    await this.page.waitForTimeout(1000);
  }
}
```

**⚠️ Note :** Les sélecteurs de catégories varient. Inspecter la page Vinted pour trouver les bons.

---

## Phase 2 : Configuration du Worker (REQUIS)

### Étape 2.1 : Préparer l'Environnement

**Sur ton serveur/VPS ou machine locale :**

```bash
cd easyvinted-worker

# Créer le fichier .env
cp .env.example .env

# Éditer avec tes vraies credentials
nano .env
```

**Contenu du `.env` :**

```env
# Supabase
SUPABASE_URL=https://qgjbouumpuhodhcwpfvl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vinted
VINTED_EMAIL=monadressemailssv1@gmail.com
VINTED_PASSWORD=Chilaquiles1+

# Configuration
HEADLESS=true
LOG_LEVEL=info
```

---

### Étape 2.2 : Installer les Dépendances

```bash
cd easyvinted-worker
npm install
```

Cela va automatiquement installer Playwright et Chromium.

---

### Étape 2.3 : Test Initial en Mode Développement

**Important :** Lance d'abord en mode visible pour voir ce qui se passe !

```bash
HEADLESS=false npm run dev
```

**Que regarder :**
- ✅ Le navigateur s'ouvre
- ✅ Vinted se charge
- ✅ La connexion fonctionne
- ✅ Le formulaire se remplit
- ❌ Identifier les erreurs

---

## Phase 3 : Intégration Frontend (OPTIONNEL mais RECOMMANDÉ)

### Étape 3.1 : Créer un Job de Publication depuis le Frontend

**Quand un utilisateur planifie une publication :**

```typescript
// Dans ScheduleModal.tsx ou ArticleFormPage.tsx

const handleSchedulePublication = async (scheduledDate: Date) => {
  try {
    const { error } = await supabase
      .from('publication_jobs')
      .insert({
        article_id: articleId,
        run_at: scheduledDate.toISOString(),
        status: 'pending'
      });

    if (error) throw error;

    // Mettre à jour l'article
    await supabase
      .from('articles')
      .update({
        status: 'scheduled',
        scheduled_for: scheduledDate.toISOString()
      })
      .eq('id', articleId);

    console.log('✅ Publication planifiée avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
```

---

### Étape 3.2 : Afficher le Statut des Jobs

**Créer une page de monitoring :**

```typescript
// src/pages/PublicationJobsPage.tsx

const [jobs, setJobs] = useState([]);

useEffect(() => {
  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('publication_jobs')
      .select(`
        *,
        articles (title, photos, price)
      `)
      .order('run_at', { ascending: false });

    if (!error) setJobs(data);
  };

  fetchJobs();
}, []);
```

---

## Phase 4 : Déploiement en Production

### Étape 4.1 : Déploiement sur un VPS (Hetzner, DigitalOcean, etc.)

**Option A : Cron Job (Simple)**

```bash
# Sur le serveur
crontab -e

# Exécuter toutes les 5 minutes
*/5 * * * * cd /home/user/easyvinted-worker && /usr/bin/node dist/index.js >> /var/log/easyvinted.log 2>&1
```

**Option B : Systemd Service (Recommandé)**

Créer `/etc/systemd/system/easyvinted-worker.service` :

```ini
[Unit]
Description=EasyVinted Worker
After=network.target

[Service]
Type=simple
User=ton-utilisateur
WorkingDirectory=/home/ton-utilisateur/easyvinted-worker
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=300
StandardOutput=append:/var/log/easyvinted-worker.log
StandardError=append:/var/log/easyvinted-worker-error.log

[Install]
WantedBy=multi-user.target
```

Activer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable easyvinted-worker
sudo systemctl start easyvinted-worker
```

---

### Étape 4.2 : Monitoring et Logs

**Consulter les logs :**

```bash
# Logs du service
sudo journalctl -u easyvinted-worker -f

# Logs du fichier
tail -f /var/log/easyvinted-worker.log
```

**Vérifier la base de données :**

```sql
-- Voir tous les jobs
SELECT * FROM publication_jobs ORDER BY created_at DESC LIMIT 10;

-- Voir les jobs en échec
SELECT * FROM publication_jobs WHERE status = 'failed';

-- Voir les articles publiés
SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC;
```

---

## 🎯 CHECKLIST FINALE

### Avant de lancer en production :

- [ ] ✅ Colonne `vinted_url` ajoutée à la table `articles`
- [ ] ✅ Fonction de téléchargement des photos implémentée
- [ ] ✅ Sélecteurs Vinted vérifiés et à jour
- [ ] ✅ Gestion des catégories ajoutée (si nécessaire)
- [ ] ✅ Test en mode `HEADLESS=false` réussi
- [ ] ✅ Publication manuelle test OK
- [ ] ✅ Worker déployé sur le serveur
- [ ] ✅ Cron job ou systemd service configuré
- [ ] ✅ Logs accessibles et monitored
- [ ] ✅ Intégration frontend testée

---

## 🚨 LIMITATIONS & AVERTISSEMENTS

### Limites de Vinted

1. **Pas d'API officielle**
   - Vinted peut détecter l'automatisation
   - Risque de limitation ou blocage du compte

2. **Recommandations de sécurité :**
   - Maximum 10-15 publications par jour
   - Délai de 5-10 minutes entre chaque publication
   - Ne pas publier la nuit (comportement suspect)

3. **Gestion des erreurs :**
   - Si un job échoue, il reste en `status = 'failed'`
   - Tu dois le réessayer manuellement ou créer un nouveau job

### Sécurité des Credentials

- ⚠️ Ne JAMAIS committer le fichier `.env`
- ⚠️ Utiliser la `SERVICE_ROLE_KEY` uniquement côté serveur
- ⚠️ Stocker les credentials Vinted de manière sécurisée

---

## 📞 Support & Debugging

### Erreurs courantes

**"Article not found"**
- L'article_id dans publication_jobs n'existe pas
- Vérifier que l'article existe dans la table articles

**"Login failed"**
- Email/mot de passe incorrect
- Vinted a changé la page de login
- Mettre à jour les sélecteurs

**"Photo upload failed"**
- Les photos n'ont pas pu être téléchargées depuis Supabase
- Vérifier les URLs et les permissions

**"Form submission failed"**
- Les sélecteurs CSS sont obsolètes
- Vinted a changé son interface
- Inspecter la page et mettre à jour

---

## 🎉 RÉSUMÉ

**Ce qui fonctionne DÉJÀ :**
- ✅ Base de données complète
- ✅ Worker fonctionnel (code complet)
- ✅ Interface frontend

**Ce qu'il FAUT faire :**
1. Ajouter `vinted_url` à la table articles
2. Implémenter le téléchargement des photos
3. Vérifier les sélecteurs Vinted
4. Tester en mode dev
5. Déployer sur un serveur

**Temps estimé : 4-6 heures**

---

**Prochaine étape recommandée :** Commencer par l'Étape 1.1 (ajouter la colonne vinted_url)
