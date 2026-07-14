import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartBlockProps {
  data: { name: string; calls: number; minutes: number }[];
  selectedMetric: 'calls' | 'minutes';
  onMetricChange: (m: 'calls' | 'minutes') => void;
}

export default function AreaChartBlock({ data, selectedMetric, onMetricChange }: AreaChartBlockProps) {
  return (
    <div className="rounded-2xl border border-white/6 overflow-hidden bg-[var(--bg)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Call Volume</h2>
          <p className="text-[11px] text-[var(--text-secondary)]500 mt-0.5">Trends over selected period</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--surface)] rounded-lg p-0.5 border border-white/5">
          <button
            onClick={() => onMetricChange('calls')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              selectedMetric === 'calls' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            Calls
          </button>
          <button
            onClick={() => onMetricChange('minutes')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              selectedMetric === 'minutes' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            Minutes
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a"/>
          <XAxis dataKey="name" stroke="var(--slate-dark)" fontSize={11} tickLine={false} axisLine={false}/>
          <YAxis stroke="var(--slate-dark)" fontSize={11} tickLine={false} axisLine={false}/>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--s1)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke="var(--secondary)"
            fill="url(#colorMetric)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
