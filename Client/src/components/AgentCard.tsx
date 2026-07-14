import { motion } from 'framer-motion';
import type { Agent } from '../types';
import { VOICE_OPTIONS } from '../config/voices';

interface AgentCardProps {
  agent: Agent;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, isActive: boolean) => void;
  onAssignPhone?: (agent: Agent) => void;
  onCallMe?: (agent: Agent) => void;
  onWebCall?: (agent: Agent) => void;
  onViewPrompt?: (agent: Agent) => void;
  showOwner?: boolean;
}

const LANGUAGE_FLAGS: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  fr: { label: 'French', flag: '🇫🇷' },
  de: { label: 'German', flag: '🇩🇪' },
  it: { label: 'Italian', flag: '🇮🇹' },
  pt: { label: 'Portuguese', flag: '🇵🇹' },
  pl: { label: 'Polish', flag: '🇵🇱' },
  hi: { label: 'Hindi', flag: '🇮🇳' },
  bn: { label: 'Bengali', flag: '🇮🇳' },
  te: { label: 'Telugu', flag: '🇮🇳' },
  ta: { label: 'Tamil', flag: '🇮🇳' },
  mr: { label: 'Marathi', flag: '🇮🇳' },
  gu: { label: 'Gujarati', flag: '🇮🇳' },
  kn: { label: 'Kannada', flag: '🇮🇳' },
  ml: { label: 'Malayalam', flag: '🇮🇳' },
  pa: { label: 'Punjabi', flag: '🇮🇳' },
  or: { label: 'Odia', flag: '🇮🇳' },
  ar: { label: 'Arabic', flag: '🇸🇦' },
  ja: { label: 'Japanese', flag: '🇯🇵' },
  ko: { label: 'Korean', flag: '🇰🇷' },
  zh: { label: 'Chinese', flag: '🇨🇳' },
  nl: { label: 'Dutch', flag: '🇳🇱' },
  ru: { label: 'Russian', flag: '🇷🇺' },
  tr: { label: 'Turkish', flag: '🇹🇷' },
};

