interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
  onClick?: () => void;
  subtitle?: string;
}

const colorMap: Record<string, { gradient: string; glow: string; bg: string }> = {
  primary: {
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.15)',
    bg: 'rgba(99,102,241,0.08)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
    glow: 'rgba(34,197,94,0.15)',
    bg: 'rgba(34,197,94,0.08)',
  },
  yellow: {
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    glow: 'rgba(245,158,11,0.15)',
    bg: 'rgba(245,158,11,0.08)',
  },
  pink: {
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    glow: 'rgba(244,63,94,0.15)',
    bg: 'rgba(244,63,94,0.08)',
  },
};

export function StatCard({ label, value, icon, trend, color = 'primary', onClick, subtitle }: StatCardProps) {
  const c = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden border rounded-2xl p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        backgroundColor: 'var(--s1)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: `0 1px 3px rgba(0,0,0,0.2)`,
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${c.glow}`;
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 1px 3px rgba(0,0,0,0.2)`;
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
        }
      }}
    >
      {/* Subtle gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: c.gradient }} />

      <div className="flex items-center justify-between mb-4 relative">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--slate-light)' }}>{label}</span>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: c.gradient,
              boxShadow: `0 4px 12px ${c.glow}`
            }}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between relative">
        <div>
          <span className="text-3xl font-bold text-white tracking-tight tabular-nums">{value}</span>
          {subtitle && <p className="text-[11px] mt-1" style={{ color: 'var(--slate-gray)' }}>{subtitle}</p>}
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: trend.positive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: trend.positive ? '#4ade80' : '#f87171'
            }}>
            <svg className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
            </svg>
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}