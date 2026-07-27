import express from 'express';
import OpenAI from 'openai';
import User, { hashApiKey } from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import { containsAbuse } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import Call from '../db/models/Call.js';
import PhoneNumber from '../db/models/PhoneNumber.js';
import { sendCrmWebhook } from '../services/crmService.js';
import { parsePhoneWordsToDigits } from '../services/validators.js';
import { decryptCredentials } from '../services/encryption.js';

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
      <div class="autoniv-widget-footer" style="padding: 6px; text-align: center; font-size: 10px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #f1f5f9; font-weight: 600;">
        ⚡ Powered by <a href="https://autoniv.com" target="_blank" style="color: #475569; text-decoration: none; font-weight: 700;">Autoniv AI</a>
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
          body: JSON.stringify({ message: text, history }),
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
    const { message, history } = req.body;
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
    if (parsed.lead && parsed.lead.name && parsed.lead.phone) {
      try {
        const isPlaceholder = (val) => !val || ['unknown', 'unknown name', 'unknown phone', 'null', 'undefined', 'web caller', 'none', ''].includes(String(val).trim().toLowerCase());
        if (!isPlaceholder(parsed.lead.name) && !isPlaceholder(parsed.lead.phone)) {
          const formattedPhone = parsePhoneWordsToDigits(parsed.lead.phone);
          const existing = await Lead.findOne({
            userId: user._id,
            $or: [
              { phone: formattedPhone },
              { phone: parsed.lead.phone }
            ]
          }).sort({ createdAt: -1 }).lean();

          if (!existing || (Date.now() - new Date(existing.createdAt).getTime() > 60000)) {
            await Lead.create({
              userId: user._id,
              name: parsed.lead.name,
              phone: formattedPhone,
              email: isPlaceholder(parsed.lead.email) ? null : parsed.lead.email,
              purpose: isPlaceholder(parsed.lead.purpose) ? 'General inquiry' : parsed.lead.purpose,
              status: 'new',
              leadType: 'chat',
            });
            log.info('widget_lead_saved', { userId: user._id, name: parsed.lead.name, phone: formattedPhone });
          }
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

    // Increment chatUsed only for new conversations (first message of a session)
    const isNewConversation = !Array.isArray(history) || history.length === 0;
    if (isNewConversation) {
      try {
        await User.findByIdAndUpdate(user._id, { $inc: { chatUsed: 1 } });
      } catch (_) {}
    }

    res.json({ response: reply, step: nextStep });
  } catch (error) {
    log.error('widget_chat_error', { error: error.message, apiKey: req.headers['x-api-key'] });
    res.status(500).json({ response: 'Sorry, something went wrong. Please try again.', step: 'idle' });
  }
});
// ─── Serve voiceWidget.js (Embeddable Web Voice Call Script) ───────────────
router.get('/voiceWidget.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`
(function() {
  'use strict';

  const script = document.currentScript;
  const API_KEY = script?.getAttribute('data-api-key') || '';
  const POSITION = script?.getAttribute('data-position') || 'bottom-right';
  const API_BASE = '${req.protocol}://${req.get('host')}/api/widget';

  if (!API_KEY) {
    console.warn('[Autoniv Voice Widget] No API key provided');
    return;
  }

  function init() {
    const style = document.createElement('style');
    style.textContent = \`
      .autoniv-voice-bubble {
        position: fixed;
        \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
        \${POSITION.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #10b981);
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
      .autoniv-voice-bubble:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(37,99,235,0.5);
      }
      .autoniv-voice-container {
        position: fixed;
        \${POSITION.includes('right') ? 'right: 20px' : 'left: 20px'};
        \${POSITION.includes('bottom') ? 'bottom: 90px' : 'top: 90px'};
        width: 360px;
        max-width: calc(100vw - 40px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        z-index: 99999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        border: 1px solid #e2e8f0;
      }
      .autoniv-voice-header {
        background: linear-gradient(135deg, #2563eb, #10b981);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .autoniv-voice-body {
        padding: 24px;
        text-align: center;
      }
      .autoniv-voice-status {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
      }
      .autoniv-voice-sub {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 20px;
      }
      .autoniv-mic-btn {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #10b981);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(37,99,235,0.3);
      }
      .autoniv-mic-btn.calling {
        animation: autonivPulse 1.5s infinite;
        background: #ef4444;
      }
      @keyframes autonivPulse {
        0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
        70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
        100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
      }
    \`;
    document.head.appendChild(style);

    const bubble = document.createElement('button');
    bubble.className = 'autoniv-voice-bubble';
    bubble.setAttribute('aria-label', 'Open AI Voice Assistant');
    bubble.innerHTML = \`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>\`;

    const container = document.createElement('div');
    container.className = 'autoniv-voice-container';
    container.innerHTML = \`
      <div class="autoniv-voice-header">
        <span style="font-weight:700;font-size:14px;">Autoniv AI Voice Assistant</span>
        <button id="autoniv-voice-close" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">✕</button>
      </div>
      <div class="autoniv-voice-body">
        <div class="autoniv-voice-status" id="autoniv-voice-status">Tap mic to start AI Voice Call</div>
        <div class="autoniv-voice-sub" id="autoniv-voice-sub">24/7 AI Candidate Screening & Assistance</div>
        <button class="autoniv-mic-btn" id="autoniv-mic-btn">🎙️</button>
      </div>
    \`;

    document.body.appendChild(bubble);
    document.body.appendChild(container);

    let isCalling = false;
    let recognition = null;

    bubble.addEventListener('click', () => {
      container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
    });

    document.getElementById('autoniv-voice-close').addEventListener('click', () => {
      container.style.display = 'none';
      if (isCalling) endCall();
    });

    const micBtn = document.getElementById('autoniv-mic-btn');
    const statusText = document.getElementById('autoniv-voice-status');
    const subText = document.getElementById('autoniv-voice-sub');

    micBtn.addEventListener('click', () => {
      if (!isCalling) {
        startCall();
      } else {
        endCall();
      }
    });

    async function startCall() {
      isCalling = true;
      micBtn.classList.add('calling');
      micBtn.innerHTML = '📞';
      statusText.innerText = 'AI Agent Connected';
      subText.innerText = 'Listening... Speak naturally';

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            subText.innerText = 'You: ' + transcript;
          };

          recognition.start();
        }
      } catch (err) {
        console.warn('[Autoniv Voice Widget] Speech recognition error:', err);
      }
    }

    function endCall() {
      isCalling = false;
      micBtn.classList.remove('calling');
      micBtn.innerHTML = '🎙️';
      statusText.innerText = 'Call Ended';
      subText.innerText = 'Thank you for speaking with Autoniv AI';
      if (recognition) {
        try { recognition.stop(); } catch (_) {}
      }
    }
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
  `);
});

// ─── POST /api/widget/voice-token (Tenant-Scoped Session Config) ─────────────
router.post('/voice-token', authenticateApiKey, async (req, res) => {
  try {
    const user = req.widgetUser;
    const { agentId, candidateName } = req.body;

    let agent = null;
    if (agentId) {
      agent = await Agent.findOne({ _id: agentId, userId: user._id }).lean();
    }
    if (!agent) {
      agent = await Agent.findOne({ userId: user._id, isActive: true }).lean();
    }

    const sessionId = 'vtoken_' + Math.random().toString(36).substring(2, 10);

    res.json({
      success: true,
      sessionId,
      tenantId: user._id,
      agent: {
        id: agent?._id || null,
        name: agent?.name || 'Autoniv AI Screening Agent',
        firstMessage: candidateName ? `Hello ${candidateName}, thank you for applying! I am your AI Screening Assistant.` : 'Hello! I am your AI Voice Assistant.',
        prompt: agent?.systemPrompt || 'Candidate screening agent',
      },
    });
  } catch (err) {
    log.error('widget_voice_token_error', { error: err.message });
    res.status(500).json({ message: 'Failed to generate voice token' });
  }
});

// ─── POST /api/widget/call (Option B: API-Only Bulk Candidate Screening Outbound Call) ───
router.post('/call', authenticateApiKey, async (req, res) => {
  try {
    const user = req.widgetUser;
    const { phone, name, agentId, context, webhookUrl, webhookSecret, candidateConsent } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Candidate phone number is required' });
    }

    const formattedPhone = parsePhoneWordsToDigits(phone);
    const candidateName = name || 'Candidate';

    let agent = null;
    if (agentId) {
      agent = await Agent.findOne({ _id: agentId, userId: user._id }).lean();
    }
    if (!agent) {
      agent = await Agent.findOne({ userId: user._id, isActive: true }).lean();
    }

    // Resolve Phone Number & credentials assigned to selected Agent first, falling back to account default
    let phoneDoc = null;
    if (agent?._id) {
      phoneDoc = await PhoneNumber.findOne({ assignedToAgent: agent._id, userId: user._id }).lean();
      if (!phoneDoc && agent.phoneNumberId && mongoose.Types.ObjectId.isValid(agent.phoneNumberId)) {
        phoneDoc = await PhoneNumber.findById(agent.phoneNumberId).lean();
      }
      if (!phoneDoc && agent.phoneNumber) {
        const rawNum = agent.phoneNumber.replace(/\D/g, '');
        phoneDoc = await PhoneNumber.findOne({
          userId: user._id,
          $or: [
            { phoneNumber: agent.phoneNumber },
            { phoneNumber: { $regex: (rawNum.length >= 10 ? rawNum.slice(-10) : rawNum) + '$' } }
          ]
        }).lean();
      }
    }
    if (!phoneDoc) {
      phoneDoc = await PhoneNumber.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();
    }

    const platform = phoneDoc?.platform || (process.env.EXOTEL_ACCOUNT_SID ? 'exotel' : 'custom');
    const credentials = phoneDoc?.credentials ? decryptCredentials(phoneDoc.credentials) : {};
    const fromCallerId = phoneDoc?.phoneNumber || agent?.phoneNumber || process.env.EXOTEL_CALLER_ID || process.env.OUTBOUND_FROM_NUMBER || '08047192000';

    // Save Call Record in MongoDB for Autoniv Orchestrator Engine
    const callRecord = await Call.create({
      userId: user._id,
      agentId: agent?._id || null,
      orchestratorCallId: 'orch_' + Math.random().toString(36).substring(2, 10),
      callerNumber: formattedPhone,
      fromNumber: fromCallerId,
      status: 'queued',
      startedAt: new Date(),
      metadata: {
        candidateName,
        context: context || {},
        platform,
        webhookUrl: webhookUrl || user.webhookUrl || null,
        webhookSecret: webhookSecret || user.webhookSecret || null,
        candidateConsent: candidateConsent ?? true,
      },
    });

    log.info('crm_candidate_call_queued', { callId: callRecord._id, phone: formattedPhone, candidateName, platform });

    // Execute Telephony Outbound Dialing Across Any Platform (Exotel, Plivo, Ozonetel, MCube, Tata, Maqsam, Vobiz, Custom SIP, Twilio)
    let dialSuccess = false;
    try {
      const rawBase = process.env.WEBHOOK_URL || `${req.protocol}://${req.get('host')}`;
      const base = rawBase.replace(/\/api\/webhooks(?:\/vapi)?\/?$/i, '').replace(/\/$/, '');
      const incomingWebhookUrl = `${base}/api/webhooks/incoming-call?agentId=${agent._id}&callId=${callRecord._id}`;
      const statusCallbackUrl = `${base}/api/webhooks/twilio/status`;

      if (platform === 'exotel' || process.env.EXOTEL_ACCOUNT_SID) {
        const sid = credentials.accountSid || credentials.subdomain || process.env.EXOTEL_ACCOUNT_SID;
        const apiKey = credentials.apiKey || process.env.EXOTEL_API_KEY;
        const apiToken = credentials.apiToken || credentials.authToken || process.env.EXOTEL_API_TOKEN;

        if (sid && apiKey && apiToken) {
          let cleanFromNumber = fromCallerId.replace(/\D/g, '');
          let cleanE164Number = formattedPhone.replace(/\D/g, '');
          if (cleanE164Number.length === 10) cleanE164Number = `0${cleanE164Number}`;
          if (cleanFromNumber.length === 10) cleanFromNumber = `0${cleanFromNumber}`;

          const exoMlUrl = credentials.url
            ? `${credentials.url}${credentials.url.includes('?') ? '&' : '?'}agentId=${agent._id}&callId=${callRecord._id}`
            : incomingWebhookUrl;
          const streamUrl = credentials.streamUrl || process.env.EXOTEL_STREAM_URL || `wss://${req.get('host')}/media-stream?agentId=${agent._id}`;

          const exotelUrl = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;
          const params = new URLSearchParams({
            From: cleanE164Number,
            CallerId: cleanFromNumber,
            Url: exoMlUrl,
            StreamUrl: streamUrl,
            StreamType: 'bidirectional',
            Record: 'true',
          });

          const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
          const exoRes = await fetch(exotelUrl, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });

          if (exoRes.ok) {
            dialSuccess = true;
          }
        }
      } else if (platform === 'plivo') {
        const authId = credentials.authId || credentials.accountSid || process.env.PLIVO_AUTH_ID;
        const authToken = credentials.authToken || credentials.apiToken || process.env.PLIVO_AUTH_TOKEN;
        if (authId && authToken) {
          const plivoUrl = `https://api.plivo.com/v1/Account/${authId}/Call/`;
          const authHeader = 'Basic ' + Buffer.from(`${authId}:${authToken}`).toString('base64');
          const plivoRes = await fetch(plivoUrl, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromCallerId, to: formattedPhone, answer_url: incomingWebhookUrl, callback_url: statusCallbackUrl })
          });
          if (plivoRes.ok) dialSuccess = true;
        }
      } else if (platform === 'custom') {
        const endpoint = credentials.sipEndpoint || credentials.webhookUrl || process.env.CUSTOM_SIP_ENDPOINT;
        if (endpoint) {
          const headers = { 'Content-Type': 'application/json' };
          if (credentials.apiKey) headers['Authorization'] = `Bearer ${credentials.apiKey}`;
          const custRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ from: fromCallerId, to: formattedPhone, webhookUrl: incomingWebhookUrl, agentId: agent._id })
          });
          if (custRes.ok) dialSuccess = true;
        }
      } else if (platform === 'twilio') {
        const sid = credentials.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const token = credentials.authToken || process.env.TWILIO_AUTH_TOKEN;
        if (sid && token) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
          const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
          const params = new URLSearchParams({
            To: formattedPhone,
            From: fromCallerId,
            Url: incomingWebhookUrl,
            StatusCallback: statusCallbackUrl,
          });
          const twRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });
          if (twRes.ok) dialSuccess = true;
        }
      }

      if (dialSuccess) {
        await Call.findByIdAndUpdate(callRecord._id, { status: 'initiating' });
      }
    } catch (dialErr) {
      log.error('crm_candidate_dial_error', { callId: callRecord._id, error: dialErr.message });
    }

    // Send immediate HMAC-signed webhook confirmation if webhookUrl provided
    if (webhookUrl) {
      sendCrmWebhook(webhookUrl, 'candidate_call_queued', {
        callId: String(callRecord._id),
        candidateName,
        phone: formattedPhone,
        status: dialSuccess ? 'initiating' : 'queued',
        timestamp: new Date().toISOString(),
      }, webhookSecret);
    }

    res.json({
      success: true,
      callId: String(callRecord._id),
      status: dialSuccess ? 'initiating' : 'queued',
      message: dialSuccess
        ? 'Candidate screening call dialing in real-time'
        : 'Candidate screening call queued in system. Please configure carrier credentials (Exotel, Plivo, Twilio, or SIP) under My Phone Numbers to trigger real-time phone dialing.',
      carrierConfigured: dialSuccess,
    });
  } catch (err) {
    log.error('widget_outbound_call_error', { error: err.message });
    res.status(500).json({ message: 'Failed to trigger candidate call' });
  }
});

export default router;
