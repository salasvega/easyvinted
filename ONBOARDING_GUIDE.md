# Guide de l'Onboarding EasyVinted

## Vue d'ensemble

L'onboarding est une fonctionnalité qui guide les nouveaux utilisateurs à travers une configuration initiale de leur compte EasyVinted. Cette expérience multi-étapes s'active automatiquement lors de la première connexion.

## Flux utilisateur

### Déclenchement
- À chaque connexion, le système vérifie si `onboarding_complet = false` dans `user_profiles`
- Si c'est le cas, l'utilisateur est automatiquement redirigé vers `/onboarding`
- Une fois l'onboarding terminé, `onboarding_complet` est mis à `true` et l'utilisateur ne le reverra plus

### Étapes de l'onboarding

#### 1. Profil (Obligatoire)
- **Champs requis:**
  - Nom complet (obligatoire)
  - Taille haut (optionnel)
  - Taille bas (optionnel)
  - Pointure (optionnel)

#### 2. Persona (Optionnel mais recommandé)
Deux options:
- **Personas prédéfinis:** 6 styles d'écriture prêts à l'emploi
  - La Minimaliste
  - L'Enthousiaste
  - La Pro de la Mode
  - La Copine Sympa
  - L'Élégante
  - L'Écolo Engagée
- **Persona personnalisé:** Créer son propre style avec nom et instructions

Bouton "Passer cette étape" disponible.

#### 3. Équipe (Optionnel)
- L'utilisateur principal est automatiquement ajouté comme premier vendeur
- Possibilité d'ajouter d'autres vendeurs (famille, amis...)
- Sélection du vendeur par défaut
- Bouton "Passer cette étape" disponible

#### 4. Confirmation
- Récapitulatif de bienvenue
- Prochaines étapes suggérées
- Bouton "Accéder à EasyVinted"

## Actions effectuées à la fin de l'onboarding

1. **Mise à jour de `user_profiles`:**
   - `name`
   - `top_size`
   - `bottom_size`
   - `shoe_size`
   - `persona_id` (si persona prédéfini sélectionné)
   - `default_seller_id`
   - `onboarding_complet = true`

2. **Création dans `family_members`:**
   - Si aucun vendeur n'existe, création automatique avec:
     - `display_name` = nom de l'utilisateur
     - `is_default = true`
   - Si des membres d'équipe ont été ajoutés, création de tous les vendeurs

3. **Création dans `custom_personas`** (si applicable):
   - Si persona personnalisé créé, insertion avec nom et style

4. **Redirection:**
   - Redirection automatique vers `/dashboard` via `window.location.href`

## Installation

### 1. Migration de base de données

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase:

```sql
-- Voir ONBOARDING_SETUP.sql
```

### 2. Routes ajoutées

- `/onboarding` - Route protégée mais sans AppLayout
- Redirection automatique depuis toutes les routes protégées si `needsOnboarding = true`

## Composants créés

### Pages
- `src/pages/OnboardingPage.tsx` - Page principale orchestrant les étapes

### Composants d'étapes
- `src/components/onboarding/ProfileStep.tsx` - Étape profil
- `src/components/onboarding/PersonaStep.tsx` - Étape persona
- `src/components/onboarding/TeamStep.tsx` - Étape équipe
- `src/components/onboarding/CompletionStep.tsx` - Écran de confirmation

## Modifications du code existant

### AuthContext
- Ajout de `needsOnboarding: boolean`
- Fonction `checkOnboardingStatus()` qui vérifie `onboarding_complet`
- Vérification à chaque connexion et changement d'état d'authentification

### ProtectedRoute
- Vérification de `needsOnboarding`
- Redirection vers `/onboarding` si nécessaire (sauf si déjà sur cette page)

### App.tsx
- Ajout de la route `/onboarding`
- Import lazy de `OnboardingPage`

## Design

L'interface suit un design Apple-like avec:
- Cartes avec ombres
- Gradients colorés
- Animations de transitions
- Progress stepper en haut
- Boutons désactivés tant que les champs obligatoires ne sont pas remplis
- États de chargement
- Gestion d'erreurs

## Notes importantes

1. **Utilisateurs existants:** Par défaut, tous les utilisateurs existants auront `onboarding_complet = false` et passeront par l'onboarding à leur prochaine connexion. Pour éviter cela:
   ```sql
   UPDATE user_profiles SET onboarding_complet = true;
   ```

2. **Vendeur obligatoire:** Si aucun vendeur n'existe dans `family_members`, l'utilisateur ne peut pas créer d'article. L'onboarding garantit qu'au moins un vendeur est créé.

3. **Persona optionnel:** Le persona n'est pas obligatoire mais fortement recommandé pour de meilleures descriptions générées par l'IA.

## Testing

Pour tester l'onboarding:
1. Créez un nouveau compte
2. Après inscription, vous serez automatiquement redirigé vers `/onboarding`
3. Complétez les étapes
4. Vérifiez que vous êtes redirigé vers `/dashboard`
5. Déconnectez-vous et reconnectez-vous - vous ne devriez plus voir l'onboarding

Pour forcer un utilisateur existant à repasser l'onboarding:
```sql
UPDATE user_profiles SET onboarding_complet = false WHERE id = 'USER_ID';
```
