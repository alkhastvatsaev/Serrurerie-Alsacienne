import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSy..."; // Placeholder or actual key if provided

const genAI = new GoogleGenerativeAI(API_KEY);

export async function identifyLockFromImage(file: File): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Image = base64Data.split(',')[1];

    const prompt = "Identify this lock brand and model. Suggest a replacement part if possible. Keep it short.";
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo if API key is invalid/missing
    return "Analyse Simulée (Clé API manquante) : Serrure Vachette Radialis, Cylindre 30x40mm. Remplacement recommandé : Ref-V892.";
  }
}
