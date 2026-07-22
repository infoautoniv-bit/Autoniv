import OpenAI from 'openai';
import Chatbot from '../db/models/Chatbot.js';
import ChatbotConversation from '../db/models/ChatbotConversation.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
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

  const crmJsonInstructions = `\n\nYou MUST respond with a JSON object in this exact format:
{
  "response": "Your conversational reply to the customer here. Keep it natural, warm and concise.",
  "lead": null | { "name": "string", "phone": "string", "email": "string", "purpose": "string" },
  "appointment": null | { "service": "string", "preferredDate": "string (YYYY-MM-DD)", "preferredTime": "string", "name": "string", "phone": "string" }
}

Flow Rules:
1. If the customer is sharing contact details or interested in booking, ask for the required fields (name, phone, email, purpose/service) one by one in your "response" text.
2. Once you have collected ALL required fields for a lead, populate the "lead" object (do not leave it null).
3. Once you have collected ALL required fields for an appointment, populate the "appointment" object (do not leave it null).`;

  const messages = buildMessages(
    chatbot.systemPrompt + crmJsonInstructions,
    chatbot.welcomeMessage,
    conversation.messages,
    message,
  );

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return 'Sorry, I could not generate a response.';
    }

    let parsed;
    let reply = '';
    try {
      parsed = JSON.parse(content);
      reply = parsed.response || "I'm not sure how to respond to that.";
    } catch {
      reply = content;
    }

    // Save lead if AI returned one
    if (parsed && parsed.lead && parsed.lead.name && parsed.lead.phone && parsed.lead.email && parsed.lead.purpose) {
      try {
        const existing = await Lead.findOne({ userId: chatbot.userId, phone: parsed.lead.phone }).sort({ createdAt: -1 }).lean();
        if (!existing || (Date.now() - new Date(existing.createdAt).getTime() > 60000)) {
          await Lead.create({
            userId: chatbot.userId,
            chatbotId: chatbot._id,
            name: parsed.lead.name,
            phone: parsed.lead.phone,
            email: parsed.lead.email,
            purpose: parsed.lead.purpose,
            status: 'new',
            leadType: 'chat',
          });
        }
        log.info('chatbot_lead_saved', { chatbotId: chatbot._id, name: parsed.lead.name });
      } catch (err) {
        log.error('chatbot_lead_save_error', { error: err.message, chatbotId: chatbot._id });
      }
    }

    // Save appointment if AI returned one
    if (parsed && parsed.appointment && parsed.appointment.service && parsed.appointment.preferredDate && parsed.appointment.preferredTime && parsed.appointment.name) {
      try {
        const existingAppt = await Appointment.findOne({ userId: chatbot.userId, name: parsed.appointment.name, service: parsed.appointment.service }).sort({ createdAt: -1 }).lean();
        if (!existingAppt || (Date.now() - new Date(existingAppt.createdAt).getTime() > 60000)) {
          await Appointment.create({
            userId: chatbot.userId,
            name: parsed.appointment.name,
            phone: parsed.appointment.phone || null,
            service: parsed.appointment.service,
            preferredDate: parsed.appointment.preferredDate,
            preferredTime: parsed.appointment.preferredTime,
            status: 'pending',
          });
        }
        log.info('chatbot_appt_saved', { chatbotId: chatbot._id, name: parsed.appointment.name });
      } catch (err) {
        log.error('chatbot_appt_save_error', { error: err.message, chatbotId: chatbot._id });
      }
    }

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
