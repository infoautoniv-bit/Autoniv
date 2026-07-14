import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAllAppointments } from '../../store/slices/appointmentsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import type { Appointment } from '../../types';

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
  confirmed: { label: 'Confirmed', pillBg: 'rgba(37,99,235,0.08)', pillBorder: 'rgba(37,99,235,0.20)', text: '#2563eb', dot: '#2563eb' },
  completed: { label: 'Completed', pillBg: 'rgba(16,185,129,0.08)', pillBorder: 'rgba(16,185,129,0.20)', text: '#10B981', dot: '#10B981' },
  cancelled: { label: 'Cancelled', pillBg: 'rgba(239,68,68,0.08)', pillBorder: 'rgba(239,68,68,0.20)', text: '#ef4444', dot: '#ef4444' },
};

const fallbackStatus = {
  label: 'Unknown',
  pillBg: 'rgba(100,100,100,0.08)',
  pillBorder: 'rgba(100,100,100,0.20)',
  text: '#666666',
  dot: '#666666',
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── Appointment Detail Modal ─────────────────────────────────────────
function AppointmentDetailModal({ 
  appointment, 
  open, 
  onClose 
}: { 
  appointment: Appointment | null; 
  open: boolean; 
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && appointment && (
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
                  style={{ background: getAvatarColor(appointment.name || 'U') }}
                >
                  {(appointment.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#2563eb]">Appointment Details</p>
                  <h2 className="text-sm font-extrabold text-slate-800 leading-tight truncate">{appointment.name || 'Unknown'}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'No date'}
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
                  { label: 'Phone', value: appointment.phone || '—', mono: true },
                  { label: 'Email', value: appointment.email || '—', mono: true },
                  { label: 'Service', value: appointment.service || '—' },
                  { label: 'Date', value: appointment.preferredDate || '—' },
                  { label: 'Time', value: appointment.preferredTime || '—' },
                  { label: 'Agent', value: appointment.agentName || '—' },
                  { label: 'Status', value: (statusConfig[appointment.status] ?? fallbackStatus).label },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50/60 border border-slate-100 px-3.5 py-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-semibold text-slate-700 block truncate ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Notes if available */}
              {(appointment as any).notes && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Notes</p>
                  <div className="rounded-xl bg-slate-50/70 border border-slate-100 px-4 py-3">
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{(appointment as any).notes}</p>
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

export function AdminAppointments() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((state) => state.appointments.items);
  const loading = useAppSelector((state) => state.appointments.loading);
  const pagination = useAppSelector((state) => state.appointments.pagination);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    dispatch(fetchAllAppointments({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = appointments
    .filter((a) => (filter ? a.status === filter : true))
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (a.name || '').toLowerCase().includes(q)
        || (a.phone || '').toLowerCase().includes(q)
        || (a.email || '').toLowerCase().includes(q)
        || (a.service || '').toLowerCase().includes(q)
        || (a.agentName || '').toLowerCase().includes(q);
    });

  const openDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailOpen(true);
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  const columns: Column<Appointment>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (appointment) => {
        const name = appointment.name || 'Unknown';
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
                {appointment.name || '—'}
              </div>
            </div>
          </div>
        );
      },
      card: {
        label: 'Name',
        render: (appointment) => (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm"
              style={{ background: getAvatarColor(appointment.name || 'U') }}
            >
              {(appointment.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate">{appointment.name || '—'}</span>
          </div>
        ),
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (appointment) => (
        <span className="font-mono text-xs text-slate-600">{appointment.phone || '—'}</span>
      ),
      card: {
        label: 'Phone',
        render: (appointment) => (
          <span className="font-mono text-sm text-slate-700">{appointment.phone || '—'}</span>
        ),
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (appointment) => (
        <span className="text-xs text-slate-600 truncate">{appointment.email || '—'}</span>
      ),
      card: {
        label: 'Email',
        render: (appointment) => (
          <span className="text-sm text-slate-600 truncate">{appointment.email || '—'}</span>
        ),
      },
    },
    {
      key: 'service',
      header: 'Service',
      sortable: true,
      render: (appointment) => (
        <span className="text-xs text-slate-600">{appointment.service || '—'}</span>
      ),
      card: {
        label: 'Service',
        render: (appointment) => (
          <span className="text-sm text-slate-700">{appointment.service || '—'}</span>
        ),
      },
    },
    {
      key: 'preferredDate',
      header: 'Date',
      sortable: true,
      render: (appointment) => (
        <span className="text-xs font-bold text-slate-700 tabular-nums">{appointment.preferredDate || '—'}</span>
      ),
      card: {
        label: 'Date',
        render: (appointment) => (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">{appointment.preferredDate || '—'}</span>
        ),
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (appointment) => {
        const sc = statusConfig[appointment.status] ?? fallbackStatus;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            appointment.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
            appointment.status === 'confirmed' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
            appointment.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
            'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              appointment.status === 'pending' ? 'bg-[#f59e0b]' :
              appointment.status === 'confirmed' ? 'bg-[#2563eb]' :
              appointment.status === 'completed' ? 'bg-[#10B981]' :
              'bg-[#ef4444]'
            }`}/>
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (appointment) => {
          const sc = statusConfig[appointment.status] ?? fallbackStatus;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              appointment.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
              appointment.status === 'confirmed' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
              appointment.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
              'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                appointment.status === 'pending' ? 'bg-[#f59e0b]' :
                appointment.status === 'confirmed' ? 'bg-[#2563eb]' :
                appointment.status === 'completed' ? 'bg-[#10B981]' :
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
      render: (appointment) => (
        <span className="text-xs text-slate-600">{appointment.agentName || '—'}</span>
      ),
      card: {
        label: 'Agent',
        render: (appointment) => (
          <span className="text-sm text-slate-700">{appointment.agentName || '—'}</span>
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
                ◈ SCHEDULING
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Appointments
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">All Appointments</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
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

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',        value: stats.total,     accentColor: '37,99,235',   colorHex: '#2563EB', delta: 'All appointments' },
            { label: 'Pending',      value: stats.pending,   accentColor: '245,158,11',  colorHex: '#f59e0b', delta: 'Awaiting confirmation', trend: 'up' as const },
            { label: 'Confirmed',    value: stats.confirmed, accentColor: '37,99,235',   colorHex: '#2563eb', delta: 'Scheduled' },
            { label: 'Completed',    value: stats.completed, accentColor: '16,185,129',  colorHex: '#10B981', delta: 'Done' },
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
        <motion.div variants={fadeUp} className="relative z-10">
          <div className="relative max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, phone, or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
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
            data={filtered}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(a) => a.id}
            onRowClick={(appointment) => openDetail(appointment)}
            cardTitle={(a) => a.name || 'Appointment'}
            pageSize={filtered.length || 20}
            cardBadge={(a) => {
              const sc = statusConfig[a.status] ?? fallbackStatus;
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  a.status === 'pending' ? 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.20)] text-[#f59e0b]' :
                  a.status === 'confirmed' ? 'bg-[rgba(37,99,235,0.08)] border-[rgba(37,99,235,0.20)] text-[#2563eb]' :
                  a.status === 'completed' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.20)] text-[#10B981]' :
                  'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.20)] text-[#ef4444]'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    a.status === 'pending' ? 'bg-[#f59e0b]' :
                    a.status === 'confirmed' ? 'bg-[#2563eb]' :
                    a.status === 'completed' ? 'bg-[#10B981]' :
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              ),
              title: 'No appointments found',
              description: search || filter ? 'Try adjusting your search or filter.' : 'Appointments booked through agents will appear here.',
            }}
            defaultSort={{ key: 'preferredDate', direction: 'asc' }}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </motion.div>
      </motion.div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}