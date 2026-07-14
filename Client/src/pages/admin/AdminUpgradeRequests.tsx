import { useEffect, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchAllUpgradeRequests,
  processUpgradeRequest,
} from '../../store/slices/upgradeRequestsSlice';
import { checkAuth } from '../../store/slices/authSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import type { UpgradeRequest } from '../../types';

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
  pending:   { label: 'Pending',   pillBg: 'rgba(245,158,11,0.08)', pillBorder: 'rgba(245,158,11,0.20)', text: '#f59e0b', dot: '#f59e0b' },
  approved:  { label: 'Approved',  pillBg: 'rgba(16,185,129,0.08)', pillBorder: 'rgba(16,185,129,0.20)', text: '#10B981', dot: '#10B981' },
  rejected:  { label: 'Rejected',  pillBg: 'rgba(239,68,68,0.08)', pillBorder: 'rgba(239,68,68,0.20)', text: '#ef4444', dot: '#ef4444' },
};

const fallbackStatus = {
  label: 'Unknown',
  pillBg: 'rgba(100,100,100,0.08)',
  pillBorder: 'rgba(100,100,100,0.20)',
  text: '#666666',
  dot: '#666666',
};

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const planGradients: Record<string, string> = {
  free: 'linear-gradient(135deg, #94a3b8, #64748b)',
  starter: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
  growth: 'linear-gradient(135deg, #10B981, #059669)',
  enterprise: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',

  chat_free: 'linear-gradient(135deg, #94a3b8, #64748b)',
  chat_starter: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
  chat_growth: 'linear-gradient(135deg, #10B981, #059669)',
  chat_enterprise: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',

  voice_free: 'linear-gradient(135deg, #94a3b8, #64748b)',
  voice_starter: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
  voice_growth: 'linear-gradient(135deg, #10B981, #059669)',
  voice_enterprise: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',

  both_free: 'linear-gradient(135deg, #94a3b8, #64748b)',
  both_starter: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
  both_growth: 'linear-gradient(135deg, #10B981, #059669)',
  both_enterprise: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
};

