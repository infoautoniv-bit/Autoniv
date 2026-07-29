import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../../services/api';
import ActiveAddOnsBanner from '../../components/ActiveAddOnsBanner';

const ease = [0.16, 1, 0.3, 1] as const;
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

interface Chatbot {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  conversationCount: number;
  brandColor?: string;
  brandLogo?: string;
  channels: {
    whatsapp: {
      enabled: boolean;
      phoneNumberId: string | null;
      connectedAt?: string | null;
      displayPhoneNumber?: string | null;
      verifiedName?: string | null;
    };
    widget: { enabled: boolean };
    telegram?: {
      enabled: boolean;
      token?: string | null;
      botUsername?: string | null;
    };
    facebook?: {
      enabled: boolean;
      pageId?: string | null;
      pageAccessToken?: string | null;
      instagramAccountId?: string | null;
    };
  };
  createdAt: string;
}

type Toast = { id: number; text: string; kind: 'success' | 'error' };

export function MyChatbots() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [limit, setLimit] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive' | 'whatsapp' | 'widget'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Chatbot | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await chatbotService.list({ limit: 50 });
        if (!active) return;
        setChatbots(data.chatbots || []);
        if (typeof data.limit === 'number') setLimit(data.limit);
      } catch {
        if (active) setError('Failed to load chatbots list');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null); // Close modal instantly from UI

    // Optimistic UI deletion in 0ms!
    setChatbots((prev) => prev.filter((c) => c._id !== target._id));
    pushToast(`"${target.name}" deleted successfully`, 'success');

    // Run HTTP delete in background without blocking UI
    try {
      await chatbotService.delete(target._id);
    } catch {
      pushToast('Failed to delete chatbot from server', 'error');
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setChatbots((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: !current } : c)));
    try {
      await chatbotService.update(id, { isActive: !current });
      pushToast(!current ? 'Chatbot activated' : 'Chatbot paused');
    } catch {
      setChatbots((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: current } : c)));
      pushToast('Failed to update status', 'error');
    }
  }

  function copyEmbedCode(id: string) {
    const code = `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>`;
    navigator.clipboard.writeText(code).then(
      () => pushToast('Embed script code copied to clipboard!'),
      () => pushToast('Could not copy embed code', 'error'),
    );
  }

  const stats = useMemo(() => {
    const active = chatbots.filter((c) => c.isActive).length;
    const conversations = chatbots.reduce((sum, c) => sum + (c.conversationCount || 0), 0);
    const channels = chatbots.reduce(
      (n, c) =>
        n +
        (c.channels?.whatsapp?.enabled ? 1 : 0) +
        (c.channels?.widget?.enabled !== false ? 1 : 0) +
        (c.channels?.telegram?.enabled ? 1 : 0) +
        (c.channels?.facebook?.enabled ? 1 : 0),
      0,
    );
    return { active, conversations, channels };
  }, [chatbots]);

  const filteredChatbots = useMemo(() => {
    return chatbots.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === 'active') return c.isActive;
      if (filterTab === 'inactive') return !c.isActive;
      if (filterTab === 'whatsapp') return Boolean(c.channels?.whatsapp?.enabled);
      if (filterTab === 'widget') return Boolean(c.channels?.widget?.enabled !== false);
      return true;
    });
  }, [chatbots, searchQuery, filterTab]);

  const atLimit = limit !== -1 && chatbots.length >= limit;
  const limitLabel = limit === -1 ? '∞' : limit;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading AI Chatbots…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-16 pr-1 scroll-smooth">
      <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* ── TOP HERO HEADER ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#2563EB] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                AI Chatbot Automation Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              My AI Chatbots
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
              Build, deploy, and monitor custom conversational AI assistants across your website, WhatsApp Business, Telegram, and Social DM channels.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <CapacityMeter used={chatbots.length} limit={limit} label={limitLabel} />
            <Link
              to="/dashboard/chatbots/new"
              aria-disabled={atLimit}
              onClick={(e) => {
                if (atLimit) e.preventDefault();
              }}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all border-none whitespace-nowrap cursor-pointer ${
                atLimit ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
              style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}
            >
              <span className="text-sm">✨</span>
              <span>Create New Chatbot</span>
            </Link>
          </div>
        </motion.div>

        {/* ── ACTIVE ADD-ONS BANNER ── */}
        <motion.div variants={fadeUp}>
          <ActiveAddOnsBanner filterIds={['whatsapp-channel', 'advanced-analytics', 'white-label-reseller']} />
        </motion.div>

        {/* ── METRIC STAT TILES (4 Cards) ── */}
        {chatbots.length > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🤖</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB]">
                  Total Bots
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tabular-nums">{chatbots.length}</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Configured Assistants</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚡</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Live Active
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#10B981] tabular-nums">{stats.active}</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Online & Responding</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl">💬</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                  Total Chats
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-violet-600 tabular-nums">
                  {stats.conversations.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Conversations Handled</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔗</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  Endpoints
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums">{stats.channels}</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Live Channel Connectors</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SEARCH & FILTER TOOLBAR ── */}
        {chatbots.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
              {(
                [
                  { id: 'all', label: 'All Bots' },
                  { id: 'active', label: 'Active 🟢' },
                  { id: 'inactive', label: 'Paused ⚪' },
                  { id: 'whatsapp', label: 'WhatsApp 📱' },
                  { id: 'widget', label: 'Widget 🌐' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    filterTab === tab.id
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#0F172A] hover:bg-slate-100/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chatbots by name…"
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.p variants={fadeUp} className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
            ⚠️ {error}
          </motion.p>
        )}

        {/* ── EMPTY STATE ── */}
        {chatbots.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="text-center py-20 rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 relative overflow-hidden space-y-5"
          >
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#2563EB] flex items-center justify-center text-3xl font-extrabold mx-auto shadow-inner">
              🤖
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-extrabold text-[#0F172A]">No Chatbots Created Yet</h2>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Build your first AI assistant in under 2 minutes. Automate customer inquiries, schedule appointments, and capture qualified leads 24/7.
              </p>
            </div>
            <Link
              to="/dashboard/chatbots/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all border-none"
              style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}
            >
              <span>✨</span>
              <span>Create Your First Chatbot</span>
            </Link>
          </motion.div>
        ) : filteredChatbots.length === 0 ? (
          <motion.div variants={fadeUp} className="text-center py-16 rounded-3xl border border-slate-200 bg-white space-y-3">
            <span className="text-3xl">🔎</span>
            <h3 className="text-sm font-extrabold text-[#0F172A]">No Chatbots Match Your Search</h3>
            <p className="text-xs text-slate-500 font-medium">Try resetting your search query or filter tabs.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="px-4 py-2 text-xs font-extrabold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer border-none"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          /* ── CHATBOT CARDS GRID ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChatbots.map((chatbot, i) => {
              const accent = chatbot.brandColor || '#2563EB';
              return (
                <motion.div
                  key={chatbot._id}
                  variants={fadeUp}
                  transition={{ delay: i * 0.04, duration: 0.35, ease }}
                  className="group rounded-3xl border border-slate-200/90 bg-white p-6 flex flex-col relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300"
                >
                  {/* Accent Top Color Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${accent}, #10B981)` }}
                  />

                  {/* Header Row: Avatar, Name & Live Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-4 mt-1">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <SignalAvatar name={chatbot.name} accent={accent} live={chatbot.isActive} logo={chatbot.brandLogo} />
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-[#0F172A] truncate tracking-tight">{chatbot.name}</h3>
                        {chatbot.description ? (
                          <p className="text-xs text-slate-500 font-semibold mt-0.5 line-clamp-1">{chatbot.description}</p>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-semibold mt-0.5 italic">No description set</p>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle(chatbot._id, chatbot.isActive)}
                      className={`ml-2 w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer border-none relative focus:outline-none ${
                        chatbot.isActive ? 'bg-[#10B981]' : 'bg-slate-300'
                      }`}
                      title={chatbot.isActive ? 'Deactivate Chatbot' : 'Activate Chatbot'}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform absolute top-0.5 ${
                          chatbot.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status & Stats Row */}
                  <div className="flex-1 space-y-3.5 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          chatbot.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            chatbot.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {chatbot.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-slate-500 font-bold tabular-nums">
                        💬 {(chatbot.conversationCount || 0).toLocaleString()} chats
                      </span>
                    </div>

                    {/* Omnichannel Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <ChannelPill type="whatsapp" on={chatbot.channels?.whatsapp?.enabled} />
                      <ChannelPill type="widget" on={chatbot.channels?.widget?.enabled !== false} />
                      <ChannelPill type="telegram" on={chatbot.channels?.telegram?.enabled} />
                      <ChannelPill type="messenger" on={chatbot.channels?.facebook?.enabled} />
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Link
                      to={`/dashboard/chatbots/${chatbot._id}`}
                      className="flex-1 text-center py-2.5 px-3 text-xs font-extrabold rounded-2xl border border-slate-200 text-[#0F172A] bg-white hover:bg-slate-50 transition-all shadow-xs"
                    >
                      Edit Studio
                    </Link>
                    <button
                      type="button"
                      onClick={() => copyEmbedCode(chatbot._id)}
                      className="flex-1 py-2.5 px-3 text-xs font-extrabold rounded-2xl border border-blue-200 text-[#2563EB] bg-blue-50/70 hover:bg-blue-100 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      title="Copy embed script tag"
                    >
                      <span>Embed</span>
                      <span>🔗</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(chatbot)}
                      className="p-2.5 text-xs font-extrabold rounded-2xl border border-rose-200 text-rose-600 bg-rose-50/60 hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
                      title="Delete Chatbot"
                      aria-label={`Delete ${chatbot.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-1 0v12a1 1 0 01-1 1H10a1 1 0 01-1-1V7" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPendingDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-xl font-black">
                🗑️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#0F172A]">Delete chatbot?</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  <span className="font-extrabold text-[#0F172A]">"{pendingDelete.name}"</span> and all logged conversation transcripts will be permanently removed.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer flex items-center justify-center gap-2 border-none shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.22, ease }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold text-white shadow-xl flex items-center gap-2.5 ${
                t.kind === 'success' ? 'bg-[#0F172A] border border-slate-800' : 'bg-rose-600'
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

function SignalAvatar({ name, accent, live, logo }: { name: string; accent: string; live: boolean; logo?: string }) {
  return (
    <div className="relative w-11 h-11 shrink-0">
      {live && (
        <span
          className="absolute inset-0 rounded-2xl animate-ping opacity-25"
          style={{ background: accent, animationDuration: '2.4s' }}
        />
      )}
      <div
        className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-md overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}, #10B981)` }}
      >
        {logo ? (
          <img src={logo} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
    </div>
  );
}

function CapacityMeter({ used, limit, label }: { used: number; limit: number; label: string | number }) {
  const segments = limit === -1 ? 8 : Math.max(limit, used, 1);
  const filled = limit === -1 ? Math.min(used, segments) : used;

  return (
    <div className="hidden sm:flex flex-col items-end gap-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {used} / {label} chatbots
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(segments, 8) }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-4 rounded-full transition-colors ${
              i < filled ? 'bg-[#2563EB]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ChannelPill({ type, on }: { type: 'whatsapp' | 'widget' | 'telegram' | 'messenger'; on?: boolean }) {
  const configs = {
    whatsapp: { icon: '📱', label: 'WhatsApp', activeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotStyle: 'bg-emerald-500' },
    widget: { icon: '🌐', label: 'Widget', activeStyle: 'bg-blue-50 text-[#2563EB] border-blue-200', dotStyle: 'bg-[#2563EB]' },
    telegram: { icon: '✈️', label: 'Telegram', activeStyle: 'bg-sky-50 text-sky-700 border-sky-200', dotStyle: 'bg-sky-500' },
    messenger: { icon: '💬', label: 'Messenger', activeStyle: 'bg-violet-50 text-violet-700 border-violet-200', dotStyle: 'bg-violet-500' },
  };

  const cfg = configs[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
        on ? cfg.activeStyle : 'bg-slate-50 text-slate-400 border-slate-200/80 opacity-60'
      }`}
    >
      <span className={on ? '' : 'grayscale opacity-50'}>{cfg.icon}</span>
      <span>{cfg.label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? cfg.dotStyle : 'bg-slate-300'}`} />
    </span>
  );
}

export default MyChatbots;