
export interface VoiceOption {
  value: string;
  label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  // --- Vapi Native Voices (Lowest Latency, Optimized) ---
  { value: 'vapi:Elliot', label: 'Elliot (Vapi) - Friendly, Professional, Soothing (Male, Canadian)' },
  { value: 'vapi:Savannah', label: 'Savannah (Vapi) - Realistic, Straightforward (Female, American Southern)' },
  { value: 'vapi:Rohan', label: 'Rohan (Vapi) - Bright, Energetic (Male, Indian American)' },
  { value: 'vapi:Emma', label: 'Emma (Vapi) - Warm, Conversational (Female, Asian American)' },
  { value: 'vapi:Clara', label: 'Clara (Vapi) - Warm, Professional (Female, American)' },
  { value: 'vapi:Nico', label: 'Nico (Vapi) - Young, Casual, Natural (Male, American)' },
  { value: 'vapi:Kai', label: 'Kai (Vapi) - Friendly, Relaxed, Approachable (Male, American)' },
  { value: 'vapi:Sagar', label: 'Sagar (Vapi) - Steady, Professional (Male, Indian American)' },
  { value: 'vapi:Godfrey', label: 'Godfrey (Vapi) - Young, Energetic (Male, American)' },
  { value: 'vapi:Neil', label: 'Neil (Vapi) - Clear, Professional (Male, Indian American)' },
  { value: 'vapi:Layla', label: 'Layla (Vapi) - Warm, Bright, Cheerful (Female, American)' },
  { value: 'vapi:Sid', label: 'Sid (Vapi) - Laid-back, Smooth, Deep-toned (Male, American)' },
  { value: 'vapi:Naina', label: 'Naina (Vapi) - Calm, Collected, Professional (Female, Indian American)' },

  // --- ElevenLabs Voices ---
  { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (ElevenLabs) - Dominant, Firm (Male)' },
  { value: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice (ElevenLabs) - Clear, Engaging Educator (Female)' },
  { value: 'hpp4J3VqNfWAUOO0d1Us', label: 'Bella (ElevenLabs) - Professional, Bright, Warm (Female)' },
  { value: 'pqHfZKP75CvOlQylNhV4', label: 'Bill (ElevenLabs) - Wise, Mature, Balanced (Male)' },
  { value: 'nPczCjzI2devNBz1zQrb', label: 'Brian (ElevenLabs) - Deep, Resonant and Comforting (Male)' },
  { value: 'N2lVS1w4EtoT3dr4eOWO', label: 'Callum (ElevenLabs) - Husky Trickster (Male)' },
  { value: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie (ElevenLabs) - Deep, Confident, Energetic (Male)' },
  { value: 'iP95p4xoKVk53GoZ742B', label: 'Chris (ElevenLabs) - Charming, Down-to-Earth (Male)' },
  { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel (ElevenLabs) - Steady Broadcaster (Male)' },
  { value: 'cjVigY5qzO86Huf0OWal', label: 'Eric (ElevenLabs) - Smooth, Trustworthy (Male)' },
  { value: 'JBFqnCBsd6RMkjVDRZzb', label: 'George (ElevenLabs) - Warm, Captivating Storyteller (Male)' },
  { value: 'SOYHLrjzK2X1ezoPC6cr', label: 'Harry (ElevenLabs) - Fierce Warrior (Male)' },
  { value: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica (ElevenLabs) - Playful, Bright, Warm (Female)' },
  { value: 'FGY2WhTYpPnrIDTdsKH5', label: 'Laura (ElevenLabs) - Enthusiast, Quirky Attitude (Female)' },
  { value: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam (ElevenLabs) - Energetic, Social Media Creator (Male)' },
  { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily (ElevenLabs) - Velvety Actress (Female)' },
  { value: 'XrExE9yKIg1WjnnlVkGX', label: 'Matilda (ElevenLabs) - Knowledgable, Professional (Female)' },
  { value: 'SAz9YHcvj6GT2YYXdXww', label: 'River (ElevenLabs) - Relaxed, Neutral, Informative (Neutral)' },
  { value: 'CwhRBWXzGAHq8TQ4Fs17', label: 'Roger (ElevenLabs) - Laid-Back, Casual, Resonant (Male)' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (ElevenLabs) - Mature, Reassuring, Confident (Female)' },
  { value: 'bIHbv24MWmeRgasZH58o', label: 'Will (ElevenLabs) - Relaxed Optimist (Male)' },

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
    return VOICE_OPTIONS.filter(v => v.value.includes('hi-IN') || v.value.includes('en-IN') || v.value.includes('sarvam') || v.value.includes('vapi:Rohan') || v.value.includes('vapi:Sagar') || v.value.includes('vapi:Neil') || v.value.includes('vapi:Naina'));
  }
  return VOICE_OPTIONS;
}
