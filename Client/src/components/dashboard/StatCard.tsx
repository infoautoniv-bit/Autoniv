import { memo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor: string;
  delta?: string;
  onClick?: () => void;
  trend?: 'up' | 'down' | 'neutral';
  colorHex: string;
  hoveredCard: string | null;
  setHoveredCard: (val: string | null) => void;
}

export const StatCard = memo(({ label, value, icon, accentColor, delta, onClick, trend, colorHex, hoveredCard, setHoveredCard }: StatCardProps) => {
  const isHovered = hoveredCard === label;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={spring}
      onMouseEnter={() => setHoveredCard(label)}
      onMouseLeave={() => setHoveredCard(null)}
      onClick={onClick}
      className="rounded-2xl p-4 sm:p-5 border relative overflow-hidden transition-all duration-300 cursor-default bg-white/70 shadow-sm backdrop-blur-md"
      style={{
        borderColor: isHovered ? `rgba(${accentColor},0.3)` : 'var(--slate-border)',
        boxShadow: isHovered ? `0 12px 36px rgba(${accentColor},0.08)` : '0 1px 3px rgba(37,99,235,0.01)',
      }}
    >
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.35 }}
        style={{ background: `radial-gradient(circle, rgba(${accentColor},0.08) 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between gap-2.5 mb-3.5 relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 block leading-tight truncate">
            {label}
          </p>
        </div>
        <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${accentColor},0.10)` }}>
          <span style={{ color: colorHex }} className="flex-shrink-0">{icon}</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl lg:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} />
            ) : (
              value
            )}
          </p>
          {trend && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-50'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {delta}
            </span>
          )}
        </div>
        {!trend && delta && (
          <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider truncate">
            {delta}
          </p>
        )}
      </div>
    </motion.div>
  );
});
