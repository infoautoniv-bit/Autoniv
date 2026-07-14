import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyLeads, exportLeads, updateLead } from '../../store/slices/leadsSlice';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import type { Lead } from '../../types';

const statusConfig: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  new: { label: 'New', dot: 'bg-[var(--primary)]', pill: 'bg-[var(--primary)]/10 border-[var(--border)]', text: 'text-[var(--primary)]' },
  contacted: { label: 'Contacted', dot: 'bg-amber-400', pill: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
  converted: { label: 'Converted', dot: 'bg-[var(--primary)]', pill: 'bg-[var(--primary)]/10 border-[var(--border)]', text: 'text-[var(--primary)]' },
  lost: { label: 'Lost', dot: 'bg-rose-400', pill: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };
const EMPTY_LEADS: Lead[] = [];

export function MyLeads() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const leads = useAppSelector((s) => s.leads.myLeads) ?? EMPTY_LEADS;
  const loading = useAppSelector((s) => s.leads.loading);
  const pagination = useAppSelector((s) => s.leads.myPagination);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => { dispatch(fetchMyLeads({ page, limit: 20 })); }, [dispatch, page]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const blob = await dispatch(exportLeads()).unwrap();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) { console.error(err); }
  };

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.status || 'new');
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      await dispatch(updateLead({
        id: selectedLead.id,
        data: { notes: editNotes, status: editStatus as Lead['status'] },
      })).unwrap();
      setSelectedLead((p) => p ? { ...p, notes: editNotes, status: editStatus as Lead['status'] } : null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => !filter || l.status === filter)
      .filter((l) =>
        !search ||
        (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.phone || '').includes(search)
      );
  }, [leads, filter, search]);

  const columns: Column<Lead>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (lead) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {(lead.name || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-[var(--text)]">{lead.name || 'Unknown'}</span>
        </div>
      ),
      card: {
        label: 'Name',
        render: (lead) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
              {(lead.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-[var(--text)]">{lead.name || 'Unknown'}</span>
          </div>
        ),
      },
    },
    {
      key: 'email',
      header: 'Contact',
      sortable: true,
      render: (lead) => (
        <div className="space-y-0.5">
          {lead.phone && <p className="font-mono text-xs text-[var(--text)]">{lead.phone}</p>}
          {lead.email && <p className="text-xs text-[var(--slate-light)] truncate max-w-[160px]">{lead.email}</p>}
          {!lead.phone && !lead.email && <span className="text-[var(--slate-gray)] text-xs">—</span>}
        </div>
      ),
      card: {
        label: 'Contact',
        render: (lead) => (
          <div className="space-y-0.5">
            {lead.phone && <p className="font-mono text-xs text-[var(--text)]">{lead.phone}</p>}
            {lead.email && <p className="text-xs text-[var(--slate-light)]">{lead.email}</p>}
            {!lead.phone && !lead.email && <span className="text-[var(--slate-gray)] text-xs">—</span>}
          </div>
        ),
      },
    },
    {
      key: 'purpose',
      header: 'Purpose',
      sortable: true,
      render: (lead) => lead.purpose
        ? <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--surface-hover)] text-xs text-[var(--text)] border border-white/5">{lead.purpose}</span>
        : <span className="text-[var(--slate-gray)] text-xs">No Purpose</span>,
      card: {
        label: 'Purpose',
        render: (lead) => <span className="text-[var(--text)] font-semibold">{lead.purpose || 'No Purpose'}</span>,
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (lead) => {
        const sc = statusConfig[lead.status || 'new'] ?? statusConfig.new;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.pill} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
        );
      },
      card: {
        label: 'Status',
        render: (lead) => {
          const sc = statusConfig[lead.status || 'new'] ?? statusConfig.new;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.pill} ${sc.text}`}>
              <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          );
        },
      },
    },
    {
      key: 'leadType',
      header: 'Source',
      sortable: true,
      render: (lead) => {
        const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
          chat: { label: 'Chat', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          call: { label: 'Voice', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          public: { label: 'Widget', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
        };
        const s = sourceConfig[lead.leadType || 'call'] ?? sourceConfig.call;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.color}`}>
            {s.label}
          </span>
        );
      },
      card: {
        label: 'Source',
        render: (lead) => {
          const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
            chat: { label: 'Chat', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
            call: { label: 'Voice', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            public: { label: 'Widget', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          };
          const s = sourceConfig[lead.leadType || 'call'] ?? sourceConfig.call;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.bg} ${s.color}`}>
              {s.label}
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
      render: (lead) => <span className="text-xs text-[var(--slate-light)]">{lead.agentName || 'No Agent'}</span>,
      card: {
        label: 'Agent',
        render: (lead) => <span className="text-[var(--text)] font-semibold">{lead.agentName || 'No Agent'}</span>,
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (lead) => (
        <span className="text-xs text-[var(--slate-light)] tabular-nums">
          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Data'}
        </span>
      ),
      card: {
        label: 'Date',
        render: (lead) => (
          <span className="text-[var(--text)] font-semibold tabular-nums">
            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Data'}
          </span>
        ),
      },
    },
  ], []);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold tracking-[0.25em] uppercase gradient-text mb-1.5">◈ CRM</p>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-800 leading-none">My Leads</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--slate-light)]">Manage contacts captured from your AI calls</p>
          </div>
          <button
            onClick={handleExport}
            disabled={!user?.features?.leads?.exportCsv}
            className="btn-cta self-start group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              color: user?.features?.leads?.exportCsv ? 'var(--text)' : 'var(--text-muted)',
              border: `1px solid ${user?.features?.leads?.exportCsv ? 'var(--border)' : 'transparent'}`,
              background: user?.features?.leads?.exportCsv ? 'var(--surface)' : 'var(--s1)',
            }}
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </motion.div>

        {/* ── Filter pills ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 p-1 rounded-xl border bg-white/70 w-full sm:w-fit" style={{ borderColor: 'var(--slate-border)' }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
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
            data={filteredLeads}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            keyExtractor={(l) => l.id}
            onRowClick={(lead) => openLead(lead)}
            cardTitle={(l) => l.name || 'Unknown Lead'}
            cardBadge={(l) => {
              const sc = statusConfig[l.status || 'new'] ?? statusConfig.new;
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sc.pill} ${sc.text}`}>
                  <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              );
            }}
            emptyState={{
              title: 'No leads found',
              description: 'Leads captured from your calls will appear here.',
            }}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
            searchable={true}
            searchTerm={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search leads by name, email, or phone..."
            exportable={true}
            densityControls={false}
            columnToggling={true}
            pagination={pagination}
            onPageChange={setPage}
          />
        </motion.div>
      </motion.div>

      {/* ── Lead Detail Modal ── */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedLead(null)}
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
                    {(selectedLead.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text)] leading-tight">{selectedLead.name || 'Unknown lead'}</h2>
                    <p className="text-[11px] text-[var(--slate-light)] mt-0.5">
                      {selectedLead.createdAt
                        ? new Date(selectedLead.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'No date'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg text-[var(--slate-light)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Phone', value: selectedLead.phone },
                    { label: 'Email', value: selectedLead.email },
                    { label: 'Purpose', value: selectedLead.purpose },
                    { label: 'Agent', value: selectedLead.agentName },
                  ].filter((f) => f.value).map((field) => (
                    <div key={field.label} className="rounded-xl bg-[var(--surface)] border border-white/5 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--slate-light)] mb-1">{field.label}</p>
                      <p className={`text-sm text-[var(--text)] truncate ${field.label === 'Phone' ? 'font-mono' : ''}`}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5" />

                {/* Status */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-light)] mb-3">Status</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setEditStatus(key)}
                        className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${editStatus === key
                            ? `${cfg.pill} ${cfg.text} border-current/30 shadow-sm`
                            : 'bg-[var(--surface)] text-[var(--slate-light)] border-white/5 hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                          }`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--slate-light)] mb-3">Notes</p>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this lead…"
                    rows={4}
                    className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder-white/30 focus:outline-none focus:border-[var(--border)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all resize-none"
                  />
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
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving…
                      </>
                    ) : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
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
