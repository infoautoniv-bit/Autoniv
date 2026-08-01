import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface QuickLaunchBannerProps {
  fadeUp?: any;
}

export const QuickLaunchBanner: React.FC<QuickLaunchBannerProps> = ({ fadeUp }) => {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#0B0F19]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-slate-950/40 text-white"
    >
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-extrabold tracking-tight text-white">Quick Launch & Command Hub</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Ready
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
              <span>Press</span>
              <kbd className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 text-[11px] font-mono font-bold text-white rounded-md shadow-inner">
                Ctrl + K
              </kbd>
              <span>to search agents, call logs, or launch actions anywhere.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Link
            to="/dashboard/ai-phone-answering"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-600/25 cursor-pointer border border-blue-400/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-white font-black tracking-wide">Test Voice Call</span>
          </Link>

          <Link
            to="/dashboard/ai-chatbot"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
            <span>Chat Sandbox</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
