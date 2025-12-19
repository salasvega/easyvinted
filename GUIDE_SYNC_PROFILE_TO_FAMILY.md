# Guide : Synchronisation du profil utilisateur vers family_members

## Objectif

Permettre aux utilisateurs de modifier leurs informations personnelles (age, tailles, persona) via la section Family Members.

## Modifications apportées

### 1. Migration SQL à appliquer

**Fichier :** `add_size_fields_to_family_members.sql`

Cette migration ajoute les colonnes `top_size` et `bottom_size` à la table `family_members` pour remplacer l'ancien champ unique `clothing_size`.

### 2. Modifications du code

#### OnboardingPage.tsx
- Les données de profil (age, top_size, bottom_size, shoe_size, persona_id) saisies pendant l'onboarding sont maintenant transmises à `family_members` pour l'utilisateur principal
- Le vendeur principal créé automatiquement contient toutes les informations du profil

#### FamilyMembersPage.tsx
- Remplacement de `clothing_size` par `top_size` et `bottom_size`
- Affichage séparé des tailles haut et bas dans les cartes des membres
- Formulaire d'édition mis à jour avec 3 champs : Taille Haut, Taille Bas, Pointure

#### services/settings.ts
- Type `FamilyMember` mis à jour avec les nouveaux champs

## Comment appliquer les changements

### Étape 1 : Appliquer la migration SQL

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu du fichier `add_size_fields_to_family_members.sql`
4. Exécutez la requête

### Étape 2 : Vérifier la migration

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'family_members'
AND column_name IN ('top_size', 'bottom_size');
```

Vous devriez voir les deux nouvelles colonnes.

### Étape 3 : Tester

1. **Pour les nouveaux utilisateurs :**
   - Créez un nouveau compte
   - Complétez l'onboarding en renseignant age, tailles et persona
   - Vérifiez dans la section "Nos vendeurs" que vos informations sont bien présentes
   - Modifiez vos informations via la modale d'édition

2. **Pour les utilisateurs existants :**
   - Allez dans "Nos vendeurs"
   - Créez ou éditez votre profil vendeur
   - Renseignez vos tailles et autres informations
   - Les modifications seront sauvegardées dans `family_members`

## Avantages

- Interface unifiée : modification des informations personnelles directement dans la section Family
- Meilleure granularité : tailles haut et bas séparées
- Cohérence des données entre user_profiles et family_members
- Flexibilité : chaque vendeur peut avoir ses propres caractéristiques

## Notes importantes

- Les utilisateurs existants devront mettre à jour leurs informations manuellement via la section "Nos vendeurs"
- L'ancien champ `clothing_size` reste dans la base de données pour compatibilité mais n'est plus utilisé dans l'interface
- Les nouveaux utilisateurs verront automatiquement leurs informations synchronisées lors de l'onboarding
