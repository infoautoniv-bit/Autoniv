import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// Framer Motion presets
const easeCurve = [0.16, 1, 0.3, 1] as const;
const pageVariant = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: easeCurve } },
  exit: { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.2, ease: easeCurve } },
};

type StepId = 'overview' | 'personality' | 'appearance' | 'channels' | 'integrations' | 'testing' | 'deployment';

interface StepNav {
  id: StepId;
  label: string;
  icon: string;
  desc: string;
}

const STEPS: StepNav[] = [
  { id: 'overview', label: 'Overview & Basics', icon: '📊', desc: 'Chatbot identity and basic info' },
  { id: 'personality', label: 'AI Personality', icon: '🧠', desc: 'System prompt & quick templates' },
  { id: 'appearance', label: 'Theme & Style', icon: '🎨', desc: 'Colors, launcher & widget appearance' },
  { id: 'channels', label: 'Channels & Apps', icon: '⚡', desc: 'Website, WhatsApp, Telegram, etc.' },
  { id: 'integrations', label: 'CRM & Webhooks', icon: '🔗', desc: 'HubSpot, Salesforce & Lead post URL' },
  { id: 'testing', label: 'Live Test & Debug', icon: '🧪', desc: 'Simulate conversations in real-time' },
  { id: 'deployment', label: 'Embed & Deploy', icon: '🚀', desc: 'Script tag & deployment keys' },
];

const TEMPLATES = [
  {
    id: 'support',
    label: 'Customer Support',
    icon: '🎧',
    category: 'Support',
    badge: 'Popular',
    desc: 'Empathetic agent for troubleshooting, FAQ, and escalation.',
    prompt: 'You are a warm, professional customer support specialist. Your mission is to resolve inquiries accurately and provide step-by-step guidance. If a question is outside your knowledge, offer to collect their email for human follow-up.',
  },
  {
    id: 'sales',
    label: 'Sales Assistant',
    icon: '💼',
    category: 'Sales',
    badge: 'High Conversion',
    desc: 'Recommends products, answers pricing, and guides buyers.',
    prompt: 'You are a proactive sales assistant. Recommend relevant pricing plans, answer product questions with value propositions, and guide users toward starting a free trial or booking a demo call.',
  },
  {
    id: 'booking',
    label: 'Appointment Booking',
    icon: '📅',
    category: 'Booking',
    badge: 'Automated',
    desc: 'Schedules calls, meetings, and consultations seamlessly.',
    prompt: 'You are an appointment booking assistant. Collect the user’s name, preferred date/time, phone number, and email address before confirming their booking.',
  },
  {
    id: 'faq',
    label: 'Knowledge FAQ Bot',
    icon: '❓',
    category: 'FAQ',
    badge: 'Quick Setup',
    desc: 'Instant answers for common customer questions and docs.',
    prompt: 'You are an accurate FAQ assistant. Answer questions clearly based on verified company information. Keep responses concise and friendly.',
  },
  {
    id: 'leads',
    label: 'Lead Qualifier',
    icon: '🎯',
    category: 'Leads',
    badge: 'Enterprise',
    desc: 'Gathers budget, timeline, and lead details naturally.',
    prompt: 'You are a lead qualification specialist. Ask about the user’s business needs, timeline, and team size, collecting contact details for your sales team to follow up.',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce Concierge',
    icon: '🛍️',
    category: 'Retail',
    badge: 'Top Rated',
    desc: 'Product recommendations, order tracking, and returns.',
    prompt: 'You are a retail shopping assistant. Assist customers with product recommendations, order tracking, size guides, and hassle-free returns.',
  },
  {
    id: 'healthcare',
    label: 'Healthcare Assistant',
    icon: '🏥',
    category: 'Medical',
    badge: 'HIPAA Compliant',
    desc: 'Patient intake, clinic hours, and appointment inquiries.',
    prompt: 'You are a medical clinic intake assistant. Help visitors find clinic hours, services offered, and schedule intake appointments. Always advise consulting a doctor for medical emergencies.',
  },
  {
    id: 'realestate',
    label: 'Real Estate Agent',
    icon: '🏡',
    category: 'Property',
    badge: 'Hot Leads',
    desc: 'Property listings, tour bookings, and buyer qualification.',
    prompt: 'You are a real estate assistant. Help buyers and renters find property listings, schedule property tours, and collect contact details.',
  },
];

