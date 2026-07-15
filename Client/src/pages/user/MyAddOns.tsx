/**
 * MyAddOns — User-facing Add-On Marketplace
 * Design: Clean Light Theme (aligned with UserDashboard / AdminAddOns)
 * Accent: #2563eb with Teal gradient
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAddOnCatalog, fetchMyAddOns, requestAddOn, cancelAddOn } from '../../store/slices/addOnsSlice';
import { Modal } from '../../components/Modal';
import { getCookie } from '../../services/cookies';
import type { AddOnCatalogEntry, UserAddOn } from '../../types';
import { isChatPlan, isVoicePlan } from '../../utils/plan';
import { logger } from '../../utils/logger';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  primary:     '#2563eb',
  primaryDim:  'rgba(37,99,235,0.12)',
  primarySoft: 'rgba(37,99,235,0.06)',
  emerald:     '#059669',
  amber:       '#f59e0b',
  rose:        '#ef4444',
  violet:      '#8b5cf6',
  sky:         '#0ea5e9',
  orange:      '#f97316',
  border:      'rgba(37,99,235,0.12)',
  borderHover: 'rgba(37,99,235,0.35)',
  gradient:    'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
};

// ── Animation presets ──────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  recurring:  { color: 'var(--primary)', bg: 'var(--primary-soft)', border: 'var(--border)' },
  'one-time': { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' },
};

const STATUS_MAP: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  pending:   { color: '#D97706', bg: 'rgba(245,158,11,0.08)', dot: '#F59E0B', label: 'Pending' },
  approved:  { color: '#059669', bg: 'rgba(16,185,129,0.08)', dot: '#10B981', label: 'Active' },
  rejected:  { color: '#DC2626', bg: 'rgba(239,68,68,0.08)', dot: '#EF4444', label: 'Rejected' },
  cancelled: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', dot: '#CBD5E1', label: 'Cancelled' },
};

const FILTERS = [
  { value: 'all',      label: 'All'       },
  { value: 'approved', label: 'Active'    },
  { value: 'pending',  label: 'Pending'   },
  { value: 'rejected', label: 'Rejected'  },
] as const;

// ── Sub-components ─────────────────────────────────────────────────────────
function CatalogCard({
  addon,
  myStatus,
  onRequest,
  onOpen,
}: {
  addon: AddOnCatalogEntry;
  myStatus?: string;
  onRequest: (id: string) => void;
  onOpen: (addon: AddOnCatalogEntry) => void;
}) {
  const [hover, setHover] = useState(false);
  const isRequested = !!myStatus;
  const isPending = myStatus === 'pending';
  const isApproved = myStatus === 'approved';
  const catStyle = CATEGORY_STYLE[addon.category] || { color: 'var(--text-muted)', bg: 'var(--s1)', border: 'var(--border)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative rounded-2xl border overflow-hidden transition-all cursor-pointer group"
      style={{
        background: 'var(--surface)',
        borderColor: hover ? T.borderHover : 'var(--border)',
        boxShadow: hover
          ? '0 8px 32px rgba(37,99,235,0.12), 0 2px 8px rgba(37,99,235,0.06)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={() => onOpen(addon)}
    >
      {/* Hover glow */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative p-5">
        {/* Icon + category */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: T.primaryDim, border: '1px solid rgba(37,99,235,0.12)' }}
          >
            {addon.icon}
          </div>
          <div className="flex items-center gap-2">
            {isRequested && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: STATUS_MAP[myStatus]?.bg, color: STATUS_MAP[myStatus]?.color, border: `1px solid ${STATUS_MAP[myStatus]?.color}22` }}
              >
                <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ background: STATUS_MAP[myStatus]?.dot }} />
                {STATUS_MAP[myStatus]?.label}
              </span>
            )}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: catStyle.color, background: catStyle.bg, border: `1px solid ${catStyle.border}` }}
            >
              {addon.category}
            </span>
          </div>
        </div>

        {/* Title & desc */}
        <h3 className="text-sm font-semibold mb-1 line-clamp-1" style={{ color: 'var(--text)' }}>{addon.title}</h3>
        <p className="text-[11px] line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{addon.description}</p>

        {/* Price + action */}
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#2563eb]">{addon.price}</span>
          {!isRequested ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRequest(addon.id); }}
              className="btn-cta inline-flex items-center justify-center px-4 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
            >
              Request
            </button>
          ) : isApproved ? (
            <span className="px-3 py-1.5 text-[11px] font-semibold rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
              ✓ Active
            </span>
          ) : isPending ? (
            <span className="px-3 py-1.5 text-[11px] font-semibold rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: '#D97706', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⌛ Pending
            </span>
          ) : (
            <span className="px-3 py-1.5 text-[11px] font-semibold rounded-lg" style={{ background: 'var(--s1)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {myStatus}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MyAddOnRow({ item, onCancel, onDownload }: { item: UserAddOn; onCancel: (id: string) => void; onDownload: (addOnId: string) => void }) {
  const status = STATUS_MAP[item.status] ?? STATUS_MAP.cancelled;
  const addon = item.addOn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 transition-all hover:shadow-md"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Icon + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: T.primaryDim, border: '1px solid rgba(37,99,235,0.12)' }}
          >
            {addon?.icon || '📦'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{addon?.title || item.addOnId}</span>
              {addon?.price && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                  {addon.price}
                </span>
              )}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Requested {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: status.bg, border: `1px solid ${status.color}22` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            <span style={{ color: status.color }}>{status.label}</span>
          </span>

          {(item.status === 'approved' && item.addOnId === 'performance-report' || item.status === 'pending') && (
            <div className="flex gap-2">
              {item.status === 'approved' && item.addOnId === 'performance-report' && (
                <button
                  onClick={() => onDownload(item.addOnId)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-all"
                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.18)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              )}
              {item.status === 'pending' && (
                <button
                  onClick={() => onCancel(item.id)}
                  className="inline-flex items-center px-3 py-2 text-[11px] font-semibold rounded-lg transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function MyAddOns() {
  const dispatch   = useAppDispatch();
  const catalog    = useAppSelector((s) => s.addOns.catalog);
  const myAddOns   = useAppSelector((s) => s.addOns.my);
  const loading    = useAppSelector((s) => s.addOns.loading);
  const user       = useAppSelector((s) => s.auth.user);

  const isChat = user ? isChatPlan(user) : true;
  const isVoice = user ? isVoicePlan(user) : false;

  const [filter, setFilter] = useState<string>('all');
  const [selectedAddon, setSelectedAddon] = useState<AddOnCatalogEntry | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // ── Fetch data ─────────────────────────────────────────────────────────
  useEffect(() => { dispatch(fetchAddOnCatalog()); }, [dispatch]);
  useEffect(() => { dispatch(fetchMyAddOns()); }, [dispatch]);

  // ── Derived state ──────────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    return catalog.filter((addon) => {
      if (addon.type === 'voice') return isVoice;
      return isChat;
    });
  }, [catalog, isChat, isVoice]);

  const myStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    myAddOns.forEach((m) => {
      if (m.addOnId) map[m.addOnId] = m.status;
    });
    return map;
  }, [myAddOns]);

  const filteredMyAddOns = useMemo(() => {
    if (filter === 'all') return myAddOns;
    return myAddOns.filter((a) => a.status === filter);
  }, [myAddOns, filter]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleRequest = useCallback(async (addOnId: string) => {
    if (myStatusMap[addOnId] === 'pending' || myStatusMap[addOnId] === 'approved') return;
    setRequesting(addOnId);
    try {
      await dispatch(requestAddOn({ addOnId, notes: undefined })).unwrap();
      setSelectedAddon(null);
      setNotes('');
    } catch {
      // error handled by slice
    } finally {
      setRequesting(null);
    }
  }, [dispatch, myStatusMap]);

  const handleCancel = useCallback(async (id: string) => {
    await dispatch(cancelAddOn(id));
  }, [dispatch]);

  const handleDownloadReport = useCallback(async () => {
    try {
      const token = getCookie('accessToken');
      if (!token) {
        alert('Please log in to download the report.');
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const res = await fetch(`${baseUrl}/reports/performance-report?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to download report' }));
        alert(err.message || 'Failed to download report');
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        alert('Invalid response from server. Please try again.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Autoniv-Report-${month}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      logger.error('Download failed:', err);
      alert('Failed to download report. Please try again.');
    }
  }, []);

  const handleRequestFromModal = useCallback(async () => {
    if (!selectedAddon) return;
    if (myStatusMap[selectedAddon.id] === 'pending' || myStatusMap[selectedAddon.id] === 'approved') return;
    setRequesting(selectedAddon.id);
    try {
      await dispatch(requestAddOn({ addOnId: selectedAddon.id, notes: notes || undefined })).unwrap();
      setSelectedAddon(null);
      setNotes('');
    } catch {
      // error handled by slice
    } finally {
      setRequesting(null);
    }
  }, [dispatch, selectedAddon, notes, myStatusMap]);

  const selectedHasPending = selectedAddon ? myStatusMap[selectedAddon.id] === 'pending' : false;
  const selectedHasStatus = selectedAddon ? !!myStatusMap[selectedAddon.id] : false;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2563eb]">
                ◈ ADD-ONS
              </span>
              <span
                className="px-2 py-0.5 text-[9px] font-semibold rounded-full"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--border)' }}
              >
                {myAddOns.length} active
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-none" style={{ color: 'var(--text)' }}>Power-Ups Marketplace</h1>
            <p className="mt-2 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Stack only what you need. Available on all paid Autoniv plans.
            </p>
          </div>

          <a
            href="#catalog"
            className="btn-cta inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse Catalog
          </a>
        </motion.div>

        {/* ── Catalog ── */}
        <motion.div variants={fadeUp} id="catalog">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-1">Catalog</p>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Available add-ons</h2>
            </div>
            <p className="text-xs self-end pb-0.5" style={{ color: 'var(--text-muted)' }}>
              {Object.keys(myStatusMap).filter(id => filteredCatalog.some(c => c.id === id)).length} of {filteredCatalog.length} requested
            </p>
          </div>

          {filteredCatalog.length === 0 ? (
            <div
              className="rounded-2xl py-12 sm:py-20 flex flex-col items-center justify-center text-center px-4 sm:px-8"
              style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 text-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >📦</div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No add-ons available yet</p>
              <p className="text-xs max-w-xs mb-5 sm:mb-6" style={{ color: 'var(--text-muted)' }}>Check back soon for new offerings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCatalog.map((addon) => (
                <CatalogCard
                  key={addon.id}
                  addon={addon}
                  myStatus={myStatusMap[addon.id]}
                  onRequest={handleRequest}
                  onOpen={setSelectedAddon}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── My Add-Ons ── */}
        <motion.div variants={fadeUp}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#2563eb] mb-1">My Add-Ons</p>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} subscriptions
                {filteredMyAddOns.length > 0 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({filteredMyAddOns.length})</span>
                )}
              </h2>
            </div>

            <div
              className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto min-w-0"
              style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
            >
              {FILTERS.map((f) => {
                const isActive = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="relative px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
                    style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="myAddOnFilterBg"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading && filteredMyAddOns.length === 0 ? (
            <div
              className="flex items-center justify-center h-48 rounded-2xl"
              style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading your add-ons…</span>
              </div>
            </div>
          ) : filteredMyAddOns.length === 0 ? (
            <div
              className="rounded-2xl py-12 sm:py-20 flex flex-col items-center justify-center text-center px-4 sm:px-8"
              style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 text-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >🧩</div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                {filter === 'all' ? 'No add-ons yet' : `No ${filter} add-ons`}
              </p>
              <p className="text-xs max-w-xs mb-5 sm:mb-6" style={{ color: 'var(--text-muted)' }}>
                {filter === 'all'
                  ? 'Browse the catalog above to request your first add-on.'
                  : 'Try a different filter or browse the catalog.'}
              </p>
              {filter === 'all' && filteredCatalog.length > 0 && (
                <a
                  href="#catalog"
                  className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Request first add-on
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMyAddOns.map((item) => (
                  <MyAddOnRow key={item.id} item={item} onCancel={handleCancel} onDownload={handleDownloadReport} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Detail / Request modal ── */}
      <Modal
        isOpen={!!selectedAddon}
        onClose={() => { setSelectedAddon(null); setNotes(''); }}
        title={selectedAddon?.title || 'Add-On Details'}
        size="md"
      >
        {selectedAddon && (
          <div className="space-y-4">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                {selectedAddon.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">{selectedAddon.title}</p>
                <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{selectedAddon.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-base font-bold" style={{ color: '#60a5fa' }}>{selectedAddon.price}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(37,99,235,0.12)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {selectedAddon.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Status check — show warning if pending/approved */}
            {selectedHasPending && (
              <div className="p-3 rounded-xl flex items-center gap-2.5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#F59E0B' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-semibold" style={{ color: '#D97706' }}>
                  You already have a pending request for this add-on. Wait for approval or cancel the existing request before submitting a new one.
                </p>
              </div>
            )}
            {selectedHasStatus && !selectedHasPending && (
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-white/60">
                  You already have a{' '}
                  <span className="font-semibold" style={{ color: STATUS_MAP[myStatusMap[selectedAddon.id]]?.color || '#94a3b8' }}>
                    {STATUS_MAP[myStatusMap[selectedAddon.id]]?.label || myStatusMap[selectedAddon.id]}
                  </span>{' '}
                  request for this add-on.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special requirements or questions…"
                className="w-full px-3 py-2.5 rounded-xl text-sm transition-all resize-none outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                }}
                onFocus={e => {
                  (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(37,99,235,0.4)';
                  (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                }}
                onBlur={e => {
                  (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => { setSelectedAddon(null); setNotes(''); }}
            className="px-4 py-2 text-sm rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}
          >
            Close
          </button>
          {selectedAddon && !selectedHasStatus && (
            <button
              onClick={handleRequestFromModal}
              disabled={!!requesting}
              className="btn-cta inline-flex items-center justify-center gap-2 px-5 py-2 text-sm text-white rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {requesting ? 'Requesting…' : 'Request Add-On'}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default MyAddOns;