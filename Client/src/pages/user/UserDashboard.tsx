import {
  useEffect, useMemo, useState, useCallback, memo, useRef
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyStats } from '../../store/slices/analyticsSlice';
import { fetchMyCalls } from '../../store/slices/callsSlice';
import { fetchMyAgents } from '../../store/slices/agentsSlice';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingTour } from '../../components/OnboardingTour';
import { EmptyStateGuide } from '../../components/EmptyStateGuide';
import { HRCrmVoiceIntegrationCard } from '../../components/HRCrmVoiceIntegrationCard';
import { CallMeDialog } from '../../components/CallDialogs';
import { Modal } from '../../components/Modal';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { QuickLaunchBanner } from '../../components/dashboard/QuickLaunchBanner';
import { ChatWidgetEmbedCard } from '../../components/dashboard/ChatWidgetEmbedCard';
import { PerformanceTrendsCard } from '../../components/dashboard/PerformanceTrendsCard';
import { CallBreakdownCard } from '../../components/dashboard/CallBreakdownCard';
import { ChatUsageCard } from '../../components/dashboard/ChatUsageCard';
import { ChatQuickActionsCard } from '../../components/dashboard/ChatQuickActionsCard';
import { RecentCallLogsCard } from '../../components/dashboard/RecentCallLogsCard';
import { QuickActionsSandboxCard } from '../../components/dashboard/QuickActionsSandboxCard';
import { StatCard } from '../../components/dashboard/StatCard';
import { AnimatedCounter } from '../../components/dashboard/AnimatedCounter';
import { AgentCard } from '../../components/dashboard/AgentCard';
import { CallDetailsDrawer } from '../../components/dashboard/CallDetailsDrawer';
import VapiModule from '@vapi-ai/web';
import { callService, apiKeyService } from '../../services/api';
import { logger } from '../../utils/logger';
import { API_BASE_URL } from '../../config/api';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ToastContainer';
import { WebCallDialog } from '../../components/CallDialogs';
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
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap pointer-events-none z-50 shadow-md border bg-white border-slate-200/60 text-slate-600"
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
  const segments = data.reduce<Array<{ name: string; value: number; color: string; startAngle: number; sweep: number }>>((acc, d) => {
    const prevAngle = acc.length > 0 ? acc[acc.length - 1].startAngle + acc[acc.length - 1].sweep : -90;
    const sweep = (d.value / total) * 360;
    acc.push({ ...d, startAngle: prevAngle, sweep });
    return acc;
  }, []);

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

