import { GoogleGenAI } from "@google/genai";

export async function generateStylizedImage(
  base64Image: string, 
  mimeType: string, 
  influence: number = 50, 
  description: string = "",
  scene: string = "",
  quality: 'standard' | 'high' = 'standard'
) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const influenceText = influence === 100 
      ? "strictly follow the reference image's composition and features" 
      : influence === 0 
        ? "ignore the reference image's specific details and focus on the description" 
        : `use the reference image with about ${influence}% influence for composition and features`;

    const descriptionText = description 
      ? `The character should be: ${description}.` 
      : "Stylize the character from the image.";

    const sceneText = scene
      ? `The scene and action should be: ${scene}.`
      : "The character should be in a high-quality artistic setting.";

    const prompt = `
      Task: Generate a high-quality, artistic, old-style vintage portrait.
      Aesthetic: Vintage, aged look, sepia-toned or muted colors, film grain, classic photography style from the early 20th century.
      Reference Image Influence: ${influenceText}.
      Character Details: ${descriptionText}
      Scene & Action: ${sceneText}
      Style: High-quality artistic render, detailed textures, professional lighting, authentic vintage feel.
      Constraint: If the reference image contains a person, ensure the stylized version retains recognizable human features in the specified vintage style.
      Output: Return only the final image.
    `.trim();

    const model = quality === 'high' ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';
    const config = quality === 'high' ? { imageConfig: { imageSize: '2K' as any } } : {};

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: config as any,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function removeBackground(base64Image: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: "Remove the background from this image. Return only the subject with a transparent background. Output as a PNG image.",
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
}
