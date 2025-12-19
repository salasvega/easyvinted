# Migration de la table Personas

## Description

Cette migration crée une table `personas` dans la base de données qui contient les personas prédéfinis pour les styles d'écriture. Cette table remplace les constantes hardcodées dans le code et permet une gestion dynamique des personas.

## Structure de la table

La table `personas` contient les champs suivants :
- `id` (text, clé primaire) - Identifiant unique du persona
- `name` (text) - Nom d'affichage (ex: "La Minimaliste")
- `description` (text) - Description courte du persona
- `writing_style` (text) - Instructions détaillées du style d'écriture
- `emoji` (text) - Emoji pour l'affichage UI
- `color` (text) - Classes CSS pour le style visuel
- `created_at` (timestamptz) - Date de création

## Personas prédéfinis

La migration insère automatiquement 6 personas :
1. **La Minimaliste** - Descriptions courtes, claires et efficaces
2. **L'Enthousiaste** - Dynamique, positive et pleine d'énergie
3. **La Pro de la Mode** - Experte, technique et détaillée
4. **La Copine Sympa** - Chaleureuse, accessible et décontractée
5. **L'Élégante** - Raffinée, sophistiquée et chic
6. **L'Écolo Engagée** - Responsable avec focus sur la durabilité

## Comment appliquer la migration

### Via l'interface Supabase

1. Ouvrez votre projet Supabase
2. Allez dans l'éditeur SQL
3. Copiez le contenu du fichier `create_personas_table.sql`
4. Exécutez la requête

### Via l'API Supabase

Le fichier SQL peut aussi être exécuté directement via l'API Supabase si nécessaire.

## Changements dans le code

Les modifications suivantes ont été apportées au code :

1. **Nouveau hook `usePersonas`** : Charge les personas depuis la base de données
2. **PersonaStep modifié** : Utilise le hook au lieu de la constante hardcodée
3. **FamilyMembersPage modifié** : Utilise le hook pour afficher les personas disponibles
4. **OnboardingPage modifié** : Enregistre les données complètes du persona (name, description, writing_style) dans `family_members`

## Sécurité

- RLS activé sur la table `personas`
- Tous les utilisateurs authentifiés peuvent lire les personas
- Seuls les admins peuvent modifier les personas (aucune policy d'écriture pour les utilisateurs normaux)

## Avantages

- Les personas peuvent être modifiés sans déployer de nouveau code
- Possibilité d'ajouter de nouveaux personas facilement
- Centralisation des données de personas
- Cohérence entre l'onboarding et les pages de gestion
