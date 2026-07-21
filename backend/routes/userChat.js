import express from 'express';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import { authenticate, requireFeature, checkChatLimit } from '../middleware/auth.js';
import { containsAbuse } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import User from '../db/models/User.js';
import Lead from '../db/models/Lead.js';
import Appointment from '../db/models/Appointment.js';
import ChatSession from '../db/models/ChatSession.js';

const router = express.Router();
router.use(authenticate);
router.use(requireFeature('chat'));

let _groq;
function getGroq() {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY not configured on server');
    _groq = new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
  }
  return _groq;
}

const SYSTEM_PROMPT = `You are an **AI Assistant** for the **Autoniv** platform. You help business owners manage leads, appointments, AND learn everything about the Autoniv platform.

---- AUTONIV PLATFORM DATA ----
Use the information below to answer any question the user asks about Autoniv.

## What is Autoniv?
Autoniv is a professional multi-tenant SaaS platform for managing **AI voice agents**, powered by the Vapi API. It lets businesses deploy intelligent voice assistants in **20+ languages** with **100+ realistic voices**. It handles calls, captures leads, automates scheduling, and scales communications 24/7.

**Tagline:** "AI Voice Agent Platform"
**Stats:** 10,000+ businesses, 5M+ calls handled, 99.8% accuracy, 99.9% uptime, 40% more leads, 2-minute setup.

## Core Features
1. **AI Voice Agents** — Deploy intelligent voice assistants with natural conversation. 3x faster responses.
2. **Global Language Support** — 20+ languages: English, Hindi, Arabic, Spanish, French, German, and more.
3. **Premium Voice Selection** — 100+ realistic voices across ages, genders, and accents.
4. **Smart Analytics** — Real-time dashboards for call performance, lead conversion, agent effectiveness.
5. **CRM Integration** — Seamlessly sync with Salesforce, HubSpot, and 50+ tools.
6. **Enterprise Security** — Bank-grade encryption, SOC 2 certified, end-to-end encryption.

## Agent Types
1. **Receptionist Agent** — Virtual front desk. Greets callers, collects name/phone/purpose, routes calls. 24/7. Best for: healthcare, real estate, legal firms, service businesses.
2. **Appointment Booking Agent** — Automated scheduling. Collects service, date/time, sends confirmations. Best for: clinics, salons, consulting firms.
3. **FAQ Support Agent** — Knowledge base. Answers common questions instantly, escalates complex issues. Best for: customer support, e-commerce.

## Pricing Plans
| Plan | Price | Conversations | Key Features |
|------|-------|----------|-------------|
| **Free** | Rs 0 | 100 | 1 chatbot, website embed, basic FAQ & lead capture |
| **Starter** | Rs 3,499/mo | 1,000 | 3 chatbots, WhatsApp + website, Hindi & Hinglish support |
| **Growth (Most Popular)** | Rs 9,999/mo | 5,000 | 10 chatbots, all channels incl. Instagram, CRM & helpdesk integrations |
| **Enterprise** | Custom | Unlimited | Unlimited chatbots, custom AI training, DPDP Act compliance |

## Add-Ons
1. **Monthly Performance Report** — Rs 3,999-6,999/mo. Branded PDF with call quality scores, A/B outcomes, benchmarks.
2. **Script A/B Testing** — Rs 8,999/mo. Run two scripts, analyze conversion, get optimized version monthly.
3. **WhatsApp Follow-Up Sequences** — Rs 4,999/mo. Automated post-call WhatsApp flows (reminders, no-show follow-ups).
4. **Regional Language Agent** — Rs 8,000/mo per language. Hindi, Tamil, Telugu, Bengali.
5. **Reactivation Campaigns** — Rs 14,999/campaign (one-time). Call dormant lead database quarterly.
6. **White-Label Reseller** — Rs 49,999 setup + revenue share (one-time). Resell Autoniv under your brand.

## Integrations (50+)
Salesforce, HubSpot, Slack, Zapier, Stripe, Notion, Intercom, Zendesk — plus 42+ more via REST API.

## Use Cases
1. **Healthcare** — Automate patient scheduling, prescription reminders, follow-ups. 60% fewer no-shows.
2. **Real Estate** — Qualify leads, schedule viewings, follow up on listings 24/7. 3x more qualified leads.
3. **Financial Services** — Loan inquiries, payment reminders, account support. 50% cost reduction.
4. **E-Commerce** — 99% call coverage.

## Company Info
- Email: support@autoniv.com
- WhatsApp: +91 70659 90307
- Social: X (Twitter), LinkedIn, YouTube
- Footer pages: Features, Contact Us, Add-Ons, API Docs, About Us, Careers, Blog, Press, Help Center, Privacy Policy, Terms of Service
- Demo accounts: admin@autoniv.ai / Password123@ (admin), user@autoniv.ai / Test2@1234 (user)

## Contact & Support
- Support email: support@autoniv.com
- Team responds within 2-4 hours during business hours
- Business hours: Mon-Fri 9 AM - 6 PM, Sat 9 AM - 1 PM, closed Sunday

## Your Capabilities
1. **Capture leads** — Collect name, phone, email, purpose. After all 4 fields, return as lead to save.
2. **Book appointments** — Collect service, date, time, customer name, phone. After all 5, return as appointment to save.
3. **Convert lead to appointment** — Ask which lead, use their name/phone, then ask for service, date, time.
4. **Answer FAQs** — Use the Autoniv data above to answer ANY question about Autoniv's features, pricing, plans, add-ons, integrations, use cases, company info, agents.
5. **List recent records** — Show the user their recent leads and appointments from [Recent Records].
6. **General assistant chat** — Greet, help, and guide.

## Response Format
You MUST respond in valid JSON only (no markdown fences, no extra text):
{
  "response": "Your friendly reply text. Use **bold** for emphasis.",
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
- Be friendly, professional, and concise. Use natural conversation.
- After successfully saving a lead or appointment, confirm the details and ask "What would you like to do next?"
- For FAQs, answer helpfully then ask if they need anything else.
- Never make up information. If unsure, say so and ask for clarification.
- Use the [Recent Records] section to answer list/show/view requests.`;

