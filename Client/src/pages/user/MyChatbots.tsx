import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { chatbotService } from '../../services/api';

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
  channels: {
    whatsapp: {
      enabled: boolean;
      phoneNumberId: string | null;
      connectedAt?: string | null;
      displayPhoneNumber?: string | null;
    };
    widget: { enabled: boolean };
  };
  createdAt: string;
}

type Toast = { id: number; text: string; kind: 'success' | 'error' };

export function MyChatbots() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [limit, setLimit] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Chatbot | null>(null);
  const [deleting, setDeleting] = useState(false);
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
        if (active) setError('Failed to load chatbots');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const pushToast = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await chatbotService.delete(pendingDelete._id);
      setChatbots((prev) => prev.filter((c) => c._id !== pendingDelete._id));
      pushToast(`"${pendingDelete.name}" deleted`, 'success');
      setPendingDelete(null);
    } catch {
      pushToast('Failed to delete chatbot', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    // Optimistic flip; revert on failure.
    setChatbots((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: !current } : c)));
    try {
      await chatbotService.update(id, { isActive: !current });
    } catch {
      setChatbots((prev) => prev.map((c) => (c._id === id ? { ...c, isActive: current } : c)));
      pushToast('Failed to update chatbot', 'error');
    }
  }

  function copyEmbedCode(id: string) {
    const code = `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>`;
    navigator.clipboard.writeText(code).then(
      () => pushToast('Embed code copied to clipboard'),
      () => pushToast('Could not copy embed code', 'error'),
    );
  }

  const stats = useMemo(() => {
    const active = chatbots.filter((c) => c.isActive).length;
    const conversations = chatbots.reduce((sum, c) => sum + (c.conversationCount || 0), 0);
    const channels = chatbots.reduce(
      (n, c) => n + (c.channels?.whatsapp?.enabled ? 1 : 0) + (c.channels?.widget?.enabled ? 1 : 0),
      0,
    );
    return { active, conversations, channels };
  }, [chatbots]);

  const atLimit = limit !== -1 && chatbots.length >= limit;
  const limitLabel = limit === -1 ? '∞' : limit;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--slate-border)]" />
          <div className="absolute inset-0 rounded-full border-2 border-[var(--primary-blue)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-12 pr-1 scroll-smooth">
      <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--primary-blue)]" />
              <span className="text-[9px] font-black tracking-[0.24em] uppercase text-[var(--primary-blue)]">
                Chatbots
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[var(--text)] leading-none">My Chatbots</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-secondary)] font-semibold">
              Create and manage AI chatbots for WhatsApp and your website.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <CapacityMeter used={chatbots.length} limit={limit} label={limitLabel} />
            <Link
              to="/dashboard/chatbots/new"
              aria-disabled={atLimit}
              onClick={(e) => { if (atLimit) e.preventDefault(); }}
              className={`btn-cta inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all border-none whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-blue)] ${
                atLimit
                  ? 'opacity-40 cursor-not-allowed pointer-events-none'
                  : 'hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
              }`}
              style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}
              title={atLimit ? 'Plan limit reached — upgrade to add more' : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Chatbot
            </Link>
          </div>
        </motion.div>

        {/* ── Stat tiles ── */}
        {chatbots.length > 0 && (
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bots', value: chatbots.length, tint: 'from-blue-500/10 to-indigo-500/10', text: 'text-[var(--primary-blue)]', border: 'border-blue-100' },
              { label: 'Active', value: stats.active, tint: 'from-emerald-500/10 to-teal-500/10', text: 'text-emerald-600', border: 'border-emerald-100' },
              { label: 'Conversations', value: stats.conversations.toLocaleString(), tint: 'from-violet-500/10 to-purple-500/10', text: 'text-violet-600', border: 'border-violet-100' },
              { label: 'Live Channels', value: stats.channels, tint: 'from-amber-500/10 to-orange-500/10', text: 'text-amber-600', border: 'border-amber-100' },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.tint} p-4 relative overflow-hidden`}>
                <p className={`text-2xl font-black tracking-tight tabular-nums ${s.text}`}>{s.value}</p>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {error && (
          <motion.p variants={fadeUp} className="text-sm text-rose-500 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {error}
          </motion.p>
        )}

        {/* ── Empty state ── */}
        {chatbots.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="text-center py-20 rounded-2xl border border-[var(--slate-border)] bg-white/70 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial-gradient from-blue-500/5 to-transparent rounded-full pointer-events-none" />
            <SignalGlyph className="mx-auto mb-5" />
            <h2 className="text-lg font-black text-[var(--text)] mb-2">No chatbots yet</h2>
            <p className="text-sm text-[var(--text-secondary)] font-semibold mb-6 max-w-sm mx-auto leading-relaxed">
              Create your first chatbot to start engaging customers on WhatsApp and your website.
            </p>
            <Link
              to="/dashboard/chatbots/new"
              className="btn-cta inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all border-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-blue)]"
              style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}
            >
              Create Chatbot
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatbots.map((chatbot, i) => {
              const accent = chatbot.brandColor || '#2563EB';
              return (
                <motion.div
                  key={chatbot._id}
                  variants={fadeUp}
                  transition={{ delay: i * 0.04, duration: 0.35, ease }}
                  className="group rounded-2xl border border-[var(--slate-border)] bg-white/70 backdrop-blur-md p-5 flex flex-col relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-300"
                >
                  {/* accent top strip in bot's brand color */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, #00c8b4)` }} />

                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SignalAvatar name={chatbot.name} accent={accent} live={chatbot.isActive} />
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[var(--text)] truncate">{chatbot.name}</h3>
                        {chatbot.description && (
                          <p className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 line-clamp-1">{chatbot.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(chatbot._id, chatbot.isActive)}
                      className={`ml-2 w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer border-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-blue)] ${chatbot.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={chatbot.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${chatbot.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border ${
                        chatbot.isActive
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${chatbot.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {chatbot.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-bold tabular-nums">
                        {(chatbot.conversationCount || 0).toLocaleString()} chats
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <ChannelPill
                        on={chatbot.channels?.whatsapp?.enabled}
                        icon="📱"
                        label={
                          chatbot.channels?.whatsapp?.connectedAt
                            ? (chatbot.channels.whatsapp.displayPhoneNumber || 'WhatsApp · Connected')
                            : 'WhatsApp'
                        }
                      />
                      <ChannelPill on={chatbot.channels?.widget?.enabled} icon="🌐" label="Widget" />
                      <ChannelPill on={chatbot.channels?.telegram?.enabled} icon="✈️" label="Telegram" />
                      <ChannelPill on={chatbot.channels?.facebook?.enabled} icon="💬" label="Messenger" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/chatbots/${chatbot._id}`}
                      className="flex-1 text-center py-2 text-[11px] font-bold rounded-xl border border-[var(--slate-border)] text-[var(--text)] hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => copyEmbedCode(chatbot._id)}
                      className="flex-1 py-2 text-[11px] font-bold rounded-xl border border-[var(--slate-border)] text-[var(--primary-blue)] hover:bg-[var(--primary-blue-soft)] transition-all cursor-pointer"
                      title="Copy embed code"
                    >
                      Embed
                    </button>
                    <button
                      onClick={() => setPendingDelete(chatbot)}
                      className="py-2 px-3 text-[11px] font-bold rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete"
                      aria-label={`Delete ${chatbot.name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
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

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4"
            onClick={() => !deleting && setPendingDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-[var(--text)]">Delete chatbot?</h3>
                <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1.5 leading-relaxed">
                  <span className="font-black text-[var(--text)]">"{pendingDelete.name}"</span> and all of its conversations will be permanently removed. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-100">
                <button
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 border-none"
                >
                  {deleting && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${t.kind === 'success' ? 'bg-emerald-400' : 'bg-white'}`} />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Signature element: a signal-ring avatar. When the bot is live, two concentric
 * rings pulse outward from the initial — a quiet nod to a chatbot "listening"
 * for messages, reusing the brand's own accent color instead of a generic dot.
 */
function SignalAvatar({ name, accent, live }: { name: string; accent: string; live: boolean }) {
  return (
    <div className="relative w-10 h-10 shrink-0">
      {live && (
        <>
          <span
            className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ background: accent, animationDuration: '2.4s' }}
          />
          <span
            className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"
            style={{ boxShadow: `0 0 0 3px ${accent}22` }}
          />
        </>
      )}
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent}, #00c8b4)` }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

/** Empty-state glyph: three still concentric rings — a signal with no bots to carry it yet. */
function SignalGlyph({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/15 to-teal-500/15 border border-blue-100" />
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full" fill="none">
        <circle cx="32" cy="32" r="6" fill="var(--primary-blue)" />
        <circle cx="32" cy="32" r="14" stroke="var(--primary-blue)" strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="22" stroke="var(--primary-blue)" strokeOpacity="0.18" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/** Plan usage rendered as a segmented capacity track instead of a plain "x/y used" pill. */
function CapacityMeter({ used, limit, label }: { used: number; limit: number; label: string | number }) {
  const segments = limit === -1 ? 8 : Math.max(limit, used, 1);
  const filled = limit === -1 ? Math.min(used, segments) : used;

  return (
    <div className="hidden sm:flex flex-col items-end gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">
        {used}/{label} bots
      </span>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: Math.min(segments, 10) }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-3.5 rounded-full transition-colors ${
              i < filled ? 'bg-[var(--primary-blue)]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ChannelPill({ on, icon, label }: { on?: boolean; icon: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
        on
          ? 'bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] border-blue-100'
          : 'bg-slate-50 text-slate-400 border-slate-200'
      }`}
    >
      <span className={on ? '' : 'grayscale opacity-60'}>{icon}</span>
      {label}
      <span className={`ml-0.5 w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    </span>
  );
}