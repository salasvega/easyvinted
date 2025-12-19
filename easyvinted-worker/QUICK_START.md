# ⚡ Guide de Démarrage Rapide - Test du Worker

## 🎯 Test en 5 Minutes

### Étape 1 : Installation (2 min)

```bash
cd easyvinted-worker
npm install
```

Attends que Playwright et Chromium se téléchargent.

### Étape 2 : Créer un Article de Test (1 min)

1. Ouvre ton app EasyVinted : http://localhost:5173
2. Va dans "Créer un article"
3. Remplis rapidement :
   - Titre : "Test Worker"
   - Prix : 10
   - Ajoute 1-2 photos
   - Remplis quelques autres champs
4. Enregistre comme brouillon

### Étape 3 : Créer un Job de Test (30 sec)

```bash
npm run test:create-job
```

Tu verras :
```
📦 Available articles:

1. Test Worker
   ID: abc-123-...
   Price: 10€
   Status: draft
   Photos: 2

✅ Test job created successfully!

🚀 Next steps:
   Run the worker in visible mode:
   HEADLESS=false npm run dev
```

### Étape 4 : Lancer le Test (1 min)

```bash
HEADLESS=false npm run dev
```

**Une fenêtre de navigateur s'ouvre** et tu vas voir :
1. Connexion à Vinted
2. Navigation vers le formulaire
3. Upload des photos
4. Remplissage automatique du formulaire
5. Soumission

**Regarde le terminal** pour les logs détaillés.

### Étape 5 : Vérifier le Résultat (30 sec)

```bash
npm run test:check-jobs
```

Tu verras :
```
📈 Statistics:
   Pending:  0
   Success:  1 ✅
   Failed:   0 ❌

✅ Recent successful publications:
   - Test Worker
     https://www.vinted.fr/items/1234567890
```

---

## ✅ Si Tout Fonctionne

**Félicitations !** Le worker est opérationnel.

**Prochaines étapes :**
1. Teste avec plusieurs articles
2. Déploie sur un serveur
3. Configure un cron job pour publication automatique

---

## ❌ En Cas de Problème

### Le navigateur ne s'ouvre pas

```bash
# Réinstalle Playwright
cd easyvinted-worker
npx playwright install chromium
```

### "No articles found"

Crée un article dans l'app EasyVinted avec au moins 1 photo.

### "Login failed"

Vérifie que les credentials Vinted sont corrects dans `.env` :
```bash
cat .env | grep VINTED
```

### Le formulaire ne se remplit pas

C'est normal si Vinted a changé son interface. Consulte le guide complet :
```bash
cat TESTING_GUIDE.md
```

---

## 📚 Commandes Utiles

```bash
# Créer un job de test
npm run test:create-job

# Vérifier l'état des jobs
npm run test:check-jobs

# Lancer le worker (mode visible)
HEADLESS=false npm run dev

# Lancer le worker (mode production)
npm start

# Compiler TypeScript
npm run build
```

---

## 🆘 Besoin d'Aide ?

Consulte les guides détaillés :
- **Guide de test complet** : `TESTING_GUIDE.md`
- **Documentation** : `README.md`
- **Changelog** : `CHANGELOG.md`

Les logs du worker te diront exactement ce qui se passe !
