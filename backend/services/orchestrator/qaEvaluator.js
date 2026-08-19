import OpenAI from 'openai';
import Call from '../../db/models/Call.js';
import { log } from '../logger.js';

function getEvaluatorClients() {
  const clients = [];
  if (process.env.GROQ_API_KEY) {
    clients.push({
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      model: 'openai/gpt-oss-120b',
    });
    clients.push({
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      model: 'openai/gpt-oss-20b',
    });
    clients.push({
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      model: 'openai/gpt-oss-120b',
    });
  }
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '' && !geminiKey.startsWith('your-')) {
    clients.push({
      client: new OpenAI({
        apiKey: geminiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }),
      model: 'gemini-2.5-flash',
    });
  }
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your-')) {
    clients.push({
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      model: 'gpt-4o-mini',
    });
  }
  return clients;
}

/**
 * Calculates estimated telephony and AI costs for a voice call.
 */
export function calculateCallCosts({ durationSeconds = 0, promptTokens = 0, completionTokens = 0, ttsCharacters = 0 }) {
  const durationMins = durationSeconds / 60;
  // Deepgram standard telephony STT (~$0.0043 / min)
  const sttCost = Number((durationMins * 0.0043).toFixed(5));
  // LLM cost (estimated average blend $0.15/1M input, $0.60/1M output for fast models)
  const llmCost = Number(((promptTokens * 0.00000015) + (completionTokens * 0.00000060)).toFixed(5));
  // TTS cost (~$0.00003 per character for premium voice)
  const ttsCost = Number((ttsCharacters * 0.00003).toFixed(5));
  // Telephony SIP / carrier trunk cost (~$0.013 / min average)
  const telephonyCost = Number((durationMins * 0.013).toFixed(5));

  const totalCost = Number((sttCost + llmCost + ttsCost + telephonyCost).toFixed(4));

  return {
    sttCost,
    llmCost,
    ttsCost,
    telephonyCost,
    totalCost,
  };
}

/**
 * Runs an asynchronous post-call QA evaluation on a call transcript.
 *
 * @param {string} callId - MongoDB Call _id or orchestratorCallId
 * @param {object} options - { transcript, duration, agentName, metrics }
 */
export async function runPostCallQA(callId, options = {}) {
  try {
    const { transcript, durationSeconds = 0, metrics = {} } = options;
    if (!transcript || transcript.trim().length < 15) {
      log.info('qa_evaluator_skipped_transcript_too_short', { callId });
      return null;
    }

    const clients = getEvaluatorClients();
    let qaResult = {
      sentiment: 'neutral',
      goalAchieved: false,
      callScore: 70,
      summary: 'Short conversation completed.',
      actionItems: [],
    };

    if (clients.length > 0) {
      const prompt = `You are an automated Quality Assurance auditor for AI phone calls.
Analyze the following call transcript and return a JSON object with:
- "sentiment": ("positive", "neutral", "negative", or "frustrated")
- "goalAchieved": boolean (true if customer inquiry was answered, appointment booked, or lead captured)
- "callScore": integer from 1 to 100 (rating the overall efficiency, politeness, and quality of the interaction)
- "summary": a concise 1-2 sentence overview of the conversation
- "actionItems": array of strings listing any follow-up tasks needed

TRANSCRIPT:
"""
${transcript.slice(0, 4000)}
"""

Return ONLY valid JSON matching this schema:
{"sentiment": "...", "goalAchieved": true/false, "callScore": 85, "summary": "...", "actionItems": []}`;

      for (const { client, model } of clients) {
        try {
          const response = await client.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          });

          const content = response.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            qaResult = {
              sentiment: parsed.sentiment || 'neutral',
              goalAchieved: Boolean(parsed.goalAchieved),
              callScore: Math.min(100, Math.max(1, Number(parsed.callScore) || 75)),
              summary: parsed.summary || 'Call processed.',
              actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
            };
            break;
          }
        } catch (candidateErr) {
          log.warn('qa_evaluator_candidate_failed', { model, error: candidateErr.message });
        }
      }
    }

    const costBreakdown = calculateCallCosts({
      durationSeconds,
      promptTokens: metrics.promptTokens || 0,
      completionTokens: metrics.completionTokens || 0,
      ttsCharacters: metrics.ttsCharacters || 0,
    });

    // Update MongoDB Call record
    if (callId) {
      await Call.findOneAndUpdate(
        { $or: [{ _id: callId }, { orchestratorCallId: callId }] },
        {
          $set: {
            'metadata.qa': qaResult,
            'metadata.costBreakdown': costBreakdown,
            'metadata.metrics': {
              turnCount: metrics.turnCount || 0,
              totalLlmMs: metrics.totalLlmMs || 0,
              totalToolMs: metrics.totalToolMs || 0,
            },
          },
        }
      );
      log.info('qa_evaluator_completed', { callId, score: qaResult.callScore, totalCost: costBreakdown.totalCost });
    }

    return { qaResult, costBreakdown };
  } catch (err) {
    log.warn('qa_evaluator_failed', { callId, error: err.message });
    return null;
  }
}
