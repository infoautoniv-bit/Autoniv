import express from 'express';
import OpenAI from 'openai';
import User, { hashApiKey } from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import { containsAbuse } from '../services/contentModeration.js';
import { log } from '../services/logger.js';

const router = express.Router();

let _groq;
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not configured on server');
    _groq = new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
  }
  return _groq;
}

// ─── API Key authentication middleware ───────────────────────────────────────
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (!apiKey) {
      return res.status(401).json({ message: 'API key required' });
    }

    // Hash the incoming key and look up by hash
    const hashedKey = hashApiKey(apiKey);
    const user = await User.findOne({ apiKey: hashedKey }).select('+apiKey').lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Account suspended' });
    }

    req.widgetUser = user;
    next();
  } catch (error) {
    log.error('widget_auth_error', { error: error.message });
    res.status(500).json({ message: 'Authentication failed' });
  }
}

// ─── Serve widget.js ────────────────────────────────────────────────────────
router.get('/widget.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`
(function() {
  'use strict';

  const script = document.currentScript;
  const API_KEY = script?.getAttribute('data-api-key') || '';
  const POSITION = script?.getAttribute('data-position') || 'bottom-right';
  const AGENT_ID = script?.getAttribute('data-agent-id') || '';
  const API_BASE = '${req.protocol}://${req.get('host')}/api/widget';

  if (!API_KEY) {
    console.warn('[Autoniv Widget] No API key provided');
    return;
  }

  function init() {
    // Create styles
    const style = document.createElement('style');
    style.textContent = \`
      .autoniv-widget-bubble {
        position: fixed;
        \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
        \${POSITION.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #0891b2);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(37,99,235,0.4);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .autoniv-widget-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(37,99,235,0.5);
      }
      .autoniv-widget-bubble svg {
        width: 28px;
        height: 28px;
      }
      .autoniv-widget-container {
        position: fixed;
        \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
        \${POSITION.includes('bottom') ? 'bottom: 90px' : 'top: 90px'};
        width: 380px;
        max-height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.15);
        z-index: 99998;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .autoniv-widget-container.open {
        display: flex;
      }
      .autoniv-widget-header {
        background: linear-gradient(135deg, #2563eb, #0891b2);
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .autoniv-widget-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .autoniv-widget-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
      }
      .autoniv-widget-close:hover {
        opacity: 1;
      }
      .autoniv-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 280px;
        max-height: 340px;
      }
      .autoniv-widget-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .autoniv-widget-message.user {
        align-self: flex-end;
        background: #2563eb;
        color: white;
        border-bottom-right-radius: 4px;
      }
      .autoniv-widget-message.bot {
        align-self: flex-start;
        background: #f1f5f9;
        color: #1e293b;
        border-bottom-left-radius: 4px;
      }
      .autoniv-widget-input-area {
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 8px;
      }
      .autoniv-widget-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
      }
      .autoniv-widget-input:focus {
        border-color: #2563eb;
      }
      .autoniv-widget-send {
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s;
      }
      .autoniv-widget-send:hover {
        background: #1d4ed8;
      }
      .autoniv-widget-send:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      @media (max-width: 440px) {
        .autoniv-widget-container {
          width: calc(100vw - 32px);
          right: 16px !important;
          left: 16px !important;
          bottom: 80px !important;
        }
      }
    \`;
    document.head.appendChild(style);

    // Create bubble button
    const bubble = document.createElement('button');
    bubble.className = 'autoniv-widget-bubble';
    bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    document.body.appendChild(bubble);

    // Create chat container
    const container = document.createElement('div');
    container.className = 'autoniv-widget-container';
    container.innerHTML = \`
      <div class="autoniv-widget-header">
        <h3>Chat with us</h3>
        <button class="autoniv-widget-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="autoniv-widget-messages"></div>
      <div class="autoniv-widget-input-area">
        <input type="text" class="autoniv-widget-input" placeholder="Type your message..." />
        <button class="autoniv-widget-send">Send</button>
      </div>
    \`;
    document.body.appendChild(container);

    const messagesEl = container.querySelector('.autoniv-widget-messages');
    const inputEl = container.querySelector('.autoniv-widget-input');
    const sendBtn = container.querySelector('.autoniv-widget-send');
    const closeBtn = container.querySelector('.autoniv-widget-close');
    let history = [];
    let isOpen = false;

    function addMessage(text, role) {
      const div = document.createElement('div');
      div.className = 'autoniv-widget-message ' + role;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function toggleWidget() {
      isOpen = !isOpen;
      container.classList.toggle('open', isOpen);
      if (isOpen && messagesEl.children.length === 0) {
        addMessage('Hi! How can I help you today?', 'bot');
      }
    }

    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      inputEl.value = '';
      sendBtn.disabled = true;

      history.push({ role: 'user', text });

      try {
        const res = await fetch(API_BASE + '/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          body: JSON.stringify({ message: text, history, agentId: AGENT_ID, agentId: AGENT_ID }),
        });

        const data = await res.json();
        addMessage(data.response || 'Sorry, something went wrong.', 'bot');
        history.push({ role: 'assistant', text: data.response });
      } catch (err) {
        addMessage('Connection error. Please try again.', 'bot');
      } finally {
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }

    bubble.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', toggleWidget);
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
`);
});

// ─── Public chat endpoint (authenticated via API key) ───────────────────────
router.post('/chat', authenticateApiKey, async (req, res) => {
  try {
    const { message, history, agentId } = req.body;
    const user = req.widgetUser;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ response: 'Please send a message.', step: 'idle' });
    }

    // Check conversation limit
    const PLAN_CONFIG = User.PLAN_CONFIG;
    let chatPlan = user.chatPlan || 'chat_free';
    if (!chatPlan || chatPlan === 'none' || !PLAN_CONFIG[chatPlan]) {
      const p = user.plan || 'chat_free';
      if (p.startsWith('chat_')) chatPlan = p;
      else if (p.startsWith('both_')) chatPlan = p.replace('both_', 'chat_');
      else chatPlan = `chat_${p}`;
    }
    const chatCfg = PLAN_CONFIG[chatPlan];
    if (chatCfg) {
      const convLimit = chatCfg.limits.conversations;
      if (convLimit !== -1 && (user.chatUsed || 0) >= convLimit) {
        return res.status(403).json({
          response: 'Monthly conversation limit reached. Please upgrade your plan.',
          step: 'idle',
          code: 'CHAT_LIMIT_EXCEEDED',
        });
      }
    }

    const trimmed = message.trim();

    if (containsAbuse(trimmed)) {
      return res.status(400).json({
        response: 'Your message contains inappropriate language. Please keep the conversation respectful.',
        step: 'idle',
      });
    }

    // Fetch recent records for AI context
    const [recentLeads, recentAppts] = await Promise.all([
      Lead.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5).lean(),
      Appointment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const recordsContext = `\n[Recent Records]\nLeads: ${JSON.stringify(recentLeads.map(l => ({ name: l.name, phone: l.phone, email: l.email, purpose: l.purpose })))}\nAppointments: ${JSON.stringify(recentAppts.map(a => ({ name: a.name, service: a.service, date: a.preferredDate, time: a.preferredTime })))}`;

    const SYSTEM_PROMPT = `You are a friendly AI assistant for ${user.company || user.name || 'this business'}.
You help visitors with their questions, capture leads, and book appointments.

## Response Format
You MUST respond in valid JSON only:
{
  "response": "Your friendly reply text.",
  "step": "idle" | "collecting_lead" | "collecting_appt",
  "lead": null | { "name": "...", "phone": "...", "email": "...", "purpose": "..." },
  "appointment": null | { "service": "...", "preferredDate": "...", "preferredTime": "...", "name": "...", "phone": "..." }
}

## Flow Rules
- **step: "idle"** — Use this when waiting for the user's next request.
- **step: "collecting_lead"** — You are in the middle of collecting lead info. Ask for missing fields one at a time.
- **step: "collecting_appt"** — You are in the middle of collecting appointment info. Ask for missing fields one at a time.
- **lead field** — Only populate when ALL 4 fields (name, phone, email, purpose) are collected and ready to save.
- **appointment field** — Only populate when ALL 5 fields (service, preferredDate, preferredTime, name, phone) are collected and ready to save.

## Important
- Be friendly, professional, and concise.
- After successfully saving a lead or appointment, confirm the details.
- Never make up information. If unsure, say so.${recordsContext}`;

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        groqMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      }
    }

    groqMessages.push({ role: 'user', content: trimmed });

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return res.json({ response: "I'm having trouble processing that. Could you please try again?", step: 'idle' });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.json({ response: content, step: 'idle' });
    }

    const reply = parsed.response || "I'm not sure how to respond to that.";
    const nextStep = parsed.step || 'idle';

    // Save lead if AI returned one
    if (parsed.lead && parsed.lead.name && parsed.lead.phone && parsed.lead.email && parsed.lead.purpose) {
      try {
        const existing = await Lead.findOne({ userId: user._id, phone: parsed.lead.phone }).sort({ createdAt: -1 }).lean();
        if (!existing || (Date.now() - new Date(existing.createdAt).getTime() > 60000)) {
          await Lead.create({
            userId: user._id,
            name: parsed.lead.name,
            phone: parsed.lead.phone,
            email: parsed.lead.email,
            purpose: parsed.lead.purpose,
            status: 'new',
            leadType: 'chat',
          });
        }
      } catch (error) {
        log.error('widget_lead_save_error', { error: error.message, userId: user._id });
      }
    }

    // Save appointment if AI returned one
    if (parsed.appointment && parsed.appointment.service && parsed.appointment.preferredDate && parsed.appointment.preferredTime && parsed.appointment.name) {
      try {
        const existingAppt = await Appointment.findOne({ userId: user._id, name: parsed.appointment.name, service: parsed.appointment.service }).sort({ createdAt: -1 }).lean();
        if (!existingAppt || (Date.now() - new Date(existingAppt.createdAt).getTime() > 60000)) {
          await Appointment.create({
            userId: user._id,
            name: parsed.appointment.name,
            phone: parsed.appointment.phone || null,
            service: parsed.appointment.service,
            preferredDate: parsed.appointment.preferredDate,
            preferredTime: parsed.appointment.preferredTime,
            status: 'pending',
          });
        }
      } catch (error) {
        log.error('widget_appointment_save_error', { error: error.message, userId: user._id });
      }
    }

    // Increment chatUsed before sending response
    try {
      await User.findByIdAndUpdate(user._id, { $inc: { chatUsed: 1 } });
    } catch (_) {}

    res.json({ response: reply, step: nextStep });
  } catch (error) {
    log.error('widget_chat_error', { error: error.message, apiKey: req.headers['x-api-key'] });
    res.status(500).json({ response: 'Sorry, something went wrong. Please try again.', step: 'idle' });
  }
});

export default router;
