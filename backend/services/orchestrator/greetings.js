import { translateText, LANGUAGE_NAMES } from '../speech/translate.js';
import { log } from '../logger.js';

const FIRST_MESSAGES = {
  receptionist: 'Thank you for calling, how can I help you today?',
  appointment: 'Hello! I can help you book an appointment. What service are you looking for today?',
  faq: 'Hi there! I am here to answer your questions. What would you like to know?',
};

export async function generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType, agentObj }) {
  const language = agentObj?.language || 'en';
  const langName = LANGUAGE_NAMES[language] || language;

  if (agentObj?.prompt && agentObj.prompt.trim().length > 15) {
    const client = groq || openaiClient || gemini;
    if (client) {
      try {
        const modelName = groq ? 'llama-3.3-70b-versatile' : (openaiClient ? 'gpt-4o-mini' : 'gemini-2.5-flash');
        const langDirective = language !== 'en'
          ? `\n\nCRITICAL LANGUAGE DIRECTIVE: The target language for this agent is ${langName} (${language}). You MUST speak and output your opening greeting ONLY in ${langName}. Do NOT use English.`
          : '';
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemInstructions + langDirective },
            { role: 'user', content: `The call just connected. Speak ONLY your opening greeting to the caller in ${langName} based strictly on your role and system instructions above.` },
          ],
          max_tokens: 80,
          temperature: 0.5,
        });
        const customGreeting = completion.choices[0]?.message?.content?.trim();
        if (customGreeting) {
          log.info('greeting_generated', { greeting: customGreeting, language });
          return customGreeting;
        }
      } catch (err) {
        log.warn('greeting_fallback', { error: err.message });
      }
    }
  }

  const baseGreeting = FIRST_MESSAGES[agentType] || FIRST_MESSAGES.receptionist;
  if (language !== 'en') {
    return await translateText(baseGreeting, language);
  }
  return baseGreeting;
}

export async function translateIfNeeded(systemInstructions, greetingText, language) {
  if (language && language !== 'en') {
    const langName = LANGUAGE_NAMES[language] || language;
    try {
      if (/^[a-zA-Z0-9\s.,?!'":;]+$/.test(greetingText.trim())) {
        greetingText = await translateText(greetingText, language);
      }
      systemInstructions += `\n\nCRITICAL LANGUAGE DIRECTIVE:
1. Your target primary language for this conversation is ${langName} (language code: '${language}').
2. You MUST formulate and generate ALL your spoken responses natively in ${langName}. Do NOT respond in English.
3. Even if the prompt or instructions above are written in English, you MUST execute those instructions and speak to the caller in ${langName}.
4. If the caller speaks or switches to another language (such as English, Hindi, Tamil, Telugu, Spanish, French, etc.), switch dynamically and reply in the caller's language.`;
    } catch (trErr) {
      log.error('translation_failed', { error: trErr.message });
    }
  }
  return { systemInstructions, greetingText };
}
