import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicLeadService } from '../services/api';
import { logger } from '../utils/logger';

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg: '#050816',
  bgElevated: '#080d1c',
  card: 'rgba(255,255,255,0.045)',
  cardHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  primary: '#2563EB',   // brand blue
  secondary: '#10B981', // brand emerald green
  accent: '#34D399',    // brand accent green
  success: '#10B981',   // green
  danger: '#FF5F57',
  textMuted: 'rgba(178,199,230,0.62)',
  textSoft: 'rgba(226,236,248,0.92)',
  gradPrimary: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)', // brand primary gradient
  gradAccent: 'linear-gradient(135deg, #2563EB 0%, #34D399 100%)',  // brand accent gradient
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: { path: string; label: string } | null;
}

type LeadStep = 'idle' | 'ask_name' | 'ask_phone' | 'ask_email' | 'ask_purpose' | 'submitting' | 'done';

interface LeadInfo {
  name: string;
  phone: string;
  email: string;
  purpose: string;
}

const KB = {
  platform: {
    name: 'Autoniv',
    tagline: 'AI Voice Agent Platform',
    description: 'A professional multi-tenant SaaS platform for managing AI voice agents powered by Vapi. Deploy intelligent voice assistants in 20+ languages with 100+ realistic voices.',
    stats: { businesses: '10,000+', accuracy: '99.8%', integrations: '50+', languages: '20+', voices: '100+' },
  },
  features: [
    { title: 'AI Voice Agents', desc: 'Deploy intelligent voice assistants with natural, human-like conversation.', metric: '3× faster response' },
    { title: 'Global Language Support', desc: '20+ languages including English, Hindi, Arabic, Spanish, French, German.', metric: '20+ languages' },
    { title: 'Premium Voice Selection', desc: '100+ realistic voices across different ages, genders, and accents.', metric: '100+ voices' },
    { title: 'Smart Analytics', desc: 'Track call performance, lead conversion, and agent effectiveness.', metric: '99.8% accuracy' },
    { title: 'CRM Integration', desc: 'Seamlessly sync leads and call data with Salesforce, HubSpot, and 50+ tools.', metric: '50+ integrations' },
    { title: 'Enterprise Security', desc: 'Bank-grade encryption, SOC 2 certified compliance.', metric: 'SOC 2 certified' },
  ],
  plans: {
    chat: [
      { name: 'Chat Free', price: '₹0/mo', features: ['1 chatbot', '100 chats/mo'] },
      { name: 'Chat Starter', price: '₹1,499/mo', features: ['2 chatbots', '1,500 chats/mo', 'Website + WhatsApp'] },
      { name: 'Chat Growth', price: '₹4,999/mo', features: ['Unlimited chatbots', '6,000 chats/mo', 'All 5 channels', 'CRM integrations'] },
      { name: 'Chat Enterprise', price: 'Custom', features: ['Unlimited chatbots & chats', 'Dedicated support'] },
    ],
    voice: [
      { name: 'Voice Launch', price: '₹4,999/mo ($149)', setup: '₹14,999', features: ['500 mins/mo', '1 AI Voice Agent', '1 Phone number'] },
      { name: 'Voice Growth ⭐', price: '₹14,999/mo ($349)', setup: '₹29,999', features: ['1,500 mins/mo', '2 Phone numbers', '5 AI Workflows', 'CRM Integration'] },
      { name: 'Voice Scale', price: '₹34,999/mo ($799)', setup: '₹49,999', features: ['5,000 mins/mo', '5 Phone numbers', 'Unlimited Workflows', 'WhatsApp follow-ups'] },
      { name: 'Voice Enterprise', price: 'Custom', setup: 'Custom', features: ['Unlimited mins & agents', 'White Label', '24x7 Support'] },
    ],
    combo: [
      { name: 'Combo Launch', price: '₹4,999/mo ($149)', setup: '₹14,999', features: ['1 chatbot / 100 chats/mo', '500 voice mins/mo'] },
      { name: 'Combo Growth ⭐', price: '₹16,498/mo ($378)', setup: '₹29,999', features: ['2 chatbots / 1,500 chats/mo', '1,500 voice mins/mo'] },
      { name: 'Combo Scale', price: '₹39,998/mo ($898)', setup: '₹49,999', features: ['Unlimited chatbots / 6,000 chats/mo', '5,000 voice mins/mo'] },
      { name: 'Combo Enterprise', price: 'Custom', setup: 'Custom', features: ['Unlimited chatbots & chats', 'Unlimited voice mins'] },
    ]
  },
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Helper: detect if user is asking a question mid-form               */
/* ─────────────────────────────────────────────────────────────────── */
function isOffTopicQuestion(input: string): boolean {
  const q = input.toLowerCase().trim();
  return (
    /feature|pric|plan|cost|free|starter|growth|enterprise|agent|receptionist|appointment|faq|demo|integrat|use case|healthcare|real estate|finance|ecommerce|language|voice|analytic|security|what|how|tell me|show|compare|help|who are you|commands/.test(q)
  );
}

function getReprompt(step: LeadStep): string {
  switch (step) {
    case 'ask_name': return "Now, back to your details — **what's your name?**";
    case 'ask_phone': return "Back to your details — **what's your phone number?**";
    case 'ask_email': return "Back to your details — **what's your email address?**";
    case 'ask_purpose': return "Almost there — **what are you looking for?**\n\n- Book a demo\n- Pricing inquiry\n- General question\n- Other";
    default: return '';
  }
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Markdown Renderer                                                  */
/* ─────────────────────────────────────────────────────────────────── */
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: T.secondary, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} style={{ height: 6 }} />);
      i++;
      continue;
    }

    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter(l => !l.match(/^\|[\s\-|]+\|$/));
      elements.push(
        <div key={`tbl-${i}`} style={{ overflowX: 'auto', marginBottom: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {rows[0].split('|').filter((_, ci) => ci > 0 && ci < rows[0].split('|').length - 1).map((cell, ci) => (
                  <th key={ci} style={{ padding: '5px 8px', textAlign: 'left', color: T.secondary, borderBottom: `1px solid ${T.border}`, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1).map((cell, ci) => (
                    <td key={ci} style={{ padding: '5px 8px', color: T.textSoft, fontSize: 11 }}>
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^[-*]\s/.test(line.trim())) {
      const bulletItems: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        bulletItems.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: 0, listStyle: 'none' }}>
          {bulletItems.map((item, bi) => (
            <li key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4, color: T.textSoft, fontSize: 11, lineHeight: 1.55 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.gradPrimary, flexShrink: 0, marginTop: 5.5 }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const numItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: 0, listStyle: 'none' }}>
          {numItems.map((item, ni) => (
            <li key={ni} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4, fontSize: 11, lineHeight: 1.55, color: T.textSoft }}>
              <span style={{
                minWidth: 18, height: 18, borderRadius: 6, background: 'rgba(59,130,246,0.16)',
                color: T.secondary, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, marginTop: 1, border: `1px solid rgba(59,130,246,0.25)`,
              }}>
                {ni + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^(#{1,3})/)?.[1].length ?? 1);
      const headingText = line.replace(/^#{1,3}\s/, '');
      elements.push(
        <p key={`h-${i}`} style={{ margin: level === 1 ? '0 0 6px' : '4px 0 3px', fontSize: level === 1 ? 13 : 12, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
          {renderInline(headingText)}
        </p>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} style={{ margin: '0 0 3px', fontSize: 11.5, lineHeight: 1.6, color: T.textSoft }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{elements}</div>;
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Response Generator                                                 */
/* ─────────────────────────────────────────────────────────────────── */
function generateResponse(input: string): { text: string; triggerLead?: boolean } {
  const q = input.toLowerCase().trim();

  if (/^(hi|hello|hey|howdy|greetings|good (morning|evening|afternoon))/.test(q)) {
    return { text: "Hello! I'm **Ava**, the Autoniv AI Assistant. I can help you with:\n\n- **Features** — AI voice agents, analytics, integrations\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Agents** — Receptionist, Appointment, FAQ types\n\nHow can I assist you?" };
  }

  if (/who are you|what are you|what can you do/.test(q)) {
    return { text: `I'm **Ava**, the ${KB.platform.name} AI Assistant — built into the platform.\n\nI know everything about:\n\n- Features, pricing plans, and add-ons\n- Agent types (Receptionist, Appointment, FAQ)\n- Integrations and use cases\n\nAsk me anything!` };
  }

  if (/^help|commands/.test(q)) {
    return { text: "**Try asking:**\n\n- \"What features does Autoniv offer?\"\n- \"Show me pricing plans\"\n- \"Tell me about agent types\"\n- \"Book a demo\"\n- \"Contact sales\"" };
  }

  if (/feature|what do|capabilities|offer|provide/.test(q)) {
    const list = KB.features.map((f, i) => `${i + 1}. **${f.title}** — ${f.desc} *(${f.metric})*`).join('\n');
    return { text: `**Autoniv Features**\n\n${list}\n\nWant a personalized demo? Share your details and I'll connect you with our team!`, triggerLead: true };
  }

  if (/pric|plan|cost|subscription|how much|charge/.test(q)) {
    if (/compare|vs|which|best|recommend/.test(q)) {
      return {
        text: `**Autoniv Plan Comparison**

| Plan Tier | Chat Plan | Voice Plan | Combo Plan |
|-----------|-----------|------------|------------|
| **Launch** | ₹0/mo | ₹4,999/mo ($149) | ₹4,999/mo |
| **Growth** | ₹1,499/mo | ₹14,999/mo ($349) | ₹16,498/mo |
| **Scale** | ₹4,999/mo | ₹34,999/mo ($799) | ₹39,998/mo |
| **Enterprise** | Custom | Custom | Custom |

Interested in a plan? Share your details and we will help you get set up!`,
        triggerLead: true
      };
    }

    const formatSection = (title: string, list: any[]) => {
      return `### ${title}\n` + list.map(p => {
        const setupStr = p.setup ? ` *(+ ${p.setup} setup)*` : '';
        return `• **${p.name}** — **${p.price}**${setupStr}\n  *Features:* ${p.features.join(', ')}`;
      }).join('\n');
    };

    const chatText = formatSection("Chat Plans (SaaS Chatbots)", KB.plans.chat);
    const voiceText = formatSection("Voice Plans (AI Phone Receptionists)", KB.plans.voice);
    const comboText = formatSection("Combo Plans (Chat + Voice)", KB.plans.combo);

    return {
      text: `**Autoniv Pricing & Plans**\n\nWe offer tailored options for Chat, Voice, and Combo solutions:\n\n${chatText}\n\n${voiceText}\n\n${comboText}\n\nWould you like a personalized demo? Share your details to connect with us!`,
      triggerLead: true
    };
  }

  if (/\bfree\b/.test(q) && /plan|pric/.test(q)) {
    return {
      text: `**Free & Trial Plans**

• **Chat Free**: ₹0 forever (1 chatbot, 100 chats/mo, website embed)
• **Voice Launch**: ₹4,999/mo ($149/mo) (+ ₹14,999 setup) — 500 mins/mo, 1 AI Voice Agent
• **Combo Launch**: ₹4,999/mo (1 chatbot + 500 voice mins/mo)

Would you like to start a free trial? Share your details!`,
      triggerLead: true
    };
  }
  if (/\b(starter|growth)\b/.test(q)) {
    return {
      text: `**Starter & Growth Plans**

• **Chat Starter**: ₹1,499/mo (2 chatbots, 1,500 chats/mo, Website + WhatsApp)
• **Voice Growth ⭐**: ₹14,999/mo ($349/mo) + ₹29,999 setup (1,500 mins/mo, CRM integration)
• **Combo Growth**: ₹16,498/mo + ₹29,999 setup (1 chatbot, 1,500 chats/mo + 1,500 voice mins/mo)

Ready to get started? Share your details and we will set you up!`,
      triggerLead: true
    };
  }
  if (/\b(scale)\b/.test(q)) {
    return {
      text: `**Scale Plans**

• **Chat Growth**: ₹4,999/mo (Unlimited chatbots, 6,000 chats/mo, CRM integrations)
• **Voice Scale**: ₹34,999/mo ($799/mo) + ₹49,999 setup (5,000 mins/mo, 5 phone numbers, WhatsApp follow-ups)
• **Combo Scale**: ₹39,998/mo + ₹49,999 setup (Unlimited chatbots + 5,000 voice mins/mo)

This is our most popular tier for growing businesses. Share your details to sign up!`,
      triggerLead: true
    };
  }
  if (/\b(enterprise)\b/.test(q)) {
    return {
      text: `**Enterprise Plans**

• **Chat Enterprise**: Custom pricing (Unlimited chatbots & chats, custom AI models)
• **Voice Enterprise**: Custom pricing & custom setup (Unlimited mins & agents, White Label, 24x7 support)
• **Combo Enterprise**: Custom pricing (Unified voice + chat platform)

Ready for full-scale automation? Share your details and our team will build a custom package!`,
      triggerLead: true
    };
  }

  if (/agent|receptionist|appointment|faq|voice assistant|ai agent|bot/.test(q)) {
    if (/receptionist|front desk/.test(q)) return { text: "**Receptionist Agent**\n\n- Front desk & general inquiries\n- Greets callers warmly\n- Collects name, phone, and purpose\n- Available 24/7\n\n**Best For**: Healthcare, real estate, any business needing a virtual front desk.\n\nWant one? Share your details!", triggerLead: true };
    if (/appointment|booking|schedule/.test(q)) return { text: "**Appointment Booking Agent**\n\n- Scheduling & confirmations\n- Collects service type, preferred date/time\n- Sends confirmation messages\n\n**Best For**: Clinics, salons, consulting firms.\n\nReady to book? Share your details!", triggerLead: true };
    if (/faq|question|support/.test(q)) return { text: "**FAQ Support Agent**\n\n- Q&A & knowledge base\n- Answers common questions instantly\n- Escalates complex questions\n\n**Best For**: Customer support, e-commerce.\n\nWant this? Share your details!", triggerLead: true };
    return { text: "**Agent Types on Autoniv**\n\n- **Receptionist** — Front desk & inquiries\n- **Appointment Booking** — Scheduling\n- **FAQ Support** — Q&A\n\nWhich one interests you? I can connect you with our team!", triggerLead: true };
  }

  if (/demo|book|trial|test|try|start|signup|register|get started|contact|reach|speak|talk|call back|connect/.test(q)) {
    return { text: "Great choice! Let me connect you with our team.\n\nPlease share your details:\n\n**1. What's your name?**", triggerLead: true };
  }

  if (/integrat|connect|sync|crm|salesforce|hubspot|slack|zapier/.test(q)) {
    return { text: "**Supported Integrations (50+)**\n\n- Salesforce\n- HubSpot\n- Slack\n- Zapier\n- Stripe\n- Notion\n- Intercom\n- Zendesk\n\nAnd 42+ more via API.\n\nWant to integrate? Share your details!", triggerLead: true };
  }

  if (/use case|industry|healthcare|real estate|finance|ecommerce/.test(q)) {
    return { text: "**Industry Use Cases**\n\n- **Healthcare** — 60% fewer no-shows\n- **Real Estate** — 3× more qualified leads\n- **Finance** — 50% cost reduction\n- **E-Commerce** — 99% call coverage\n\nWhich industry are you in? Let me connect you!", triggerLead: true };
  }

  if (/thank|thanks|thx/.test(q)) return { text: "You're welcome! Anything else I can help with?" };
  if (/bye|goodbye|see you|later/.test(q)) return { text: "Goodbye! Come back anytime. Have a great day!" };

  return { text: `I'd be happy to help! I know everything about **${KB.platform.name}**.\n\n**Try asking:**\n- "What features does Autoniv offer?"\n- "Show me pricing plans"\n- "Book a demo"\n- "Contact sales"` };
}

/* ─── Waveform ───────────────────────────────────────────── */
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 30, justifyContent: 'center' }}>
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2.5,
            borderRadius: 99,
            background: T.gradPrimary,
            height: active ? `${6 + Math.abs(Math.sin(i * 0.7)) * 20}px` : '3px',
            opacity: active ? 0.95 : 0.15,
            animation: active ? `waveBar ${0.5 + (i % 4) * 0.08}s ease-in-out ${i * 0.02}s infinite alternate` : 'none',
            transition: 'height .3s ease, opacity .3s ease',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Floating particles (ambient, behind the orb) ──────────────── */
function Particles() {
  const seeds = [0, 1, 2, 3, 4, 5];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {seeds.map(i => (
        <span key={i} style={{
          position: 'absolute',
          left: `${14 + i * 13}%`,
          bottom: -8,
          width: i % 2 === 0 ? 3 : 4,
          height: i % 2 === 0 ? 3 : 4,
          borderRadius: '50%',
          background: i % 2 === 0 ? T.secondary : T.accent,
          opacity: 0.35,
          animation: `floatUp ${6 + i}s ease-in-out ${i * 0.8}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── AI Orb — the signature element ────────────────────────────
   A living sphere: breathes at idle, glows cyan while the agent
   speaks, glows violet while the user speaks, ringed by a slowly
   rotating conic-gradient halo.                                  */
function VoiceOrb({ speaking }: { speaking: 'user' | 'agent' | 'idle' }) {
  const isAgent = speaking === 'agent';
  const isUser = speaking === 'user';
  const isActive = speaking !== 'idle';
  const glow = isAgent ? T.secondary : isUser ? T.accent : T.primary;

  return (
    <div style={{ position: 'relative', width: 132, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* rotating gradient halo */}
      <div style={{
        position: 'absolute', width: 118, height: 118, borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${T.primary}, ${T.secondary}, ${T.accent}, ${T.primary})`,
        filter: 'blur(1px)', opacity: isActive ? 0.55 : 0.22,
        animation: 'spinSlow 9s linear infinite',
        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
        transition: 'opacity .5s ease',
      }} />

      {/* ripple rings while active */}
      {isActive && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1.5px solid ${glow}33`,
          animation: `ringPulse 2.1s ease-out ${i * 0.65}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* soft outer glow */}
      <motion.div
        animate={{ opacity: isActive ? [0.35, 0.55, 0.35] : [0.12, 0.2, 0.12] }}
        transition={{ duration: isActive ? 1.6 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 96, height: 96, borderRadius: '50%',
          background: glow, filter: 'blur(26px)',
        }}
      />

      {/* core sphere — breathes gently at idle */}
      <motion.div
        animate={{ scale: isActive ? [1, 1.045, 1] : [1, 1.02, 1] }}
        transition={{ duration: isActive ? 0.9 : 3.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative', zIndex: 2, width: 62, height: 62, borderRadius: '50%',
          background: speaking === 'idle'
            ? `radial-gradient(circle at 32% 30%, #16233f, #060b16)`
            : `radial-gradient(circle at 32% 30%, ${glow} 0%, ${T.primary} 55%, #0a1226 100%)`,
          border: `1.5px solid ${glow}55`,
          boxShadow: isActive
            ? `0 0 0 3px ${glow}14, 0 0 40px ${glow}40, inset 0 1.5px 0 rgba(255,255,255,.18)`
            : `0 0 24px ${T.primary}22, inset 0 1px 0 rgba(255,255,255,.05)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#fff' : 'rgba(178,199,230,0.7)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke .4s ease' }}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ─── Connecting Dots ────────────────────────────────────── */
function ConnectingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 16, justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: T.gradPrimary,
          animation: 'connectBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
type CallMode = 'idle' | 'connecting' | 'active' | 'ended' | 'error';
type TabName = 'chat' | 'call';

export default function UnifiedAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<TabName>('chat');

  /* ── Chat State ── */
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **Ava**, the Autoniv AI Assistant. I can help you with:\n\n- **Features** — AI voice agents, analytics\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Book a Demo** — Get a personalized walkthrough\n\nHow can I assist you?`,
      timestamp: 0,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [leadStep, setLeadStep] = useState<LeadStep>('idle');
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({ name: '', phone: '', email: '', purpose: '' });
  const [leadError, setLeadError] = useState('');

  /* ── Call State ── */
  const [callMode, setCallMode] = useState<CallMode>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [speaking, setSpeaking] = useState<'user' | 'agent' | 'idle'>('idle');
  const [callErrorMsg, setCallErrorMsg] = useState('');

  const ws = useRef<WebSocket | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const proc = useRef<ScriptProcessorNode | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const srcs = useRef<AudioBufferSourceNode[]>([]);
  const nextT = useRef<number>(0);
  const analyser = useRef<AnalyserNode | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (maxDurationRef.current) { clearTimeout(maxDurationRef.current); maxDurationRef.current = null; }
  }, []);

  const stopCall = useCallback(() => {
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ event: 'stop' }));
      }
      ws.current.close();
      ws.current = null;
    }
    if (proc.current) { proc.current.disconnect(); proc.current = null; }
    if (mic.current) { mic.current.getTracks().forEach(t => t.stop()); mic.current = null; }

    srcs.current.forEach(s => { try { s.stop(); } catch {} });
    srcs.current = [];
    nextT.current = 0;

    if (ctx.current) { ctx.current.close().catch(() => {}); ctx.current = null; }
    analyser.current = null;

    clearTimers();
    setCallMode('ended');
    setSpeaking('idle');
  }, [clearTimers]);

  const play = useCallback((b64: string) => {
    const ac = ctx.current, an = analyser.current;
    if (!ac || !an) return;
    try {
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const i16 = new Int16Array(bytes.buffer), f32 = new Float32Array(i16.length);
      for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;

      const ab = ac.createBuffer(1, f32.length, 24000);
      ab.copyToChannel(f32, 0);

      const src = ac.createBufferSource();
      src.buffer = ab;
      src.connect(an);
      src.connect(ac.destination);

      const t0 = Math.max(ac.currentTime, nextT.current);
      src.start(t0);
      nextT.current = t0 + ab.duration;
      srcs.current.push(src);

      src.onended = () => {
        srcs.current = srcs.current.filter(x => x !== src);
        if (!srcs.current.length) {
          setSpeaking('idle');
        }
      };
    } catch (e) {
      logger.error('[Audio Playback Error]', e);
    }
  }, []);

  useEffect(() => () => { stopCall(); }, [stopCall]);

  // If widget is closed, terminate voice call to prevent leaks/charges
  useEffect(() => {
    if (!isOpen && (callMode === 'active' || callMode === 'connecting')) {
      const handle = setTimeout(() => stopCall(), 0);
      return () => clearTimeout(handle);
    }
  }, [isOpen, callMode, stopCall]);

  const startCall = useCallback(async () => {
    if (callMode === 'active' || callMode === 'connecting') { stopCall(); return; }

    setCallMode('connecting');
    setCallSeconds(0);
    setCallErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mic.current = stream;

      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ac = new AC({ sampleRate: 16000 });
      ctx.current = ac;
      if (ac.state === 'suspended') await ac.resume();
      nextT.current = ac.currentTime;

      const an = ac.createAnalyser();
      an.fftSize = 256;
      analyser.current = an;

      const raw = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      if (raw.startsWith('http')) host = new URL(raw).host;

      const url = `${proto}//${host}/web-call?agentId=demo`;
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        setCallMode('active');

        // Start call timer
        timerRef.current = setInterval(() => {
          setCallSeconds(s => {
            if (s >= 120) { stopCall(); return s; }
            return s + 1;
          });
        }, 1000);

        const src = ac.createMediaStreamSource(stream);
        const p = ac.createScriptProcessor(4096, 1, 1);
        proc.current = p;

        src.connect(p);
        p.connect(ac.destination);
        src.connect(an);

        p.onaudioprocess = e => {
          const d = e.inputBuffer.getChannelData(0);
          const pcm = new Int16Array(d.length);
          for (let i = 0; i < d.length; i++) {
            pcm[i] = Math.max(-1, Math.min(1, d[i])) * 0x7fff;
          }
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(pcm.buffer);
          }
        };
      };

      socket.onmessage = e => {
        try {
          const d = JSON.parse(e.data);
          if (d.event === 'audio') {
            setSpeaking('agent');
            play(d.payload);
          } else if (d.event === 'clear') {
            setSpeaking('idle');
            srcs.current.forEach(s => { try { s.stop(); } catch {} });
            srcs.current = [];
            nextT.current = ctx.current ? ctx.current.currentTime : 0;
          } else if (d.event === 'transcript') {
            if (d.role === 'caller') {
              setSpeaking('user');
            }
          }
        } catch {}
      };

      socket.onerror = () => {
        setCallErrorMsg('Call stream error. Verify server connection.');
        stopCall();
      };

      socket.onclose = () => {
        stopCall();
      };

    } catch (e: any) {
      setCallErrorMsg(`Microphone permission error: ${e.message}`);
      setCallMode('error');
    }
  }, [callMode, stopCall, play]);

  /* ─── Decoupled Event System ─── */
  useEffect(() => {
    const handleOpenWidget = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: TabName }>;
      setIsOpen(true);
      if (customEvent.detail?.tab) {
        setTab(customEvent.detail.tab);
      }
    };
    window.addEventListener('open-assistant-widget', handleOpenWidget);
    return () => window.removeEventListener('open-assistant-widget', handleOpenWidget);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **Ava**, the Autoniv AI Assistant. I can help you with:\n\n- **Features** — AI voice agents, analytics\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Book a Demo** — Get a personalized walkthrough\n\nHow can I assist you?`,
      timestamp: 0,
    }]);
    setLeadStep('idle');
    setLeadInfo({ name: '', phone: '', email: '', purpose: '' });
    setLeadError('');
  }, []);

  useEffect(() => {
    if (isOpen && tab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, tab]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { id: `${role}-${Date.now()}-${Math.random()}`, role, content, timestamp: Date.now() }]);
  };

  /* ── Lead collection step processor ── */
  const processLeadStep = useCallback(async (userInput: string) => {
    setLeadError('');

    if (leadStep === 'ask_name') {
      if (userInput.length < 2) {
        setLeadError('Please enter a valid name (at least 2 characters).');
        return;
      }
      setLeadInfo(prev => ({ ...prev, name: userInput }));
      addMessage('assistant', `Thanks, **${userInput}**!\n\n**2. What's your phone number?**`);
      setLeadStep('ask_phone');
    }

    else if (leadStep === 'ask_phone') {
      const phoneClean = userInput.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{7,15}$/.test(phoneClean)) {
        setLeadError('Please enter a valid phone number (7–15 digits).');
        return;
      }
      setLeadInfo(prev => ({ ...prev, phone: userInput }));
      addMessage('assistant', `Got it!\n\n**3. What's your email address?**`);
      setLeadStep('ask_email');
    }

    else if (leadStep === 'ask_email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInput)) {
        setLeadError('Please enter a valid email address.');
        return;
      }
      setLeadInfo(prev => ({ ...prev, email: userInput }));
      addMessage('assistant', `Got it!\n\n**4. What are you looking for?**\n\n- Book a demo\n- Pricing inquiry\n- General question\n- Other`);
      setLeadStep('ask_purpose');
    }

    else if (leadStep === 'ask_purpose') {
      const finalLead = { ...leadInfo, purpose: userInput };
      setLeadInfo(finalLead);
      setLeadStep('submitting');

      addMessage('assistant', 'Perfect! Submitting your details...');

      try {
        const res = await publicLeadService.submit({
          name: finalLead.name,
          phone: finalLead.phone,
          email: finalLead.email,
          purpose: finalLead.purpose,
        });

        addMessage('assistant', `✅ **${res.data.message}**\n\n**Your Details:**\n- Name: ${finalLead.name}\n- Phone: ${finalLead.phone}\n- Email: ${finalLead.email}\n- Purpose: ${finalLead.purpose}\n\nOur team will reach out within 24 hours. Is there anything else I can help with?`);
        setLeadStep('done');
      } catch {
        addMessage('assistant', 'Sorry, there was an error submitting your details. Please try again or contact us at **support@autoniv.com**.');
        setLeadStep('idle');
      }

      setLeadInfo({ name: '', phone: '', email: '', purpose: '' });
    }
  }, [leadStep, leadInfo]);

  /* ── Main send handler ── */
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;

    addMessage('user', text);
    setInput('');
    setIsTyping(true);

    const isInLeadFlow =
      leadStep !== 'idle' && leadStep !== 'done' && leadStep !== 'submitting';

    // ── Mid-form question: answer it, then re-prompt the current step ──
    if (isInLeadFlow && isOffTopicQuestion(text)) {
      setTimeout(() => {
        const result = generateResponse(text);
        addMessage('assistant', result.text);

        const reprompt = getReprompt(leadStep);
        if (reprompt) {
          setTimeout(() => {
            addMessage('assistant', reprompt);
          }, 500);
        }
        setIsTyping(false);
      }, 700 + Math.random() * 300);
      return;
    }

    // ── Normal lead flow step ──
    if (isInLeadFlow) {
      setTimeout(() => {
        processLeadStep(text);
        setIsTyping(false);
      }, 500 + Math.random() * 400);
      return;
    }

    // ── Normal conversation (not in lead flow) ──
    setTimeout(() => {
      const result = generateResponse(text);

      if (result.triggerLead && leadStep === 'idle') {
        addMessage('assistant', result.text);
        setTimeout(() => {
          addMessage('assistant', "**To get started, please share your details:**\n\n**1. What's your name?**");
          setLeadStep('ask_name');
          setIsTyping(false);
        }, 600);
        return;
      }

      addMessage('assistant', result.text);
      setIsTyping(false);
    }, 700 + Math.random() * 400);
  }, [input, isTyping, leadStep, processLeadStep]);

  /* ── Input placeholder by current step ── */
  const inputPlaceholder =
    leadStep === 'ask_name' ? 'Enter your name...' :
      leadStep === 'ask_phone' ? 'Enter your phone number...' :
        leadStep === 'ask_email' ? 'Enter your email...' :
          leadStep === 'ask_purpose' ? 'What are you looking for...' :
            'Ask anything...';

  const isCallActive = callMode === 'active' || callMode === 'connecting';

  const quickActions: { icon: string; label: string; grad: string; prompt: string }[] = [
    { icon: '💰', label: 'Pricing', grad: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(16,185,129,0.10))', prompt: 'Show me pricing plans' },
    { icon: '🤖', label: 'AI Agents', grad: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(37,99,235,0.10))', prompt: 'Tell me about agent types' },
    { icon: '✨', label: 'Features', grad: 'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(52,211,153,0.10))', prompt: 'What features does Autoniv offer?' },
    { icon: '📅', label: 'Book Demo', grad: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(52,211,153,0.08))', prompt: 'I want to book a demo' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-20 right-0 w-[500px] max-w-[calc(100vw-32px)] rounded-[22px] overflow-hidden flex flex-col"
            style={{
              height: '560px',
              background: `linear-gradient(180deg, ${T.bgElevated} 0%, ${T.bg} 100%)`,
              border: `1px solid ${T.border}`,
              backdropFilter: 'blur(24px)',
              boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02), 0 0 60px rgba(59,130,246,0.06)`,
            }}
          >
            <div style={{
              position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: -30, right: -60, width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none',
            }} />

            {/* Header */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11, flexShrink: 0, position: 'relative',
                background: T.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 16px rgba(37,99,235,0.35)`,
              }}>
                <svg className="w-4 h-4" fill="none" stroke="#fff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-tight">Ava AI</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span style={{ fontSize: 10, color: T.textMuted }}>Powered by Autoniv</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.textMuted }} />
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isCallActive ? T.accent : T.success, animation: 'livePulse 2s ease infinite' }} />
                  <span style={{ fontSize: 10, color: isCallActive ? T.accent : T.success, fontWeight: 600 }}>
                    {isCallActive ? 'In call' : 'Live'}
                  </span>
                </div>
              </div>
              {tab === 'chat' && (
                <button onClick={clearChat}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: T.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.cardHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title="Refresh conversation">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-5.36M20 15a9 9 0 01-14.13 5.36" />
                  </svg>
                </button>
              )}
              <button onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = T.cardHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab selector */}
            <div className="relative flex px-3 py-2.5 gap-1.5 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
              <button
                onClick={() => setTab('chat')}
                className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                style={tab === 'chat'
                  ? { background: 'rgba(37,99,235,0.14)', border: `1px solid rgba(37,99,235,0.30)`, color: '#fff' }
                  : { border: '1px solid transparent', color: T.textMuted }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat
              </button>
              <button
                onClick={() => setTab('call')}
                className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 relative"
                style={tab === 'call'
                  ? { background: 'rgba(16,185,129,0.14)', border: `1px solid rgba(16,185,129,0.30)`, color: '#fff' }
                  : { border: '1px solid transparent', color: T.textMuted }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice
                {isCallActive && (
                  <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full" style={{ background: T.accent, animation: 'livePulse 1.4s ease infinite' }} />
                )}
              </button>
            </div>

            {/* Content pane */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
              {tab === 'chat' ? (
                <>
                  {/* Quick action cards */}
                  <div className="grid grid-cols-4 gap-1.5 px-3 pt-2.5 pb-2 shrink-0">
                    {quickActions.map(qa => (
                      <button key={qa.label} onClick={() => setInput(qa.prompt)}
                        className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all"
                        style={{ background: qa.grad, border: `1px solid ${T.border}` }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = T.borderStrong; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = T.border; }}
                      >
                        <span style={{ fontSize: 15 }}>{qa.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: T.textSoft, textAlign: 'center', lineHeight: 1.2 }}>{qa.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Message body */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                    {/* Call in progress banner */}
                    {isCallActive && (
                      <button
                        onClick={() => setTab('call')}
                        className="w-full py-2 px-3 mb-1 rounded-xl flex items-center justify-between text-[11px] font-medium transition-all"
                        style={{ background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.22)`, color: T.accent }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent, animation: 'livePulse 1.4s ease infinite' }} />
                          <span>Voice call is active ({formatTime(callSeconds)})</span>
                        </div>
                        <span className="font-semibold text-[10px]">Return →</span>
                      </button>
                    )}

                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30, delay: idx === messages.length - 1 ? 0.02 : 0 }}
                        className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: T.gradPrimary }}>
                            <span style={{ fontSize: 11 }}>✨</span>
                          </div>
                        )}
                        <div className="max-w-[82%]">
                          {msg.role === 'user' ? (
                            <div className="px-3 py-2 rounded-2xl rounded-tr-md text-xs" style={{
                              background: T.gradPrimary, color: '#fff', fontSize: 11.5, lineHeight: 1.6,
                              boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                            }}>
                              {msg.content}
                            </div>
                          ) : (
                            <div className="rounded-2xl rounded-tl-md p-[1px]" style={{ background: `linear-gradient(135deg, rgba(37,99,235,0.35), rgba(16,185,129,0.15) 60%, transparent)` }}>
                              <div className="px-3 py-2 rounded-2xl rounded-tl-md" style={{ background: T.bgElevated }}>
                                {renderMarkdown(msg.content)}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {leadError && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(255,95,87,0.12)' }}>
                          <svg className="w-3 h-3" fill="none" stroke={T.danger} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="px-3 py-2 rounded-xl text-xs"
                          style={{ background: 'rgba(255,95,87,0.08)', border: `1px solid rgba(255,95,87,0.25)`, color: T.danger, fontSize: 11.5, lineHeight: 1.5 }}>
                          {leadError}
                        </div>
                      </div>
                    )}

                    {isTyping && (
                      <div className="flex gap-2 items-center">
                        <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: T.gradPrimary }}>
                          <span style={{ fontSize: 11 }}>✨</span>
                        </div>
                        <div className="px-3 py-2 rounded-2xl rounded-tl-md" style={{ background: T.card, border: `1px solid ${T.border}`, minWidth: 130 }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 500 }}>Ava is thinking</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                              position: 'absolute', inset: 0, width: '40%',
                              background: T.gradPrimary, borderRadius: 99,
                              animation: 'shimmerBar 1.1s ease-in-out infinite',
                            }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input bar */}
                  <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
                    {leadStep === 'submitting' ? (
                      <div className="text-center text-xs py-2 flex items-center justify-center gap-2" style={{ color: T.textMuted }}>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke={T.secondary} strokeWidth="4" />
                          <path className="opacity-75" fill={T.secondary} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting your details...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl px-1.5 py-1.5 transition-all duration-300"
                        style={{
                          background: T.card,
                          border: `1px solid ${inputFocused ? T.primary : T.border}`,
                          boxShadow: inputFocused ? `0 0 12px rgba(37,99,235,0.22)` : 'none'
                        }}>
                        <button
                          onClick={() => setTab('call')}
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ color: T.textMuted }}
                          onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
                          title="Switch to voice call"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="2" width="6" height="12" rx="3" />
                            <path strokeLinecap="round" d="M5 10a7 7 0 0014 0" />
                            <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
                            <line x1="9" y1="22" x2="15" y2="22" strokeLinecap="round" />
                          </svg>
                        </button>
                        <input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendMessage()}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          placeholder={inputPlaceholder}
                          disabled={isTyping}
                          className="flex-1 bg-transparent text-xs text-white outline-none disabled:opacity-40 min-w-0"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!input.trim() || isTyping}
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                          style={{ background: T.gradPrimary, boxShadow: input.trim() ? '0 0 14px rgba(37,99,235,0.4)' : 'none' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="#fff" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Voice Call Interface */
                <div className="flex-1 flex flex-col items-center justify-between p-5 min-h-0 relative">
                  <Particles />

                  {/* Status Indicator */}
                  <div className="relative z-10" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 99,
                    background: callMode === 'active' ? 'rgba(16,185,129,0.08)' : callMode === 'connecting' ? 'rgba(52,211,153,0.08)' : 'rgba(37,99,235,0.06)',
                    border: `1px solid ${callMode === 'active' ? 'rgba(16,185,129,0.20)' : callMode === 'connecting' ? 'rgba(52,211,153,0.20)' : 'rgba(37,99,235,0.14)'}`,
                    transition: 'all .3s',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: callMode === 'active' ? T.secondary : callMode === 'connecting' ? T.accent : T.primary,
                      animation: callMode !== 'idle' ? 'livePulse 2s ease infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                      color: callMode === 'active' ? T.secondary : callMode === 'connecting' ? T.accent : T.textMuted,
                      letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
                    }}>
                      {callMode === 'idle' && 'Ready to call'}
                      {callMode === 'connecting' && 'Connecting'}
                      {callMode === 'active' && 'Live'}
                      {callMode === 'ended' && 'Call ended'}
                      {callMode === 'error' && 'Error'}
                    </span>
                  </div>

                  {/* Voice Orb Area */}
                  <div className="my-2 flex flex-col items-center relative z-10">
                    <VoiceOrb speaking={speaking} />
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 14, marginBottom: 4 }}>
                      {callMode === 'idle' && 'Talk to Ava'}
                      {callMode === 'connecting' && 'Connecting...'}
                      {callMode === 'active' && (speaking === 'agent' ? 'Ava is speaking' : speaking === 'user' ? 'Listening...' : 'In live call')}
                      {callMode === 'ended' && 'Call Complete'}
                      {callMode === 'error' && 'Connection Failed'}
                    </h4>
                    {callMode === 'idle' && (
                      <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', margin: 0, maxWidth: 220, lineHeight: 1.5 }}>
                        Have a real conversation with our AI voice agent. Max duration is 2 mins.
                      </p>
                    )}
                    {callMode === 'active' && callSeconds > 0 && (
                      <div className="mt-1.5" style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: 99,
                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)',
                      }}>
                        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.secondary, fontWeight: 600 }}>
                          {formatTime(callSeconds)}
                        </span>
                      </div>
                    )}
                    {callErrorMsg && (
                      <p style={{ fontSize: 10, color: T.danger, margin: '6px 0 0', textAlign: 'center' }}>{callErrorMsg}</p>
                    )}
                  </div>

                  {/* Waveform / Connection indicators */}
                  <div className="w-full shrink-0 flex flex-col items-center gap-2 relative z-10">
                    {(callMode === 'active' || callMode === 'connecting') && (
                      <Waveform active={speaking !== 'idle'} />
                    )}
                    {callMode === 'connecting' && <ConnectingDots />}
                  </div>

                  {/* Action buttons or stats */}
                  <div className="w-full shrink-0 flex flex-col gap-3 items-center relative z-10">
                    {callMode === 'ended' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { icon: '📞', label: 'Duration', value: formatTime(callSeconds) },
                            { icon: '🤖', label: 'Agent', value: 'AI Voice' },
                            { icon: '✨', label: 'Quality', value: 'Natural' },
                          ].map((stat, i) => (
                            <div key={i} style={{
                              flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: 12,
                              background: 'rgba(59,130,246,0.05)', border: `1px solid ${T.border}`,
                            }}>
                              <div style={{ fontSize: 14, marginBottom: 2 }}>{stat.icon}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.secondary }}>{stat.value}</div>
                              <div style={{ fontSize: 8, color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => window.location.href = '/'}
                          style={{
                            width: '100%', padding: '11px 16px', borderRadius: 12, cursor: 'pointer',
                            border: 'none', background: T.gradAccent,
                            color: '#fff', fontSize: 12, fontWeight: 700,
                            transition: 'all .2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            boxShadow: '0 4px 18px rgba(139,92,246,0.3)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                        >
                          Create Your Own Agent
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div style={{ width: '100%', display: 'flex', gap: 8 }}>
                      {callMode === 'idle' || callMode === 'ended' || callMode === 'error' ? (
                        <button
                          onClick={startCall}
                          style={{
                            width: '100%', padding: '12px 20px', borderRadius: 14,
                            border: 'none', cursor: 'pointer',
                            background: T.gradPrimary,
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 20px rgba(59,130,246,.32)',
                            transition: 'all .2s cubic-bezier(.16,1,.3,1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1.5px)';
                            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,.10) inset, 0 8px 24px rgba(59,130,246,.42)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 20px rgba(59,130,246,.32)';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="2" width="6" height="12" rx="3" />
                            <path d="M5 10a7 7 0 0014 0" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <line x1="9" y1="22" x2="15" y2="22" />
                          </svg>
                          Start Live Call
                        </button>
                      ) : (
                        <button
                          onClick={stopCall}
                          style={{
                            width: '100%', padding: '12px 20px', borderRadius: 14, cursor: 'pointer',
                            border: `1px solid rgba(255,95,87,0.28)`,
                            background: 'rgba(255,95,87,0.08)',
                            color: T.danger, fontSize: 13, fontWeight: 700,
                            transition: 'all .2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,95,87,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(255,95,87,0.45)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,95,87,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,95,87,0.28)';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.68 13.31a16 16 0 000 1.79l-1.42-1.42a14 14 0 010-1.79z" />
                            <path d="M13.36 10.06a16 16 0 000-1.79l1.42 1.42a14 14 0 010 1.79z" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                          End Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ delay: 1.2, duration: 0.4, ease: 'easeOut' }}
          className="absolute -top-14 right-0 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap shadow-lg z-50"
          style={{
            background: 'rgba(8,13,28,0.92)',
            border: `1px solid ${T.border}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: T.gradPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(59,130,246,0.5)',
          }}>
            <span style={{ fontSize: 10 }}>✨</span>
          </div>
          <span className="text-xs font-medium" style={{ color: T.textSoft }}>
            Hi, I'm <span className="font-bold" style={{ color: T.secondary }}>Ava</span> 👋
          </span>
          <div
            className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45"
            style={{ background: 'rgba(8,13,28,0.92)', borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}
          />
        </motion.div>
      )}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        animate={{ y: isOpen ? 0 : [0, -8, 0] }}
        transition={{ y: { duration: 3, repeat: isOpen ? 0 : Infinity, ease: 'easeInOut' } }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        style={{
          background: T.gradPrimary,
          boxShadow: '0 6px 28px rgba(59,130,246,0.4)',
        }}
      >
        {/* rotating halo ring */}
        <span style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${T.primary}, ${T.secondary}, ${T.accent}, ${T.primary})`,
          opacity: 0.5, animation: 'spinSlow 6s linear infinite',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
        }} />
        <motion.span
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}
        />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
              className="w-6 h-6 relative z-10" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="w-6 h-6 relative z-10" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
        {!isOpen && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2" style={{ borderColor: T.accent }} />}
      </motion.button>

      {/* Local keyframe styles self-contained inside the widget */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes connectBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes waveBar {
          from { transform: scaleY(0.3); opacity: 0.4; }
          to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(0,229,255,0.35); }
          70% { box-shadow: 0 0 0 9px rgba(0,229,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          15% { opacity: 0.4; }
          85% { opacity: 0.25; }
          100% { transform: translateY(-140px) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}