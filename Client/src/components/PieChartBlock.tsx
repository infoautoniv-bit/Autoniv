import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PieChartBlockProps {
  data: { name: string; value: number; color: string }[];
  answerRate: number;
}

export default function PieChartBlock({ data, answerRate }: PieChartBlockProps) {
  if (data.length === 0) return null;

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={44}
            outerRadius={62}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            animationBegin={300}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: unknown, name: unknown) => [`${Number(value) || 0} calls`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{answerRate}%</div>
          <div className="text-[9px] text-[var(--text-secondary)]600 -mt-0.5">answer rate</div>
        </div>
      </div>
    </div>
  );
}
