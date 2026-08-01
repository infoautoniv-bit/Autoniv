import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from '../crm/appointmentTools.js';
import { log } from '../logger.js';

const GROQ_MODEL_ALIASES = {
  'llama-3.3-70b': 'llama-3.3-70b-versatile',
  'llama-3.1-70b': 'llama-3.1-70b-versatile',
  'llama-3.1-8b': 'llama-3.1-8b-instant',
};
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const MAX_REPLY_TOKENS = 160;
const REPLY_TEMPERATURE = 0.6;

export function resolveGroqModel(modelId) {
  if (!modelId) return GROQ_DEFAULT_MODEL;
  return GROQ_MODEL_ALIASES[modelId] || modelId;
}

export function createLLMClient() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;

  let openaiClient = null;
  let groq = null;
  let gemini = null;

  if (OPENAI_API_KEY && OPENAI_API_KEY.trim() !== '' && !OPENAI_API_KEY.startsWith('your-')) {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  if (GROQ_API_KEY) {
    groq = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: GROQ_API_KEY,
    });
  }
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '' && !GEMINI_API_KEY.startsWith('your-')) {
    gemini = new OpenAI({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: GEMINI_API_KEY,
    });
  }

  return { groq, openaiClient, gemini };
}

async function requestCompletion(client, modelName, messages, tools, timeoutMs = 12000) {
  const isGemini = modelName.toLowerCase().includes('gemini');

  if (isGemini) {
    log.info('llm_gemini_non_streamed', { model: modelName });
    const completion = await client.chat.completions.create({
      model: modelName,
      messages,
      stream: false,
      max_tokens: MAX_REPLY_TOKENS,
      temperature: REPLY_TEMPERATURE,
      ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    }, { timeout: timeoutMs });

    return {
      async *[Symbol.asyncIterator]() {
        yield {
          choices: [
            {
              delta: {
                content: completion.choices[0]?.message?.content || null,
                tool_calls: completion.choices[0]?.message?.tool_calls || null,
              }
            }
          ]
        };
      }
    };
  } else {
    return client.chat.completions.create({
      model: modelName,
      messages,
      stream: true,
      max_tokens: MAX_REPLY_TOKENS,
      temperature: REPLY_TEMPERATURE,
      ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    }, { timeout: timeoutMs });
  }
}

export async function generateCompletion({ groq, openaiClient, gemini, conversationHistory, agentType, agentObj, logPrefix = 'LLM', toolState }) {
  let tools = getToolDefinitions(agentType);

  if (toolState) {
    tools = tools.filter(t => {
      if (t.function.name === 'saveLead' && toolState.saveLead) return false;
      if (t.function.name === 'saveAppointment' && toolState.saveAppointment) return false;
      return true;
    });
  }
  const EXTENDED_TOOLS = new Set([
    'getAppointment', 'updateAppointment', 'cancelAppointment', 'checkEmergencyAvailability',
  ]);
  const recentText = conversationHistory
    .filter(m => m.role === 'user' && typeof m.content === 'string')
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');
  const MANAGEMENT_INTENT = /reschedul|re-schedul|change|move|postpone|cancel|cancle|existing|already|my appointment|look ?up|find my|emergenc|urgent/;
  if (!MANAGEMENT_INTENT.test(recentText)) {
    tools = tools.filter(t => !EXTENDED_TOOLS.has(t.function.name));
  }

  let cleanedMessages = [];
  const systemMsg = conversationHistory.find(m => m.role === 'system');
  if (systemMsg) cleanedMessages.push(systemMsg);

  const nonSystemMessages = conversationHistory.filter(m => m.role !== 'system');
  const toolCutoff = nonSystemMessages.length - 4;

  for (let i = 0; i < nonSystemMessages.length; i++) {
    const msg = nonSystemMessages[i];
    const isToolRelated = msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls && !msg.content);
    if (isToolRelated && i < toolCutoff) {
      continue;
    }
    cleanedMessages.push(msg);
  }

  let prunedHistory = [];
  if (systemMsg) prunedHistory.push(systemMsg);

  const recentMessages = cleanedMessages.filter(m => m.role !== 'system');
  const desiredLimit = 6;
  let startIndex = Math.max(0, recentMessages.length - desiredLimit);
  
  while (startIndex > 0 && (recentMessages[startIndex].role === 'tool' || (recentMessages[startIndex].role === 'assistant' && recentMessages[startIndex].tool_calls))) {
    startIndex--;
  }

  const slicedRecent = recentMessages.slice(startIndex);
  prunedHistory = prunedHistory.concat(slicedRecent);

  const activeToolCallIds = new Set(
    prunedHistory.filter(m => m.role === 'tool').map(m => m.tool_call_id)
  );

  prunedHistory = prunedHistory.map(m => {
    if (m.role === 'assistant' && m.tool_calls) {
      const validCalls = m.tool_calls.filter(tc => activeToolCallIds.has(tc.id));
      if (validCalls.length > 0) {
        return { ...m, tool_calls: validCalls };
      } else {
        const { tool_calls, ...rest } = m;
        return { ...rest, content: rest.content || 'Processing...' };
      }
    }
    return m;
  });

  const engineSelected = agentObj?.customEngineModel || 'groq:llama-3.3-70b';
  const [provider, modelId] = engineSelected.split(':');

  const candidates = [];
  if (provider === 'gemini' && gemini) {
    candidates.push({ name: 'Gemini', client: gemini, model: modelId || 'gemini-2.5-flash' });
  } else if (provider === 'openai' && openaiClient) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: modelId || 'gpt-4o-mini' });
  } else if (groq) {
    candidates.push({ name: 'Groq', client: groq, model: resolveGroqModel(modelId) });
  }

  if (groq && !candidates.some(c => c.name === 'Groq')) {
    candidates.push({ name: 'Groq', client: groq, model: GROQ_DEFAULT_MODEL });
  }
  if (openaiClient && !candidates.some(c => c.name === 'OpenAI')) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: 'gpt-4o-mini' });
  }
  if (gemini && !candidates.some(c => c.name === 'Gemini')) {
    candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash' });
  }

  if (candidates.length === 0) {
    throw new Error('No LLM providers (Groq, OpenAI, Gemini) are configured or available');
  }

  let stream = null;
  let lastErr = null;

  for (const candidate of candidates) {
    try {
      log.info('llm_attempt', { prefix: logPrefix, provider: candidate.name, model: candidate.model });
      stream = await requestCompletion(candidate.client, candidate.model, prunedHistory, tools, 12000);
      break;
    } catch (err) {
      log.warn('llm_provider_failed', { prefix: logPrefix, provider: candidate.name, error: err.message });
      lastErr = err;
    }
  }

  if (!stream) {
    throw lastErr || new Error('All LLM providers failed to generate completion');
  }

  return { stream, tools };
}

