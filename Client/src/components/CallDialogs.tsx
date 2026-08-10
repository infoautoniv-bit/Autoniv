import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRY_CODES } from '../config/constants';

export interface WebCallDialogProps {
  open: boolean;
  onClose: () => void;
  agent: any;
  mode: 'idle' | 'connecting' | 'active' | 'ended' | 'error';
  seconds: number;
  errorMsg: string;
}

export interface CallMeDialogProps {
  open: boolean;
  onClose: () => void;
  agent: { id?: string; name?: string } | null;
  onCall: (phoneNumber: string) => void;
  calling: boolean;
}

export function CallMeDialog({ open, onClose, agent, onCall, calling }: CallMeDialogProps) {
  const [calleeName, setCalleeName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [countrySearch, setCountrySearch] = useState('');

  // Form fields reset automatically via key={open} on the form container below.

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

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[3];

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch),
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
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Test agent phone call"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none"
          >
            <div key={open ? 'open' : 'closed'} className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto">
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
                <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
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
                    {/* Country selector */}
                    <div className="relative flex-shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="h-full flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 text-xs rounded-l-2xl text-slate-700 hover:bg-slate-100/70 transition-colors min-w-[88px] cursor-pointer font-semibold border-r border-slate-200"
                      >
                        <span className="text-sm">{selectedCountry.flag}</span>
                        <span className="text-[11px] text-slate-600 font-mono font-bold">{countryCode}</span>
                        <svg className={`w-3 h-3 text-slate-400 ml-auto transition-transform duration-150 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
                                    onClick={() => {
                                      setCountryCode(c.code);
                                      setShowCountryDropdown(false);
                                      setCountrySearch('');
                                    }}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCall();
                      }}
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
                    {error ? (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-rose-500 font-bold flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z" />
                        </svg>
                        {error}
                      </motion.p>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Will dial as <span className="font-mono font-bold text-slate-500">{countryCode}{cleanedDigits || '…'}</span>
                      </p>
                    )}
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

export function WebCallDialog({
  open,
  onClose,
  agent,
  mode,
  seconds,
  errorMsg,
}: WebCallDialogProps) {
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
                        animate={{ height: [6, ((idx * 7) % 22) + 8, 6] }}
                        transition={{
                          duration: 0.5 + ((idx * 3) % 5) * 0.1,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          delay: idx * 0.04
                        }}
                      />
                    ))}
                  </div>
                ) : mode === 'connecting' ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Establishing audio stream…</span>
                  </div>
                ) : mode === 'error' ? (
                  <p className="text-xs font-semibold text-rose-400 px-4 line-clamp-2">{errorMsg || 'Failed to connect to agent voice server.'}</p>
                ) : (
                  <p className="text-xs font-semibold text-slate-400">Call session closed</p>
                )}
              </div>

              {/* Duration / Controls */}
              {mode === 'active' && (
                <div className="mb-6 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-blue-400">
                  {formatTimer(seconds)}
                </div>
              )}

              {/* Action End Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.28 3H5z" />
                </svg>
                <span>End Call Session</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