router.post('/', checkChatLimit(), async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ response: 'Please send a message.', step: 'idle', data: {} });
    }

    const trimmed = message.trim();

    if (containsAbuse(trimmed)) {
      return res.status(400).json({
        response: 'Your message contains inappropriate language. Please keep the conversation respectful.',
        step: 'idle', data: {},
      });
    }

    const userId = req.user.userId;

    // Fetch recent records for AI context
    const [recentLeads, recentAppts] = await Promise.all([
      Lead.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Appointment.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const recordsContext = `\n[Recent Records]\nLeads: ${JSON.stringify(recentLeads.map(l => ({ _id: l._id, name: l.name, phone: l.phone, email: l.email, purpose: l.purpose, status: l.status })))}\nAppointments: ${JSON.stringify(recentAppts.map(a => ({ _id: a._id, name: a.name, service: a.service, date: a.preferredDate, time: a.preferredTime, status: a.status })))}`;

    // Build messages array
    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT + recordsContext },
    ];

    // Add conversation history (last 8 messages)
    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        groqMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      }
    }

    // Add current user message
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
      return res.json({ response: "I'm having trouble processing that. Could you please try again?", step: 'idle', data: {} });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.json({ response: content, step: 'idle', data: {} });
    }

    const reply = parsed.response || "I'm not sure how to respond to that.";
    const nextStep = parsed.step || 'idle';

    // Save lead if AI returned one — require ALL 4 fields to prevent duplicates
    if (parsed.lead && parsed.lead.name && parsed.lead.phone && parsed.lead.email && parsed.lead.purpose) {
      try {
        // Check for duplicate (same phone + same user within this session)
        const existing = await Lead.findOne({ userId, phone: parsed.lead.phone }).sort({ createdAt: -1 }).lean();
        if (!existing || (Date.now() - new Date(existing.createdAt).getTime() > 60000)) {
          await Lead.create({
            userId,
            name: parsed.lead.name,
            phone: parsed.lead.phone,
            email: parsed.lead.email,
            purpose: parsed.lead.purpose,
            status: 'new',
            leadType: 'chat',
          });
        }
        log.info('ai_lead_saved', { userId, name: parsed.lead.name });
      } catch (error) {
        log.error('ai_save_lead_error', { error: error.message, userId });
      }
    }

    // Save appointment if AI returned one
    if (parsed.appointment && parsed.appointment.service && parsed.appointment.preferredDate && parsed.appointment.preferredTime && parsed.appointment.name) {
      try {
        const existingAppt = await Appointment.findOne({ userId, name: parsed.appointment.name, service: parsed.appointment.service }).sort({ createdAt: -1 }).lean();
        if (!existingAppt || (Date.now() - new Date(existingAppt.createdAt).getTime() > 60000)) {
          await Appointment.create({
            userId,
            name: parsed.appointment.name,
            phone: parsed.appointment.phone || null,
            service: parsed.appointment.service,
            preferredDate: parsed.appointment.preferredDate,
            preferredTime: parsed.appointment.preferredTime,
            status: 'pending',
          });
        }
        log.info('ai_appointment_saved', { userId, name: parsed.appointment.name });
      } catch (error) {
        log.error('ai_save_appointment_error', { error: error.message, userId });
      }
    }

    // Increment chatUsed on every conversation exchange
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { chatUsed: 1 } },
      { new: true }
    ).lean();

    res.json({
      response: reply,
      step: nextStep,
      data: {},
      chatUsed: updatedUser?.chatUsed || 0,
      chatLimit: updatedUser?.chatLimit || 0,
    });
  } catch (error) {
    log.error('user_chat_ai_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ response: 'Sorry, something went wrong. Please try again.', step: 'idle', data: {} });
  }
});

export default router;
