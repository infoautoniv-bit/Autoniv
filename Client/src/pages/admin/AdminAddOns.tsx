// AdminAddOns.tsx
import { useEffect, useMemo, useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAddOnCatalog, fetchAllAddOns, processAddOn, createCatalogEntry } from '../../store/slices/addOnsSlice';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { Dropdown } from '../../components/Dropdown';

// ── Define AddOnRequest type locally if not exported ──
interface AddOnRequest {
  id: string;
  addOnId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  addOn?: {
    id: string;
    title: string;
    icon?: string;
    price?: string;
    category?: string;
    description?: string;
  };
}

// ── Animation presets ──────────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const avatarPalette = [
  '#2563eb', '#10B981', '#00A3FF', '#14B8A6', '#8b5cf6', '#f59e0b',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

// ─── Animated Counter ──────────────────────────────────────────────────────
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
  pending: { label: 'Pending', pillBg: 'rgba(245,158,11,0.08)', pillBorder: 'rgba(245,158,11,0.20)', text: '#f59e0b', dot: '#f59e0b' },
  approved: { label: 'Approved', pillBg: 'rgba(16,185,129,0.08)', pillBorder: 'rgba(16,185,129,0.20)', text: '#10B981', dot: '#10B981' },
  rejected: { label: 'Rejected', pillBg: 'rgba(239,68,68,0.08)', pillBorder: 'rgba(239,68,68,0.20)', text: '#ef4444', dot: '#ef4444' },
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

const CATEGORY_STYLE: Record<string, string> = {
  recurring: 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]',
  'one-time': 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]',
};

// ── Sub-components ─────────────────────────────────────────────────────────
function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px] h-7">
      {values.map((v, idx) => (
        <div
          key={idx}
          className="flex-1 rounded-[2px] transition-all"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: color,
            opacity: 0.25 + (idx / values.length) * 0.75,
          }}
        />
      ))}
    </div>
  );
}

