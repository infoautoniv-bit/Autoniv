import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { VoicePreviewButton } from './VoicePreviewButton';
import { VOICE_OPTIONS } from '../config/voices';
import { PROMPT_TEMPLATES } from '../config/agentPrompts';
import { agentService, phoneNumberService } from '../services/api';
import { logger } from '../utils/logger';
import type { Agent, PhoneNumber as SavedPhoneNumber } from '../types';

interface PhoneNumber {
  id: string;
  number: string;
  provider: string;
  assistantId: string | null;
  status: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pl', label: 'Polish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ru', label: 'Russian' },
  { value: 'tr', label: 'Turkish' },
];

const ENGINE_OPTIONS = [
  { value: 'groq:llama-3.3-70b', label: 'Groq Llama-3.3-70b' },
  { value: 'openai:gpt-4o-mini', label: 'OpenAI GPT-4o-mini' },
];

const AGENT_TYPES = [
  { value: 'receptionist', label: 'Receptionist', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
  )},
  { value: 'appointment', label: 'Appointment Booking', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
  )},
  { value: 'faq', label: 'FAQ Support', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  )},
];

// ————————————————————————————————————————————————————————————
// Shared primitives
// ————————————————————————————————————————————————————————————

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{children}</p>
      {hint && <p className="text-[10px] text-[var(--text-muted)]/60">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none transition-all duration-150 focus:border-[var(--primary-blue)] focus:ring-4 focus:ring-[var(--primary-blue)]/10 ${mono ? 'font-mono tracking-tight' : ''}`}
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];

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
        className={`w-full px-4 py-2.5 text-sm bg-[var(--s1)] border rounded-xl text-[var(--text)] flex items-center justify-between gap-2 outline-none transition-all duration-150 cursor-pointer ${
          open ? 'border-[var(--primary-blue)] ring-4 ring-[var(--primary-blue)]/10' : 'border-[var(--border)]'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1.5 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/20 overflow-hidden origin-top"
          >
            <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    opt.value === value
                      ? 'bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--s1)] hover:text-[var(--text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 5 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none transition-all duration-150 focus:border-[var(--primary-blue)] focus:ring-4 focus:ring-[var(--primary-blue)]/10 resize-none leading-relaxed"
    />
  );
}

/** A real toggle switch, replacing the native checkbox for the custom-engine setting. */
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full flex-shrink-0 transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-blue)]/40 focus-visible:ring-offset-1 ${
        checked ? 'bg-[var(--primary-blue)]' : 'bg-[var(--border)]'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
        style={{ x: checked ? 18 : 0 }}
      />
    </button>
  );
}

/** Ambient equalizer bars — a small signature motif tying the Voice tab back to the product's subject (a phone call). Idle, not tied to real audio. */
function Equalizer({ active }: { active: boolean }) {
  const bars = [0.4, 0.9, 0.6, 1, 0.5, 0.75];
  return (
    <div className="flex items-end gap-[3px] h-4">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-[var(--primary-blue)]"
          animate={active ? { height: [`${h * 30}%`, '100%', `${h * 50}%`, '100%', `${h * 40}%`] } : { height: `${h * 45}%` }}
          transition={active ? { duration: 1.1 + i * 0.08, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          style={{ height: `${h * 45}%` }}
        />
      ))}
    </div>
  );
}

