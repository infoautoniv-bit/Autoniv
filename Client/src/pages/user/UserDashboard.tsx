/**
 * UserDashboard — Enhanced Premium Interactive Version
 * Design: Clean Light Theme with Blue-Cyan Gradient & Glassmorphism
 * Typography: Plus Jakarta Sans (headings) + Inter (body) + JetBrains Mono (data)
 * Accent: #2563eb with Teal/Blue gradient
 * Pattern: Glassmorphism + layered depth + micro-interactions + live simulators
 */

import {
  useEffect, useMemo, useState, useCallback, memo, useRef
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyStats } from '../../store/slices/analyticsSlice';
import { fetchMyCalls } from '../../store/slices/callsSlice';
import { fetchMyAgents } from '../../store/slices/agentsSlice';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingTour } from '../../components/OnboardingTour';
import { EmptyStateGuide } from '../../components/EmptyStateGuide';
import VapiModule from '@vapi-ai/web';
import { callService, apiKeyService } from '../../services/api';
import { COUNTRY_CODES } from '../../config/constants';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ToastContainer';
import type { MyStats } from '../../types';
import { isChatPlan, isVoicePlan, getPlanColor, getPlanDisplayName } from '../../utils/plan';

const Vapi = (typeof VapiModule === 'function' ? VapiModule : (VapiModule as any).default) as new (key: string) => any;

// ─── Design tokens ────────────────────────────────────────────────────
const T = {
  primary:     'var(--primary)',
  primaryDim:  'var(--primary-soft)',
  primarySoft: 'rgba(37,99,235,0.06)',
  emerald:     'var(--success)',
  amber:       'var(--warning)',
  rose:        'var(--danger)',
  slate:       'var(--slate-gray)',
  slateLight:  'var(--slate-light)',
  bg:          'var(--bg)',
  surface:     'rgba(255,255,255,0.8)',
  border:      'var(--border)',
  borderHover: 'rgba(37,99,235,0.25)',
  gradient:    'var(--gg)',
};

// ─── Animation presets ────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.055 } },
};

// ─── Tooltip wrapper ──────────────────────────────────────────────────
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none z-50 shadow-md border bg-white border-slate-200/60 text-slate-500"
          >
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-200" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────
const Skeleton = memo(({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
));

function SkeletonStatCard() {
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-[var(--surface)] shadow-sm">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-[var(--surface)] shadow-sm">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────
const AnimatedCounter = memo(({ value, suffix = '', prefix = '', className = '' }: { 
  value: number; suffix?: string; prefix?: string; className?: string 
}) => {
  const [display, setDisplay] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) { setDisplay(value); return; }
    let frame = 0;
    const total = 35;
    const tick = () => {
      frame++;
      const progress = frame / total;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, prefersReduced]);

  return <span className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
});

// ─── Donut Chart (SVG) ─────────────────────────────────────────
const DonutChart = memo(({ data, rate }: {
  data: { name: string; value: number; color: string }[];
  rate: number
}) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) return (
    <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">No data</span>
    </div>
  );

  const r = 42; const cx = 50; const cy = 50;
  let angle = -90;
  const segments = data.map(d => {
    const sweep = (d.value / total) * 360;
    const s = { ...d, startAngle: angle, sweep };
    angle += sweep;
    return s;
  });

  const arc = (startDeg: number, endDeg: number) => {
    const rad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startDeg));
    const y1 = cy + r * Math.sin(rad(startDeg));
    const x2 = cx + r * Math.cos(rad(endDeg));
    const y2 = cy + r * Math.sin(rad(endDeg));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${endDeg - startDeg > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
        {segments.map((s, i) => (
          <motion.path
            key={i} d={arc(s.startAngle + 1, s.startAngle + s.sweep - 1)}
            fill="none" stroke={s.color} strokeWidth="9" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-lg font-extrabold text-slate-800 leading-none">
          {rate}%
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">rate</span>
      </div>
    </div>
  );
});

// ─── Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor: string;
  delta?: string;
  onClick?: () => void;
  trend?: 'up' | 'down' | 'neutral';
  colorHex: string;
  hoveredCard: string | null;
  setHoveredCard: (val: string | null) => void;
}

const StatCard = memo(({ label, value, icon, accentColor, delta, onClick, trend, colorHex, hoveredCard, setHoveredCard }: StatCardProps) => {
  const isHovered = hoveredCard === label;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={spring}
      onMouseEnter={() => setHoveredCard(label)}
      onMouseLeave={() => setHoveredCard(null)}
      onClick={onClick}
      className="rounded-2xl p-4 sm:p-5 border relative overflow-hidden transition-all duration-300 cursor-default bg-white/70 shadow-sm backdrop-blur-md"
      style={{
        borderColor: isHovered ? `rgba(${accentColor},0.3)` : 'var(--slate-border)',
        boxShadow: isHovered ? `0 12px 36px rgba(${accentColor},0.08)` : '0 1px 3px rgba(37,99,235,0.01)',
      }}
    >
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.35 }}
        style={{ background: `radial-gradient(circle, rgba(${accentColor},0.08) 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between gap-2.5 mb-3.5 relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 block leading-tight truncate">
            {label}
          </p>
        </div>
        <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${accentColor},0.10)` }}>
          <span style={{ color: colorHex }} className="flex-shrink-0">{icon}</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl lg:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} />
            ) : (
              value
            )}
          </p>
          {trend && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
            </span>
          )}
        </div>
        {!trend && delta && (
          <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider truncate">
            {delta}
          </p>
        )}
      </div>
    </motion.div>
  );
});

// ─── Agent Card ───────────────────────────────────────────────────────
const agentTypeMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  receptionist: { icon: <PhoneIcon />,    color: '37, 99, 235', label: 'Receptionist' },
  appointment:  { icon: <CalendarIcon />, color: '0, 163, 255', label: 'Appointment'  },
  faq:          { icon: <QuestionIcon />, color: '20, 184, 166',  label: 'FAQ'           },
};

