import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from '../appointmentTools.js';
import { log } from '../logger.js';

const GROQ_MODEL_ALIASES = {
  'llama-3.3-70b': 'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.1-70b': 'openai/gpt-oss-120b',
  'llama-3.1-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.1-8b': 'groq/compound-mini',
  'llama-3.1-8b-instant': 'groq/compound-mini',
  'llama3-70b': 'openai/gpt-oss-120b',
  'llama3-8b': 'groq/compound-mini',
  'compound-mini': 'groq/compound-mini',
  'compound': 'groq/compound',
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
  'qwen-27b': 'qwen/qwen3.6-27b',
  'mixtral-8x7b': 'openai/gpt-oss-120b',
  'gemma-2-9b': 'groq/compound-mini',
};
const GROQ_DEFAULT_MODEL = 'groq/compound-mini';

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

  const mcpServerUrl = agentObj?.mcpServerUrl || agentObj?.crmIntegrations?.mcpServerUrl;
  if (mcpServerUrl) {
    try {
      const { fetchMcpTools } = await import('./mcpClient.js');
      const mcpTools = await fetchMcpTools(mcpServerUrl, agentObj?.mcpApiKey);
      if (mcpTools && mcpTools.length > 0) {
        tools = tools.concat(mcpTools);
      }
    } catch (_) {}
  }

  if (toolState) {
    tools = tools.filter(t => {
      if (t.function.name === 'saveLead' && toolState.saveLead) return false;
      if (t.function.name === 'saveAppointment' && toolState.saveAppointment) return false;
      if (t.function.name === 'transferCall' && toolState.transferCall) return false;
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

  const engineSelected = agentObj?.customEngineModel || 'groq:compound-mini';
  const [provider, modelId] = engineSelected.split(':');

  const candidates = [];

  // 1. PRIMARY: Groq (ultra low latency LPU, best for real-time voice)
  if (groq) {
    const selectedGroq = resolveGroqModel(provider === 'groq' ? modelId : 'compound-mini');
    candidates.push({ name: 'Groq', client: groq, model: selectedGroq });
    if (selectedGroq !== 'groq/compound-mini') {
      candidates.push({ name: 'Groq', client: groq, model: 'groq/compound-mini' });
    }
    if (selectedGroq !== 'openai/gpt-oss-120b') {
      candidates.push({ name: 'Groq', client: groq, model: 'openai/gpt-oss-120b' });
    }
  }

  // 2. Secondary: Specific agent model if requested and not Groq
  if (provider === 'gemini' && gemini) {
    candidates.push({ name: 'Gemini', client: gemini, model: modelId || 'gemini-2.5-flash' });
    candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash-lite' });
  } else if (provider === 'openai' && openaiClient) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: modelId || 'gpt-4o-mini' });
  }

  // 3. Fallbacks: Gemini, then OpenAI
  if (gemini) {
    if (!candidates.some(c => c.name === 'Gemini' && c.model === 'gemini-2.5-flash')) {
      candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash' });
    }
    if (!candidates.some(c => c.name === 'Gemini' && c.model === 'gemini-2.5-flash-lite')) {
      candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash-lite' });
    }
  }
  if (openaiClient && !candidates.some(c => c.name === 'OpenAI')) {
    candidates.push({ name: 'OpenAI', client: openaiClient, model: 'gpt-4o-mini' });
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

const ABBREVIATION_ENDINGS = /\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;

export async function processStream({ stream, isInterrupted, checkInterrupted, onSentence }) {
  let sentenceBuffer = '';
  let fullResponseText = '';
  let toolCalls = [];

  const isCancelled = () => {
    if (typeof checkInterrupted === 'function') return checkInterrupted();
    return Boolean(isInterrupted);
  };

  for await (const chunk of stream) {
    if (isCancelled()) return { fullResponseText: '', toolCalls: [], interrupted: true };

    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      sentenceBuffer += delta.content;

      // Smart sentence boundary detection: checks terminal punctuation not inside decimals or abbreviations
      const match = sentenceBuffer.match(/([.!?\n]+)(?:\s+|$)/);
      if (match && match.index !== undefined) {
        const splitIdx = match.index + match[1].length;
        const candidate = sentenceBuffer.substring(0, splitIdx).trim();

        // Check if candidate is not an abbreviation and not a decimal like "12." followed by digits
        const isAbbrev = ABBREVIATION_ENDINGS.test(candidate);
        const isDecimal = /\d+\.$/.test(candidate) && /^\d/.test(sentenceBuffer.substring(splitIdx).trim());

        if (!isAbbrev && !isDecimal && candidate.length > 0) {
          sentenceBuffer = sentenceBuffer.substring(splitIdx);
          const cleanSentence = stripToolCallsFromText(candidate);
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

    let result;
    if (name.startsWith('mcp__')) {
      const mcpServerUrl = agentObj?.mcpServerUrl || agentObj?.crmIntegrations?.mcpServerUrl;
      const { callMcpTool } = await import('./mcpClient.js');
      result = await callMcpTool(mcpServerUrl, name, args);
    } else {
      result = await executeTool(name, args, {
        agentObj,
        toolState: toolAlreadyExecuted,
        callId,
      });
    }

    conversationHistory.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result)
    });
  }
}