const typeConfig: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  glowRgb: string;
  label: string;
  pillClass: string;
}> = {
  receptionist: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-[#2563EB] to-[#10B981]',
    glowRgb: '37,99,235',
    label: 'Receptionist',
    pillClass: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  appointment: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-[#10B981] to-[#34D399]',
    glowRgb: '16,185,129',
    label: 'Scheduler',
    pillClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  faq: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-[#7C3AED] to-[#2563EB]',
    glowRgb: '124,58,237',
    label: 'Q&A Bot',
    pillClass: 'bg-violet-50 border-violet-200 text-violet-700',
  },
};

export function AgentCard({ agent, onDelete, onToggle, onAssignPhone, onCallMe, onWebCall, onViewPrompt, showOwner }: AgentCardProps) {
  const config = typeConfig[agent.type] || typeConfig.receptionist;
  const voiceOpt = VOICE_OPTIONS.find(v => v.value === agent.voiceId);
  let voiceName = 'Default';
  if (voiceOpt) {
    const firstPart = voiceOpt.label.split(' - ')[0];
    const openCount = (firstPart.match(/\(/g) || []).length;
    const closeCount = (firstPart.match(/\)/g) || []).length;
    voiceName = firstPart + (openCount > closeCount ? ')' : '');
  } else if (agent.voiceId === 'sarvam:bulbul') {
    voiceName = 'Sarvam Bulbul (Indic-native)';
  } else if (agent.voiceId && agent.voiceId.startsWith('sarvam:')) {
    const parts = agent.voiceId.split(':');
    const speaker = parts[parts.length - 1];
    voiceName = `Sarvam ${speaker.charAt(0).toUpperCase() + speaker.slice(1)}`;
  }
  const langConfig = LANGUAGE_FLAGS[agent.language || 'en'] || { label: 'English', flag: '🇺🇸' };

  // Harmonized theme variables for model badges
  const isGemini = agent.customEngineModel?.startsWith('gemini');
  const isOpenAI = agent.customEngineModel?.startsWith('openai');
  const modelColorClass = isGemini
    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700'
    : isOpenAI
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
    : 'bg-amber-500/10 border-amber-500/20 text-amber-700';

  const modelLabel = isGemini
    ? 'Gemini 2.5'
    : isOpenAI
    ? 'GPT-4o-mini'
    : 'Groq Llama-3.3';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="relative group rounded-[24px] overflow-hidden transition-all duration-300 border border-slate-200/60 hover:border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] bg-white/70 backdrop-blur-xl"
    >
      {/* Gradient top stripe using brand colors */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500 via-[#50C878] to-emerald-500" />

      {/* Hover radial light glow using theme color */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: `radial-gradient(circle, rgba(${config.glowRgb},0.15) 0%, transparent 70%)` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex flex-row items-center justify-between gap-3 mb-4.5">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Icon orb */}
            <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-[0_8px_16px_rgba(${config.glowRgb},0.22)] transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 flex-shrink-0`}>
              {config.icon}
              {agent.isActive && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#50C878] animate-pulse shadow-[0_0_8px_#50C878]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-[15px] leading-tight tracking-tight truncate text-slate-800 transition-colors duration-200 group-hover:text-blue-600">
                {agent.name}
              </h3>
              <span className="text-[9.5px] font-black uppercase tracking-[0.16em] text-slate-400 block truncate">
                {config.label}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center flex-shrink-0">
            {onToggle && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(agent.id, !agent.isActive); }}
                className="relative w-10 h-5.5 rounded-full transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0"
                style={{ background: agent.isActive ? '#50C878' : '#e2e8f0' }}
                title={agent.isActive ? 'Deactivate Agent' : 'Activate Agent'}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                  className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                  animate={{ x: agent.isActive ? 18 : 0 }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Prompt snippet */}
        <div className="mb-4 min-h-[48px]">
          {agent.prompt ? (
            <>
              <p className="text-[11px] line-clamp-3 leading-relaxed font-semibold text-slate-500">
                {agent.prompt}
              </p>
              {agent.prompt.length > 120 && (
                <button
                  onClick={() => onViewPrompt?.(agent)}
                  className="text-[10px] font-extrabold mt-1 cursor-pointer border-none bg-transparent p-0 text-blue-600 transition-colors duration-200 hover:underline"
                >
                  View full prompt
                </button>
              )}
            </>
          ) : (
            <p className="text-[11px] italic leading-relaxed text-slate-400">
              No system instructions configured yet...
            </p>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mb-4.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors duration-200 ${
            agent.isActive
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'animate-pulse bg-emerald-500' : 'bg-rose-500'}`} />
            {agent.isActive ? 'Active' : 'Inactive'}
          </span>
          {agent.useCustomEngine && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border-blue-500/20 text-blue-700">
              Custom Engine
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600">
            <span className="text-[11px]">{langConfig.flag}</span>
            {langConfig.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            {voiceName}
          </span>
          {agent.useCustomEngine && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${modelColorClass}`}>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {modelLabel}
            </span>
          )}
          {agent.callCount > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.pillClass}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {agent.callCount.toLocaleString()} calls
            </span>
          )}
        </div>

        {/* Owner row */}
        {showOwner && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-xs bg-gradient-to-tr from-blue-500 to-emerald-500">
              {(agent.userName || agent.userEmail || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-[10.5px] font-bold text-slate-600 truncate">
              {agent.userName || agent.userEmail}
            </span>
          </div>
        )}

        {/* Footer separator line */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          {/* Top Row: Phone Badge & Secondary/Destructive Actions */}
          <div className="flex items-center justify-between gap-2.5">
            {/* Phone badge */}
            <div className="min-w-0">
              {(agent.phoneNumberId || agent.phoneNumber) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wide border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-xs truncate max-w-[170px]" title={agent.phoneNumber}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">{agent.phoneNumber || 'Linked'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9.5px] font-bold uppercase tracking-wide border border-slate-200 bg-slate-50 text-slate-400">
                  <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  No Phone
                </span>
              )}
            </div>

            {/* Config & Delete buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onAssignPhone && (
                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: '#2563EB', color: '#fff', borderColor: '#2563EB' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onAssignPhone(agent)}
                  title="Link Phone"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-xl cursor-pointer border transition-all duration-200"
                  style={{
                    background: 'rgba(37,99,235,0.06)',
                    border: '1.5px solid rgba(37,99,235,0.25)',
                    color: '#2563EB',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link
                </motion.button>
              )}

              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(agent.id)}
                  title="Delete Agent"
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 text-rose-400 border border-slate-200 bg-white"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Bottom Row: Primary Calling Actions */}
          {agent.isActive && (onWebCall || (onCallMe && (agent.phoneNumberId || agent.phoneNumber))) && (
            <div className="flex gap-2 w-full pt-1">
              {onWebCall && (
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 14px rgba(37,99,235,0.22)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onWebCall(agent)}
                  title="Web Call"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide rounded-xl cursor-pointer border-none text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 transition-all duration-300 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Web Call
                </motion.button>
              )}

              {onCallMe && (agent.phoneNumberId || agent.phoneNumber) && (
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#10B981', color: '#fff', borderColor: '#10B981' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onCallMe(agent)}
                  title="Test Call"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide rounded-xl cursor-pointer border transition-all duration-200"
                  style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1.5px solid rgba(16,185,129,0.25)',
                    color: '#10B981',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Test Call
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}