// ─── SVG Icons ────────────────────────────────────────────────────────
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
  const navigate = useNavigate();
  
  // Interactive layout states
  const [retrying, setRetrying] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // API Key state for widget embed
  const [widgetApiKey, setWidgetApiKey] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  
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
        logger.error('Failed to fetch API key:', err);
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
  const [nowTimestamp] = useState(() => Date.now());

  const filteredCalls = useMemo(() => {
    const dayMs = 86400000;
    return calls.filter(c => {
      if (!c.startedAt) return timeFilter === 'all';
      const diff = nowTimestamp - new Date(c.startedAt).getTime();
      if (timeFilter === '7d') return diff <= 7 * dayMs;
      if (timeFilter === '30d') return diff <= 30 * dayMs;
      return true; // 'all'
    });
  }, [calls, timeFilter, nowTimestamp]);

  const minutesUsed = useMemo(() => {
    const total = filteredCalls.reduce((acc, c) => acc + getCallDurSec(c), 0);
    return Math.round(total / 60);
  }, [filteredCalls]);

  const minutesLimit = user?.minutesLimit ?? 0;
  const isUnlimitedMinutes = minutesLimit === -1;
  const usagePercent = isUnlimitedMinutes ? 0 : minutesLimit > 0 ? Math.min((minutesUsed / minutesLimit) * 100, 100) : 0;

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
    const dayMs = 86400000;
    const pointsCount = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 15 : 20;
    
    const buckets = Array.from({ length: pointsCount }).map((_, idx) => {
      const d = new Date(nowTimestamp - (pointsCount - 1 - idx) * dayMs * (timeFilter === 'all' ? 2.5 : 1));
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
        const nextTime = buckets[i + 1]?.timestamp ?? nowTimestamp + dayMs;
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
  }, [filteredCalls, timeFilter, nowTimestamp]);

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
    if (!agent.vapiId) {
      navigate(`/dashboard/ai-phone-answering/${agent.id}`);
      return;
    }

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
        logger.error('[UserDashboard] Web Call VAPI error:', e);
        setWebCallMode('error');
        setWebCallErrorMsg(e?.message || 'Call failed.');
        addToast(e?.message || 'Web Call error.', 'error');
      };

      vapi.on('speech-start', onSpeechStart);
      vapi.on('call-end', onCallEnd);
      vapi.on('error', onError);

      await vapi.start(agent.vapiId);

      setWebCallMode('active');
      webCallTimerRef.current = setInterval(() => setWebCallSeconds(prev => prev + 1), 1000);
      webCallMaxDurationRef.current = setTimeout(() => stopWebCall(), 210_000); // 3.5 min duration
      addToast(`Connected with ${agent.name} via Web Call`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start Web call';
      logger.error('[UserDashboard] Web call failed:', err);
      setWebCallMode('error');
      setWebCallErrorMsg(message);
      addToast(message, 'error');
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate call';
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
        <DashboardHeader
          fadeUp={fadeUp}
          user={user}
          getGreeting={getGreeting}
          getPlanDisplayName={getPlanDisplayName}
          planColors={planColors}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          handleRefresh={handleRefresh}
          retrying={retrying}
          isVoice={isVoice}
          addToast={addToast}
          Tip={Tip}
          RefreshIcon={RefreshIcon}
          T={T}
        />

        {/* ── Quick Launch & Command Hub ── */}
        <QuickLaunchBanner fadeUp={fadeUp} />

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
          <ChatWidgetEmbedCard
            fadeUp={fadeUp}
            apiKeyLoading={apiKeyLoading}
            hasApiKey={hasApiKey}
            widgetApiKey={widgetApiKey}
            apiBaseUrl={API_BASE_URL}
            onGenerateKey={async () => {
              try {
                const { data } = await apiKeyService.regenerate();
                setWidgetApiKey(data.apiKey);
                setHasApiKey(true);
                addToast('API key generated successfully. Save it now - it won\'t be shown again!', 'success');
              } catch {
                addToast('Failed to generate API key', 'error');
              }
            }}
            onOpenRegenerateConfirm={() => setConfirmRegenerateOpen(true)}
            addToast={addToast}
          />
        )}

        {/* ── Regenerate Key Confirmation Modal ── */}
        <Modal
          isOpen={confirmRegenerateOpen}
          onClose={() => setConfirmRegenerateOpen(false)}
          title="Regenerate API Key?"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to regenerate your widget API key? Your existing key will be permanently invalidated and any active website widgets using the old key will stop working.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRegenerateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmRegenerateOpen(false);
                  try {
                    const { data } = await apiKeyService.regenerate();
                    setWidgetApiKey(data.apiKey);
                    addToast('API key regenerated. Save it now - it won\'t be shown again!', 'success');
                  } catch {
                    addToast('Failed to regenerate API key', 'error');
                  }
                }}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                Regenerate Key
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Chat Usage Breakdown ── */}
        {isChat && <ChatUsageCard fadeUp={fadeUp} user={user} AnimatedCounter={AnimatedCounter} />}

        {/* ── Quick Actions for Chat ── */}
        {isChat && !isVoice && <ChatQuickActionsCard fadeUp={fadeUp} UsersIcon={UsersIcon} />}

        {/* ── Performance Analytics Trends Section ── */}
        {isVoice && (
          <PerformanceTrendsCard
            fadeUp={fadeUp}
            chartTab={chartTab}
            setChartTab={setChartTab}
            performanceTrendData={performanceTrendData}
          />
        )}

        {/* ── Breakdown Row ── */}
        {isVoice && (
          <CallBreakdownCard
            fadeUp={fadeUp}
            callBreakdown={callBreakdown}
            hasCallData={hasCallData}
            DonutChart={DonutChart}
            CallIcon={CallIcon}
          />
        )}

        {/* ── HR CRM Voice Integration & Web Widget Card (Plan Gated) ── */}
        <motion.div variants={fadeUp}>
          <HRCrmVoiceIntegrationCard user={user} />
        </motion.div>

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
            <RecentCallLogsCard
              fadeUp={fadeUp}
              hasRecentCalls={hasRecentCalls}
              recentCalls={recentCalls}
              callStatus={callStatus}
              formatDur={formatDur}
              getCallDurSec={getCallDurSec}
              setDetailCall={setDetailCall}
              CallIcon={CallIcon}
            />

            <QuickActionsSandboxCard
              fadeUp={fadeUp}
              handleRefresh={handleRefresh}
              retrying={retrying}
              AgentIcon={AgentIcon}
              CallIcon={CallIcon}
              UsersIcon={UsersIcon}
              RefreshIcon={RefreshIcon}
            />
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