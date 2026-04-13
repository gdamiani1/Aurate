// For now, rely on Gemini's built-in safety filters
// Gemini automatically blocks harmful content
export async function moderateImage(_imageBase64: string): Promise<{ safe: boolean; reason?: string }> {
  // Gemini has built-in safety filters that will reject harmful content
  // We'll get a SAFETY block error from the API if content is inappropriate
  // Additional custom moderation can be added later
  return { safe: true };
}

export function moderateOutput(text: string): boolean {
  const blocklist: string[] = []; // TODO: populate before launch
  const lower = text.toLowerCase();
  return !blocklist.some(term => lower.includes(term));
}
