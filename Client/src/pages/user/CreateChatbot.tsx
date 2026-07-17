import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { chatbotService } from '../../services/api';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const PROMPT_SUGGESTIONS = [
  { label: 'Customer Support', prompt: 'You are a friendly customer support agent. Help users with their questions, troubleshoot issues, and escalate complex problems to a human agent. Be polite, patient, and solution-focused.' },
  { label: 'Sales Assistant', prompt: 'You are a helpful sales assistant. Answer product questions, explain pricing, highlight features, and guide users toward making a purchase. Be persuasive but not pushy.' },
  { label: 'Booking Agent', prompt: 'You are a booking assistant. Help users schedule appointments, check availability, and confirm bookings. Collect their name, phone, email, preferred date and time.' },
  { label: 'FAQ Bot', prompt: 'You are an FAQ bot. Answer common questions about our product/service. If you don\'t know the answer, politely let the user know and offer to connect them with a human agent.' },
  { label: 'Lead Qualifier', prompt: 'You are a lead qualification agent. Ask users about their needs, budget, timeline, and decision-making process. Collect their name, email, phone, and company. Save qualified leads for the sales team.' },
  { label: 'E-commerce Helper', prompt: 'You are an e-commerce assistant. Help users find products, check order status, process returns, and answer questions about shipping and payments.' },
];

export function CreateChatbot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can I help you today?');
  const [brandColor, setBrandColor] = useState('#0077ff');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      chatbotService.get(id).then(({ data }) => {
        const c = data.chatbot;
        setName(c.name);
        setDescription(c.description || '');
        setSystemPrompt(c.systemPrompt);
        setWelcomeMessage(c.welcomeMessage || 'Hi! How can I help you today?');
        setBrandColor(c.brandColor || '#0077ff');
        setWhatsappEnabled(c.channels?.whatsapp?.enabled || false);
        setWhatsappPhoneId(c.channels?.whatsapp?.phoneNumberId || '');
        setWidgetEnabled(c.channels?.widget?.enabled !== false);
        setApiKey(c.apiKey || '');
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
          whatsapp: { enabled: whatsappEnabled, phoneNumberId: whatsappPhoneId || undefined },
          widget: { enabled: widgetEnabled },
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const embedCode = id ? `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>` : '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{isEdit ? 'Edit Chatbot' : 'Create Chatbot'}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Configure your AI chatbot's personality and channels.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Basic Info</h2>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Name *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Support Bot, Sales Assistant"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this chatbot does"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
          </div>
        </motion.div>

        {/* AI Personality */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">AI Personality</h2>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map(s => (
                <button key={s.label} type="button"
                  onClick={() => setSystemPrompt(s.prompt)}
                  className="px-3 py-1 text-xs rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">System Prompt *</label>
            <textarea required rows={6} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Describe your chatbot's personality, tone, and what it should do..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none" />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{systemPrompt.length} / 10,000 characters</p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Welcome Message</label>
            <input type="text" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)}
              placeholder="Hi! How can I help you today?"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Appearance</h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Brand Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer" />
                <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  className="w-24 px-2 py-1 text-xs rounded bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Channels */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Channels</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={widgetEnabled} onChange={e => setWidgetEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" />
            <div>
              <span className="text-sm font-medium text-[var(--text)]">🌐 Website Widget</span>
              <p className="text-[10px] text-[var(--text-muted)]">Embed on any website with a script tag</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={whatsappEnabled} onChange={e => setWhatsappEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" />
            <div>
              <span className="text-sm font-medium text-[var(--text)]">📱 WhatsApp</span>
              <p className="text-[10px] text-[var(--text-muted)]">Reply to WhatsApp messages with this chatbot</p>
            </div>
          </label>

          {whatsappEnabled && (
            <div className="ml-7">
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Phone Number ID</label>
              <input type="text" value={whatsappPhoneId} onChange={e => setWhatsappPhoneId(e.target.value)}
                placeholder="Meta WhatsApp Phone Number ID"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]" />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Find this in Meta Business Manager → WhatsApp → Phone Numbers</p>
            </div>
          )}
        </motion.div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/dashboard/chatbots')}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--s1)] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--primary)' }}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Chatbot'}
          </button>
        </div>
      </form>

      {/* Embed Code (shown after creation) */}
      {apiKey && embedCode && (
        <motion.div {...fadeUp} className="mt-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="text-sm font-bold text-[var(--text)] mb-2">Embed Code</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">Copy this code and paste it before the closing &lt;/body&gt; tag on your website.</p>
          <div className="bg-[var(--s1)] rounded-lg p-3 font-mono text-xs text-[var(--text)] break-all">{embedCode}</div>
          <button onClick={() => navigator.clipboard.writeText(embedCode).then(() => alert('Copied!'))}
            className="mt-2 px-3 py-1 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--s1)] transition-colors">
            Copy Code
          </button>
        </motion.div>
      )}
    </div>
  );
}