export function AdminUpgradeRequests() {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((state) => state.upgradeRequests.all);
  const loading = useAppSelector((state) => state.upgradeRequests.loading);
  const pagination = useAppSelector((state) => state.upgradeRequests.pagination);
  const [filter, setFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards'); // ✅ Changed to cards by default on mobile

  // ✅ Use useEffect to detect mobile and set view mode
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setViewMode('cards');
    } else {
      setViewMode('table');
    }

    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
      if (isMobileNow && viewMode !== 'cards') {
        setViewMode('cards');
      } else if (!isMobileNow && viewMode === 'cards') {
        setViewMode('table');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchAllUpgradeRequests({ status: filter || undefined, page, limit: 20 }));
  }, [dispatch, filter, page]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const handleProcess = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await dispatch(processUpgradeRequest({ id, status })).unwrap();
      dispatch(checkAuth());
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = requests
    .filter((r) => !filter || r.status === filter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.currentPlan || '').toLowerCase().includes(q) ||
        (r.requestedPlan || '').toLowerCase().includes(q)
      );
    });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const columns: Column<UpgradeRequest>[] = [
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (req) => {
        const name = req.userName || req.userEmail || 'Unknown';
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
                {req.userName || '—'}
              </div>
              {req.userEmail && (
                <div className="text-[10px] text-slate-400 truncate">{req.userEmail}</div>
              )}
            </div>
          </div>
        );
      },
      card: {
        label: 'User',
        render: (req) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(req.userName || req.userEmail || 'U') }}
            >
              {(req.userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-700 truncate">{req.userName || '—'}</div>
              {req.userEmail && (
                <div className="text-[10px] text-slate-400 truncate">{req.userEmail}</div>
              )}
            </div>
          </div>
        ),
      },
    },
    {
      key: 'plans',
      header: 'Plan Upgrade',
      sortable: true,
      render: (req) => (
        <div className="flex items-center gap-2">
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-sm capitalize"
            style={{ background: planGradients[req.currentPlan] || 'var(--gg)' }}
          >
            {req.currentPlan}
          </span>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow-sm capitalize"
            style={{ background: planGradients[req.requestedPlan] || 'var(--gg)' }}
          >
            {req.requestedPlan}
          </span>
        </div>
      ),
      card: {
        label: 'Plan Upgrade',
        render: (req) => (
          <div className="flex items-center gap-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-white shadow-sm capitalize"
              style={{ background: planGradients[req.currentPlan] || 'var(--gg)' }}
            >
              {req.currentPlan}
            </span>
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            <span 
              className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-white shadow-sm capitalize"
              style={{ background: planGradients[req.requestedPlan] || 'var(--gg)' }}
            >
              {req.requestedPlan}
            </span>
          </div>
        ),
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (req) => {
        const sc = statusConfig[req.status] ?? fallbackStatus;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            req.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
            req.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
            'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              req.status === 'pending' ? 'bg-[#f59e0b]' :
              req.status === 'approved' ? 'bg-[#10B981]' :
              'bg-[#ef4444]'
            }`}/>
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (req) => {
          const sc = statusConfig[req.status] ?? fallbackStatus;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              req.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              req.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                req.status === 'pending' ? 'bg-[#f59e0b]' :
                req.status === 'approved' ? 'bg-[#10B981]' :
                'bg-[#ef4444]'
              }`}/>
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'createdAt',
      header: 'Requested',
      sortable: true,
      render: (req) => {
        const date = req.createdAt ? new Date(req.createdAt) : null;
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
        label: 'Requested',
        render: (req) => (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            {req.createdAt ? new Date(req.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </span>
        ),
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (req) => {
        if (req.status !== 'pending') return null;
        return (
          // ✅ Fixed action buttons for mobile - stacked on small screens
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-1.5 sm:gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleProcess(req.id, 'rejected');
              }}
              disabled={processing === req.id}
              className="px-3 py-2 sm:py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              Reject
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleProcess(req.id, 'approved');
              }}
              disabled={processing === req.id}
              className="px-4 py-2 sm:py-1.5 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
              style={{ background: 'var(--gg)' }}
            >
              {processing === req.id ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Approve
            </motion.button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 px-2 sm:pr-1">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ BILLING
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Upgrades
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">Upgrade Requests</h1>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Total',      value: stats.total,     accentColor: '37,99,235',   colorHex: '#2563EB', delta: 'All requests' },
            { label: 'Pending',    value: stats.pending,   accentColor: '245,158,11',  colorHex: '#f59e0b', delta: 'Awaiting review', trend: 'up' as const },
            { label: 'Approved',   value: stats.approved,  accentColor: '16,185,129',  colorHex: '#10B981', delta: 'Accepted' },
            { label: 'Rejected',   value: stats.rejected,  accentColor: '239,68,68',   colorHex: '#ef4444', delta: 'Declined' },
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
                className="rounded-2xl p-3 sm:p-5 border relative overflow-hidden transition-all duration-300 bg-white/70 shadow-sm backdrop-blur-md cursor-default"
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
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2 sm:mb-3 relative z-10">{s.label}</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <p className="text-xl sm:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
                    <AnimatedCounter value={s.value} />
                  </p>
                  {s.trend && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-green-600 bg-green-50">
                      ↑ {s.delta}
                    </span>
                  )}
                </div>
                {!s.trend && (
                  <p className="text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 text-slate-400 uppercase tracking-wider relative z-10">{s.delta}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Search & Filter ── */}
        <motion.div
  variants={fadeUp}
  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
>
  {/* Search */}
  <div className="relative w-full lg:max-w-md">
    <svg
      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>

    <input
      type="text"
      placeholder="Search by name, email, or plan…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200"
    />
  </div>

  {/* Filters */}
  <div className="flex items-center gap-2 flex-wrap lg:justify-end">
    {FILTERS.map((f) => (
      <button
        key={f.value}
        onClick={() => setFilter(f.value)}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
          filter === f.value
            ? "btn-cta text-white border-[#2563eb]"
            : "bg-white text-slate-500 border-slate-200"
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
</motion.div>
        {/* ── DataTable ── */}
        <motion.div variants={fadeUp}>
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(r) => r.id}
            cardTitle={(r) => r.userName || 'Request'}
            pageSize={filtered.length || 20}
            cardBadge={(r) => {
              const sc = statusConfig[r.status] ?? fallbackStatus;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  r.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                  r.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                  'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    r.status === 'pending' ? 'bg-[#f59e0b]' :
                    r.status === 'approved' ? 'bg-[#10B981]' :
                    'bg-[#ef4444]'
                  }`}/>
                  {sc.label}
                </span>
              );
            }}
            emptyState={{
              icon: (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 border border-slate-200">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              ),
              title: search ? 'No matching requests' : `No ${filter} requests`,
              description: search ? 'Try adjusting your search terms.' : 'All upgrade requests have been handled.',
            }}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </motion.div>
      </motion.div>
    </div>
  );
}