import { useEffect, useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchAllAgents, toggleAgent, assignPhone, unlinkPhone, deleteAgent, updateAgent } from '../../store/slices/agentsSlice';
import { Modal } from '../../components/Modal';

import { AgentPanel, DeleteModal } from '../../components/AgentPanel';
import { Pagination } from '../../components/Pagination';
import { VOICE_OPTIONS } from '../../config/voices';
import { agentService } from '../../services/api';
import type { Agent } from '../../types';
import { logger } from '../../utils/logger';

interface PhoneNumber {
  id: string;
  number: string;
  provider: string;
  assistantId: string | null;
  status: string;
}

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const avatarPalette = [
  '#2563eb', '#10B981', '#00A3FF', '#14B8A6', '#8b5cf6', '#f59e0b',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

// ─── Animated Counter ─────────────────────────────────────────────────
const AnimatedCounter = memo(({ value, className = '' }: { value: number; className?: string }) => {
  const [display, setDisplay] = useState(0);
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    if (prefersReduced) {
      const handle = setTimeout(() => setDisplay(value), 0);
      return () => clearTimeout(handle);
    }
    let frame = 0;
    const total = 35;
    let animId: number;
    const tick = () => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(Math.round(eased * value));
      if (frame < total) animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [value, prefersReduced]);
  return <span className={className}>{display.toLocaleString()}</span>;
});

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none z-50 shadow-md border bg-white border-slate-200/60 text-slate-500"
          >
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-200" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PROVIDER_OPTIONS = [
  { value: 'twilio', label: 'Twilio', description: 'Cloud communications API', category: 'direct', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.18 1.897-.962 6.502-1.36 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.12.099.153.23.168.326.016.093.036.304.02.468z"/>
    </svg>
  )},
  { value: 'vonage', label: 'Vonage', description: 'Communications API platform', category: 'direct', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.32c4.247 0 7.68 3.433 7.68 7.68s-3.433 7.68-7.68 7.68-7.68-3.433-7.68-7.68S7.753 4.32 12 4.32zM7.44 16.32c.48-1.92 1.44-3.36 2.88-4.32.48-.24.96-.48 1.68-.48s1.2.24 1.68.48c1.44.96 2.4 2.4 2.88 4.32H7.44z"/>
    </svg>
  )},
  { value: 'telnyx', label: 'Telnyx', description: 'Global cloud communications', category: 'direct', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7.5c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2zm5 7.5h-2v-3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V17h-2v-6h2v.9c.47-.67 1.3-1.1 2-1.1 1.5 0 2.5 1 2.5 2.5V17z"/>
    </svg>
  )},
  { value: 'plivo', label: 'Plivo', description: 'Cloud telephony via SIP', category: 'sip', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  )},
  { value: 'zadarma', label: 'Zadarma', description: 'VoIP provider via SIP', category: 'sip', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  )},
  { value: 'custom-sip', label: 'Custom SIP', description: 'Any SIP trunk provider', category: 'sip', icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  )},
];

function ProviderDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PROVIDER_OPTIONS.find((p) => p.value === value) || PROVIDER_OPTIONS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <span className="text-blue-400">{selected.icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">{selected.label}</p>
            <p className="text-xs text-white/40">{selected.description}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="py-1">
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">Direct Integration</p>
            {PROVIDER_OPTIONS.filter(p => p.category === 'direct').map((provider) => (
              <button
                key={provider.value}
                type="button"
                onClick={() => { onChange(provider.value); setOpen(false); }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors"
                style={{ background: provider.value === value ? 'rgba(37,99,235,0.15)' : 'transparent' }}
                onMouseEnter={(e) => { if (provider.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (provider.value !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: provider.value === value ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${provider.value === value ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <span className={provider.value === value ? 'text-blue-400' : 'text-white/30'}>{provider.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${provider.value === value ? 'text-blue-400' : 'text-white/80'}`}>
                    {provider.label}
                  </p>
                  <p className="text-xs text-white/35">{provider.description}</p>
                </div>
                {provider.value === value && (
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 mt-1">SIP Trunk (BYO)</p>
            {PROVIDER_OPTIONS.filter(p => p.category === 'sip').map((provider) => (
              <button
                key={provider.value}
                type="button"
                onClick={() => { onChange(provider.value); setOpen(false); }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors"
                style={{ background: provider.value === value ? 'rgba(37,99,235,0.15)' : 'transparent' }}
                onMouseEnter={(e) => { if (provider.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (provider.value !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: provider.value === value ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${provider.value === value ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <span className={provider.value === value ? 'text-blue-400' : 'text-white/30'}>{provider.icon}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${provider.value === value ? 'text-blue-400' : 'text-white/80'}`}>
                    {provider.label}
                  </p>
                  <p className="text-xs text-white/35">{provider.description}</p>
                </div>
                {provider.value === value && (
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  receptionist: { label: 'Receptionist', color: '#2563eb', bg: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
  appointment:  { label: 'Appointment',  color: '#00A3FF', bg: 'linear-gradient(135deg,#00A3FF,#0ea5e9)' },
  faq:          { label: 'FAQ',          color: '#14B8A6', bg: 'linear-gradient(135deg,#14B8A6,#10b981)' },
};

function PhoneDropdown({ phoneNumbers, selectedId, onSelect }: {
  phoneNumbers: PhoneNumber[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = phoneNumbers.find((pn) => pn.id === selectedId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {selected ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/90 truncate">{selected.number}</p>
              <p className="text-xs text-white/40 truncate">{selected.provider}</p>
            </div>
            {selected.assistantId && (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full flex-shrink-0 border border-amber-500/20">In Use</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-white/30">Select a phone number...</span>
        )}
        <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            {phoneNumbers.map((pn) => (
              <button
                key={pn.id}
                type="button"
                onClick={() => { onSelect(pn.id); setOpen(false); }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors"
                style={{
                  background: pn.id === selectedId ? 'rgba(37,99,235,0.15)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (pn.id !== selectedId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (pn.id !== selectedId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: pn.id === selectedId ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${pn.id === selectedId ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <svg className={`w-4 h-4 ${pn.id === selectedId ? 'text-blue-400' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${pn.id === selectedId ? 'text-blue-400' : 'text-white/80'}`}>
                    {pn.number}
                  </p>
                  <p className="text-xs text-white/35 truncate">
                    {pn.provider} • {pn.id.slice(0, 8)}...
                  </p>
                </div>
                {pn.assistantId && (
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full flex-shrink-0 border border-amber-500/20">In Use</span>
                )}
                {pn.id === selectedId && (
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TRANSPORT_OPTIONS = [
  { value: 'udp', label: 'UDP', desc: 'Fast, no encryption' },
  { value: 'tcp', label: 'TCP', desc: 'Reliable, no encryption' },
  { value: 'tls', label: 'TLS', desc: 'Encrypted (recommended)' },
];

function TransportDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = TRANSPORT_OPTIONS.find(t => t.value === value) || TRANSPORT_OPTIONS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-sm rounded-xl text-white/80 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            selected.value === 'tls' ? 'bg-emerald-400' : selected.value === 'tcp' ? 'bg-amber-400' : 'bg-white/30'
          }`} />
          <div className="text-left">
            <span className="font-medium">{selected.label}</span>
            <span className="text-white/35 ml-1.5 text-xs">— {selected.desc}</span>
          </div>
        </div>
        <svg className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
            {TRANSPORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5"
                style={{ background: opt.value === value ? 'rgba(37,99,235,0.15)' : 'transparent' }}
                onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  opt.value === 'tls' ? 'bg-emerald-400' : opt.value === 'tcp' ? 'bg-amber-400' : 'bg-white/30'
                }`} />
                <div>
                  <span className={`font-medium ${opt.value === value ? 'text-blue-400' : 'text-white/80'}`}>{opt.label}</span>
                  <span className="text-white/35 ml-1.5 text-xs">— {opt.desc}</span>
                </div>
                {opt.value === value && (
                  <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminAgents() {
  const dispatch = useAppDispatch();
  const agents = useAppSelector((state) => state.agents.items);
  const pagination = useAppSelector((state) => state.agents.pagination);

  const [phoneModal, setPhoneModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [directPhoneNum, setDirectPhoneNum] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'receptionist',
    prompt: '',
    language: 'en',
    voiceId: VOICE_OPTIONS[0]?.value || '',
    useCustomEngine: false,
    customEngineModel: 'groq:llama-3.3-70b',
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Phone number management
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState<'select' | 'import'>('select');
  const [importForm, setImportForm] = useState({
    provider: 'twilio', number: '',
    twilioAccountSid: '', twilioAuthToken: '', twilioApiKey: '', twilioApiSecret: '',
    vonageApiKey: '', vonageApiSecret: '',
    telnyxApiKey: '',
    sipGateway: '', sipUsername: '', sipPassword: '', sipTransport: 'udp',
  });
  const [importing, setImporting] = useState(false);

  const [retrying, setRetrying] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRetrying(true);
    await dispatch(fetchAllAgents({ page, limit: 20 }));
    setTimeout(() => setRetrying(false), 850);
  }, [dispatch, page]);

  const fetchPhoneNumbers = async () => {
    setPhoneLoading(true);
    try {
      const res = await agentService.getPhoneNumbers();
      setPhoneNumbers(res.data.phoneNumbers || []);
    } catch (err) {
      logger.error('Failed to fetch phone numbers:', err);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleImportNumber = async () => {
    if (!importForm.number.trim()) return;
    setImporting(true);
    try {
      const res = await agentService.createPhoneNumber({
        provider: importForm.provider,
        number: importForm.number.trim(),
        twilioAccountSid: importForm.twilioAccountSid || undefined,
        twilioAuthToken: importForm.twilioAuthToken || undefined,
        twilioApiKey: importForm.twilioApiKey || undefined,
        twilioApiSecret: importForm.twilioApiSecret || undefined,
        vonageApiKey: importForm.vonageApiKey || undefined,
        vonageApiSecret: importForm.vonageApiSecret || undefined,
        telnyxApiKey: importForm.telnyxApiKey || undefined,
        sipGateway: importForm.sipGateway || undefined,
        sipUsername: importForm.sipUsername || undefined,
        sipPassword: importForm.sipPassword || undefined,
        sipTransport: importForm.sipTransport || undefined,
      });
      const newNumber = res.data.phoneNumber;
      setPhoneNumbers(prev => [...prev, newNumber]);
      setPhoneNumberId(newNumber.id);
      setPhoneMode('select');
      setImportForm({
        provider: 'twilio', number: '',
        twilioAccountSid: '', twilioAuthToken: '', twilioApiKey: '', twilioApiSecret: '',
        vonageApiKey: '', vonageApiSecret: '',
        telnyxApiKey: '',
        sipGateway: '', sipUsername: '', sipPassword: '', sipTransport: 'udp',
      });
    } catch (err) {
      logger.error('Failed to import phone number:', err);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllAgents({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    const handle = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(handle);
  }, [searchTerm, statusFilter]);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? (statusFilter === 'active' ? agent.isActive : !agent.isActive) : true;
    return matchesSearch && matchesStatus;
  });

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await dispatch(toggleAgent({ id, isActive })).unwrap();
    } catch (err) {
      logger.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteAgent(deleteTarget)).unwrap();
    } catch (err) {
      logger.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const openAssignPhone = (agent: Agent) => {
    setSelectedAgent(agent);
    setPhoneNumberId(agent.phoneNumberId || '');
    setDirectPhoneNum(agent.phoneNumber || '');
    setTwilioSid(agent.twilioAccountSid || '');
    setTwilioToken(agent.twilioAuthToken || '');
    setPhoneMode('select');
    setPhoneModal(true);
    fetchPhoneNumbers();
  };

  const handleAssignPhone = async () => {
    if (!selectedAgent) return;
    try {
      if (selectedAgent.useCustomEngine) {
        if (!directPhoneNum.trim()) return;
        await dispatch(assignPhone({
          id: selectedAgent.id,
          phoneNumberId: directPhoneNum.trim(),
          phoneNumber: directPhoneNum.trim(),
          twilioAccountSid: twilioSid.trim() || undefined,
          twilioAuthToken: twilioToken.trim() || undefined,
        })).unwrap();
      } else {
        if (!phoneNumberId.trim()) return;
        const selectedNumber = phoneNumbers.find(pn => pn.id === phoneNumberId);
        await dispatch(assignPhone({
          id: selectedAgent.id,
          phoneNumberId: phoneNumberId.trim(),
          phoneNumber: selectedNumber?.number,
        })).unwrap();
      }
      setPhoneModal(false);
      setSelectedAgent(null);
      setPhoneNumberId('');
      setDirectPhoneNum('');
      setTwilioSid('');
      setTwilioToken('');
    } catch (err) {
      logger.error(err);
    }
  };

  const handleUnlinkPhone = async (agent: Agent) => {
    if (!agent.phoneNumberId && !agent.phoneNumber) return;
    try {
      await dispatch(unlinkPhone({ id: agent.id })).unwrap();
    } catch (err) {
      logger.error(err);
    }
  };

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditForm({
      name: agent.name,
      type: agent.type,
      prompt: agent.prompt || '',
      language: agent.language || 'en',
      voiceId: agent.voiceId || VOICE_OPTIONS[0]?.value || '',
      useCustomEngine: !!agent.useCustomEngine,
      customEngineModel: agent.customEngineModel || 'groq:llama-3.3-70b',
    });
    setEditPanelOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAgent || submitting) return;
    setSubmitting(true);
    try {
      await dispatch(updateAgent({
        id: selectedAgent.id,
        data: {
          name: editForm.name,
          type: editForm.type,
          prompt: editForm.prompt,
          language: editForm.language,
          voiceId: editForm.voiceId,
          isActive: selectedAgent.isActive,
          useCustomEngine: !!editForm.useCustomEngine,
          customEngineModel: editForm.customEngineModel,
        },
      })).unwrap();
      setEditPanelOpen(false);
      setSelectedAgent(null);
    } catch (err) {
      logger.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.isActive).length,
    inactive: agents.filter((a) => !a.isActive).length,
    linked: agents.filter((a) => a.phoneNumberId).length,
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden pb-10 pr-1">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[9px] font-extrabold tracking-[0.22em] text-[#10B981] uppercase">
                ◈ AGENT FACTORY
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border bg-blue-50 text-[#2563eb] border-blue-200/50">
                Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">All Agents</h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tip text="Refresh agent list">
              <button
                onClick={handleRefresh}
                disabled={retrying}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-50 bg-white hover:bg-slate-50 border-slate-200 text-slate-500 cursor-pointer"
              >
                <svg className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </Tip>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-white" style={{ borderColor: '#e2e8f0' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-600">{stats.active} active</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-400">{agents.length} total</span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Agents', value: stats.total,    accentColor: '37,99,235',  colorHex: '#2563EB', delta: 'Platform agents' },
            { label: 'Active',       value: stats.active,   accentColor: '16,185,129', colorHex: '#10B981', delta: 'Currently live', trend: 'up' as const },
            { label: 'Inactive',     value: stats.inactive, accentColor: '245,158,11', colorHex: '#f59e0b', delta: 'Paused or muted' },
            { label: 'Phone Linked', value: stats.linked,   accentColor: '0,163,255',  colorHex: '#00A3FF', delta: 'Numbers assigned' },
          ].map((s) => {
            const isHov = hoveredCard === s.label;
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={spring}
                onMouseEnter={() => setHoveredCard(s.label)}
                onMouseLeave={() => setHoveredCard(null)}
                className="rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 bg-white/70 shadow-sm backdrop-blur-md cursor-default"
                style={{
                  borderColor: isHov ? `rgba(${s.accentColor},0.3)` : '#e2e8f0',
                  boxShadow: isHov ? `0 12px 36px rgba(${s.accentColor},0.08)` : '0 1px 3px rgba(37,99,235,0.01)',
                }}
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                  animate={{ opacity: isHov ? 1 : 0, scale: isHov ? 1 : 0.8 }}
                  transition={{ duration: 0.35 }}
                  style={{ background: `radial-gradient(circle, rgba(${s.accentColor},0.08) 0%, transparent 70%)` }}
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3 relative z-10">{s.label}</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <p className="text-2xl sm:text-[28px] font-extrabold text-slate-800 tracking-tight leading-none">
                    <AnimatedCounter value={s.value} />
                  </p>
                  {s.trend && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md text-green-600 bg-green-50">
                      ↑ {s.delta}
                    </span>
                  )}
                </div>
                {!s.trend && (
                  <p className="text-[10px] font-bold mt-1 text-slate-400 uppercase tracking-wider relative z-10">{s.delta}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Search & Filter ── */}
        <motion.div variants={fadeUp} className="relative z-10">
          <div className="relative max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by agent name or owner…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  statusFilter === f.value
                    ? 'btn-cta text-white border-[#2563eb] shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Agent Cards ── */}
        {filteredAgents.length === 0 ? (
          <motion.div variants={fadeUp} className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md">
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#2563eb]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">No agents found</p>
              <p className="text-[11px] text-slate-300 max-w-xs">
                {searchTerm || statusFilter ? 'Try adjusting your search or filter.' : 'Platform agents will appear here once created.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent, i) => {
              const tc = typeConfig[agent.type] ?? typeConfig.receptionist;
              const ownerColor = getAvatarColor(agent.userName || agent.name);
              const isActive = agent.isActive !== false;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3 }}
                  className="group bg-white/80 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all backdrop-blur-md flex flex-col"
                >
                  {/* Card top gradient strip */}
                  <div className="h-1 w-full" style={{ background: isActive ? tc.bg : '#e2e8f0' }} />

                  {/* Card header */}
                  <div className="p-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                      style={{ background: tc.bg }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-800 truncate">{agent.name}</h3>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{tc.label}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        isActive
                          ? 'border-green-200 text-green-600 bg-green-50'
                          : 'border-slate-200 text-slate-400 bg-slate-50'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      {isActive ? 'Active' : 'Muted'}
                    </span>
                  </div>

                  {/* Owner row */}
                  {agent.userName && (
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: ownerColor }}
                      >
                        {agent.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 truncate">{agent.userName}</span>
                    </div>
                  )}

                  {/* Phone + call count row */}
                  <div className="px-4 pb-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                    <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${
                      agent.phoneNumberId ? 'text-[#2563eb]' : 'text-slate-400'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      {agent.phoneNumber || (agent.phoneNumberId ? 'Linked' : 'Not linked')}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {(agent.callCount || 0).toLocaleString()} calls
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="px-4 pb-4 flex flex-wrap gap-1.5 mt-auto">
                    <button
                      onClick={() => openEdit(agent)}
                      className="flex-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer min-h-[30px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openAssignPhone(agent)}
                      className="flex-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-blue-50 text-[#2563eb] border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer min-h-[30px]"
                    >
                      {agent.phoneNumberId ? 'Change Phone' : 'Assign Phone'}
                    </button>
                    {agent.phoneNumberId && (
                      <button
                        onClick={() => handleUnlinkPhone(agent)}
                        className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer min-h-[30px]"
                      >
                        Unlink
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(agent.id, !agent.isActive)}
                      className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer min-h-[30px] ${
                        isActive
                          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                          : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      {isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer min-h-[30px]"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </motion.div>

      {/* Phone Assignment Modal */}
      <Modal
        isOpen={phoneModal}
        onClose={() => setPhoneModal(false)}
        title={selectedAgent?.useCustomEngine ? `Configure Custom Telephony Credentials for ${selectedAgent?.name || ''}` : `Assign Phone Number to ${selectedAgent?.name || ''}`}
        footer={
          <>
            <button
              onClick={() => setPhoneModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {selectedAgent?.useCustomEngine ? (
              <button
                onClick={handleAssignPhone}
                disabled={!directPhoneNum.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.20)' }}
              >
                Save Credentials
              </button>
            ) : phoneMode === 'import' ? (
              <button
                onClick={handleImportNumber}
                disabled={importing || !importForm.number.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.20)' }}
              >
                {importing ? 'Importing...' : 'Import & Assign'}
              </button>
            ) : (
              <button
                onClick={handleAssignPhone}
                disabled={!phoneNumberId}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.20)' }}
              >
                Assign
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {selectedAgent?.useCustomEngine ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-sm text-amber-500 font-medium flex items-center gap-1">⚡ Custom LLM Engine Telephony Config</p>
                <p className="text-xs text-white/35 mt-1">Configure direct Twilio phone number credentials for this custom agent.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Twilio Phone Number</label>
                <input
                  type="text"
                  value={directPhoneNum}
                  onChange={(e) => setDirectPhoneNum(e.target.value)}
                  placeholder="e.g. +1845541210"
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Twilio Account SID</label>
                <input
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Twilio Auth Token</label>
                <input
                  type="password"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="Your Twilio auth token"
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setPhoneMode('select')}
                  className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: phoneMode === 'select' ? 'linear-gradient(135deg, #2563EB, #10B981)' : 'transparent',
                    color: phoneMode === 'select' ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneMode('import')}
                  className="flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  style={{
                    background: phoneMode === 'import' ? 'linear-gradient(135deg, #2563EB, #10B981)' : 'transparent',
                    color: phoneMode === 'import' ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  Import from Provider
                </button>
              </div>

              {phoneMode === 'select' ? (
                <>
                  {phoneLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <svg className="animate-spin w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <span className="ml-2 text-sm text-white/40">Loading phone numbers...</span>
                    </div>
                  ) : phoneNumbers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-white/40">No phone numbers found in Vapi.</p>
                      <button
                        type="button"
                        onClick={() => setPhoneMode('import')}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                      >
                        Import one from a provider
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Select Phone Number</label>
                      <PhoneDropdown
                        phoneNumbers={phoneNumbers}
                        selectedId={phoneNumberId}
                        onSelect={setPhoneNumberId}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.15)' }}>
                    <p className="text-sm text-blue-400 font-medium">Import Existing Number</p>
                    <p className="text-xs text-white/35 mt-1">Connect your provider phone number to Vapi.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Provider</label>
                    <ProviderDropdown
                      value={importForm.provider}
                      onChange={(v) => setImportForm(prev => ({ ...prev, provider: v }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Phone Number</label>
                    <input
                      type="text"
                      value={importForm.number}
                      onChange={(e) => setImportForm(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <p className="text-[11px] text-white/25">Must be in E.164 format (e.g. +14155552671)</p>
                  </div>

                  {importForm.provider === 'twilio' && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Twilio Credentials</p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Account SID</label>
                        <input type="text" value={importForm.twilioAccountSid} onChange={(e) => setImportForm(prev => ({ ...prev, twilioAccountSid: e.target.value }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Auth Token</label>
                        <input type="password" value={importForm.twilioAuthToken} onChange={(e) => setImportForm(prev => ({ ...prev, twilioAuthToken: e.target.value }))} placeholder="Your Twilio auth token"
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>
                  )}

                  {importForm.provider === 'vonage' && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Vonage Credentials</p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">API Key</label>
                        <input type="text" value={importForm.vonageApiKey} onChange={(e) => setImportForm(prev => ({ ...prev, vonageApiKey: e.target.value }))} placeholder="Your Vonage API key"
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">API Secret</label>
                        <input type="password" value={importForm.vonageApiSecret} onChange={(e) => setImportForm(prev => ({ ...prev, vonageApiSecret: e.target.value }))} placeholder="Your Vonage API secret"
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>
                  )}

                  {importForm.provider === 'telnyx' && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">Telnyx Credentials</p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">API Key</label>
                        <input type="password" value={importForm.telnyxApiKey} onChange={(e) => setImportForm(prev => ({ ...prev, telnyxApiKey: e.target.value }))} placeholder="Your Telnyx API key"
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                    </div>
                  )}

                  {(importForm.provider === 'plivo' || importForm.provider === 'zadarma' || importForm.provider === 'custom-sip') && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">SIP Trunk Credentials</p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">SIP Gateway / Domain</label>
                        <input type="text" value={importForm.sipGateway} onChange={(e) => setImportForm(prev => ({ ...prev, sipGateway: e.target.value }))}
                          placeholder={importForm.provider === 'plivo' ? 'sip.plivo.com' : importForm.provider === 'zadarma' ? 'sip.zadarma.com' : 'sip.example.com'}
                          className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Username (optional)</label>
                          <input type="text" value={importForm.sipUsername} onChange={(e) => setImportForm(prev => ({ ...prev, sipUsername: e.target.value }))} placeholder="SIP username"
                            className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Password (optional)</label>
                          <input type="password" value={importForm.sipPassword} onChange={(e) => setImportForm(prev => ({ ...prev, sipPassword: e.target.value }))} placeholder="SIP password"
                            className="w-full px-4 py-2.5 text-sm rounded-xl text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5 block">Transport</label>
                        <TransportDropdown
                          value={importForm.sipTransport}
                          onChange={(v) => setImportForm(prev => ({ ...prev, sipTransport: v }))}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Edit Agent Panel (same slide-over as user MyAgents) */}
      <AgentPanel
        open={editPanelOpen}
        onClose={() => { setEditPanelOpen(false); setSelectedAgent(null); }}
        editing={selectedAgent}
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        onAssignPhone={async (phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) => {
          if (!selectedAgent) return;
          try {
            await dispatch(assignPhone({ id: selectedAgent.id, phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken })).unwrap();
            setSelectedAgent(prev => prev ? { ...prev, phoneNumberId, phoneNumber, twilioAccountSid, twilioAuthToken } : null);
          } catch (err) {
            logger.error(err);
          }
        }}
        onUnlinkPhone={async () => {
          if (!selectedAgent) return;
          try {
            await dispatch(unlinkPhone({ id: selectedAgent.id })).unwrap();
            setSelectedAgent(prev => prev ? { ...prev, phoneNumberId: undefined, phoneNumber: undefined, twilioAccountSid: undefined, twilioAuthToken: undefined } : null);
          } catch (err) {
            logger.error(err);
          }
        }}
      />

      {/* Delete Confirmation */}
      <DeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}