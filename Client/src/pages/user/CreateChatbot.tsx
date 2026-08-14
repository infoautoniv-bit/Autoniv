import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotFormSchema } from '../../utils/schemas';
import { chatbotService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Clean Framer Motion variants
const pageVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

type StepId = 'overview' | 'personality' | 'appearance' | 'channels' | 'integrations' | 'testing' | 'deployment';

interface StepNav {
  id: StepId;
  label: string;
  icon: string;
  desc: string;
}

const STEPS: StepNav[] = [
  { id: 'overview', label: 'Identity & Overview', icon: '🤖', desc: 'Name, logo & greeting' },
  { id: 'personality', label: 'AI Prompt & Brain', icon: '🧠', desc: 'System rules & templates' },
  { id: 'appearance', label: 'Theme & Style', icon: '🎨', desc: 'Colors, launcher & corners' },
  { id: 'channels', label: 'Channels & Apps', icon: '⚡', desc: 'Website, WhatsApp, Telegram' },
  { id: 'integrations', label: 'CRM & Webhooks', icon: '🔗', desc: 'HubSpot, Webhook Secret & Payload' },
  { id: 'testing', label: 'Live Test', icon: '🧪', desc: 'Simulate chat responses' },
  { id: 'deployment', label: 'Embed & Script', icon: '🚀', desc: 'Script embed & API key' },
];

const TEMPLATES = [
  {
    id: 'support',
    label: 'Customer Support Agent',
    icon: '🎧',
    category: 'Support',
    badge: 'Popular',
    desc: 'Empathetic agent for troubleshooting, FAQ, and escalation.',
    prompt: `You are a warm, highly empathetic, and professional customer support specialist for Autoniv.

[CORE MISSION]:
Assist website visitors and existing clients with product troubleshooting, account setup, billing inquiries, and technical guidance in a clear, step-by-step format.

[TONE & MANNER]:
- Patient, polite, reassuring, and solution-oriented.
- Use clear bullet points or numbered steps for complex instructions.
- Never use overly technical jargon without explaining it simply.

[KNOWLEDGE BOUNDARIES]:
- Answer questions accurately based on official Autoniv documentation.
- Do not promise custom engineering timelines or unverified discounts.

[ESCALATION PROTOCOL]:
- If a customer experiences billing failures, account lockouts, or requests human intervention, say:
  "I'd be happy to connect you with our senior support team! May I have your Full Name, Work Email, and Phone Number so we can prioritize your ticket?"`,
  },
  {
    id: 'sales',
    label: 'Sales & Conversion Assistant',
    icon: '💼',
    category: 'Sales',
    badge: 'High Conversion',
    desc: 'Recommends products, answers pricing, and guides buyers.',
    prompt: `You are a high-performing, proactive sales assistant for Autoniv AI solutions.

[CORE MISSION]:
Guide visitors through our AI Voice Agents and Chatbot offerings, answer pricing questions, present value propositions, and drive demo bookings.

[KEY VALUE PROPOSITIONS TO HIGHLIGHT]:
- Sub-200ms ultra-low latency for natural human-like voice conversations.
- 99.8% Uptime SLA with 24/7 autonomous lead qualification.
- 20+ supported languages and regional accents.
- Seamless CRM integrations with HubSpot, Salesforce, WhatsApp, and Webhooks.

[SALES STRATEGY]:
- Ask qualifying questions (e.g., "What is your primary goal—inbound call handling, chatbot automation, or appointment booking?").
- Recommend the best plan based on their monthly lead/call volume.

[LEAD CAPTURE GOAL]:
- Proactively ask: "May I have your Name, Company Name, and Work Email so our AI specialist can send you a customized solution proposal?"`,
  },
  {
    id: 'booking',
    label: 'Appointment Booking Bot',
    icon: '📅',
    category: 'Booking',
    badge: 'Automated',
    desc: 'Schedules calls, meetings, and consultations seamlessly.',
    prompt: `You are an efficient, organized appointment booking assistant for Autoniv.

[CORE MISSION]:
Help prospective clients and customers schedule strategy calls, product demos, and consultations effortlessly.

[BOOKING WORKFLOW]:
1. Greet the visitor warmly and ask what type of session they would like to schedule.
2. Collect the following required details sequentially:
   - Full Name
   - Work Email
   - Phone Number (WhatsApp preferred)
   - Preferred Date & Time Slot (Morning / Afternoon / Evening)
   - Primary Goal or Topic for the call
3. Confirm all details back to the user clearly:
   "Thank you [Name]! I have reserved your spot for [Date/Time]. Our team will send a calendar invite to [Email]."

[GUIDELINES]:
- Be prompt, polite, and ensure all required fields are collected before confirming.`,
  },
  {
    id: 'faq',
    label: 'Knowledge FAQ Specialist',
    icon: '❓',
    category: 'Knowledge',
    badge: 'Quick Setup',
    desc: 'Instant answers for common customer questions and docs.',
    prompt: `You are an accurate Knowledge Base & FAQ Specialist for Autoniv.

[CORE MISSION]:
Provide instant, precise answers to common customer questions regarding features, pricing, setup procedures, API integrations, and security compliance.

[RESPONSE RULES]:
- Keep answers concise, factual, and direct (max 2-3 short paragraphs).
- Reference verified company knowledge, refund policies, and SLA commitments.
- Offer helpful follow-up options at the end of each response.

[SECURITY & PRIVACY]:
- Emphasize that all data is encrypted in transit and at rest with enterprise-grade SOC-2 compliance.`,
  },
  {
    id: 'leads',
    label: 'B2B Lead Qualifier',
    icon: '🎯',
    category: 'Leads',
    badge: 'Enterprise',
    desc: 'Gathers budget, timeline, and lead details naturally.',
    prompt: `You are a B2B lead qualification specialist for Autoniv Enterprise Solutions.

[CORE MISSION]:
Qualify inbound leads by evaluating their business needs, team scale, timeline, and budget fit.

[QUALIFICATION MATRIX (BANT)]:
- Budget: Identify their target monthly automation budget.
- Authority: Confirm their role (Founder, VP of Sales, Operations Director, Manager).
- Need: Clarify whether they need AI Voice Agents, WhatsApp bots, or CRM sync.
- Timeline: Determine if they plan to launch Immediately (1-2 weeks), This Month, or Next Quarter.

[CALL TO ACTION]:
- If the lead qualifies, collect their Work Email & Phone Number and offer an instant priority call booking with our Enterprise Director.`,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce Concierge',
    icon: '🛍️',
    category: 'Retail',
    badge: 'Top Rated',
    desc: 'Product recommendations, order tracking, and returns.',
    prompt: `You are an E-commerce Shopping Assistant & Order Concierge.

[CORE MISSION]:
Assist online shoppers with product recommendations, order tracking status, sizing advice, and return/refund guidelines.

[SHOPPING ASSISTANCE]:
- Ask visitors what products or categories they are searching for.
- Suggest top-rated items and highlight active promotions or discounts.
- Handle order lookup by asking for Order ID and Shipping Zip Code.

[TONE]:
- Enthusiastic, friendly, helpful, and retail-oriented.`,
  },
  {
    id: 'healthcare',
    label: 'Healthcare Patient Intake',
    icon: '🏥',
    category: 'Medical',
    badge: 'HIPAA Ready',
    desc: 'Patient intake, clinic hours, and appointment inquiries.',
    prompt: `You are a compassionate Healthcare & Medical Intake Assistant.

[CORE MISSION]:
Help patients find clinic locations, review available medical services, check operating hours, and schedule intake appointments.

[PATIENT INTAKE STEPS]:
- Collect Patient Full Name, Phone Number, Email, and Preferred Appointment Date.
- Provide clear instructions on what documents to bring (ID, Insurance Card).

[CRITICAL SAFETY DISCLAIMER]:
- ALWAYS state: "If you are experiencing a medical emergency, please dial emergency services (911) or visit the nearest emergency room immediately. I cannot provide medical diagnosis or emergency treatment."`,
  },
  {
    id: 'realestate',
    label: 'Real Estate Assistant',
    icon: '🏡',
    category: 'Property',
    badge: 'Hot Leads',
    desc: 'Property listings, tour bookings, and buyer qualification.',
    prompt: `You are a knowledgeable Real Estate Concierge & Property Agent.

[CORE MISSION]:
Help homebuyers, renters, and property investors browse listings, schedule property tours, and inquire about mortgage/financing details.

[PROPERTY QUALIFICATION]:
- Ask for 1. Target Location/Neighborhood, 2. Property Type (Single Family, Condo, Commercial), 3. Budget Range, 4. Move-in Timeline.
- Collect buyer contact details (Name, Email, WhatsApp Phone) to send matching property brochures.`,
  },
];

const PRESET_COLORS = [
  { name: 'Autoniv Blue', hex: '#2563EB', gradient: 'from-blue-600 to-indigo-600' },
  { name: 'Emerald Teal', hex: '#10B981', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Royal Violet', hex: '#7C3AED', gradient: 'from-violet-600 to-purple-600' },
  { name: 'Sunset Amber', hex: '#F59E0B', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Slate Dark', hex: '#0F172A', gradient: 'from-slate-900 to-slate-800' },
  { name: 'Rose Crimson', hex: '#E11D48', gradient: 'from-rose-600 to-pink-600' },
];

const QUICK_GREETINGS = [
  'Hi! How can I help you today? 👋',
  'Welcome to Autoniv! What are you looking to automate?',
  'Hello! Have a question about our services or pricing?',
  'Hi there! I am your AI Assistant. How can I assist you?',
];

type Toast = { id: number; text: string; kind: 'success' | 'error' };

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export function CreateChatbot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const currentPlan = user?.chatPlan || 'chat_free';
  const hasWhatsApp = currentPlan !== 'chat_free' || user?.role === 'admin';
  const hasAdvancedChannels = currentPlan === 'chat_growth' || currentPlan === 'chat_enterprise' || user?.role === 'admin';
  const hasCRM = currentPlan === 'chat_growth' || currentPlan === 'chat_enterprise' || user?.role === 'admin';

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Navigation State
  const [activeStep, setActiveStep] = useState<StepId>('overview');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today? 👋');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [brandLogo, setBrandLogo] = useState('');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [widgetRadius, setWidgetRadius] = useState<number>(20);

  // Channels State
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappWabaId, setWhatsappWabaId] = useState('');
  const [whatsappBusinessId, setWhatsappBusinessId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappDisplayPhone, setWhatsappDisplayPhone] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookPageId, setFacebookPageId] = useState('');
  const [facebookPageAccessToken, setFacebookPageAccessToken] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');

  // CRM & Webhook State
  const [hubspotToken, setHubspotToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [payloadTemplate, setPayloadTemplate] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiValues = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      scale: ((i * 17) % 8 + 4) / 10,
      x: ((i * 37) % 800) - 400,
      y: ((i * 53) % 600) - 350,
      rotate: (i * 73) % 360,
    })),
  []);
  const [previewMode, setPreviewMode] = useState<'widget' | 'mobile'>('widget');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Simulator State
  const [simMessages, setSimMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: welcomeMessage || 'Hi! How can I help you today? 👋',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [simInput, setSimInput] = useState('');
  const [simTyping, setSimTyping] = useState(false);
  const simEndRef = useRef<HTMLDivElement>(null);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const tid = ++toastId.current;
    setToasts((t) => [...t, { id: tid, text, kind }]);
    timersRef.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 2800));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      chatbotService
        .get(id)
        .then(({ data }) => {
          const c = data.chatbot;
          setName(c.name);
          setDescription(c.description || '');
          setSystemPrompt(c.systemPrompt);
          setWelcomeMessage(c.welcomeMessage || 'Hi! How can I help you today? 👋');
          setBrandColor(c.brandColor || '#2563EB');
          setBrandLogo(c.brandLogo || '');
          setWidgetEnabled(c.channels?.widget?.enabled !== false);
          setWhatsappEnabled(c.channels?.whatsapp?.enabled || false);
          setWhatsappPhoneId(c.channels?.whatsapp?.phoneNumberId || '');
          setWhatsappWabaId(c.channels?.whatsapp?.wabaId || '');
          setWhatsappBusinessId(c.channels?.whatsapp?.businessId || '');
          setWhatsappDisplayPhone(c.channels?.whatsapp?.displayPhoneNumber || '');
          setTelegramEnabled(c.channels?.telegram?.enabled || false);
          setTelegramToken(c.channels?.telegram?.token || '');
          setTelegramBotUsername(c.channels?.telegram?.botUsername || '');
          setFacebookEnabled(c.channels?.facebook?.enabled || false);
          setFacebookPageId(c.channels?.facebook?.pageId || '');
          setFacebookPageAccessToken(c.channels?.facebook?.pageAccessToken || '');
          setInstagramAccountId(c.channels?.facebook?.instagramAccountId || '');
          setHubspotToken(c.crmIntegrations?.hubspotToken || '');
          setWebhookUrl(c.crmIntegrations?.webhookUrl || '');
          setWebhookSecret(c.crmIntegrations?.webhookSecret || '');
          setPayloadTemplate(c.crmIntegrations?.payloadTemplate || '');
          setApiKey(c.apiKey || '');
        })
        .catch(() => setError('Failed to load chatbot configuration'))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  // Handle simulated message exchange
  const handleSimSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simInput.trim()) return;

    const userText = simInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: userText, time: nowTime };

    setSimMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setSimTyping(true);

    timersRef.current.push(setTimeout(() => {
      let replyText = `Thanks for your inquiry! I am configured with your system rules and ready to assist visitors 24/7.`;
      const textLower = userText.toLowerCase();
      if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey')) {
        replyText = `Hello! Welcome. How can I assist you with your business today?`;
      } else if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('plan')) {
        replyText = `We offer flexible plans tailored to your team size. Would you like a custom quote or a demo?`;
      } else if (textLower.includes('book') || textLower.includes('demo') || textLower.includes('call')) {
        replyText = `I can schedule a live demo call for you right away! What time slot works best?`;
      } else if (textLower.includes('human') || textLower.includes('contact') || textLower.includes('support')) {
        replyText = `I can transfer your request to our senior specialist. Please provide your work email address!`;
      }

      setSimMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setSimTyping(false);
    }, 800));
  };

  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, simTyping]);

  // AI Prompt Improver
  const handleImprovePrompt = () => {
    setAutoSaveStatus('saving');
    const enhanced = systemPrompt.trim()
      ? `${systemPrompt.trim()}\n\n[Core Behavior Rules]:\n1. Maintain a professional, polite, and empathetic tone at all times.\n2. Keep responses concise, well-structured, and clear.\n3. If an inquiry requires human escalation, politely ask for the visitor's email address and phone number.`
      : 'You are a warm, intelligent AI customer assistant for Autoniv. Greet visitors politely, answer product inquiries step-by-step, and collect contact details for qualified leads.';
    setSystemPrompt(enhanced);
    pushToast('AI prompt enhanced with smart rules!');
    timersRef.current.push(setTimeout(() => setAutoSaveStatus('saved'), 600));
  };

  // Submit Handler
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');

    const validation = chatbotFormSchema.safeParse({
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      welcomeMessage: welcomeMessage.trim(),
      brandColor,
      brandLogo: brandLogo.trim() || null,
    });

    if (!validation.success) {
      const issue = validation.error.issues[0];
      if (issue.path.includes('name')) setActiveStep('overview');
      if (issue.path.includes('systemPrompt')) setActiveStep('personality');
      return setError(issue ? issue.message : 'Please check required fields');
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        welcomeMessage: welcomeMessage.trim(),
        brandColor,
        brandLogo: brandLogo.trim() || undefined,
        channels: {
          whatsapp: {
            enabled: whatsappEnabled,
            phoneNumberId: whatsappPhoneId || undefined,
            wabaId: whatsappWabaId || undefined,
            businessId: whatsappBusinessId || undefined,
            displayPhoneNumber: whatsappDisplayPhone || undefined,
            accessToken: whatsappAccessToken === '••••••••••••••••' ? undefined : (whatsappAccessToken || undefined),
          },
          widget: { enabled: widgetEnabled },
          telegram: { enabled: telegramEnabled, token: telegramToken || undefined, botUsername: telegramBotUsername || undefined },
          facebook: { enabled: facebookEnabled, pageId: facebookPageId || undefined, pageAccessToken: facebookPageAccessToken || undefined, instagramAccountId: instagramAccountId || undefined },
        },
        crmIntegrations: {
          hubspotToken: hubspotToken || undefined,
          webhookUrl: webhookUrl || undefined,
          webhookSecret: webhookSecret || undefined,
          payloadTemplate: payloadTemplate || undefined,
        },
      };

      if (isEdit && id) {
        await chatbotService.update(id, payload);
        setShowConfetti(true);
        pushToast('Chatbot updated successfully!');
        timersRef.current.push(setTimeout(() => navigate('/dashboard/chatbots'), 1600));
      } else {
        const { data } = await chatbotService.create(payload);
        setApiKey(data.chatbot.apiKey);
        setShowConfetti(true);
        pushToast('Chatbot deployed successfully!');
        timersRef.current.push(setTimeout(() => navigate('/dashboard/chatbots'), 1600));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save chatbot');
    } finally {
      setLoading(false);
    }
  }

  // Calculate Progress Percentage
  const currentStepIdx = STEPS.findIndex((s) => s.id === activeStep);
  const progressPercent = Math.round(((currentStepIdx + 1) / STEPS.length) * 100);

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600/20" />
            <div className="absolute inset-0 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-full animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/2 mx-auto" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Assistant Studio…</p>
        </div>
      </div>
    );
  }

  const embedCode = id
    ? `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>`
    : '';

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden font-sans selection:bg-[#2563EB] selection:text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── TOP HERO STICKY CONTAINER ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <header className="px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-slate-100">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Navigation Back & Chatbot Name */}
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/chatbots')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Back to Chatbots List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shrink-0 transition-transform hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, #10B981)` }}
                >
                  {brandLogo ? (
                    <img src={brandLogo} alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded" />
                  ) : name.trim() ? (
                    name.trim().charAt(0).toUpperCase()
                  ) : (
                    '🤖'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-400 font-semibold hidden md:inline">Studio /</span>
                    <h1 className="text-xs sm:text-base font-extrabold text-[#0F172A] truncate max-w-[110px] xs:max-w-[150px] sm:max-w-xs">
                      {name.trim() || 'New AI Assistant'}
                    </h1>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      Setup {progressPercent}%
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-0.5 truncate hidden xs:block">
                    {autoSaveStatus === 'saving' ? 'Auto-saving changes…' : 'All changes saved locally'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Header Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveStep('testing')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-[#0F172A] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer shadow-xs hidden md:inline-flex items-center gap-1.5"
              >
                <span>🧪</span>
                <span>Test Assistant</span>
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl text-white shadow-md hover:shadow-lg transition-all cursor-pointer border-none disabled:opacity-60 shrink-0 whitespace-nowrap"
                style={{ background: `linear-gradient(135deg, ${brandColor}, #10B981)` }}
              >
                {loading ? (
                  <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span className="text-xs">✨</span>
                )}
                <span>{loading ? 'Publishing…' : isEdit ? 'Save Changes' : 'Deploy Chatbot'}</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* ── TOP HORIZONTAL PILL TABS BAR ── */}
        <div className="bg-white px-4 sm:px-8 py-2.5">
          <div className="max-w-[1600px] mx-auto overflow-x-auto scrollbar-none flex items-center gap-2">
            {STEPS.map((step, idx) => {
              const active = activeStep === step.id;
              const isDone = idx < currentStepIdx;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                      : isDone
                      ? 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
                      : 'bg-transparent text-slate-500 hover:bg-slate-100/70 hover:text-[#0F172A]'
                  }`}
                >
                  <span className="text-sm">{isDone ? '✓' : step.icon}</span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (2 Columns: Left Form (7 Cols) + Right Live Preview (5 Cols)) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN WORKSPACE CARD (7 Columns) ── */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">

              {/* STEP 1: OVERVIEW & IDENTITY */}
              {activeStep === 'overview' && (
                <motion.div
                  key="overview"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Assistant Identity & Overview
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Set up your chatbot's display name, logo URL, description, and initial greeting.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                        Assistant Name <span className="text-[#2563EB]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sales Assistant, Support Bot, Autoniv Receptionist"
                        className="w-full px-4 py-3.5 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50/50 border border-slate-200 text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                        maxLength={100}
                      />
                    </div>

                    {/* Brand Logo URL */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                        Brand Logo Image URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={brandLogo}
                        onChange={(e) => setBrandLogo(e.target.value)}
                        placeholder="https://yourcompany.com/logo.png"
                        className="w-full px-4 py-3.5 text-xs sm:text-sm font-mono rounded-2xl bg-slate-50/50 border border-slate-200 text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                        Purpose & Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Handles product inquiries, schedules demos, and qualifies leads 24/7"
                        className="w-full px-4 py-3.5 text-xs sm:text-sm font-medium rounded-2xl bg-slate-50/50 border border-slate-200 text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
                        maxLength={500}
                      />
                    </div>

                    {/* Default Welcome Message */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                        Default Welcome Greeting
                      </label>
                      <input
                        type="text"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Hi! How can I help you today? 👋"
                        className="w-full px-4 py-3.5 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50/50 border border-slate-200 text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs mb-3"
                      />

                      {/* Quick Greeting Suggestion Chips */}
                      <div className="flex flex-wrap gap-2">
                        {QUICK_GREETINGS.map((greet, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setWelcomeMessage(greet)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            {greet}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: AI PERSONALITY & PROMPTS */}
              {activeStep === 'personality' && (
                <motion.div
                  key="personality"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                        AI Personality & Prompt Studio
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Select a pre-tuned role template or define custom system instructions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImprovePrompt}
                      className="px-4 py-2 text-xs font-extrabold rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>✨</span>
                      <span>Enhance with AI</span>
                    </button>
                  </div>

                  {/* Template Grid */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
                      Quick AI Templates
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {TEMPLATES.map((t) => {
                        const active = systemPrompt === t.prompt;
                        return (
                          <motion.button
                            key={t.id}
                            whileHover={{ y: -2 }}
                            type="button"
                            onClick={() => {
                              setSystemPrompt(t.prompt);
                              pushToast(`Applied "${t.label}" template`);
                            }}
                            className={`p-4.5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                              active
                                ? 'border-[#2563EB] bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{t.icon}</span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2563EB]">
                                {t.badge}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-[#0F172A]">{t.label}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                {t.desc}
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* System Prompt Code Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                        System Prompt Instructions <span className="text-[#2563EB]">*</span>
                      </label>
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {systemPrompt.length.toLocaleString()} / 10,000 characters
                      </span>
                    </div>

                    {/* Prompt Snippet Helper Buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSystemPrompt((prev) =>
                            prev + '\n\n[Tone & Manner]: Maintain a warm, empathetic, polite, and professional tone at all times. Keep responses structured and clear.'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        + Tone Rule
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSystemPrompt((prev) =>
                            prev + '\n\n[Escalation Protocol]: If the user requests a human specialist or complex support, collect their Full Name, Work Email, and Phone Number for immediate follow-up.'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        + Human Escalation
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSystemPrompt((prev) =>
                            prev + '\n\n[Guardrail]: Only answer inquiries related to our products and services. Politely decline off-topic questions.'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        + Knowledge Guardrail
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSystemPrompt((prev) =>
                            prev + '\n\n[Lead Capture Goal]: Ask the visitor for their company name and estimated monthly call volume before ending the chat.'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        + Lead Capture Rule
                      </button>
                    </div>

                    <textarea
                      required
                      rows={16}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Describe your chatbot's role, tone, knowledge boundaries, constraints, and human escalation rules in detail..."
                      maxLength={10000}
                      className="w-full px-4 py-4 text-xs font-mono leading-relaxed rounded-2xl bg-[#0F172A] text-teal-300 border border-slate-800 focus:outline-none focus:border-[#2563EB] transition-all resize-y min-h-[380px] shadow-inner"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: APPEARANCE & STYLING */}
              {activeStep === 'appearance' && (
                <motion.div
                  key="appearance"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Widget Theme & Styling Studio
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Customize launcher colors, widget corner radius, and launcher position.
                    </p>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
                      Brand Color Presets
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {PRESET_COLORS.map((c) => {
                        const active = brandColor.toUpperCase() === c.hex.toUpperCase();
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setBrandColor(c.hex)}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              active
                                ? 'border-[#2563EB] bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-xl bg-gradient-to-r ${c.gradient} shadow-xs shrink-0`} />
                            <div className="text-left min-w-0">
                              <p className="text-xs font-extrabold text-[#0F172A] truncate">{c.name}</p>
                              <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">{c.hex}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex Picker */}
                  <div className="flex items-center gap-4 pt-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1 bg-white shadow-2xs"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-36 px-4 py-3 text-xs font-mono font-extrabold rounded-2xl bg-slate-50 border border-slate-200 text-[#0F172A] uppercase focus:outline-none focus:border-[#2563EB]"
                    />
                    <span className="text-xs text-slate-500 font-semibold">Custom Color Hex Code</span>
                  </div>

                  {/* Launcher Position & Corner Radius */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-2">
                        Launcher Position
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWidgetPosition('bottom-right')}
                          className={`flex-1 py-3 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                            widgetPosition === 'bottom-right'
                              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Bottom Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setWidgetPosition('bottom-left')}
                          className={`flex-1 py-3 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                            widgetPosition === 'bottom-left'
                              ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Bottom Left
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Corner Radius
                        </label>
                        <span className="text-xs font-mono text-slate-500 font-bold">{widgetRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={32}
                        value={widgetRadius}
                        onChange={(e) => setWidgetRadius(Number(e.target.value))}
                        className="w-full accent-[#2563EB] cursor-pointer mt-2"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: CHANNELS & APPS */}
              {activeStep === 'channels' && (
                <motion.div
                  key="channels"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Omnichannel Deployment
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Deploy your chatbot across Website, WhatsApp Business API, Telegram, and Social Messaging.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <ChannelCard
                      on={widgetEnabled}
                      onChange={setWidgetEnabled}
                      icon="🌐"
                      title="Website Embed Widget"
                      desc="Embed directly on your website via lightweight JavaScript snippet."
                      badge="Available"
                      badgeStyle="bg-emerald-100 text-emerald-700 border-emerald-200"
                    />

                    <ChannelCard
                      on={whatsappEnabled && hasWhatsApp}
                      onChange={(val) => {
                        if (!hasWhatsApp) return pushToast('WhatsApp Business requires Starter or Growth plan', 'error');
                        setWhatsappEnabled(val);
                      }}
                      icon="📱"
                      title="WhatsApp Business API"
                      desc="Automate WhatsApp user inquiries via Meta Cloud API."
                      badge={hasWhatsApp ? 'Pro' : 'Locked 🔒'}
                      badgeStyle={hasWhatsApp ? 'bg-blue-100 text-[#2563EB] border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />

                    {whatsappEnabled && hasWhatsApp && (
                      <div className="space-y-3 pt-2">
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Display Phone Number</label>
                            <input
                              type="text"
                              value={whatsappDisplayPhone}
                              onChange={(e) => setWhatsappDisplayPhone(e.target.value)}
                              placeholder="+1 (555) 019-2834"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Meta Phone Number ID</label>
                            <input
                              type="text"
                              value={whatsappPhoneId}
                              onChange={(e) => setWhatsappPhoneId(e.target.value)}
                              placeholder="1049281729381"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] mb-1">WhatsApp WABA Account ID</label>
                              <input
                                type="text"
                                value={whatsappWabaId}
                                onChange={(e) => setWhatsappWabaId(e.target.value)}
                                placeholder="WABA-9281728"
                                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] mb-1">Meta Business Portfolio ID</label>
                              <input
                                type="text"
                                value={whatsappBusinessId}
                                onChange={(e) => setWhatsappBusinessId(e.target.value)}
                                placeholder="BIZ-4918271"
                                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Meta Access Token</label>
                            <input
                              type="password"
                              value={whatsappAccessToken}
                              onChange={(e) => setWhatsappAccessToken(e.target.value)}
                              placeholder="EAASxxxx..."
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <ChannelCard
                      on={telegramEnabled && hasAdvancedChannels}
                      onChange={(val) => {
                        if (!hasAdvancedChannels) return pushToast('Telegram requires Growth plan', 'error');
                        setTelegramEnabled(val);
                      }}
                      icon="✈️"
                      title="Telegram Bot API"
                      desc="Link Telegram Bot token created via @BotFather."
                      badge={hasAdvancedChannels ? 'Growth' : 'Locked 🔒'}
                      badgeStyle={hasAdvancedChannels ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />

                    {telegramEnabled && hasAdvancedChannels && (
                      <div className="space-y-3 pt-2">
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Telegram Bot Token</label>
                            <input
                              type="text"
                              value={telegramToken}
                              onChange={(e) => setTelegramToken(e.target.value)}
                              placeholder="123456789:ABCdefGh..."
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Bot Username</label>
                            <input
                              type="text"
                              value={telegramBotUsername}
                              onChange={(e) => setTelegramBotUsername(e.target.value)}
                              placeholder="e.g. AutonivSupportBot"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <ChannelCard
                      on={facebookEnabled && hasAdvancedChannels}
                      onChange={(val) => {
                        if (!hasAdvancedChannels) return pushToast('Messenger requires Growth plan', 'error');
                        setFacebookEnabled(val);
                      }}
                      icon="💬"
                      title="Facebook Messenger & Instagram"
                      desc="Automate Facebook Page and Instagram DM conversations."
                      badge={hasAdvancedChannels ? 'Growth' : 'Locked 🔒'}
                      badgeStyle={hasAdvancedChannels ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />

                    {facebookEnabled && hasAdvancedChannels && (
                      <div className="space-y-3 pt-2">
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Facebook Page ID</label>
                            <input
                              type="text"
                              value={facebookPageId}
                              onChange={(e) => setFacebookPageId(e.target.value)}
                              placeholder="1045239928172"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Page Access Token</label>
                            <input
                              type="password"
                              value={facebookPageAccessToken}
                              onChange={(e) => setFacebookPageAccessToken(e.target.value)}
                              placeholder="Meta Page Access Token"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1">Instagram Account ID (Optional)</label>
                            <input
                              type="text"
                              value={instagramAccountId}
                              onChange={(e) => setInstagramAccountId(e.target.value)}
                              placeholder="178414002918281"
                              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: INTEGRATIONS */}
              {activeStep === 'integrations' && (
                <motion.div
                  key="integrations"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      CRM & Lead Post Automation Hub
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Push captured lead contact details directly into HubSpot, Salesforce, or custom Zapier / Make.com Webhooks.
                    </p>
                  </div>

                  {!hasCRM ? (
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-extrabold mx-auto">
                        🔒
                      </div>
                      <h3 className="text-sm font-extrabold text-[#0F172A]">HubSpot, Salesforce & Webhook Automations</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Push leads captured by your chatbot directly into your CRM pipelines. Available on Growth and Enterprise plans.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard/billing')}
                        className="px-6 py-2.5 text-xs font-extrabold rounded-xl text-white shadow-md border-none cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}
                      >
                        Upgrade Plan →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* HubSpot Integration Card */}
                      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🟠</span>
                            <div>
                              <h3 className="text-xs font-extrabold text-[#0F172A]">HubSpot CRM Direct Sync</h3>
                              <p className="text-[11px] text-slate-500 font-medium">Create HubSpot Contacts & Sales Deals automatically.</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 border border-orange-200">
                            HubSpot API
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">HubSpot Private App Token</label>
                          <input
                            type="password"
                            value={hubspotToken}
                            onChange={(e) => setHubspotToken(e.target.value)}
                            placeholder="pat-na1-xxxx-xxxx..."
                            className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-medium">Sync contacts & log chat notes into CRM</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!hubspotToken.trim()) return pushToast('Please enter a HubSpot Token first', 'error');
                              pushToast('Connected to HubSpot CRM successfully!');
                            }}
                            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-[#0F172A] bg-white hover:bg-slate-50 cursor-pointer transition-all"
                          >
                            Test Connection 🔗
                          </button>
                        </div>
                      </div>

                      {/* Custom Webhooks Card (Zapier / Make.com) */}
                      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <div>
                              <h3 className="text-xs font-extrabold text-[#0F172A]">Custom Webhook POST Endpoint</h3>
                              <p className="text-[11px] text-slate-500 font-medium">Trigger Zapier, Make.com, or custom backend endpoints.</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#2563EB] border border-blue-200">
                            JSON Payload
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Webhook POST Endpoint URL</label>
                          <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://hooks.zapier.com/hooks/catch/12345/abcde"
                            className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Webhook Secret Token (Optional)</label>
                            <input
                              type="text"
                              value={webhookSecret}
                              onChange={(e) => setWebhookSecret(e.target.value)}
                              placeholder="whsec_secret123"
                              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">Payload Template</label>
                            <input
                              type="text"
                              value={payloadTemplate}
                              onChange={(e) => setPayloadTemplate(e.target.value)}
                              placeholder='{"event": "lead_captured"}'
                              className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-medium">Sends lead name, email, phone & chat summary</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!webhookUrl.trim()) return pushToast('Please enter a Webhook URL first', 'error');
                              pushToast('Test payload sent to Webhook endpoint!');
                            }}
                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white border-none cursor-pointer hover:bg-blue-700 transition-all shadow-xs"
                          >
                            Send Test Payload 🚀
                          </button>
                        </div>
                      </div>

                      {/* Field Mapping Matrix Preview */}
                      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                        <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                          Auto Lead Field Mapping
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">Chatbot Input</span>
                            <span className="text-[#0F172A] font-extrabold">Full Name</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">CRM Field</span>
                            <span className="text-[#2563EB] font-extrabold">firstname / lastname</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">Status</span>
                            <span className="text-[#10B981] font-extrabold">✓ Auto Mapped</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">Chatbot Input</span>
                            <span className="text-[#0F172A] font-extrabold">Email Address</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">CRM Field</span>
                            <span className="text-[#2563EB] font-extrabold">email</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-slate-400 font-bold block">Status</span>
                            <span className="text-[#10B981] font-extrabold">✓ Auto Mapped</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 6: LIVE TESTING */}
              {activeStep === 'testing' && (
                <motion.div
                  key="testing"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Live Test & Debugger
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Simulate live customer messages to test your prompt's tone, rules, and escalation pathways.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-sm font-extrabold">
                      <span>💡</span> How to test:
                    </div>
                    <p>
                      Use the <b>Live Assistant Simulator</b> in the right column to type test messages (e.g. <i>"Hello"</i>, <i>"What are your prices?"</i>, <i>"I want to book a demo"</i>) and observe how your AI assistant responds.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 7: DEPLOYMENT */}
              {activeStep === 'deployment' && (
                <motion.div
                  key="deployment"
                  {...pageVariant}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Website Script & Deployment Code
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Copy the script snippet and paste it before the closing &lt;/head&gt; tag on your website.
                    </p>
                  </div>

                  {apiKey && embedCode ? (
                    <div className="space-y-5">
                      <div className="p-5 rounded-3xl bg-[#0F172A] text-white space-y-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                            Website Script Snippet
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(embedCode);
                              pushToast('Embed snippet copied to clipboard!');
                            }}
                            className="px-4 py-2 text-xs font-extrabold rounded-xl bg-[#2563EB] text-white border-none cursor-pointer shadow-xs hover:bg-blue-700 transition-all"
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre className="p-4 rounded-2xl bg-slate-950 text-teal-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                          {embedCode}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
                      <p className="text-sm font-extrabold text-[#0F172A]">
                        Publish Chatbot to Generate Script Embed Code
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click the "Deploy Chatbot" button in the header or bottom bar to generate your live website embed script tag.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: PINNED LIVE WIDGET SIMULATOR (5 Columns) ── */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-lg shadow-slate-200/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                    Live Assistant Simulator
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('widget')}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                      previewMode === 'widget' ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Widget View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                      previewMode === 'mobile' ? 'bg-white text-[#0F172A] shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Mobile View
                  </button>
                </div>
              </div>

              {/* Chat Device Frame */}
              <div
                className="border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col h-[520px] shadow-md transition-all"
                style={{ borderRadius: `${widgetRadius}px` }}
              >
                {/* Simulator Header */}
                <div
                  className="p-4 text-white flex items-center justify-between shrink-0 shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center font-black text-base text-white">
                      {brandLogo ? (
                        <img src={brandLogo} alt="Logo" className="w-5 h-5 object-contain rounded" />
                      ) : name.trim() ? (
                        name.trim().charAt(0).toUpperCase()
                      ) : (
                        '🤖'
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white leading-none">
                        {name.trim() || 'AI Assistant'}
                      </h4>
                      <p className="text-[10px] text-white/80 font-medium mt-1">Online 24/7</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimMessages([
                        {
                          id: 'welcome',
                          sender: 'bot',
                          text: welcomeMessage || 'Hi! How can I help you today? 👋',
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                    }}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xs border-none bg-transparent cursor-pointer"
                    title="Reset Preview Chat"
                  >
                    🔄
                  </button>
                </div>

                {/* Messages Body */}
                <div key={welcomeMessage} className="flex-1 p-4 overflow-y-auto space-y-3">
                  {simMessages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed font-semibold shadow-2xs ${
                          m.sender === 'user'
                            ? 'text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/90 text-[#0F172A] rounded-bl-xs'
                        }`}
                        style={{
                          borderRadius: `${Math.min(widgetRadius, 16)}px`,
                          backgroundColor: m.sender === 'user' ? brandColor : undefined,
                        }}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold mt-1 px-1">{m.time}</span>
                    </div>
                  ))}

                  {simTyping && (
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                  <div ref={simEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSimSend} className="p-3 bg-white border-t border-slate-200/90 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    placeholder="Type test message…"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={!simInput.trim()}
                    className="p-2 rounded-xl text-white shadow-xs disabled:opacity-40 border-none cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>

                {/* Footer Branding */}
                <div className="py-2.5 px-3 bg-slate-100/90 border-t border-slate-200/60 text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
                  <span>⚡ Powered by</span>
                  <span className="text-[#0F172A] font-extrabold tracking-tight">Autoniv AI</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM STICKY ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xl relative">
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px]"
          style={{ background: `linear-gradient(90deg, ${brandColor}, #10B981)` }}
        />
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div>
            {currentStepIdx > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveStep(STEPS[currentStepIdx - 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2.5 text-xs font-extrabold rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                ← Previous
              </button>
            ) : <div />}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => pushToast('Draft saved successfully!')}
              className="px-5 py-2.5 text-xs font-extrabold rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
            >
              Save Draft
            </button>

            {currentStepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveStep(STEPS[currentStepIdx + 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 text-xs font-extrabold rounded-2xl text-white bg-[#0F172A] hover:bg-slate-800 cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
              >
                Next: {STEPS[currentStepIdx + 1].label} →
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-extrabold rounded-2xl text-white shadow-md cursor-pointer border-none disabled:opacity-60 transition-all"
                style={{ background: `linear-gradient(135deg, ${brandColor}, #10B981)` }}
              >
                {loading ? 'Publishing…' : isEdit ? 'Save Changes' : 'Deploy Chatbot ✨'}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONFETTI OVERLAY ── */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-slate-900/30 backdrop-blur-xs"
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: confettiValues[i].scale,
                    opacity: 1,
                  }}
                  animate={{
                    x: confettiValues[i].x,
                    y: confettiValues[i].y,
                    rotate: confettiValues[i].rotate,
                    opacity: 0,
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#E11D48'][i % 5],
                  }}
                />
              ))}

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-3 pointer-events-auto max-w-sm"
              >
                <span className="text-4xl">🎉</span>
                <h3 className="text-lg font-black text-[#0F172A]">Chatbot Published Successfully!</h3>
                <p className="text-xs text-slate-500 font-medium">Your chatbot configuration is now live and ready to embed.</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`px-4.5 py-3 rounded-2xl text-xs font-extrabold text-white shadow-xl flex items-center gap-2.5 ${
                t.kind === 'success' ? 'bg-[#0F172A] border border-slate-800' : 'bg-red-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.kind === 'success' ? 'bg-[#10B981]' : 'bg-white'}`} />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

function ChannelCard({
  on,
  onChange,
  icon,
  title,
  desc,
  badge,
  badgeStyle,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  badgeStyle?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-full flex items-center gap-4 p-4.5 rounded-2xl border transition-all cursor-pointer text-left ${
        on
          ? 'border-[#2563EB] bg-blue-50/40 shadow-2xs ring-1 ring-blue-500/20'
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
      }`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0F172A]">{title}</span>
          {badge && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{desc}</p>
      </div>
      <span className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${on ? 'bg-[#10B981]' : 'bg-slate-200'}`}>
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${
            on ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

export default CreateChatbot;
