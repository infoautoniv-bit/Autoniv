import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAllLeads } from '../../store/slices/leadsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { leadService } from '../../services/api';
import type { Lead } from '../../types';

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
  new:       { label: 'New',       pillBg: 'rgba(37,99,235,0.08)', pillBorder: 'rgba(37,99,235,0.20)', text: '#2563eb', dot: '#2563eb' },
  contacted: { label: 'Contacted', pillBg: 'rgba(245,158,11,0.08)', pillBorder: 'rgba(245,158,11,0.20)', text: '#f59e0b', dot: '#f59e0b' },
  converted: { label: 'Converted', pillBg: 'rgba(16,185,129,0.08)', pillBorder: 'rgba(16,185,129,0.20)', text: '#10B981', dot: '#10B981' },
  lost:      { label: 'Lost',      pillBg: 'rgba(239,68,68,0.08)', pillBorder: 'rgba(239,68,68,0.20)', text: '#ef4444', dot: '#ef4444' },
};

const fallbackStatus = {
  label: 'Unknown',
  pillBg: 'rgba(100,100,100,0.08)',
  pillBorder: 'rgba(100,100,100,0.20)',
  text: '#666666',
  dot: '#666666',
};

const FILTERS = [
  { value: '',   label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost',  label: 'Lost' },
];

// ─── Lead Detail Modal ────────────────────────────────────────────────
function LeadDetailModal({ 
  lead, 
  open, 
  onClose 
}: { 
  lead: Lead | null; 
  open: boolean; 
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && lead && (
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
                  style={{ background: getAvatarColor(lead.name || 'U') }}
                >
                  {(lead.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#2563eb]">Lead Details</p>
                  <h2 className="text-sm font-extrabold text-slate-800 leading-tight truncate">{lead.name || 'Unknown Lead'}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'No date'}
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
                  { label: 'Phone', value: lead.phone || '—', mono: true },
                  { label: 'Email', value: lead.email || '—' },
                  { label: 'Purpose', value: lead.purpose || '—' },
                  { label: 'Agent', value: lead.agentName || '—' },
                  { label: 'Status', value: (statusConfig[lead.status || 'new'] ?? fallbackStatus).label },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50/60 border border-slate-100 px-3.5 py-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-semibold text-slate-700 block truncate ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Notes</p>
                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
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

export function AdminLeads() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.items) ?? [];
  const loading = useAppSelector((state) => state.leads.loading);
  const pagination = useAppSelector((state) => state.leads.pagination);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'public'>('all');
  const [publicLeads, setPublicLeads] = useState<Lead[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicPagination, setPublicPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (activeTab === 'all') {
      dispatch(fetchAllLeads({ page, limit: 20 }));
    } else {
      setPublicLoading(true);
      leadService.getPublic({ page, limit: 20 }).then((res) => {
        setPublicLeads(res.data.items || []);
        setPublicPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      }).finally(() => setPublicLoading(false));
    }
  }, [dispatch, page, activeTab]);

  useEffect(() => { setPage(1); }, [filter, search, activeTab]);

  const displayLeads = activeTab === 'all' ? leads : publicLeads;

  const filteredLeads = displayLeads
    .filter((l) => (filter ? l.status === filter : true))
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (l.name || '').toLowerCase().includes(q)
        || (l.phone || '').toLowerCase().includes(q)
        || (l.email || '').toLowerCase().includes(q)
        || (l.agentName || '').toLowerCase().includes(q);
    });

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const stats = {
    total: displayLeads.length,
    new: displayLeads.filter((l) => !l.status || l.status === 'new').length,
    contacted: displayLeads.filter((l) => l.status === 'contacted').length,
    converted: displayLeads.filter((l) => l.status === 'converted').length,
  };

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (lead) => {
        const name = lead.name || 'Unknown';
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
                {lead.name || '—'}
              </div>
            </div>
          </div>
        );
      },
      card: {
        label: 'Name',
        render: (lead) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(lead.name || 'U') }}
            >
              {(lead.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate">{lead.name || '—'}</span>
          </div>
        ),
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (lead) => (
        <span className="font-mono text-xs text-slate-600">{lead.phone || '—'}</span>
      ),
      card: {
        label: 'Phone',
        render: (lead) => (
          <span className="font-mono text-sm text-slate-700">{lead.phone || '—'}</span>
        ),
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (lead) => (
        <span className="text-xs text-slate-600 truncate">{lead.email || '—'}</span>
      ),
      card: {
        label: 'Email',
        render: (lead) => (
          <span className="text-sm text-slate-600 truncate">{lead.email || '—'}</span>
        ),
      },
    },
    {
      key: 'purpose',
      header: 'Purpose',
      sortable: true,
      render: (lead) => (
        <span className="text-xs text-slate-600">{lead.purpose || '—'}</span>
      ),
      card: {
        label: 'Purpose',
        render: (lead) => (
          <span className="text-sm text-slate-700">{lead.purpose || '—'}</span>
        ),
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (lead) => {
        const sc = statusConfig[lead.status || 'new'] ?? fallbackStatus;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            lead.status === 'new' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
            lead.status === 'contacted' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
            lead.status === 'converted' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
            'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              lead.status === 'new' ? 'bg-[#2563eb]' :
              lead.status === 'contacted' ? 'bg-[#f59e0b]' :
              lead.status === 'converted' ? 'bg-[#10B981]' :
              'bg-[#ef4444]'
            }`}/>
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (lead) => {
          const sc = statusConfig[lead.status || 'new'] ?? fallbackStatus;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              lead.status === 'new' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
              lead.status === 'contacted' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              lead.status === 'converted' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                lead.status === 'new' ? 'bg-[#2563eb]' :
                lead.status === 'contacted' ? 'bg-[#f59e0b]' :
                lead.status === 'converted' ? 'bg-[#10B981]' :
                'bg-[#ef4444]'
              }`}/>
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'agentName',
      header: 'Agent',
      sortable: true,
      render: (lead) => (
        <span className="text-xs text-slate-600">{lead.agentName || '—'}</span>
      ),
      card: {
        label: 'Agent',
        render: (lead) => (
          <span className="text-sm text-slate-700">{lead.agentName || '—'}</span>
        ),
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (lead) => {
        const date = lead.createdAt ? new Date(lead.createdAt) : null;
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
        render: (lead) => (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            {lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </span>
        ),
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
                ◈ CRM
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Leads
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">All Leads</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl w-fit bg-white/80 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Leads
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'public'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Public Leads
          </button>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Leads',   value: stats.total,     accentColor: '37,99,235',   colorHex: '#2563EB', delta: 'All leads' },
            { label: 'New',           value: stats.new,       accentColor: '37,99,235',   colorHex: '#2563eb', delta: 'New leads', trend: 'up' as const },
            { label: 'Contacted',     value: stats.contacted, accentColor: '245,158,11',  colorHex: '#f59e0b', delta: 'Contacted' },
            { label: 'Converted',     value: stats.converted, accentColor: '16,185,129',  colorHex: '#10B981', delta: 'Converted' },
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
              placeholder="Search by name, phone, or agent…"
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

        {/* ── DataTable ── */}
        <motion.div variants={fadeUp}>
          <DataTable
            columns={columns}
            data={filteredLeads}
            loading={activeTab === 'all' ? loading : publicLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(l) => l.id}
            onRowClick={(lead) => openDetail(lead)}
            cardTitle={(l) => l.name || 'Lead'}
            pageSize={filteredLeads.length || 20}
            cardBadge={(l) => {
              const sc = statusConfig[l.status || 'new'] ?? fallbackStatus;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  l.status === 'new' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
                  l.status === 'contacted' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                  l.status === 'converted' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                  'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    l.status === 'new' ? 'bg-[#2563eb]' :
                    l.status === 'contacted' ? 'bg-[#f59e0b]' :
                    l.status === 'converted' ? 'bg-[#10B981]' :
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a4 4 0 11-6 0 4 4 0 016 0z"/>
                  </svg>
                </div>
              ),
              title: activeTab === 'public' ? 'No public leads yet' : 'No leads yet',
              description: activeTab === 'public' ? 'Public leads from the AI chatbot will appear here.' : 'Leads captured from calls will appear here.',
            }}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
          />
          <Pagination pagination={activeTab === 'all' ? pagination : publicPagination} onPageChange={setPage} />
        </motion.div>
      </motion.div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}