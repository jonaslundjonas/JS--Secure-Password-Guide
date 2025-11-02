
import { GoogleGenAI, Type } from "@google/genai";
import type { PasswordOptions } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        password: {
            type: Type.STRING,
            description: "The generated secure password."
        },
        explanation: {
            type: Type.STRING,
            description: "A pedagogical explanation of why the generated password is secure, focusing on the provided criteria."
        }
    },
    required: ["password", "explanation"]
};

export async function generateSecurePasswordAndExplanation(options: PasswordOptions): Promise<{ password: string; explanation: string }> {
  try {
    const prompt = `
Generate a secure, random password based on these criteria:
- Length: ${options.length} characters
- Include Uppercase Letters (A-Z): ${options.includeUppercase}
- Include Numbers (0-9): ${options.includeNumbers}
- Include Special Symbols (!@#$%^&*): ${options.includeSymbols}

Also, provide a brief, educational explanation for a non-technical user about why a password with these specific characteristics is considered strong. Focus on concepts like character set size, length, and unpredictability.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.0, // Higher temperature for more randomness in password generation
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && typeof result.password === 'string' && typeof result.explanation === 'string') {
        return result;
    } else {
        throw new Error("Invalid JSON structure received from API.");
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate password and explanation from Gemini API.");
  }
}
