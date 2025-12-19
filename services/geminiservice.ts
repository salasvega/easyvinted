
import { GoogleGenAI, Type } from "@google/genai";
import { Article } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the product image to generate Vinted-ready details.
 */
export const analyzeProductImage = async (base64Image: string, mimeType: string): Promise<Partial<Article>> => {
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    You are an expert Vinted seller assistant. Analyze this product image to create a high-converting listing.
    
    Extract or infer the following details with high accuracy:
    1. Title: Catchy, includes brand + type + key feature (max 80 chars).
    2. Description: Detailed, mentioning condition, fit, and style.
    3. Brand: The brand name if visible or inferable (e.g., Nike, Zara). If unknown, use "Unknown".
    4. Size: Estimated size (e.g., M, 38, One Size).
    5. Condition: One of 'new_with_tag', 'very_good', 'good', 'satisfactory'.
    6. Color: Primary color.
    7. Material: Estimated material (Cotton, Polyester, Leather, etc.).
    8. Price: Estimated market value in EUR (just the number).
    9. Marketing: Instagram caption and hashtags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            brand: { type: Type.STRING },
            size: { type: Type.STRING },
            condition: { type: Type.STRING, enum: ['new_with_tag', 'very_good', 'good', 'satisfactory'] },
            color: { type: Type.STRING },
            material: { type: Type.STRING },
            price: { type: Type.STRING },
            category: { type: Type.STRING },
            marketing: {
              type: Type.OBJECT,
              properties: {
                instagramCaption: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
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
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: instruction }
        ]
      }
    });

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

/**
 * Provides coaching advice for a listing.
 */
export const getListingCoachAdvice = async (article: Partial<Article>, base64Image?: string): Promise<string> => {
  const model = 'gemini-3-pro-preview';

  const context = `
    Listing Data:
    Title: ${article.title}
    Description: ${article.description}
    Price: ${article.price}
    Brand: ${article.brand}
    Condition: ${article.condition}
  `;

  const prompt = `
    You are "Coach Vinted", a friendly, enthusiastic, and highly expert second-hand fashion seller. 
    Your goal is to help the user sell their item faster and at a better price.

    Analyze the provided listing details and the photo (if available).
    
    Output a structured, conversational response in Markdown format:
    1. **Listing Score**: Give a score out of 10 based on completeness and attractiveness.
    2. **What's Great**: 2-3 positive points about the listing (e.g., clear title, good brand).
    3. **Pro Tips to Sell Faster**: 3 specific, actionable recommendations. 
       - Critique the title (is it SEO friendly?).
       - Critique the description (is it emotional enough?).
       - Critique the price (is it psychological? e.g., 14.90 vs 15.00).
       - If the photo is provided, comment on lighting or background.
    
    Keep the tone encouraging, emoji-rich, and concise.
  `;

  const parts: any[] = [{ text: prompt }, { text: context }];
  
  if (base64Image) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts }
    });

    return response.text || "I couldn't generate advice at the moment. Try again!";
  } catch (error) {
    console.error("Coaching failed:", error);
    return "Oops, I'm having trouble connecting to the coaching server right now.";
  }
};
