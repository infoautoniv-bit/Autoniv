// AdminDashboard.tsx — Premium design matching UserDashboard
import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchOverview, fetchTrends, fetchPeriodOverview,
} from '../../store/slices/analyticsSlice';
import { fetchAllAgents } from '../../store/slices/agentsSlice';

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

// ─── Toast system ─────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const colors = {
            success: { bg: '#10B981', border: 'rgba(16,185,129,0.3)' },
            error:   { bg: '#ef4444', border: 'rgba(239,68,68,0.3)' },
            warning: { bg: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
            info:    { bg: '#2563eb', border: 'rgba(37,99,235,0.3)' },
          };
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.88 }}
              transition={spring}
              onClick={() => remove(t.id)}
              className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border cursor-pointer select-none shadow-md backdrop-blur-md bg-white/95"
              style={{
                borderColor: colors[t.type].border,
                boxShadow: `0 8px 32px rgba(37,99,235,0.06), 0 0 0 1px ${colors[t.type].border}`,
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[t.type].bg }} />
              <span className="text-xs font-semibold text-slate-700">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

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
    <div className="rounded-2xl p-5 border border-slate-200 bg-white/70 shadow-sm">
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
    <div className="rounded-2xl p-5 border border-slate-200 bg-white/70 shadow-sm">
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

// ─── Stat Card ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  colorHex: string;
  hoveredCard: string | null;
  setHoveredCard: (val: string | null) => void;
}

const StatCard = memo(({ label, value, icon, accentColor, delta, trend, colorHex, hoveredCard, setHoveredCard }: StatCardProps) => {
  const isHovered = hoveredCard === label;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={spring}
      onMouseEnter={() => setHoveredCard(label)}
      onMouseLeave={() => setHoveredCard(null)}
      className="rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 cursor-default bg-white/70 shadow-sm backdrop-blur-md"
      style={{
        borderColor: isHovered ? `rgba(${accentColor},0.3)` : 'var(--slate-border, #e2e8f0)',
        boxShadow: isHovered ? `0 12px 36px rgba(${accentColor},0.08)` : '0 1px 3px rgba(37,99,235,0.01)',
      }}
    >
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.35 }}
        style={{ background: `radial-gradient(circle, rgba(${accentColor},0.08) 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between mb-3.5 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${accentColor},0.10)` }}>
          <span style={{ color: colorHex }}>{icon}</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl sm:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            <AnimatedCounter value={value} />
          </p>
          {trend && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
              trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
            </span>
          )}
        </div>
        {!trend && delta && (
          <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider">{delta}</p>
        )}
      </div>
    </motion.div>
  );
});

// ─── SVG Icons ────────────────────────────────────────────────────────
function UsersIcon()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>; }
function AgentIcon()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>; }
function CallIcon()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function ClockIcon()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function OffIcon()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>; }
function RefreshIcon({ spinning }: { spinning?: boolean }) { return <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>; }

