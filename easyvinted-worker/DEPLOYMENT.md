# Guide de déploiement sur VPS

Ce guide détaille **toutes les étapes** pour déployer le worker EasyVinted sur un serveur VPS Linux.

## 📋 Prérequis

- Un VPS Linux (Ubuntu 20.04+ recommandé, Debian, ou CentOS)
- Accès SSH root ou sudo
- Minimum 1 GB RAM, 1 vCPU
- 10 GB d'espace disque

## 🚀 Étape 1 : Se connecter au VPS

```bash
ssh root@votre-ip-vps
# ou
ssh votre-utilisateur@votre-ip-vps
```

## 📦 Étape 2 : Installer Node.js 18+

### Sur Ubuntu/Debian

```bash
# Mettre à jour le système
sudo apt update
sudo apt upgrade -y

# Installer Node.js 18.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # Doit afficher v18.x ou supérieur
npm --version
```

### Sur CentOS/RHEL

```bash
# Installer Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Vérifier
node --version
npm --version
```

## 🔧 Étape 3 : Installer les dépendances système pour Playwright

Playwright (Chromium) nécessite des bibliothèques système :

```bash
# Ubuntu/Debian
sudo apt install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libatspi2.0-0

# OU installer directement via Playwright
npx playwright install-deps chromium
```

## 📁 Étape 4 : Créer l'utilisateur et le répertoire

Il est recommandé de ne PAS exécuter le worker en tant que root.

```bash
# Créer un utilisateur dédié
sudo useradd -m -s /bin/bash easyvinted

# Créer le répertoire du projet
sudo mkdir -p /opt/easyvinted-worker
sudo chown easyvinted:easyvinted /opt/easyvinted-worker

# Se connecter en tant que cet utilisateur
sudo su - easyvinted
```

## 📤 Étape 5 : Transférer les fichiers

### Option A : Via Git (recommandé)

```bash
cd /opt/easyvinted-worker

# Cloner votre repo
git clone https://github.com/votre-user/votre-repo.git .

# Ou initialiser et pousser depuis votre machine locale
# Sur votre machine locale :
cd easyvinted-worker
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-user/votre-repo.git
git push -u origin main

# Puis sur le VPS :
git clone https://github.com/votre-user/votre-repo.git .
```

### Option B : Via SCP (depuis votre machine locale)

```bash
# Depuis votre machine locale
cd /chemin/vers/votre/projet
scp -r easyvinted-worker/* easyvinted@votre-ip-vps:/opt/easyvinted-worker/
```

### Option C : Via SFTP (GUI)

Utilisez FileZilla ou WinSCP pour transférer les fichiers.

## ⚙️ Étape 6 : Installer les dépendances Node.js

```bash
cd /opt/easyvinted-worker

# Installer les packages
npm install

# Cela installera automatiquement Chromium via le postinstall hook
# Si nécessaire, forcer l'installation de Chromium :
npx playwright install chromium
```

## 🔐 Étape 7 : Configurer les variables d'environnement

```bash
cd /opt/easyvinted-worker

# Créer le fichier .env
nano .env
```

Collez vos credentials :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...votre-service-role-key
VINTED_EMAIL=votre-email@example.com
VINTED_PASSWORD=votre-mot-de-passe-vinted
HEADLESS=true
LOG_LEVEL=info
```

**Sécurité** : Protégez le fichier .env

```bash
chmod 600 .env
```

## 🏗️ Étape 8 : Compiler le projet

```bash
cd /opt/easyvinted-worker
npm run build
```

Vérifiez que le dossier `dist/` a été créé avec les fichiers `.js`.

## ✅ Étape 9 : Tester manuellement

Avant d'automatiser, testez que tout fonctionne :

```bash
cd /opt/easyvinted-worker
npm start
```

Vous devriez voir :

```
╔════════════════════════════════════════╗
║     EasyVinted Worker v1.0.0          ║
║  Automated Vinted Publication Worker  ║
╚════════════════════════════════════════╝

✓ Environment variables loaded
✓ Supabase URL: https://...
✓ Vinted Email: ...
...
```

Si tout fonctionne, passez à l'automatisation.

## 🤖 Étape 10 : Automatiser avec systemd (RECOMMANDÉ)

### A. Créer le service systemd

```bash
# Revenir en root ou utiliser sudo
exit  # Quitter l'utilisateur easyvinted

sudo nano /etc/systemd/system/easyvinted-worker.service
```

Collez cette configuration :

```ini
[Unit]
Description=EasyVinted Worker - Automated Vinted Publication
After=network.target

[Service]
Type=simple
User=easyvinted
Group=easyvinted
WorkingDirectory=/opt/easyvinted-worker
ExecStart=/usr/bin/node /opt/easyvinted-worker/dist/index.js
Restart=on-failure
RestartSec=300
StandardOutput=append:/var/log/easyvinted-worker.log
StandardError=append:/var/log/easyvinted-worker-error.log
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

### B. Créer les fichiers de logs

```bash
sudo touch /var/log/easyvinted-worker.log
sudo touch /var/log/easyvinted-worker-error.log
sudo chown easyvinted:easyvinted /var/log/easyvinted-worker*.log
```

### C. Activer et démarrer le service

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service au démarrage
sudo systemctl enable easyvinted-worker

