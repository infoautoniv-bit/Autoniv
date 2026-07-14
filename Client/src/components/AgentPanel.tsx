import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoicePreviewButton } from './VoicePreviewButton';
import { VOICE_OPTIONS } from '../config/voices';
import { agentService } from '../services/api';
import type { Agent } from '../types';

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

const VOICE_TONE_SUFFIX = `

### Voice & Tone
- Helpful advisor, not salesy telecaller
- Speak like a real person on a phone call
- Warm but professional

### NEVER Say
- "Thank you for asking" / "That's a great question"
- "Certainly" / "Indeed" / "Kindly" / "I acknowledge"
- "Perfect!" / "Excellent!" / "Wonderful!" after every response

### Natural Conversation
- Use fillers sparingly: "Actually...", "Look...", "So basically..."
- Acknowledge before answering: "Okay..." / "Right..." / "Got it..."
- Keep responses short and conversational
- Mirror user's energy — if brief, be brief

### TTS Formatting
- ₹5000 → "five thousand rupees"
- 15% → "fifteen percent"
- Jan 25 → "twenty-five January"
- 9876543210 → "nine eight seven six..." (with pauses)

### Security
NEVER ask: OTP, CVV, PIN, Aadhaar, PAN, passwords, full card numbers`;

const PROMPT_TEMPLATES = [
  { id: 'dentist',     label: '🦷 Dental Clinic', prompt: `You are a friendly scheduling assistant for Smile Dental. Greet patients warmly, check for preferred times (mornings/afternoons), collect full name, phone number, and brief reason for the visit (cleaning, checkup, pain). State that a receptionist will text confirmation.${VOICE_TONE_SUFFIX}` },
  { id: 'realestate',  label: '🏢 Real Estate',   prompt: `You are an intake assistant for Elite Realtors. Greet callers, ask if they want to buy, sell, or rent. Collect their budget range, neighborhood preference, name, and email.${VOICE_TONE_SUFFIX}` },
  { id: 'receptionist',label: '💼 Receptionist',  prompt: `You are a professional office receptionist. Greet caller, ask for their name and business details, collect contact number, and inform them that we will route their message.${VOICE_TONE_SUFFIX}` },
  { id: 'support',     label: '💬 Helpdesk',       prompt: `You are a technical support helper. Greet callers, ask for their name and account email, gather a description of their issue, and let them know a support specialist will email them a solution shortly.${VOICE_TONE_SUFFIX}` },
  { id: 'healthcare',  label: '🏥 Healthcare',    prompt: `You are a patient intake assistant for a healthcare clinic. Greet patients warmly, ask about their reason for visit (consultation, follow-up, specific symptoms), collect full name, phone number, and preferred appointment time. Reassure them the doctor's office will confirm.${VOICE_TONE_SUFFIX}` },
  { id: 'restaurant',  label: '🍽️ Restaurant',    prompt: `You are a reservation assistant for a restaurant. Greet callers, ask for party size, preferred date and time, and any special requests (outdoor seating, high chair, dietary needs). Collect name and phone number. Confirm the reservation details back.${VOICE_TONE_SUFFIX}` },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">{children}</p>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all"
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
        className="w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] flex items-center justify-between gap-2 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all cursor-pointer"
      >
        <span className="truncate">{selected?.label}</span>
        <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-slate-200/50 overflow-hidden">
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
        </div>
      )}
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
      className="w-full px-4 py-3 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all resize-none"
    />
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
  };
  setFormData: (d: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  onAssignPhone?: (phoneNumberId: string, phoneNumber?: string, twilioAccountSid?: string, twilioAuthToken?: string) => Promise<void>;
  onUnlinkPhone?: () => Promise<void>;
}