// ─── Agent type config ─────────────────────────────────────────────────
const typeConfig: Record<string, { label: string; color: string }> = {
  receptionist: { label: 'Receptionist', color: '#2563eb' },
  appointment:  { label: 'Appointment',  color: '#00A3FF' },
  faq:          { label: 'FAQ',          color: '#14B8A6' },
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────
export function AdminDashboard() {
  const dispatch      = useAppDispatch();
  const stats         = useAppSelector((state) => state.analytics.overview);
  const trends        = useAppSelector((state) => state.analytics.trends);
  const periodOverview = useAppSelector((state) => state.analytics.periodOverview);
  const agents        = useAppSelector((state) => state.agents.items);
  const agentsLoading = useAppSelector((state) => state.agents.loading);
  const analyticsLoading = useAppSelector((state) => state.analytics.loading);

  const [timeRange, setTimeRange]     = useState<'7d' | '30d' | '90d'>('30d');
  const [chartTab, setChartTab]       = useState<'calls' | 'minutes'>('calls');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [retrying, setRetrying]       = useState(false);

  const { toasts, add: addToast, remove: removeToast } = useToast();

  const loadData = useCallback(() => {
    dispatch(fetchOverview());
    dispatch(fetchTrends(timeRange));
    dispatch(fetchPeriodOverview(timeRange));
    if (agents.length === 0) dispatch(fetchAllAgents());
  }, [dispatch, timeRange, agents.length]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRetrying(true);
    await Promise.all([
      dispatch(fetchOverview()),
      dispatch(fetchTrends(timeRange)),
      dispatch(fetchPeriodOverview(timeRange)),
      dispatch(fetchAllAgents()),
    ]);
    setTimeout(() => {
      setRetrying(false);
      addToast('Dashboard refreshed successfully ✨', 'success');
    }, 850);
  }, [dispatch, timeRange, addToast]);

  const po = periodOverview || {
    totalUsers: 0, activeAgents: 0, inactiveAgents: 0,
    totalAgents: 0, totalMinutes: 0, totalCalls: 0,
  };

  const agentStats = useMemo(() => ({
    active:   agents.filter(a => a.isActive).length,
    inactive: agents.filter(a => !a.isActive).length,
    total:    agents.length,
  }), [agents]);

  // Chart data from trends
  const chartData = useMemo(() =>
    (trends || []).map(point => ({
      name: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Call Volume': point.calls,
      'Minutes Used': point.minutes,
    })), [trends]);

  const hasChartData = chartData.length > 0 && chartData.some(d => d['Call Volume'] > 0 || d['Minutes Used'] > 0);

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <UsersIcon />,
      accentColor: '37,99,235',
      colorHex: '#2563EB',
      delta: 'Platform accounts',
    },
    {
      label: 'Active Agents',
      value: stats?.activeAgents || 0,
      icon: <AgentIcon />,
      accentColor: '16,185,129',
      colorHex: '#10B981',
      delta: `${agentStats.total} total agents`,
      trend: 'up' as const,
    },
    {
      label: 'Inactive Agents',
      value: stats?.inactiveAgents || 0,
      icon: <OffIcon />,
      accentColor: '245,158,11',
      colorHex: '#f59e0b',
      delta: 'Paused or muted',
    },
    {
      label: `Calls (${timeRange})`,
      value: po.totalCalls,
      icon: <CallIcon />,
      accentColor: '0,163,255',
      colorHex: '#00A3FF',
      delta: 'Platform wide',
      trend: po.totalCalls > 0 ? ('up' as const) : undefined,
    },
    {
      label: `Minutes (${timeRange})`,
      value: po.totalMinutes,
      icon: <ClockIcon />,
      accentColor: '20,184,166',
      colorHex: '#14B8A6',
      delta: 'Billed minutes',
    },
  ];

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200/60 p-3 bg-white/95 backdrop-blur-md shadow-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xs font-bold text-slate-800 mt-1">
            {chartTab === 'calls'
              ? `${payload[0].value} calls total`
              : `${payload[0].value} minutes billed`}
          </p>
        </div>
      );
    }
    return null;
  };

  const isLoading = analyticsLoading && !stats;

  // Loading skeleton
  if (isLoading) {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => <SkeletonBlock key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="h-full overflow-y-auto space-y-6 pb-12 pr-2"
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ ADMIN CONTROL CENTER
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[var(--primary)] border-blue-200/50">
                Platform Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
              Admin Dashboard
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time range toggle */}
            <div className="flex rounded-xl border bg-white p-0.5" style={{ borderColor: '#e2e8f0' }}>
              {(['7d', '30d', '90d'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setTimeRange(r);
                    addToast(`Switched to ${r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'} view`, 'info');
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    timeRange === r ? 'bg-[var(--primary-soft,#eff6ff)] text-[var(--primary,#2563eb)]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {r === '7d' ? '7D' : r === '30d' ? '30D' : '90D'}
                </button>
              ))}
            </div>

            <Tip text="Refresh dashboard data">
              <button
                onClick={handleRefresh}
                disabled={retrying}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-50 bg-white hover:bg-slate-50 border-slate-200 text-slate-500 cursor-pointer"
              >
                <RefreshIcon spinning={retrying} />
              </button>
            </Tip>

            <Link to="/admin/users">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-sm cursor-pointer hover:shadow-md"
                style={{ background: 'var(--gg, linear-gradient(135deg, #2563eb 0%, #10b981 100%))' }}
              >
                <UsersIcon />
                Manage Users
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map(card => (
            <StatCard
              key={card.label}
              {...card}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
            />
          ))}
        </div>

        {/* ── Performance Trends Chart ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ANALYTICS ENGINE</p>
              <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Platform Performance Trends</h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/50">
                <button
                  onClick={() => setChartTab('calls')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    chartTab === 'calls' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                  Minutes
                </button>
              </div>
            </div>
          </div>

          {hasChartData ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminChartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
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
                    dataKey={chartTab === 'calls' ? 'Call Volume' : 'Minutes Used'}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adminChartGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                  <CallIcon />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No chart data for this range</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Analytics will appear once calls are placed</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Stats Overview + All Agents ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Platform summary mini-stats */}
          <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="text-sm font-bold text-slate-800 mb-1">Platform Summary</h2>
            <p className="text-[10px] font-semibold text-slate-400 mb-5">
              Key metrics across the {timeRange} window
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { label: 'Total Users',      value: stats?.totalUsers    || 0, color: 'text-[#2563eb]',   bg: 'bg-blue-50/50',   to: '/admin/users'   },
                { label: 'Active Agents',    value: agentStats.active,         color: 'text-green-600',   bg: 'bg-green-50/50'                         },
                { label: 'Inactive Agents',  value: agentStats.inactive,       color: 'text-amber-500',   bg: 'bg-amber-50/50'                         },
                { label: 'Total Agents',     value: agentStats.total,          color: 'text-[#14B8A6]',   bg: 'bg-teal-50/50',   to: '/admin/agents'  },
              ].map(item => {
                const inner = (
                  <div className={`rounded-xl p-3 border transition-all ${item.bg} border-slate-100 hover:border-slate-200`}>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                    <p className={`text-xl font-extrabold ${item.color}`}>
                      <AnimatedCounter value={item.value} />
                    </p>
                  </div>
                );
                return item.to
                  ? <Link key={item.label} to={item.to}>{inner}</Link>
                  : <div key={item.label}>{inner}</div>;
              })}
            </div>

            {/* Period totals bar */}
            <div className="rounded-xl p-4 bg-slate-50/70 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 font-bold">Platform Calls ({timeRange})</span>
                <span className="text-xs font-extrabold text-slate-800">
                  <AnimatedCounter value={po.totalCalls} />
                  <span className="text-slate-400 font-semibold ml-1">calls</span>
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: po.totalCalls > 0 ? '100%' : '0%' }}
                  transition={{ delay: 0.2, duration: 0.75, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#10B981]"
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {po.totalMinutes.toLocaleString()} minutes billed
                </span>
              </div>
            </div>
          </motion.div>

          {/* All Agents list */}
          <motion.div
            variants={fadeUp}
            className={`rounded-2xl border bg-white/70 shadow-sm backdrop-blur-md flex flex-col ${
              agents.length > 0 ? 'p-5 lg:h-[420px]' : 'p-5'
            }`}
            style={{ borderColor: '#e2e8f0' }}
          >
            {agentsLoading && agents.length === 0 ? (
              <div className="flex items-center gap-3 py-4" style={{ color: '#94a3b8' }}>
                <svg className="animate-spin w-4 h-4 flex-shrink-0 text-[#2563eb]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-slate-400">Loading agents...</span>
              </div>
            ) : agents.length > 0 ? (
              <>
                {/* Card header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-2">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AGENT FACTORY</p>
                    <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">All Agents</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-semibold">
                      <span className="font-bold">{agentStats.active}</span> active
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400 font-semibold">
                      <span className="font-bold">{agentStats.inactive}</span> inactive
                    </span>
                    <Link
                      to="/admin/agents"
                      className="text-[10px] ml-1 font-bold uppercase tracking-wider text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                    >
                      View All →
                    </Link>
                  </div>
                </div>

                {/* Scrollable agent list */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
                  <div className="space-y-1.5">
                    {agents.map((agent, i) => {
                      const tc = typeConfig[agent.type] ?? typeConfig.receptionist;
                      const isActive = agent.isActive !== false;
                      return (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border hover:border-slate-300/60 transition-all group cursor-default"
                          style={{ background: 'rgba(248,250,252,0.7)', borderColor: '#e2e8f0' }}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {/* Avatar */}
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm"
                              style={{ background: tc.color }}
                            >
                              {agent.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Name + type + user */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-700 truncate">{agent.name}</p>
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                  style={
                                    isActive
                                      ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                                      : { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
                                  }
                                >
                                  <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                  {isActive ? 'Active' : 'Muted'}
                                </span>
                              </div>
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 hidden sm:block">
                                {tc.label} · {(agent as any).userName || 'Unknown user'}
                              </p>
                            </div>
                          </div>

                          {/* Call count */}
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-[10px] font-semibold text-slate-400 font-mono">
                              {(agent.callCount || 0).toLocaleString()} calls
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                  <AgentIcon />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No agents created yet</p>
                  <Link to="/admin/agents" className="text-xs font-bold text-[#2563eb] hover:underline mt-0.5 block">
                    Manage agents →
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Quick Actions ── */}
        <motion.div variants={fadeUp} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-sm font-bold text-slate-800 mb-3.5">Quick Admin Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { to: '/admin/users',    title: 'Manage Users',    desc: 'View & edit user accounts',   icon: <UsersIcon />, color: '#2563eb', bg: 'bg-blue-50/50'  },
              { to: '/admin/agents',   title: 'All Agents',      desc: 'Platform-wide agent list',    icon: <AgentIcon />, color: '#10B981', bg: 'bg-green-50/50' },
              { to: '/admin/calls',    title: 'Call Logs',       desc: 'Inspect all platform calls',  icon: <CallIcon />,  color: '#00A3FF', bg: 'bg-sky-50/50'   },
              { to: '/admin/billing',  title: 'Billing',         desc: 'Revenue & usage reports',     icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, color: '#ef4444', bg: 'bg-rose-50/50' },
            ].map((action, i) => (
              <Link key={action.title} to={action.to} className="block">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
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

          <button
            onClick={handleRefresh}
            disabled={retrying}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#2563eb] hover:border-slate-300 font-bold text-xs cursor-pointer"
          >
            <RefreshIcon spinning={retrying} />
            Refresh Dashboard Data
          </button>
        </motion.div>

      </motion.div>
    </>
  );
}
