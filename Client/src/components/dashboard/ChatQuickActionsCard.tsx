import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChatQuickActionsCardProps {
  fadeUp?: any;
  UsersIcon: React.FC;
}

export const ChatQuickActionsCard: React.FC<ChatQuickActionsCardProps> = ({ fadeUp, UsersIcon }) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <div className="mb-4">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">QUICK ACTIONS</p>
        <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Get Started with Chat</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            to: '/dashboard/ai-chatbot',
            title: 'Open Chat',
            desc: 'Start a conversation',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            ),
            color: '#2563EB',
            bg: 'bg-blue-50/50',
          },
          {
            to: '/dashboard/billing',
            title: 'Upgrade Plan',
            desc: 'Get more conversations',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            color: '#10B981',
            bg: 'bg-green-50/50',
          },
          { to: '/dashboard/leads', title: 'View Leads', desc: 'Review captured data', icon: <UsersIcon />, color: '#14B8A6', bg: 'bg-teal-50/50' },
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
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-700 leading-tight">{action.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{action.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};