export function stripToolCallsFromText(text) {
  if (!text) return '';
  let cleaned = text.replace(/<function[^>]*>[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/[a-zA-Z0-9_]+\s*>\s*[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/gi, '');
  cleaned = cleaned.replace(/<\/?[a-zA-Z0-9_=\s"'{}:,]+>/gi, '');
  return cleaned.trim();
}

export async function processStream({ stream, isInterrupted, onSentence }) {
  let sentenceBuffer = '';
  let fullResponseText = '';
  let toolCalls = [];

  for await (const chunk of stream) {
    if (isInterrupted) return { fullResponseText: '', toolCalls: [], interrupted: true };

    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      sentenceBuffer += delta.content;

      if (/[.!?\n]/.test(sentenceBuffer)) {
        const sentence = sentenceBuffer.trim();
        sentenceBuffer = '';
        if (sentence.length > 0) {
          const cleanSentence = stripToolCallsFromText(sentence);
          if (cleanSentence.length > 0) {
            fullResponseText += (fullResponseText ? ' ' : '') + cleanSentence;
            await onSentence(cleanSentence);
          }
        }
      }
    }

    if (delta?.tool_calls) {
      for (const tcDelta of delta.tool_calls) {
        const idx = tcDelta.index;
        if (!toolCalls[idx]) {
          toolCalls[idx] = { id: tcDelta.id, name: '', arguments: '' };
        }
        if (tcDelta.id) toolCalls[idx].id = tcDelta.id;
        if (tcDelta.function?.name) toolCalls[idx].name += tcDelta.function.name;
        if (tcDelta.function?.arguments) toolCalls[idx].arguments += tcDelta.function.arguments;
      }
    }
  }

  if (sentenceBuffer.trim().length > 0) {
    const cleanSentence = stripToolCallsFromText(sentenceBuffer.trim());
    if (cleanSentence.length > 0) {
      fullResponseText += (fullResponseText ? ' ' : '') + cleanSentence;
      await onSentence(cleanSentence);
    }
  }

  return { fullResponseText, toolCalls, interrupted: false };
}

export async function executeToolCalls({ toolCalls, agentObj, toolAlreadyExecuted, conversationHistory, logPrefix = 'Tool', callId }) {
  for (const tc of toolCalls) {
    const name = tc.name;
    let args = {};
    try {
      args = JSON.parse(tc.arguments);
    } catch {
      log.warn('tool_parse_arguments_failed', { prefix: logPrefix });
    }
    log.info('tool_execute', { prefix: logPrefix, tool: name, args });

    const result = await executeTool(name, args, {
      agentObj,
      toolState: toolAlreadyExecuted,
      callId,
    });

    conversationHistory.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result)
    });
  }
}
