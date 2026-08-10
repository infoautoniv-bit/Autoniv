import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  fadeUp?: any;
  user: any;
  getGreeting: () => string;
  getPlanDisplayName: (plan?: string) => string;
  planColors: { bg: string; border: string; text: string };
  timeFilter: '7d' | '30d' | 'all';
  setTimeFilter: (f: '7d' | '30d' | 'all') => void;
  handleRefresh: () => void;
  retrying: boolean;
  isVoice: boolean;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  Tip: React.FC<{ text: string; children: React.ReactNode }>;
  RefreshIcon: React.FC<{ spinning?: boolean }>;
  T: { gradient: string };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  fadeUp,
  user,
  getGreeting,
  getPlanDisplayName,
  planColors,
  timeFilter,
  setTimeFilter,
  handleRefresh,
  retrying,
  isVoice,
  addToast,
  Tip,
  RefreshIcon,
  T,
}) => {
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
            ◈ DASHBOARD OVERVIEW
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[var(--primary-blue)] border-blue-200/50">
            Connected
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Member'} 👋
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${planColors.bg} ${planColors.border} ${planColors.text}`}>
          {getPlanDisplayName(user?.plan)} Plan
        </div>

        {/* Time filters switch */}
        <div className="flex rounded-xl border bg-white p-0.8" style={{ borderColor: 'var(--slate-border)' }}>
          {(['7d', '30d', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setTimeFilter(f);
                addToast(`Filtered data by last ${f === 'all' ? 'billing logs' : f} ✨`, 'info');
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                timeFilter === f ? 'bg-[var(--primary-blue-soft)] text-[var(--primary-blue)]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Tip text="Refresh widgets data">
          <button
            onClick={handleRefresh}
            disabled={retrying}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-50 bg-white hover:bg-slate-50 border-slate-200 text-slate-500 cursor-pointer"
          >
            <RefreshIcon spinning={retrying} />
          </button>
        </Tip>

        {isVoice && (
          <Link to="/dashboard/ai-voice-agent">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white shadow-sm cursor-pointer hover:shadow-md"
              style={{ background: T.gradient }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Agent
            </motion.button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};
