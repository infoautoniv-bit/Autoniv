import express from 'express';
import Chatbot from '../db/models/Chatbot.js';
import { handleChatbotMessage } from '../services/whatsappChatbot.js';
import { log } from '../services/logger.js';

const router = express.Router();

// Serve the embeddable widget JS
router.get('/widget.js', (req, res) => {
  const chatbotId = req.query.chatbotId || '';

  const js = `
(function() {
  var CHATBOT_ID = '${chatbotId}';
  var API_BASE = window.location.origin;
  // Fresh id per page load = one conversation. Lets the server count each
  // chatbox session as a distinct conversation instead of collapsing by IP.
  var SESSION_ID = 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  if (!CHATBOT_ID) {
    var s = document.currentScript;
    if (s) CHATBOT_ID = s.getAttribute('data-chatbot-id') || '';
  }

  if (!CHATBOT_ID) { console.warn('Chatbot: no data-chatbot-id'); return; }

  var config = { brandColor: '#0077ff', welcomeMessage: 'Hi! How can I help you?' };
  var messages = [];
  var isOpen = false;

  function createBubble() {
    var bubble = document.createElement('div');
    bubble.id = 'chatbot-bubble';
    bubble.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:' + config.brandColor + ';cursor:pointer;z-index:99999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.2);transition:transform 0.2s';
    bubble.innerHTML = '<svg width="28" height="28" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    bubble.onclick = togglePanel;
    bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.1)'; };
    bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; };
    document.body.appendChild(bubble);
  }

  function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'chatbot-panel';
    panel.style.cssText = 'position:fixed;bottom:100px;right:24px;width:380px;max-width:calc(100vw - 48px);height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.15);z-index:99998;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';

    panel.innerHTML = '<div id="cb-header" style="padding:16px;color:#fff;display:flex;align-items:center;justify-content:space-between"><div><div style="font-weight:700;font-size:14px">Chat with us</div><div style="font-size:11px;opacity:0.8">We typically reply instantly</div></div><button id="cb-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:20px">&times;</button></div><div id="cb-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px"></div><div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px"><input id="cb-input" type="text" placeholder="Type a message..." style="flex:1;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;outline:none" /><button id="cb-send" style="padding:10px 16px;background:' + config.brandColor + ';color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px">Send</button></div>';

    document.body.appendChild(panel);

    document.getElementById('cb-close').onclick = togglePanel;
    document.getElementById('cb-send').onclick = sendMessage;
    document.getElementById('cb-input').onkeydown = function(e) { if (e.key === 'Enter') sendMessage(); };

    addBotMessage(config.welcomeMessage);
  }

  function addBotMessage(text) {
    messages.push({ role: 'bot', text: text });
    var el = document.createElement('div');
    el.style.cssText = 'max-width:80%;padding:10px 14px;background:#f1f5f9;border-radius:12px 12px 12px 4px;font-size:13px;line-height:1.5;color:#1e293b;align-self:flex-start';
    el.textContent = text;
    document.getElementById('cb-messages').appendChild(el);
    document.getElementById('cb-messages').scrollTop = 99999;
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', text: text });
    var el = document.createElement('div');
    el.style.cssText = 'max-width:80%;padding:10px 14px;background:' + config.brandColor + ';color:#fff;border-radius:12px 12px 4px 12px;font-size:13px;line-height:1.5;align-self:flex-end';
    el.textContent = text;
    document.getElementById('cb-messages').appendChild(el);
    document.getElementById('cb-messages').scrollTop = 99999;
  }

  function sendMessage() {
    var input = document.getElementById('cb-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);

    var sendBtn = document.getElementById('cb-send');
    sendBtn.textContent = '...';
    sendBtn.disabled = true;

    fetch(API_BASE + '/api/chatbot-widget/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatbotId: CHATBOT_ID, sessionId: SESSION_ID, message: text, history: messages.slice(-10) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      addBotMessage(data.reply || 'Sorry, something went wrong.');
    })
    .catch(function() {
      addBotMessage('Connection error. Please try again.');
    })
    .finally(function() {
      sendBtn.textContent = 'Send';
      sendBtn.disabled = false;
    });
  }

  function togglePanel() {
    var panel = document.getElementById('chatbot-panel');
    if (!panel) { createPanel(); panel = document.getElementById('chatbot-panel'); }
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'flex' : 'none';
  }

  // Load config then init
  fetch(API_BASE + '/api/chatbot-widget/config/' + CHATBOT_ID)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.brandColor) config.brandColor = data.brandColor;
      if (data.welcomeMessage) config.welcomeMessage = data.welcomeMessage;
      createBubble();
    })
    .catch(function() { createBubble(); });
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(js);
});

// Get chatbot config for widget
router.get('/config/:id', async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id).select('name brandColor welcomeMessage isActive');
    if (!chatbot || !chatbot.isActive) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }
    return res.json({
      name: chatbot.name,
      brandColor: chatbot.brandColor,
      welcomeMessage: chatbot.welcomeMessage,
    });
  } catch {
    return res.status(404).json({ message: 'Chatbot not found' });
  }
});

// Handle chat message
router.post('/chat', async (req, res) => {
  try {
    const { chatbotId, sessionId, message, history } = req.body;
    if (!chatbotId || !message?.trim()) {
      return res.status(400).json({ message: 'chatbotId and message are required' });
    }

    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot || !chatbot.isActive) {
      return res.status(404).json({ message: 'Chatbot not found or inactive' });
    }

    const reply = await handleChatbotMessage({
      chatbotId,
      channel: 'widget',
      // Per-session id makes each new chatbox conversation its own record, so
      // conversationCount increments per conversation. Falls back to IP for
      // older embeds that predate sessionId.
      customerIdentifier: (typeof sessionId === 'string' && sessionId.trim()) || req.ip || 'web',
      message: message.trim(),
    });

    return res.json({ reply });
  } catch (err) {
    log.error('chatbot_widget_error', { error: err.message });
    return res.status(500).json({ reply: 'Something went wrong. Please try again.' });
  }
});

export default router;
