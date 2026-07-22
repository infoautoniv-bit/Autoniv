import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publicLeadService } from '../services/api';

const T = {
  cyan: '#2563EB',
  cyanDim: 'rgba(37,99,235,0.12)',
  slate: 'var(--slate-light)',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(37,99,235,0.10)',
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
  plans: [
    { name: 'Free', price: 0, calls: 100, features: ['1 chatbot', '100 conversations/month', 'Website embed', 'Basic FAQ & lead capture'] },
    { name: 'Starter', price: 1499, calls: 1500, features: ['2 chatbots', '1,500 conversations/month', 'Website + WhatsApp', 'Branding removed', 'Email support'] },
    { name: 'Growth', price: 4999, calls: 6000, features: ['Unlimited chatbots', '6,000 conversations/month', 'All channels incl. WhatsApp & Instagram', 'CRM & helpdesk integrations'], badge: 'Most Popular' },
    { name: 'Enterprise', price: 0, calls: 99999, features: ['Unlimited chatbots', 'Unlimited conversations', 'Custom AI model training', 'SOC 2 / HIPAA-ready'] },
  ],
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Helper: detect if user is asking a question mid-form              */
/* ─────────────────────────────────────────────────────────────────── */

function isOffTopicQuestion(input: string): boolean {
  const q = input.toLowerCase().trim();
  return (
    /feature|pric|plan|cost|free|starter|growth|enterprise|agent|receptionist|appointment|faq|demo|integrat|use case|healthcare|real estate|finance|ecommerce|language|voice|analytic|security|what|how|tell me|show|compare|help|who are you|commands/.test(q)
  );
}

function getReprompt(step: LeadStep): string {
  switch (step) {
    case 'ask_name':    return "Now, back to your details — **what's your name?**";
    case 'ask_phone':   return "Back to your details — **what's your phone number?**";
    case 'ask_email':   return "Back to your details — **what's your email address?**";
    case 'ask_purpose': return "Almost there — **what are you looking for?**\n\n- Book a demo\n- Pricing inquiry\n- General question\n- Other";
    default:            return '';
  }
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Markdown Renderer                                                  */
/* ─────────────────────────────────────────────────────────────────── */

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: T.cyan, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
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
                  <th key={ci} style={{ padding: '5px 8px', textAlign: 'left', color: T.cyan, borderBottom: '1px solid rgba(0,119,255,0.2)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1).map((cell, ci) => (
                    <td key={ci} style={{ padding: '5px 8px', color: 'rgba(226,232,240,0.85)', fontSize: 11 }}>
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
            <li key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3, color: 'rgba(226,232,240,0.85)', fontSize: 11, lineHeight: 1.5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.cyan, flexShrink: 0, marginTop: 5, opacity: 0.7 }} />
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
            <li key={ni} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 4, fontSize: 11, lineHeight: 1.5, color: 'rgba(226,232,240,0.85)' }}>
              <span style={{ minWidth: 18, height: 18, borderRadius: 4, background: 'rgba(0,119,255,0.18)', color: T.cyan, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
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
      <p key={`p-${i}`} style={{ margin: '0 0 3px', fontSize: 11.5, lineHeight: 1.6, color: 'rgba(226,232,240,0.9)' }}>
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
    return { text: "Hello! I'm the **Autoniv AI Assistant**. I can help you with:\n\n- **Features** — AI voice agents, analytics, integrations\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Agents** — Receptionist, Appointment, FAQ types\n\nHow can I assist you?" };
  }

  if (/who are you|what are you|what can you do/.test(q)) {
    return { text: `I'm the **${KB.platform.name} AI Assistant** — built into the platform.\n\nI know everything about:\n\n- Features, pricing plans, and add-ons\n- Agent types (Receptionist, Appointment, FAQ)\n- Integrations and use cases\n\nAsk me anything!` };
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
      return { text: "**Plan Comparison**\n\n| Plan | Price | Conversations |\n|------|-------|-------|\n| Free | ₹0 | 100 |\n| Starter | ₹1,499/mo | 1,500 |\n| Growth ⭐ | ₹4,999/mo | 6,000 |\n| Enterprise | Custom | Unlimited |\n\nInterested? Share your details and our team will help you choose the best plan!", triggerLead: true };
    }
    const plans = KB.plans.map(p => p.name === 'Enterprise' ? `**${p.name}** — Custom\n${p.features.slice(0, 2).map(f => `- ${f}`).join('\n')}` : `**${p.name}** — ₹${p.price.toLocaleString()}/mo\n${p.features.slice(0, 2).map(f => `- ${f}`).join('\n')}`).join('\n\n');
    return { text: `**Autoniv Pricing**\n\n${plans}\n\nWant to get started? Share your details and we'll set you up!`, triggerLead: true };
  }

  if (/\bfree\b/.test(q) && /plan|pric/.test(q)) return { text: "**Free Plan** — ₹0 forever\n\n- 100 conversations/month\n- 1 chatbot\n- Website embed\n- Basic FAQ & lead capture\n\nWant to try it? Share your details!", triggerLead: true };
  if (/\bstarter\b/.test(q)) return { text: "**Starter Plan** — ₹1,499/mo\n\n- 1,500 conversations/month\n- 2 chatbots\n- WhatsApp + website\n- Branding removed\n\nReady to start? Share your details!", triggerLead: true };
  if (/\bgrowth\b/.test(q)) return { text: "**Growth Plan** ⭐ — ₹4,999/mo\n\n- 6,000 conversations/month\n- Unlimited chatbots\n- All channels incl. WhatsApp & Instagram\n- CRM & helpdesk integrations\n\nMost popular! Share your details to get started!", triggerLead: true };
  if (/\benterprise\b/.test(q)) return { text: "**Enterprise Plan** — Custom pricing\n\n- Unlimited chatbots\n- Unlimited conversations\n- Custom AI model training\n- SOC 2 / HIPAA-ready\n\nEnterprise ready? Share your details!", triggerLead: true };

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

