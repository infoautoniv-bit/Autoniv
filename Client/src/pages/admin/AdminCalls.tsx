import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAllCalls, syncCalls } from '../../store/slices/callsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import type { Call } from '../../types';

// ─── Animation presets ────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const avatarPalette = [
  '#2563eb', '#10B981', '#00A3FF', '#14B8A6', '#8b5cf6', '#f59e0b',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

// ─── Animated Counter ─────────────────────────────────────────────────
const AnimatedCounter = memo(({ value, className = '' }: { value: number; className?: string }) => {
  const [display, setDisplay] = useState(0);
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    if (prefersReduced) { setDisplay(value); return; }
    let frame = 0;
    const total = 35;
    const tick = () => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(Math.round(eased * value));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, prefersReduced]);
  return <span className={className}>{display.toLocaleString()}</span>;
});

const statusConfig: Record<string, { label: string; pillBg: string; pillBorder: string; text: string; dot: string }> = {
  completed:   { label: 'Completed',   pillBg: 'rgba(16,185,129,0.08)', pillBorder: 'rgba(16,185,129,0.20)', text: '#10B981', dot: '#10B981' },
  missed:      { label: 'Missed',      pillBg: 'rgba(245,158,11,0.08)', pillBorder: 'rgba(245,158,11,0.20)', text: '#f59e0b', dot: '#f59e0b' },
  'in-progress': { label: 'In Progress', pillBg: 'rgba(37,99,235,0.08)', pillBorder: 'rgba(37,99,235,0.20)', text: '#2563eb', dot: '#2563eb' },
  failed:      { label: 'Failed',      pillBg: 'rgba(239,68,68,0.08)', pillBorder: 'rgba(239,68,68,0.20)', text: '#ef4444', dot: '#ef4444' },
};

const fallbackStatus = {
  label: 'Unknown',
  pillBg: 'rgba(100,100,100,0.08)',
  pillBorder: 'rgba(100,100,100,0.20)',
  text: '#666666',
  dot: '#666666',
};

const FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'failed', label: 'Failed' },
];

const RECORDING_FILTERS = [
  { value: 'all', label: 'All Calls' },
  { value: 'custom', label: 'Custom Recordings' },
  { value: 'vapi', label: 'Vapi Recordings' },
  { value: 'none', label: 'No Recording' },
];

function formatDuration(call: Call): string {
  if (call.startedAt && call.endedAt) {
    const diff = Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  }
  if (call.duration > 0) {
    const d = call.duration;
    if (d < 60) return `${d}s`;
    const m = Math.floor(d / 60);
    const s = d % 60;
    return `${m}m ${s}s`;
  }
  return '—';
}

