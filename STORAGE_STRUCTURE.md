# Structure de stockage des photos

## Organisation des fichiers

Les photos sont organisées selon la structure suivante dans le bucket `article-photos` :

```
article-photos/
└── {user_id}/
    └── {article_id}/
        ├── photo1.jpg
        ├── photo2.jpg
        └── photo3.jpg
```

## Flux de création d'un article

### 1. Upload initial (avant sauvegarde)
Quand un utilisateur upload des photos **avant** de sauvegarder l'article :
- Les photos vont dans un dossier temporaire : `{user_id}/temp-{timestamp}/`
- Exemple : `b733ee53-9750-4462-ad2f-eed948453d42/temp-1763660842328/photo.jpg`

### 2. Première sauvegarde de l'article
Lors de la première sauvegarde :
1. L'article reçoit un ID permanent de la base de données
2. Le système détecte automatiquement les photos dans le dossier temporaire
3. Les photos sont **déplacées** vers : `{user_id}/{article_id}/`
4. Les anciennes URLs sont mises à jour dans la base de données
5. Le dossier temporaire est nettoyé

### 3. Ajout de photos ultérieur
Si l'utilisateur ajoute des photos après la création :
- Elles vont directement dans `{user_id}/{article_id}/`
- Pas de migration nécessaire

## Fonction de migration automatique

Le fichier `src/lib/photoMigration.ts` contient la logique :

```typescript
migratePhotosFromTempFolder(photos, userId, articleId)
```

Cette fonction :
- Détecte les photos dans des dossiers `/temp-`
- Les télécharge depuis l'ancien emplacement
- Les uploade vers le nouvel emplacement
- Supprime l'ancien fichier
- Retourne les nouvelles URLs

## Sécurité RLS (Row Level Security)

Les policies Supabase vérifient que :
- Un utilisateur ne peut uploader que dans son propre dossier `{user_id}/`
- Un utilisateur ne peut modifier/supprimer que ses propres photos
- Le `user_id` dans le path doit correspondre à `auth.uid()`

## Suppression d'un article

Lors de la suppression d'un article :
1. Le système liste tous les fichiers dans `{user_id}/{article_id}/`
2. Supprime tous les fichiers du dossier
3. Supprime l'article de la base de données

## Avantages de cette structure

1. **Isolation** : Chaque article a son propre dossier
2. **Pas de collision** : Deux articles peuvent avoir "photo1.jpg"
3. **Duplication simple** : Les articles dupliqués reçoivent un nouvel ID
4. **Export facile** : Toutes les photos d'un article sont groupées
5. **Sécurité** : Le `user_id` dans le path empêche l'accès cross-user
6. **Nettoyage automatique** : Suppression du dossier entier en une fois

## Migration automatique des anciennes données

Si tu as des articles existants avec des photos à la racine du bucket, ils continueront de fonctionner. Les nouvelles photos utiliseront automatiquement la nouvelle structure.
