import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../../services/api';
import { useAuth } from '../../App';

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};


const PROMPT_SUGGESTIONS = [
  { label: 'Customer Support', icon: '🎧', prompt: 'You are a warm, professional customer support agent for our company. Your goal is to resolve customer issues quickly and make every person feel heard. Greet the customer politely and ask clarifying questions before answering. Troubleshoot problems step by step, confirm the issue is resolved, and summarize the solution at the end. If you cannot solve a problem or the customer is frustrated, apologize sincerely and offer to escalate to a human agent, collecting their name, email, and a short description of the issue first. Never make up information — if you are unsure, say so honestly. Keep your tone patient, empathetic, and solution-focused at all times.' },
  { label: 'Sales Assistant', icon: '💼', prompt: 'You are an enthusiastic and knowledgeable sales assistant. Your job is to understand what the customer needs, recommend the right product or plan, and guide them confidently toward a purchase. Start by asking about their goals, budget, and use case. Highlight the specific features and benefits that match their situation, and clearly explain pricing, plans, and any current offers. Address objections honestly and reassure hesitant buyers with facts, not pressure. When the customer shows interest, walk them through the next step to buy or start a trial. Be persuasive, friendly, and genuinely helpful — never pushy or misleading.' },
  { label: 'Booking Agent', icon: '📅', prompt: 'You are a professional booking and scheduling assistant. Help customers book appointments smoothly and accurately. Ask for the service they want, their preferred date and time, and any special requirements. Always collect their full name, phone number, and email address before confirming. Check for the details you need one at a time so the conversation feels natural, then read the booking back to the customer to confirm everything is correct. If their preferred slot is unavailable, politely suggest the closest alternatives. Once confirmed, thank them warmly and let them know they will receive a confirmation. Be organized, precise, and friendly throughout.' },
  { label: 'FAQ Bot', icon: '❓', prompt: 'You are a helpful FAQ assistant for our product and service. Answer common questions clearly, concisely, and accurately using simple language that anyone can understand. Break complex answers into short, easy steps when helpful. Always stay on topic and base your answers only on verified information about our company. If a question falls outside what you know, or the customer needs account-specific help, politely explain that you are not certain and offer to connect them with a human team member. Be friendly, respectful, and quick, and end by asking if there is anything else you can help with.' },
  { label: 'Lead Qualifier', icon: '🎯', prompt: 'You are a lead qualification specialist. Your goal is to have a natural conversation that uncovers whether a prospect is a good fit for our product while collecting the key details our sales team needs. Ask thoughtful questions about their business, their main challenges, their goals, their timeline, and their budget. Collect their full name, work email, phone number, and company name during the conversation without making it feel like an interrogation. Listen carefully and adapt your questions to what they tell you. When a lead looks qualified, express genuine interest and let them know a specialist will follow up soon. Always be professional, curious, and respectful of their time.' },
  { label: 'E-commerce Helper', icon: '🛍️', prompt: 'You are a friendly e-commerce shopping assistant. Help customers find the right products, answer questions about sizing, availability, shipping, and returns, and make their shopping experience easy and enjoyable. Ask about what they are looking for and their preferences, then recommend suitable products and explain why they fit. Help with order status, tracking, returns, and exchanges by collecting the order number and email when needed. Clearly explain shipping options, delivery times, and payment methods. Be upbeat, patient, and helpful, and always look for a way to make the customer feel confident about their purchase.' },
  { label: 'Onboarding Guide', icon: '🚀', prompt: 'You are a friendly onboarding guide who helps new users get started and succeed with our product. Welcome them warmly and find out what they want to achieve. Walk them through setup and key features one step at a time, checking in to make sure they are following along before moving on. Share helpful tips, shortcuts, and best practices tailored to their goals. If they get stuck, reassure them and offer clear, simple guidance. Celebrate their progress to keep them motivated. Your mission is to help every new user reach their first success quickly and feel confident using the product on their own.' },
  { label: 'Technical Helpdesk', icon: '🛠️', prompt: 'You are a calm and capable technical support specialist. Help users diagnose and fix technical problems clearly and methodically. Begin by asking for the specifics — what they were doing, what went wrong, any error messages, and their device or platform. Guide them through troubleshooting one step at a time, and confirm the result of each step before continuing. Explain technical concepts in plain language and avoid jargon unless the user is technical. If the issue requires deeper investigation, collect their contact details and a clear summary of the problem, then escalate to the engineering team. Stay patient, precise, and reassuring, even when the user is stressed.' },
];

