import React from 'react';
import { useAppSelector } from '../hooks/useStore';

interface AddOnMeta {
  icon: string;
  title: string;
  desc: string;
  bg: string;
  border: string;
  text: string;
}

const ADDON_MAP: Record<string, AddOnMeta> = {
  'whatsapp-channel': {
    icon: '💬',
    title: 'WhatsApp Business API',
    desc: 'Native Meta WhatsApp Integration Unlocked',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200/80',
    text: 'text-emerald-800',
  },
  'advanced-analytics': {
    icon: '📊',
    title: 'Advanced Analytics',
    desc: 'Funnel Heatmaps & CSAT Metrics Active',
    bg: 'bg-blue-50/80',
    border: 'border-blue-200/80',
    text: 'text-blue-800',
  },
  'priority-support': {
    icon: '🎧',
    title: 'Priority Support (2-Hour SLA)',
    desc: 'Dedicated Slack Channel & Specialist Active',
    bg: 'bg-purple-50/80',
    border: 'border-purple-200/80',
    text: 'text-purple-800',
  },
  'monthly-performance-report': {
    icon: '📊',
    title: 'Monthly Quality PDF Reports',
    desc: 'Call Scores & Benchmarks Active',
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200/80',
    text: 'text-indigo-800',
  },
  'script-ab-testing': {
    icon: '🧪',
    title: 'Script A/B Testing',
    desc: 'Dual Script Optimization Unlocked',
    bg: 'bg-teal-50/80',
    border: 'border-teal-200/80',
    text: 'text-teal-800',
  },
  'whatsapp-followup': {
    icon: '💬',
    title: 'Post-Call WhatsApp Sequences',
    desc: 'Automated Post-Call Flows Active',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200/80',
    text: 'text-emerald-800',
  },
  'regional-language-agent': {
    icon: '🌐',
    title: 'Regional Multilingual Voices',
    desc: 'Hindi, Tamil, Telugu & Bengali Voice Models Unlocked',
    bg: 'bg-sky-50/80',
    border: 'border-sky-200/80',
    text: 'text-sky-800',
  },
  'reactivation-campaigns': {
    icon: '🔁',
    title: 'Reactivation Campaigns (+500 Calls)',
    desc: 'Outbound Database Calling Quota Active',
    bg: 'bg-amber-50/80',
    border: 'border-amber-200/80',
    text: 'text-amber-800',
  },
  'white-label-reseller': {
    icon: '🏷️',
    title: 'White-Label Branding',
    desc: 'Custom Domain & Logo Rights Unlocked',
    bg: 'bg-violet-50/80',
    border: 'border-violet-200/80',
    text: 'text-violet-800',
  },
};

export const ActiveAddOnsBanner: React.FC<{ filterIds?: string[]; className?: string }> = ({
  filterIds,
  className = '',
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const activeList = user?.activeAddOns || [];

  if (!activeList || activeList.length === 0) return null;

  const displayList = filterIds
    ? activeList.filter((id) => filterIds.includes(id))
    : activeList;

  if (displayList.length === 0) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Active Add-On Capabilities Unlocked</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {displayList.map((id) => {
          const meta = ADDON_MAP[id] || {
            icon: '⚡',
            title: id,
            desc: 'Active Add-On Feature',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
            text: 'text-slate-800',
          };

          return (
            <div
              key={id}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border ${meta.bg} ${meta.border} ${meta.text} shadow-xs transition-all hover:scale-[1.01]`}
            >
              <span className="text-base">{meta.icon}</span>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>{meta.title}</span>
                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[11px] opacity-80">{meta.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveAddOnsBanner;