const AgentCard = memo(({ agent, index, onWebCall, onCallMe }: { agent: any; index: number; onWebCall?: (agent: any) => void; onCallMe?: (agent: any) => void }) => {
  const cfg = agentTypeMap[agent.type] || agentTypeMap.receptionist;
  const isActive = agent.isActive !== false;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(37,99,235,0.08)' }}
      className="rounded-[20px] border border-slate-200/50 bg-white/75 backdrop-blur-md overflow-hidden transition-all duration-300 group flex flex-col justify-between"
    >
      <div>
        <div className="h-1 w-full" style={{ background: isActive ? 'linear-gradient(90deg, #2563EB, #10B981)' : '#cbd5e1' }} />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: `rgba(${cfg.color},0.1)` }}>
              <span style={{ color: `rgb(${cfg.color})` }}>{cfg.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-slate-800 truncate">{agent.name}</h3>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{cfg.label}</p>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border transition-colors duration-250 ${
              isActive
                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/10'
                : 'border-slate-300/35 text-slate-400 bg-slate-50'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {isActive ? 'Active' : 'Muted'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-4 pb-4 pt-1.5 border-t border-slate-100/50 gap-2">
        <span className="text-[10px] font-bold text-slate-400">
          {(agent.callCount || 0).toLocaleString()} calls
        </span>
        <div className="flex items-center gap-1">
          {onWebCall && isActive && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onWebCall(agent)}
              className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white cursor-pointer border-none shadow-xs hover:opacity-95 transition-all"
            >
              Web
            </motion.button>
          )}
          {onCallMe && isActive && agent.phoneNumberId && (
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#10B981', color: '#fff', borderColor: '#10B981' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onCallMe(agent)}
              className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg transition-all cursor-pointer border"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1.5px solid rgba(16,185,129,0.25)',
                color: '#10B981',
              }}
            >
              Test
            </motion.button>
          )}
          <Link to={`/dashboard/ai-voice-agent`}
            className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/5 transition-all"
          >
            Config
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Drill-down Drawer for Call Logs ─────────────────────────────────
interface DrawerProps {
  call: any | null;
  onClose: () => void;
}

