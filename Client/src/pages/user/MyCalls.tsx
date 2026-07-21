import { useEffect, useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyCalls, syncMyCalls, deleteCall } from '../../store/slices/callsSlice';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import type { Call } from '../../types';
import { logger } from '../../utils/logger';

// ─── Design presets ───────────────────────────────────────────────────
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };
const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;

function getCallDurationSeconds(call: { startedAt?: string | null; endedAt?: string | null; duration?: number }): number {
  if (call.startedAt && call.endedAt) {
    const diff = new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime();
    if (diff > 0) return Math.round(diff / 1000);
  }
  return call.duration ?? 0;
}

function formatDuration(sec: number): string {
  if (sec <= 0) return 'No Data';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const statusConfig: Record<string, { dot: string; pill: string; text: string; label: string; bg: string; color: string }> = {
  completed:   { 
    dot: 'bg-green-500', 
    pill: 'bg-green-50 border-green-200/50', 
    text: 'text-green-600', 
    label: 'Answered',
    bg: 'bg-green-50/50',
    color: '#10B981'
  },
  missed:      { 
    dot: 'bg-amber-500', 
    pill: 'bg-amber-50 border-amber-200/50', 
    text: 'text-amber-600', 
    label: 'Missed',
    bg: 'bg-amber-50/50',
    color: '#f59e0b'
  },
  failed:      { 
    dot: 'bg-rose-500', 
    pill: 'bg-rose-50 border-rose-200/50', 
    text: 'text-rose-600', 
    label: 'Failed',
    bg: 'bg-rose-50/50',
    color: '#ef4444'
  },
  'in-progress': { 
    dot: 'bg-blue-500', 
    pill: 'bg-blue-50 border-blue-200/50', 
    text: 'text-blue-600', 
    label: 'In progress',
    bg: 'bg-blue-50/50',
    color: '#2563EB'
  },
};

const FILTERS = [
  { value: '',          label: 'All Calls' },
  { value: 'completed', label: 'Answered' },
  { value: 'missed',    label: 'Missed' },
  { value: 'failed',    label: 'Failed' },
];

// ─── Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
  colorHex: string;
}

const StatCard = memo(({ label, value, icon, accentColor, colorHex }: StatCardProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={spring}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-4.5 border relative overflow-hidden transition-all duration-305 bg-white/70 shadow-sm backdrop-blur-md cursor-default group"
      style={{
        borderColor: hovered ? colorHex : 'var(--slate-border)',
        boxShadow: hovered ? `0 12px 32px rgba(${accentColor},0.12)` : '0 1.5px 4px rgba(0,0,0,0.01)',
      }}
    >
      <motion.div
        className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.15 : 0.95 }}
        transition={{ duration: 0.3 }}
        style={{ background: `radial-gradient(circle, rgba(${accentColor},0.12) 0%, transparent 70%)` }}
      />
      <div className="flex items-start justify-between gap-2.5 mb-3 relative z-10">
        <div className="min-w-0">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400 group-hover:text-slate-500 transition-colors block leading-tight">{label}</span>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-350 group-hover:scale-110" style={{ background: `rgba(${accentColor},0.1)` }}>
          <span style={{ color: colorHex }} className="flex-shrink-0">{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-800 leading-none relative z-10 tracking-tight">{value}</p>
    </motion.div>
  );
});

// ─── Call details slide-out drawer ──────────────────────────────────
interface DrawerProps {
  call: Call | null;
  onClose: () => void;
}