/* ─────────────────────────────────────────────────────────────────── */
/*  Component                                                          */
/* ─────────────────────────────────────────────────────────────────── */

export default function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm the **Autoniv AI Assistant**. I can help you with:\n\n- **Features** — AI voice agents, analytics\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Book a Demo** — Get a personalized walkthrough\n\nHow can I assist you?`,
      timestamp: 0,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [leadStep, setLeadStep] = useState<LeadStep>('idle');
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({ name: '', phone: '', email: '', purpose: '' });
  const [leadError, setLeadError] = useState('');

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm the **Autoniv AI Assistant**. I can help you with:\n\n- **Features** — AI voice agents, analytics\n- **Pricing** — Plans starting at ₹4,999/mo\n- **Book a Demo** — Get a personalized walkthrough\n\nHow can I assist you?`,
      timestamp: 0,
    }]);
    setLeadStep('idle');
    setLeadInfo({ name: '', phone: '', email: '', purpose: '' });
    setLeadError('');
  }, []);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

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
        // Answer the question without triggering a new lead flow
        addMessage('assistant', result.text);

        // Re-prompt the step they were on after a short pause
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
    leadStep === 'ask_name'    ? 'Enter your name...' :
    leadStep === 'ask_phone'   ? 'Enter your phone number...' :
    leadStep === 'ask_email'   ? 'Enter your email...' :
    leadStep === 'ask_purpose' ? 'What are you looking for...' :
    'Ask about Autoniv, agents, pricing...';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-20 right-0 w-[360px] rounded-2xl border overflow-hidden shadow-2xl"
            style={{ background: '#080d17', borderColor: T.border, boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${T.border}` }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: T.border }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,119,255,0.15)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white">AI Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                  <span className="text-[10px]" style={{ color: T.slate }}>online</span>
                </div>
              </div>
              <button onClick={clearChat}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
                style={{ color: T.slate }} title="Clear chat">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface)]"
                style={{ color: T.slate }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {['Features', 'Pricing', 'Book a Demo', 'Contact'].map(chip => (
                <button key={chip} onClick={() => {
                  setInput(
                    chip === 'Features'    ? 'What features does Autoniv offer?' :
                    chip === 'Pricing'     ? 'Show me pricing plans' :
                    chip === 'Book a Demo' ? 'I want to book a demo' :
                    'Contact sales'
                  );
                }}
                  className="px-2.5 py-1 text-[10px] font-medium rounded-full border transition-all hover:border-[var(--border)]"
                  style={{ background: T.surface, borderColor: T.border, color: T.slate }}>
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'rgba(0,119,255,0.15)' }}>
                      <svg className="w-3 h-3" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div className="max-w-[82%]">
                    <div
                      className="px-3 py-2.5 rounded-xl text-xs"
                      style={msg.role === 'user'
                        ? { background: 'rgba(0,119,255,0.15)', border: '1px solid rgba(0,119,255,0.25)', color: '#e2e8f0', fontSize: 11.5, lineHeight: 1.6 }
                        : { background: T.surface, border: `1px solid ${T.border}`, color: 'rgba(226,232,240,0.88)' }
                      }
                    >
                      {msg.role === 'user'
                        ? <span style={{ fontSize: 11.5, lineHeight: 1.6 }}>{msg.content}</span>
                        : renderMarkdown(msg.content)
                      }
                    </div>
                  </div>
                </div>
              ))}

              {leadError && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="#f87171" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 11.5, lineHeight: 1.5 }}>
                    {leadError}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,119,255,0.15)' }}>
                    <svg className="w-3 h-3" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl border flex items-center gap-1" style={{ background: T.surface, borderColor: T.border }}>
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.span key={i} className="w-1 h-1 rounded-full bg-[var(--surface)]0"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: T.border }}>
              {leadStep === 'submitting' ? (
                <div className="text-center text-xs py-2" style={{ color: T.slate }}>
                  <svg className="animate-spin w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Submitting your details...
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={inputPlaceholder}
                    disabled={isTyping}
                    className="flex-1 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all disabled:opacity-40"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,119,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                    style={{ background: T.cyanDim, border: `1px solid rgba(0,119,255,0.3)` }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: T.cyanDim, border: `1px solid rgba(0,119,255,0.4)`, boxShadow: `0 0 28px rgba(0,119,255,0.25)` }}>
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                className="w-5 h-5" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </motion.svg>
            : <motion.svg key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="w-5 h-5" fill="none" stroke={T.cyan} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </motion.svg>
          }
        </AnimatePresence>
        {!isOpen && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--primary)] border-2 border-[#060a12]" />}
      </motion.button>
    </div>
  );
}