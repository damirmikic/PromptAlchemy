import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    imagePrompt: {
      type: Type.STRING,
      description: "The highly detailed, optimized prompt for an image generation model.",
    },
    videoPrompt: {
      type: Type.STRING,
      description: "A modified version of the prompt optimized for video generation models (like Veo or Sora), focusing on motion and temporal coherence.",
    },
    explanation: {
      type: Type.STRING,
      description: "A brief explanation of the enhancements made (max 2 sentences).",
    }
  },
  required: ["imagePrompt", "videoPrompt", "explanation"],
};

export const generatePerfectPrompt = async (
  baseIdea: string,
  selectedDetails: string[]
): Promise<GeneratedResult> => {
  try {
    const detailsString = selectedDetails.join(", ");
    
    const prompt = `
      You are an expert prompt engineer for advanced AI generation models like Midjourney V6, DALL-E 3, and Google Veo.
      
      User's Base Concept: "${baseIdea}"
      
      Selected Style/Technical Details: "${detailsString}"
      
      Task:
      1. Synthesize the base concept with the selected details into a cohesive, descriptive, and high-quality prompt.
      2. Do not just list keywords at the end; weave them into the description naturally where possible.
      3. For the 'imagePrompt', focus on texture, lighting, composition, and fidelity.
      4. For the 'videoPrompt', take the same concept but emphasize motion, camera movement, temporal consistency, and physics.
      5. Provide a short explanation of the choices.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are a world-class creative director and prompt engineer. Your goal is to maximize the aesthetic output of AI models.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    return JSON.parse(text) as GeneratedResult;

  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};

const SUGGESTION_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING,
    description: "The ID of the suggested option.",
  }
};

export const suggestAttributes = async (
  baseIdea: string,
  availableOptions: { id: string; label: string; description: string }[]
): Promise<string[]> => {
  try {
    const optionsText = availableOptions.map(o => `ID: ${o.id} | Label: ${o.label} | Desc: ${o.description}`).join("\n");

    const prompt = `
      You are a creative assistant. Based on the user's concept, suggest the most relevant Style, Lighting, Camera, and Mood options to enhance their prompt.
      
      User's Concept: "${baseIdea}"
      
      Available Options:
      ${optionsText}
      
      Task:
      Select 3 to 6 IDs from the Available Options that best fit the concept. Return ONLY the IDs in a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SUGGESTION_SCHEMA,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text) as string[];

  } catch (error) {
    console.error("Error suggesting attributes:", error);
    return [];
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
  isComic: boolean,
  attributes: string[] = [],
  inputImageBase64?: string,
  resolution: '1K' | '2K' = '1K'
): Promise<string> => {
  try {
    const styleContext = attributes.length > 0 ? ` Art Style, Lighting & Atmosphere details: ${attributes.join(", ")}` : "";
    
    let finalPrompt = "";
    if (isComic) {
      finalPrompt = `Create a high-quality comic book page layout with multiple panels based on the following script/description. Ensure clear visual storytelling, speech bubbles where appropriate, and a consistent style.${styleContext} \n\nScript: ${prompt}`;
    } else {
      finalPrompt = `${prompt}.${styleContext}`;
    }

    // If upscaling/magnifying (2K), use Pro model. Otherwise use Flash Image.
    const model = resolution === '2K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const parts: any[] = [];

    // If there is an input image, it's an edit or upscale request
    if (inputImageBase64) {
      // Basic strip of prefix if present
      const cleanBase64 = inputImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: "image/png", 
        }
      });
    }

    parts.push({ text: finalPrompt });

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    };

    // Only 'gemini-3-pro-image-preview' supports imageSize
    if (resolution === '2K') {
      config.imageConfig.imageSize = '2K';
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};