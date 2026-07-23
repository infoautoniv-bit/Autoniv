import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchMyAgents, createAgent, deleteAgent, toggleAgent, updateAgent, assignPhone, unlinkPhone } from '../../store/slices/agentsSlice';
import { useNavigate } from 'react-router-dom';
import { AgentCard } from '../../components/AgentCard';
import { AgentPanel, DeleteModal } from '../../components/AgentPanel';
import { Pagination } from '../../components/Pagination';
import { AGENT_TEMPLATES, DEFAULT_FORM_DATA } from '../../config/agentConfig';
import { COUNTRY_CODES } from '../../config/constants';
import { VOICE_OPTIONS } from '../../config/voices';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ToastContainer';
import { callService } from '../../services/api';
import VapiModule from '@vapi-ai/web';
import { logger } from '../../utils/logger';
import type { Agent } from '../../types';
import { getMaxChatbots, isVoicePlan } from '../../utils/plan';
import ActiveAddOnsBanner from '../../components/ActiveAddOnsBanner';

const Vapi = (typeof VapiModule === 'function' ? VapiModule : (VapiModule as any).default) as new (key: string) => any;

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.05 } } } };



function WebCallDialog({
  open,
  onClose,
  agent,
  mode,
  seconds,
  errorMsg,
}: {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  mode: 'idle' | 'connecting' | 'active' | 'ended' | 'error';
  seconds: number;
  errorMsg: string;
}) {
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {open && agent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl pointer-events-auto p-6 text-white flex flex-col items-center text-center relative">
              {/* Top ambient glow */}
              <div className="absolute -top-24 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

              {/* Status Header */}
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-blue-400 mb-6">
                {mode === 'connecting' && 'CONNECTING TO AGENT...'}
                {mode === 'active' && 'LIVE WEB CALL'}
                {mode === 'ended' && 'CALL TERMINATED'}
                {mode === 'error' && 'CONNECTION ERROR'}
              </p>

              {/* Avatar Orb */}
              <div className="relative mb-6">
                {mode === 'active' && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-blue-500/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-indigo-500/20"
                    />
                  </>
                )}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg relative z-10 border border-slate-800">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </div>
              </div>

              {/* Agent details */}
              <h3 className="text-lg font-black tracking-tight mb-1">{agent.name}</h3>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-6">
                {agent.type === 'faq' ? 'Q&A Support Specialist' : agent.type === 'appointment' ? 'Scheduler Assistant' : 'Receptionist Bot'}
              </p>

              {/* Visualizer Waveform / Info Area */}
              <div className="w-full h-16 flex items-center justify-center mb-6 relative">
                {mode === 'active' ? (
                  <div className="flex gap-1 h-8 items-center justify-center">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="w-[3px] bg-blue-500 rounded-full"
                        animate={{ height: [6, Math.random() * 28 + 6, 6] }}
                        transition={{
                          duration: 0.5 + Math.random() * 0.5,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: idx * 0.04
                        }}
                      />
                    ))}
                  </div>
                ) : mode === 'connecting' ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening Vapi audio socket...
                  </div>
                ) : mode === 'ended' ? (
                  <span className="text-xs font-bold text-emerald-400">Call ended</span>
                ) : (
                  <span className="text-xs font-bold text-rose-500 max-w-[240px] truncate">{errorMsg || 'Failed to connect'}</span>
                )}
              </div>

              {/* Timer */}
              {mode === 'active' && (
                <p className="text-2xl font-mono font-bold tracking-wider text-slate-200 mb-8 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-2xl">
                  {formatTimer(seconds)}
                </p>
              )}

              {/* Action buttons */}
              <div className="w-full flex justify-center gap-3 pt-2">
                {mode !== 'ended' && mode !== 'error' ? (
                  <button
                    onClick={onClose}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 flex items-center justify-center shadow-lg hover:shadow-rose-600/20 transition-all cursor-pointer border-none text-white"
                    title="Hang up"
                  >
                    <svg className="w-6 h-6 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 15.46l-5.25-1.5c-.38-.11-.79-.02-1.09.28l-2.45 2.45c-3.13-1.63-5.71-4.22-7.34-7.34L7.3 6.9c.3-.3.39-.71.28-1.09L6.08 1H1.5C.67 1 0 1.67 0 2.5 0 12.72 8.28 21 18.5 21c.83 0 1.5-.67 1.5-1.5v-4.04z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 transition-colors cursor-pointer border border-slate-700"
                  >
                    Dismiss Dialog
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CallMeDialog({
  open, onClose, agent, onCall, calling,
}: {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  onCall: (phoneNumber: string) => void;
  calling: boolean;
}) {
  const [calleeName, setCalleeName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (open) {
      setCalleeName(''); setPhone(''); setError(''); setCopied(false);
      setCountryCode('+91'); setShowCountryDropdown(false); setCountrySearch('');
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[3];

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  const cleanedDigits = phone.replace(/\D/g, '');
  const isValidLength = cleanedDigits.length >= 7 && cleanedDigits.length <= 12;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, '');
    setPhone(raw);
    if (error) setError('');
  };

  const handleCall = () => {
    if (cleanedDigits.length < 7) {
      setError('Enter a valid phone number');
      return;
    }
    setError('');
    onCall(`${countryCode}${cleanedDigits}`);
  };

  const copyCurl = () => {
    const curl = `curl -X POST ${window.location.origin}/api/calls/outbound \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"agentId":"${agent?.id || '<AGENT_ID>'}","phoneNumber":"${countryCode}${cleanedDigits}"}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-none">Simulator Outbound Call</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Test your agent with a live call</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-4 bg-white">
                {/* Agent chip */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent:</span>
                  <span className="text-xs font-bold text-slate-700 truncate">{agent?.name || 'No Agent'}</span>
                </div>

                {/* Callee name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Callee Name</label>
                  <input
                    type="text"
                    value={calleeName}
                    onChange={(e) => setCalleeName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3.5 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                    style={{ outline: 'none' }}
                  />
                </div>

                {/* Phone — country + number merged into a single control */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Callee Phone Number</label>

                  <div
                    className={`flex items-stretch rounded-2xl border w-full transition-all bg-slate-50 ${
                      error
                        ? 'border-rose-300 ring-4 ring-rose-100'
                        : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white'
                    }`}
                  >
                    {/* Country selector — relative anchor for the dropdown */}
                    <div className="relative flex-shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="h-full flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 text-xs rounded-l-2xl text-slate-700 hover:bg-slate-100/70 transition-colors min-w-[88px] cursor-pointer font-semibold border-r border-slate-200"
                      >
                        <span className="text-sm">{selectedCountry.flag}</span>
                        <span className="text-[11px] text-slate-600 font-mono font-bold">{countryCode}</span>
                        <svg className={`w-3 h-3 text-slate-400 ml-auto transition-transform duration-150 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showCountryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] overflow-hidden"
                          >
                            <div className="p-2 border-b border-slate-100">
                              <input
                                autoFocus
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or code..."
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-colors font-medium"
                                style={{ outline: 'none' }}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
                              {filteredCountries.length === 0 ? (
                                <p className="px-3.5 py-3 text-xs text-slate-400 font-medium text-center">No matches</p>
                              ) : (
                                filteredCountries.map((c, i) => (
                                  <button
                                    key={`${c.code}-${c.country}-${i}`}
                                    type="button"
                                    onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); setCountrySearch(''); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                      countryCode === c.code && selectedCountry.country === c.country
                                        ? 'bg-blue-50/60 text-[var(--primary-blue)] font-bold'
                                        : 'text-slate-600 font-semibold'
                                    }`}
                                  >
                                    <span className="text-sm">{c.flag}</span>
                                    <span className="flex-1 text-left truncate">{c.name}</span>
                                    <span className="text-slate-400 font-mono text-[10px] font-bold">{c.code}</span>
                                    {countryCode === c.code && selectedCountry.country === c.country && (
                                      <svg className="w-3.5 h-3.5 text-[var(--primary-blue)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phone digits */}
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="XXXXXXXXXX"
                      autoFocus
                      className="flex-1 min-w-0 px-3.5 py-3 text-xs bg-transparent text-slate-700 focus:outline-none transition-all font-mono font-bold rounded-r-2xl"
                      style={{ outline: 'none' }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCall(); }}
                    />

                    {phone.trim() && (
                      <div className="flex items-center pr-3.5 flex-shrink-0">
                        {isValidLength ? (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-300">{cleanedDigits.length}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 px-0.5">
                    <AnimatePresence mode="wait">
                      {error ? (
                        <motion.p
                          key="error"
                          initial={{ opacity: 0, y: -2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[11px] text-rose-500 font-bold flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </motion.p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-medium">
                          Will dial as <span className="font-mono font-bold text-slate-500">{countryCode}{cleanedDigits || '…'}</span>
                        </p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-5 pb-5 pt-1.5 space-y-2 bg-slate-50/60 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCall}
                  disabled={calling || !phone.trim()}
                  className="btn-cta w-full py-3 rounded-2xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                >
                  {calling ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting Line...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Simulate Call
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={copyCurl}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      cURL Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy API cURL Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MyAgents() {
  const dispatch = useAppDispatch();
  const agents = useAppSelector((s) => s.agents.myAgents) ?? [];
  const loading = useAppSelector((s) => s.agents.loading);
  const pagination = useAppSelector((s) => s.agents.myPagination);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    prompt: string;
    language: string;
    voiceId: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
  }>(DEFAULT_FORM_DATA);
  const [callTarget, setCallTarget] = useState<Agent | null>(null);
  const [calling, setCalling] = useState(false);

  // Web Call states
  const [webCallTarget, setWebCallTarget] = useState<Agent | null>(null);
  const [webCallMode, setWebCallMode] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'error'>('idle');
  const [webCallSeconds, setWebCallSeconds] = useState(0);
  const [webCallErrorMsg, setWebCallErrorMsg] = useState('');
  const webCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webCallMaxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webCallVapiRef = useRef<any>(null);
  const [promptTarget, setPromptTarget] = useState<Agent | null>(null);
  const [promptText, setPromptText] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy] = useState('name-asc');

  useEffect(() => {
    dispatch(fetchMyAgents({ page, limit: 20 }));
  }, [dispatch, page]);

  const maxAgents = user ? getMaxChatbots(user) : 3;
  const atLimit = maxAgents !== -1 ? agents.length >= maxAgents : false;
  
  const minutesLimit = user?.minutesLimit ?? 0;
  const isUnlimited = minutesLimit === -1;
  const hasVoicePlan = isUnlimited || minutesLimit > 0 || (user ? isVoicePlan(user) : false);

  const openCreate = () => {
    if (atLimit) {
      addToast(
        `Your plan allows ${maxAgents} agent${maxAgents > 1 ? 's' : ''}. Upgrade to create more.`,
        'error',
        { label: 'Upgrade', onClick: () => navigate('/dashboard/billing') }
      );
      return;
    }
    navigate('/dashboard/ai-voice-agent/new');
  };

  const handleApplyTemplate = (tpl: typeof AGENT_TEMPLATES[0]) => {
    if (atLimit) {
      addToast(
        `Your plan allows ${maxAgents} agent${maxAgents > 1 ? 's' : ''}. Upgrade to create more.`,
        'error',
        { label: 'Upgrade', onClick: () => navigate('/dashboard/billing') }
      );
      return;
    }
    navigate('/dashboard/ai-voice-agent/new', { state: { template: tpl } });
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name || '',
      type: agent.type || 'receptionist',
      prompt: agent.prompt || '',
      language: agent.language || 'en',
      voiceId: agent.voiceId || VOICE_OPTIONS[0]?.value || '21m00Tcm4TlvDq8ikWAM',
      useCustomEngine: agent.useCustomEngine || false,
      customEngineModel: agent.customEngineModel || 'openai:gpt-4o-mini',
    });
    setPanelOpen(true);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingAgent) {
        await dispatch(updateAgent({
          id: editingAgent.id,
          data: {
            name: formData.name,
            type: formData.type || editingAgent.type,
            prompt: formData.prompt,
            language: formData.language || editingAgent.language,
            voiceId: formData.voiceId || editingAgent.voiceId,
            isActive: editingAgent.isActive,
            useCustomEngine: formData.useCustomEngine ?? editingAgent.useCustomEngine,
            customEngineModel: formData.customEngineModel ?? editingAgent.customEngineModel,
          },
        })).unwrap();
        addToast('Agent updated successfully', 'success');
      } else {
        await dispatch(createAgent(formData)).unwrap();
        addToast('Agent created successfully', 'success');
        await dispatch(fetchMyAgents({ page, limit: 20 }));
      }
      setPanelOpen(false);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Something went wrong.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await dispatch(toggleAgent({ id, isActive })).unwrap();
      addToast(`Agent ${isActive ? 'activated' : 'muted'}`, 'success');
    } catch (err) {
      logger.error(err);
      addToast('Failed to update agent status', 'error');
    }
  };

  const clearWebCallTimers = useCallback(() => {
    if (webCallTimerRef.current) { clearInterval(webCallTimerRef.current); webCallTimerRef.current = null; }
    if (webCallMaxDurationRef.current) { clearTimeout(webCallMaxDurationRef.current); webCallMaxDurationRef.current = null; }
  }, []);

  const stopWebCall = useCallback(() => {
    if (webCallVapiRef.current) {
      try {
        webCallVapiRef.current.stop();
        if (typeof webCallVapiRef.current.removeAllListeners === 'function') {
          webCallVapiRef.current.removeAllListeners();
        }
      } catch { /* ignore */ }
      webCallVapiRef.current = null;
    }
    clearWebCallTimers();
    setWebCallMode('ended');
    setTimeout(() => {
      setWebCallMode('idle');
      setWebCallTarget(null);
    }, 1500);
  }, [clearWebCallTimers]);

  useEffect(() => () => { clearWebCallTimers(); }, [clearWebCallTimers]);

  const handleWebCall = async (agent: Agent) => {
    if (!agent.vapiId) {
      navigate(`/dashboard/ai-phone-answering/${agent.id}`);
      return;
    }
    setWebCallTarget(agent);
    setWebCallMode('connecting');
    setWebCallSeconds(0);
    setWebCallErrorMsg('');

    const apiKey = import.meta.env.VITE_VAPI_API_KEY as string | undefined;
    if (!apiKey) {
      setWebCallMode('error');
      setWebCallErrorMsg('Vapi API Key is missing.');
      addToast('Vapi API Key is missing. Web Call unavailable.', 'error');
      return;
    }

    try {
      const vapi = new Vapi(apiKey);
      webCallVapiRef.current = vapi;

      const onSpeechStart = () => { setWebCallMode('active'); };
      const onCallEnd = () => stopWebCall();
      const onError = (e: any) => {
        logger.error('[MyAgents] Web Call VAPI error:', e);
        setWebCallMode('error');
        setWebCallErrorMsg(e?.message || 'Call failed.');
        addToast(e?.message || 'Web Call error.', 'error');
      };

      vapi.on('speech-start', onSpeechStart);
      vapi.on('call-end', onCallEnd);
      vapi.on('error', onError);

      if (agent.vapiId) {
        await vapi.start(agent.vapiId);
      } else {
        await vapi.start({
          name: agent.name,
          firstMessage: `Hi, this is ${agent.name}. How can I help you today?`,
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [{ role: 'system', content: agent.prompt || 'You are a helpful assistant.' }],
          },
          voice: {
            provider: '11labs',
            voiceId: agent.voiceId || '21m00Tcm4TlvDq8ikWAM',
          },
        });
      }

      setWebCallMode('active');
      webCallTimerRef.current = setInterval(() => setWebCallSeconds(prev => prev + 1), 1000);
      webCallMaxDurationRef.current = setTimeout(() => stopWebCall(), 180_000); // 3 min duration
      addToast(`Connected with ${agent.name} via Web Call`, 'success');
    } catch (err: any) {
      logger.error('[MyAgents] Web call failed:', err);
      setWebCallMode('error');
      setWebCallErrorMsg(err?.message || 'Failed to start Web call');
      addToast(err?.message || 'Failed to start Web call', 'error');
      webCallVapiRef.current = null;
    }
  };

  const handleCallMe = async (phoneNumber: string) => {
    if (!callTarget) return;
    setCalling(true);

    try {
      await callService.outbound(callTarget.id, phoneNumber);
      addToast(`Test call initiated to ${phoneNumber} successfully!`, 'success');
      setCallTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initiate call';
      addToast(msg, 'error');
    } finally {
      setCalling(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget;
    setDeleteTarget(null); // Close modal instantly from UI
    try {
      await dispatch(deleteAgent(targetId)).unwrap();
      addToast('Agent deleted successfully', 'success');
      // Quietly fetch in background to sync state with backend
      dispatch(fetchMyAgents({ page, limit: 20 }));
    } catch (err) {
      logger.error(err);
      addToast('Failed to delete agent', 'error');
      // Restore deleted agent to UI state if deletion failed on backend
      dispatch(fetchMyAgents({ page, limit: 20 }));
    }
  };

  // Local filtering logic
  const filteredAgents = useMemo(() => {
    let list = [...agents];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(term) ||
        a.prompt?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      list = list.filter(a => a.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      const activeBool = filterStatus === 'active';
      list = list.filter(a => a.isActive === activeBool);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      } else if (sortBy === 'calls-desc') {
        return (b.callCount || 0) - (a.callCount || 0);
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

    return list;
  }, [agents, searchTerm, filterType, filterStatus, sortBy]);

  return (
    <>
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6 pb-24 sm:pb-10 relative">

        {/* Glowing background auroras */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

        {/* Page Header */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 pt-1 relative z-10">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold tracking-[0.25em] uppercase gradient-text mb-1.5">◈ Voice AI Hub</p>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight leading-none" style={{ color: 'var(--text)' }}>My Agents</h1>
            <p className="mt-2 text-xs font-semibold leading-normal" style={{ color: 'var(--text-secondary)' }}>
              {agents.length > 0
                ? `Deploys and manages ${agents.length} active AI assistant${agents.length !== 1 ? 's' : ''} to handle voice communications`
                : 'Deploy custom AI voice agents to automate your call workflows'}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 self-start" style={{ color: 'var(--text-muted)' }}>
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary-blue)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-semibold">Syncing…</span>
            </div>
          )}

          {agents.length > 0 && (
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={openCreate}
                disabled={atLimit}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0 ${atLimit
                    ? 'cursor-not-allowed border-none'
                    : 'text-white btn-cta border-none shadow-md'
                  }`}
                style={atLimit
                  ? { background: 'var(--s1)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  : {}
                }
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {atLimit ? 'Capacity Reclaimed' : 'Create Vapi Agent'}
              </button>
              {!atLimit && hasVoicePlan && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/ai-voice-agent/new-custom')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 btn-secondary-outline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Custom Agent
                </button>
              )}
            </div>
          )}
        </motion.div>

        {atLimit && (
          <motion.div variants={fadeUp} className="flex items-start gap-3 px-4 py-3.5 rounded-2xl relative z-10" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--warning)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs leading-relaxed flex-1 font-semibold" style={{ color: '#92400e' }}>
              You have reached your {maxAgents}-agent limit on your current plan.{' '}
              <button type="button" onClick={() => navigate('/dashboard/billing')} className="underline underline-offset-2 transition-colors font-bold cursor-pointer" style={{ color: '#92400e' }}>Upgrade plan to unlock more slots.</button>
            </p>
          </motion.div>
        )}

        {/* ── Active Add-Ons Capabilities Banner ── */}
        <motion.div variants={fadeUp} className="relative z-10">
          <ActiveAddOnsBanner filterIds={['regional-language-agent', 'script-ab-testing', 'whatsapp-followup', 'reactivation-campaigns']} />
        </motion.div>

        {/* ── Voice minutes usage bar ── */}
        {(() => {
          const minutesUsed = user?.minutesUsed ?? 0;
          const minutesLimit = user?.minutesLimit ?? 0;
          // -1 = unlimited (enterprise). 0 = no voice plan / chat-only.
          const isUnlimited = minutesLimit === -1;
          const hasVoicePlan = isUnlimited || minutesLimit > 0 || (user ? isVoicePlan(user) : false);
          const isAtLimit = !isUnlimited && hasVoicePlan && minutesUsed >= minutesLimit;
          const pct = isUnlimited ? 100 : hasVoicePlan ? Math.min((minutesUsed / minutesLimit) * 100, 100) : 0;
          const barColor = isUnlimited ? '#10b981' : isAtLimit ? '#ef4444' : '#10b981';

          return (
            <motion.div variants={fadeUp} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 10,
              background: isAtLimit ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.04)',
              border: `1px solid ${isAtLimit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)'}`,
              position: 'relative', zIndex: 10,
            }}>
              <svg width="14" height="14" fill="none" stroke={isAtLimit ? '#ef4444' : '#10b981'} viewBox="0 0 24 24" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {minutesUsed}<span style={{ color: 'var(--text-muted)' }}>/{isUnlimited ? '∞' : minutesLimit > 0 ? minutesLimit : '—'}</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>voice min</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  width: `${isUnlimited ? 100 : pct}%`,
                  height: '100%', borderRadius: 2,
                  background: barColor,
                  transition: 'width 0.4s',
                  opacity: isUnlimited ? 0.35 : 1,
                }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: isAtLimit ? '#ef4444' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {isUnlimited ? 'Unlimited' : isAtLimit ? 'Limit reached' : hasVoicePlan ? `${Math.round(pct)}%` : 'No voice plan'}
              </span>
              {(isAtLimit || !hasVoicePlan) && (
                <button type="button" onClick={() => navigate('/dashboard/billing')} style={{ fontSize: 10, fontWeight: 600, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap' }}>Upgrade</button>
              )}
            </motion.div>
          );
        })()}

        {/* Search & Filter Bar */}
        {agents.length > 0 && (
          <motion.div variants={fadeUp} className="relative z-10">
            {/* Search — full width always */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents by name or prompt..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl outline-none transition-all"
                style={{
                  background: 'var(--s1)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                onFocus={e => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--primary-blue)';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--primary-blue-soft)';
                }}
                onBlur={e => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Filters row — wraps on mobile */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Type filter */}
              <div className="relative flex-1 min-w-[130px]">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-8 text-xs font-semibold rounded-2xl outline-none cursor-pointer transition-all"
                  style={{
                    background: 'var(--s1)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  onFocus={e => {
                    (e.target as HTMLSelectElement).style.borderColor = 'var(--primary-blue)';
                  }}
                  onBlur={e => {
                    (e.target as HTMLSelectElement).style.borderColor = 'var(--border)';
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="appointment">Scheduler</option>
                  <option value="faq">Q&A Support</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4} style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Status filter */}
              <div className="relative flex-1 min-w-[130px]">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-8 text-xs font-semibold rounded-2xl outline-none cursor-pointer transition-all"
                  style={{
                    background: 'var(--s1)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                  onFocus={e => {
                    (e.target as HTMLSelectElement).style.borderColor = 'var(--primary-blue)';
                  }}
                  onBlur={e => {
                    (e.target as HTMLSelectElement).style.borderColor = 'var(--border)';
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4} style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Clear filters */}
              {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap"
                  style={{ background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--primary-blue)' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Agents Grid or Empty State */}
      <AnimatePresence mode="wait">
  {agents.length === 0 ? (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-full" style={{ background: 'var(--gg)' }} />

      <div className="py-12 px-6 flex flex-col items-center text-center">

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.16)' }}
        >
          <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>

        <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
          Configure your first voice assistant
        </h3>
        <p className="text-[12px] max-w-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Deploy an AI receptionist or appointment planner in seconds. Pick a template to get started:
        </p>

        {/* Template cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl w-full mb-8">
          {AGENT_TEMPLATES.map((tpl, idx) => {
            const accent = idx === 0 ? '#2563EB' : idx === 1 ? '#059669' : '#7C3AED';
            const accentDim = idx === 0
              ? 'rgba(37,99,235,0.07)'
              : idx === 1
              ? 'rgba(5,150,105,0.07)'
              : 'rgba(124,58,237,0.07)';
            const accentBorder = idx === 0
              ? 'rgba(37,99,235,0.15)'
              : idx === 1
              ? 'rgba(5,150,105,0.15)'
              : 'rgba(124,58,237,0.15)';

            return (
              <button
                key={tpl.title}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="group text-left p-4 rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-start"
                style={{
                  background: 'var(--s1)',
                  border: '1px solid var(--border)',
                  borderTop: `2px solid ${accent}`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = accentDim;
                  (e.currentTarget as HTMLElement).style.borderColor = accentBorder;
                  (e.currentTarget as HTMLElement).style.borderTopColor = accent;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--s1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.borderTopColor = accent;
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-3 flex-shrink-0"
                  style={{ background: accentDim, border: `1px solid ${accentBorder}` }}
                >
                  {tpl.icon}
                </div>
                <h4 className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {tpl.title}
                </h4>
                <p className="text-[10.5px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                  {tpl.description}
                </p>
                <span
                  className="text-[10px] font-semibold inline-flex items-center gap-1 mt-auto"
                  style={{ color: accent }}
                >
                  Use template
                  <svg
                    className="w-2.5 h-2.5 transition-transform duration-150 group-hover:translate-x-0.5"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full max-w-xs mb-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>or build from scratch</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={openCreate}
            disabled={atLimit}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-150 cursor-pointer"
            style={
              atLimit
                ? { background: 'var(--s1)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'not-allowed' }
                : { background: 'var(--gg)', color: '#fff', border: 'none' }
            }
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Deploy blank Vapi assistant
          </button>
          {!atLimit && hasVoicePlan && (
            <button
              type="button"
              onClick={() => navigate('/dashboard/ai-voice-agent/new-custom')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-semibold text-slate-700 bg-white border border-slate-200 transition-all hover:bg-slate-50 cursor-pointer"
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Deploy Custom Call Agent
            </button>
          )}
        </div>

        {atLimit && (
          <p className="mt-3 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
            You've reached your agent limit. Upgrade your plan to add more.
          </p>
        )}
      </div>
    </motion.div>
  ) : (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {filteredAgents.length === 0 ? (
        /* No filter results */
        <div
          className="text-center py-10 px-6 rounded-xl"
          style={{ background: 'var(--s1)', border: '1px dashed var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[12.5px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            No agents match your filters
          </p>
          <button
            onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }}
            className="text-[11px] font-semibold transition-colors"
            style={{ color: '#2563eb' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {filteredAgents.filter(Boolean).map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
            >
      <AgentCard
        agent={agent}
        onDelete={(id) => setDeleteTarget(id)}
        onToggle={handleToggle}
        onCallMe={(a) => setCallTarget(a)}
        onWebCall={(a) => handleWebCall(a)}
        onViewPrompt={(a) => { setPromptTarget(a); setPromptText(a.prompt || ''); }}
        onEdit={handleEdit}
      />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )}
</AnimatePresence>

        {agents.length > 0 && (
          <div className="pt-2 relative z-10">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </motion.div>

      <AgentPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        editing={editingAgent}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        submitting={submitting}
        onAssignPhone={async (phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) => {
          if (!editingAgent) return;
          try {
            await dispatch(assignPhone({ id: editingAgent.id, phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken })).unwrap();
            setEditingAgent((prev: Agent | null) => prev ? { ...prev, phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken } : null);
          } catch (err) {
            logger.error(err);
          }
        }}
        onUnlinkPhone={async () => {
          if (!editingAgent) return;
          try {
            await dispatch(unlinkPhone({ id: editingAgent.id })).unwrap();
            setEditingAgent((prev: Agent | null) => prev ? { ...prev, phoneNumberId: undefined, phoneNumber: undefined, twilioAccountSid: undefined, twilioAuthToken: undefined } : null);
          } catch (err) {
            logger.error(err);
          }
        }}
      />

      <DeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <CallMeDialog
        open={callTarget !== null}
        onClose={() => setCallTarget(null)}
        agent={callTarget}
        onCall={handleCallMe}
        calling={calling}
      />

      <WebCallDialog
        open={webCallTarget !== null}
        onClose={stopWebCall}
        agent={webCallTarget}
        mode={webCallMode}
        seconds={webCallSeconds}
        errorMsg={webCallErrorMsg}
      />

      {/* Prompt Dialog */}
      <AnimatePresence>
        {promptTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setPromptTarget(null); setEditingPrompt(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        {editingPrompt ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">{promptTarget.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {editingPrompt ? 'Edit System Prompt' : 'System Prompt'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPromptTarget(null); setEditingPrompt(false); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {editingPrompt ? (
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 text-xs leading-relaxed text-slate-700 outline-none resize-none border-none bg-transparent"
                      placeholder="Enter system prompt for this agent..."
                      style={{ minHeight: 160 }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap m-0 text-slate-600">
                      {promptTarget.prompt}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  {editingPrompt ? (
                    <span className="text-[10px] font-semibold text-slate-400">{promptText.length} characters</span>
                  ) : <span />}
                  <div className="flex items-center gap-2">
                    {editingPrompt ? (
                      <>
                        <button
                          onClick={() => { setEditingPrompt(false); setPromptText(promptTarget.prompt || ''); }}
                          className="py-2 px-5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (savingPrompt || !promptTarget) return;
                            setSavingPrompt(true);
                            try {
                              await dispatch(updateAgent({
                                id: promptTarget.id,
                                data: {
                                  name: promptTarget.name,
                                  type: promptTarget.type,
                                  prompt: promptText,
                                  language: promptTarget.language,
                                  voiceId: promptTarget.voiceId,
                                  isActive: promptTarget.isActive,
                                  useCustomEngine: promptTarget.useCustomEngine,
                                  customEngineModel: promptTarget.customEngineModel,
                                },
                              })).unwrap();
                              setPromptTarget({ ...promptTarget, prompt: promptText });
                              setEditingPrompt(false);
                              addToast('Prompt updated successfully', 'success');
                            } catch {
                              addToast('Failed to update prompt', 'error');
                            } finally {
                              setSavingPrompt(false);
                            }
                          }}
                          disabled={savingPrompt}
                          className="py-2 px-5 rounded-2xl text-xs font-bold text-white transition-colors cursor-pointer border-none shadow-md disabled:opacity-50"
                          style={{ background: 'var(--gg)' }}
                        >
                          {savingPrompt ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setPromptTarget(null)}
                          className="py-2 px-5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => { setEditingPrompt(true); setPromptText(promptTarget.prompt || ''); }}
                          className="py-2 px-5 rounded-2xl text-xs font-bold text-white transition-colors cursor-pointer border-none shadow-md"
                          style={{ background: 'var(--gg)' }}
                        >
                          Edit Prompt
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} remove={removeToast} />
    </>
  );
}