/** Tab bar button with an animated sliding indicator (shared layout). */
function TabButton({ active, onClick, icon, label, dot }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; dot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
        active ? 'text-[var(--primary-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
      }`}
    >
      <span className="relative">
        {icon}
        {dot && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
      </span>
      {label}
      {active && (
        <motion.span
          layoutId="agent-panel-tab-indicator"
          className="absolute left-2 right-2 -bottom-[1px] h-[2px] rounded-full bg-[var(--primary-blue)]"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

export interface AgentPanelProps {
  open: boolean;
  onClose: () => void;
  editing: Agent | null;
  formData: {
    name: string;
    type: string;
    prompt: string;
    language: string;
    voiceId: string;
    useCustomEngine?: boolean;
    customEngineModel?: string;
    hubspotToken?: string;
    webhookUrl?: string;
    crmIntegrations?: {
      hubspotToken?: string;
      webhookUrl?: string;
    };
  };
  setFormData: (d: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  onAssignPhone?: (phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) => Promise<void>;
  onUnlinkPhone?: () => Promise<void>;
}

type TabId = 'identity' | 'voice' | 'prompt' | 'engine' | 'connect' | 'crm';

export function AgentPanel({
  open, onClose, editing, formData, setFormData, onSubmit, submitting,
  onAssignPhone, onUnlinkPhone,
}: AgentPanelProps) {
  const filteredVoices = formData.useCustomEngine ? VOICE_OPTIONS : VOICE_OPTIONS.filter(v => !v.value.startsWith('sarvam:'));
  const agentTypeMeta = AGENT_TYPES.find((t) => t.value === formData.type) || AGENT_TYPES[0];
  const showConnectTab = !!(editing && onAssignPhone);

  const [tab, setTab] = useState<TabId>('identity');
  const [voiceHover, setVoiceHover] = useState(false);

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [savedPhoneNumbers, setSavedPhoneNumbers] = useState<SavedPhoneNumber[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);

  const [phoneSourceMode, setPhoneSourceMode] = useState<'saved' | 'vapi' | 'direct'>('saved');
  const [directPhoneNum, setDirectPhoneNum] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');

  const fetchPhoneNumbers = useCallback(async () => {
    setPhoneLoading(true);
    try {
      const [vapiRes, savedRes] = await Promise.all([
        agentService.getPhoneNumbers().catch(() => ({ data: { phoneNumbers: [] } })),
        phoneNumberService.getAll().catch(() => ({ data: { phoneNumbers: [] } })),
      ]);
      const vapiNums = vapiRes.data.phoneNumbers || [];
      const savedNums = savedRes.data.phoneNumbers || [];
      setPhoneNumbers(vapiNums);
      setSavedPhoneNumbers(savedNums);

      if (editing) {
        const linkedNumber = editing.phoneNumber || editing.phoneNumberId;
        if (editing.useCustomEngine || formData.useCustomEngine || editing.twilioAccountSid) {
          setPhoneSourceMode('direct');
          setDirectPhoneNum(editing.phoneNumber || '');
          setTwilioSid(editing.twilioAccountSid || '');
          setTwilioToken(editing.twilioAuthToken || '');
        } else if (linkedNumber && savedNums.some((p: any) => p.phoneNumber === linkedNumber || p.id === linkedNumber)) {
          setPhoneSourceMode('saved');
          setSelectedPhoneId(linkedNumber);
        } else if (linkedNumber && vapiNums.some((p: any) => p.id === linkedNumber || p.number === linkedNumber)) {
          setPhoneSourceMode('vapi');
          setSelectedPhoneId(linkedNumber);
        } else if (linkedNumber) {
          setPhoneSourceMode('saved');
          setSelectedPhoneId(linkedNumber);
        }
      }
    } catch (err) {
      logger.error('Failed to fetch phone numbers:', err);
    } finally {
      setPhoneLoading(false);
    }
  }, [editing, formData.useCustomEngine]);

  useEffect(() => {
    if (open) setTab('identity');
  }, [open]);

  useEffect(() => {
    if (open && editing && onAssignPhone) {
      fetchPhoneNumbers();
    }
  }, [open, editing, fetchPhoneNumbers, onAssignPhone]);

  useEffect(() => {
    if (!filteredVoices.some(v => v.value === formData.voiceId)) {
      setFormData((prev: any) => ({ ...prev, voiceId: filteredVoices[0]?.value || '' }));
    }
  }, [formData.language]);



  const handleAssignPhone = async () => {
    if (!onAssignPhone) return;
    setPhoneSaving(true);
    try {
      if (phoneSourceMode === 'saved') {
        if (!selectedPhoneId) return;
        const found = savedPhoneNumbers.find(p => p.id === selectedPhoneId || p.phoneNumber === selectedPhoneId);
        const numberStr = found ? found.phoneNumber : selectedPhoneId;
        await onAssignPhone(numberStr, numberStr);
      } else if (phoneSourceMode === 'vapi') {
        if (!selectedPhoneId) return;
        const selectedNumber = phoneNumbers.find(p => p.id === selectedPhoneId);
        await onAssignPhone(selectedPhoneId, selectedNumber?.number);
      } else {
        if (!directPhoneNum.trim()) return;
        await onAssignPhone(directPhoneNum.trim(), directPhoneNum.trim(), twilioSid.trim(), twilioToken.trim());
      }
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleUnlinkPhone = async () => {
    if (!onUnlinkPhone) return;
    setPhoneSaving(true);
    try {
      await onUnlinkPhone();
      setSelectedPhoneId('');
      setDirectPhoneNum('');
      setTwilioSid('');
      setTwilioToken('');
    } finally {
      setPhoneSaving(false);
    }
  };

  const hasPhoneLinked = !!(editing?.phoneNumberId || editing?.phoneNumber);
  const phoneDirty = (phoneSourceMode !== 'direct' && selectedPhoneId && selectedPhoneId !== (editing?.phoneNumberId || editing?.phoneNumber || '')) ||
    (phoneSourceMode === 'direct' && directPhoneNum.trim() && (directPhoneNum.trim() !== (editing?.phoneNumber || '') || twilioSid.trim() !== (editing?.twilioAccountSid || '') || twilioToken.trim() !== (editing?.twilioAuthToken || '')));

  const completion: Record<TabId, boolean> = {
    identity: !!formData.name.trim(),
    voice: !!formData.voiceId,
    prompt: formData.prompt.trim().length > 20,
    engine: !!formData.useCustomEngine,
    connect: hasPhoneLinked,
    crm: !!(formData.hubspotToken || formData.webhookUrl || formData.crmIntegrations?.hubspotToken || formData.crmIntegrations?.webhookUrl),
  };
  const readyCount = (['identity', 'voice', 'prompt'] as TabId[]).filter((k) => completion[k]).length;

  const tabs = useMemo(() => {
    const list: { id: TabId; label: string; icon: React.ReactNode }[] = [
      { id: 'identity', label: 'Identity', icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      )},
      { id: 'voice', label: 'Voice', icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0M12 18v3m-4 0h8M9 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z"/></svg>
      )},
      { id: 'prompt', label: 'Prompt', icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      )},
      { id: 'crm', label: 'CRM & Webhooks', icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
      )},
    ];
    if (showConnectTab) {
      list.push({ id: 'connect', label: 'Connect', icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      )});
    }
    return list;
  }, [showConnectTab]);

  const slide = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Panel header */}
            <div className="relative flex items-center gap-3.5 px-6 pt-5 pb-4 border-b border-[var(--border)] flex-shrink-0 overflow-hidden">
              <div
                className="absolute inset-x-0 -top-16 h-32 opacity-[0.15] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top, var(--primary-blue), transparent 70%)' }}
              />
              <div className="relative w-10 h-10 rounded-xl bg-[var(--primary-blue-soft)] border border-[var(--primary-blue)]/20 flex items-center justify-center text-[var(--primary-blue)] flex-shrink-0">
                {agentTypeMeta.icon}
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)] mb-0.5">
                  {editing ? 'Edit agent' : 'New agent'}
                </p>
                <h2 className="text-base font-semibold text-[var(--text)] truncate">
                  {editing ? editing.name : (formData.name || 'Untitled agent')}
                </h2>
              </div>
              {!editing && (
                <span className="relative hidden sm:flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] flex-shrink-0">
                  {readyCount}/3 ready
                </span>
              )}
              <button
                onClick={onClose}
                className="relative p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--s1)] transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 border-b border-[var(--border)] flex-shrink-0 overflow-x-auto custom-scrollbar">
              {tabs.map((t) => (
                <TabButton
                  key={t.id}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                  icon={t.icon}
                  label={t.label}
                  dot={t.id !== 'identity' ? completion[t.id] : false}
                />
              ))}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">

                {tab === 'identity' && (
                  <motion.div key="identity" {...slide} transition={{ duration: 0.16 }} className="space-y-5">
                    <div>
                      <FieldLabel>Agent name</FieldLabel>
                      <TextInput
                        value={formData.name}
                        onChange={(v) => setFormData({ ...formData, name: v })}
                        placeholder="e.g. Front Desk Assistant"
                      />
                    </div>

                    <div>
                      <FieldLabel>Type</FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {AGENT_TYPES.map((t) => (
                          <motion.button
                            key={t.value}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setFormData({ ...formData, type: t.value })}
                            className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border text-xs font-medium transition-colors duration-150 cursor-pointer ${
                              formData.type === t.value
                                ? 'bg-[var(--primary-blue-soft)] border-[var(--primary-blue)] text-[var(--primary-blue)] font-semibold'
                                : 'bg-[var(--s1)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--text-muted)]/40'
                            }`}
                          >
                            <span className={formData.type === t.value ? 'text-[var(--primary-blue)]' : 'text-[var(--text-muted)]'}>{t.icon}</span>
                            {t.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 'voice' && (
                  <motion.div key="voice" {...slide} transition={{ duration: 0.16 }} className="space-y-5">
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--s1)] border border-[var(--border)]"
                      onMouseEnter={() => setVoiceHover(true)}
                      onMouseLeave={() => setVoiceHover(false)}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text)] truncate">
                          {filteredVoices.find(v => v.value === formData.voiceId)?.label || 'Select a voice'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Speaks {LANGUAGE_OPTIONS.find(l => l.value === formData.language)?.label}</p>
                      </div>
                      <Equalizer active={voiceHover} />
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                      <div>
                        <FieldLabel>Language</FieldLabel>
                        <SelectInput
                          value={formData.language}
                          onChange={(v) => setFormData({ ...formData, language: v })}
                          options={LANGUAGE_OPTIONS}
                        />
                      </div>
                      <div>
                        <FieldLabel>&nbsp;</FieldLabel>
                        <div className="flex items-center gap-2">
                          <VoicePreviewButton
                            voiceId={formData.voiceId}
                            language={formData.language}
                            prompt={formData.prompt || undefined}
                          />
                          <span className="text-[10px] text-[var(--text-muted)]">Preview</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {([
                        { key: 'vapi', title: 'Vapi Native', desc: 'Lowest latency, optimized', filter: (v: any) => v.value.startsWith('vapi:') },
                        { key: 'elevenlabs', title: 'ElevenLabs', desc: 'Premium natural voices', filter: (v: any) => !v.value.startsWith('vapi:') && !v.value.startsWith('sarvam:') },
                        { key: 'sarvam', title: 'Sarvam AI', desc: 'Indian-native voices', filter: (v: any) => v.value.startsWith('sarvam:') },
                      ] as const).map(section => {
                        const voices = filteredVoices.filter(section.filter);
                        if (voices.length === 0) return null;
                        return (
                          <div key={section.key}>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text)]">{section.title}</h4>
                              <span className="text-[9px] font-semibold text-[var(--text-muted)] bg-[var(--s1)] px-1.5 py-0.5 rounded-md">{voices.length}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] mb-2">{section.desc}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {voices.map(v => {
                                const selected = formData.voiceId === v.value;
                                const name = v.label.split(' (')[0];
                                const meta = v.label.split(' - ')[1] || '';
                                return (
                                  <button
                                    key={v.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, voiceId: v.value })}
                                    className={`text-left px-3 py-2 rounded-lg border text-[11px] transition-all cursor-pointer ${
                                      selected
                                        ? 'bg-[var(--primary-blue-soft)] border-[var(--primary-blue)] text-[var(--primary-blue)] ring-2 ring-[var(--primary-blue)]/10'
                                        : 'bg-[var(--s1)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary-blue)]/40 hover:text-[var(--text)]'
                                    }`}
                                  >
                                    <span className="font-semibold block truncate">{name}</span>
                                    {meta && <span className="text-[9px] text-[var(--text-muted)] block truncate mt-0.5">{meta}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {tab === 'prompt' && (
                  <motion.div key="prompt" {...slide} transition={{ duration: 0.16 }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">Quick-fill:</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]/70">{formData.prompt.length} chars</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {PROMPT_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, prompt: tpl.prompt })}
                          className="px-2.5 py-1 text-[10.5px] font-medium rounded-lg cursor-pointer transition-colors duration-150 bg-[var(--s1)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)] hover:bg-[var(--primary-blue-soft)]"
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                    <TextareaInput
                      value={formData.prompt}
                      onChange={(v) => setFormData({ ...formData, prompt: v })}
                      placeholder="You are a professional receptionist. Greet callers warmly and collect their information…"
                      rows={12}
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Describe how your agent should behave, its tone, and what information to collect.
                    </p>
                  </motion.div>
                )}

                {tab === 'engine' && (
                  <motion.div key="engine" {...slide} transition={{ duration: 0.16 }}>
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[var(--s1)] border border-[var(--border)]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text)]">Custom telephony engine</p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                          Run this agent on your own local server / LLM API key instead of Vapi.
                        </p>
                      </div>
                      <Switch
                        checked={formData.useCustomEngine || false}
                        onChange={(v) => setFormData({ ...formData, useCustomEngine: v })}
                      />
                    </div>

                    <AnimatePresence>
                      {formData.useCustomEngine && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <FieldLabel>LLM engine</FieldLabel>
                          <SelectInput
                            value={formData.customEngineModel || 'groq:llama-3.3-70b'}
                            onChange={(v) => setFormData({ ...formData, customEngineModel: v })}
                            options={ENGINE_OPTIONS}
                          />
                          <p className="mt-3 text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Requires a Custom Twilio number — switch to the Connect tab to set it up.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {tab === 'crm' && (
                  <motion.div key="crm" {...slide} transition={{ duration: 0.16 }} className="space-y-4">
                    <div>
                      <FieldLabel hint="HubSpot Private App Token">HubSpot Access Token</FieldLabel>
                      <TextInput
                        value={formData.hubspotToken || formData.crmIntegrations?.hubspotToken || ''}
                        onChange={(v) => setFormData((p: any) => ({ ...p, hubspotToken: v, crmIntegrations: { ...(p.crmIntegrations || {}), hubspotToken: v } }))}
                        placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        mono
                      />
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-1.5">
                        Creates or updates contacts in HubSpot CRM with caller name, phone number, email, purpose, and call notes.
                      </p>
                    </div>

                    <div>
                      <FieldLabel hint="Zapier, GHL, Zoho, Salesforce">Custom Webhook URL</FieldLabel>
                      <TextInput
                        value={formData.webhookUrl || formData.crmIntegrations?.webhookUrl || ''}
                        onChange={(v) => setFormData((p: any) => ({ ...p, webhookUrl: v, crmIntegrations: { ...(p.crmIntegrations || {}), webhookUrl: v } }))}
                        placeholder="https://hooks.zapier.com/hooks/catch/... or https://your-domain.com/webhook"
                        mono
                      />
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-1.5">
                        Instant JSON HTTP POST payload sent when phone calls complete with extracted lead details.
                      </p>
                    </div>
                  </motion.div>
                )}

                {tab === 'connect' && showConnectTab && (
                  <motion.div key="connect" {...slide} transition={{ duration: 0.16 }}>
                    {phoneLoading ? (
                      <div className="flex items-center gap-2 py-3">
                        <svg className="animate-spin w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span className="text-xs text-[var(--text-muted)]">Loading phone numbers…</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hasPhoneLinked && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--primary-blue-soft)] border border-[var(--primary-blue)]/20">
                              <div className="w-7 h-7 rounded-lg bg-[var(--primary-blue)]/15 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L17 7"/></svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-blue)]/70">Currently linked</p>
                                <p className="text-xs font-semibold text-[var(--primary-blue)] truncate font-mono">{editing?.phoneNumber || editing?.phoneNumberId}</p>
                              </div>
                              {onUnlinkPhone && (
                                <button
                                  type="button"
                                  onClick={handleUnlinkPhone}
                                  disabled={phoneSaving}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/25 hover:bg-amber-500/20 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                  Unlink
                                </button>
                              )}
                            </div>

                            {formData.useCustomEngine && editing?.phoneNumberId && (
                              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed flex gap-2.5">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                                <div><strong className="font-semibold">Vapi number conflict.</strong> Custom engine agents can't use a Vapi number. Unlink it above, then assign a custom Twilio number.</div>
                              </div>
                            )}

                            {!formData.useCustomEngine && editing?.phoneNumber && !editing?.phoneNumberId && (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed flex gap-2.5">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                                <div><strong className="font-semibold">Twilio number conflict.</strong> This agent runs on Vapi, which needs a Vapi number. Unlink below, then link a Vapi number.</div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="inline-flex p-0.5 rounded-lg bg-[var(--s1)] border border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setPhoneSourceMode('saved')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${phoneSourceMode === 'saved' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                          >
                            Saved Numbers ({savedPhoneNumbers.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoneSourceMode('vapi')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${phoneSourceMode === 'vapi' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                          >
                            Vapi Number
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoneSourceMode('direct')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${phoneSourceMode === 'direct' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                          >
                            Direct Entry
                          </button>
                        </div>

                        {phoneSourceMode === 'saved' && (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70">
                                  Select saved phone number
                                </p>
                                <Link
                                  to="/dashboard/phone-numbers"
                                  onClick={() => onClose()}
                                  className="text-[10px] font-bold text-[var(--primary-blue)] hover:underline"
                                >
                                  Manage Numbers ↗
                                </Link>
                              </div>
                              <div className="relative">
                                <select
                                  value={selectedPhoneId}
                                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                                  className="w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] appearance-none cursor-pointer outline-none focus:border-[var(--primary-blue)] focus:ring-4 focus:ring-[var(--primary-blue)]/10 transition-all"
                                >
                                  <option value="">— Select saved number —</option>
                                  {savedPhoneNumbers.map((pn) => (
                                    <option key={pn.id} value={pn.phoneNumber}>
                                      {pn.phoneNumber} ({pn.platform.toUpperCase()}){pn.friendlyName ? ` — ${pn.friendlyName}` : ''}{pn.assignedToAgent ? ' (Assigned)' : ''}
                                    </option>
                                  ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                </svg>
                              </div>
                            </div>

                            {savedPhoneNumbers.length === 0 && (
                              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                No saved phone numbers found.{' '}
                                <Link to="/dashboard/phone-numbers" className="text-[var(--primary-blue)] font-bold hover:underline">
                                  Add numbers from Exotel, Plivo, Twilio, Ozonetel, etc.
                                </Link>
                              </p>
                            )}
                          </>
                        )}

                        {phoneSourceMode === 'vapi' && (
                          <>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">
                                {editing?.phoneNumberId ? 'Change to' : 'Select number'}
                              </p>
                              <div className="relative">
                                <select
                                  value={selectedPhoneId}
                                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                                  className="w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] appearance-none cursor-pointer outline-none focus:border-[var(--primary-blue)] focus:ring-4 focus:ring-[var(--primary-blue)]/10 transition-all"
                                >
                                  <option value="">— No phone number —</option>
                                  {phoneNumbers.map((pn) => (
                                    <option key={pn.id} value={pn.id} disabled={!!pn.assistantId && pn.assistantId !== editing?.vapiId}>
                                      {pn.number} ({pn.provider}){pn.assistantId ? ' — In Use' : ''}
                                    </option>
                                  ))}
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                </svg>
                              </div>
                            </div>

                            {phoneNumbers.length === 0 && (
                              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                No phone numbers found in Vapi. Import one from the admin phone management.
                              </p>
                            )}
                          </>
                        )}

                        {phoneSourceMode === 'direct' && (
                          <div className="space-y-3 p-4 rounded-xl bg-[var(--s1)] border border-[var(--border)]">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]/70">Direct phone number</span>
                              </div>
                              <TextInput value={directPhoneNum} onChange={setDirectPhoneNum} placeholder="e.g. +919876543210 or +1845541210" mono />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">Twilio account SID (Optional)</p>
                              <TextInput value={twilioSid} onChange={setTwilioSid} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" mono />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">Twilio auth token (Optional)</p>
                              <input
                                type="password"
                                value={twilioToken}
                                onChange={(e) => setTwilioToken(e.target.value)}
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                className="w-full px-4 py-2.5 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 outline-none focus:border-[var(--primary-blue)] focus:ring-4 focus:ring-[var(--primary-blue)]/10 transition-all font-mono"
                              />
                            </div>
                          </div>
                        )}

                        <AnimatePresence>
                          {phoneDirty && (
                            <motion.button
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              type="button"
                              onClick={handleAssignPhone}
                              disabled={phoneSaving || (phoneSourceMode === 'direct' && !directPhoneNum.trim())}
                              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-40 flex items-center justify-center gap-1.5"
                            >
                              {phoneSaving ? (
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                              )}
                              {phoneSourceMode === 'direct' ? 'Save phone & credentials' : 'Assign phone number'}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] flex items-center gap-3 bg-[var(--surface)]">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !formData.name.trim()}
                className="btn-cta flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 text-white transition-colors flex items-center justify-center gap-2 border-none"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {editing ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    {editing ? 'Save changes' : 'Create agent'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--s1)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DeleteModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
          >
            <div className="px-6 py-6 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Delete agent?</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">This action cannot be undone. The agent will be permanently removed.</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer border-none"
                >
                  Delete agent
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--s1)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { AGENT_TYPES, LANGUAGE_OPTIONS };