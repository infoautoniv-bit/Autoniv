import OpenAI from 'openai';
import { getToolDefinitions, executeTool } from '../appointmentTools.js';
import { log } from '../logger.js';

const GROQ_MODEL_ALIASES = {
  'llama-3.1-8b-instant': 'openai/gpt-oss-20b',
  'llama-3.1-8b': 'openai/gpt-oss-20b',
  'llama3-8b': 'openai/gpt-oss-20b',
  'llama-3.3-70b': 'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.1-70b': 'openai/gpt-oss-120b',
  'llama-3.1-70b-versatile': 'openai/gpt-oss-120b',
  'llama3-70b': 'openai/gpt-oss-120b',
  'llama-4-scout': 'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-4-scout-17b': 'meta-llama/llama-4-scout-17b-16e-instruct',
  'compound-mini': 'openai/gpt-oss-20b',
  'compound': 'openai/gpt-oss-120b',
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
  'qwen-27b': 'qwen/qwen3.6-27b',
  'qwen-32b': 'qwen/qwen3-32b',
  'mixtral-8x7b': 'openai/gpt-oss-120b',
  'gemma-2-9b': 'openai/gpt-oss-20b',
};
const GROQ_DEFAULT_MODEL = 'openai/gpt-oss-20b';

const MAX_REPLY_TOKENS = 180;
const REPLY_TEMPERATURE = 0.3;

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

