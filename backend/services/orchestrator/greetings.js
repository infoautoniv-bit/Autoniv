import { translateText, LANGUAGE_NAMES } from '../speech/translate.js';
import { log } from '../logger.js';

const FIRST_MESSAGES = {
  receptionist: 'Thank you for calling, how can I help you today?',
  appointment: 'Hello! I can help you book an appointment. What service are you looking for today?',
  faq: 'Hi there! I am here to answer your questions. What would you like to know?',
};

export async function generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType, agentObj }) {
  if (agentObj?.prompt && agentObj.prompt.trim().length > 15) {
    const client = groq || openaiClient || gemini;
    if (client) {
      try {
        const modelName = groq ? 'llama-3.3-70b-versatile' : (openaiClient ? 'gpt-4o-mini' : 'gemini-2.5-flash');
        const completion = await client.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemInstructions },
            { role: 'user', content: 'The call just connected. Speak ONLY your opening greeting to the caller based strictly on your role and system instructions above.' },
          ],
          max_tokens: 60,
          temperature: 0.5,
        });
        const customGreeting = completion.choices[0]?.message?.content?.trim();
        if (customGreeting) {
          log.info('greeting_generated', { greeting: customGreeting });
          return customGreeting;
        }
      } catch (err) {
        log.warn('greeting_fallback', { error: err.message });
      }
    }
  }

  return FIRST_MESSAGES[agentType] || FIRST_MESSAGES.receptionist;
}

export async function translateIfNeeded(systemInstructions, greetingText, language) {
  if (language && language !== 'en') {
    const langName = LANGUAGE_NAMES[language] || language;
    try {
      greetingText = await translateText(greetingText, language);
      systemInstructions += `\n\nLANGUAGE RULE: Your default/starting language is ${langName}. You must greet and respond in ${langName}. However, if the user speaks or switches to another language (such as English, Hindi, etc.), you MUST switch and respond in the user's language directly.`;
    } catch (trErr) {
      log.error('translation_failed', { error: trErr.message });
    }
  }
  return { systemInstructions, greetingText };
}
