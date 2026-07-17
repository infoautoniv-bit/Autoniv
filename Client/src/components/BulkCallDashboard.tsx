import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import {
  fetchMyBulkCampaigns,
  createBulkCampaign,
  startBulkCampaign,
  pauseBulkCampaign,
  cancelBulkCampaign,
  deleteBulkCampaign,
  clearActiveCampaign,
} from '../store/slices/bulkCallsSlice';
import { fetchMyAgents } from '../store/slices/agentsSlice';
import type { Agent, BulkCampaign } from '../types';
import { Pagination } from './Pagination';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };

const statusConfig: Record<string, { label: string; dot: string; pill: string; text: string }> = {
  draft:     { label: 'Draft',     dot: 'bg-slate-400',   pill: 'bg-slate-50 border-slate-200',   text: 'text-slate-600' },
  running:   { label: 'Running',   dot: 'bg-blue-500',    pill: 'bg-blue-50 border-blue-200',     text: 'text-blue-600' },
  paused:    { label: 'Paused',    dot: 'bg-amber-500',   pill: 'bg-amber-50 border-amber-200',   text: 'text-amber-600' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', pill: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600' },
  cancelled: { label: 'Cancelled', dot: 'bg-rose-500',    pill: 'bg-rose-50 border-rose-200',     text: 'text-rose-600' },
};

const numberStatusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'text-slate-500' },
  calling:   { label: 'Calling',   color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-emerald-600' },
  failed:    { label: 'Failed',    color: 'text-rose-600' },
  'no-answer': { label: 'No Answer', color: 'text-amber-600' },
  busy:      { label: 'Busy',      color: 'text-orange-600' },
  skipped:   { label: 'Skipped',   color: 'text-slate-400' },
};

function parseCSV(text: string): { phone: string; name?: string }[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];

  const results: { phone: string; name?: string }[] = [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('phone') || header.includes('number') || header.includes('mobile');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 1 && parts[0]) {
      results.push({ phone: parts[0], name: parts[1] || undefined });
    }
  }
  return results;
}

