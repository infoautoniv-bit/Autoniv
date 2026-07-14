import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch } from '../../hooks/useStore';
import { createUser, fetchAllUsers } from '../../store/slices/usersSlice';
import { useNavigate } from 'react-router-dom';

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

const CHAT_PLAN_OPTIONS = [
  { value: 'chat_free', label: 'Chat Free (100 chats · ₹0)' },
  { value: 'chat_starter', label: 'Chat Starter (1,000 chats · ₹3,499)' },
  { value: 'chat_growth', label: 'Chat Growth (5,000 chats · ₹9,999)' },
  { value: 'chat_enterprise', label: 'Chat Enterprise (Unlimited chats)' },
  { value: 'none', label: 'None (Disabled)' },
];

const VOICE_PLAN_OPTIONS = [
  { value: 'voice_free', label: 'Voice Trial (30 calls · ₹4,999)' },
  { value: 'voice_starter', label: 'Voice Foundation (120 calls · ₹14,999)' },
  { value: 'voice_growth', label: 'Voice Scale (400 calls · ₹29,999)' },
  { value: 'voice_enterprise', label: 'Voice Dominate (1,200 calls · ₹74,999)' },
  { value: 'none', label: 'None (Disabled)' },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>{children}</p>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 text-sm rounded-xl transition-all"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-sm rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <span className="truncate">{selected?.label}</span>
        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="max-h-48 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{
                  background: opt.value === value ? 'var(--primary-soft)' : 'transparent',
                  color: opt.value === value ? 'var(--primary)' : 'var(--text-secondary)',
                }}
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

export function CreateUser() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    chatPlan: 'chat_free',
    voicePlan: 'none',
    phoneNumber: '',
    chatEnabled: true,
    voiceEnabled: false,
  });

  const handleChatPlanChange = (selectedPlan: string) => {
    setFormData((prev) => ({
      ...prev,
      chatPlan: selectedPlan,
      chatEnabled: selectedPlan !== 'none',
    }));
  };

  const handleVoicePlanChange = (selectedPlan: string) => {
    setFormData((prev) => ({
      ...prev,
      voicePlan: selectedPlan,
      voiceEnabled: selectedPlan !== 'none',
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !formData.name.trim() || !formData.email.trim() || !formData.password) return;
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(createUser(formData)).unwrap();
      await dispatch(fetchAllUsers({ page: 1, limit: 20 }));
      navigate('/admin/users');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Something went wrong.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, dispatch, formData, navigate]);

  const isValid = formData.name.trim() && formData.email.trim() && formData.password;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-1.5 text-sm transition-colors mb-4"
          style={{ color: 'var(--muted)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Users
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Add New User</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Create a new user account with an initial plan and minutes allocation.</p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[var(--surface)] p-6 space-y-6"
        style={{ border: '1px solid var(--border)' }}
      >
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--danger)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        <div>
          <FieldLabel>Name</FieldLabel>
          <TextInput value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="John Doe" />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} placeholder="john@company.com" type="email" />
        </div>

        <div>
          <FieldLabel>Phone number</FieldLabel>
          <TextInput value={formData.phoneNumber} onChange={(v) => setFormData({ ...formData, phoneNumber: v })} placeholder="+1 (555) 123-4567" />
        </div>

        <div>
          <FieldLabel>Company</FieldLabel>
          <TextInput value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} placeholder="Company Name" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Chat Plan</FieldLabel>
            <SelectInput
              value={formData.chatPlan}
              onChange={handleChatPlanChange}
              options={CHAT_PLAN_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel>Voice Plan</FieldLabel>
            <SelectInput
              value={formData.voicePlan}
              onChange={handleVoicePlanChange}
              options={VOICE_PLAN_OPTIONS}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <TextInput value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} placeholder="Password" type="password" />
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="mt-4 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !isValid}
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--gg)' }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Create User
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