export function AdminAddOns() {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((s) => s.addOns.all) as AddOnRequest[];
  const catalog = useAppSelector((s) => s.addOns.catalog);
  const loading = useAppSelector((s) => s.addOns.loading);
  const pagination = useAppSelector((s) => s.addOns.pagination);

  const [filter, setFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [confirm, setConfirm] = useState<{
    id: string; status: 'approved' | 'rejected'; addOnTitle: string; userName: string;
  } | null>(null);

  const [showNewAddOn, setShowNewAddOn] = useState(false);
  const [newAddOn, setNewAddOn] = useState({
    id: '', icon: '', title: '', price: '', category: 'recurring', description: '',
  });
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  // ── Data fetching ──────────────────────────────────────────────────────
  useEffect(() => { dispatch(fetchAddOnCatalog()); }, [dispatch]);
  useEffect(() => {
    dispatch(fetchAllAddOns({ status: filter || undefined, page, limit: 20 }));
  }, [dispatch, filter, page]);
  useEffect(() => { setPage(1); }, [filter, search]);

  // ── Derived state ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    active: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }), [requests]);

  const filterCounts = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }), [requests]);

  const catalogWithStats = useMemo(() => catalog.map((c) => {
    const all = requests.filter((r) => r.addOnId === c.id);
    return {
      ...c,
      active: all.filter((r) => r.status === 'approved').length,
      pending: all.filter((r) => r.status === 'pending').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
      total: all.length,
      trend: Array.from({ length: 12 }, (_, idx) =>
        all.filter((r) => {
          const d = new Date(r.createdAt);
          return d.getMonth() === (new Date().getMonth() - 11 + idx + 12) % 12;
        }).length
      ),
    };
  }), [catalog, requests]);

  const filtered = useMemo(() => {
    let list = filter ? requests.filter((r) => r.status === filter) : requests;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        (r.addOn?.title || '').toLowerCase().includes(q) ||
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filter, search]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleProcess = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await dispatch(processAddOn({ id, status })).unwrap();
      setConfirm(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateCatalog = async () => {
    if (!newAddOn.id.trim() || !newAddOn.title.trim() || !newAddOn.price.trim()) {
      setCatalogError('ID, title, and price are required');
      return;
    }
    const emojis = ['📦', '🚀', '⚡', '🎯', '🔧', '💡', '🔔', '📊', '🧪', '💬', '🌐', '🔁', '🏷️', '🛠️', '📈', '🎨', '🔒', '📋', '🤝', '🏆'];
    const icon = emojis[Math.floor(Math.random() * emojis.length)];
    setSavingCatalog(true);
    setCatalogError('');
    try {
      await dispatch(createCatalogEntry({ ...newAddOn, icon })).unwrap();
      setShowNewAddOn(false);
      setNewAddOn({ id: '', icon: '', title: '', price: '', category: 'recurring', description: '' });
    } catch (err: any) {
      setCatalogError(err?.response?.data?.message || err?.message || 'Failed to create add-on');
    } finally {
      setSavingCatalog(false);
    }
  };

  const openNewAddOn = () => {
    setNewAddOn({ id: '', icon: '', title: '', price: '', category: 'recurring', description: '' });
    setCatalogError('');
    setShowNewAddOn(true);
  };

  // ── Columns for DataTable ──
  const columns: Column<AddOnRequest>[] = [
    {
      key: 'addOn',
      header: 'Add-On',
      sortable: true,
      render: (req) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm bg-slate-50 border border-slate-200">
            {req.addOn?.icon || '📦'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
              {req.addOn?.title || req.addOnId}
            </div>
            {req.addOn?.price && (
              <div className="text-[10px] text-[#10B981] font-semibold">{req.addOn.price}</div>
            )}
          </div>
        </div>
      ),
      card: {
        label: 'Add-On',
        render: (req) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-slate-50 border border-slate-200">
              {req.addOn?.icon || '📦'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-700 truncate">{req.addOn?.title || req.addOnId}</div>
              {req.addOn?.price && (
                <div className="text-[10px] text-[#10B981] font-semibold">{req.addOn.price}</div>
              )}
            </div>
          </div>
        ),
      },
    },
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (req) => {
        const sc = statusConfig[req.status] ?? fallbackStatus;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${req.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              req.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'pending' ? 'bg-[#f59e0b]' :
                req.status === 'approved' ? 'bg-[#10B981]' :
                'bg-[#ef4444]'
              }`} />
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (req) => {
          const sc = statusConfig[req.status] ?? fallbackStatus;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${req.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                req.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'pending' ? 'bg-[#f59e0b]' :
                  req.status === 'approved' ? 'bg-[#10B981]' :
                  'bg-[#ef4444]'
                }`} />
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: false,
      render: (req) => (
        <span className="text-xs text-slate-500 truncate max-w-[150px] block">
          {req.notes || '—'}
        </span>
      ),
      card: {
        label: 'Notes',
        render: (req) => (
          <span className="text-sm text-slate-600">{req.notes || '—'}</span>
        ),
      },
    },
    {
      key: 'createdAt',
      header: 'Submitted',
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
        label: 'Submitted',
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
          <div className="flex items-center justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setConfirm({
                  id: req.id, status: 'rejected',
                  addOnTitle: req.addOn?.title || req.addOnId,
                  userName: req.userName || 'this user',
                });
              }}
              disabled={processing === req.id}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Reject
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setConfirm({
                  id: req.id, status: 'approved',
                  addOnTitle: req.addOn?.title || req.addOnId,
                  userName: req.userName || 'this user',
                });
              }}
              disabled={processing === req.id}
              className="px-4 py-1.5 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              style={{ background: 'var(--gg)' }}
            >
              {processing === req.id ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ ADD-ONS
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Marketplace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">Add-On Marketplace</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, add-on, notes…"
                className="w-full sm:w-56 pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* New Add-On CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={openNewAddOn}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white shadow-sm hover:shadow-md"
              style={{ background: 'var(--gg, linear-gradient(135deg,#2563eb 0%,#10b981 100%))' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Add-On
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Catalog', value: catalog.length, accentColor: '16,185,129', colorHex: '#10B981', delta: 'Available items' },
            { label: 'Active', value: stats.active, accentColor: '37,99,235', colorHex: '#2563EB', delta: 'Customers using' },
            { label: 'Pending', value: stats.pending, accentColor: '245,158,11', colorHex: '#f59e0b', delta: 'Awaiting review', trend: 'up' as const },
            { label: 'Rejected', value: stats.rejected, accentColor: '239,68,68', colorHex: '#ef4444', delta: 'Declined' },
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

        {/* ── Catalog Grid ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb] mb-1">Catalog</p>
              <h2 className="text-lg font-extrabold text-slate-800">All add-on offerings</h2>
            </div>
            <p className="text-xs text-slate-400 self-end pb-0.5">
              {catalogWithStats.filter((c) => c.total > 0).length} of {catalog.length} in use
            </p>
          </div>

          {catalog.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-12 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-3xl">
                📦
              </div>
              <p className="text-sm font-bold text-slate-700">No add-ons in catalog</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Create your first add-on to get started.</p>
              <button
                onClick={openNewAddOn}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:shadow-md"
                style={{ background: 'var(--gg)' }}
              >
                Create Add-On
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {catalogWithStats.map((addon) => {
                const total = addon.active + addon.pending + addon.rejected;
                const activePct = total > 0 ? (addon.active / total) * 100 : 0;
                const pendingPct = total > 0 ? (addon.pending / total) * 100 : 0;
                const rejectedPct = total > 0 ? (addon.rejected / total) * 100 : 0;

                return (
                  <motion.div
                    key={addon.id}
                    variants={fadeUp}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={spring}
                    className="rounded-2xl p-5 border transition-all duration-300 bg-white/70 shadow-sm hover:shadow-md"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-slate-50 border border-slate-200">
                        {addon.icon || '📦'}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_STYLE[addon.category] || 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {addon.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-800 mb-1 line-clamp-1">{addon.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{addon.description}</p>
                    <p className="text-base font-extrabold text-[#10B981] mb-4">{addon.price}</p>

                    {total > 0 ? (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{total} requests</p>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden flex bg-slate-100">
                          <div className="h-full transition-all rounded-full" style={{ width: `${activePct}%`, background: 'linear-gradient(90deg,#10b981,#2563eb)' }} />
                          <div className="h-full transition-all rounded-full" style={{ width: `${pendingPct}%`, background: '#f59e0b' }} />
                          <div className="h-full transition-all rounded-full" style={{ width: `${rejectedPct}%`, background: '#ef4444' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 h-1.5 rounded-full bg-slate-100" />
                    )}

                    <div className="grid grid-cols-3 gap-1 py-3 border-t border-slate-200/50">
                      {[
                        { val: addon.active, label: 'Active', color: 'text-[#10B981]' },
                        { val: addon.pending, label: 'Pending', color: 'text-[#f59e0b]' },
                        { val: addon.rejected, label: 'Rejected', color: 'text-[#ef4444]' },
                      ].map(({ val, label, color }) => (
                        <div key={label} className="text-center">
                          <p className={`text-base font-extrabold tabular-nums ${color}`}>{val}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5 font-bold">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">12-month trend</p>
                        <p className="text-[10px] text-slate-400">{addon.trend.reduce((a, b) => a + b, 0)} total</p>
                      </div>
                      <SparkBar values={addon.trend} color="#10b981" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Requests ── */}
        <motion.div variants={fadeUp}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563eb] mb-1">Requests</p>
              <h2 className="text-lg font-extrabold text-slate-800">
                {filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'All'} requests
                {filtered.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
                )}
              </h2>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
              {FILTERS.map((f) => {
                const isActive = filter === f.value;
                const count = filterCounts[f.value as keyof typeof filterCounts];
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isActive ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {f.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request List as DataTable */}
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(r) => r.id}
            cardTitle={(r) => r.addOn?.title || r.addOnId}
            pageSize={filtered.length || 20}
            cardBadge={(r) => {
              const sc = statusConfig[r.status] ?? fallbackStatus;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${r.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                    r.status === 'approved' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                    'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
                  }`}>
                  <span className={`w-1 h-1 rounded-full ${r.status === 'pending' ? 'bg-[#f59e0b]' :
                      r.status === 'approved' ? 'bg-[#10B981]' :
                      'bg-[#ef4444]'
                    }`} />
                  {sc.label}
                </span>
              );
            }}
            emptyState={{
              icon: (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-50 border border-slate-200">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              ),
              title: search ? 'No matching requests' : `No ${filter} requests`,
              description: search ? 'Try adjusting your search terms.' : 'All add-on requests for this status have been handled.',
            }}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </motion.div>
      </motion.div>

      {/* ── Confirm modal ── */}
      <Modal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.status === 'approved' ? 'Approve request?' : 'Reject request?'}
        size="sm"
      >
        {confirm && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                style={{ background: confirm.status === 'approved' ? 'var(--gg)' : 'linear-gradient(135deg,#f87171,#ef4444)' }}
              >
                {confirm.status === 'approved' ? '✓' : '✕'}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">{confirm.addOnTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">Requested by {confirm.userName}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {confirm.status === 'approved'
                ? 'This will activate the add-on for the customer immediately. They will be notified.'
                : 'This will decline the request. The customer can submit a new request later if needed.'}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcess(confirm.id, confirm.status)}
                disabled={!!processing}
                className="px-4 py-2 text-sm text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                style={{
                  background: confirm.status === 'approved'
                    ? 'var(--gg)'
                    : 'linear-gradient(135deg,#f87171,#ef4444)',
                }}
              >
                {processing ? 'Processing…' : confirm.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── New Add-On modal ── */}
      <Modal
        isOpen={showNewAddOn}
        onClose={() => setShowNewAddOn(false)}
        title="Create New Add-On"
        size="md"
      >
        <div className="space-y-4">
          {catalogError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {catalogError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID (slug) *</label>
              <input
                value={newAddOn.id}
                onChange={(e) => setNewAddOn({ ...newAddOn, id: e.target.value })}
                placeholder="e.g. performance-report"
                className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm bg-white/80 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title *</label>
              <input
                value={newAddOn.title}
                onChange={(e) => setNewAddOn({ ...newAddOn, title: e.target.value })}
                placeholder="Monthly Performance Report"
                className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm bg-white/80 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price *</label>
              <input
                value={newAddOn.price}
                onChange={(e) => setNewAddOn({ ...newAddOn, price: e.target.value })}
                placeholder="₹4,999 / month"
                className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm bg-white/80 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <Dropdown
                value={newAddOn.category}
                options={[
                  { value: 'recurring', label: 'Recurring' },
                  { value: 'one-time', label: 'One-Time' },
                ]}
                onChange={(val) => setNewAddOn({ ...newAddOn, category: val })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={newAddOn.description}
              onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
              rows={3}
              placeholder="What does this add-on include?"
              className="w-full px-4 py-2.5 rounded-xl text-slate-700 text-sm bg-white/80 border border-slate-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all resize-none placeholder-slate-400 shadow-sm"
            />
          </div>

          <p className="text-[10px] text-slate-400">* Required fields. An icon will be assigned automatically.</p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowNewAddOn(false)}
            className="px-4 py-2 text-sm rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCatalog}
            disabled={savingCatalog}
            className="px-5 py-2 text-sm text-white rounded-lg font-bold transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
            style={{ background: 'var(--gg)' }}
          >
            {savingCatalog ? 'Creating…' : 'Create Add-On'}
          </button>
        </div>
      </Modal>
    </div>
  );
}