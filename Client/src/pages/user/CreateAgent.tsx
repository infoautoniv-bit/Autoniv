import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { createAgent, fetchMyAgents } from '../../store/slices/agentsSlice';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { VoicePreviewButton } from '../../components/VoicePreviewButton';
import { AgentCard } from '../../components/AgentCard';
import { VOICE_OPTIONS } from '../../config/voices';

const VAPI_VOICE_OPTIONS = VOICE_OPTIONS;
import { PROMPT_TEMPLATES } from '../../config/agentPrompts';
import type { Agent, PhoneNumber } from '../../types';
import { createPortal } from 'react-dom';
import { agentService, phoneNumberService } from '../../services/api';
import { logger } from '../../utils/logger';

// ── Constants ──────────────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'de', label: '🇩🇪 German' },
  { value: 'it', label: '🇮🇹 Italian' },
  { value: 'pt', label: '🇵🇹 Portuguese' },
  { value: 'pl', label: '🇵🇱 Polish' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'ko', label: '🇰🇷 Korean' },
  { value: 'zh', label: '🇨🇳 Chinese' },
  { value: 'nl', label: '🇳🇱 Dutch' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'tr', label: '🇹🇷 Turkish' },
];

const AGENT_TYPES = [
  {
    value: 'receptionist',
    label: 'Receptionist',
    desc: 'Greets & routes callers',
    accent: '#2563EB',
    accentDim: 'rgba(37,99,235,0.08)',
    accentBorder: 'rgba(37,99,235,0.18)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: 'appointment',
    label: 'Scheduler',
    desc: 'Books & confirms slots',
    accent: '#059669',
    accentDim: 'rgba(5,150,105,0.08)',
    accentBorder: 'rgba(5,150,105,0.18)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'faq',
    label: 'Q&A Support',
    desc: 'Answers FAQ queries',
    accent: '#7C3AED',
    accentDim: 'rgba(124,58,237,0.08)',
    accentBorder: 'rgba(124,58,237,0.18)',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const DEFAULT_FORM_DATA = {
  name: '', type: 'receptionist', prompt: '', language: 'en', voiceId: VAPI_VOICE_OPTIONS[0].value,
  phoneNumberId: '',
  phoneNumber: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
};

// ── Shared styles ──────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '20px',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '10.5px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--text-muted)',
  marginBottom: '8px',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: 500,
  background: 'var(--s1)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.15s',
};

// ── SelectInput ────────────────────────────────────────────────────────────
function SelectInput({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 240;
      setCoords({ top: openUpward ? rect.top - 6 : rect.bottom + 6, left: rect.left, width: rect.width, openUpward });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => { window.removeEventListener('scroll', updatePosition, true); window.removeEventListener('resize', updatePosition); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between gap-2 cursor-pointer transition-colors duration-150"
        style={inputBase}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-blue)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
      >
        <span className="truncate text-left">{selected?.label}</span>
        <svg
          width="14" height="14"
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: coords.openUpward ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: coords.openUpward ? 4 : -4 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[9999] overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                top: coords.openUpward ? undefined : coords.top,
                bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
                left: coords.left,
                width: coords.width,
              }}
            >
              <div className="max-h-52 overflow-y-auto py-1">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors cursor-pointer"
                    style={{
                      color: opt.value === value ? 'var(--primary-blue)' : 'var(--text-secondary)',
                      background: opt.value === value ? 'var(--primary-blue-soft)' : 'transparent',
                      fontWeight: opt.value === value ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'var(--s1)'; }}
                    onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── SectionCard ────────────────────────────────────────────────────────────
function SectionCard({ step, title, subtitle, children }: {
  step: number; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.06 }}
      style={card}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ background: 'var(--gg)' }}
        >
          {step}
        </div>
        <div>
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
          <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ── RightPanelCard ─────────────────────────────────────────────────────────
function PanelCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function CreateAgent() {
  const dispatch   = useAppDispatch();
  const user       = useAppSelector((s) => s.auth.user);
  const navigate   = useNavigate();
  const location   = useLocation();
  const templateData = location.state?.template;

  const [formData, setFormData] = useState(() =>
    templateData
      ? {
          name: `My ${templateData.title}`,
          type: templateData.type,
          prompt: templateData.prompt,
          language: templateData.language,
          voiceId: templateData.voiceId,
          phoneNumberId: '',
          phoneNumber: '',
          twilioAccountSid: '',
          twilioAuthToken: '',
        }
      : DEFAULT_FORM_DATA
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [savedPhoneNumbers, setSavedPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState<'saved' | 'vapi' | 'direct'>('saved');
  const [selectedProvider, setSelectedProvider] = useState<string>('twilio');

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      setPhoneLoading(true);
      try {
        const [vapiRes, savedRes] = await Promise.all([
          agentService.getPhoneNumbers().catch(() => ({ data: { phoneNumbers: [] } })),
          phoneNumberService.getAll().catch(() => ({ data: { phoneNumbers: [] } })),
        ]);
        setPhoneNumbers(vapiRes.data.phoneNumbers || []);
        setSavedPhoneNumbers(savedRes.data.phoneNumbers || []);
      } catch (err) {
        logger.error('Failed to fetch phone numbers:', err);
      } finally {
        setPhoneLoading(false);
      }
    };
    fetchPhoneNumbers();
  }, []);

  const filteredVoices = VAPI_VOICE_OPTIONS;
  const voiceOpt  = VAPI_VOICE_OPTIONS.find(v => v.value === formData.voiceId);
  let voiceName = 'Default';
  if (voiceOpt) {
    const firstPart = voiceOpt.label.split(' - ')[0];
    const openCount = (firstPart.match(/\(/g) || []).length;
    const closeCount = (firstPart.match(/\)/g) || []).length;
    voiceName = firstPart + (openCount > closeCount ? ')' : '');
  }

  useEffect(() => {
    if (!filteredVoices.some(v => v.value === formData.voiceId)) {
      setFormData(prev => ({ ...prev, voiceId: filteredVoices[0]?.value || '' }));
    }
  }, [formData.language, filteredVoices, formData.voiceId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let phoneNumberVal = '';
      if (phoneMode === 'saved') {
        const found = savedPhoneNumbers.find(p => p.id === formData.phoneNumberId || p.phoneNumber === formData.phoneNumberId);
        phoneNumberVal = found ? found.phoneNumber : formData.phoneNumberId;
      } else if (phoneMode === 'vapi') {
        phoneNumberVal = phoneNumbers.find(p => p.id === formData.phoneNumberId)?.number || '';
      } else {
        phoneNumberVal = formData.phoneNumberId;
      }

      const submitData = {
        ...formData,
        phoneNumber: phoneNumberVal,
        phoneNumberId: phoneMode === 'vapi' ? formData.phoneNumberId : undefined,
        twilioAccountSid: phoneMode === 'direct' ? formData.twilioAccountSid : '',
        twilioAuthToken: phoneMode === 'direct' ? formData.twilioAuthToken : '',
      };
      await dispatch(createAgent(submitData)).unwrap();
      await dispatch(fetchMyAgents({ page: 1, limit: 20 }));
      navigate('/dashboard/ai-voice-agent');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, dispatch, formData, navigate, phoneMode, savedPhoneNumbers, phoneNumbers]);

  const previewAgent: Agent = {
    id: 'preview', userId: 'preview',
    name: formData.name.trim() || 'Your Agent Name',
    type: formData.type as any,
    prompt: formData.prompt,
    voiceId: formData.voiceId,
    language: formData.language,
    isActive: true,
    callCount: 0,
  };

  const readinessItems = [
    { label: 'Agent name set',       done: !!formData.name.trim() },
    { label: 'Role selected',        done: !!formData.type },
    { label: 'Language chosen',      done: !!formData.language },
    { label: 'Voice assigned',       done: !!formData.voiceId },
    { label: 'Instructions written', done: formData.prompt.length > 20 },
  ];
  const readinessPct = Math.round(readinessItems.filter(r => r.done).length / readinessItems.length * 100);

  const patch = (v: Partial<typeof formData>) => setFormData(p => ({ ...p, ...v }));

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'rgba(37,99,235,0.5)';
    e.target.style.background  = 'var(--surface)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.background  = 'var(--s1)';
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">

        {/* Back */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => navigate('/dashboard/ai-voice-agent')}
            className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Back to agents
          </button>
        </motion.div>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5 gradient-text">
            New voice assistant
          </p>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Create AI Agent
          </h1>
          <p className="text-[12.5px] mt-1 max-w-md" style={{ color: 'var(--text-muted)' }}>
            Configure identity, voice, and behavioral guidelines for your assistant.
          </p>
        </motion.div>

        {/* Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-4">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}
                >
                  <svg width="15" height="15" fill="none" stroke="#dc2626" viewBox="0 0 24 24" strokeWidth={2} className="flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[12.5px] font-medium flex-1" style={{ color: '#dc2626' }}>{error}</p>
                  <button onClick={() => setError(null)} style={{ color: '#dc2626' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1 — Identity */}
            <SectionCard step={1} title="Agent Identity" subtitle="Name and role configuration">
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label style={fieldLabel}>Agent name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => patch({ name: e.target.value })}
                    placeholder="e.g. Clinic Appointment Assistant"
                    style={inputBase}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={fieldLabel}>Assistant role</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AGENT_TYPES.map(t => {
                      const isSelected = formData.type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => patch({ type: t.value })}
                          className="relative flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3.5 rounded-xl transition-all duration-150 cursor-pointer text-left"
                          style={
                            isSelected
                              ? { background: t.accentDim, border: `1.5px solid ${t.accent}`, color: t.accent }
                              : { background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                          }
                          onMouseEnter={e => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLElement).style.borderColor = t.accentBorder;
                              (e.currentTarget as HTMLElement).style.background = t.accentDim;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                              (e.currentTarget as HTMLElement).style.background = 'var(--s1)';
                            }
                          }}
                        >
                          {isSelected && (
                            <span
                              className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: t.accent }}
                            >
                              <svg width="8" height="8" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={
                              isSelected
                                ? { background: t.accent, color: '#fff' }
                                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                            }
                          >
                            {t.icon}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold">{t.label}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: isSelected ? t.accent : 'var(--text-muted)', opacity: 0.8 }}>
                              {t.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 2 — Voice & Language */}
            <SectionCard step={2} title="Voice & Language" subtitle="Audio persona and locale">
              {/* Language */}
              <div className="mb-4">
                <label style={fieldLabel}>Language</label>
                <SelectInput
                  value={formData.language}
                  onChange={v => patch({ language: v })}
                  options={
                    user?.features?.agents?.multiLanguage
                      ? LANGUAGE_OPTIONS
                      : LANGUAGE_OPTIONS.filter(o => o.value === 'en')
                  }
                />
                {!user?.features?.agents?.multiLanguage && (
                  <p style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>
                    Upgrade to Starter+ for multi-language support
                  </p>
                )}
              </div>

              {/* Voice Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label style={fieldLabel}>Voice model</label>
                  <VoicePreviewButton voiceId={formData.voiceId} language={formData.language} prompt={formData.prompt || undefined} />
                </div>

                <SelectInput
                  value={formData.voiceId}
                  onChange={v => patch({ voiceId: v })}
                  options={VAPI_VOICE_OPTIONS}
                />

                {/* Voice indicator */}
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ background: 'var(--primary-blue-soft)', border: '1px solid var(--primary-blue)' }}>
                  <div className="flex items-end gap-0.5 h-3">
                    {[4, 8, 5, 9, 4].map((h, i) => (
                      <div
                        key={i}
                        className="w-[2px] rounded-full animate-pulse"
                        style={{ background: 'var(--primary-blue)', height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--primary-blue)' }}>
                    {voiceName}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* 3 — Prompt */}
            <SectionCard step={3} title="Behavioral Guidelines" subtitle="Define how the agent thinks and responds">
              {/* Template chips */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Quick-fill:</span>
                {PROMPT_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => patch({ prompt: tpl.prompt })}
                    className="px-2.5 py-1 text-[10.5px] font-medium rounded-lg cursor-pointer transition-colors duration-150"
                    style={{ background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-blue)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--primary-blue)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--primary-blue-soft)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--s1)';
                    }}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <textarea
                value={formData.prompt}
                onChange={e => patch({ prompt: e.target.value })}
                placeholder="You are a professional assistant. Greet callers warmly, collect their name and phone number, and let them know the team will follow up within 24 hours..."
                rows={5}
                style={{ ...inputBase, resize: 'none', lineHeight: '1.6' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />

              <div className="flex items-center justify-between mt-2">
                <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  Describe tone, data capture goals, and conversation flow.
                </p>
                <span
                  className="text-[10.5px] font-medium"
                  style={{ color: formData.prompt.length > 400 ? '#d97706' : 'var(--text-muted)' }}
                >
                  {formData.prompt.length} chars
                </span>
              </div>
            </SectionCard>

            {/* 4 — Phone configuration */}
            <SectionCard step={4} title="Phone Configuration" subtitle="Assign phone number from 14+ providers (Optional)">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="phoneMode"
                      checked={phoneMode === 'saved'}
                      onChange={() => setPhoneMode('saved')}
                      className="text-[var(--primary-blue)] focus:ring-0 focus:ring-offset-0"
                    />
                    Saved Phone Numbers ({savedPhoneNumbers.length})
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="phoneMode"
                      checked={phoneMode === 'vapi'}
                      onChange={() => setPhoneMode('vapi')}
                      className="text-[var(--primary-blue)] focus:ring-0 focus:ring-offset-0"
                    />
                    Vapi Number
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="phoneMode"
                      checked={phoneMode === 'direct'}
                      onChange={() => setPhoneMode('direct')}
                      className="text-[var(--primary-blue)] focus:ring-0 focus:ring-offset-0"
                    />
                    Custom Direct Number
                  </label>
                </div>

                {phoneMode === 'saved' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label style={fieldLabel}>Select Saved Phone Number</label>
                      <Link
                        to="/dashboard/phone-numbers"
                        className="text-[10px] font-bold text-[var(--primary-blue)] hover:underline"
                      >
                        Manage Numbers ↗
                      </Link>
                    </div>
                    <div className="relative">
                      <select
                        value={formData.phoneNumberId}
                        onChange={e => patch({ phoneNumberId: e.target.value })}
                        style={inputBase}
                        className="appearance-none cursor-pointer focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10"
                      >
                        <option value="">— No phone number —</option>
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
                    {savedPhoneNumbers.length === 0 && !phoneLoading && (
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1.5">
                        No saved phone numbers found.{' '}
                        <Link to="/dashboard/phone-numbers" className="text-[var(--primary-blue)] font-bold hover:underline">
                          Add numbers from Exotel, Plivo, Twilio, Ozonetel, etc.
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                {phoneMode === 'vapi' && (
                  <div>
                    <label style={fieldLabel}>Select Vapi number</label>
                    <div className="relative">
                      <select
                        value={formData.phoneNumberId}
                        onChange={e => patch({ phoneNumberId: e.target.value })}
                        style={inputBase}
                        className="appearance-none cursor-pointer focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10"
                      >
                        <option value="">— No phone number —</option>
                        {phoneNumbers.map((pn) => (
                          <option key={pn.id} value={pn.id} disabled={!!pn.assistantId}>
                            {pn.number} ({pn.provider}){pn.assistantId ? ' — In Use' : ''}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                    {phoneNumbers.length === 0 && !phoneLoading && (
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1.5">
                        No phone numbers found in Vapi.
                      </p>
                    )}
                  </div>
                )}

                {phoneMode === 'direct' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ ...fieldLabel, marginBottom: 0 }}>Direct Phone Number</span>
                        <select
                          value={selectedProvider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--s1)] border border-[var(--border)] text-[var(--text)]"
                        >
                          <option value="twilio">Twilio</option>
                          <option value="exotel">Exotel</option>
                          <option value="plivo">Plivo</option>
                          <option value="ozonetel">Ozonetel</option>
                          <option value="mcube">MCUBE</option>
                          <option value="tatatele">Tata Tele</option>
                          <option value="maqsam">Maqsam</option>
                          <option value="vobiz">Vobiz</option>
                          <option value="voicelink">VoiceLink</option>
                          <option value="retell">Retell AI</option>
                          <option value="telnyx">Telnyx</option>
                          <option value="signalwire">SignalWire</option>
                          <option value="custom">Custom / SIP</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={formData.phoneNumberId}
                        onChange={e => patch({ phoneNumberId: e.target.value })}
                        placeholder="e.g. +919876543210 or +1845541210"
                        style={inputBase}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                    </div>
                    {selectedProvider === 'twilio' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label style={fieldLabel}>Twilio Account SID</label>
                          <input
                            type="text"
                            value={formData.twilioAccountSid}
                            onChange={e => patch({ twilioAccountSid: e.target.value })}
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            style={inputBase}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                          />
                        </div>
                        <div>
                          <label style={fieldLabel}>Twilio Auth Token</label>
                          <input
                            type="password"
                            value={formData.twilioAuthToken}
                            onChange={e => patch({ twilioAuthToken: e.target.value })}
                            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            style={inputBase}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  If left blank, the agent can only be tested using web chat.
                </p>
              </div>
            </SectionCard>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                type="button"
                onClick={() => navigate('/dashboard/ai-voice-agent')}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-[12.5px] font-medium cursor-pointer transition-colors duration-150 disabled:opacity-40 w-full sm:w-auto"
                style={{ background: 'var(--s1)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                Cancel
              </button>

              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !formData.name.trim()}
                whileHover={{ scale: submitting || !formData.name.trim() ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--gg)' }}
                onMouseEnter={e => { if (!submitting && formData.name.trim()) (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deploying…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Deploy agent
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* ── RIGHT ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14 }}
            className="xl:sticky xl:top-6 space-y-4"
          >

            {/* Live preview */}
            <PanelCard label="Live preview">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Updates as you type</span>
              </div>
              <div className="pointer-events-none select-none">
                <AgentCard agent={previewAgent} />
              </div>
            </PanelCard>

            {/* Technical specs */}
            <PanelCard label="Technical specs">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'LLM',     value: 'GPT-4o',     icon: '🧠' },
                  { label: 'TTS',     value: 'ElevenLabs', icon: '🔊' },
                  { label: 'Latency', value: '~650 ms',    icon: '⚡' },
                  { label: 'Voice',   value: voiceName,    icon: '🎙️' },
                ].map(spec => (
                  <div
                    key={spec.label}
                    className="p-3 rounded-xl"
                    style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px]">{spec.icon}</span>
                      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {spec.label}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>{spec.value}</p>
                  </div>
                ))}
              </div>
            </PanelCard>

            {/* Readiness */}
            <PanelCard label="Setup checklist">
              <div className="space-y-2.5 mb-4">
                {readinessItems.map(check => (
                  <div key={check.label} className="flex items-center gap-2.5">
                    <div
                      className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={
                        check.done
                          ? { background: 'var(--primary)', width: 18, height: 18 }
                          : { background: 'var(--s1)', border: '1px solid var(--border)', width: 18, height: 18 }
                      }
                    >
                      {check.done ? (
                        <svg width="9" height="9" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-1 h-1 rounded-full" style={{ background: 'var(--border)' }} />
                      )}
                    </div>
                    <span
                      className="text-[11.5px]"
                      style={{ color: check.done ? 'var(--text)' : 'var(--text-muted)' }}
                    >
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Completion</span>
                  <span className="text-[10px] font-semibold gradient-text">{readinessPct}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--s1)', border: '1px solid var(--border)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--gg)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${readinessPct}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </PanelCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}