const PRESET_COLORS = [
  { name: 'Electric Blue', hex: '#2563EB', gradient: 'from-blue-600 to-indigo-600' },
  { name: 'Emerald Teal', hex: '#059669', gradient: 'from-emerald-600 to-teal-500' },
  { name: 'Royal Purple', hex: '#7C3AED', gradient: 'from-purple-600 to-violet-500' },
  { name: 'Sunset Amber', hex: '#EA580C', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Obsidian Dark', hex: '#0F172A', gradient: 'from-slate-900 to-slate-800' },
  { name: 'Ruby Crimson', hex: '#E11D48', gradient: 'from-rose-600 to-pink-600' },
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

  // Navigation state
  const [activeStep, setActiveStep] = useState<StepId>('overview');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [widgetRadius, setWidgetRadius] = useState<number>(24);

  // Channels
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappDisplayPhone, setWhatsappDisplayPhone] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookPageId, setFacebookPageId] = useState('');
  const [facebookPageAccessToken, setFacebookPageAccessToken] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');

  // CRM
  const [hubspotToken, setHubspotToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [previewMode, setPreviewMode] = useState<'widget' | 'mobile'>('widget');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Simulator
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([]);
  const [simInput, setSimInput] = useState('');
  const [simTyping, setSimTyping] = useState(false);
  const simEndRef = useRef<HTMLDivElement>(null);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const tid = ++toastId.current;
    setToasts((t) => [...t, { id: tid, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 2800);
  }, []);

  useEffect(() => {
    setSimMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: welcomeMessage || 'Hi! How can I help you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [welcomeMessage]);

  useEffect(() => {
    if (isEdit && id) {
      chatbotService
        .get(id)
        .then(({ data }) => {
          const c = data.chatbot;
          setName(c.name);
          setDescription(c.description || '');
          setSystemPrompt(c.systemPrompt);
          setWelcomeMessage(c.welcomeMessage || 'Hi! How can I help you today?');
          setBrandColor(c.brandColor || '#2563EB');
          setWidgetEnabled(c.channels?.widget?.enabled !== false);
          setWhatsappEnabled(c.channels?.whatsapp?.enabled || false);
          setWhatsappPhoneId(c.channels?.whatsapp?.phoneNumberId || '');
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

    setTimeout(() => {
      let replyText = `Thanks for testing! I am configured with your system instructions and ready to assist visitors 24/7.`;
      if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('hi')) {
        replyText = `Hello! How can I assist you with your inquiry today?`;
      } else if (userText.toLowerCase().includes('price') || userText.toLowerCase().includes('plan')) {
        replyText = `We offer multiple flexible plans starting with a free tier!`;
      } else if (userText.toLowerCase().includes('book') || userText.toLowerCase().includes('demo')) {
        replyText = `I would love to help you book a demo call. What date works best for you?`;
      }

      setSimMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setSimTyping(false);
    }, 850);
  };

  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, simTyping]);

  // AI Prompt Improver
  const handleImprovePrompt = () => {
    setAutoSaveStatus('saving');
    const enhanced = systemPrompt.trim()
      ? `${systemPrompt.trim()}\n\n[Behavior Rule]: Always provide clean, concise, polite responses. Ask relevant follow-up questions when appropriate.`
      : 'You are an helpful, accurate AI assistant. Greet users politely, answer inquiries step-by-step, and provide clear information.';
    setSystemPrompt(enhanced);
    pushToast('AI prompt enhanced successfully!');
    setTimeout(() => setAutoSaveStatus('saved'), 600);
  };

  // Submit Handler with Confetti
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');

    if (!name.trim()) {
      setActiveStep('overview');
      return setError('Please enter a chatbot name');
    }
    if (!systemPrompt.trim()) {
      setActiveStep('personality');
      return setError('Please configure a system prompt or select a template');
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        welcomeMessage: welcomeMessage.trim(),
        brandColor,
        channels: {
          whatsapp: {
            enabled: whatsappEnabled,
            phoneNumberId: whatsappPhoneId || undefined,
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
        },
      };

      if (isEdit && id) {
        await chatbotService.update(id, payload);
        setShowConfetti(true);
        pushToast('Chatbot updated successfully!');
        setTimeout(() => navigate('/dashboard/chatbots'), 1600);
      } else {
        const { data } = await chatbotService.create(payload);
        setApiKey(data.chatbot.apiKey);
        setShowConfetti(true);
        pushToast('Chatbot deployed successfully!');
        setTimeout(() => navigate(`/dashboard/chatbots/${data.chatbot._id}`), 1600);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-[24px] border border-slate-200/80 p-8 shadow-xl space-y-6 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600/20" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2 mx-auto" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Assistant Studio…</p>
        </div>
      </div>
    );
  }

  const embedCode = id ? `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>` : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative overflow-hidden font-sans" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Background Ambient Floating Blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Hero Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Avatar */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard/chatbots')}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all cursor-pointer shadow-xs shrink-0"
              title="Back to Chatbots"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 transition-transform hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${brandColor}, #00c8b4)` }}
              >
                {name.trim() ? name.trim().charAt(0).toUpperCase() : '🤖'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:inline">Dashboard / Chatbots /</span>
                  <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[140px] sm:max-w-none">
                    {name.trim() || 'New Assistant'}
                  </h1>
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                  Studio v2 · {autoSaveStatus === 'saving' ? 'Auto-saving…' : 'Saved'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveStep('testing')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-200 text-blue-600 bg-blue-50/60 hover:bg-blue-100/80 transition-all cursor-pointer shadow-xs hidden sm:inline-flex"
            >
              Live Test 🧪
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white shadow-sm hover:shadow-md transition-all cursor-pointer border-none disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #00c8b4)` }}
            >
              {loading ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span>✨</span>
              )}
              <span>{loading ? 'Publishing…' : isEdit ? 'Save Changes' : 'Publish'}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Main 3-Column Studio Workspace ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pt-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Navigation (3 Cols / 280px equivalent) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-5 shadow-xl shadow-slate-200/40 space-y-5">
              {/* Health Indicator Card */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Readiness Score</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    98% Optimal
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Chatbot prompt and channels are ready for live deployment.</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Configuration Progress</span>
                  <span className="text-blue-600">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} className="h-full bg-blue-600 rounded-full" />
                </div>
              </div>

              {/* Navigation Step List */}
              <nav className="space-y-1">
                {STEPS.map((step, idx) => {
                  const active = activeStep === step.id;
                  const isDone = idx < currentStepIdx;
                  return (
                    <motion.button
                      key={step.id}
                      whileHover={{ x: 3 }}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer text-left ${
                        active
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 bg-transparent'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        active
                          ? 'bg-blue-600 text-white'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isDone ? '✓' : step.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-slate-900'}`}>{step.label}</p>
                        <p className={`text-[10px] truncate ${active ? 'text-slate-400' : 'text-slate-400'}`}>{step.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Center Workspace (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              {/* SECTION 1: OVERVIEW */}
              {activeStep === 'overview' && (
                <motion.div key="overview" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Overview & Assistant Identity</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Define your assistant name, purpose, and default welcome greeting.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Assistant Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sales Assistant, Autoniv Support Bot"
                        className="w-full px-4 py-3 text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Handles customer inquiries and captures qualified leads 24/7"
                        className="w-full px-4 py-3 text-xs font-medium rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Default Welcome Greeting</label>
                      <input
                        type="text"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Hi! How can I help you today?"
                        className="w-full px-4 py-3 text-xs font-semibold rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 2: PERSONALITY */}
              {activeStep === 'personality' && (
                <motion.div key="personality" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">AI Personality & Templates</h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">Select a pre-tuned template or build custom prompt instructions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImprovePrompt}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <span>✨</span>
                      <span>AI Enhance</span>
                    </button>
                  </div>

                  {/* Template Cards */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Quick AI Templates</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {TEMPLATES.map((t) => {
                        const active = systemPrompt === t.prompt;
                        return (
                          <motion.button
                            key={t.id}
                            whileHover={{ y: -3 }}
                            type="button"
                            onClick={() => {
                              setSystemPrompt(t.prompt);
                              pushToast(`Applied "${t.label}" template`);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                              active
                                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{t.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                {t.badge}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{t.label}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">{t.desc}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* System Prompt Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        System Prompt Instructions <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs font-mono text-slate-400">{systemPrompt.length.toLocaleString()} / 10,000</span>
                    </div>
                    <textarea
                      required
                      rows={8}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Describe your chatbot's role, tone, knowledge, constraints, and escalation rules..."
                      maxLength={10000}
                      className="w-full px-4 py-3.5 text-xs font-mono leading-relaxed rounded-2xl bg-slate-900 text-teal-300 border border-slate-800 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                    />
                  </div>
                </motion.div>
              )}

              {/* SECTION 3: APPEARANCE */}
              {activeStep === 'appearance' && (
                <motion.div key="appearance" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Theme & Styling Studio</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Customize visual theme, launcher button position, and rounded corner radius.</p>
                  </div>

                  {/* Brand Swatches */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Brand Color Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PRESET_COLORS.map((c) => {
                        const active = brandColor.toUpperCase() === c.hex.toUpperCase();
                        return (
                          <motion.button
                            key={c.name}
                            whileHover={{ scale: 1.02 }}
                            type="button"
                            onClick={() => setBrandColor(c.hex)}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              active
                                ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-xl bg-gradient-to-r ${c.gradient} shadow-xs shrink-0`} />
                            <div className="text-left min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-[10px] font-mono text-slate-400 uppercase">{c.hex}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex */}
                  <div className="flex items-center gap-4 pt-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-12 h-12 rounded-2xl border border-slate-200 cursor-pointer p-1 bg-white shadow-xs"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-36 px-4 py-3 text-xs font-mono font-bold rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 uppercase focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-xs text-slate-500 font-medium">Custom Color Hex</span>
                  </div>

                  {/* Position & Radius Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Widget Position</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setWidgetPosition('bottom-right')}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            widgetPosition === 'bottom-right' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Bottom Right
                        </button>
                        <button
                          type="button"
                          onClick={() => setWidgetPosition('bottom-left')}
                          className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            widgetPosition === 'bottom-left' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Bottom Left
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Corner Radius</label>
                        <span className="text-xs font-mono text-slate-500">{widgetRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={32}
                        value={widgetRadius}
                        onChange={(e) => setWidgetRadius(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SECTION 4: CHANNELS */}
              {activeStep === 'channels' && (
                <motion.div key="channels" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Omnichannel Deployment Cards</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Enable Website Widget, WhatsApp, Telegram, Facebook Messenger & Instagram.</p>
                  </div>

                  <div className="space-y-4">
                    <ChannelCard
                      on={widgetEnabled}
                      onChange={setWidgetEnabled}
                      icon="🌐"
                      title="Website Chat Widget"
                      desc="Embed directly on your site using a light JS script tag."
                      badge="Available"
                      badgeStyle="bg-emerald-100 text-emerald-700 border-emerald-200"
                    />

                    <ChannelCard
                      on={whatsappEnabled && hasWhatsApp}
                      onChange={(val) => {
                        if (!hasWhatsApp) return pushToast('WhatsApp requires Starter or Growth plan', 'error');
                        setWhatsappEnabled(val);
                      }}
                      icon="📱"
                      title="WhatsApp Business API"
                      desc="Automate WhatsApp chats via Meta Business API."
                      badge={hasWhatsApp ? 'Pro' : 'Locked 🔒'}
                      badgeStyle={hasWhatsApp ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />
                    <AnimatePresence initial={false}>
                      {whatsappEnabled && hasWhatsApp && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pl-2 space-y-3"
                        >
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Phone Number</label>
                              <input
                                type="text"
                                value={whatsappDisplayPhone}
                                onChange={(e) => setWhatsappDisplayPhone(e.target.value)}
                                placeholder="+1 555-0192"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number ID</label>
                              <input
                                type="text"
                                value={whatsappPhoneId}
                                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                                placeholder="Meta Phone Number ID"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Meta Access Token</label>
                              <input
                                type="password"
                                value={whatsappAccessToken}
                                onChange={(e) => setWhatsappAccessToken(e.target.value)}
                                placeholder="EAAS..."
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <ChannelCard
                      on={telegramEnabled && hasAdvancedChannels}
                      onChange={(val) => {
                        if (!hasAdvancedChannels) return pushToast('Telegram requires Growth plan', 'error');
                        setTelegramEnabled(val);
                      }}
                      icon="✈️"
                      title="Telegram Bot"
                      desc="Link Telegram Bot token from Telegram @BotFather."
                      badge={hasAdvancedChannels ? 'Growth' : 'Locked 🔒'}
                      badgeStyle={hasAdvancedChannels ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />
                    <AnimatePresence initial={false}>
                      {telegramEnabled && hasAdvancedChannels && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pl-2 space-y-3"
                        >
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Telegram Bot Token</label>
                              <input
                                type="text"
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                placeholder="123456789:ABCdefGh..."
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Bot Username</label>
                              <input
                                type="text"
                                value={telegramBotUsername}
                                onChange={(e) => setTelegramBotUsername(e.target.value)}
                                placeholder="e.g. MyCustomerBot"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <ChannelCard
                      on={facebookEnabled && hasAdvancedChannels}
                      onChange={(val) => {
                        if (!hasAdvancedChannels) return pushToast('Messenger requires Growth plan', 'error');
                        setFacebookEnabled(val);
                      }}
                      icon="💬"
                      title="Facebook Messenger & Instagram"
                      desc="Automate Facebook Page and Instagram Direct messages."
                      badge={hasAdvancedChannels ? 'Growth' : 'Locked 🔒'}
                      badgeStyle={hasAdvancedChannels ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                    />
                    <AnimatePresence initial={false}>
                      {facebookEnabled && hasAdvancedChannels && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pl-2 space-y-3"
                        >
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Facebook Page ID</label>
                              <input
                                type="text"
                                value={facebookPageId}
                                onChange={(e) => setFacebookPageId(e.target.value)}
                                placeholder="1045239928172"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Page Access Token</label>
                              <input
                                type="password"
                                value={facebookPageAccessToken}
                                onChange={(e) => setFacebookPageAccessToken(e.target.value)}
                                placeholder="Meta Page Access Token"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">Instagram Account ID (Optional)</label>
                              <input
                                type="text"
                                value={instagramAccountId}
                                onChange={(e) => setInstagramAccountId(e.target.value)}
                                placeholder="178414002918281"
                                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* SECTION 5: INTEGRATIONS */}
              {activeStep === 'integrations' && (
                <motion.div key="integrations" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">CRM & Lead Webhook Automation</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Sync lead details directly to HubSpot or custom Webhook endpoints.</p>
                  </div>

                  {!hasCRM ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-black mx-auto">
                        🔒
                      </div>
                      <h3 className="text-xs font-bold text-slate-900">HubSpot & Webhook Integrations</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Automatically push captured lead contacts directly into HubSpot CRM. Available on the Growth plan.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard/billing')}
                        className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm border-none cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">HubSpot Private App Token</label>
                        <input
                          type="password"
                          value={hubspotToken}
                          onChange={(e) => setHubspotToken(e.target.value)}
                          placeholder="pat-na1-xxxx..."
                          className="w-full px-4 py-3 text-xs font-mono rounded-2xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Custom Webhook POST URL</label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://api.yourcompany.com/webhooks/leads"
                          className="w-full px-4 py-3 text-xs font-mono rounded-2xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SECTION 6: TESTING */}
              {activeStep === 'testing' && (
                <motion.div key="testing" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Live Test & Conversation Debugger</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Test AI responses, prompt rules, and tone in real-time.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium leading-relaxed">
                    💡 Use the Live Simulator in the right sidebar to send test questions and verify how your prompt responds!
                  </div>
                </motion.div>
              )}

              {/* SECTION 7: DEPLOYMENT */}
              {activeStep === 'deployment' && (
                <motion.div key="deployment" {...pageVariant} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-7 shadow-xl shadow-slate-200/40 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Script Embed & Deployment</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Copy and paste script tag onto your website to publish your widget.</p>
                  </div>

                  {apiKey && embedCode ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Website Embed Script</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(embedCode);
                              pushToast('Embed snippet copied!');
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white border-none cursor-pointer"
                          >
                            Copy Code
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-xl bg-slate-950 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                          {embedCode}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                      <p className="text-xs font-bold text-slate-800">Publish Chatbot to Generate Script Embed Code</p>
                      <p className="text-xs text-slate-500">Click the "Publish Chatbot" button below to deploy your chatbot and generate your API key.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Sidebar Sticky Live Simulator (3 Cols / 340px) */}
          <div className="lg:col-span-3 sticky top-20 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-5 shadow-xl shadow-slate-200/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Live Simulator</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('widget')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${previewMode === 'widget' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    Widget
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* Chat Frame */}
              <div
                className="border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col h-[480px] shadow-sm transition-all"
                style={{ borderRadius: `${widgetRadius}px` }}
              >
                {/* Header */}
                <div className="p-4 text-white flex items-center justify-between shrink-0 shadow-xs" style={{ backgroundColor: brandColor }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm text-white">
                      {name.trim() ? name.trim().charAt(0).toUpperCase() : '🤖'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-none">{name.trim() || 'AI Assistant'}</h4>
                      <p className="text-[10px] text-white/80 font-medium mt-0.5">Online</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSimMessages([
                        {
                          id: 'welcome',
                          sender: 'bot',
                          text: welcomeMessage || 'Hi! How can I help you today?',
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                    }}
                    className="p-1 rounded text-white/80 hover:text-white text-xs border-none bg-transparent cursor-pointer"
                    title="Reset Preview"
                  >
                    🔄
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {simMessages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed font-semibold shadow-xs ${
                          m.sender === 'user' ? 'text-white rounded-br-xs' : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                        }`}
                        style={{
                          borderRadius: `${Math.min(widgetRadius, 16)}px`,
                          backgroundColor: m.sender === 'user' ? brandColor : undefined,
                        }}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium mt-1 px-1">{m.time}</span>
                    </div>
                  ))}

                  {simTyping && (
                    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                  <div ref={simEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSimSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    placeholder="Type test message…"
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
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
                <div className="py-2 px-3 bg-slate-100/90 border-t border-slate-200/60 text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
                  <span>⚡ Powered by</span>
                  <span className="text-slate-700 font-extrabold tracking-tight">Autoniv AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Frosted Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 lg:left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-4 sm:px-6 py-3 shadow-xl relative">
        <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: `linear-gradient(90deg, ${brandColor}, #00c8b4, #10b981)` }} />
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentStepIdx > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveStep(STEPS[currentStepIdx - 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-2 text-xs font-bold rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => pushToast('Draft saved successfully!')}
              className="px-5 py-2 text-xs font-bold rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-xs transition-all"
            >
              Save draft
            </button>

            {currentStepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveStep(STEPS[currentStepIdx + 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2 text-xs font-bold rounded-2xl text-white bg-slate-950 hover:bg-slate-800 cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
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
                className="px-6 py-2 text-xs font-bold rounded-2xl text-white shadow-md cursor-pointer border-none disabled:opacity-60 transition-all"
                style={{ background: `linear-gradient(135deg, ${brandColor}, #00c8b4)` }}
              >
                {loading ? 'Publishing…' : isEdit ? 'Save Changes' : 'Deploy Chatbot ✨'}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── Success Confetti Overlay ── */}
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
                    scale: Math.random() * 0.8 + 0.4,
                    opacity: 1,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 800,
                    y: (Math.random() - 0.5) * 600 - 100,
                    rotate: Math.random() * 360,
                    opacity: 0,
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#2563EB', '#059669', '#7C3AED', '#EA580C', '#E11D48', '#F59E0B'][i % 6],
                  }}
                />
              ))}

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-2xl text-center space-y-3 pointer-events-auto"
              >
                <span className="text-4xl">🎉</span>
                <h3 className="text-lg font-black text-slate-900">Chatbot Published Successfully!</h3>
                <p className="text-xs text-slate-500 font-medium">Your chatbot studio configuration is now live.</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notifications ── */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-xl flex items-center gap-2.5 ${
                t.kind === 'success' ? 'bg-slate-900 border border-slate-800' : 'bg-rose-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.kind === 'success' ? 'bg-emerald-400' : 'bg-white'}`} />
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
    <motion.button
      whileHover={{ y: -2 }}
      type="button"
      onClick={() => onChange(!on)}
      className={`w-full flex items-center gap-4 p-4.5 rounded-2xl border transition-all cursor-pointer text-left ${
        on
          ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/20'
          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
      }`}
    >
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{title}</span>
          {badge && <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>{badge}</span>}
        </div>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{desc}</p>
      </div>
      <span className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-xs transform transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
      </span>
    </motion.button>
  );
}
