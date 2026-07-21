

import { log } from '../logger.js'
export function turnBasedDialect(platform) {
  switch (String(platform || '').toLowerCase()) {
    case 'plivo':
    case 'twilio':
    case 'signalwire':
    case 'exotel':
    case 'ozonetel':   // VERIFY: Ozonetel KooKoo XML differs; TwiML is a best-effort default
    case 'mcube':      // VERIFY
    case 'tatatele':   // VERIFY
    case 'maqsam':     // VERIFY
    case 'vobiz':      // VERIFY
    case 'voicelink':  // VERIFY
    case 'custom':     // VERIFY
    default:
      return 'twiml';
  }
}

/**
 * Build the answer-XML for one turn of the loop.
 *
 * @param {object} opts
 * @param {string} opts.platform    resolved PhoneNumber.platform
 * @param {string} opts.agentId     agent to voice this call
 * @param {string} opts.responseText what the agent should say this turn
 * @param {string} opts.actionUrl   absolute URL the gathered speech posts to
 * @param {string} opts.speakUrl    absolute URL that streams the TTS audio
 * @returns {string} XML document
 */
export function buildTurnBasedResponse({ platform, responseText, actionUrl, speakUrl }) {
  const dialect = turnBasedDialect(platform);
  const escapedSpeak = String(speakUrl || '').replace(/&/g, '&amp;');
  const escapedAction = String(actionUrl || '').replace(/&/g, '&amp;');

  if (dialect === 'plivo') {
    // Plivo XML: <GetInput> captures speech, <Play> renders our TTS URL.
    // VERIFY: element/attribute names against current Plivo Voice XML docs.
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <GetInput action="${escapedAction}" method="POST" inputType="speech" speechEndTimeout="auto" timeout="10">
        <Play>${escapedSpeak}</Play>
    </GetInput>
</Response>`;
  }

  // Twilio-compatible TwiML (Twilio / SignalWire / Exotel / default).
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech dtmf" action="${escapedAction}" method="POST" timeout="10" speechTimeout="auto">
        <Play>${escapedSpeak}</Play>
    </Gather>
</Response>`;
}

/**
 * Run one LLM turn for the turn-based loop. Kept intentionally small and
 * provider-agnostic: given the agent and the caller's recognized speech,
 * produce the next spoken line. Falls back to a safe greeting/line on any error
 * so the caller is never left in dead air.
 *
 * @param {object} opts
 * @param {object} opts.agent       agent doc (name, prompt, ...)
 * @param {string} opts.userSpeech  recognized caller speech ('' on first turn)
 * @param {object} opts.llmClient   an OpenAI-compatible client (e.g. Groq)
 * @param {string} [opts.model]
 * @returns {Promise<string>}
 */
export async function runTurnBasedLLM({ agent, userSpeech, llmClient, model = 'llama-3.1-8b-instant' }) {
  const fallbackLine = agent?.prompt
    ? `Hello! ${agent.name} here. How can I help you today?`
    : 'Hello! I am your AI voice assistant. How can I help you today?';

  if (!userSpeech) return fallbackLine;
  if (!llmClient) return fallbackLine;

  try {
    const sysPrompt = agent?.prompt
      || `You are ${agent?.name || 'an assistant'}, a helpful voice assistant for phone calls. Keep answers very concise (under 2 sentences).`;
    const completion = await llmClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userSpeech },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() || fallbackLine;
  } catch (err) {
    log.error('turn_based_llm_error', { error: err.message });
    return fallbackLine;
  }
}
