# Déploiement sur votre VPS Hetzner

Guide personnalisé pour déployer le worker EasyVinted sur votre serveur Hetzner.

## 📋 Informations de votre serveur

- **Nom** : ubuntu-4gb-nbg1-1
- **IP publique** : `46.224.21.28`
- **Configuration** : CX23 | x86 | 40 GB | eu-central
- **Localisation** : Nuremberg, Allemagne
- **OS** : Ubuntu

## 🚀 Déploiement rapide (30 minutes)

### Étape 1 : Se connecter au serveur (2 min)

Depuis votre machine locale, ouvrez un terminal :

```bash
ssh root@46.224.21.28
```

Entrez votre mot de passe root lorsque demandé.

### Étape 2 : Vérifier la version d'Ubuntu et mettre à jour (3 min)

```bash
# Vérifier la version
lsb_release -a

# Mettre à jour le système
apt update
apt upgrade -y
```

### Étape 3 : Installer Node.js 18+ (5 min)

```bash
# Installer Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Vérifier l'installation
node --version  # Doit afficher v18.x ou supérieur
npm --version
```

### Étape 4 : Installer les dépendances Chromium (5 min)

```bash
# Installer les bibliothèques système pour Chromium
apt install -y \
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
  libatspi2.0-0 \
  libxshmfence1
```

### Étape 5 : Créer un utilisateur dédié (2 min)

```bash
# Créer l'utilisateur easyvinted
useradd -m -s /bin/bash easyvinted

# Créer le répertoire du projet
mkdir -p /opt/easyvinted-worker
chown easyvinted:easyvinted /opt/easyvinted-worker

# Créer le répertoire des logs
mkdir -p /var/log/easyvinted
chown easyvinted:easyvinted /var/log/easyvinted
```

### Étape 6 : Transférer les fichiers (5 min)

**Option A : Via Git (recommandé si vous avez un repo)**

```bash
# En tant qu'utilisateur easyvinted
su - easyvinted
cd /opt/easyvinted-worker

# Cloner votre repo
git clone https://github.com/votre-username/votre-repo.git .
```

**Option B : Via SCP depuis votre machine locale**

Sur votre machine locale (pas sur le serveur), ouvrez un nouveau terminal :

```bash
# Depuis le répertoire de votre projet
cd /chemin/vers/votre/projet

# Transférer les fichiers
scp -r easyvinted-worker/* root@46.224.21.28:/opt/easyvinted-worker/

# Corriger les permissions
ssh root@46.224.21.28 "chown -R easyvinted:easyvinted /opt/easyvinted-worker"
```

### Étape 7 : Installer les dépendances Node.js (5 min)

Sur le serveur :

```bash
# Se connecter en tant qu'easyvinted
su - easyvinted
cd /opt/easyvinted-worker

# Installer les packages
npm install

# Installer Chromium (peut prendre quelques minutes)
npx playwright install chromium
```

### Étape 8 : Configurer les variables d'environnement (2 min)

```bash
# Toujours en tant qu'utilisateur easyvinted
cd /opt/easyvinted-worker

# Créer le fichier .env
nano .env
```

Collez vos credentials (remplacez par vos vraies valeurs) :

```env
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...votre-service-role-key

# Vinted Credentials
VINTED_EMAIL=votre-email@example.com
VINTED_PASSWORD=votre-mot-de-passe-vinted

# Worker Configuration
HEADLESS=true
LOG_LEVEL=info
```

**Sauvegarder** : `Ctrl + X`, puis `Y`, puis `Enter`

**Sécuriser le fichier** :

```bash
chmod 600 .env
```

### Étape 9 : Compiler le projet (1 min)

```bash
# Toujours en tant qu'easyvinted
cd /opt/easyvinted-worker
npm run build
```

Vérifiez que le dossier `dist/` a été créé :

```bash
ls -la dist/
```

### Étape 10 : Tester manuellement (2 min)

```bash
# Test rapide
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
...
```

Si tout fonctionne, appuyez sur `Ctrl + C` pour arrêter.

```bash
# Quitter l'utilisateur easyvinted
exit
```

### Étape 11 : Créer le service systemd (3 min)

**Revenir en root** :

```bash
# Si vous êtes déconnecté, reconnectez-vous
ssh root@46.224.21.28
```

**Créer le service** :

```bash
nano /etc/systemd/system/easyvinted-worker.service
```

Collez cette configuration :

```ini
[Unit]
Description=EasyVinted Worker - Automated Vinted Publication
After=network.target

[Service]
Type=oneshot
User=easyvinted
Group=easyvinted
WorkingDirectory=/opt/easyvinted-worker
ExecStart=/usr/bin/node /opt/easyvinted-worker/dist/index.js
StandardOutput=append:/var/log/easyvinted/worker.log
StandardError=append:/var/log/easyvinted/worker-error.log
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

**Sauvegarder** : `Ctrl + X`, puis `Y`, puis `Enter`

**Créer le timer** (pour exécution toutes les 5 minutes) :

```bash
nano /etc/systemd/system/easyvinted-worker.timer
```

Collez :

```ini
[Unit]
Description=EasyVinted Worker Timer (every 5 minutes)
Requires=easyvinted-worker.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
Unit=easyvinted-worker.service

