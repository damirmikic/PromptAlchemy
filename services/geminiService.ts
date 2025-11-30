import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedResult } from '../types';

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
  selectedDetails: string[],
  imageBase64?: string
): Promise<GeneratedResult> => {
  try {
    // Initialize client here to ensure it picks up the latest API Key from the environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const detailsString = selectedDetails.join(", ");
    
    // Switch to gemini-2.5-flash if image is present (multimodal), otherwise use flash-lite for text speed
    const model = imageBase64 ? 'gemini-2.5-flash' : 'gemini-flash-lite-latest';

    const parts: any[] = [];

    if (imageBase64) {
      // Clean base64 string if needed (remove data URI prefix)
      const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: "image/png"
        }
      });

      parts.push({
        text: `
          Analyze this image to create a perfect video generation prompt.
          
          User's Additional Notes/Context: "${baseIdea}"
          Selected Style Details: "${detailsString}"
          
          Task:
          1. Analyze the visual elements of the image (subject, lighting, angle, style) in extreme detail.
          2. Create an 'imagePrompt' that would accurately recreate this static image.
          3. Create a 'videoPrompt' that brings this image to life. Imagine how the subject would move, how the camera would interact, and the physics of the scene. Focus on motion and temporal flow.
          4. Provide a short explanation of how you interpreted the image into motion.
        `
      });
    } else {
      parts.push({
        text: `
          You are an expert prompt engineer for advanced AI generation models like Midjourney V6, DALL-E 3, and Google Veo.
          
          User's Base Concept: "${baseIdea}"
          
          Selected Style/Technical Details: "${detailsString}"
          
          Task:
          1. Synthesize the base concept with the selected details into a cohesive, descriptive, and high-quality prompt.
          2. Do not just list keywords at the end; weave them into the description naturally where possible.
          3. For the 'imagePrompt', focus on texture, lighting, composition, and fidelity.
          4. For the 'videoPrompt', take the same concept but emphasize motion, camera movement, temporal consistency, and physics.
          5. Provide a short explanation of the choices.
          6. CRITICAL: If the user provides specific text to be displayed (e.g., signs, speech, labels), preserve that text EXACTLY as written in the prompts.
        `
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export type ComicTextStyle = 'with_text' | 'empty_bubbles' | 'no_text';

export const generateImage = async (
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
  mode: 'image' | 'comic_page' | 'comic_cover' | 'character_design',
  attributes: string[] = [],
  inputImageBase64?: string,
  resolution: '1K' | '2K' = '1K',
  worldContext?: string,
  characterContext?: string,
  textStyle: ComicTextStyle = 'with_text'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct Context Block
    let contextBlock = "";
    if (worldContext || characterContext) {
      contextBlock = `
[PERSISTENT CONSISTENCY DATA START]
${worldContext ? `WORLD/SETTING RULES: ${worldContext}` : ''}
${characterContext ? `CHARACTER ROSTER/DESIGNS: ${characterContext}` : ''}
[PERSISTENT CONSISTENCY DATA END]
All generated content MUST adhere strictly to the World Rules and Character Designs above.
`;
    }

    const styleContext = attributes.length > 0 ? ` Art Style, Lighting & Atmosphere details: ${attributes.join(", ")}` : "";
    
    let finalPrompt = "";
    
    if (mode === 'comic_page') {
      let textInstruction = "";
      switch (textStyle) {
        case 'empty_bubbles':
          textInstruction = "\n\n**CRITICAL INSTRUCTION - EMPTY SPEECH BUBBLES ONLY:**\nThe image must contain speech bubbles and caption boxes corresponding to the script's dialogue, but they MUST BE COMPLETELY BLANK WHITE SHAPES. \n\n**ABSOLUTELY NO TEXT** inside the bubbles. Do not attempt to letter the comic. Just draw the empty white containers where text would go.";
          break;
        case 'no_text':
          textInstruction = "\n\n**CRITICAL INSTRUCTION - NO TEXT/BUBBLES:**\nDo NOT include any speech bubbles, caption boxes, or text overlays. Create only the visual art and panel composition. The dialogue in the script is for context on characters' expressions and actions only. Render the scene purely visually.";
          break;
        case 'with_text':
        default:
          textInstruction = "\n\n**CRITICAL INSTRUCTION - TEXT FIDELITY:**\nAny dialogue, speech bubbles, captions, or onomatopoeia specified in the script MUST be rendered EXACTLY as written in the image. Do not summarize, paraphrase, or alter the text inside speech bubbles.";
          break;
      }

      finalPrompt = `${contextBlock}\nCreate a high-quality comic book page layout with multiple panels based on the following script. ${textInstruction}\n\nEnsure clear visual storytelling and proper panel composition.${styleContext} \n\nScript: ${prompt}`;
      
    } else if (mode === 'comic_cover') {
      finalPrompt = `${contextBlock}\nCreate a MASTERPIECE COMIC BOOK COVER art. \n\n**CRITICAL INSTRUCTION:**\nIf a specific title, issue number, or tag-line is provided in the prompt, it must be rendered EXACTLY as written.\n\n${styleContext} \n\nCover Concept/Story Context: ${prompt}. \n\nRequirements: Single striking image, dynamic composition, central hero/subject, dramatic lighting, space at top for title logo, highly detailed, eye-catching.`;
    } else if (mode === 'character_design') {
      finalPrompt = `${contextBlock}\nCreate a DETAILED CHARACTER REFERENCE SHEET for: ${prompt}. \n\nRequirements: Full body shot, neutral background (studio grey or white), high fidelity, perfectly distinct facial features, costume details. ${styleContext}.\n\n(This image will be used as a reference for future consistency, so ensure traits are clear).`;
    } else {
      finalPrompt = `${contextBlock}\n${prompt}.${styleContext}\n\n(IMPORTANT: If specific text is requested to be visible in the image, ensure it is rendered exactly as written).`;
    }

    // If upscaling/magnifying (2K), use Pro model. Otherwise use Flash Image.
    const model = resolution === '2K' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const parts: any[] = [];

    // If there is an input image, it's an edit or upscale request
    if (inputImageBase64) {
      // Basic strip of prefix if present
      const cleanBase64 = inputImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
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