type Toast = { id: number; text: string; kind: 'success' | 'error' };

export function CreateChatbot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const currentPlan = user?.chatPlan || 'chat_free';
  const hasWhatsApp = currentPlan !== 'chat_free' || user?.role === 'admin';
  const hasAdvancedChannels = currentPlan === 'chat_growth' || currentPlan === 'chat_enterprise' || user?.role === 'admin';
  const hasCRM = currentPlan === 'chat_growth' || currentPlan === 'chat_enterprise' || user?.role === 'admin';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappDisplayPhone, setWhatsappDisplayPhone] = useState('');
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('');
  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookPageId, setFacebookPageId] = useState('');
  const [facebookPageAccessToken, setFacebookPageAccessToken] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [hubspotToken, setHubspotToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // WhatsApp Embedded Signup state
  const [waConnecting, setWaConnecting] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waDisplayPhone, setWaDisplayPhone] = useState<string | null>(null);
  const [waVerifiedName, setWaVerifiedName] = useState<string | null>(null);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const tid = ++toastId.current;
    setToasts((t) => [...t, { id: tid, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 2600);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      chatbotService.get(id).then(({ data }) => {
        const c = data.chatbot;
        setName(c.name);
        setDescription(c.description || '');
        setSystemPrompt(c.systemPrompt);
        setWelcomeMessage(c.welcomeMessage || 'Hi! How can I help you today?');
        setBrandColor(c.brandColor || '#2563EB');
        setWhatsappEnabled(c.channels?.whatsapp?.enabled || false);
        setWhatsappPhoneId(c.channels?.whatsapp?.phoneNumberId || '');
        setWhatsappDisplayPhone(c.channels?.whatsapp?.displayPhoneNumber || '');
        setWidgetEnabled(c.channels?.widget?.enabled !== false);
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
        // Reflect an existing Embedded-Signup connection (accessToken is never returned;
        // connectedAt is the signal that a per-tenant token is stored).
        if (c.channels?.whatsapp?.connectedAt) {
          setWaConnected(true);
          setWaDisplayPhone(c.channels.whatsapp.displayPhoneNumber || null);
          setWaVerifiedName(c.channels.whatsapp.verifiedName || null);
          setWhatsappAccessToken('••••••••••••••••');
        }
      }).catch(() => setError('Failed to load chatbot')).finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name is required');
    if (!systemPrompt.trim()) return setError('System prompt is required');

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
            accessToken: whatsappAccessToken === '••••••••••••••••' ? undefined : (whatsappAccessToken || undefined)
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
        navigate('/dashboard/chatbots');
      } else {
        const { data } = await chatbotService.create(payload);
        setApiKey(data.chatbot.apiKey);
        navigate(`/dashboard/chatbots/${data.chatbot._id}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save chatbot');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnectWhatsapp() {
    if (!isEdit || !id) return;
    setWaConnecting(true);
    try {
      await chatbotService.disconnectWhatsapp(id);
      setWaConnected(false);
      setWaDisplayPhone(null);
      setWaVerifiedName(null);
      pushToast('WhatsApp disconnected', 'success');
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Failed to disconnect', 'error');
    } finally {
      setWaConnecting(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-7 h-7 border-2 border-[var(--primary-blue)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const embedCode = id ? `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>` : '';

  return (
    <div className="h-full overflow-y-auto pb-12 pr-1 scroll-smooth">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <motion.div {...fadeUp} className="mb-6">
          <button
            onClick={() => navigate('/dashboard/chatbots')}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--primary-blue)] transition-colors mb-3 cursor-pointer border-none bg-transparent"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chatbots
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-sm shrink-0"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #00c8b4)` }}
            >
              {name.trim() ? name.trim().charAt(0).toUpperCase() : '＋'}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text)] leading-none">
                {isEdit ? 'Edit Chatbot' : 'Create Chatbot'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold mt-1">
                Configure your AI chatbot's personality and channels.
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <Section {...fadeUp} transition={{ delay: 0.05, duration: 0.35, ease }} icon="🪪" title="Basic Info" subtitle="Name and short description">
            <Field label="Name" required>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Support Bot, Sales Assistant"
                className="form-input" maxLength={100} />
            </Field>
            <Field label="Description">
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of what this chatbot does"
                className="form-input" maxLength={500} />
            </Field>
          </Section>

          {/* AI Personality */}
          <Section {...fadeUp} transition={{ delay: 0.1, duration: 0.35, ease }} icon="🧠" title="AI Personality" subtitle="How your bot thinks and talks">
            <Field label="Quick Templates">
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map(s => {
                  const active = systemPrompt === s.prompt;
                  return (
                    <button key={s.label} type="button"
                      onClick={() => setSystemPrompt(s.prompt)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'text-white border-transparent shadow-sm'
                          : 'text-[var(--text-secondary)] border-[var(--slate-border)] hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)] bg-white'
                      }`}
                      style={active ? { background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' } : undefined}>
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="System Prompt" required
              hint={`${systemPrompt.length.toLocaleString()} / 10,000 characters`}>
              <textarea required rows={6} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Describe your chatbot's personality, tone, and what it should do..."
                maxLength={10000}
                className="form-input resize-none leading-relaxed" />
            </Field>

            <Field label="Welcome Message" hint="First message shown to visitors">
              <input type="text" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)}
                placeholder="Hi! How can I help you today?"
                className="form-input" />
            </Field>
          </Section>

          {/* Appearance */}
          <Section {...fadeUp} transition={{ delay: 0.15, duration: 0.35, ease }} icon="🎨" title="Appearance" subtitle="Brand color for the chat widget">
            <div className="flex items-end gap-4 flex-wrap">
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-[var(--slate-border)] cursor-pointer p-0.5 bg-white" />
                  <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="w-28 px-3 py-2 text-xs font-mono rounded-xl bg-[var(--s1)] border border-[var(--slate-border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary-blue)] uppercase" />
                </div>
              </Field>

              {/* live preview bubble */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Preview</span>
                <div
                  className="px-3.5 py-2 rounded-2xl rounded-bl-sm text-white text-xs font-semibold shadow-sm max-w-[220px] truncate"
                  style={{ background: brandColor }}
                >
                  {welcomeMessage || 'Hi! How can I help you today?'}
                </div>
              </div>
            </div>
          </Section>

          {/* Channels */}
          <Section {...fadeUp} transition={{ delay: 0.2, duration: 0.35, ease }} icon="🔌" title="Channels" subtitle="Where your bot is available">
            <ChannelToggle
              on={widgetEnabled} onChange={setWidgetEnabled}
              icon="🌐" title="Website Widget"
              desc="Embed on any website with a script tag" />

            <ChannelToggle
              on={whatsappEnabled && hasWhatsApp} onChange={(val) => {
                if (!hasWhatsApp) {
                  pushToast('WhatsApp is only available on Starter or Growth plans. Please upgrade!', 'error');
                  return;
                }
                setWhatsappEnabled(val);
              }}
              icon="📱" title={hasWhatsApp ? "WhatsApp" : "WhatsApp 🔒"}
              desc="Reply to WhatsApp messages with this chatbot (Starter or Growth plan required)" />

            <AnimatePresence initial={false}>
              {whatsappEnabled && hasWhatsApp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden">
                  <div className="ml-1 pt-1 space-y-3">
                    {waConnected && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                        <span className="text-lg shrink-0">✅</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-emerald-900">
                            Connected{waVerifiedName ? ` · ${waVerifiedName}` : ''}
                          </span>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            {waDisplayPhone || 'WhatsApp Business number linked'}
                          </p>
                        </div>
                        <button type="button" onClick={handleDisconnectWhatsapp} disabled={waConnecting}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-60">
                          Disconnect
                        </button>
                      </div>
                    )}

                    {/* Manual WhatsApp config — paste credentials directly */}
                    <div className="p-3 rounded-xl border border-[var(--slate-border)] bg-white space-y-3">
                      <p className="text-[11px] text-[var(--text-muted)] font-semibold">
                        Enter your WhatsApp Business credentials manually.
                      </p>
                      <Field label="Phone Number"
                        hint="Your WhatsApp Business Phone Number (e.g. +1 555-666-8582)">
                        <input type="text" value={whatsappDisplayPhone} onChange={e => setWhatsappDisplayPhone(e.target.value)}
                          placeholder="e.g. +1 555-666-8582"
                          className="form-input" />
                      </Field>
                      <Field label="Phone Number ID"
                        hint="Find this in Meta Business Manager → WhatsApp → Phone Numbers">
                        <input type="text" value={whatsappPhoneId} onChange={e => setWhatsappPhoneId(e.target.value)}
                          placeholder="Meta WhatsApp Phone Number ID"
                          className="form-input" />
                      </Field>
                      <Field label="Access Token"
                        hint="Your Custom System User Access Token. Leave blank to use server default key.">
                        <input type="password" value={whatsappAccessToken} onChange={e => setWhatsappAccessToken(e.target.value)}
                          placeholder="e.g. EAAS..."
                          className="form-input" />
                      </Field>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Telegram Channel Toggle and settings */}
            <ChannelToggle
              on={telegramEnabled && hasAdvancedChannels} onChange={(val) => {
                if (!hasAdvancedChannels) {
                  pushToast('Telegram is only available on the Growth plan. Please upgrade!', 'error');
                  return;
                }
                setTelegramEnabled(val);
              }}
              icon="✈️" title={hasAdvancedChannels ? "Telegram" : "Telegram 🔒"}
              desc="Connect this chatbot to a Telegram bot (Growth plan required)" />
            <AnimatePresence initial={false}>
              {telegramEnabled && hasAdvancedChannels && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden">
                  <div className="ml-1 pt-1 space-y-3">
                    <div className="p-3 rounded-xl border border-[var(--slate-border)] bg-white space-y-3">
                      <Field label="Telegram Bot Token" required={telegramEnabled}
                        hint="Create a bot via @BotFather on Telegram and copy the API token.">
                        <input type="text" required={telegramEnabled} value={telegramToken} onChange={e => setTelegramToken(e.target.value)}
                          placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="form-input" />
                      </Field>
                      <Field label="Bot Username (Optional)"
                        hint="Username of your Telegram bot (without the @ symbol)">
                        <input type="text" value={telegramBotUsername} onChange={e => setTelegramBotUsername(e.target.value)}
                          placeholder="e.g. MyCustomerSupportBot"
                          className="form-input" />
                      </Field>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Facebook / Instagram Channel Toggle and settings */}
            <ChannelToggle
              on={facebookEnabled && hasAdvancedChannels} onChange={(val) => {
                if (!hasAdvancedChannels) {
                  pushToast('Messenger & Instagram are only available on the Growth plan. Please upgrade!', 'error');
                  return;
                }
                setFacebookEnabled(val);
              }}
              icon="💬" title={hasAdvancedChannels ? "Messenger & Instagram" : "Messenger & Instagram 🔒"}
              desc="Connect to Facebook Messenger and Instagram Direct Messages (Growth plan required)" />
            <AnimatePresence initial={false}>
              {facebookEnabled && hasAdvancedChannels && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden">
                  <div className="ml-1 pt-1 space-y-3">
                    <div className="p-3 rounded-xl border border-[var(--slate-border)] bg-white space-y-3">
                      <Field label="Page ID" required={facebookEnabled}
                        hint="Facebook Page ID where Messenger is connected.">
                        <input type="text" required={facebookEnabled} value={facebookPageId} onChange={e => setFacebookPageId(e.target.value)}
                          placeholder="e.g. 1045239928172"
                          className="form-input" />
                      </Field>
                      <Field label="Page Access Token" required={facebookEnabled}
                        hint="Facebook Page Access Token (from Meta Developer portal).">
                        <input type="password" required={facebookEnabled} value={facebookPageAccessToken} onChange={e => setFacebookPageAccessToken(e.target.value)}
                          placeholder="Meta Page Access Token"
                          className="form-input" />
                      </Field>
                      <Field label="Instagram Account ID (Optional)"
                        hint="Link your business Instagram account ID to support Instagram DMs.">
                        <input type="text" value={instagramAccountId} onChange={e => setInstagramAccountId(e.target.value)}
                          placeholder="e.g. 178414002918281"
                          className="form-input" />
                      </Field>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* CRM & Webhooks */}
          <Section {...fadeUp} transition={{ delay: 0.25, duration: 0.35, ease }} icon="⚙️" title="CRM & Integrations" subtitle="Sync captured leads to external systems">
            {!hasCRM ? (
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 text-center space-y-3.5 my-1">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-200/50 flex items-center justify-center text-lg font-black mx-auto">🔒</div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[var(--text)]">CRM & Webhook Integrations Locked</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold max-w-sm mx-auto leading-relaxed">
                    Automatically sync captured leads directly to HubSpot and trigger custom webhook automation. Available on the **Growth** plan.
                  </p>
                </div>
                <button type="button" onClick={() => navigate('/dashboard/billing')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white border-none shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}>
                  Upgrade Subscription
                </button>
              </div>
            ) : (
              <>
                <Field label="HubSpot Private App Token"
                  hint="Get this from HubSpot settings -> Integrations -> Private Apps. Autoniv will push qualified leads automatically.">
                  <input type="password" value={hubspotToken} onChange={e => setHubspotToken(e.target.value)}
                    placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="form-input" />
                </Field>
                <Field label="Custom Webhook URL"
                  hint="Autoniv will POST a JSON payload to this URL when a lead is captured.">
                  <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://yourserver.com/api/autoniv-leads"
                    className="form-input" />
                </Field>
              </>
            )}
          </Section>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-sm text-rose-500 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => navigate('/dashboard/chatbots')}
              className="px-5 py-2.5 text-xs font-bold rounded-xl border border-[var(--slate-border)] text-[var(--text)] bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-cta inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none border-none"
              style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}>
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Chatbot'}
            </button>
          </div>
        </form>

        {/* Embed Code (shown after creation / in edit) */}
        {apiKey && embedCode && (
          <motion.div {...fadeUp} className="mt-6 rounded-2xl border border-[var(--slate-border)] bg-white/70 backdrop-blur-md p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, var(--primary-blue), #00c8b4)' }} />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🔗</span>
              <h2 className="text-sm font-black text-[var(--text)]">Embed Code</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold mb-3">
              Copy this snippet and paste it before the closing &lt;/body&gt; tag on your website.
            </p>
            <div className="bg-[var(--s1)] rounded-xl p-3.5 font-mono text-[11px] text-[var(--text)] break-all border border-[var(--slate-border)]">
              {embedCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(embedCode).then(
                () => pushToast('Embed code copied to clipboard'),
                () => pushToast('Could not copy code', 'error'),
              )}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold rounded-xl border border-[var(--slate-border)] text-[var(--primary-blue)] hover:bg-[var(--primary-blue-soft)] transition-all cursor-pointer bg-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Toasts ── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.22, ease }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 ${
                t.kind === 'success' ? 'bg-slate-900' : 'bg-rose-600'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${t.kind === 'success' ? 'bg-emerald-400' : 'bg-white'}`} />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children, ...motionProps }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode;
} & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div {...motionProps}
      className="rounded-2xl border border-[var(--slate-border)] bg-white/70 backdrop-blur-md p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-100 flex items-center justify-center text-base shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-black text-[var(--text)] leading-none">{title}</h2>
          {subtitle && <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-1">{hint}</p>}
    </div>
  );
}

function ChannelToggle({ on, onChange, icon, title, desc }: {
  on: boolean; onChange: (v: boolean) => void; icon: string; title: string; desc: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
        on ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-soft)]' : 'border-[var(--slate-border)] bg-white hover:border-slate-300'
      }`}>
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-bold text-[var(--text)]">{title}</span>
        <p className="text-[11px] text-[var(--text-muted)] font-semibold">{desc}</p>
      </div>
      <span className={`w-9 h-5 rounded-full transition-colors shrink-0 relative ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
