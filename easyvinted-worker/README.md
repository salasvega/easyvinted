# EasyVinted Worker

Background worker pour publier automatiquement des articles sur Vinted depuis une base de données Supabase en utilisant Playwright.

## 🎯 Objectif

Ce worker tourne sur un serveur VPS (ou votre machine locale) et traite automatiquement les jobs de publication Vinted en :

1. Lisant la table `publication_jobs` dans Supabase
2. Récupérant les articles à publier
3. Utilisant Playwright + Chromium pour automatiser la publication sur Vinted
4. Mettant à jour automatiquement la base de données avec les résultats

## 📋 Prérequis

- Node.js >= 18
- Un compte Vinted actif
- Une base de données Supabase configurée avec les tables nécessaires
- Un serveur Linux/VPS ou machine locale pour exécuter le worker

## 🚀 Installation

### 1. Cloner ou copier le projet

```bash
cd easyvinted-worker
```

### 2. Installer les dépendances

```bash
npm install
```

Cela installera automatiquement Playwright et Chromium.

### 3. Configuration des variables d'environnement

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Editez le fichier `.env` avec vos credentials :

```env
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Vinted Credentials
VINTED_EMAIL=votre-email@example.com
VINTED_PASSWORD=votre-mot-de-passe

# Worker Configuration (optional)
HEADLESS=true
LOG_LEVEL=info
```

**⚠️ Sécurité** : Ne jamais committer le fichier `.env` ! Il contient vos credentials.

## 📊 Structure de la base de données

### Table `publication_jobs`

Cette table doit être créée dans Supabase. Utilisez la migration fournie :

```sql
-- Voir: ../supabase/migrations/20251116000000_create_publication_jobs_table.sql
```

Structure :
- `id` (uuid) - ID unique du job
- `article_id` (uuid) - Référence à l'article
- `status` (text) - 'pending' | 'running' | 'success' | 'failed'
- `run_at` (timestamptz) - Quand exécuter le job
- `vinted_url` (text, nullable) - URL Vinted après publication
- `error_message` (text, nullable) - Message d'erreur si échec
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 🎮 Utilisation

### Mode développement (une exécution)

```bash
npm run dev
```

Exécute le worker une fois en mode visible (headless=false) avec logs détaillés.

### Mode production (une exécution)

```bash
npm run build
npm start
```

Compile le TypeScript et exécute le worker en mode headless.

### Déploiement avec Cron

Pour exécuter automatiquement toutes les 5 minutes :

```bash
crontab -e
```

Ajoutez cette ligne :

```bash
*/5 * * * * cd /chemin/vers/easyvinted-worker && /usr/bin/node dist/index.js >> logs/worker.log 2>&1
```

### Déploiement avec systemd (recommandé pour production)

Créez un fichier `/etc/systemd/system/easyvinted-worker.service` :

```ini
[Unit]
Description=EasyVinted Worker
After=network.target

[Service]
Type=simple
User=votre-utilisateur
WorkingDirectory=/chemin/vers/easyvinted-worker
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=60
StandardOutput=append:/var/log/easyvinted-worker.log
StandardError=append:/var/log/easyvinted-worker-error.log

[Install]
WantedBy=multi-user.target
```

