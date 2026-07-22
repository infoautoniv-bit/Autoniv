// AdminBilling.tsx
import { useEffect, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchUsage, fetchOverview } from '../../store/slices/analyticsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';

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

interface UsageData {
  id: string;
  name: string;
  email?: string;
  plan: string;
  minutesUsed: number;
  minutesLimit: number;
  callCount: number;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: null,
    setupFee: 0,
    callsPerMonth: 100,
    badge: null,
    features: ['1 chatbot', '100 conversations/mo', 'Website embed', 'Basic FAQ & lead capture'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 1499,
    annualPrice: null,
    setupFee: 0,
    callsPerMonth: 1500,
    badge: null,
    features: ['2 chatbots', '1,500 conversations/mo', 'WhatsApp + website', 'Branding removed', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 4999,
    annualPrice: null,
    setupFee: 0,
    callsPerMonth: 6000,
    badge: 'Most Popular',
    features: ['Unlimited chatbots', '6,000 conversations/mo', 'All channels incl. WhatsApp & Instagram', 'CRM & helpdesk integrations'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    annualPrice: null,
    setupFee: 0,
    callsPerMonth: 99999,
    badge: null,
    features: ['Unlimited chatbots', 'Unlimited conversations', 'Custom AI model training', 'DPDP Act 2023 compliance'],
  },
];

const planGradients: Record<string, string> = {
  free: 'linear-gradient(135deg, #94a3b8, #64748b)',
  starter: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
  growth: 'linear-gradient(135deg, #10B981, #059669)',
  enterprise: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
};

export function AdminBilling() {
  const dispatch = useAppDispatch();
  const usage = useAppSelector((state) => state.analytics.usage);
  const overview = useAppSelector((state) => state.analytics.overview);
  const loading = useAppSelector((state) => state.analytics.loading);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'usage' | 'plans'>('usage');
  const [search, setSearch] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    dispatch(fetchUsage(period));
    dispatch(fetchOverview());
  }, [dispatch, period]);

