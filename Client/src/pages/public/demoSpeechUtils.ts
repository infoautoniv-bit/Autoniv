export function humanizeSpeechText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';

  let h = text;

  // 1. Expand common titles & abbreviations
  h = h.replace(/\bDr\.(?=\s|[A-Z])/gi, 'Doctor ');
  h = h.replace(/\bMr\.(?=\s|[A-Z])/gi, 'Mister ');
  h = h.replace(/\bMrs\.(?=\s|[A-Z])/gi, 'Missus ');
  h = h.replace(/\bMs\.(?=\s|[A-Z])/gi, 'Miss ');
  h = h.replace(/\bAppt\.?|\bapt\.?/gi, 'appointment');
  h = h.replace(/\bRs\.?|₹/gi, 'Rupees ');
  h = h.replace(/\bINR\b/g, 'Rupees');
  h = h.replace(/\bvs\.?/gi, 'versus');
  h = h.replace(/\be\.g\.?/gi, 'for example');
  h = h.replace(/\bi\.e\.?/gi, 'that is');
  h = h.replace(/\betc\.?/gi, 'et cetera');
  h = h.replace(/\bapprox\.?/gi, 'approximately');
  h = h.replace(/\bw\/o\b/gi, 'without');
  h = h.replace(/\bw\//gi, 'with ');

  // 2. Expand units & symbols
  h = h.replace(/%/g, ' percent');
  h = h.replace(/&/g, ' and ');
  h = h.replace(/\bmin\b|\bmins\b|\bmin\./gi, ' minutes');
  h = h.replace(/\bsec\b|\bsecs\b|\bsec\./gi, ' seconds');
  h = h.replace(/\bhr\b|\bhrs\b|\bhr\./gi, ' hours');
  h = h.replace(/\bms\b/gi, ' milliseconds');
  h = h.replace(/\bp\.a\./gi, ' per annum');

  // 3. Technical acronyms spelled out with clear character breaks for speech engines
  h = h.replace(/\bCOD\b/g, 'C O D');
  h = h.replace(/\bEMI\b/g, 'E M I');
  h = h.replace(/\bCRM\b/g, 'C R M');
  h = h.replace(/\bHIPAA\b/g, 'Hippa');
  h = h.replace(/\bCSAT\b/g, 'Customer Satisfaction');
  h = h.replace(/\bOTP\b/g, 'O T P');
  h = h.replace(/\bKYC\b/g, 'K Y C');
  h = h.replace(/\bSMS\b/g, 'S M S');

  // 4. Time format: e.g. "10:30 AM" -> "10 30 A M"
  h = h.replace(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/g, (_match, p1, p2, p3) => {
    return `${p1} ${p2} ${p3.toUpperCase().split('').join(' ')}`;
  });
  h = h.replace(/\b(AM|PM)\b/gi, (m) => m.toUpperCase().split('').join(' '));

  // 5. Conversational pauses: Replace abrupt em-dashes and dashes with soft commas
  h = h.replace(/—|--/g, ', ');
  h = h.replace(/;\s*/g, ', ');

  return h.replace(/\s+/g, ' ').trim();
}

export function getBestHumanVoice(targetVoiceId: string, speechText: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const hasDevanagari = /[\u0900-\u097F]/.test(speechText);
  const isFemale = ['shreya', 'ritu', 'priya', 'simran', 'female', 'woman'].some((v) =>
    targetVoiceId.toLowerCase().includes(v)
  );

  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -1000;

  for (const voice of voices) {
    let score = 0;
    const nameLower = voice.name.toLowerCase();
    const langLower = voice.lang.toLowerCase();

    if (hasDevanagari) {
      if (langLower.startsWith('hi')) score += 50;
      else if (langLower.startsWith('en')) score += 10;
    } else {
      if (langLower.startsWith('en')) score += 40;
    }

    if (nameLower.includes('natural') || nameLower.includes('neural') || nameLower.includes('online (natural)')) {
      score += 45;
    } else if (nameLower.includes('google') || nameLower.includes('expressive') || nameLower.includes('premium')) {
      score += 35;
    } else if (
      nameLower.includes('microsoft') ||
      nameLower.includes('samantha') ||
      nameLower.includes('karen') ||
      nameLower.includes('rishi') ||
      nameLower.includes('veena')
    ) {
      score += 25;
    }

    if (isFemale) {
      if (
        nameLower.includes('female') ||
        nameLower.includes('zira') ||
        nameLower.includes('samantha') ||
        nameLower.includes('victoria') ||
        nameLower.includes('jennifer') ||
        nameLower.includes('aria') ||
        nameLower.includes('jenny') ||
        nameLower.includes('shreya') ||
        nameLower.includes('priya') ||
        nameLower.includes('veena')
      ) {
        score += 25;
      } else if (nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('guy') || nameLower.includes('mark')) {
        score -= 25;
      }
    } else {
      if (
        nameLower.includes('male') ||
        nameLower.includes('david') ||
        nameLower.includes('mark') ||
        nameLower.includes('george') ||
        nameLower.includes('guy') ||
        nameLower.includes('orion') ||
        nameLower.includes('rishi') ||
        nameLower.includes('shubh')
      ) {
        score += 25;
      } else if (nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('samantha')) {
        score -= 25;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}
