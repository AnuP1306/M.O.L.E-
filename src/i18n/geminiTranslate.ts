type Language = 'en' | 'hi';

const MODEL = 'gemini-3.5-flash-lite';
const cache = new Map<string, string>();

export async function translateTexts(
  texts: string[],
  targetLanguage: Language,
  signal?: AbortSignal
): Promise<string[]> {
  if (targetLanguage === 'en' || texts.length === 0) {
    return texts;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is missing from .env.local');
  }

  const missing = [...new Set(
    texts.filter((text) => text.trim() && !cache.has(`hi:${text}`))
  )];

  if (missing.length > 0) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: [
                'Translate this JSON array of English user interface strings into natural Hindi.',
                'Return ONLY a JSON array of strings, in exactly the same order and length.',
                'Preserve technical terms, names, mine codes, IDs, units, numbers, CH4, CO, LiDAR and M.O.L.E.',
                'Keep safety and emergency instructions clear and unambiguous.',
                JSON.stringify(missing),
              ].join('\n'),
            }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini translation failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const output = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('');

    if (!output) {
      throw new Error('Gemini returned an empty translation');
    }

    const translated: unknown = JSON.parse(output);

    if (
      !Array.isArray(translated) ||
      translated.length !== missing.length ||
      !translated.every((item) => typeof item === 'string')
    ) {
      throw new Error('Gemini returned an unexpected translation format');
    }

    missing.forEach((original, index) => {
      cache.set(`hi:${original}`, translated[index] as string);
    });
  }

  return texts.map((text) => cache.get(`hi:${text}`) ?? text);
}