  const filteredUsage = usage.filter((u: UsageData) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.plan.toLowerCase().includes(q);
  });

  const totalCalls = usage.reduce((acc, u) => acc + (u.callCount || 0), 0);
  const totalRevenue = usage.reduce((acc, u) => {
    const plan = plans.find(p => p.id === u.plan);
    return acc + (plan?.price || 0);
  }, 0);

  const stats = [
    { 
      label: 'Total Users',    
      value: overview?.totalUsers ?? 0,           
      accentColor: '37,99,235',
      colorHex: '#2563EB',
      delta: 'Platform accounts'
    },
    { 
      label: 'Active Agents',  
      value: overview?.activeAgents ?? 0,         
      accentColor: '16,185,129',
      colorHex: '#10B981',
      delta: 'Currently active',
      trend: 'up' as const
    },
    { 
      label: 'Total Minutes',  
      value: overview?.totalMinutes ?? 0,         
      accentColor: '245,158,11',
      colorHex: '#f59e0b',
      delta: 'Minutes consumed',
      format: (v: number) => `${v.toLocaleString()}m`
    },
    { 
      label: 'Total Calls',    
      value: totalCalls,                          
      accentColor: '37,99,235',
      colorHex: '#2563EB',
      delta: 'All calls'
    },
    { 
      label: 'MRR',            
      value: totalRevenue,                         
      accentColor: '16,185,129',
      colorHex: '#10B981',
      delta: 'Monthly recurring',
      format: (v: number) => `₹${(v / 1000).toFixed(1)}K`
    },
  ];

  const usageColumns: Column<UsageData>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (user) => {
        const name = user.name || 'Unknown';
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
                {user.name}
              </div>
              {user.email && (
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              )}
            </div>
          </div>
        );
      },
      card: {
        label: 'User',
        render: (user) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(user.name) }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-700 truncate">{user.name}</div>
              {user.email && (
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              )}
            </div>
          </div>
        ),
      },
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      render: (user) => {
        const plan = plans.find(p => p.id === user.plan);
        return (
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-sm"
            style={{ background: planGradients[user.plan] || 'var(--gg)' }}
          >
            {plan?.name || user.plan}
          </span>
        );
      },
      card: {
        label: 'Plan',
        render: (user) => {
          const plan = plans.find(p => p.id === user.plan);
          return (
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-sm"
              style={{ background: planGradients[user.plan] || 'var(--gg)' }}
            >
              {plan?.name || user.plan}
            </span>
          );
        },
      },
    },
    {
      key: 'callCount',
      header: 'Calls',
      sortable: true,
      render: (user) => (
        <span className="text-xs font-bold text-slate-700 tabular-nums">{user.callCount || 0}</span>
      ),
      card: {
        label: 'Calls',
        render: (user) => (
          <span className="text-sm font-bold text-slate-700 tabular-nums">{user.callCount || 0}</span>
        ),
      },
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      render: (user) => {
        const plan = plans.find(p => p.id === user.plan);
        return (
          <span className="text-xs font-bold text-[#10B981] tabular-nums">
            ₹{plan?.price.toLocaleString() || 0}
          </span>
        );
      },
      card: {
        label: 'Revenue',
        render: (user) => {
          const plan = plans.find(p => p.id === user.plan);
          return (
            <span className="text-sm font-bold text-[#10B981] tabular-nums">
              ₹{plan?.price.toLocaleString() || 0}
            </span>
          );
        },
      },
    },
    {
      key: 'usage',
      header: 'Usage',
      sortable: true,
      render: (user) => {
        const plan = plans.find(p => p.id === user.plan);
        const callLimit = plan?.callsPerMonth || 120;
        const usagePercent = Math.min((user.callCount / callLimit) * 100, 100);
        return (
          <div className="w-32">
            <div className="h-2 rounded-full overflow-hidden bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  usagePercent > 90 ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
                  usagePercent > 70 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                  'bg-gradient-to-r from-[#2563eb] to-[#10B981]'
                }`}
              />
            </div>
            <div className="text-[10px] mt-1 text-slate-400 tabular-nums font-semibold">
              {usagePercent.toFixed(0)}%
            </div>
          </div>
        );
      },
      card: {
        label: 'Usage',
        render: (user) => {
          const plan = plans.find(p => p.id === user.plan);
          const callLimit = plan?.callsPerMonth || 120;
          const usagePercent = Math.min((user.callCount / callLimit) * 100, 100);
          return (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">{user.callCount} / {callLimit} calls</span>
                <span className="tabular-nums text-slate-400 font-semibold">{usagePercent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usagePercent > 90 ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
                    usagePercent > 70 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                    'bg-gradient-to-r from-[#2563eb] to-[#10B981]'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
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
                ◈ FINANCE
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Billing
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">Billing & Revenue</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Tab Toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
              {(['usage', 'plans'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'btn-cta text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'usage' ? 'User Usage' : 'Plan Management'}
                </button>
              ))}
            </div>
            {/* Period Toggle */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPeriod(r)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    period === r
                      ? 'btn-cta text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((s) => {
            const isHov = hoveredCard === s.label;
            const displayValue = s.format ? s.format(s.value) : s.value;
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
                    {typeof displayValue === 'number' ? (
                      <AnimatedCounter value={displayValue} />
                    ) : (
                      displayValue
                    )}
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

        {/* ── Search ── */}
        {activeTab === 'usage' && (
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or plan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-xs font-bold">Loading…</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Usage Table ── */}
        {activeTab === 'usage' && (
          <motion.div variants={fadeUp}>
            <DataTable
              columns={usageColumns}
              data={filteredUsage}
              loading={loading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              keyExtractor={(u) => u.id}
              cardTitle={(u) => u.name}
              pageSize={filteredUsage.length || 20}
              emptyState={{
                icon: (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 border border-slate-200">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                  </div>
                ),
                title: 'No usage data',
                description: 'User usage statistics will appear here once calls start.',
              }}
              defaultSort={{ key: 'callCount', direction: 'desc' }}
            />
            
            {/* Footer Summary - rendered outside DataTable */}
            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white/70 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-400">{filteredUsage.length} user{filteredUsage.length !== 1 ? 's' : ''}</p>
              <p className="text-xs font-bold text-[#2563eb]">Total MRR: ₹{totalRevenue.toLocaleString()}/mo</p>
            </div>
          </motion.div>
        )}

        {/* ── Plan Management ── */}
        {activeTab === 'plans' && (
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const usersOnPlan = usage.filter(u => u.plan === plan.id).length;
                const revenue = usersOnPlan * plan.price;
                const isPopular = plan.badge === 'Most Popular';
                return (
                  <motion.div
                    key={plan.id}
                    variants={fadeUp}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={spring}
                    className="rounded-2xl p-6 border relative overflow-hidden transition-all duration-300 bg-white/70 shadow-sm backdrop-blur-md"
                    style={{
                      borderColor: isPopular ? '#10B981' : '#e2e8f0',
                      borderWidth: isPopular ? '2px' : '1px',
                      boxShadow: isPopular ? '0 8px 30px rgba(16,185,129,0.15)' : '0 1px 3px rgba(37,99,235,0.01)',
                    }}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-[#10B981] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                          {plan.badge}
                        </div>
                      </div>
                    )}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm mb-3"
                      style={{ background: planGradients[plan.id] }}
                    >
                      {plan.name.charAt(0)}
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-extrabold text-slate-800">₹{plan.price.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">/mo</span>
                    </div>
                    <div className="h-px my-4 bg-slate-200" />
                    <ul className="space-y-2.5 mb-5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscribers</span>
                        <span className="text-sm font-extrabold text-slate-800">{usersOnPlan}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                        <span className="text-sm font-extrabold text-[#10B981]">₹{revenue.toLocaleString()}/mo</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}