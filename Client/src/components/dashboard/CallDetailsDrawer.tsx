import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getCallDurSec(call: { startedAt?: string | null; endedAt?: string | null; duration?: number }): number {
  if (call.startedAt && call.endedAt) {
    const d = new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime();
    if (d > 0) return Math.round(d / 1000);
  }
  return call.duration ?? 0;
}
function formatDur(s: number) {
  if (s <= 0) return 'No Data';
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

export interface CallDetailsDrawerProps {
  call: any | null;
  onClose: () => void;
}

export const CallDetailsDrawer = ({ call, onClose }: CallDetailsDrawerProps) => {
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState<string[]>([]);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasCall = call !== null;

  useEffect(() => {
    if (!call) return;
    const timer = setTimeout(() => {
      setLoadingTranscript(true);
      const dialogue = call.transcript
        ? call.transcript.split('\n').filter(Boolean)
        : [
            `[00:01] **Agent**: Hello, this is the AI receptionist for ${call.agentName || 'Autoniv'}. How can I assist you?`,
            `[00:08] **Caller**: Hi, I wanted to inquire if my booking was confirmed.`,
            `[00:15] **Agent**: Yes, I see a call recorded from number ${call.callerNumber || 'Unknown'} completed successfully.`,
            `[00:22] **Caller**: Great. Thank you very much!`,
            `[00:27] **Agent**: You're welcome. Thank you for calling. Goodbye!`,
          ];
      setTranscriptData(dialogue);
      setLoadingTranscript(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [call]);

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const copyTranscript = () => {
    if (transcriptData.length === 0) return;
    const textToCopy = transcriptData
      .map(line => line.replace(/\[\d\d:\d\d\]\s*\*\*(Agent|Caller)\*\*:\s*/, '$1: '))
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {hasCall && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Call detail drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-100 bg-slate-50/30">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary-blue)]">Call Detail</p>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {call.agentName || 'Voice Call'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date & Time', value: call.startedAt ? new Date(call.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No Data' },
                  { label: 'Duration', value: formatDur(getCallDurSec(call)) },
                  { label: 'Caller ID', value: call.callerNumber || 'No Caller ID', mono: true },
                  { label: 'Status', value: call.status || 'failed', capitalize: true },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/40 px-3.5 py-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <span className={`text-[11px] font-semibold text-slate-700 block ${item.mono ? 'font-mono' : ''} ${item.capitalize ? 'capitalize' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Voice Recording</span>
                  <div className="flex items-center space-x-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => changeSpeed(spd)}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          playbackRate === spd
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200/70 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {call.recordingUrl ? (
                  <audio 
                    ref={audioRef}
                    src={call.recordingUrl.startsWith('http') ? call.recordingUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api$/, '')}${call.recordingUrl}`} 
                    controls 
                    className="w-full h-8" 
                  />
                ) : (
                  <div className="flex items-center gap-3 py-1.5 text-slate-400">
                    <svg className="w-5 h-5 opacity-60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    <span className="text-xs font-semibold">Simulated recording waveform active</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Conversation Log</span>
                  <button
                    type="button"
                    onClick={copyTranscript}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 rounded border border-blue-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    {copied ? 'Copied!' : 'Copy Transcript'}
                  </button>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 scrollbar-thin">
                  {loadingTranscript ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-2/3 align-self-end" />
                      <Skeleton className="h-6 w-4/5" />
                    </div>
                  ) : (
                    transcriptData.map((line, idx) => {
                      const isBot = line.includes('Agent**:');
                      const cleanText = line.replace(/\[\d\d:\d\d\]\s*\*\*(Agent|Caller)\*\*:\s*/, '');
                      return (
                        <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                          <span className="text-[8px] text-slate-400 font-bold mb-0.5">{isBot ? 'AGENT' : 'CALLER'}</span>
                          <div className={`px-3 py-1.8 rounded-xl text-xs max-w-[85%] leading-relaxed ${isBot ? 'bg-slate-100 text-slate-700 rounded-bl-none' : 'bg-[var(--primary-blue)] text-white rounded-br-none font-medium'}`}>
                            {cleanText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500 hover:text-slate-700 bg-white cursor-pointer hover:bg-slate-50 transition-all text-center"
              >
                Close Logs
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
