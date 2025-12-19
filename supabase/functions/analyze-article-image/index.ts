import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai@1.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface AnalysisResult {
  title: string;
  description: string;
  brand: string;
  category: string;
  subcategory?: string;
  color: string;
  material?: string;
  size?: string;
  condition: string;
  season: string;
  suggestedPeriod?: string;
  estimatedPrice?: number;
  seoKeywords?: string[];
  hashtags?: string[];
  searchTerms?: string[];
  confidenceScore?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          error: "La cle API Gemini n'est pas configuree. Veuillez configurer GEMINI_API_KEY dans les secrets de votre projet Supabase."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header manquant" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifie" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { imageUrls, sellerId, isLot, lotArticles } = await req.json();

    let writingStyle = "Description detaillee et attractive";

    if (sellerId) {
      const { data: familyMember } = await supabase
        .from("family_members")
        .select("persona_id, writing_style")
        .eq("id", sellerId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (familyMember) {
        if (familyMember.writing_style) {
          writingStyle = familyMember.writing_style;
        } else if (familyMember.persona_id) {
          const personaStyles: Record<string, string> = {
            minimalist: "Descriptions courtes, claires et efficaces. Style minimaliste avec uniquement l'essentiel.",
            enthusiast: "Dynamique, positive et pleine d'energie ! Utilise des points d'exclamation et un ton enthousiaste.",
            professional: "Experte, technique et detaillee. Descriptions precises et professionnelles.",
            friendly: "Chaleureuse, accessible et decontractee. Ton amical comme entre amis.",
            elegant: "Raffinee, sophistiquee et chic. Vocabulaire elegant et noble.",
            eco_conscious: "Responsable avec focus sur la durabilite. Met en avant l'eco-responsabilite et la seconde vie des vetements.",
            trendy: "Tendance et a la pointe de la mode. Utilise un vocabulaire fashion et actuel.",
            storyteller: "Raconte une histoire autour de l'article. Cree une connexion emotionnelle avec le vetement.",
            custom: writingStyle
          };
          writingStyle = personaStyles[familyMember.persona_id] || writingStyle;
        }
      }
    }
    console.log("Received imageUrls:", imageUrls);

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error("Invalid imageUrls:", imageUrls);
      return new Response(
        JSON.stringify({ error: "Au moins une URL d'image est requise" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    const errors: string[] = [];

    for (const url of imageUrls) {
      try {
        console.log("Processing image URL:", url);

        const parsedUrl = new URL(url);
        const pathMatch = parsedUrl.pathname.match(/\/storage\/v1\/object\/public\/article-photos\/(.+)$/);

        if (!pathMatch) {
          const errMsg = `Invalid storage URL format: ${url}`;
          console.error(errMsg);
          errors.push(errMsg);
          continue;
        }

        const filePath = pathMatch[1];
        console.log("Downloading file from storage:", filePath);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from("article-photos")
          .download(filePath);

        if (downloadError || !fileData) {
          const errMsg = `Failed to download ${filePath}: ${downloadError?.message || "Unknown error"}`;
          console.error(errMsg);
          errors.push(errMsg);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let base64 = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          base64 += String.fromCharCode.apply(null, Array.from(chunk));
        }
        base64 = btoa(base64);

        const contentType = fileData.type || "image/jpeg";
        const sizeKB = base64.length / 1024;

        console.log(`Successfully converted image to base64: ${filePath} (${sizeKB.toFixed(2)} KB)`);

        imageParts.push({
          inlineData: {
            mimeType: contentType,
            data: base64
          }
        });
      } catch (imgError) {
        const errMsg = `Error processing image ${url}: ${imgError instanceof Error ? imgError.message : String(imgError)}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }

    if (imageParts.length === 0) {
      console.error("All image processing failed:", errors);
      return new Response(
        JSON.stringify({
          error: "Impossible de charger les images depuis le stockage.",
          details: errors.slice(0, 3)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully processed ${imageParts.length}/${imageUrls.length} images`);

    let prompt: string;

    if (isLot && lotArticles && lotArticles.length > 0) {
      const articlesInfo = lotArticles
        .map((art: any, idx: number) => `${idx + 1}. ${art.title} - ${art.brand || 'Sans marque'} - Taille ${art.size || 'N/A'} - ${art.price}€`)
        .join('\n');

      prompt = `Tu es KELLY, une coach de vente EXPERTE sur Vinted avec 8 ans d'experience et plus de 50 000 ventes reussies.
Tu connais PARFAITEMENT l'algorithme Vinted et les meilleures pratiques SEO marketplace.

**TES CONNAISSANCES VINTED (utilise-les dans ton analyse):**

1. ALGORITHME VINTED:
   - Les articles avec 5+ photos ont 3x plus de vues
   - La premiere photo doit etre parfaite (c'est la miniature)
   - Les titres avec marque + type + detail accrocheur performent mieux
   - Les descriptions de 80-150 mots sont optimales
   - Remplir TOUS les champs booste le referencement

2. BONNES PRATIQUES TITRE (max 60 caracteres):
   - Format gagnant: "[Theme] [Type] [Detail accrocheur]"
   - Inclure: nombre d'articles, type, taille ou theme distinctif
   - Eviter: mots vagues, majuscules excessives

3. BONNES PRATIQUES DESCRIPTION LOT:
   - Commencer par la valeur du lot et l'economie realisee
   - Mentionner: liste des articles, coherence, etat general
   - Ajouter des mots-cles naturellement (saison, taille, theme)
   - Terminer par un appel a l'action subtil

4. STRATEGIE PRIX LOT:
   - Prix lot doit etre attractif vs prix individuels
   - Mettre en avant l'economie (ex: "valeur 60€, vendu 30€")

5. PHOTOS QUI VENDENT:
   - Photo 1: tous les articles disposes ensemble
   - Photos suivantes: details de chaque piece
   - Lumiere naturelle, fond neutre

**CONTEXTE DU LOT:**
Voici les articles qui composent ce lot:
${articlesInfo}

**ANALYSE MINUTIEUSE DES PHOTOS:**
1. Examine TOUTES les photos fournies (${imageUrls.length} photo(s)) representant PLUSIEURS articles
2. Identifie les points communs (theme, saison, taille, style)
3. Evalue l'etat general du lot
4. Cherche la coherence entre les articles

STYLE DE REDACTION OBLIGATOIRE: "${writingStyle}"
- Applique CE STYLE exactement pour la description du lot
- Ne mentionne JAMAIS le style dans ta reponse

RETOURNE UN JSON AVEC CES CHAMPS:

INFORMATIONS PRODUIT:
- title: Titre SEO optimise pour LOT Vinted (max 60 car). Format: "Lot [nombre] articles [theme/type] [taille]" Ex: "Lot 5 vetements ete fille 8 ans" ou "Lot 3 robes femme taille M"
- description: 100-150 mots. Structure pour LOT: 1) Presentation du lot et sa valeur 2) Liste des articles avec points forts 3) Theme/coherence du lot 4) Etat general 5) Avantage prix lot. Utilise le style "${writingStyle}".
- brand: "Lot multi-marques" ou marque principale si dominante
- category: La categorie principale du lot
- subcategory: Type de lot (lot enfant, lot ete, lot taille M, etc.)

ATTRIBUTS VINTED:
- color: Couleur dominante du lot parmi: Noir, Marron, Gris, Beige, Fuchsia, Violet, Rouge, Jaune, Bleu, Vert, Orange, Blanc, Argente, Dore, Multicolore, Kaki, Turquoise, Creme, Abricot, Corail, Bordeaux, Rose, Lila, Bleu clair, Marine, Vert fonce, Moutarde, Menthe
- material: Matiere principale (null si mixte)
- size: Taille commune si applicable (null si tailles variees)
- condition: Etat general du lot (very_good si tous en bon etat, good sinon)

OPTIMISATION VENTE:
- season: Saison dominante du lot (spring, summer, autumn, winter, all-seasons)
- suggestedPeriod: Meilleure periode de vente pour ce lot
- estimatedPrice: null (non applicable pour lot)

SEO & MARKETING VINTED:
- seoKeywords: 8 mots-cles pour LOT (ex: ["lot vetements fille", "lot 8 ans", "lot ete enfant", "lot multi-marques", "lot pas cher", "lot occasion", "vetements lot", "bundle"])
- hashtags: 10 hashtags pour LOT (ex: ["#lot", "#bundle", "#lotvetements", "#enfant", "#8ans", "#ete", "#economie", "#secondemain", "#bonplan", "#vinted"])
- searchTerms: 5 termes de recherche lot (ex: ["lot vetements fille 8 ans", "lot ete enfant", "bundle vetements", "lot pas cher", "lot multi-marques"])

QUALITE:
- confidenceScore: Score de confiance 0-100 sur la coherence et qualite du lot

IMPORTANT: Cree une description de LOT qui met en valeur l'economie realisee et la coherence des articles.`;
    } else {
      prompt = `Tu es KELLY, une coach de vente EXPERTE sur Vinted avec 8 ans d'experience et plus de 50 000 ventes reussies.
Tu connais PARFAITEMENT l'algorithme Vinted et les meilleures pratiques SEO marketplace.

**TES CONNAISSANCES VINTED (utilise-les dans ton analyse):**

1. ALGORITHME VINTED:
   - Les articles avec 5+ photos ont 3x plus de vues
   - La premiere photo doit etre parfaite (c'est la miniature)
   - Les titres avec marque + type + detail accrocheur performent mieux
   - Les descriptions de 80-150 mots sont optimales
   - Remplir TOUS les champs booste le referencement

2. BONNES PRATIQUES TITRE (max 60 caracteres):
   - Format gagnant: "[Marque] [Type] [Detail accrocheur]"
   - Inclure: marque, type, couleur ou detail distinctif
   - Eviter: mots vagues, majuscules excessives, prix dans le titre

3. BONNES PRATIQUES DESCRIPTION:
   - Commencer par une accroche emotionnelle
   - Mentionner: etat, taille, matiere, occasion d'achat
   - Ajouter des mots-cles naturellement (style, saison, occasion)
   - Terminer par un call-to-action subtil

4. STRATEGIE PRIX:
   - Prix trop bas = mefiance, prix trop haut = pas de vues
   - Prevoir marge pour negociation (-10 a -20%)
   - Regarder les prix de vente recents (pas les annonces en cours)

5. PHOTOS QUI VENDENT:
   - Photo 1: article entier sur fond neutre
   - Photo 2-3: details (etiquettes, textures, finitions)
   - Photo 4-5: article porte ou mise en situation
   - Lumiere naturelle, pas de flash

**ANALYSE MINUTIEUSE DES PHOTOS:**
1. Examine TOUTES les photos fournies (${imageUrls.length} photo(s))
2. Cherche les ETIQUETTES visibles pour marque et taille
3. Evalue l'etat reel du vetement (usure, defauts, qualite)
4. Identifie les details vendeurs (coupes, finitions, motifs)

STYLE DE REDACTION OBLIGATOIRE: "${writingStyle}"
- Applique CE STYLE exactement pour la description
- Ne mentionne JAMAIS le style dans ta reponse

RETOURNE UN JSON AVEC CES CHAMPS:

INFORMATIONS PRODUIT:
- title: Titre SEO optimise Vinted (max 60 car). Format: "[Marque] [Type] [Detail accrocheur]" Ex: "Zara Robe d'ete fleurie boheme" ou "Nike Air Max 90 blanc etat neuf"
- description: 80-120 mots. Structure: 1) Accroche emotionnelle 2) Description detaillee 3) Points forts 4) Etat 5) Call-to-action subtil. Utilise le style "${writingStyle}".
- brand: Marque exacte si visible (sinon "Sans marque")
- category: tops, bottoms, dresses, outerwear, shoes, accessories, bags
- subcategory: Type precis (t-shirt, jean slim, robe midi, sneakers, etc.)

ATTRIBUTS VINTED:
- color: Une couleur parmi: Noir, Marron, Gris, Beige, Fuchsia, Violet, Rouge, Jaune, Bleu, Vert, Orange, Blanc, Argente, Dore, Multicolore, Kaki, Turquoise, Creme, Abricot, Corail, Bordeaux, Rose, Lila, Bleu clair, Marine, Vert fonce, Moutarde, Menthe
- material: Matiere parmi: Coton, Polyester, Laine, Lin, Soie, Cuir, Cuir synthetique, Denim, Viscose, Velours, Satin, Maille, Cachemire, Acrylique, Nylon, Elasthanne (null si incertain)
- size: Taille exacte de l'etiquette (S/M/L/XL ou 34/36/38/40/42, null si non visible)
- condition: new_with_tags (etiquettes visibles), new_without_tags (neuf sans etiquette), very_good (excellent), good (bon), satisfactory (correct)

OPTIMISATION VENTE:
- season: spring, summer, autumn, winter, all-seasons
- suggestedPeriod: Meilleure periode de vente (ex: "Septembre - Novembre" pour manteaux)
- estimatedPrice: Prix marche en euros (considere: marque, etat, tendance, prix Vinted similaires)

SEO & MARKETING VINTED:
- seoKeywords: 8 mots-cles recherches sur Vinted (ex: ["robe ete", "zara femme", "boheme", "fleurie", "taille M", "occasion", "tendance 2024", "maxi dress"])
- hashtags: 10 hashtags tendance (ex: ["#zara", "#robeete", "#boheme", "#vintage", "#secondemain", "#modeethique", "#frenchstyle", "#ootd", "#vinted", "#bonplan"])
- searchTerms: 5 termes de recherche que les acheteurs utilisent (ex: ["robe zara ete", "robe fleurie femme", "robe boheme M", "robe longue occasion", "zara robe"])

QUALITE:
- confidenceScore: Score de confiance 0-100 sur la precision de ton analyse (100 = etiquettes visibles et article identifie avec certitude)

IMPORTANT: Analyse toutes les images fournies pour extraire le maximum d'informations.`;
    }

    console.log("Sending request to Gemini with", imageUrls.length, "images", isLot ? "(LOT MODE)" : "");

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const parts: any[] = [
        { text: prompt },
        ...imageParts
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              brand: { type: Type.STRING },
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              color: { type: Type.STRING },
              material: { type: Type.STRING },
              size: { type: Type.STRING },
              condition: { type: Type.STRING },
              season: { type: Type.STRING },
              suggestedPeriod: { type: Type.STRING },
              estimatedPrice: { type: Type.NUMBER },
              seoKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              searchTerms: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ["title", "description", "brand", "category", "color", "condition", "season"]
          }
        }
      });

      console.log("Gemini response received");

      if (!response.text) {
        console.error("Empty response from Gemini");
        return new Response(
          JSON.stringify({ error: "L'IA n'a pas pu analyser les images. Veuillez reessayer." }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const parsedResponse = JSON.parse(response.text);
      console.log("Gemini analysis completed successfully");

      const analysisResult: AnalysisResult = {
        title: parsedResponse.title,
        description: parsedResponse.description,
        brand: parsedResponse.brand,
        category: parsedResponse.category,
        subcategory: parsedResponse.subcategory,
        color: parsedResponse.color,
        material: parsedResponse.material,
        size: parsedResponse.size,
        condition: parsedResponse.condition,
        season: parsedResponse.season,
        suggestedPeriod: parsedResponse.suggestedPeriod,
        estimatedPrice: parsedResponse.estimatedPrice,
        seoKeywords: parsedResponse.seoKeywords,
        hashtags: parsedResponse.hashtags,
        searchTerms: parsedResponse.searchTerms,
        confidenceScore: parsedResponse.confidenceScore,
      };

      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);

      let errorMessage = "Erreur lors de l'analyse avec Gemini";

      if (geminiError?.message?.includes('quota') || geminiError?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "Quota Gemini depasse. Veuillez reessayer plus tard ou activer la facturation sur Google Cloud.";
      } else if (geminiError?.message?.includes('API key')) {
        errorMessage = "Cle API Gemini invalide ou manquante. Verifiez GEMINI_API_KEY dans les secrets Supabase.";
      } else if (geminiError?.message) {
        errorMessage += `: ${geminiError.message}`;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in analyze-article-image:", error);
    return new Response(
      JSON.stringify({ error: `Erreur serveur: ${error?.message || "Unknown error"}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
