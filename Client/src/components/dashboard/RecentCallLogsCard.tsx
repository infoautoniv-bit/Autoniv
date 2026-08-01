import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface RecentCallLogsCardProps {
  fadeUp?: any;
  hasRecentCalls: boolean;
  recentCalls: any[];
  callStatus: Record<string, { label: string; color: string; bg: string; dotColor: string }>;
  formatDur: (sec: number) => string;
  getCallDurSec: (call: any) => number;
  setDetailCall: (call: any) => void;
  CallIcon: React.FC;
}

export const RecentCallLogsCard: React.FC<RecentCallLogsCardProps> = ({
  fadeUp,
  hasRecentCalls,
  recentCalls,
  callStatus,
  formatDur,
  getCallDurSec,
  setDetailCall,
  CallIcon,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ACTIVITY LOGS</p>
            <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Recent Call Logs</h2>
          </div>
          <Link
            to="/dashboard/calls"
            className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors"
          >
            View All →
          </Link>
        </div>

        {hasRecentCalls ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {recentCalls.map((call, i) => {
              const dur = formatDur(getCallDurSec(call));
              const st = callStatus[call.status] ?? callStatus.failed;
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setDetailCall(call)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:border-slate-300/60 cursor-pointer transition-all group shadow-sm active:scale-99"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dotColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.8">
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {call.agentName || 'AI Receptionist'}
                        </span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${st.bg}`} style={{ color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {call.callerNumber && call.callerNumber !== 'Unknown' ? call.callerNumber : 'Vapi Caller'} ·{' '}
                        {call.startedAt
                          ? new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'No Data'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">{dur}</span>
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4 py-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
              <CallIcon />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No call activity recorded</p>
              <Link to="/dashboard/ai-voice-agent" className="text-xs font-bold text-[var(--primary-blue)] hover:underline mt-0.5 block">
                Launch test dialer simulator →
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
