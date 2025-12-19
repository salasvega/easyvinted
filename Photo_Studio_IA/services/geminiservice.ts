import { GoogleGenAI, Type } from "@google/genai";
import { ProductData } from "../types";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not configured");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

/**
 * Analyzes the product image using gemini-3-pro-preview to generate e-commerce details.
 * Returns an array of detected products.
 */
export const analyzeProductImage = async (base64Image: string, mimeType: string): Promise<ProductData[]> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    You are an expert e-commerce copywriter and social media strategist. 
    Analyze this product image.
    
    Identify ALL distinct fashion or accessory products visible in the image (e.g., if there is a Shirt and a Hat, create separate entries for each). 
    If there is only one product, return a single entry.
    
    For EACH detected product, generate a high-converting listing kit:
    1. Product Listing: Catchy title, persuasive description, 5 key features, category, and price estimate (USD).
    2. Marketing Assets:
       - An engaging Instagram caption with emojis.
       - A list of 10 relevant, high-traffic hashtags.
       - A short, punchy sales email draft.
       - 5 SEO keywords.
  `;

  try {
    const response = await getAI().models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  features: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  category: { type: Type.STRING },
                  priceEstimate: { type: Type.STRING },
                  marketing: {
                    type: Type.OBJECT,
                    properties: {
                      instagramCaption: { type: Type.STRING },
                      hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                      salesEmail: { type: Type.STRING },
                      seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                },
                required: ["title", "description", "features", "marketing"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.products || [];
    }
    throw new Error("No text response from model");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Edits the product image using gemini-2.5-flash-image based on text instructions.
 */
export const editProductImage = async (
  base64Image: string, 
  mimeType: string, 
  instruction: string
): Promise<string> => {
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await getAI().models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: instruction }
        ]
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Editing failed:", error);
    throw error;
  }
};
