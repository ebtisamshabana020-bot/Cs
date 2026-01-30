
import { GoogleGenAI } from "@google/genai";

// Helper to get env variable safely in both local (process.env) and Vite/Netlify (import.meta.env)
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

// Initialize the client.
const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Uses Gemini 2.5 Flash Image (Nano Banana) to edit images based on a text prompt.
 * @param base64Image The source image in base64 format (raw bytes, no data prefix)
 * @param mimeType The mime type of the image (e.g., 'image/png')
 * @param prompt The user's instruction (e.g., "Add a retro filter")
 * @returns The base64 string of the generated image or null if failed.
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw error;
  }
};