Activez et démarrez le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable easyvinted-worker
sudo systemctl start easyvinted-worker
```

## 🔍 Fonctionnement détaillé

### Workflow complet

1. **Le worker démarre** (`src/index.ts`)
   - Charge les variables d'environnement
   - Vérifie que tous les credentials sont présents

2. **Récupération des jobs** (`src/supabaseClient.ts`)
   - Lit `publication_jobs` avec `status = 'pending'` et `run_at <= now()`
   - Trie par date de `run_at` (les plus anciens d'abord)

3. **Initialisation du navigateur** (`src/vintedClient.ts`)
   - Lance Chromium avec Playwright
   - Charge la session sauvegardée (si disponible)

4. **Pour chaque job** (`src/jobProcessor.ts`)
   - Met le job en `status = 'running'`
   - Récupère l'article depuis la table `articles`
   - Vérifie l'authentification Vinted
   - Publie l'article :
     - Upload des photos
     - Remplissage du formulaire
     - Soumission
     - Récupération de l'URL finale
   - Met à jour le job :
     - `status = 'success'` + `vinted_url`
     - Ou `status = 'failed'` + `error_message`
   - Met à jour l'article :
     - `status = 'published'`
     - `vinted_url = ...`

5. **Fermeture**
   - Le navigateur se ferme proprement
   - La session est sauvegardée pour la prochaine exécution

## 📁 Structure du projet

```
easyvinted-worker/
├── src/
│   ├── index.ts              # Point d'entrée principal
│   ├── types.ts              # Définitions TypeScript
│   ├── supabaseClient.ts     # Client Supabase + fonctions DB
│   ├── vintedClient.ts       # Client Playwright pour Vinted
│   └── jobProcessor.ts       # Logique de traitement des jobs
├── playwright-state/         # Session Vinted sauvegardée (gitignored)
├── dist/                     # Code compilé (gitignored)
├── .env                      # Variables d'environnement (gitignored)
├── .env.example              # Template pour .env
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Personnalisation

### Adapter les sélecteurs Vinted

Si Vinted change son interface, modifiez les sélecteurs dans `src/vintedClient.ts` :

```typescript
// Exemple : formulaire de titre
await this.page.fill('input[name="title"]', article.title);
```

Utilisez les DevTools de Chrome pour inspecter les éléments et trouver les bons sélecteurs.

### Gérer les photos

Actuellement, le code attend des **chemins locaux** dans `article.photos[]`.

Si vos photos sont sur Supabase Storage, vous devrez :

1. Télécharger les photos localement avant publication
2. Ou modifier `uploadPhotos()` pour gérer les URLs

### Ajouter des champs supplémentaires

Modifiez `fillArticleForm()` dans `src/vintedClient.ts` pour ajouter d'autres champs du formulaire Vinted.

## ⚠️ Limitations et avertissements

### Limites Vinted

- Vinted n'a **pas d'API officielle**
- Vinted peut détecter l'automatisation et limiter votre compte
- Respectez les limites raisonnables :
  - Maximum 10-15 publications par jour
  - Délais de 1-2 minutes entre chaque publication

### Session expirée

Si la session Vinted expire, le worker se reconnectera automatiquement.

Si la connexion échoue :
- Vérifiez vos credentials dans `.env`
- Supprimez `playwright-state/vinted-session.json`
- Lancez en mode `HEADLESS=false` pour voir l'écran

### Erreurs courantes

**"Article not found"**
- L'`article_id` dans `publication_jobs` n'existe pas dans `articles`

**"Login failed"**
- Email ou mot de passe incorrect
- Vinted a changé la page de login (mettez à jour les sélecteurs)

**"Photo upload failed"**
- Les chemins dans `article.photos[]` sont invalides
- Les fichiers n'existent pas sur le serveur

## 📊 Monitoring

### Logs

Le worker affiche des logs détaillés :

```
✓ Job completed successfully
❌ Job failed: error message
📊 Found 3 pending job(s)
```

### Base de données

Consultez la table `publication_jobs` pour voir l'état de chaque job :

```sql
SELECT * FROM publication_jobs ORDER BY created_at DESC LIMIT 10;
```

## 🔐 Sécurité

- **Service Role Key** : Utilisée uniquement côté serveur (jamais dans le frontend)
- **Credentials Vinted** : Stockés uniquement dans `.env` sur le serveur
- **Session file** : Contient les cookies Vinted, ne jamais partager

## 🤝 Contribution

Pour adapter ce worker à vos besoins :

1. Forkez ou copiez le projet
2. Modifiez les sélecteurs Vinted selon votre version
3. Ajustez la logique métier dans `jobProcessor.ts`
4. Testez en mode `dev` avant de déployer

## 📝 Licence

MIT

---

**Note** : Ce projet utilise l'automatisation web pour interagir avec Vinted. Utilisez-le de manière responsable et respectueuse des conditions d'utilisation de Vinted.
