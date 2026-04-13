import OpenAI from "openai";
import { buildPrompt } from "./prompts";
import { AuraResult, SigmaPath } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function rateAura(
  imageBase64: string,
  path: SigmaPath
): Promise<AuraResult> {
  const systemPrompt = buildPrompt(path);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "low",
            },
          },
          {
            type: "text",
            text: "Rate this person's aura. Return ONLY the JSON.",
          },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned empty response — aura too powerful to compute fr");

  const result: AuraResult = JSON.parse(raw);
  result.aura_score = Math.max(0, Math.min(1000, Math.round(result.aura_score)));

  return result;
}