// ─── Call Detail Modal ────────────────────────────────────────────────
function CallDetailModal({ 
  call, 
  open, 
  onClose 
}: { 
  call: Call | null; 
  open: boolean; 
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && call && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-[var(--surface)] border border-[var(--border)]/30 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-[var(--primary)]/20 max-h-[90vh] sm:max-h-[85vh]"
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-blue-200 mx-auto mt-3" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                  style={{ background: getAvatarColor(call.agentName || call.userName || 'C') }}
                >
                  {(call.agentName || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#2563eb]">Call Details</p>
                  <h2 className="text-sm font-extrabold text-slate-800 leading-tight truncate">{call.agentName || 'Unknown Agent'}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {call.startedAt ? new Date(call.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown date'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {[
                  { label: 'Agent', value: call.agentName || '—' },
                  { label: 'User', value: call.userName || '—' },
                  { label: 'Caller', value: call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : '—', mono: true },
                  { label: 'Duration', value: formatDuration(call) },
                  { label: 'Status', value: (statusConfig[call.status] ?? fallbackStatus).label },
                  { label: 'Vapi ID', value: call.vapiCallId || '—', mono: true },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50/60 border border-slate-100 px-3.5 py-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-semibold text-slate-700 block truncate ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Recording */}
              {call.recordingUrl && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Recording</p>
                    {call.recordingUrl.startsWith('/api/recordings/') && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-[#10B981] border border-[#10B981]/20">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 px-4 py-3">
                    <audio 
                      controls 
                      className="w-full" 
                      src={call.recordingUrl.startsWith('http') ? call.recordingUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${call.recordingUrl}`}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {call.transcript && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Transcript</p>
                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 px-4 py-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {call.transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer sm:hidden"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AdminCalls() {
  const dispatch = useAppDispatch();
  const calls = useAppSelector((state) => state.calls.items);
  const loading = useAppSelector((state) => state.calls.loading);
  const pagination = useAppSelector((state) => state.calls.pagination);
  const [filter, setFilter] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [recordingFilter, setRecordingFilter] = useState<'all' | 'custom' | 'vapi' | 'none'>('all');
  const [syncing, setSyncing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    dispatch(fetchAllCalls({ status: filter || undefined, page, limit: 20 }));
  }, [dispatch, filter, page]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await dispatch(syncCalls()).unwrap();
      await dispatch(fetchAllCalls({ page, limit: 20 }));
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredCalls = calls.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.agentName || '').toLowerCase().includes(q)
      || (c.userName || '').toLowerCase().includes(q)
      || (c.callerNumber || '').toLowerCase().includes(q);
  }).filter((c) => {
    if (recordingFilter === 'all') return true;
    const isCustom = c.recordingUrl?.startsWith('/api/recordings/');
    const isVapi = c.recordingUrl && !isCustom;
    if (recordingFilter === 'custom') return !!isCustom;
    if (recordingFilter === 'vapi') return !!isVapi;
    if (recordingFilter === 'none') return !c.recordingUrl;
    return true;
  });

  const stats = {
    total: calls.length,
    completed: calls.filter((c) => c.status === 'completed').length,
    missed: calls.filter((c) => c.status === 'missed').length,
    failed: calls.filter((c) => c.status === 'failed').length,
  };

  const openDetail = (call: Call) => {
    setSelectedCall(call);
    setDetailOpen(true);
  };

  const columns: Column<Call>[] = [
    {
      key: 'startedAt',
      header: 'Date',
      sortable: true,
      render: (call) => {
        const date = call.startedAt ? new Date(call.startedAt) : null;
        return (
          <div>
            <div className="text-xs font-bold text-slate-700 tabular-nums">
              {date ? date.toLocaleDateString() : '—'}
            </div>
            <div className="text-[10px] text-slate-400 tabular-nums">
              {date ? date.toLocaleTimeString() : ''}
            </div>
          </div>
        );
      },
      card: {
        label: 'Date',
        render: (call) => (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            {call.startedAt ? new Date(call.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </span>
        ),
      },
    },
    {
      key: 'agentName',
      header: 'Agent',
      sortable: true,
      render: (call) => {
        const name = call.agentName || 'Unknown';
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(name) }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                {call.agentName || '—'}
              </div>
            </div>
          </div>
        );
      },
      card: {
        label: 'Agent',
        render: (call) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(call.agentName || 'C') }}
            >
              {(call.agentName || 'C').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate">{call.agentName || '—'}</span>
          </div>
        ),
      },
    },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (call) => (
        <span className="text-xs text-slate-600 truncate">{call.userName || '—'}</span>
      ),
      card: {
        label: 'User',
        render: (call) => (
          <span className="text-sm text-slate-600 truncate">{call.userName || '—'}</span>
        ),
      },
    },
    {
      key: 'callerNumber',
      header: 'Caller',
      sortable: true,
      render: (call) => (
        <span className="font-mono text-xs text-slate-600">
          {call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : '—'}
        </span>
      ),
      card: {
        label: 'Caller',
        render: (call) => (
          <span className="font-mono text-sm text-slate-700">
            {call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : '—'}
          </span>
        ),
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (call) => (
        <span className="text-xs font-bold text-slate-700 tabular-nums">{formatDuration(call)}</span>
      ),
      card: {
        label: 'Duration',
        render: (call) => (
          <span className="text-sm font-bold text-slate-700 tabular-nums">{formatDuration(call)}</span>
        ),
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (call) => {
        const sc = statusConfig[call.status] ?? fallbackStatus;
        const isCustomRecording = call.recordingUrl?.startsWith('/api/recordings/');
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              call.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              call.status === 'missed' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              call.status === 'in-progress' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                call.status === 'completed' ? 'bg-[#10B981]' :
                call.status === 'missed' ? 'bg-[#f59e0b]' :
                call.status === 'in-progress' ? 'bg-[#2563eb]' :
                'bg-[#ef4444]'
              }`}/>
              {sc.label}
            </span>
            {isCustomRecording && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-[#10B981] border border-[#10B981]/20">
                REC
              </span>
            )}
          </div>
        );
      },
      card: {
        label: 'Status',
        render: (call) => {
          const sc = statusConfig[call.status] ?? fallbackStatus;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              call.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              call.status === 'missed' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              call.status === 'in-progress' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                call.status === 'completed' ? 'bg-[#10B981]' :
                call.status === 'missed' ? 'bg-[#f59e0b]' :
                call.status === 'in-progress' ? 'bg-[#2563eb]' :
                'bg-[#ef4444]'
              }`}/>
              {sc.label}
            </span>
          );
        },
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ TELEPHONY
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Calls
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">All Calls</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-sm cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gg, linear-gradient(135deg,#2563eb 0%,#10b981 100%))' }}
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? 'Syncing…' : 'Sync from Vapi'}
          </motion.button>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Calls',   value: stats.total,     accentColor: '37,99,235',   colorHex: '#2563EB', delta: 'All calls' },
            { label: 'Completed',     value: stats.completed, accentColor: '16,185,129',  colorHex: '#10B981', delta: 'Successfully completed', trend: 'up' as const },
            { label: 'Missed',        value: stats.missed,    accentColor: '245,158,11',  colorHex: '#f59e0b', delta: 'Missed calls' },
            { label: 'Failed',        value: stats.failed,    accentColor: '239,68,68',   colorHex: '#ef4444', delta: 'Failed calls' },
          ].map((s) => {
            const isHov = hoveredCard === s.label;
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={spring}
                onMouseEnter={() => setHoveredCard(s.label)}
                onMouseLeave={() => setHoveredCard(null)}
                className="rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 bg-white/70 shadow-sm backdrop-blur-md cursor-default"
                style={{
                  borderColor: isHov ? `rgba(${s.accentColor},0.3)` : '#e2e8f0',
                  boxShadow: isHov ? `0 12px 36px rgba(${s.accentColor},0.08)` : '0 1px 3px rgba(37,99,235,0.01)',
                }}
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                  animate={{ opacity: isHov ? 1 : 0, scale: isHov ? 1 : 0.8 }}
                  transition={{ duration: 0.35 }}
                  style={{ background: `radial-gradient(circle, rgba(${s.accentColor},0.08) 0%, transparent 70%)` }}
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3 relative z-10">{s.label}</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <p className="text-2xl sm:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
                    <AnimatedCounter value={s.value} />
                  </p>
                  {s.trend && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-green-600 bg-green-50">
                      ↑ {s.delta}
                    </span>
                  )}
                </div>
                {!s.trend && (
                  <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider relative z-10">{s.delta}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Search & Filter ── */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by agent, user, or number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                  filter === f.value
                    ? 'btn-cta text-white border-[#2563eb] shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">Recording:</span>
          {RECORDING_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRecordingFilter(f.value as typeof recordingFilter)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer whitespace-nowrap ${
                recordingFilter === f.value
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── Syncing Banner ── */}
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3"
          >
            <svg className="w-4 h-4 animate-spin text-[#2563eb]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-xs font-bold text-[#2563eb]">Syncing calls from Vapi…</span>
          </motion.div>
        )}

        {/* ── DataTable ── */}
        <motion.div variants={fadeUp}>
          <DataTable
            columns={columns}
            data={filteredCalls}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(c) => c.id}
            onRowClick={(call) => openDetail(call)}
            cardTitle={(c) => c.agentName || 'Call'}
            pageSize={filteredCalls.length || 20}
            cardBadge={(c) => {
              const sc = statusConfig[c.status] ?? fallbackStatus;
              const isCustomRecording = c.recordingUrl?.startsWith('/api/recordings/');
              return (
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    c.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                    c.status === 'missed' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                    c.status === 'in-progress' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
                    'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      c.status === 'completed' ? 'bg-[#10B981]' :
                      c.status === 'missed' ? 'bg-[#f59e0b]' :
                      c.status === 'in-progress' ? 'bg-[#2563eb]' :
                      'bg-[#ef4444]'
                    }`}/>
                    {sc.label}
                  </span>
                  {isCustomRecording && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-[#10B981] border border-[#10B981]/20">
                      REC
                    </span>
                  )}
                </div>
              );
            }}
            emptyState={{
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              ),
              title: 'No calls yet',
              description: 'Call history will appear here once calls start flowing.',
            }}
            defaultSort={{ key: 'startedAt', direction: 'desc' }}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </motion.div>
      </motion.div>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}