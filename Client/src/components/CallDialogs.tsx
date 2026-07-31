import { motion, AnimatePresence } from 'framer-motion';

export interface WebCallDialogProps {
  open: boolean;
  onClose: () => void;
  agent: any;
  mode: 'idle' | 'connecting' | 'active' | 'ended' | 'error';
  seconds: number;
  errorMsg: string;
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
