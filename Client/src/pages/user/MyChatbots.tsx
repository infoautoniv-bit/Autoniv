import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/useStore';
import { chatbotService, apiKeyService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { getMaxChatbots } from '../../utils/plan';

// ── Constants ──────────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'zh', label: '🇨🇳 Chinese' },
];

const CHATBOT_TYPES = [
  {
    value: 'receptionist',
    label: 'Receptionist',
    desc: 'Greets visitors and captures basic details',
    accent: '#2563EB',
    icon: '👋',
  },
  {
    value: 'appointment',
    label: 'Scheduler',
    desc: 'Automates scheduling and books slots',
    accent: '#059669',
    icon: '📅',
  },
  {
    value: 'faq',
    label: 'FAQ Support',
    desc: 'Answers questions from your business knowledge base',
    accent: '#7C3AED',
    icon: '💬',
  },
];

interface Chatbot {
  id: string;
  name: string;
  type: 'receptionist' | 'appointment' | 'faq';
  prompt: string;
  language: string;
  isActive: boolean;
  useCustomEngine: boolean;
  customEngineModel: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: 'easeIn' as const } },
};

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
};

export function MyChatbots() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { add: addToast } = useToast();

  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(true);

  // Form & UI States
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState<Chatbot | null>(null);
  const [embedTarget, setEmbedTarget] = useState<Chatbot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('receptionist');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);

  // Load API key and chatbots
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await chatbotService.getMy({ page: 1, limit: 50 });
      setChatbots(res.data.items || []);
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to load chatbots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const fetchKey = async () => {
      try {
        setApiKeyLoading(true);
        const { data } = await apiKeyService.get();
        if (data.apiKey) setApiKey(data.apiKey);
      } catch (err) {
        console.error('Failed to load API key:', err);
      } finally {
        setApiKeyLoading(false);
      }
    };
    fetchKey();
  }, []);

  const maxChatbots = user ? getMaxChatbots(user) : 3;
  const atLimit = maxChatbots !== -1 ? chatbots.length >= maxChatbots : false;

  const handleOpenCreate = () => {
    if (atLimit) {
      addToast(
        `Your plan limits you to ${maxChatbots} chatbot${maxChatbots > 1 ? 's' : ''}. Upgrade to create more.`,
        'error',
        { label: 'Upgrade', onClick: () => navigate('/dashboard/billing') }
      );
      return;
    }
    setName('');
    setType('receptionist');
    setPrompt('');
    setLanguage('en');
    setCreatePanelOpen(true);
  };

  const handleOpenEdit = (bot: Chatbot) => {
    setEditingChatbot(bot);
    setName(bot.name);
    setType(bot.type);
    setPrompt(bot.prompt || '');
    setLanguage(bot.language || 'en');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a chatbot name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await chatbotService.create({
        name: name.trim(),
        type,
        prompt: prompt.trim() || undefined,
        language,
        useCustomEngine: true,
      });
      addToast('Chatbot created successfully!', 'success');
      setCreatePanelOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to create chatbot', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChatbot) return;
    if (!name.trim()) {
      addToast('Please enter a chatbot name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await chatbotService.update(editingChatbot.id, {
        name: name.trim(),
        type,
        prompt: prompt.trim() || undefined,
        language,
      });
      addToast('Chatbot updated successfully!', 'success');
      setEditingChatbot(null);
      loadData();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to update chatbot', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (bot: Chatbot, nextActive: boolean) => {
    try {
      setChatbots(prev => prev.map(b => b.id === bot.id ? { ...b, isActive: nextActive } : b));
      await chatbotService.toggleActive(bot.id, nextActive);
      addToast(`Chatbot ${nextActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (err: any) {
      addToast('Failed to toggle status', 'error');
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await chatbotService.delete(id);
      addToast('Chatbot deleted successfully', 'success');
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      addToast('Failed to delete chatbot', 'error');
    }
  };

  const getEmbedCode = (botId: string) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const finalKey = apiKey || 'YOUR_API_KEY';
    return `<script src="${apiBase}/widget/widget.js"
  data-api-key="${finalKey}"
  data-agent-id="${botId}"
  data-position="bottom-right">
</script>`;
  };

  return (
    <>
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6 pb-24 sm:pb-10 relative">
        {/* Auroras */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

        {/* Page Header */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 pt-1 relative z-10">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold tracking-[0.25em] uppercase gradient-text mb-1.5">◈ Multi-Agent Chat Widget</p>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-none text-slate-800">My Chatbots</h1>
            <p className="mt-2 text-xs font-semibold leading-normal text-slate-500">
              Create and manage multiple text chatbots. Embed them anywhere on your websites or applications using unique embed scripts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={atLimit}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer border-none text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 ${
              atLimit ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Chatbot
          </button>
        </motion.div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <svg className="animate-spin w-8 h-8 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-bold tracking-wider uppercase">Loading Chatbots...</span>
          </div>
        ) : chatbots.length === 0 ? (
          <motion.div variants={fadeUp} className="rounded-3xl border border-slate-200 bg-white/70 p-12 text-center backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl mx-auto mb-4">🤖</div>
            <h3 className="font-extrabold text-base text-slate-800">No Chatbots Yet</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-sm mx-auto">
              Configure your first AI website chatbot to engage visitors, capture lead details, and book calendar meetings 24/7.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all border-none cursor-pointer"
            >
              Get Started
            </button>
          </motion.div>
        ) : (
          <motion.div variants={stagger.container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {chatbots.map((bot) => {
              const chatbotTypeObj = CHATBOT_TYPES.find(t => t.value === bot.type) || CHATBOT_TYPES[0];
              const langLabel = LANGUAGE_OPTIONS.find(l => l.value === bot.language)?.label || '🇺🇸 English';

              return (
                <motion.div
                  key={bot.id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="relative rounded-[24px] overflow-hidden border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] bg-white/80 backdrop-blur-xl transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500 to-indigo-600" />
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-xl shadow-inner shrink-0">
                          {chatbotTypeObj.icon}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-[15px] text-slate-800 leading-tight">{bot.name}</h3>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mt-0.5">
                            {chatbotTypeObj.label}
                          </span>
                        </div>
                      </div>

                      {/* Active switch */}
                      <button
                        onClick={() => handleToggleActive(bot, !bot.isActive)}
                        className="relative w-10 h-5.5 rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer border-none"
                        style={{ background: bot.isActive ? '#10B981' : '#cbd5e1' }}
                      >
                        <motion.div
                          layout
                          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                          className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full"
                          animate={{ x: bot.isActive ? 18 : 0 }}
                        />
                      </button>
                    </div>

                    {/* Prompt instructions */}
                    <div className="mb-5 min-h-[48px]">
                      {bot.prompt ? (
                        <p className="text-[11px] line-clamp-3 leading-relaxed font-semibold text-slate-500">
                          {bot.prompt}
                        </p>
                      ) : (
                        <p className="text-[11px] italic leading-relaxed text-slate-400">
                          No custom instructions configured. Using default assistant rules.
                        </p>
                      )}
                    </div>

                    {/* Badge details */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        bot.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bot.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600">
                        {langLabel}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
                      <button
                        onClick={() => setEmbedTarget(bot)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide rounded-xl cursor-pointer border-none text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                        Get Script
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(bot)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-[var(--primary-blue)] hover:border-[var(--primary-blue-soft)] transition-colors cursor-pointer"
                          title="Edit Chatbot"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingId(bot.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-colors cursor-pointer"
                          title="Delete Chatbot"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* ── CREATE MODAL ── */}
      <AnimatePresence>
        {createPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3.5 border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Create New Chatbot</h3>
                <button onClick={() => setCreatePanelOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chatbot Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Receptionist"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Chatbot Objective / Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CHATBOT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          type === t.value
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'bg-slate-50/50 border-slate-150 text-slate-600'
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Instructions (Prompt)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Enter instructions for the AI chatbot's behavior..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-[var(--primary-blue)] hover:opacity-90 transition-all border-none cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Chatbot'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editingChatbot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3.5 border-slate-100">
                <h3 className="font-extrabold text-base text-slate-800">Edit Chatbot Settings</h3>
                <button onClick={() => setEditingChatbot(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chatbot Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Receptionist"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chatbot Objective / Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CHATBOT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          type === t.value
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'bg-slate-50/50 border-slate-150 text-slate-600'
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Instructions (Prompt)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Enter instructions for the AI chatbot's behavior..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-[var(--primary-blue)] hover:opacity-90 transition-all border-none cursor-pointer"
                >
                  {submitting ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EMBED SCRIPT MODAL ── */}
      <AnimatePresence>
        {embedTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3.5 border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Copy Widget Script</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{embedTarget.name}</p>
                </div>
                <button onClick={() => setEmbedTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                <p className="text-slate-500 text-xs leading-relaxed">
                  Paste this script tag into the HTML code of your website (before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">&lt;/body&gt;</code> tag) to show the chat bubble.
                </p>

                {apiKeyLoading ? (
                  <div className="bg-slate-900 text-slate-400 rounded-xl p-4 font-mono text-[10.5px]">
                    Loading API credential...
                  </div>
                ) : (
                  <div className="bg-slate-900 text-green-400 rounded-xl p-4 font-mono text-[10.5px] overflow-x-auto select-all leading-normal">
                    <code>{getEmbedCode(embedTarget.id)}</code>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getEmbedCode(embedTarget.id));
                      addToast('Embed script copied to clipboard!', 'success');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--primary-blue)] hover:opacity-90 transition-all border-none cursor-pointer"
                  >
                    Copy Embed Code
                  </button>
                  <button
                    onClick={() => setEmbedTarget(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border-none cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE MODAL ── */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl mx-auto">⚠️</div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Delete Chatbot?</h3>
                <p className="text-slate-500 text-xs mt-1.5">
                  Are you sure you want to permanently delete this chatbot configuration? This cannot be undone.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all border-none cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
