
export interface VoiceOption {
  value: string;
  label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // --- ElevenLabs Voices (Default / Legacy) ---
  { value: 'hpp4J3VqNfWAUOO0d1Us', label: 'Bella (ElevenLabs) - Professional, Bright, Warm (Female)' },
  { value: 'cgSgspJ2msm6clMCkdW9', label: 'Sarah (ElevenLabs) - Soft, Warm, Audiobook Narration (Female)' },
  { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily (ElevenLabs) - Velvety Actress (Female)' },
  { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel (ElevenLabs) - Steady Broadcaster (Male)' },
  { value: 'cjVigY5qzO86Huf0OWal', label: 'Eric (ElevenLabs) - Smooth, Trustworthy (Male)' },
  { value: 'iP95p4xoKVk53GoZ742B', label: 'Chris (ElevenLabs) - Charming, Down-to-Earth (Male)' },
  { value: 'nPczCjzI2devNBz1zQrb', label: 'Brian (ElevenLabs) - Deep, Resonant, Comforting (Male)' },
  { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (ElevenLabs) - Dominant, Firm (Male)' },
  { value: 'pqHfZKP75CvOlQylNhV4', label: 'Bill (ElevenLabs) - Wise, Mature, Balanced (Male)' },

  // --- Deepgram Aura Voices (Ultra Low Latency) ---
  { value: 'deepgram:aura-asteria-en', label: 'Asteria (Deepgram) - English Female (Fast)' },
  { value: 'deepgram:aura-luna-en', label: 'Luna (Deepgram) - English Female (Fast)' },
  { value: 'deepgram:aura-stella-en', label: 'Stella (Deepgram) - English Female (Fast)' },
  { value: 'deepgram:aura-athena-en', label: 'Athena (Deepgram) - English Female (Fast)' },
  { value: 'deepgram:aura-hera-en', label: 'Hera (Deepgram) - English Female (Fast)' },
  { value: 'deepgram:aura-orion-en', label: 'Orion (Deepgram) - English Male (Fast)' },
  { value: 'deepgram:aura-zeus-en', label: 'Zeus (Deepgram) - English Male (Fast)' },

  // --- Azure Neural Voices (Multilingual / Indian English / Hindi) ---
  { value: 'azure:en-IN-NeerjaNeural', label: 'Neerja (Azure) - Indian English Female' },
  { value: 'azure:en-IN-PrabhatNeural', label: 'Prabhat (Azure) - Indian English Male' },
  { value: 'azure:hi-IN-SwaraNeural', label: 'Swara (Azure) - Hindi Female' },
  { value: 'azure:hi-IN-MadhurNeural', label: 'Madhur (Azure) - Hindi Male' },
  { value: 'azure:en-US-JennyNeural', label: 'Jenny (Azure) - US English Female' },
  { value: 'azure:en-US-GuyNeural', label: 'Guy (Azure) - US English Male' },

  // --- OpenAI TTS Voices (Simple / Natural) ---
  { value: 'openai:alloy', label: 'Alloy (OpenAI) - Neutral' },
  { value: 'openai:echo', label: 'Echo (OpenAI) - Male' },
  { value: 'openai:fable', label: 'Fable (OpenAI) - Male' },
  { value: 'openai:onyx', label: 'Onyx (OpenAI) - Male' },
  { value: 'openai:nova', label: 'Nova (OpenAI) - Female' },
  { value: 'openai:shimmer', label: 'Shimmer (OpenAI) - Female' },

  // --- Groq TTS (Fast Inference) ---
  { value: 'groq:aura-asteria-en', label: 'Asteria (Groq) - English Female (Fast)' },
  { value: 'groq:aura-luna-en', label: 'Luna (Groq) - English Female (Fast)' },
  { value: 'groq:aura-stella-en', label: 'Stella (Groq) - English Female (Fast)' },
  { value: 'groq:aura-orion-en', label: 'Orion (Groq) - English Male (Fast)' },
  { value: 'groq:aura-zeus-en', label: 'Zeus (Groq) - English Male (Fast)' },

  // --- Sarvam AI Indian-Native Voices (Indic-native) - Bulbul V3 (Official 42+ Speakers) ---
  { value: 'sarvam:bulbul:v3:shubh', label: 'Sarvam Shubh (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:shreya', label: 'Sarvam Shreya (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:aditya', label: 'Sarvam Aditya (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:ritu', label: 'Sarvam Ritu (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:priya', label: 'Sarvam Priya (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:neha', label: 'Sarvam Neha (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:rahul', label: 'Sarvam Rahul (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:pooja', label: 'Sarvam Pooja (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:rohan', label: 'Sarvam Rohan (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:simran', label: 'Sarvam Simran (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:kavya', label: 'Sarvam Kavya (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:amit', label: 'Sarvam Amit (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:dev', label: 'Sarvam Dev (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:ishita', label: 'Sarvam Ishita (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:ratan', label: 'Sarvam Ratan (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:varun', label: 'Sarvam Varun (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:manan', label: 'Sarvam Manan (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:sumit', label: 'Sarvam Sumit (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:roopa', label: 'Sarvam Roopa (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:kabir', label: 'Sarvam Kabir (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:aayan', label: 'Sarvam Aayan (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:ashutosh', label: 'Sarvam Ashutosh (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:advait', label: 'Sarvam Advait (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:anand', label: 'Sarvam Anand (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:tanya', label: 'Sarvam Tanya (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:tarun', label: 'Sarvam Tarun (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:sunny', label: 'Sarvam Sunny (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:mani', label: 'Sarvam Mani (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:gokul', label: 'Sarvam Gokul (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:vijay', label: 'Sarvam Vijay (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:shruti', label: 'Sarvam Shruti (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:suhani', label: 'Sarvam Suhani (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:mohit', label: 'Sarvam Mohit (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:kavitha', label: 'Sarvam Kavitha (V3 - Female)' },
  { value: 'sarvam:bulbul:v3:rehan', label: 'Sarvam Rehan (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:soham', label: 'Sarvam Soham (V3 - Male)' },
  { value: 'sarvam:bulbul:v3:rupali', label: 'Sarvam Rupali (V3 - Female)' },

  // --- Sarvam AI Indian-Native Voices (Indic-native) - Bulbul V2 (Hindi-only) ---
  { value: 'sarvam:bulbul:v2:anushka', label: 'Sarvam Anushka (V2 - Female)' },
  { value: 'sarvam:bulbul:v2:abhilash', label: 'Sarvam Abhilash (V2 - Male)' },
  { value: 'sarvam:bulbul:v2:manisha', label: 'Sarvam Manisha (V2 - Female)' },
  { value: 'sarvam:bulbul:v2:vidya', label: 'Sarvam Vidya (V2 - Female)' },
  { value: 'sarvam:bulbul:v2:arya', label: 'Sarvam Arya (V2 - Female)' },
  { value: 'sarvam:bulbul:v2:karun', label: 'Sarvam Karun (V2 - Male)' },
  { value: 'sarvam:bulbul:v2:hitesh', label: 'Sarvam Hitesh (V2 - Male)' },

];

export function getVoicesForLanguage(language: string): VoiceOption[] {
  // If language is Hindi, bubble up Hindi/Indian voices first
  if (language === 'hi') {
    return VOICE_OPTIONS.filter(v => v.value.includes('hi-IN') || v.value.includes('en-IN') || v.value.includes('aura') || v.value.includes('openai'));
  }
  return VOICE_OPTIONS;
}