const CallDetailsDrawer = ({ call, onClose }: DrawerProps) => {
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<string[]>([]);
  const hasCall = call !== null;

  useEffect(() => {
    if (!call) return;
    setLoadingTranscript(true);
    // Simulate fetching / formatting transcript dialog
    const timer = setTimeout(() => {
      const dialogue = call.transcript
        ? call.transcript.split('\n').filter(Boolean)
        : [
            `[00:01] **Agent**: Hello, this is the AI receptionist for ${call.agentName || 'Autoniv'}. How can I assist you?`,
            `[00:08] **Caller**: Hi, I wanted to inquire if my booking was confirmed.`,
            `[00:15] **Agent**: Yes, I see a call recorded from number ${call.callerNumber || 'Unknown'} completed successfully.`,
            `[00:22] **Caller**: Great. Thank you very much!`,
            `[00:27] **Agent**: You're welcome. Thank you for calling. Goodbye!`,
          ];
      setTranscriptData(dialogue);
      setLoadingTranscript(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [call]);

  return (
    <AnimatePresence>
      {hasCall && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-100 bg-slate-50/30">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary-blue)]">Call Detail</p>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {call.agentName || 'Voice Call'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date & Time', value: call.startedAt ? new Date(call.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No Data' },
                   { label: 'Duration', value: formatDur(getCallDurSec(call)) },
                   { label: 'Caller ID', value: call.callerNumber || 'No Caller ID', mono: true },
                  { label: 'Status', value: call.status || 'failed', capitalize: true },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/40 px-3.5 py-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-semibold text-slate-700 block ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Styled Audio Player */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Voice Recording</span>
                {call.recordingUrl ? (
                  <audio 
                    src={call.recordingUrl.startsWith('http') ? call.recordingUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${call.recordingUrl}`} 
                    controls 
                    className="w-full h-8" 
                  />
                ) : (
                  <div className="flex items-center gap-3 py-1.5 text-slate-400">
                    <svg className="w-5 h-5 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    <span className="text-xs font-semibold">Simulated recording waveform active</span>
                  </div>
                )}
              </div>

              {/* Transcription Log */}
              <div className="space-y-3 flex-1 flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Conversation Log</span>
                <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 scrollbar-thin">
                  {loadingTranscript ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-2/3 align-self-end" />
                      <Skeleton className="h-6 w-4/5" />
                    </div>
                  ) : (
                    transcriptData.map((line, idx) => {
                      const isBot = line.includes('Agent**:');
                      const cleanText = line.replace(/\[\d\d:\d\d\]\s*\*\*(Agent|Caller)\*\*:\s*/, '');
                      return (
                        <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                          <span className="text-[8px] text-slate-400 font-bold mb-0.5">{isBot ? 'AGENT' : 'CALLER'}</span>
                          <div className={`px-3 py-1.8 rounded-xl text-xs max-w-[85%] leading-relaxed ${isBot ? 'bg-slate-100 text-slate-700 rounded-bl-none' : 'bg-[var(--primary-blue)] text-white rounded-br-none font-medium'}`}>
                            {cleanText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:text-slate-700 bg-white cursor-pointer hover:bg-slate-50 transition-all text-center"
              >
                Close Logs
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function WebCallDialog({
  open,
  onClose,
  agent,
  mode,
  seconds,
  errorMsg,
}: {
  open: boolean;
  onClose: () => void;
  agent: any;
  mode: 'idle' | 'connecting' | 'active' | 'ended' | 'error';
  seconds: number;
  errorMsg: string;
}) {
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {open && agent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto p-6 text-white flex flex-col items-center text-center relative">
              {/* Top ambient glow */}
              <div className="absolute -top-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

              {/* Status Header */}
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-blue-400 mb-6">
                {mode === 'connecting' && 'CONNECTING TO AGENT...'}
                {mode === 'active' && 'LIVE WEB CALL'}
                {mode === 'ended' && 'CALL TERMINATED'}
                {mode === 'error' && 'CONNECTION ERROR'}
              </p>

              {/* Avatar Orb */}
              <div className="relative mb-6">
                {mode === 'active' && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-blue-500/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-indigo-500/20"
                    />
                  </>
                )}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg relative z-10 border border-slate-800">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </div>
              </div>

              {/* Agent details */}
              <h3 className="text-lg font-black tracking-tight mb-1">{agent.name}</h3>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-6">
                {agent.type === 'faq' ? 'Q&A Support Specialist' : agent.type === 'appointment' ? 'Scheduler Assistant' : 'Receptionist Bot'}
              </p>

              {/* Visualizer Waveform / Info Area */}
              <div className="w-full h-16 flex items-center justify-center mb-6 relative">
                {mode === 'active' ? (
                  <div className="flex gap-1 h-8 items-center justify-center">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="w-[3px] bg-blue-500 rounded-full"
                        animate={{ height: [6, Math.random() * 28 + 6, 6] }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.5,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: idx * 0.04
                        }}
                      />
                    ))}
                  </div>
                ) : mode === 'connecting' ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening Vapi audio socket...
                  </div>
                ) : mode === 'ended' ? (
                  <span className="text-xs font-bold text-emerald-400">Call ended</span>
                ) : (
                  <span className="text-xs font-bold text-rose-500 max-w-[240px] truncate">{errorMsg || 'Failed to connect'}</span>
                )}
              </div>

              {/* Timer */}
              {mode === 'active' && (
                <p className="text-2xl font-mono font-bold tracking-wider text-slate-200 mb-8 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-2xl">
                  {formatTimer(seconds)}
                </p>
              )}

              {/* Action buttons */}
              <div className="w-full flex justify-center gap-3 pt-2">
                {mode !== 'ended' && mode !== 'error' ? (
                  <button
                    onClick={onClose}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-rose-600/20 transition-all cursor-pointer border-none text-white"
                    title="Hang up"
                  >
                    <svg className="w-6 h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 15.46l-5.25-1.5c-.38-.11-.79-.02-1.09.28l-2.45 2.45c-3.13-1.63-5.71-4.22-7.34-7.34L7.3 6.9c.3-.3.39-.71.28-1.09L6.08 1H1.5C.67 1 0 1.67 0 2.5 0 12.72 8.28 21 18.5 21c.83 0 1.5-.67 1.5-1.5v-4.04z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 transition-colors cursor-pointer border border-slate-700"
                  >
                    Dismiss Dialog
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CallMeDialog({
  open,
  onClose,
  agent,
  onCall,
  calling,
}: {
  open: boolean;
  onClose: () => void;
  agent: any;
  onCall: (phoneNumber: string) => void;
  calling: boolean;
}) {
  const [calleeName, setCalleeName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (open) {
      setCalleeName(''); setPhone(''); setError(''); setCopied(false);
      setCountryCode('+91'); setShowCountryDropdown(false); setCountrySearch('');
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[3];

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  const cleanedDigits = phone.replace(/\D/g, '');
  const isValidLength = cleanedDigits.length >= 7 && cleanedDigits.length <= 12;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, '');
    setPhone(raw);
    if (error) setError('');
  };

  const handleCall = () => {
    if (cleanedDigits.length < 7) {
      setError('Enter a valid phone number');
      return;
    }
    setError('');
    onCall(`${countryCode}${cleanedDigits}`);
  };

  const copyCurl = () => {
    const curl = `curl -X POST ${window.location.origin}/api/calls/outbound \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"${agent?.id || '<AGENT_ID>'}","phoneNumber":"${countryCode}${cleanedDigits}"}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-none">Simulator Outbound Call</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Test your agent with a live call</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-4 bg-white">
                {/* Agent chip */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent:</span>
                  <span className="text-xs font-bold text-slate-700 truncate">{agent?.name || 'No Agent'}</span>
                </div>

                {/* Callee name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Callee Name</label>
                  <input
                    type="text"
                    value={calleeName}
                    onChange={(e) => setCalleeName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3.5 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* Phone — country + number merged into a single control */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Callee Phone Number</label>

                  <div
                    className={`flex items-stretch rounded-2xl border w-full transition-all bg-slate-50 ${
                      error
                        ? 'border-rose-300 ring-4 ring-rose-100'
                        : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white'
                    }`}
                  >
                    {/* Country selector — relative anchor for the dropdown */}
                    <div className="relative flex-shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="h-full flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 text-xs rounded-l-2xl text-slate-700 hover:bg-slate-100/70 transition-colors min-w-[88px] cursor-pointer font-semibold border-r border-slate-200"
                      >
                        <span className="text-sm">{selectedCountry.flag}</span>
                        <span className="text-[11px] text-slate-600 font-mono font-bold">{countryCode}</span>
                        <svg className={`w-3 h-3 text-slate-400 ml-auto transition-transform duration-150 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] overflow-hidden"
                          >
                            <div className="p-2 border-b border-slate-100">
                              <input
                                autoFocus
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or code..."
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors font-medium"
                                style={{ outline: 'none' }}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
                              {filteredCountries.length === 0 ? (
                                <p className="px-3.5 py-3 text-xs text-slate-400 font-medium text-center">No matches</p>
                              ) : (
                                filteredCountries.map((c, i) => (
                                  <button
                                    key={`${c.code}-${c.country}-${i}`}
                                    type="button"
                                    onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); setCountrySearch(''); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                      countryCode === c.code && selectedCountry.country === c.country
                                        ? 'bg-blue-50/60 text-[var(--primary-blue)] font-bold'
                                        : 'text-slate-600 font-semibold'
                                    }`}
                                  >
                                    <span className="text-sm">{c.flag}</span>
                                    <span className="flex-1 text-left truncate">{c.name}</span>
                                    <span className="text-slate-400 font-mono text-[10px] font-bold">{c.code}</span>
                                    {countryCode === c.code && selectedCountry.country === c.country && (
                                      <svg className="w-3.5 h-3.5 text-[var(--primary-blue)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone digits */}
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="XXXXXXXXXX"
                      autoFocus
                      className="flex-1 min-w-0 px-3.5 py-3 text-xs bg-transparent text-slate-700 focus:outline-none transition-all font-mono font-bold rounded-r-2xl"
                      style={{ outline: 'none' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCall(); }}
                    />

                    {phone.trim() && (
                      <div className="flex items-center pr-3.5 flex-shrink-0">
                        {isValidLength ? (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-300">{cleanedDigits.length}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 px-0.5">
                    {error ? (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-rose-500 font-bold flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z" />
                        </svg>
                        {error}
                      </motion.p>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Will dial as <span className="font-mono font-bold text-slate-500">{countryCode}{cleanedDigits || '…'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-5 pb-5 pt-1.5 space-y-2 bg-slate-50/60 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCall}
                  disabled={calling || !phone.trim()}
                  className="btn-cta w-full py-3 rounded-2xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                >
                  {calling ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting Line...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Simulate Call
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={copyCurl}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      cURL Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy API cURL Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────
function PhoneIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function CalendarIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function QuestionIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>; }
function RefreshIcon({ spinning }: { spinning?: boolean }) { return <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>; }
function CallIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function AgentIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>; }
function ClockIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function UsersIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }

// ─── Helpers ──────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function getCallDurSec(call: { startedAt?: string | null; endedAt?: string | null; duration?: number }): number {
  if (call.startedAt && call.endedAt) {
    const d = new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime();
    if (d > 0) return Math.round(d / 1000);
  }
  return call.duration ?? 0;
}
function formatDur(s: number) {
  if (s <= 0) return 'No Data';
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

const callStatus: Record<string, { label: string; color: string; dotColor: string; bg: string }> = {
  completed: { label: 'Answered', color: '#10B981', dotColor: '#10B981', bg: 'bg-[var(--primary-soft)]' },
  missed:    { label: 'Missed',    color: '#f59e0b', dotColor: '#f59e0b', bg: 'bg-amber-50' },
  failed:    { label: 'Failed',    color: '#ef4444', dotColor: '#ef4444', bg: 'bg-rose-50' },
};

// ─── Main Dashboard Component ─────────────────────────────────────────
export function UserDashboard() {
  const dispatch   = useAppDispatch();
  const stats      = useAppSelector((state) => state.analytics.myStats);
  const cachedStats = useAppSelector((state) => state.auth.dashboardStats);
  const calls      = useAppSelector((state) => state.calls.myCalls);
  const loading    = useAppSelector((state) => state.analytics.loading);
  const error      = useAppSelector((state) => state.analytics.error);
  const user       = useAppSelector((state) => state.auth.user);
  const myAgents   = useAppSelector((state) => state.agents.myAgents);
  const isChat = user ? isChatPlan(user) : true;
  const isVoice = user ? isVoicePlan(user) : false;
  
  const { toasts, add: addToast, remove: removeToast } = useToast();
  
  // Interactive layout states
  const [retrying, setRetrying] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // API Key state for widget embed
  const [widgetApiKey, setWidgetApiKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  
  // Chart active tab
  const [chartTab, setChartTab] = useState<'volume' | 'minutes'>('volume');
  
  // Detailed Drawer and Call states
  const [detailCall, setDetailCall] = useState<any | null>(null);
  const [callTarget, setCallTarget] = useState<any | null>(null);
  const [calling, setCalling] = useState(false);

  // Web Call states
  const [webCallTarget, setWebCallTarget] = useState<any | null>(null);
  const [webCallMode, setWebCallMode] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle');
  const [webCallSeconds, setWebCallSeconds] = useState(0);
  const [webCallErrorMsg, setWebCallErrorMsg] = useState('');
  const webCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webCallMaxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webCallVapiRef = useRef<any>(null);

  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const loadData = useCallback(() => {
    dispatch(fetchMyStats());
    if (isVoice) {
      dispatch(fetchMyCalls({}));
      dispatch(fetchMyAgents({}));
    }
  }, [dispatch, isVoice]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam === 'chat_restricted') {
      addToast('Upgrade Required: Please subscribe to Chat Plan or Chat + Voice Plan to access Chat features.', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam === 'voice_restricted') {
      addToast('Upgrade Required: Please subscribe to Voice Plan or Chat + Voice Plan to access Voice Agents.', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addToast]);

  // Fetch widget API key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      setApiKeyLoading(true);
      try {
        const { data } = await apiKeyService.get();
        setWidgetApiKey(data.apiKey || null);
        setHasApiKey(data.hasKey || false);
      } catch (err) {
        console.error('Failed to fetch API key:', err);
      } finally {
        setApiKeyLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRetrying(true);
    await Promise.all([
      dispatch(fetchMyStats()),
      ...(isVoice ? [
        dispatch(fetchMyCalls({})),
        dispatch(fetchMyAgents({}))
      ] : [])
    ]);
    setTimeout(() => { 
      setRetrying(false); 
      addToast('Dashboard data refreshed successfully ✨', 'success'); 
    }, 850);
  }, [dispatch, isVoice, addToast]);

  const myAgentStats = useMemo(() => ({
    total:    myAgents.length,
    active:   myAgents.filter(a => a.isActive !== false).length,
    inactive: myAgents.filter(a => a.isActive === false).length,
  }), [myAgents]);
 
  // Synchronized time filtering logic for calls
  const filteredCalls = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    return calls.filter(c => {
      if (!c.startedAt) return timeFilter === 'all';
      const diff = now - new Date(c.startedAt).getTime();
      if (timeFilter === '7d') return diff <= 7 * dayMs;
      if (timeFilter === '30d') return diff <= 30 * dayMs;
      return true; // 'all'
    });
  }, [calls, timeFilter]);

  const minutesUsed = useMemo(() => {
    const total = filteredCalls.reduce((acc, c) => acc + getCallDurSec(c), 0);
    return Math.round(total / 60);
  }, [filteredCalls]);

  const minutesLimit  = user?.minutesLimit ?? 0;
  const isUnlimitedMinutes = minutesLimit === -1;
  const billingMinutesUsed = user?.minutesUsed ?? 0;
  const billingUsagePercent = isUnlimitedMinutes ? 0 : minutesLimit > 0 ? Math.min((billingMinutesUsed / minutesLimit) * 100, 100) : 0;
  const usagePercent  = isUnlimitedMinutes ? 0 : minutesLimit > 0 ? Math.min((minutesUsed / minutesLimit) * 100, 100) : 0;

  const callBreakdown = useMemo(() => {
    const total     = filteredCalls.length;
    const completed = filteredCalls.filter(c => c.status === 'completed').length;
    const missed    = filteredCalls.filter(c => c.status === 'missed').length;
    const failed    = filteredCalls.filter(c => c.status === 'failed').length;
    return {
      total,
      answerRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      chartData: [
        { name: 'Answered', value: completed, color: '#10B981' },
        { name: 'Missed',   value: missed,    color: '#f59e0b' },
        { name: 'Failed',   value: failed,    color: '#ef4444' },
      ].filter(i => i.value > 0),
      listItems: [
        { name: 'Answered', value: completed, pct: total > 0 ? Math.round(completed / total * 100) : 0, color: '#10B981' },
        { name: 'Missed',   value: missed,    pct: total > 0 ? Math.round(missed / total * 100) : 0,    color: '#f59e0b' },
        { name: 'Failed',   value: failed,    pct: total > 0 ? Math.round(failed / total * 100) : 0,    color: '#ef4444' },
      ]
    };
  }, [filteredCalls]);

  const recentCalls = useMemo(() =>
    [...filteredCalls]
      .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
      .slice(0, 5),
    [filteredCalls]
  );

  // Dynamic daily bucketing for the Trend Chart Area block
  const performanceTrendData = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const pointsCount = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 15 : 20;
    
    const buckets = Array.from({ length: pointsCount }).map((_, idx) => {
      const d = new Date(now - (pointsCount - 1 - idx) * dayMs * (timeFilter === 'all' ? 2.5 : 1));
      return {
        dateStr: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timestamp: d.getTime(),
        calls: 0,
        minutes: 0,
      };
    });

    filteredCalls.forEach(c => {
      if (!c.startedAt) return;
      const t = new Date(c.startedAt).getTime();
      let matchIdx = -1;
      
      // Find matching date bucket
      for (let i = 0; i < buckets.length; i++) {
        const nextTime = buckets[i + 1]?.timestamp ?? now + dayMs;
        if (t >= buckets[i].timestamp && t < nextTime) {
          matchIdx = i;
          break;
        }
      }
      
      if (matchIdx !== -1) {
        buckets[matchIdx].calls++;
        buckets[matchIdx].minutes += getCallDurSec(c) / 60;
      }
    });

    return buckets.map(b => ({
      name: b.dateStr,
      'Calls Volume': b.calls,
      'Minutes Used': Math.round(b.minutes * 10) / 10,
    }));
  }, [filteredCalls, timeFilter]);

  const s = stats || (cachedStats as MyStats | null) || { agentCount: 0, callCount: 0, minuteUsed: 0, leadCount: 0 };
  const planColors = getPlanColor(user?.plan || 'free');

  const statsCardsList = useMemo(() => {
    const isChatOnly = isChat && !isVoice;
    const isVoiceOnly = isVoice && !isChat;
    const isBoth = isChat && isVoice;

    const list = [];

    if (isChatOnly || isBoth) {
      list.push({
        label: 'Chat Conversations',
        value: user?.chatUsed || 0,
        accentColor: '37,99,235',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        delta: `Limit: ${user?.chatLimit === -1 ? '∞' : (user?.chatLimit || 0)} / mo`,
        colorHex: '#2563EB',
      });
    }

    if (isVoiceOnly || isBoth) {
      list.push({
        label: 'Total Agents',
        value: myAgents.length,
        accentColor: '37,99,235',
        icon: <AgentIcon />,
        delta: `${myAgentStats.active} active logs`,
        colorHex: '#2563EB',
      });
      list.push({
        label: 'Calls Placed',
        value: filteredCalls.length,
        accentColor: '0,163,255',
        icon: <CallIcon />,
        delta: `${callBreakdown.answerRate}% answer rate`,
        trend: 'up' as const,
        colorHex: '#00A3FF',
      });
      list.push({
        label: 'Minutes Used',
        value: minutesUsed,
        accentColor: '0,212,255',
        icon: <ClockIcon />,
        delta: `${Math.round(usagePercent)}% billing limit`,
        colorHex: '#10B981',
      });
    }

    if (isChatOnly) {
      list.push({
        label: 'Chats Remaining',
        value: user?.chatLimit === -1 ? 'Unlimited' : Math.max(0, (user?.chatLimit || 0) - (user?.chatUsed || 0)),
        accentColor: '0,212,255',
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        delta: 'Active subscription tier',
        colorHex: '#10B981',
      });
    }

    if (list.length < 4) {
      list.push({
        label: 'Leads Logged',
        value: s.leadCount || 0,
        accentColor: '20,184,166',
        icon: <UsersIcon />,
        delta: 'Synced with platform node',
        colorHex: '#14B8A6',
      });
    }

    return list.slice(0, 4);
  }, [isChat, isVoice, user, myAgents, myAgentStats, filteredCalls, callBreakdown, minutesUsed, usagePercent, s.leadCount]);

  const hasNoData  = !loading && s.agentCount === 0 && s.callCount === 0 && myAgents.length === 0;
  const showEmptyGuide = hasNoData && !showOnboarding && isVoice;

  const hasCallData    = callBreakdown.total > 0 && isVoice;
  const hasAgents      = myAgents.length > 0 && isVoice;
  const hasRecentCalls = recentCalls.length > 0 && isVoice;

  // Custom Chart Tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200/60 p-3 bg-white/95 backdrop-blur-md shadow-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
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

  const clearWebCallTimers = useCallback(() => {
    if (webCallTimerRef.current) { clearInterval(webCallTimerRef.current); webCallTimerRef.current = null; }
    if (webCallMaxDurationRef.current) { clearTimeout(webCallMaxDurationRef.current); webCallMaxDurationRef.current = null; }
  }, []);

  const stopWebCall = useCallback(() => {
    if (webCallVapiRef.current) {
      try {
        webCallVapiRef.current.stop();
        if (typeof webCallVapiRef.current.removeAllListeners === 'function') {
          webCallVapiRef.current.removeAllListeners();
        }
      } catch { /* ignore */ }
      webCallVapiRef.current = null;
    }
    clearWebCallTimers();
    setWebCallMode('ended');
    setTimeout(() => {
      setWebCallMode('idle');
      setWebCallTarget(null);
    }, 1500);
  }, [clearWebCallTimers]);

  useEffect(() => () => { clearWebCallTimers(); }, [clearWebCallTimers]);

  const handleWebCall = async (agent: any) => {
    setWebCallTarget(agent);
    setWebCallMode('connecting');
    setWebCallSeconds(0);
    setWebCallErrorMsg('');

    const apiKey = import.meta.env.VITE_VAPI_API_KEY as string | undefined;
    if (!apiKey) {
      setWebCallMode('error');
      setWebCallErrorMsg('Vapi API Key is missing.');
      addToast('Vapi API Key is missing. Web Call unavailable.', 'error');
      return;
    }

    try {
      const vapi = new Vapi(apiKey);
      webCallVapiRef.current = vapi;

      const onSpeechStart = () => { setWebCallMode('active'); };
      const onCallEnd = () => stopWebCall();
      const onError = (e: any) => {
        console.error('[UserDashboard] Web Call VAPI error:', e);
        setWebCallMode('error');
        setWebCallErrorMsg(e?.message || 'Call failed.');
        addToast(e?.message || 'Web Call error.', 'error');
      };

      vapi.on('speech-start', onSpeechStart);
      vapi.on('call-end', onCallEnd);
      vapi.on('error', onError);

      if (agent.vapiId) {
        await vapi.start(agent.vapiId);
      } else {
        await vapi.start({
          name: agent.name,
          firstMessage: `Hi, this is ${agent.name}. How can I help you today?`,
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [{ role: 'system', content: agent.prompt || 'You are a helpful assistant.' }],
          },
          voice: {
            provider: '11labs',
            voiceId: agent.voiceId || '21m00Tcm4TlvDq8ikWAM',
          },
        });
      }

      setWebCallMode('active');
      webCallTimerRef.current = setInterval(() => setWebCallSeconds(prev => prev + 1), 1000);
      webCallMaxDurationRef.current = setTimeout(() => stopWebCall(), 180_000); // 3 min duration
      addToast(`Connected with ${agent.name} via Web Call`, 'success');
    } catch (err: any) {
      console.error('[UserDashboard] Web call failed:', err);
      setWebCallMode('error');
      setWebCallErrorMsg(err?.message || 'Failed to start Web call');
      addToast(err?.message || 'Failed to start Web call', 'error');
      webCallVapiRef.current = null;
    }
  };

  const handleCallMe = async (phoneNumber: string) => {
    if (!callTarget) return;
    setCalling(true);

    try {
      await callService.outbound(callTarget.id, phoneNumber);
      addToast(`Test call initiated to ${phoneNumber} successfully!`, 'success');
      setCallTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initiate call';
      addToast(msg, 'error');
    } finally {
      setCalling(false);
    }
  };

  // Loading indicator on initial fetch
  if (loading && !stats) {
    return (
      <div className="space-y-5 p-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => <SkeletonBlock key={i} />)}
        </div>
      </div>
    );
  }

  // Error fallback display
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-rose-50 border border-rose-150">
            <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 mb-1">Analytics unavailable</h2>
          <p className="text-xs text-slate-500 mb-5">{error}</p>
          <button onClick={loadData} disabled={retrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-white bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)] cursor-pointer"
          >
            <RefreshIcon spinning={retrying} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />
      
      {/* Test Call Dialing Modal */}
      <CallMeDialog
        open={callTarget !== null}
        onClose={() => setCallTarget(null)}
        agent={callTarget}
        onCall={handleCallMe}
        calling={calling}
      />

      {/* Web Call Dialog Modal */}
      <WebCallDialog
        open={webCallTarget !== null}
        onClose={stopWebCall}
        agent={webCallTarget}
        mode={webCallMode}
        seconds={webCallSeconds}
        errorMsg={webCallErrorMsg}
      />

      {/* Drilldown modal drawer details */}
      <CallDetailsDrawer
        call={detailCall}
        onClose={() => setDetailCall(null)}
      />

      <motion.div variants={staggerContainer} initial="hidden" animate="show"
        className="h-full overflow-y-auto space-y-6 pb-12 pr-2" 
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ DASHBOARD OVERVIEW
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[var(--primary-blue)] border-blue-200/50">
                Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Member'} 👋
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${planColors.bg} ${planColors.border} ${planColors.text}`}>
              {getPlanDisplayName(user?.plan)} Plan
            </div>

            {/* Time filters switch */}
            <div className="flex rounded-xl border bg-white p-0.8" style={{ borderColor: 'var(--slate-border)' }}>
              {(['7d', '30d', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setTimeFilter(f);
                    addToast(`Filtered data by last ${f === 'all' ? 'billing logs' : f} ✨`, 'info');
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    timeFilter === f ? 'bg-[var(--primary-blue-soft)] text-[var(--primary-blue)]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <Tip text="Refresh widgets data">
              <button onClick={handleRefresh} disabled={retrying}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-50 bg-white hover:bg-slate-50 border-slate-200 text-slate-500 cursor-pointer"
              >
                <RefreshIcon spinning={retrying} />
              </button>
            </Tip>

            {isVoice && (
              <Link to="/dashboard/ai-voice-agent/new">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-sm cursor-pointer hover:shadow-md"
                  style={{ background: T.gradient }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Agent
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* ── Onboarding tour ── */}
        {showOnboarding && <OnboardingTour onDismiss={dismissOnboarding} />}

        {/* ── Empty state guide ── */}
        {showEmptyGuide && (
          <EmptyStateGuide
            title="Configure Your Voice Platform"
            description="Complete the quick milestones to start making automated calls in minutes."
            steps={[
              { icon: <AgentIcon />, label: 'Create an Agent', description: 'Set up an AI assistant to handle calls, check hours, or book slots.', to: '/dashboard/ai-voice-agent', cta: 'Build Agent' },
              { icon: <CallIcon />, label: 'Review Call Logs', description: 'Access records, download recordings, and inspect logs.', to: '/dashboard/calls', cta: 'Logs' },
              { icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Billing Settings', description: 'Inquire upgrade packages or limits details.', to: '/dashboard/billing', cta: 'Upgrade' },
            ]}
          />
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statsCardsList.map(card => (
            <StatCard
              key={card.label}
              {...card}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />
          ))}
        </div>

        {/* ── Chat Widget Embed Section ── */}
        {isChat && (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CHAT WIDGET</p>
                <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Embed Chat on Your Website</h2>
              </div>
              <Link to="/dashboard/ai-chatbot" className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors">
                Open Chat →
              </Link>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Embed Code</p>
              {apiKeyLoading ? (
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-500 overflow-x-auto">
                  Loading API key...
                </div>
              ) : !hasApiKey && !widgetApiKey ? (
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-500 overflow-x-auto">
                    No API key generated yet.
                  </div>
                   <button
                    onClick={async () => {
                      try {
                        const { data } = await apiKeyService.regenerate();
                        setWidgetApiKey(data.apiKey);
                        setHasApiKey(true);
                        addToast('API key generated successfully. Save it now - it won\'t be shown again!', 'success');
                      } catch {
                        addToast('Failed to generate API key', 'error');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none"
                  >
                    Generate API Key
                  </button>
                </div>
              ) : widgetApiKey && !widgetApiKey.startsWith('ak_••••') ? (
                <div className="space-y-3">
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-400">
                    ⚠️ Save this key now. It won't be shown again after you leave this page.
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-green-400 overflow-x-auto">
                    <code>{`<script src="${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/widget/widget.js"\n  data-api-key="${widgetApiKey}"\n  data-position="bottom-right">\n</script>`}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const scriptUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/widget/widget.js`;
                        navigator.clipboard.writeText(`<script src="${scriptUrl}" data-api-key="${widgetApiKey}" data-position="bottom-right"></script>`);
                        addToast('Embed code copied to clipboard', 'success');
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none"
                    >
                      Copy Code
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await apiKeyService.regenerate();
                          setWidgetApiKey(data.apiKey);
                          addToast('API key regenerated. Save it now - it won\'t be shown again!', 'success');
                        } catch {
                          addToast('Failed to regenerate API key', 'error');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer border-none"
                    >
                      Regenerate Key
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-green-400 overflow-x-auto">
                    <code>{`<script src="${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/widget/widget.js"\n  data-api-key="${widgetApiKey}"\n  data-position="bottom-right">\n</script>`}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const scriptUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/widget/widget.js`;
                        navigator.clipboard.writeText(`<script src="${scriptUrl}" data-api-key="${widgetApiKey}" data-position="bottom-right"></script>`);
                        addToast('Embed code copied to clipboard', 'success');
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none"
                    >
                      Copy Code
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await apiKeyService.regenerate();
                          setWidgetApiKey(data.apiKey);
                          addToast('API key regenerated. Save it now - it won\'t be shown again!', 'success');
                        } catch {
                          addToast('Failed to regenerate API key', 'error');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer border-none"
                    >
                      Regenerate Key
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">Add this to your website's &lt;head&gt; tag</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Chat Usage Breakdown ── */}
        {isChat && (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CONVERSATION INSIGHTS</p>
                <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Chat Usage</h2>
              </div>
              <Link to="/dashboard/billing" className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors">
                View Plan →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Conversations Used', value: user?.chatUsed || 0, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                { label: 'Monthly Limit', value: user?.chatLimit === -1 ? 'Unlimited' : (user?.chatLimit || 0), color: 'text-[var(--primary-blue)]', bg: 'bg-[var(--primary-blue-soft)]/20' },
                { label: 'Remaining', value: user?.chatLimit === -1 ? 'Unlimited' : Math.max(0, (user?.chatLimit || 0) - (user?.chatUsed || 0)), color: 'text-green-600', bg: 'bg-green-50/50' },
                { label: 'Usage Rate', value: user?.chatLimit === -1 ? 0 : (user?.chatLimit ? Math.round(((user?.chatUsed || 0) / user.chatLimit) * 100) : 0), color: 'text-amber-600', bg: 'bg-amber-50/50', suffix: '%' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3.5 border border-slate-100 ${item.bg}`}>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-xl font-extrabold ${item.color}`}>
                    {typeof item.value === 'number' ? (
                      <AnimatedCounter value={item.value} />
                    ) : (
                      item.value
                    )}{item.suffix || ''}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Need more conversations? Upgrade your chat plan for higher limits.</span>
              </div>
              <Link to="/dashboard/billing" className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)] transition-all">
                Upgrade
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Quick Actions for Chat ── */}
        {isChat && !isVoice && (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div className="mb-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">QUICK ACTIONS</p>
              <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Get Started with Chat</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { to: '/dashboard/ai-chatbot', title: 'Open Chat', desc: 'Start a conversation', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, color: '#2563EB', bg: 'bg-blue-50/50' },
                { to: '/dashboard/billing', title: 'Upgrade Plan', desc: 'Get more conversations', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, color: '#10B981', bg: 'bg-green-50/50' },
                { to: '/dashboard/leads', title: 'View Leads', desc: 'Review captured data', icon: <UsersIcon />, color: '#14B8A6', bg: 'bg-teal-50/50' },
              ].map((action, i) => (
                <Link key={action.title} to={action.to} className="block">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2, borderColor: 'rgba(37,99,235,0.25)' }}
                    className="flex flex-col p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/40 cursor-pointer h-full justify-between transition-all shadow-sm"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.bg}`} style={{ color: action.color }}>
                      {action.icon}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{action.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{action.desc}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Performance Analytics Trends Section ── */}
        {isVoice && (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
            style={{ borderColor: 'var(--slate-border)' }}
          >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4.5">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ANALYTICS ENGINE</p>
              <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Performance Trends</h2>
            </div>
            
            {/* Chart toggle and filter buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="flex rounded-xl bg-slate-100 p-0.8 border border-slate-200/50">
                <button
                  onClick={() => setChartTab('volume')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    chartTab === 'volume' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Call Volume
                </button>
                <button
                  onClick={() => setChartTab('minutes')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    chartTab === 'minutes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Minutes Used
                </button>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={chartTab === 'volume' ? 'Calls Volume' : 'Minutes Used'} 
                  stroke="var(--primary-blue)" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#chartGlow)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        )}

        {/* ── Breakdown & Billing Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Call status breakdown — voice only */}
          {isVoice && (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-sm font-bold text-slate-800">Call Breakdown</h2>
                <Link to="/dashboard/calls" className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors">
                  All Logs →
                </Link>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mb-5">
                {callBreakdown.total} calls filtered for the chosen range
              </p>

              {hasCallData ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <DonutChart data={callBreakdown.chartData} rate={callBreakdown.answerRate} />
                  <div className="flex-1 w-full space-y-3.5">
                    {callBreakdown.listItems.map(item => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {item.value} <span className="text-slate-400 font-medium">({item.pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                            transition={{ delay: 0.2, duration: 0.65, ease: 'easeOut' }}
                            className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 py-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                    <CallIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No call history matches range</p>
                    <Link to="/dashboard/ai-voice-agent" className="text-xs text-[var(--primary-blue)] hover:underline font-bold mt-1 block">
                      Create agent & dial test call →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          )}

          {/* Usage limit card */}
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <h2 className="text-sm font-bold text-slate-800 mb-3.5">Usage & Resource Limit</h2>

            <div className="rounded-xl p-4 mb-4 bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 font-bold">{isVoice ? 'Billing Minutes' : 'Chat Conversations'}</span>
                <span className={`text-xs font-extrabold ${(isVoice ? billingUsagePercent : (user?.chatLimit === -1 ? 0 : ((user?.chatUsed || 0) / (user?.chatLimit || 1)) * 100)) > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                  <AnimatedCounter value={isVoice ? billingMinutesUsed : (user?.chatUsed || 0)} />
                  {isVoice ? (
                    isUnlimitedMinutes
                      ? <span className="text-slate-400 font-semibold"> / ∞ mins</span>
                      : <span className="text-slate-400 font-semibold"> / {minutesLimit > 0 ? minutesLimit.toLocaleString() : '—'} mins</span>
                  ) : (
                    user?.chatLimit === -1
                      ? <span className="text-slate-400 font-semibold"> / ∞ chats</span>
                      : user?.chatLimit ? <span className="text-slate-400 font-semibold"> / {user.chatLimit.toLocaleString()} chats</span> : null
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-200">
                <motion.div initial={{ width: 0 }} animate={{ width: `${isVoice ? billingUsagePercent : (user?.chatLimit === -1 ? 0 : ((user?.chatUsed || 0) / (user?.chatLimit || 1)) * 100)}%` }}
                  transition={{ delay: 0.2, duration: 0.75, ease: 'easeOut' }}
                  className={`h-full rounded-full ${(isVoice ? billingUsagePercent : (user?.chatLimit === -1 ? 0 : ((user?.chatUsed || 0) / (user?.chatLimit || 1)) * 100)) > 80 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-[var(--primary-blue)] to-[#10B981]'}`} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{Math.round(isVoice ? billingUsagePercent : (user?.chatLimit === -1 ? 0 : ((user?.chatUsed || 0) / (user?.chatLimit || 1)) * 100))}% metrics consumed</span>
                {(isVoice ? billingUsagePercent : (user?.chatLimit === -1 ? 0 : ((user?.chatUsed || 0) / (user?.chatLimit || 1)) * 100)) > 80 && (
                  <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 text-rose-500">
                    ⚠ quota critical
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(isVoice ? [
                { label: 'Active Agents',   value: myAgentStats.active,   dotColor: 'bg-emerald-500 animate-pulse' },
                { label: 'Muted Agents',    value: myAgentStats.inactive,  dotColor: 'bg-slate-400' },
                { label: 'All Agents Count', value: myAgentStats.total,     dotColor: 'bg-blue-500' },
                { label: 'Captured Leads',  value: s.leadCount || 0,       dotColor: 'bg-amber-500', to: '/dashboard/leads' },
              ] : [
                { label: 'Chats Used',      value: user?.chatUsed || 0,   dotColor: 'bg-blue-500' },
                { label: 'Chats Available', value: user?.chatLimit === -1 ? 'Unlimited' : Math.max(0, (user?.chatLimit || 0) - (user?.chatUsed || 0)), dotColor: 'bg-emerald-500' },
                { label: 'Monthly Quota',   value: user?.chatLimit === -1 ? 'Unlimited' : (user?.chatLimit || 0), dotColor: 'bg-blue-500' },
                { label: 'Captured Leads',  value: s.leadCount || 0,       dotColor: 'bg-amber-500', to: '/dashboard/leads' },
              ]).map(item => {
                const inner = (
                  <div className="rounded-xl p-3 border transition-all bg-slate-50/50 border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between h-full cursor-pointer">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                    </div>
                    <p className="text-xl font-black text-slate-800">
                      {typeof item.value === 'number' ? (
                        <AnimatedCounter value={item.value} />
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                );
                return item.to
                  ? <Link key={item.label} to={item.to}>{inner}</Link>
                  : <div key={item.label}>{inner}</div>;
              })}
            </div>
          </motion.div>
        </div>

        {/* ── My Agents Grid ── */}
        {hasAgents ? (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AGENT FACTORY</p>
                  <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">My Agents</h2>
                </div>
                <Link to="/dashboard/ai-voice-agent" className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors">
                  Manage Agents →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myAgents.map((agent, i) => (
                  <AgentCard key={agent.id} agent={agent} index={i} onWebCall={handleWebCall} onCallMe={(a) => setCallTarget(a)} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : !loading && isVoice && (
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                <AgentIcon />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active agents</p>
                <Link to="/dashboard/ai-voice-agent" className="text-xs font-bold text-[var(--primary-blue)] hover:underline mt-0.5 block">
                  Create your first voice receptionist →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Recent Activity & Quick Actions ── */}
        {isVoice && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent call list */}
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ACTIVITY LOGS</p>
                  <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Recent Call Logs</h2>
                </div>
                <Link to="/dashboard/calls" className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors">
                  View All →
                </Link>
              </div>

              {hasRecentCalls ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {recentCalls.map((call, i) => {
                    const dur = formatDur(getCallDurSec(call));
                    const st  = callStatus[call.status] ?? callStatus.failed;
                    return (
                      <motion.div key={call.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setDetailCall(call)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:border-slate-300/60 cursor-pointer transition-all group shadow-sm active:scale-99"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dotColor }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.8">
                              <span className="text-xs font-bold text-slate-700 truncate">{call.agentName || 'AI Receptionist'}</span>
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${st.bg}`} style={{ color: st.color }}>
                                {st.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : 'Vapi Caller'} · {call.startedAt ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Data'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-400 font-mono">
                            {dur}
                          </span>
                          <svg className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-4 py-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                    <CallIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No call activity recorded</p>
                    <Link to="/dashboard/ai-voice-agent" className="text-xs font-bold text-[var(--primary-blue)] hover:underline mt-0.5 block">
                      Launch test dialer simulator →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick shortcuts */}
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: 'var(--slate-border)' }}>
            <h2 className="text-sm font-bold text-slate-800 mb-3.5">Quick Actions Sandbox</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/dashboard/ai-voice-agent',  title: 'Create Agent',   desc: 'Create new receptionist', icon: <AgentIcon />, color: 'var(--primary-blue)', bg: 'bg-blue-50/50' },
                { to: '/dashboard/calls',   title: 'Call History',   desc: 'Listen to recorded logs',  icon: <CallIcon />, color: '#10B981', bg: 'bg-green-50/50' },
                { to: '/dashboard/leads',   title: 'Synced Leads',   desc: 'Review pipeline captures', icon: <UsersIcon />, color: '#14B8A6', bg: 'bg-teal-50/50' },
                { to: '/dashboard/billing', title: 'Plan Limits',    desc: 'Top up calling minutes',  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, color: '#ef4444', bg: 'bg-rose-50/50' },
              ].map((action, i) => (
                <Link key={action.title} to={action.to} className="block">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2, borderColor: 'rgba(37,99,235,0.25)' }}
                    className="flex flex-col p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/40 cursor-pointer h-full justify-between transition-all shadow-sm"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.bg}`} style={{ color: action.color }}>
                      {action.icon}
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{action.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{action.desc}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <button onClick={handleRefresh} disabled={retrying}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 hover:bg-slate-50 transition-all text-slate-400 hover:text-[var(--primary-blue)] hover:border-slate-300 font-bold text-xs cursor-pointer"
            >
              <RefreshIcon spinning={retrying} />
              Refresh Dashboard Data
            </button>
          </motion.div>
        </div>
        )}
      </motion.div>

      {/* Embedded CSS animation waveforms */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default UserDashboard;