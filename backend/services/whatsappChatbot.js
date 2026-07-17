import OpenAI from 'openai';
import Chatbot from '../db/models/Chatbot.js';
import ChatbotConversation from '../db/models/ChatbotConversation.js';
import { log } from './logger.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';

let groq = null;
if (GROQ_API_KEY) {
  groq = new OpenAI({ baseURL: GROQ_BASE_URL, apiKey: GROQ_API_KEY });
}

const HISTORY_LIMIT = 10;

function buildMessages(systemPrompt, welcomeMessage, history, userMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  if (history.length === 0 && welcomeMessage) {
    messages.push({ role: 'assistant', content: welcomeMessage });
  }

  for (const msg of history.slice(-HISTORY_LIMIT)) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

export async function handleChatbotMessage({ chatbotId, channel, customerIdentifier, message }) {
  if (!groq) {
    log.error('chatbot_groq_not_configured');
    return 'Sorry, the AI service is not configured. Please try again later.';
  }

  const chatbot = await Chatbot.findById(chatbotId);
  if (!chatbot || !chatbot.isActive) {
    log.warn('chatbot_inactive_or_missing', { chatbotId });
    return 'This chatbot is currently unavailable.';
  }

  let conversation = await ChatbotConversation.findOne({
    chatbotId,
    channel,
    customerIdentifier,
  });

  if (!conversation) {
    conversation = await ChatbotConversation.create({
      chatbotId,
      channel,
      customerIdentifier,
      messages: [],
    });
    await Chatbot.findByIdAndUpdate(chatbotId, { $inc: { conversationCount: 1 } });
  }

  const messages = buildMessages(
    chatbot.systemPrompt,
    chatbot.welcomeMessage,
    conversation.messages,
    message,
  );

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';

    conversation.messages.push({ role: 'user', text: message, timestamp: new Date() });
    conversation.messages.push({ role: 'bot', text: reply, timestamp: new Date() });
    conversation.lastActive = new Date();

    if (conversation.messages.length > 100) {
      conversation.messages = conversation.messages.slice(-80);
    }

    await conversation.save();

    return reply;
  } catch (err) {
    log.error('chatbot_ai_error', { chatbotId, error: err.message });
    return 'Sorry, something went wrong. Please try again.';
  }
}

export async function findChatbotByPhoneId(phoneNumberId) {
  const chatbot = await Chatbot.findOne({
    'channels.whatsapp.enabled': true,
    'channels.whatsapp.phoneNumberId': phoneNumberId,
    isActive: true,
  });
  return chatbot;
}
