import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChatUsageCardProps {
  fadeUp?: any;
  user: any;
  AnimatedCounter: React.FC<{ value: number }>;
}

export const ChatUsageCard: React.FC<ChatUsageCardProps> = ({ fadeUp, user, AnimatedCounter }) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CONVERSATION INSIGHTS</p>
          <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Chat Usage</h2>
        </div>
        <Link
          to="/dashboard/billing"
          className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors"
        >
          View Plan →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Conversations Used', value: user?.chatUsed || 0, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          {
            label: 'Monthly Limit',
            value: user?.chatLimit === -1 ? 'Unlimited' : user?.chatLimit || 0,
            color: 'text-[var(--primary-blue)]',
            bg: 'bg-[var(--primary-blue-soft)]/20',
          },
          {
            label: 'Remaining',
            value: user?.chatLimit === -1 ? 'Unlimited' : Math.max(0, (user?.chatLimit || 0) - (user?.chatUsed || 0)),
            color: 'text-green-600',
            bg: 'bg-green-50/50',
          },
          {
            label: 'Usage Rate',
            value: user?.chatLimit === -1 ? 0 : user?.chatLimit ? Math.round(((user?.chatUsed || 0) / user.chatLimit) * 100) : 0,
            color: 'text-amber-600',
            bg: 'bg-amber-50/50',
            suffix: '%',
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-3.5 border border-slate-100 ${item.bg}`}>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
            <p className={`text-xl font-extrabold ${item.color}`}>
              {typeof item.value === 'number' ? <AnimatedCounter value={item.value} /> : item.value}
              {item.suffix || ''}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">
            Need more conversations? Upgrade your chat plan for higher limits.
          </span>
        </div>
        <Link
          to="/dashboard/billing"
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)] transition-all"
        >
          Upgrade
        </Link>
      </div>
    </motion.div>
  );
};
