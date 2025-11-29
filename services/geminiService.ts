import { GoogleGenAI } from "@google/genai";

// Initialize the client assuming API_KEY is valid and present in environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectIdea = async (skillLevel: string): Promise<{name: string, description: string} | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Придумай название и короткое описание (одно предложение) для IT-проекта, который мог бы создать разработчик уровня "${skillLevel}". 
      Ответь в формате JSON: {"name": "Название", "description": "Описание"}. 
      Будь креативным и немного юморным.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateRandomEvent = async (): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Придумай короткое (1 предложение), смешное или неожиданное событие, которое случилось с программистом во время работы. Используй сленг.",
    });
    return response.text || null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateCodeSnippet = async (): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Напиши одну строку очень запутанного или смешного кода на JavaScript или Python.",
        });
        return response.text || null;
    } catch (error) {
        return null;
    }
}

export const generateReview = async (projectName: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Напиши короткий отзыв пользователя (одно предложение) на программу с названием "${projectName}". Это может быть восторженный отзыв или гневный баг-репорт.`,
        });
        return response.text || null;
    } catch (error) {
        return null;
    }
}