import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function PhoneIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function CalendarIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function QuestionIcon() { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>; }

const agentTypeMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  receptionist: { icon: <PhoneIcon />,    color: '37, 99, 235', label: 'Receptionist' },
  appointment:  { icon: <CalendarIcon />, color: '0, 163, 255', label: 'Appointment'  },
  faq:          { icon: <QuestionIcon />, color: '20, 184, 166',  label: 'FAQ'           },
};

export const AgentCard = memo(({ agent, index, onWebCall, onCallMe }: { agent: any; index: number; onWebCall?: (agent: any) => void; onCallMe?: (agent: any) => void }) => {
  const cfg = agentTypeMap[agent.type] || agentTypeMap.receptionist;
  const isActive = agent.isActive !== false;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(37,99,235,0.08)' }}
      className="rounded-[20px] border border-slate-200/50 bg-white/75 backdrop-blur-md overflow-hidden transition-all duration-300 group flex flex-col justify-between"
    >
      <div>
        <div className="h-1 w-full" style={{ background: isActive ? 'linear-gradient(90deg, #2563EB, #10B981)' : '#cbd5e1' }} />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: `rgba(${cfg.color},0.1)` }}>
              <span style={{ color: `rgb(${cfg.color})` }}>{cfg.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-slate-800 truncate">{agent.name}</h3>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{cfg.label}</p>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border transition-colors duration-250 ${
              isActive
                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/10'
                : 'border-slate-300/35 text-slate-400 bg-slate-50'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {isActive ? 'Active' : 'Muted'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-4 pb-4 pt-1.5 border-t border-slate-100/50 gap-2">
        <span className="text-[10px] font-bold text-slate-400">
          {(agent.callCount || 0).toLocaleString()} calls
        </span>
        <div className="flex items-center gap-1">
          {onWebCall && isActive && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onWebCall(agent)}
              className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white cursor-pointer border-none shadow-xs hover:opacity-95 transition-all"
            >
              Web
            </motion.button>
          )}
          {onCallMe && isActive && agent.phoneNumberId && (
            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: '#10B981', color: '#fff', borderColor: '#10B981' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onCallMe(agent)}
              className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg transition-all cursor-pointer border"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1.5px solid rgba(16,185,129,0.25)',
                color: '#10B981',
              }}
            >
              Test
            </motion.button>
          )}
          <Link to={`/dashboard/ai-voice-agent`}
            className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/5 transition-all"
          >
            Config
          </Link>
        </div>
      </div>
    </motion.div>
  );
});
