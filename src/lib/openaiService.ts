import OpenAI from "openai";

let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_OPENAI_API_KEY is not configured");
    }
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  return openai;
};

export interface ProductData {
  title: string;
  description: string;
  features: string[];
  category?: string;
  priceEstimate?: string;
  brand?: string;
  size?: string;
  color?: string;
  material?: string;
  condition?: string;
  gender?: string;
  season?: string;
  suggestedPeriod?: string;
  marketing?: {
    instagramCaption: string;
    hashtags: string[];
    salesEmail: string;
    seoKeywords: string[];
  };
}

export const analyzeProductImage = async (
  base64Image: string,
  mimeType: string,
  writingStyle?: string
): Promise<ProductData[]> => {
  console.log('=== OpenAI Analysis ===');
  console.log('Writing style received:', writingStyle);

  const writingStyleInstruction = writingStyle
    ? `\n    ===== CRITICAL WRITING STYLE REQUIREMENT =====
    You MUST write the description in the following specific style. This is MANDATORY and NON-NEGOTIABLE:
    "${writingStyle}"

    IMPORTANT INSTRUCTIONS:
    - If this style asks for a "liste à points" (bullet point list), you MUST format the description as a bullet point list using the bullet character (•)
    - If this style specifies "5 à 7 éléments", create exactly that number of bullet points
    - If the style says "Pas de bla bla" (no fluff), be concise and factual
    - If the style uses a specific tone (décontracté, professionnel, etc.), match it EXACTLY
    - Apply the EXACT format, tone, vocabulary, and personality requested in this writing style
    - DO NOT mention or refer to the writing style itself in your response - just apply it naturally
    - The description field must reflect this writing style in both format AND content
    ================================================\n    `
    : '';

  const prompt = `
    You are an expert fashion analyst for a second-hand clothing marketplace (Vinted).
    Analyze this product image in detail and extract ALL visible information.

    IMPORTANT: Look carefully at any visible tags, labels, or etiquettes on the item to extract brand and size information.
${writingStyleInstruction}
    Identify ALL distinct fashion or accessory products visible in the image.
    If there is only one product, return a single entry.

    For EACH detected product, extract the following information:

    1. BASIC INFO:
       - title: A catchy, descriptive title in French (e.g., "Robe d'été fleurie Zara")
       - description: ${writingStyle ? 'CRITICAL: Write the description using the EXACT writing style specified above. If the style requires bullet points, use bullet points (•). If it requires a specific format or tone, follow it EXACTLY. The format and tone are dictated by the writing style above.' : 'Detailed description in French (2-3 sentences) highlighting condition, style, and key features'}
       - features: 5 key features or selling points in French

    2. BRAND & SIZE:
       - brand: The brand name if visible on tags/labels/logos (if not visible, return null)
       - size: The size if visible on tags/labels (e.g., "M", "38", "42", "S", "XL", etc. - if not visible, return null)

    3. PHYSICAL ATTRIBUTES:
       - color: The main color in French (e.g., "Bleu", "Rouge", "Noir", "Beige", "Multicolore", etc.)
       - material: The fabric/material if identifiable (e.g., "Coton", "Polyester", "Laine", "Jean", "Cuir", "Soie", etc. - if uncertain, return null)

    4. CONDITION:
       - condition: Assess the visible condition. Return ONE of these exact values:
         * "new_with_tags" - if tags are still attached
         * "new_without_tags" - if looks new but no tags
         * "very_good" - excellent condition, minimal wear
         * "good" - good condition, light wear
         * "satisfactory" - acceptable condition, visible wear

    5. TARGET AUDIENCE:
       - gender: Return ONE of these exact values: "Femmes", "Hommes", "Enfants", or "Mixte"

    6. SEASONALITY:
       - season: Return ONE of these exact values based on the item type:
         * "spring" - for spring items (light jackets, transitional pieces)
         * "summer" - for summer items (shorts, t-shirts, dresses, sandals)
         * "autumn" - for autumn items (sweaters, boots, transitional coats)
         * "winter" - for winter items (heavy coats, boots, scarves)
         * "all-seasons" - for items that can be worn year-round
       - suggestedPeriod: The best months to sell this item in French (e.g., "Mars - Mai", "Juin - Août", "Toute l'année")

    7. PRICING:
       - priceEstimate: Estimated resale price in euros (format: "XX €" - consider condition and brand)

    8. CATEGORY:
       - category: The type of item in French (e.g., "Robe", "T-shirt", "Jean", "Basket", "Sac", "Manteau", etc.)

    Return the response as a JSON object with this exact structure:
    {
      "products": [
        {
          "title": "Product Title in French",
          "description": "Detailed description in French",
          "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
          "category": "Category in French",
          "priceEstimate": "XX €",
          "brand": "Brand Name or null",
          "size": "Size or null",
          "color": "Color in French",
          "material": "Material in French or null",
          "condition": "new_with_tags|new_without_tags|very_good|good|satisfactory",
          "gender": "Femmes|Hommes|Enfants|Mixte",
          "season": "spring|summer|autumn|winter|all-seasons",
          "suggestedPeriod": "Period in French",
          "marketing": {
            "instagramCaption": "Caption with emojis",
            "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"],
            "salesEmail": "Email draft",
            "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
          }
        }
      ]
    }

    CRITICAL: Pay special attention to any visible labels, tags, or etiquettes to extract brand and size information accurately.
  `;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return parsed.products || [];
    }
    throw new Error("No response from model");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const editProductImage = async (
  base64Image: string,
  mimeType: string,
  instruction: string
): Promise<string> => {
  throw new Error("L'édition d'images n'est pas supportée avec OpenAI. Cette fonctionnalité nécessite Gemini ou un service d'édition d'images dédié.");
};