export function BulkCallDashboard() {
  const dispatch = useAppDispatch();
  const { myCampaigns, myPagination, loading } = useAppSelector(s => s.bulkCalls);
  const myAgents = useAppSelector(s => s.agents.myAgents);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BulkCampaign | null>(null);

  useEffect(() => {
    dispatch(fetchMyBulkCampaigns({ page, limit: 10 }));
    dispatch(fetchMyAgents({ page: 1, limit: 50 }));
  }, [dispatch, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[9px] font-black tracking-[0.22em] uppercase text-indigo-600">BULK CALL CAMPAIGNS</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Bulk Calling</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Create and manage bulk outbound call campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-sm cursor-pointer border-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Campaign
        </button>
      </motion.div>

      {/* Campaign List */}
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-3">
        {myCampaigns.length === 0 && !loading ? (
          <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-slate-700">No campaigns yet</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1.5">Create your first bulk call campaign to get started</p>
          </motion.div>
        ) : (
          myCampaigns.map((campaign) => {
            const cfg = statusConfig[campaign.status] || statusConfig.draft;
            const progress = campaign.totalCount > 0 ? ((campaign.completedCount + campaign.failedCount) / campaign.totalCount) * 100 : 0;
            return (
              <motion.div
                key={campaign.id}
                variants={fadeUp}
                className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h3 className="text-sm font-extrabold text-slate-800 truncate">{campaign.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${cfg.pill} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Agent: {campaign.agentName || 'Unknown'} · {campaign.totalCount} numbers · {campaign.completedCount} completed · {campaign.failedCount} failed
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(startBulkCampaign(campaign.id)); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer border-none"
                      >
                        Start
                      </button>
                    )}
                    {campaign.status === 'running' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(pauseBulkCampaign(campaign.id)); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-all cursor-pointer border-none"
                      >
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(startBulkCampaign(campaign.id)); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer border-none"
                      >
                        Resume
                      </button>
                    )}
                    {(campaign.status === 'draft' || campaign.status === 'paused' || campaign.status === 'completed' || campaign.status === 'cancelled') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch(cancelBulkCampaign(campaign.id)); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border-none"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {myPagination.totalPages > 1 && (
        <Pagination
          pagination={myPagination}
          onPageChange={setPage}
        />
      )}

      {/* Create Campaign Dialog */}
      <AnimatePresence>
        {showCreate && (
          <BulkCallCreator
            agents={myAgents}
            onClose={() => setShowCreate(false)}
            onCreate={async (data) => {
              await dispatch(createBulkCampaign(data)).unwrap();
              setShowCreate(false);
              dispatch(fetchMyBulkCampaigns({ page: 1, limit: 10 }));
            }}
          />
        )}
      </AnimatePresence>

      {/* Campaign Detail Dialog */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDetailDialog
            campaign={selectedCampaign}
            onClose={() => { setSelectedCampaign(null); dispatch(clearActiveCampaign()); }}
            onStart={() => dispatch(startBulkCampaign(selectedCampaign.id))}
            onPause={() => dispatch(pauseBulkCampaign(selectedCampaign.id))}
            onCancel={() => dispatch(cancelBulkCampaign(selectedCampaign.id))}
            onDelete={async () => { await dispatch(deleteBulkCampaign(selectedCampaign.id)); setSelectedCampaign(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Campaign Dialog ──────────────────────────────────────────────
function BulkCallCreator({
  agents,
  onClose,
  onCreate,
}: {
  agents: Agent[];
  onClose: () => void;
  onCreate: (data: { agentId: string; name: string; numbers: { phone: string; name?: string }[]; concurrency?: number; delayMs?: number; twilioPhoneNumber?: string; twilioAccountSid?: string; twilioAuthToken?: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [numbers, setNumbers] = useState<{ phone: string; name?: string }[]>([]);
  const [csvInput, setCsvInput] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [concurrency, setConcurrency] = useState(1);
  const [delayMs, setDelayMs] = useState(2000);
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVPaste = () => {
    const parsed = parseCSV(csvInput);
    if (parsed.length === 0) { setError('No valid numbers found'); return; }
    setNumbers(prev => [...prev, ...parsed]);
    setCsvInput('');
    setError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setNumbers(prev => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addManual = () => {
    if (!manualPhone.trim()) return;
    const cleaned = manualPhone.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,15}$/.test(cleaned)) { setError('Invalid phone number'); return; }
    setNumbers(prev => [...prev, { phone: cleaned, name: manualName.trim() || undefined }]);
    setManualPhone('');
    setManualName('');
    setError('');
  };

  const removeNumber = (idx: number) => {
    setNumbers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !agentId || numbers.length === 0) {
      setError('Name, agent, and at least one number are required');
      return;
    }
    const selectedAgent = agents.find(a => a.id === agentId);
    const agentHasTwilio = !!(selectedAgent?.twilioAccountSid && selectedAgent?.twilioAuthToken && selectedAgent?.phoneNumber);
    if (!agentHasTwilio && (!twilioAccountSid.trim() || !twilioAuthToken.trim() || !twilioPhoneNumber.trim())) {
      setError('Twilio Phone Number, Account SID, and Auth Token are required (agent has no Twilio configured)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        agentId,
        name: name.trim(),
        numbers,
        concurrency,
        delayMs,
      };
      if (!agentHasTwilio) {
        payload.twilioPhoneNumber = twilioPhoneNumber.trim();
        payload.twilioAccountSid = twilioAccountSid.trim();
        payload.twilioAuthToken = twilioAuthToken.trim();
      }
      await onCreate(payload);
    } catch (err: any) {
      setError(err?.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Create Bulk Call Campaign</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Add phone numbers and configure your campaign</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Follow-up Campaign #1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Select Agent</label>
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Choose agent...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Concurrency</label>
              <select
                value={concurrency}
                onChange={e => setConcurrency(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} parallel call{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Delay Between Calls</label>
              <select
                value={delayMs}
                onChange={e => setDelayMs(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value={0}>No delay</option>
                <option value={1000}>1 second</option>
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>
          </div>

          {/* Twilio Credentials — only if agent doesn't have them */}
          {(() => {
            const sel = agents.find(a => a.id === agentId);
            const hasTwilio = !!(sel?.twilioAccountSid && sel?.twilioAuthToken && sel?.phoneNumber);
            if (hasTwilio) {
              return (
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                  <p className="text-[10px] font-bold text-emerald-600">
                    Using Twilio credentials from agent: <span className="font-black">{sel?.name}</span> ({sel?.phoneNumber})
                  </p>
                </div>
              );
            }
            if (!agentId) return null;
            return (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-3">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Twilio Credentials (required — agent has none)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                    <input
                      type="text"
                      value={twilioPhoneNumber}
                      onChange={e => setTwilioPhoneNumber(e.target.value)}
                      placeholder="+14155551234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Account SID</label>
                    <input
                      type="text"
                      value={twilioAccountSid}
                      onChange={e => setTwilioAccountSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Auth Token</label>
                  <input
                    type="password"
                    value={twilioAuthToken}
                    onChange={e => setTwilioAuthToken(e.target.value)}
                    placeholder="Your Twilio auth token"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            );
          })()}

          {/* Add Numbers */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Add Phone Numbers</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={manualPhone}
                onChange={e => setManualPhone(e.target.value)}
                placeholder="+14155551234"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                onKeyDown={e => e.key === 'Enter' && addManual()}
              />
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Name (optional)"
                className="w-36 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                onKeyDown={e => e.key === 'Enter' && addManual()}
              />
              <button
                onClick={addManual}
                className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer border-none"
              >
                Add
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border-none"
              >
                Upload CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              <textarea
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                placeholder="Or paste CSV: phone,name&#10;+14155551234,John&#10;+14155555678,Jane"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[11px] font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-16"
              />
              <button
                onClick={handleCSVPaste}
                className="px-4 py-2 rounded-xl text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer border-none self-end"
              >
                Parse
              </button>
            </div>
          </div>

          {/* Number List */}
          {numbers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Numbers ({numbers.length})
                </label>
                <button
                  onClick={() => setNumbers([])}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer bg-transparent border-none"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {numbers.map((n, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white">
                    <div>
                      <span className="text-xs font-bold text-slate-700">{n.phone}</span>
                      {n.name && <span className="text-[10px] text-slate-400 font-semibold ml-2">({n.name})</span>}
                    </div>
                    <button
                      onClick={() => removeNumber(i)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer bg-transparent border-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !agentId || numbers.length === 0}
            className="flex-1 py-3 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {submitting ? 'Creating...' : `Create Campaign (${numbers.length} numbers)`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Campaign Detail Dialog ──────────────────────────────────────────────
function CampaignDetailDialog({
  campaign,
  onClose,
  onStart,
  onPause,
  onCancel,
  onDelete,
}: {
  campaign: BulkCampaign;
  onClose: () => void;
  onStart: () => void;
  onPause: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const cfg = statusConfig[campaign.status] || statusConfig.draft;
  const progress = campaign.totalCount > 0 ? ((campaign.completedCount + campaign.failedCount) / campaign.totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-800">{campaign.name}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${cfg.pill} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Agent: {campaign.agentName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: campaign.totalCount, bg: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Completed', value: campaign.completedCount, bg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
            { label: 'Failed', value: campaign.failedCount, bg: 'bg-rose-50 border-rose-100 text-rose-600' },
            { label: 'Pending', value: campaign.totalCount - campaign.completedCount - campaign.failedCount, bg: 'bg-blue-50 border-blue-100 text-blue-600' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="px-6 pb-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1.5 text-right">{progress.toFixed(0)}% complete</p>
        </div>

        {/* Numbers List */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {campaign.numbers.map((entry, i) => {
              const nCfg = numberStatusConfig[entry.status] || numberStatusConfig.pending;
              return (
                <div key={entry._id || i} className="flex items-center justify-between px-3 py-2 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 w-32">{entry.phone}</span>
                    {entry.name && <span className="text-[10px] text-slate-400 font-semibold">{entry.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.error && <span className="text-[9px] text-rose-400 font-semibold max-w-[120px] truncate">{entry.error}</span>}
                    <span className={`text-[10px] font-bold ${nCfg.color}`}>{nCfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
          {campaign.status === 'draft' && (
            <button onClick={onStart} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer border-none">
              Start Campaign
            </button>
          )}
          {campaign.status === 'running' && (
            <button onClick={onPause} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-all cursor-pointer border-none">
              Pause
            </button>
          )}
          {campaign.status === 'paused' && (
            <button onClick={onStart} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer border-none">
              Resume
            </button>
          )}
          {campaign.status !== 'cancelled' && campaign.status !== 'completed' && (
            <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border-none">
              Cancel
            </button>
          )}
          {campaign.status !== 'running' && (
            <button onClick={onDelete} className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border-none ml-auto">
              Delete
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
