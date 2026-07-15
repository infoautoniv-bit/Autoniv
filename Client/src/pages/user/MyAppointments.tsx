import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyAppointments, updateAppointment, notifyAppointmentWhatsApp } from '../../store/slices/appointmentsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import type { Appointment } from '../../types';
import { logger } from '../../utils/logger';

const statusConfig: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   pill: 'bg-amber-500/10 border-amber-500/20',   text: 'text-amber-400'   },
  confirmed: { label: 'Confirmed', dot: 'bg-[var(--primary)]', pill: 'bg-[var(--primary)]/10 border-[var(--border)]', text: 'text-[var(--primary)]' },
  completed: { label: 'Completed', dot: 'bg-[var(--primary)]',  pill: 'bg-[var(--primary)]/10 border-[var(--border)]',  text: 'text-[var(--primary)]'  },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-400',    pill: 'bg-rose-500/10 border-rose-500/20',    text: 'text-rose-400'    },
};

const FILTERS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatApptDate(dateStr?: string | null) {
  if (!dateStr) return 'No Date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };

export function MyAppointments() {
  const dispatch     = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const appointments = useAppSelector((s) => s.appointments.myAppointments);
  const loading      = useAppSelector((s) => s.appointments.loading);
  const pagination   = useAppSelector((s) => s.appointments.myPagination);

  const [selected, setSelected]     = useState<Appointment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving]         = useState(false);
  const [filter, setFilter]         = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [viewMode, setViewMode]     = useState<'table' | 'cards'>('table');

  useEffect(() => { dispatch(fetchMyAppointments({ page, limit: 20 })); }, [dispatch, page]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const openAppt = (appt: Appointment) => {
    if (appt.status === 'cancelled') return;
    setSelected(appt);
    setEditStatus(appt.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await dispatch(updateAppointment({
        id:   selected.id,
        data: { status: editStatus },
      })).unwrap();
      if (editStatus === 'confirmed' && user?.features?.appointments?.whatsappNotification) {
        try {
          await dispatch(notifyAppointmentWhatsApp(selected.id)).unwrap();
        } catch (notifyErr) {
          logger.error('WhatsApp notification failed:', notifyErr);
        }
      }
      setSelected(null);
    } catch (err) { logger.error(err); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => !filter || a.status === filter)
      .filter((a) =>
        !search ||
        (a.name    || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.phone   || '').includes(search) ||
        (a.email   || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.service || '').toLowerCase().includes(search.toLowerCase())
      );
  }, [appointments, filter, search]);

  const columns: Column<Appointment>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (appt) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {(appt.name || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-[var(--text)]">{appt.name || 'Unknown'}</span>
        </div>
      ),
      card: {
        label: 'Name',
        render: (appt) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
              {(appt.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-[var(--text)]">{appt.name || 'Unknown'}</span>
          </div>
        ),
      },
    },
    {
      key: 'phone',
      header: 'Contact',
      sortable: true,
      render: (appt) => appt.phone
        ? <span className="font-mono text-xs text-[var(--text)]">{appt.phone}</span>
        : <span className="text-[var(--slate-gray)] text-xs">—</span>,
      card: {
        label: 'Contact',
        render: (appt) => (
          <div className="space-y-0.5">
            {appt.phone && <p className="font-mono text-xs text-[var(--text)]">{appt.phone}</p>}
            {appt.email && <p className="text-xs text-[var(--slate-light)]">{appt.email}</p>}
            {!appt.phone && !appt.email && <span className="text-[var(--slate-gray)] text-xs">—</span>}
          </div>
        ),
      },
    },
    {
      key: 'service',
      header: 'Service',
      sortable: true,
      render: (appt) => appt.service
        ? <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--surface-hover)] text-xs text-[var(--text)] border border-white/5">{appt.service}</span>
        : <span className="text-[var(--slate-gray)] text-xs">No Service</span>,
      card: {
        label: 'Service',
        render: (appt) => <span className="text-[var(--text)] font-semibold">{appt.service || 'No Service'}</span>,
      },
    },
    {
      key: 'preferredDate',
      header: 'Scheduled',
      sortable: true,
      render: (appt) => (
        <div>
          <p className="text-sm text-[var(--text)] tabular-nums">{formatApptDate(appt.preferredDate)}</p>
          {appt.preferredTime && (
            <p className="text-xs text-[var(--slate-light)] mt-0.5 tabular-nums">{appt.preferredTime}</p>
          )}
        </div>
      ),
      card: {
        label: 'Scheduled',
        render: (appt) => (
          <div>
            <span className="text-[var(--text)] font-semibold tabular-nums">{formatApptDate(appt.preferredDate)}</span>
            {appt.preferredTime && (
              <span className="text-[var(--slate-light)] text-xs ml-1.5 tabular-nums">{appt.preferredTime}</span>
            )}
          </div>
        ),
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (appt) => {
        const sc = statusConfig[appt.status] ?? statusConfig.pending;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.pill} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (appt) => {
          const sc = statusConfig[appt.status] ?? statusConfig.pending;
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sc.pill} ${sc.text}`}>
              <span className={`w-1 h-1 rounded-full ${sc.dot}`}/>
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'source',
      header: 'Source',
      sortable: false,
      render: (appt) => {
        const isVoice = !!appt.callId;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            isVoice ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}>
            {isVoice ? 'Voice' : 'Chat'}
          </span>
        );
      },
      card: {
        label: 'Source',
        render: (appt) => {
          const isVoice = !!appt.callId;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isVoice ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              {isVoice ? 'Voice' : 'Chat'}
            </span>
          );
        },
      },
    },
    {
      key: 'agentName',
      header: 'Agent',
      sortable: true,
      className: 'whitespace-normal min-w-[100px]',
      render: (appt) => appt.agentName ? (
        <span className="inline-flex items-center gap-2 text-xs text-[var(--slate-light)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0"/>
          {appt.agentName}
        </span>
      ) : <span className="text-[var(--slate-gray)] text-xs">No Agent</span>,
      card: {
        label: 'Agent',
        render: (appt) => <span className="text-[var(--text)] font-semibold">{appt.agentName || 'No Agent'}</span>,
      },
    },
  ], []);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold tracking-[0.25em] uppercase gradient-text mb-1.5">◈ Scheduling</p>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-800 leading-none">My Appointments</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--slate-light)]">Manage bookings made through your AI agents</p>
          </div>
        </motion.div>

        {/* ── Filter pills ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 p-1 rounded-xl border bg-white/70 w-full sm:w-fit" style={{ borderColor: 'var(--slate-border)' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-2 sm:px-3.5 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap truncate ${
                filter === f.value
                  ? 'btn-cta'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
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
            onRowClick={(appt) => openAppt(appt)}
            cardTitle={(a) => a.name || 'Unknown'}
            cardBadge={(a) => {
              const sc = statusConfig[a.status] ?? statusConfig.pending;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sc.pill} ${sc.text}`}>
                  <span className={`w-1 h-1 rounded-full ${sc.dot}`}/>
                  {sc.label}
                </span>
              );
            }}
            emptyState={{
              title: 'No appointments found',
              description: 'Appointments booked through your agents will appear here.',
            }}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
            searchable={true}
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, phone, or service..."
            densityControls={false}
            columnToggling={true}
            pagination={pagination}
            onPageChange={setPage}
          />
        </motion.div>
      </motion.div>

      {/* ── Appointment Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--s1)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl shadow-black/10"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563eb] flex items-center justify-center text-white font-semibold text-sm">
                    {(selected.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text)] leading-tight">{selected.name || 'Unknown'}</h2>
                    <p className="text-[11px] text-[var(--slate-light)] mt-0.5">
                      {selected.createdAt
                        ? new Date(selected.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'No date'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-[var(--slate-light)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Phone',   value: selected.phone,         mono: true  },
                    { label: 'Email',   value: selected.email,         mono: true  },
                    { label: 'Service', value: selected.service,       mono: false },
                    { label: 'Date',    value: formatApptDate(selected.preferredDate), mono: false },
                    { label: 'Time',    value: selected.preferredTime, mono: false },
                    { label: 'Agent',   value: selected.agentName,     mono: false },
                  ].filter((f) => f.value).map((field) => (
                    <div key={field.label} className="rounded-xl bg-[var(--surface)] border border-white/5 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--slate-light)] mb-1">{field.label}</p>
                      <p className={`text-sm text-[var(--text)] truncate ${field.mono ? 'font-mono' : ''}`}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5"/>

                {/* Status */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-light)] mb-3">Status</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setEditStatus(key)}
                        className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                          editStatus === key
                            ? `${cfg.pill} ${cfg.text} border-current/30 shadow-sm`
                            : 'bg-[var(--surface)] text-[var(--slate-light)] border-white/5 hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pb-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-cta flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 text-[var(--text)] transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Saving…
                      </>
                    ) : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--slate-light)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
