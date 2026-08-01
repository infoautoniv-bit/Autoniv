export const LANGUAGE_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  bn: 'Bengali', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam',
  mr: 'Marathi', pa: 'Punjabi', or: 'Odia', es: 'Spanish',
  fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  pl: 'Polish', ar: 'Arabic', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', nl: 'Dutch', ru: 'Russian', tr: 'Turkish',
};

export async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!response.ok) return text;
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (err) {
    return text;
  }
}