[Install]
WantedBy=timers.target
```

**Sauvegarder** : `Ctrl + X`, puis `Y`, puis `Enter`

### Étape 12 : Activer et démarrer le service (1 min)

```bash
# Recharger systemd
systemctl daemon-reload

# Activer le timer (démarrage automatique au boot)
systemctl enable easyvinted-worker.timer

# Démarrer le timer
systemctl start easyvinted-worker.timer

# Vérifier le statut
systemctl status easyvinted-worker.timer
```

Vous devriez voir : `Active: active (waiting)`

### Étape 13 : Vérifier que tout fonctionne (2 min)

```bash
# Lancer le worker manuellement une fois pour tester
systemctl start easyvinted-worker

# Voir les logs en temps réel
tail -f /var/log/easyvinted/worker.log

# Ou avec journalctl
journalctl -u easyvinted-worker -f
```

Appuyez sur `Ctrl + C` pour arrêter la lecture des logs.

## ✅ C'est terminé !

Votre worker tourne maintenant automatiquement sur votre VPS Hetzner et s'exécutera **toutes les 5 minutes**.

## 📊 Commandes utiles

### Voir les logs

```bash
# Logs en temps réel
tail -f /var/log/easyvinted/worker.log

# Dernières 50 lignes
tail -n 50 /var/log/easyvinted/worker.log

# Avec journalctl
journalctl -u easyvinted-worker -n 50
```

### Vérifier le statut du timer

```bash
# Statut du timer
systemctl status easyvinted-worker.timer

# Voir tous les timers
systemctl list-timers
```

### Lancer manuellement le worker

```bash
# Exécution immédiate (sans attendre le timer)
systemctl start easyvinted-worker
```

### Redémarrer le timer

```bash
systemctl restart easyvinted-worker.timer
```

### Arrêter le timer

```bash
systemctl stop easyvinted-worker.timer
```

### Voir les jobs en attente dans Supabase

Depuis votre interface web ou via SQL :

```sql
SELECT * FROM publication_jobs
WHERE status = 'pending'
ORDER BY run_at DESC;
```

## 🔧 Mise à jour du worker

Quand vous modifiez le code :

```bash
# Se connecter au serveur
ssh root@46.224.21.28

# Passer en utilisateur easyvinted
su - easyvinted
cd /opt/easyvinted-worker

# Pull les modifications (si Git)
git pull

# Réinstaller les dépendances si nécessaire
npm install

# Recompiler
npm run build

# Quitter
exit

# Redémarrer le timer (en root)
systemctl restart easyvinted-worker.timer
```

## 🔐 Sécurité

### Configurer le pare-feu UFW

```bash
# Installer UFW si pas déjà fait
apt install ufw

# Autoriser SSH (IMPORTANT : ne pas verrouiller SSH !)
ufw allow 22/tcp

# Activer le pare-feu
ufw enable

# Vérifier
ufw status
```

### Créer un utilisateur SSH non-root (recommandé)

```bash
# Créer un utilisateur admin
adduser admin

# Ajouter aux sudoers
usermod -aG sudo admin

# Tester la connexion
# Depuis votre machine locale :
ssh admin@46.224.21.28
```

## 🐛 Dépannage

### Le worker ne démarre pas

```bash
# Vérifier les logs d'erreur
journalctl -u easyvinted-worker -n 100

# Tester manuellement
su - easyvinted
cd /opt/easyvinted-worker
npm start
```

### Chromium ne se lance pas

```bash
# Réinstaller Chromium
su - easyvinted
cd /opt/easyvinted-worker
npx playwright install chromium --force
```

### Problème de permissions

```bash
# Corriger les permissions
chown -R easyvinted:easyvinted /opt/easyvinted-worker
chmod 600 /opt/easyvinted-worker/.env
```

### Le timer ne s'exécute pas

```bash
# Vérifier que le timer est actif
systemctl status easyvinted-worker.timer

# Relancer le timer
systemctl restart easyvinted-worker.timer

# Voir les prochaines exécutions
systemctl list-timers easyvinted-worker.timer
```

## 📈 Monitoring

### Installer htop pour surveiller les ressources

```bash
apt install htop
htop
```

### Surveiller l'espace disque

```bash
df -h
```

### Voir la RAM utilisée

```bash
free -h
```

## 🎉 Félicitations !

Votre worker est maintenant déployé sur votre VPS Hetzner à Nuremberg !

**IP du serveur** : `46.224.21.28`
**Localisation** : Nuremberg, Allemagne
**Fréquence d'exécution** : Toutes les 5 minutes

Pour créer un job de publication, utilisez simplement le bouton **"Publier maintenant"** dans votre interface web !
