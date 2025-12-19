# Guide d'édition d'images avec Gemini AI

## Vue d'ensemble

L'édition d'images est maintenant intégrée directement dans le composant PhotoUpload de votre application. Elle utilise l'API Gemini AI de Google pour modifier vos photos de manière intelligente.

## Configuration

### 1. Clé API Gemini

Votre clé API Gemini est déjà configurée dans le fichier `.env` :

```
GEMINI_API_KEY=XXXXX
VITE_GEMINI_API_KEY=XXXXX
```

### 2. Modèle utilisé

L'édition utilise le modèle `gemini-2.5-flash-image` qui est spécialement conçu pour la modification d'images.

## Comment utiliser l'édition d'images

### Dans la page de création d'article

1. **Ajoutez vos photos** comme d'habitude via le composant PhotoUpload
2. **Survolez une photo** - deux boutons apparaîtront en haut à droite :
   - Bouton bleu avec icône baguette magique : **Éditer avec IA**
   - Bouton rouge avec X : Supprimer

3. **Cliquez sur le bouton bleu** pour ouvrir l'éditeur d'images

### Dans l'éditeur d'images

1. **Visualisez votre image** dans la zone d'aperçu
2. **Entrez une instruction** dans le champ de texte, par exemple :
   - "Améliore la luminosité et les couleurs"
   - "Supprime l'arrière-plan"
   - "Rends le fond blanc"
   - "Améliore les détails du vêtement"
   - "Centre le produit dans l'image"

3. **Utilisez les instructions rapides** - cliquez sur l'un des boutons prédéfinis pour remplir automatiquement l'instruction

4. **Cliquez sur "Éditer avec Gemini"** pour lancer l'édition
   - L'IA traite votre demande (cela peut prendre quelques secondes)
   - L'image éditée remplace automatiquement l'ancienne
   - L'ancienne image est supprimée du stockage

## Exemples d'instructions

### Instructions de base
- "Améliore la luminosité"
- "Augmente le contraste"
- "Rends l'image plus nette"

### Retouche d'arrière-plan
- "Supprime l'arrière-plan"
- "Remplace l'arrière-plan par du blanc"
- "Floute l'arrière-plan"

### Composition
- "Centre le produit"
- "Recadre l'image pour mettre en valeur le vêtement"
- "Agrandis le produit dans l'image"

### Corrections
- "Corrige les couleurs pour qu'elles soient plus naturelles"
- "Enlève les ombres"
- "Améliore les détails du tissu"

## Architecture technique

### Composants créés

1. **ImageEditor.tsx** (`/src/components/ImageEditor.tsx`)
   - Modal d'édition d'images
   - Interface utilisateur pour entrer les instructions
   - Gestion de l'appel à l'API Gemini
   - Affichage de l'état de traitement

2. **geminiService.ts** (`/src/lib/geminiService.ts`)
   - Service pour communiquer avec l'API Gemini
   - Fonction `editProductImage()` pour l'édition d'images
   - Fonction `analyzeProductImage()` pour l'analyse

3. **PhotoUpload.tsx** (modifié)
   - Bouton d'édition ajouté sur chaque photo
   - Intégration du composant ImageEditor
   - Gestion du remplacement de l'image éditée

### Flux de traitement

1. **Clic sur le bouton d'édition** → Ouvre le modal ImageEditor
2. **Entrée de l'instruction** → L'utilisateur décrit la modification souhaitée
3. **Envoi à Gemini** → L'image et l'instruction sont envoyées à l'API
4. **Traitement par IA** → Gemini génère l'image modifiée
5. **Réception** → L'image modifiée est reçue en base64
6. **Upload** → L'image est uploadée sur Supabase Storage
7. **Remplacement** → L'ancienne image est supprimée et remplacée
8. **Confirmation** → Un message de succès est affiché

### Formats supportés

- **Input** : JPEG, PNG, WebP
- **Output** : JPEG (l'image éditée est toujours en JPEG)

## Dépannage

### L'édition ne fonctionne pas

1. **Vérifiez la clé API** :
   ```bash
   echo $VITE_GEMINI_API_KEY
   ```
   Devrait afficher votre clé API

2. **Vérifiez la console du navigateur** :
   - Ouvrez les DevTools (F12)
   - Regardez l'onglet Console pour les erreurs

3. **Erreurs courantes** :
   - `VITE_GEMINI_API_KEY is not configured` → Ajoutez la clé dans `.env`
   - `No image data found in response` → Le modèle n'a pas pu générer l'image
   - `Editing failed` → Problème de connexion ou instruction non comprise

### L'image éditée est de mauvaise qualité

- Utilisez des images sources de bonne qualité
- Évitez les instructions trop complexes
- Essayez de reformuler votre instruction
- Utilisez des termes simples et directs

### L'édition prend trop de temps

- L'édition d'images avec IA peut prendre 5-15 secondes
- Vérifiez votre connexion internet
- Si le délai dépasse 30 secondes, essayez à nouveau

## Limites actuelles

1. **Une image à la fois** - L'édition traite une seule image
2. **Instructions en français** - L'IA comprend le français
3. **Pas de prévisualisation** - L'image est directement remplacée
4. **Modifications définitives** - L'ancienne image est supprimée

## Améliorations futures possibles

- [ ] Prévisualisation avant validation
- [ ] Historique des modifications
- [ ] Annuler/Rétablir
- [ ] Édition par lots
- [ ] Filtres prédéfinis supplémentaires
- [ ] Suggestions d'amélioration automatiques

## Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez les logs dans la console
3. Vérifiez que votre clé API Gemini est valide
4. Testez avec des instructions simples d'abord
