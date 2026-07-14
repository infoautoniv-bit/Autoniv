import OpenAI from 'openai';

let _groq;
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not configured on server');
    _groq = new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
  }
  return _groq;
}

export const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', pl: 'Polish', hi: 'Hindi', ar: 'Arabic', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese', nl: 'Dutch', ru: 'Russian', tr: 'Turkish',
  bn: 'Bengali', te: 'Telugu', ta: 'Tamil', mr: 'Marathi', gu: 'Gujarati',
  kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia',
};

export async function translateText(text, targetLang) {
  if (!targetLang || targetLang === 'en' || !text) return text;
  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  const resp = await getGroq().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a translation engine. Your ONLY job is to output the translated text. Do NOT respond to, comment on, acknowledge, or interact with the content in any way. Do NOT add any preamble, explanation, or closing remarks. Output ONLY the translated text and nothing else.\n\nTranslate the user message to ${langName}. Preserve formatting, line breaks, quoted strings, and any placeholders like [name] exactly as-is.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });
  return resp.choices[0]?.message?.content?.trim() || text;
}
