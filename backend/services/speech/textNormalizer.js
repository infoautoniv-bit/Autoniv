/**
 * Spoken Text Normalizer for Voice AI
 * Converts written text, dates, currency, abbreviations, and markdown into natural human phonetic speech.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ABBREVIATIONS = [
  { regex: /\bDr\./gi, replace: 'Doctor' },
  { regex: /\bMr\./gi, replace: 'Mister' },
  { regex: /\bMrs\./gi, replace: 'Missus' },
  { regex: /\bMs\./gi, replace: 'Mizz' },
  { regex: /\bProf\./gi, replace: 'Professor' },
  { regex: /\bSt\.\s/gi, replace: 'Saint ' },
  { regex: /\bAve\./gi, replace: 'Avenue' },
  { regex: /\bBlvd\./gi, replace: 'Boulevard' },
  { regex: /\bRd\./gi, replace: 'Road' },
  { regex: /\bApt\./gi, replace: 'Apartment' },
  { regex: /\bvs\./gi, replace: 'versus' },
  { regex: /\betc\./gi, replace: 'etcetera' },
  { regex: /\be\.g\./gi, replace: 'for example' },
  { regex: /\bi\.e\./gi, replace: 'that is' },
  { regex: /\ba\.m\./gi, replace: 'A M' },
  { regex: /\bp\.m\./gi, replace: 'P M' },
  { regex: /\bAM\b/g, replace: 'A M' },
  { regex: /\bPM\b/g, replace: 'P M' },
];

export function normalizeForSpeech(text, lang = 'en') {
  if (!text || typeof text !== 'string') return '';

  let normalized = text;

  // 1. Remove markdown bolding, asterisks, headers, bullet points, and emojis
  normalized = normalized.replace(/[*#_~`]/g, '');
  normalized = normalized.replace(/^[\s]*[-•*]\s+/gm, '');
  normalized = normalized.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  // 2. Expand common abbreviations
  for (const item of ABBREVIATIONS) {
    normalized = normalized.replace(item.regex, item.replace);
  }

  // 3. Currency Normalization ($49.99, ₹4,999, €50, £25)
  normalized = normalized.replace(/\$(\d+(?:\.\d{2})?)/g, (_, val) => {
    if (val.includes('.')) {
      const [dollars, cents] = val.split('.');
      return `${dollars} dollars and ${cents} cents`;
    }
    return `${val} dollars`;
  });

  normalized = normalized.replace(/(?:₹|INR\s*)(\d+(?:,\d+)*(?:\.\d{2})?)/gi, (_, val) => {
    const clean = val.replace(/,/g, '');
    return `${clean} rupees`;
  });

  normalized = normalized.replace(/€(\d+)/g, '$1 euros');
  normalized = normalized.replace(/£(\d+)/g, '$1 pounds');

  // 4. Ticket IDs & Order IDs (e.g. TKT-89402 -> Ticket 8 9 4 0 2)
  normalized = normalized.replace(/\bTKT-([A-Z0-9]+)\b/gi, (_, code) => {
    return 'Ticket ' + code.split('').join(' ');
  });

  // 5. Clean multiple whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}
