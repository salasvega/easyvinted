# Configuration Gemini pour EasyVinted

## Modèles Gemini utilisés

EasyVinted utilise les modèles Google Gemini les plus performants :

### 1. Analyse des Photos - **Gemini 3 Pro Preview**
- **Modèle** : `gemini-3-pro-preview`
- **Rôle** : Analyse intelligente des images de vêtements
- **Capacités** :
  - Identification précise du type de vêtement
  - Estimation de la taille, matière, couleur et état
  - Lecture des étiquettes de marque
  - Génération de descriptions marketing vendeuses
  - Suggestion de hashtags pertinents
  - Estimation de prix réaliste
- **Disponibilité** : ✅ Disponible avec le tier gratuit

### 2. Édition d'Images - **Gemini 2.5 Flash Image**
- **Modèle** : `gemini-2.5-flash-image`
- **Rôle** : Studio Photo IA pour retoucher vos images
- **Capacités** :
  - Remplacement d'arrière-plan (fond blanc, béton, bois)
  - Amélioration de la luminosité et des couleurs
  - Centrage et composition du produit
  - Mise à plat du vêtement
  - Préservation de l'aspect original du produit
- **Disponibilité** : ⚠️ **Nécessite un compte avec facturation activée**

## Problème de Quota

### Erreur "Quota exceeded"

Si vous voyez cette erreur lors de l'édition d'images :
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0
```

Cela signifie que le modèle de génération d'images **n'est pas disponible dans le tier gratuit** de Gemini.

### Solution

Pour utiliser l'édition d'images avec Gemini, vous devez :

1. **Activer la facturation sur Google Cloud**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Sélectionnez votre projet
   - Activez la facturation
   - Le modèle `gemini-2.5-flash-image` sera alors accessible

2. **Tarifs**
   - Consultez [la page de tarification Gemini](https://ai.google.dev/gemini-api/docs/pricing)
   - Les modèles de génération d'images ont des tarifs spécifiques par image générée

3. **Limites de quotas**
   - Avec facturation : quotas généreux selon votre plan
   - Sans facturation : limite de 0 (non disponible)

## Configuration

### Clé API Gemini

Votre clé API Gemini doit être configurée dans le fichier `.env` :

```env
VITE_GEMINI_API_KEY=votre_cle_api_ici
```

### Obtenir une clé API

1. Allez sur [Google AI Studio](https://aistudio.google.com/apikey)
2. Cliquez sur "Get API Key"
3. Créez ou sélectionnez un projet Google Cloud
4. Copiez la clé générée
5. Collez-la dans votre fichier `.env`

## Architecture

### Analyse des photos (frontend)
```typescript
// src/lib/geminiService.ts
const model = 'gemini-3-pro-preview';
const result = await analyzeProductImage(base64Image, mimeType);
```

### Édition d'images (frontend)
```typescript
// src/components/ImageEditor.tsx
const editedImage = await editProductImage(base64Image, mimeType, instruction);
```

### Edge Function (backend)
L'Edge Function `analyze-article-image` utilise actuellement OpenAI pour l'analyse. Si vous souhaitez utiliser Gemini à la place, vous pouvez modifier la fonction.

## Avantages de Gemini

### Pourquoi Gemini 3 Pro pour l'analyse ?
- **Intelligence supérieure** : Meilleure compréhension contextuelle des images
- **Multimodal avancé** : Traite simultanément image, texte et contexte
- **Raisonnement** : Capacité d'inférence pour estimer taille et prix
- **Précision** : Lecture fiable des étiquettes et logos

### Pourquoi Gemini 2.5 Flash Image pour l'édition ?
- **Rapidité** : Génération d'images optimisée
- **Qualité** : Préservation des détails du produit
- **Compréhension** : Instructions en langage naturel
- **Flexibilité** : Multiples types de modifications possibles

## Comparaison avec OpenAI

| Fonctionnalité | Gemini | OpenAI |
|---------------|--------|--------|
| Analyse d'images | ✅ Gemini 3 Pro | ✅ GPT-4 Vision |
| Édition d'images | ✅ Gemini 2.5 Flash Image | ✅ DALL-E 3 |
| Tier gratuit (analyse) | ✅ Disponible | ❌ Limité |
| Tier gratuit (édition) | ❌ Non disponible | ❌ Non disponible |
| Compréhension du français | ✅ Excellent | ✅ Excellent |

## Support

Pour plus d'informations :
- [Documentation Gemini API](https://ai.google.dev/gemini-api/docs)
- [Modèles Gemini disponibles](https://ai.google.dev/gemini-api/docs/models)
- [Tarification Gemini](https://ai.google.dev/gemini-api/docs/pricing)
- [Limites de quotas](https://ai.google.dev/gemini-api/docs/rate-limits)