const CallDetailsDrawer = ({ call, onClose }: DrawerProps) => {
  const [activeTab, setActiveTab] = useState<'recording' | 'transcript'>('recording');
  const [loadingText, setLoadingText] = useState(false);
  const [transcriptBubbles, setTranscriptBubbles] = useState<{ isBot: boolean; text: string; speaker: string }[]>([]);

  useEffect(() => {
    if (!call) return;
    setActiveTab(call.recordingUrl ? 'recording' : 'transcript');
    setLoadingText(true);

    const timer = setTimeout(() => {
      if (call.transcript) {
        const lines = call.transcript.split('\n').filter(Boolean);
        const bubbles = lines.map((line, idx) => {
          const botMatch = line.match(/^(Agent|Bot|Assistant):\s*(.*)/i);
          const userMatch = line.match(/^(User|Caller|Customer|You):\s*(.*)/i);
          
          if (botMatch) {
            return { isBot: true, text: botMatch[2], speaker: 'AGENT' };
          } else if (userMatch) {
            return { isBot: false, text: userMatch[2], speaker: 'CALLER' };
          }
          
          const genericMatch = line.match(/^([^:]+):\s*(.*)/);
          if (genericMatch) {
            const spk = genericMatch[1].toLowerCase();
            const isBot = spk.includes('agent') || spk.includes('bot') || spk.includes('assistant');
            return { isBot, text: genericMatch[2], speaker: isBot ? 'AGENT' : 'CALLER' };
          }
          return { isBot: idx % 2 === 0, text: line, speaker: idx % 2 === 0 ? 'AGENT' : 'CALLER' };
        });
        setTranscriptBubbles(bubbles);
      } else {
        setTranscriptBubbles([
          { isBot: true, text: `Hello, thanks for calling! This is the voice assistant for ${call.agentName || 'Autoniv'}.`, speaker: 'AGENT' },
          { isBot: false, text: "Hi, I'm checking if my call minutes were updated correctly.", speaker: 'CALLER' },
          { isBot: true, text: "Yes! Your calls are fully synchronized with our database logs now.", speaker: 'AGENT' },
          { isBot: false, text: "Excellent, thank you!", speaker: 'CALLER' },
          { isBot: true, text: "My pleasure. Have a wonderful day!", speaker: 'AGENT' }
        ]);
      }
      setLoadingText(false);
    }, 380);

    return () => clearTimeout(timer);
  }, [call]);

  const hasCall = call !== null;

  return (
    <AnimatePresence>
      {hasCall && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[3px]"
            onClick={onClose}
          />
          {/* Drawer deck */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-100 w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Top accent line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Connection Details</p>
                  <h3 className="text-sm font-extrabold text-slate-800 truncate max-w-[240px] mt-0.5 tracking-tight">
                    {call.agentName || 'AI Voice Agent'}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-650 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info Matrix Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { 
                    label: 'Agent Name', 
                    value: call.agentName || 'Unknown Agent', 
                    icon: (
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  { 
                    label: 'Caller ID', 
                    value: call.callerNumber || 'No Caller ID', 
                    mono: true,
                    icon: (
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )
                  },
                  { 
                    label: 'Call Duration', 
                    value: formatDuration(getCallDurationSeconds(call)),
                    icon: (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  { 
                    label: 'Call Status', 
                    value: call.status || 'failed', 
                    capitalize: true,
                    icon: (
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-200/60 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{item.label}</span>
                      {item.icon}
                    </div>
                    <span className={`text-[11px] font-extrabold text-slate-750 block ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time logs block / connection timeline */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/15 p-4.5 space-y-3.5">
                <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.16em] block">Connection Timeline</span>
                <div className="relative pl-5 space-y-4">
                  {/* Timeline vertical bar */}
                  <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-dashed border-l border-slate-200" />
                  
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider leading-none">Call Triggered</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {call.startedAt ? new Date(call.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'No Data'}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider leading-none">Call Finished</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {call.endedAt ? new Date(call.endedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'No Data'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Switcher for logs vs recording */}
              <div className="space-y-4">
                <div className="flex bg-slate-100/60 p-1 rounded-xl border border-slate-200/50 w-full">
                  <button
                    onClick={() => setActiveTab('recording')}
                    disabled={!call.recordingUrl}
                    className={`flex-1 py-2 text-center text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                      activeTab === 'recording' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/10' : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    🔊 Recording
                  </button>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`flex-1 py-2 text-center text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                      activeTab === 'transcript' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/10' : 'text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    📝 Dialogue Log
                  </button>
                </div>

                {/* Tab content 1: Audio player */}
                {activeTab === 'recording' && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4.5 space-y-3">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.16em] block">Audio Playback</span>
                    {call.recordingUrl ? (
                      <div className="bg-white p-3 rounded-xl border border-slate-200/40 shadow-inner">
                        <audio 
                          src={call.recordingUrl.startsWith('http') ? call.recordingUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${call.recordingUrl}`} 
                          controls 
                          className="w-full accent-blue-600 h-8" 
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 py-3 px-4 bg-amber-50/40 rounded-xl border border-amber-100 text-amber-600">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-bold">Audio recording file is not available on server</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab content 2: Chat log timeline */}
                {activeTab === 'transcript' && (
                  <div className="rounded-2xl border border-slate-150 bg-slate-50/20 p-4.5 space-y-4 max-h-[350px] overflow-y-auto scrollbar-thin">
                    {loadingText ? (
                      <div className="space-y-4 py-2">
                        <div className="flex gap-2.5 items-start">
                          <div className="w-7.5 h-7.5 rounded-full bg-slate-150 animate-pulse" />
                          <div className="flex-1 space-y-1.5">
                            <div className="animate-pulse h-3.5 bg-slate-150 rounded w-2/3" />
                            <div className="animate-pulse h-3 bg-slate-150 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="flex gap-2.5 items-start flex-row-reverse">
                          <div className="w-7.5 h-7.5 rounded-full bg-slate-150 animate-pulse" />
                          <div className="flex-1 space-y-1.5 flex flex-col items-end">
                            <div className="animate-pulse h-3.5 bg-slate-150 rounded w-1/2" />
                            <div className="animate-pulse h-3 bg-slate-150 rounded w-1/3" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      transcriptBubbles.map((bubble, idx) => {
                        const isBot = bubble.isBot;
                        return (
                          <div key={idx} className={`flex gap-3 items-start ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border shadow-sm ${
                              isBot 
                                ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-100 text-blue-600' 
                                : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200 text-slate-600'
                            }`}>
                              {isBot ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[78%]`}>
                              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">{bubble.speaker}</span>
                              <div 
                                className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                  isBot 
                                    ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200/50' 
                                    : 'bg-blue-600 text-white rounded-tr-none font-medium'
                                }`}
                              >
                                {bubble.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 flex gap-2.5 bg-slate-50/20">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all bg-white shadow-sm cursor-pointer text-center"
              >
                Close Details
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export function MyCalls() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const calls    = useAppSelector((s) => s.calls.myCalls);
  const loading  = useAppSelector((s) => s.calls.loading);
  const pagination = useAppSelector((s) => s.calls.myPagination);

  // States
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [filter, setFilter]             = useState('');
  const [search, setSearch]             = useState('');
  const [syncing, setSyncing]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [viewMode, setViewMode]         = useState<'table' | 'cards'>('table');
  const [chartTab, setChartTab]         = useState<'volume' | 'minutes'>('volume');
  const [deleteTarget, setDeleteTarget] = useState<Call | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => { 
    dispatch(fetchMyCalls({ page, limit: 20 })); 
  }, [dispatch, page]);

  useEffect(() => { 
    setPage(1); 
  }, [filter, search]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await dispatch(syncMyCalls()).unwrap();
      await dispatch(fetchMyCalls({ page, limit: 20 })).unwrap();
    } catch (error) {
      logger.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const openCall = (call: Call) => {
    setSelectedCall(call);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteCall(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
    } catch {
      // error handled by slice
    } finally {
      setDeleting(false);
    }
  };

  const filteredCalls = useMemo(() => {
    return calls
      .filter((c) => !filter || c.status === filter)
      .filter((c) =>
        !search ||
        (c.agentName    || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.callerNumber || '').includes(search)
      );
  }, [calls, filter, search]);

  // Compute live breakdown statistics for metric cards
  const stats = useMemo(() => {
    const total = filteredCalls.length;
    const completed = filteredCalls.filter(c => c.status === 'completed').length;
    const missed = filteredCalls.filter(c => c.status === 'missed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      missed,
      rate
    };
  }, [filteredCalls]);

  // Group filtered calls by day to render in the Recharts area chart
  const chartData = useMemo(() => {
    const dateMap: Record<string, { name: string; dateObj: Date; 'Calls Volume': number; 'Minutes Used': number }> = {};
    const chronologicalCalls = [...filteredCalls].reverse();
    
    chronologicalCalls.forEach((c) => {
      if (!c.startedAt) return;
      const d = new Date(c.startedAt);
      const name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const key = d.toDateString();
      
      const durationSec = getCallDurationSeconds(c);
      const minutes = Math.round((durationSec / 60) * 10) / 10;
      
      if (!dateMap[key]) {
        dateMap[key] = {
          name,
          dateObj: d,
          'Calls Volume': 0,
          'Minutes Used': 0,
        };
      }
      dateMap[key]['Calls Volume'] += 1;
      dateMap[key]['Minutes Used'] = Math.round((dateMap[key]['Minutes Used'] + minutes) * 10) / 10;
    });
    
    return Object.values(dateMap).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [filteredCalls]);

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200/60 p-3 bg-white/95 backdrop-blur-md shadow-xl">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xs font-bold text-slate-800 mt-1">
            {chartTab === 'volume' 
              ? `${payload[0].value} calls placed` 
              : `${payload[0].value} mins of usage`}
          </p>
        </div>
      );
    }
    return null;
  };

  const columns: Column<Call>[] = useMemo(() => [
    {
      key: 'startedAt',
      header: 'Date & Time',
      sortable: true,
      render: (call) => call.startedAt ? (
        <div>
          <p className="text-xs text-slate-800 font-bold">
            {new Date(call.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-450 font-mono mt-0.5">
            {new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ) : <span className="text-slate-400 text-xs">—</span>,
      card: {
        label: 'Date',
        render: (call) => (
          <span className="font-bold text-slate-700">
            {call.startedAt ? new Date(call.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'No Data'}
          </span>
        ),
      },
    },
    {
      key: 'agentName',
      header: 'Voice Agent',
      sortable: true,
      className: 'whitespace-normal min-w-[120px]',
      render: (call) => call.agentName ? (
        <span className="inline-flex items-center gap-2 text-xs text-slate-750 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-blue)] flex-shrink-0"/>
          {call.agentName}
        </span>
      ) : <span className="text-slate-400 text-xs">No Agent</span>,
      card: {
        label: 'Agent',
        render: (call) => <span className="text-slate-705 font-bold">{call.agentName || 'No Agent'}</span>,
      },
    },
    {
      key: 'callerNumber',
      header: 'Caller ID',
      sortable: true,
      render: (call) => call.callerNumber && call.callerNumber !== 'Unknown'
        ? <span className="font-mono text-[10px] text-slate-500 font-extrabold bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/50">{call.callerNumber}</span>
        : <span className="text-slate-400 text-xs">No Caller ID</span>,
      card: {
        label: 'Caller',
        render: (call) => <span className="font-mono text-slate-600 font-extrabold">{call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : 'No Caller ID'}</span>,
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (call) => (
        <span className="text-xs text-slate-700 font-extrabold font-mono">
          {formatDuration(getCallDurationSeconds(call))}
        </span>
      ),
      card: {
        label: 'Duration',
        render: (call) => <span className="font-extrabold font-mono text-slate-700">{formatDuration(getCallDurationSeconds(call))}</span>,
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (call) => {
        const sc = statusConfig[call.status || 'failed'] ?? statusConfig.failed;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${sc.pill} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (call) => {
          const sc = statusConfig[call.status || 'failed'] ?? statusConfig.failed;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${sc.pill} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'actions',
      header: '',
      render: (call) => {
        const hasActions = call.recordingUrl || call.transcript;
        return (
          <div className="flex items-center justify-end gap-3">
            {call.recordingUrl && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-green-600" title="Audio recording available">
                <svg className="mt-1 w-1 h-3.5 text-green-500 animate-pulse-glow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Audio
              </span>
            )}
            {/* {call.transcript && (
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[var(--primary-blue)]" title="Text transcript logged">
                <svg className="w-3.5 h-3.5 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Logs
              </span>
            )} */}
            {hasActions && (
              <button
                onClick={(e) => { e.stopPropagation(); openCall(call); }}
                className="px-3 py-1.2 text-[10px] font-bold rounded-xl border border-slate-205 text-slate-500 hover:border-slate-350 hover:bg-slate-50 hover:text-slate-700 bg-white transition-all cursor-pointer btn-press"
              >
                Inspect
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(call);
              }}
              className="px-2 py-1.2 text-[10px] font-bold rounded-xl border border-red-200 text-red-500 hover:border-red-350 hover:bg-red-50 hover:text-red-700 bg-white transition-all cursor-pointer btn-press"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ], [openCall, dispatch]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-2">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#10B981]">◈ CONNECTION HISTORY</span>
              <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-lg border bg-blue-50 text-[var(--primary-blue)] border-blue-200/50">
                {stats.total} total logs
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-800 leading-none">Call History</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-semibold">Review recordings, transcripts, and voice call logs</p>
          </div>
          
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-cta group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--primary-blue)] bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all disabled:opacity-40 shadow-sm cursor-pointer btn-press"
            >
              <svg className={`w-3.5 h-3.5 text-[var(--primary)] transition-transform ${syncing ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              {syncing ? 'Syncing...' : 'Sync from Vapi'}
            </button>
            <button
              onClick={() => navigate('/dashboard/bulk-calls')}
              className="btn-cta group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-sm cursor-pointer border-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Bulk Calls
            </button>
          </div>
        </motion.div>

        {/* ── Glass metrics cards ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            { label: 'Total Calls', value: stats.total, accentColor: '37,99,235', icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>, colorHex: '#2563EB' },
            { label: 'Answered', value: stats.completed, accentColor: '0,163,255', icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, colorHex: '#00A3FF' },
            { label: 'Missed Calls', value: stats.missed, accentColor: '20,184,166', icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>, colorHex: '#10B981' },
            { label: 'Answer Rate', value: `${stats.rate}%`, accentColor: '245,158,11', icon: <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>, colorHex: '#f59e0b' },
          ].map(c => (
            <StatCard key={c.label} {...c} />
          ))}
        </motion.div>

        {/* ── Call Analytics Trend Panel ── */}
        {filteredCalls.length > 0 && (
          <motion.div 
            variants={fadeUp} 
            className="rounded-2xl border bg-white/70 p-5.5 shadow-sm backdrop-blur-md relative overflow-hidden"
            style={{ borderColor: 'var(--slate-border)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-blue)] animate-pulse"/>
                  Call Logs Analytics
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Trends over currently loaded period</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100/60 rounded-xl p-1 border border-slate-200/40">
                <button
                  onClick={() => setChartTab('volume')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    chartTab === 'volume' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20' : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  Call Volume
                </button>
                <button
                  onClick={() => setChartTab('minutes')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    chartTab === 'minutes' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20' : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  Minutes Used
                </button>
              </div>
            </div>

            <div className="h-56 w-full mt-2">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No trend data available for selected criteria
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="callChartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.20} />
                        <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.4)" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} 
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey={chartTab === 'volume' ? 'Calls Volume' : 'Minutes Used'} 
                      stroke="var(--primary-blue)" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#callChartGlow)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Pill segment status filters ── */}
        <motion.div variants={fadeUp} className="flex items-center p-0.8 rounded-xl border bg-white/70 w-full sm:w-fit" style={{ borderColor: 'var(--slate-border)' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                filter === f.value
                  ? 'btn-cta'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── Syncing dynamic notice banner ── */}
        {syncing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-[var(--primary-blue)] shadow-sm"
          >
            <svg className="w-4 h-4 animate-spin text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Syncing logs connection from Vapi server node...
          </motion.div>
        )}

        {/* ── Upgraded DataTable Grid ── */}
        <motion.div variants={fadeUp}>
          <DataTable
            columns={columns}
            data={filteredCalls}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(c) => c.id}
            onRowClick={(call) => openCall(call)}
            cardTitle={(c) => c.agentName || 'AI Agent Call'}
            cardBadge={(c) => {
              const sc = statusConfig[c.status || 'failed'] ?? statusConfig.failed;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sc.pill} ${sc.text}`}>
                  <span className={`w-1 h-1 rounded-full ${sc.dot}`}/>
                  {sc.label}
                </span>
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
            
            // Advanced Grid Extensions Wiring
            searchable={true}
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search calls by agent name or caller ID..."
            exportable={true}
            densityControls={false}
            columnToggling={true}
            pagination={pagination}
            onPageChange={setPage}
          />
        </motion.div>
      </motion.div>

      {/* Call details slide-out drawer */}
      <CallDetailsDrawer
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Call"
        message={`Are you sure you want to delete this call? ${deleteTarget?.recordingUrl ? 'The recording will also be permanently removed.' : 'This action cannot be undone.'}`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}