export function AgentPanel({
  open, onClose, editing, formData, setFormData, onSubmit, submitting,
  onAssignPhone, onUnlinkPhone,
}: AgentPanelProps) {
  const filteredVoices = VOICE_OPTIONS;

  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);

  const [isDirectPhone, setIsDirectPhone] = useState(false);
  const [directPhoneNum, setDirectPhoneNum] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');

  const fetchPhoneNumbers = useCallback(async () => {
    setPhoneLoading(true);
    try {
      const res = await agentService.getPhoneNumbers();
      setPhoneNumbers(res.data.phoneNumbers || []);
    } catch (err) {
      console.error('Failed to fetch phone numbers:', err);
    } finally {
      setPhoneLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && editing && onAssignPhone) {
      fetchPhoneNumbers();
      if (editing.phoneNumber && !editing.phoneNumberId) {
        setIsDirectPhone(true);
        setDirectPhoneNum(editing.phoneNumber || '');
        setTwilioSid(editing.twilioAccountSid || '');
        setTwilioToken(editing.twilioAuthToken || '');
      } else {
        setIsDirectPhone(false);
        setDirectPhoneNum('');
        setTwilioSid('');
        setTwilioToken('');
      }
      setSelectedPhoneId(editing.phoneNumberId || '');
    }
  }, [open, editing, fetchPhoneNumbers, onAssignPhone]);

  useEffect(() => {
    if (!filteredVoices.some(v => v.value === formData.voiceId)) {
      setFormData((prev: any) => ({ ...prev, voiceId: filteredVoices[0]?.value || '' }));
    }
  }, [formData.language]);

  useEffect(() => {
    if (formData.useCustomEngine) {
      setIsDirectPhone(true);
    }
  }, [formData.useCustomEngine]);

  const handleAssignPhone = async () => {
    if (!onAssignPhone) return;
    setPhoneSaving(true);
    try {
      if (isDirectPhone) {
        if (!directPhoneNum.trim()) return;
        await onAssignPhone(directPhoneNum.trim(), directPhoneNum.trim(), twilioSid.trim(), twilioToken.trim());
      } else {
        if (!selectedPhoneId) return;
        const selectedNumber = phoneNumbers.find(p => p.id === selectedPhoneId);
        await onAssignPhone(selectedPhoneId, selectedNumber?.number);
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl shadow-slate-200/50"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)] mb-0.5">
                  {editing ? 'Edit' : 'New'}
                </p>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  {editing ? editing.name : 'Create agent'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--s1)] transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Hint */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--primary-blue-soft)] border border-[var(--border)]">
                <svg className="w-3.5 h-3.5 text-[var(--primary-blue)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-xs text-[var(--primary-blue)]/80 leading-relaxed">
                  Configure your agent's identity, voice, and behavior. You can update these settings at any time.
                </p>
              </div>

              {/* Agent name */}
              <div>
                <FieldLabel>Agent name</FieldLabel>
                <TextInput
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  placeholder="e.g. Front Desk Assistant"
                />
              </div>

              {/* Agent type */}
              <div>
                <FieldLabel>Type</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {AGENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.value })}
                      className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        formData.type === t.value
                          ? 'bg-[var(--primary-blue-soft)] border-[var(--primary-blue)] text-[var(--primary-blue)] font-semibold'
                          : 'bg-[var(--s1)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className={formData.type === t.value ? 'text-[var(--primary-blue)]' : 'text-[var(--text-muted)]'}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language + Voice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Language</FieldLabel>
                  <SelectInput
                    value={formData.language}
                    onChange={(v) => setFormData({ ...formData, language: v })}
                    options={LANGUAGE_OPTIONS}
                  />
                </div>
                <div>
                  <FieldLabel>Voice</FieldLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <SelectInput
                        value={formData.voiceId}
                        onChange={(v) => setFormData({ ...formData, voiceId: v })}
                        options={filteredVoices}
                      />
                    </div>
                    <VoicePreviewButton
                      voiceId={formData.voiceId}
                      language={formData.language}
                      prompt={formData.prompt || undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <FieldLabel>System prompt</FieldLabel>
                {/* Template chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Quick-fill:</span>
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
                  rows={6}
                />
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                  Describe how your agent should behave, its tone, and what information to collect.
                </p>
              </div>

              {/* Phone Number Assignment (admin only, edit mode) */}
              {editing && onAssignPhone && (
                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <FieldLabel>Phone Number</FieldLabel>
                  </div>

                  {phoneLoading ? (
                    <div className="flex items-center gap-2 py-3">
                      <svg className="animate-spin w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <span className="text-xs text-[var(--text-muted)]">Loading phone numbers…</span>
                    </div>
                  ) : (
                    <>
                      {/* Current linked status */}
                      {(editing.phoneNumberId || editing.phoneNumber) && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--primary-blue-soft)] border border-[var(--border)]">
                            <div className="w-7 h-7 rounded-lg bg-[var(--primary-blue)]/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-[var(--primary-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L17 7"/></svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary-blue)]/60">Currently linked</p>
                              <p className="text-xs font-semibold text-[var(--primary-blue)] truncate">{editing.phoneNumber || editing.phoneNumberId}</p>
                            </div>
                            {onUnlinkPhone && (
                              <button
                                type="button"
                                onClick={handleUnlinkPhone}
                                disabled={phoneSaving}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                Unlink
                              </button>
                            )}
                          </div>

                          {/* Compatibility Warning for Custom Engine + Vapi Number */}
                          {formData.useCustomEngine && editing.phoneNumberId && (
                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs leading-relaxed flex gap-2">
                              <span className="text-base flex-shrink-0">⚠️</span>
                              <div>
                                <strong>Compatibility Warning:</strong> This custom agent is currently linked to a Vapi Phone Number. Vapi numbers only work when custom engine is disabled. Please unlink it above and assign a Custom Twilio Number.
                              </div>
                            </div>
                          )}

                          {/* Compatibility Warning for Vapi Agent + Custom Twilio Number */}
                          {!formData.useCustomEngine && editing.phoneNumber && !editing.phoneNumberId && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs leading-relaxed flex gap-2">
                              <span className="text-base flex-shrink-0">⚠️</span>
                              <div>
                                <strong>Compatibility Warning:</strong> This agent is configured to run on Vapi, but is linked to a Custom Twilio Number. Vapi agents require a Vapi Number. Please unlink it below and link a Vapi Number.
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection mode toggle */}
                      {!formData.useCustomEngine ? (
                        <div className="flex items-center gap-4 py-1">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                            <input
                              type="radio"
                              name="phoneMode"
                              checked={!isDirectPhone}
                              onChange={() => setIsDirectPhone(false)}
                              className="text-[var(--primary-blue)] focus:ring-0 focus:ring-offset-0"
                            />
                            Vapi Number
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                            <input
                              type="radio"
                              name="phoneMode"
                              checked={isDirectPhone}
                              onChange={() => setIsDirectPhone(true)}
                              className="text-[var(--primary-blue)] focus:ring-0 focus:ring-offset-0"
                            />
                            Custom Twilio Number
                          </label>
                        </div>
                      ) : (
                        <div className="py-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            ⚡ Forced Custom Twilio Mode (Custom LLM Engine)
                          </span>
                        </div>
                      )}

                      {!isDirectPhone ? (
                        <>
                          {/* Phone selector */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">
                              {editing.phoneNumberId ? 'Change to' : 'Select number'}
                            </p>
                            <div className="relative">
                              <select
                                value={selectedPhoneId}
                                onChange={(e) => setSelectedPhoneId(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all"
                              >
                                <option value="">— No phone number —</option>
                                {phoneNumbers.map((pn) => (
                                  <option key={pn.id} value={pn.id} disabled={!!pn.assistantId && pn.assistantId !== editing.vapiId}>
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
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]/70">Twilio Phone Number</span>
                              <a
                                href="https://console.twilio.com/us1/develop/phone-numbers/manage/search"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150"
                                style={{
                                  background: 'rgba(37,99,235,0.08)',
                                  border: '1px solid rgba(37,99,235,0.2)',
                                  color: 'var(--primary-blue)',
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(37,99,235,0.14)';
                                  e.currentTarget.style.borderColor = 'var(--primary-blue)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(37,99,235,0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)';
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                Buy Number ↗
                              </a>
                            </div>
                            <input
                              type="text"
                              value={directPhoneNum}
                              onChange={(e) => setDirectPhoneNum(e.target.value)}
                              placeholder="e.g. +1845541210"
                              className="w-full px-4 py-2 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all font-semibold"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">Twilio Account SID</p>
                            <input
                              type="text"
                              value={twilioSid}
                              onChange={(e) => setTwilioSid(e.target.value)}
                              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-4 py-2 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all font-mono font-medium"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/70 mb-1.5">Twilio Auth Token</p>
                            <input
                              type="password"
                              value={twilioToken}
                              onChange={(e) => setTwilioToken(e.target.value)}
                              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              className="w-full px-4 py-2 text-sm bg-[var(--s1)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Assign button */}
                      {((!isDirectPhone && selectedPhoneId && selectedPhoneId !== (editing.phoneNumberId || '')) ||
                        (isDirectPhone && directPhoneNum.trim() && (directPhoneNum.trim() !== (editing.phoneNumber || '') || twilioSid.trim() !== (editing.twilioAccountSid || '') || twilioToken.trim() !== (editing.twilioAuthToken || '')))) && (
                        <button
                          type="button"
                          onClick={handleAssignPhone}
                          disabled={phoneSaving || (isDirectPhone && !directPhoneNum.trim())}
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
                          {isDirectPhone ? 'Save Phone & Credentials' : 'Assign Phone Number'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Custom Engine Toggle */}
              <div className="pt-4 border-t border-[var(--border)] space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.useCustomEngine || false}
                    onChange={(e) => setFormData({ ...formData, useCustomEngine: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] bg-[var(--s1)] text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20 focus:ring-offset-0 focus:outline-none"
                  />
                  <span className="text-sm font-medium text-[var(--text)]">Use Custom Telephony Engine</span>
                </label>
                <p className="mt-1 text-[11px] text-[var(--text-muted)] ml-7 leading-relaxed">
                  Run this agent on your own local server / LLM API key rather than Vapi.
                </p>

                {/* Engine Selection */}
                {formData.useCustomEngine && (
                  <div className="ml-7 space-y-2">
                    <FieldLabel>LLM Engine</FieldLabel>
                    <SelectInput
                      value={formData.customEngineModel || 'groq:llama-3.3-70b'}
                      onChange={(v) => setFormData({ ...formData, customEngineModel: v })}
                      options={ENGINE_OPTIONS}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] flex items-center gap-3">
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
                ) : (editing ? 'Save changes' : 'Create agent')}
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
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50"
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