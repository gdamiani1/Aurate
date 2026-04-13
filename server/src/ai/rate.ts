import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "./prompts";
import { AuraResult, SigmaPath } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function rateAura(
  imageBase64: string,
  path: SigmaPath
): Promise<AuraResult> {
  const systemPrompt = buildPrompt(path);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    },
    { text: "Rate this person's aura. Return ONLY the JSON." },
  ]);

  const raw = result.response.text();
  if (!raw) throw new Error("AI returned empty response — aura too powerful to compute fr");

  const parsed: AuraResult = JSON.parse(raw);

  // Clamp score to valid range
  parsed.aura_score = Math.max(0, Math.min(1000, Math.round(parsed.aura_score)));

  return parsed;
}
