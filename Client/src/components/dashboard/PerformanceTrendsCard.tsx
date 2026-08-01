import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PerformanceTrendsCardProps {
  fadeUp?: any;
  chartTab: 'volume' | 'minutes';
  setChartTab: (tab: 'volume' | 'minutes') => void;
  performanceTrendData: any[];
}

export const PerformanceTrendsCard: React.FC<PerformanceTrendsCardProps> = ({
  fadeUp,
  chartTab,
  setChartTab,
  performanceTrendData,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4.5">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ANALYTICS ENGINE</p>
          <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Performance Trends</h2>
        </div>

        {/* Chart toggle buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex rounded-xl bg-slate-100 p-0.8 border border-slate-200/50">
            <button
              onClick={() => setChartTab('volume')}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                chartTab === 'volume' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Call Volume
            </button>
            <button
              onClick={() => setChartTab('minutes')}
              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                chartTab === 'minutes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Minutes Used
            </button>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceTrendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.4)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-slate-200/60 p-3 bg-white/95 backdrop-blur-md shadow-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {chartTab === 'volume' ? `${payload[0].value} calls placed` : `${payload[0].value} mins of usage`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={chartTab === 'volume' ? 'Calls Volume' : 'Minutes Used'}
              stroke="var(--primary-blue)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#chartGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