async function requestCompletion(client, modelName, messages, tools, timeoutMs = 8000) {
  const isGemini = modelName.toLowerCase().includes('gemini');
  const supportsTools = !modelName.toLowerCase().includes('compound');
  const applicableTools = supportsTools && tools && tools.length > 0 ? tools : [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (isGemini) {
      log.info('llm_gemini_non_streamed', { model: modelName });
      const completion = await client.chat.completions.create({
        model: modelName,
        messages,
        stream: false,
        max_tokens: MAX_REPLY_TOKENS,
        temperature: REPLY_TEMPERATURE,
        ...(applicableTools.length > 0 ? { tools: applicableTools, tool_choice: 'auto' } : {}),
      }, { signal: controller.signal, timeout: timeoutMs });

      clearTimeout(timeoutId);
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
      const stream = await client.chat.completions.create({
        model: modelName,
        messages,
        stream: true,
        max_tokens: MAX_REPLY_TOKENS,
        temperature: REPLY_TEMPERATURE,
        ...(applicableTools.length > 0 ? { tools: applicableTools, tool_choice: 'auto' } : {}),
      }, { signal: controller.signal, timeout: timeoutMs });

      clearTimeout(timeoutId);

      const originalIterator = stream[Symbol.asyncIterator]();
      stream[Symbol.asyncIterator] = async function* () {
        try {
          while (true) {
            const result = await Promise.race([
              originalIterator.next(),
              new Promise((_, reject) => {
                setTimeout(() => reject(new Error('LLM stream chunk timeout')), timeoutMs);
              })
            ]);
            if (result.done) break;
            yield result.value;
          }
        } catch (err) {
          if (err.name === 'AbortError' || err.message.includes('timeout')) {
            log.warn('llm_stream_aborted', { model: modelName, error: err.message });
          }
          throw err;
        }
      };

      return stream;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
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
  const desiredLimit = 8;
  let startIndex = Math.max(0, recentMessages.length - desiredLimit);
  
  while (startIndex > 0 && (recentMessages[startIndex].role === 'tool' || (recentMessages[startIndex].role === 'assistant' && recentMessages[startIndex].tool_calls))) {
    startIndex--;
  }

  const slicedRecent = recentMessages.slice(startIndex);

  const balancedHistory = [];
  let lastRole = null;
  for (const msg of slicedRecent) {
    if (msg.role === lastRole && msg.role === 'user') {
      continue;
    }
    balancedHistory.push(msg);
    lastRole = msg.role;
  }

  prunedHistory = prunedHistory.concat(balancedHistory);

  tools = (tools || []).filter(
    t => t?.type === 'function' && t?.function?.name && typeof t.function.name === 'string' && t.function.name.trim().length > 0
  );

  const activeToolCallIds = new Set(
    prunedHistory.filter(m => m.role === 'tool' && m.tool_call_id).map(m => m.tool_call_id)
  );

  log.info(`${logPrefix}_system_prompt_check`, {
    hasSystemMsg: Boolean(systemMsg),
    systemMsgLength: systemMsg?.content?.length || 0,
    systemMsgPreview: (systemMsg?.content?.substring(0, 200)) || 'NONE',
    totalMessages: prunedHistory.length,
    messageRoles: prunedHistory.map(m => m.role),
  });

  prunedHistory = prunedHistory.map(m => {
    if (m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      const validCalls = m.tool_calls.filter(
        tc => tc?.function?.name && typeof tc.function.name === 'string' && tc.function.name.trim().length > 0 && activeToolCallIds.has(tc.id)
      );
      if (validCalls.length > 0) {
        return { ...m, tool_calls: validCalls };
      } else {
        const { tool_calls, ...rest } = m;
        return { ...rest, content: rest.content || 'Understood.' };
      }
    }
    return m;
  });

  const engineSelected = agentObj?.customEngineModel || 'groq:gpt-oss-120b';
  const [provider, modelId] = engineSelected.split(':');

  const candidates = [];

  // 1. PRIMARY: Groq (ultra low latency LPU)
  if (groq) {
    candidates.push({ name: 'Groq', client: groq, model: 'openai/gpt-oss-120b' });
    candidates.push({ name: 'Groq', client: groq, model: 'openai/gpt-oss-20b' });
    candidates.push({ name: 'Groq', client: groq, model: 'meta-llama/llama-4-scout-17b-16e-instruct' });
    candidates.push({ name: 'Groq', client: groq, model: 'qwen/qwen3.6-27b' });
    candidates.push({ name: 'Groq', client: groq, model: 'llama-3.3-70b-versatile' });
  }

  // 2. SECONDARY: Gemini
  if (gemini) {
    const geminiModel = (provider === 'gemini' && modelId) ? modelId : 'gemini-2.5-flash';
    candidates.push({ name: 'Gemini', client: gemini, model: geminiModel });
    if (geminiModel !== 'gemini-2.5-flash-lite') {
      candidates.push({ name: 'Gemini', client: gemini, model: 'gemini-2.5-flash-lite' });
    }
  }

  // 3. TERTIARY: OpenAI
  if (openaiClient) {
    const openaiModel = (provider === 'openai' && modelId) ? modelId : 'gpt-4o-mini';
    candidates.push({ name: 'OpenAI', client: openaiClient, model: openaiModel });
  }

  if (candidates.length === 0) {
    throw new Error('No LLM providers (Groq, OpenAI, Gemini) are configured or available');
  }

  let stream = null;
  let lastErr = null;

  for (const candidate of candidates) {
    try {
      log.info('llm_attempt', { prefix: logPrefix, provider: candidate.name, model: candidate.model });
      stream = await requestCompletion(candidate.client, candidate.model, prunedHistory, tools, 8000);
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
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<function[^>]*>[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/[a-zA-Z0-9_]+\s*>\s*[\s\S]*?<\/function>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/gi, '');
  cleaned = cleaned.replace(/<\/?[a-zA-Z0-9_=\s"'{}:,]+>/gi, '');
  cleaned = cleaned.replace(/\s*\([^)]{1,40}\)\s*/g, ' ');
  return cleaned.trim();
}

const ABBREVIATION_ENDINGS = /\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc|e\.g|i\.e|a\.m|p\.m)\.$/i;

export async function processStream({ stream, isInterrupted, checkInterrupted, onSentence }) {
  let sentenceBuffer = '';
  let fullResponseText = '';
  let toolCalls = [];
  let chunkCount = 0;

  const isCancelled = () => {
    if (typeof checkInterrupted === 'function') return checkInterrupted();
    return Boolean(isInterrupted);
  };

  for await (const chunk of stream) {
    chunkCount++;
    if (isCancelled()) {
      log.info('processStream_interrupted', { chunkCount, fullResponseText: fullResponseText.substring(0, 100) });
      return { fullResponseText: '', toolCalls: [], interrupted: true };
    }

    const delta = chunk.choices[0]?.delta;
    if (chunkCount <= 5) {
      log.info('processStream_chunk_detail', { chunkCount, chunk: JSON.stringify(chunk).substring(0, 500) });
    }
    if (chunkCount <= 3 || chunkCount % 20 === 0) {
      log.info('processStream_chunk', { chunkCount, hasContent: Boolean(delta?.content), hasToolCalls: Boolean(delta?.tool_calls), finishReason: chunk.choices[0]?.finish_reason, deltaKeys: delta ? Object.keys(delta) : [], role: delta?.role });
    }

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

  log.info('processStream_complete', { chunkCount, fullResponseTextLength: fullResponseText.length, toolCallsCount: toolCalls.length, sentenceBufferLength: sentenceBuffer.length });

  return { fullResponseText, toolCalls, interrupted: false };
}

export async function executeToolCalls({ toolCalls, agentObj, toolAlreadyExecuted, conversationHistory, logPrefix = 'Tool', callId }) {
  for (const tc of toolCalls) {
    const name = tc.name;
    let args = {};
    try {
      args = JSON.parse(tc.arguments);
    } catch (err) {
      log.warn('tool_parse_arguments_failed', { prefix: logPrefix, tool: name, rawArgs: tc.arguments?.substring(0, 200), error: err.message });
      continue;
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