# Démarrer le service
sudo systemctl start easyvinted-worker

# Vérifier le statut
sudo systemctl status easyvinted-worker
```

### D. Timer systemd (exécution périodique)

Pour exécuter le worker toutes les 5 minutes au lieu d'en continu :

**Créer le timer** :

```bash
sudo nano /etc/systemd/system/easyvinted-worker.timer
```

```ini
[Unit]
Description=EasyVinted Worker Timer
Requires=easyvinted-worker.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=easyvinted-worker.service

[Install]
WantedBy=timers.target
```

**Modifier le service** pour qu'il soit de type `oneshot` :

```bash
sudo nano /etc/systemd/system/easyvinted-worker.service
```

Changez `Type=simple` en `Type=oneshot`.

**Activer le timer** :

```bash
sudo systemctl daemon-reload
sudo systemctl enable easyvinted-worker.timer
sudo systemctl start easyvinted-worker.timer

# Vérifier
sudo systemctl list-timers
```

## 🔄 Alternative : Automatiser avec Cron

Si vous préférez cron :

```bash
# En tant qu'utilisateur easyvinted
sudo su - easyvinted
crontab -e
```

Ajoutez cette ligne (exécution toutes les 5 minutes) :

```bash
*/5 * * * * cd /opt/easyvinted-worker && /usr/bin/node dist/index.js >> /var/log/easyvinted-worker.log 2>&1
```

## 📊 Étape 11 : Monitoring et logs

### Voir les logs en temps réel

```bash
# Avec systemd
sudo journalctl -u easyvinted-worker -f

# Ou via les fichiers de logs
tail -f /var/log/easyvinted-worker.log
tail -f /var/log/easyvinted-worker-error.log
```

### Vérifier le statut

```bash
sudo systemctl status easyvinted-worker
```

### Redémarrer le service

```bash
sudo systemctl restart easyvinted-worker
```

### Arrêter le service

```bash
sudo systemctl stop easyvinted-worker
```

## 🔧 Étape 12 : Maintenance

### Mettre à jour le worker

```bash
# Se connecter en tant qu'easyvinted
sudo su - easyvinted
cd /opt/easyvinted-worker

# Pull les dernières modifications
git pull

# Réinstaller les dépendances si nécessaire
npm install

# Recompiler
npm run build

# Redémarrer le service
exit  # Revenir en root
sudo systemctl restart easyvinted-worker
```

### Rotation des logs

Créer un fichier de rotation :

```bash
sudo nano /etc/logrotate.d/easyvinted-worker
```

```
/var/log/easyvinted-worker*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 easyvinted easyvinted
}
```

## 🔐 Sécurité

### Pare-feu

Le worker n'a pas besoin d'ouvrir de ports. Assurez-vous que SSH (22) est ouvert :

```bash
sudo ufw allow 22
sudo ufw enable
sudo ufw status
```

### Mettre à jour le système régulièrement

```bash
sudo apt update && sudo apt upgrade -y
```

### Protéger le fichier .env

```bash
chmod 600 /opt/easyvinted-worker/.env
```

## 🐛 Résolution de problèmes

### Le service ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u easyvinted-worker -n 50

# Tester manuellement
sudo su - easyvinted
cd /opt/easyvinted-worker
npm start
```

### Chromium ne se lance pas

```bash
# Réinstaller les dépendances système
sudo apt install -y $(npx playwright install-deps chromium 2>&1 | grep "apt-get install" | cut -d' ' -f4-)

# Ou
npx playwright install-deps chromium
```

### Erreur de permissions

```bash
sudo chown -R easyvinted:easyvinted /opt/easyvinted-worker
chmod 600 /opt/easyvinted-worker/.env
```

### Session Vinted expirée

```bash
# Supprimer la session
sudo su - easyvinted
cd /opt/easyvinted-worker
rm -rf playwright-state/

# Relancer en mode visible pour tester
HEADLESS=false npm start
```

## 📈 Optimisations

### Limiter la mémoire

Si votre VPS a peu de RAM, ajoutez dans le service systemd :

```ini
[Service]
MemoryMax=512M
```

### Utiliser PM2 (alternative à systemd)

```bash
npm install -g pm2

pm2 start dist/index.js --name easyvinted-worker --cron "*/5 * * * *"
pm2 save
pm2 startup
```

## ✅ Checklist finale

- [ ] Node.js 18+ installé
- [ ] Dépendances système Chromium installées
- [ ] Projet transféré sur le VPS
- [ ] `npm install` et `npm run build` réussis
- [ ] `.env` configuré avec les bons credentials
- [ ] Test manuel réussi (`npm start`)
- [ ] Service systemd ou cron configuré
- [ ] Logs visibles et propres
- [ ] Migration `publication_jobs` appliquée dans Supabase

## 🎉 C'est terminé !

Votre worker tourne maintenant automatiquement sur votre VPS et traite les jobs de publication Vinted toutes les 5 minutes.

Pour créer un job de publication, insérez simplement dans Supabase :

```sql
INSERT INTO publication_jobs (article_id, status, run_at)
VALUES ('uuid-de-votre-article', 'pending', NOW());
```

Le worker le récupérera et publiera l'article automatiquement !
