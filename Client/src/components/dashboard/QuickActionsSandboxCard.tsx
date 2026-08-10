import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface QuickActionsSandboxCardProps {
  fadeUp?: any;
  handleRefresh: () => void;
  retrying: boolean;
  AgentIcon: React.FC;
  CallIcon: React.FC;
  UsersIcon: React.FC;
  RefreshIcon: React.FC<{ spinning?: boolean }>;
}

export const QuickActionsSandboxCard: React.FC<QuickActionsSandboxCardProps> = ({
  fadeUp,
  handleRefresh,
  retrying,
  AgentIcon,
  CallIcon,
  UsersIcon,
  RefreshIcon,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <h2 className="text-sm font-bold text-slate-800 mb-3.5">Quick Actions Sandbox</h2>
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            to: '/dashboard/ai-voice-agent',
            title: 'Create Agent',
            desc: 'Create new receptionist',
            icon: <AgentIcon />,
            color: 'var(--primary-blue)',
            bg: 'bg-blue-50/50',
          },
          {
            to: '/dashboard/calls',
            title: 'Call History',
            desc: 'Listen to recorded logs',
            icon: <CallIcon />,
            color: '#10B981',
            bg: 'bg-green-50/50',
          },
          {
            to: '/dashboard/leads',
            title: 'Synced Leads',
            desc: 'Review pipeline captures',
            icon: <UsersIcon />,
            color: '#14B8A6',
            bg: 'bg-teal-50/50',
          },
          {
            to: '/dashboard/billing',
            title: 'Plan Limits',
            desc: 'Top up calling minutes',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 01-3-3V8a3 3 0 01-3-3H6a3 3 0 01-3 3v8a3 3 0 013 3z"
                />
              </svg>
            ),
            color: '#ef4444',
            bg: 'bg-rose-50/50',
          },
        ].map((action, i) => (
          <Link key={action.title} to={action.to} className="block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2, borderColor: 'rgba(37,99,235,0.25)' }}
              className="flex flex-col p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/40 cursor-pointer h-full justify-between transition-all shadow-sm"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${action.bg}`} style={{ color: action.color }}>
                {action.icon}
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-700 leading-tight">{action.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{action.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <button
        onClick={handleRefresh}
        disabled={retrying}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 hover:bg-slate-50 transition-all text-slate-400 hover:text-[var(--primary-blue)] hover:border-slate-300 font-bold text-xs cursor-pointer"
      >
        <RefreshIcon spinning={retrying} />
        Refresh Dashboard Data
      </button>
    </motion.div>
  );
};
