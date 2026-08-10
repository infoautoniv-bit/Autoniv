import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CallBreakdownCardProps {
  fadeUp?: any;
  callBreakdown: {
    total: number;
    answerRate: number;
    chartData: Array<{ name: string; value: number; color: string }>;
    listItems: Array<{ name: string; value: number; pct: number; color: string }>;
  };
  hasCallData: boolean;
  DonutChart: React.FC<{ data: any[]; rate: number }>;
  CallIcon: React.FC;
}

export const CallBreakdownCard: React.FC<CallBreakdownCardProps> = ({
  fadeUp,
  callBreakdown,
  hasCallData,
  DonutChart,
  CallIcon,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
        style={{ borderColor: 'var(--slate-border)' }}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-sm font-bold text-slate-800">Call Breakdown</h2>
            <Link
              to="/dashboard/calls"
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors"
            >
              All Logs →
            </Link>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mb-5">
            {callBreakdown.total} calls filtered for the chosen range
          </p>

          {hasCallData ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <DonutChart data={callBreakdown.chartData} rate={callBreakdown.answerRate} />
              <div className="flex-1 w-full space-y-3.5">
                {callBreakdown.listItems.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {item.value} <span className="text-slate-400 font-medium">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ delay: 0.2, duration: 0.65, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
                <CallIcon />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No call history matches range</p>
                <Link to="/dashboard/ai-voice-agent" className="text-xs text-[var(--primary-blue)] hover:underline font-bold mt-1 block">
                  Create agent & dial test call →
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
