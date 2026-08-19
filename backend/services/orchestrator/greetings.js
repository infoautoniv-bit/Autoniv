import { translateText, LANGUAGE_NAMES } from '../speech/translate.js';
import { renderTemplate } from './templateEngine.js';
import { log } from '../logger.js';

const FIRST_MESSAGES = {
  receptionist: 'Thank you for calling, how can I help you today?',
  appointment: 'Hello! I can help you book an appointment. What service are you looking for today?',
  faq: 'Hi there! I am here to answer any questions you have. How can I help you today?',
  support: 'Thank you for contacting customer support. How can I help resolve your issue today?',
  complaint: 'Hello, thank you for reaching out to support. What issue or complaint can I assist you with today?',
  ecommerce_orders: 'Thank you for calling customer service. I can help you check your order status, delivery, or returns. How can I help you?',
};

export async function generateGreeting({ groq, openaiClient, gemini, systemInstructions, agentType, agentObj, context = {} }) {
  const language = agentObj?.language || 'en';
  const langName = LANGUAGE_NAMES[language] || language;

  // 1. If agent has a configured static firstMessage or greetingTemplate
  const customFirstMessage = agentObj?.firstMessage || agentObj?.greetingTemplate;
  if (customFirstMessage && typeof customFirstMessage === 'string' && customFirstMessage.trim().length > 0) {
    let rendered = renderTemplate(customFirstMessage.trim(), context);
    if (language !== 'en') {
      rendered = await translateText(rendered, language);
    }
    return rendered;
  }

  // 2. If returning caller is recognized with a name, formulate a personalized greeting
  if (context.callerName && !agentObj?.prompt) {
    const personalized = `Hello ${context.callerName}! Thank you for calling back. How can I help you today?`;
    if (language !== 'en') {
      return await translateText(personalized, language);
    }
    return personalized;
  }

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
          const interpolated = renderTemplate(customGreeting, context);
          log.info('greeting_generated', { greeting: interpolated, language });
          return interpolated;
        }
      } catch (err) {
        log.warn('greeting_fallback', { error: err.message });
      }
    }
  }

  const baseGreeting = FIRST_MESSAGES[agentType] || FIRST_MESSAGES.receptionist;
  let finalGreeting = renderTemplate(baseGreeting, context);
  if (language !== 'en') {
    return await translateText(finalGreeting, language);
  }
  return finalGreeting;
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
