import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface OnboardingData {
  referralSource: string;
  roleType: string;
  goals: string[];
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome to Autoniv' },
  { id: 'referral', title: 'How did you find us?' },
  { id: 'role', title: 'What best describes you?' },
  { id: 'goals', title: "What's the goals you want to achieve?" },
  { id: 'company', title: 'Tell us about your company' },
];

const REFERRAL_OPTIONS = [
  { id: 'search', label: 'Search Engines', sub: 'Google, Bing, etc.', icon: '🔍' },
  { id: 'social', label: 'Social Media', sub: 'YouTube, Instagram, etc.', icon: '📱' },
  { id: 'business', label: 'Business Communities', sub: 'LinkedIn, etc.', icon: '💼' },
  { id: 'dev', label: 'Developer Communities', sub: 'GitHub, etc.', icon: '👨‍💻' },
  { id: 'discord', label: 'Discord & Casual', sub: 'Discord communities', icon: '💬' },
  { id: 'other', label: 'Other', sub: 'Friend, blog, etc.', icon: '🌐' },
];

const ROLE_OPTIONS = [
  { id: 'builder', label: 'Building agents for myself', sub: 'I want to build and deploy AI agents for my own business', icon: '🛠️' },
  { id: 'agency', label: 'Agency / Reseller', sub: 'I want to white-label and resell AI agents to clients under my brand', icon: '🏢' },
];

const GOAL_OPTIONS = [
  { id: 'automate', label: 'Automate customer support & lead nurturing', icon: '🤖' },
  { id: 'agency_sell', label: 'Start AI Agency, Sell AI Chat/Voice Agents', icon: '💰' },
  { id: 'explore', label: 'Explore AI software & solutions', icon: '🧪' },
  { id: 'other', label: 'Other', icon: '📋' },
];

export default function WelcomeOnboarding({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    referralSource: '',
    roleType: '',
    goals: [],
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
  });

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return data.referralSource !== '';
    if (step === 2) return data.roleType !== '';
    if (step === 3) return data.goals.length > 0;
    if (step === 4) return data.companyName.trim() !== '';
    return false;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
      navigate('/dashboard', { replace: true });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const toggleGoal = (goalId: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 50%, #f0fdfa 100%)' }}>
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--surface)] rounded-2xl border shadow-xl p-8 sm:p-10"
            style={{ borderColor: 'rgba(16,185,129,0.15)' }}
          >
            {/* Step counter */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#10b981' }}>
                Step {step + 1} of {STEPS.length}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>
              {current.title}
            </h1>

            {/* Subtitle */}
            {step === 0 && (
              <p className="text-sm mb-6" style={{ color: '#475569' }}>
                We'll personalize your experience and help you get started.
              </p>
            )}
            {step === 1 && (
              <p className="text-sm mb-6" style={{ color: '#475569' }}>
                Select one option to continue.
              </p>
            )}
            {step === 2 && (
              <p className="text-sm mb-6" style={{ color: '#475569' }}>
                Choose the option that best fits your needs.
              </p>
            )}
            {step === 3 && (
              <p className="text-sm mb-6" style={{ color: '#475569' }}>
                We want to learn about your goals and what you expect from Autoniv.
              </p>
            )}
            {step === 4 && (
              <p className="text-sm mb-6" style={{ color: '#475569' }}>
                Help us understand your business and we'll create an AI agent for you.
              </p>
            )}

            {/* Step content */}
            <div className="min-h-[280px]">
              {/* Welcome */}
              {step === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                   <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Welcome to Autoniv</h2>
                  <p className="text-sm mt-1" style={{ color: '#475569' }}>Your AI-powered voice & chat agent platform</p>
                </div>
              )}

              {/* Referral Source */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {REFERRAL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setData({ ...data, referralSource: opt.id })}
                      className="p-4 rounded-xl border text-left transition-all"
                      style={{
                        background: data.referralSource === opt.id ? 'rgba(16,185,129,0.08)' : '#f8fafc',
                        borderColor: data.referralSource === opt.id ? '#10b981' : 'rgba(16,185,129,0.15)',
                        boxShadow: data.referralSource === opt.id ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
                      }}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <p className="text-sm font-semibold mt-2" style={{ color: '#0f172a' }}>{opt.label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Role Type */}
              {step === 2 && (
                <div className="space-y-3">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setData({ ...data, roleType: opt.id })}
                      className="w-full p-5 rounded-xl border text-left transition-all flex items-start gap-4"
                      style={{
                        background: data.roleType === opt.id ? 'rgba(16,185,129,0.08)' : '#f8fafc',
                        borderColor: data.roleType === opt.id ? '#10b981' : 'rgba(16,185,129,0.15)',
                        boxShadow: data.roleType === opt.id ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
                      }}
                    >
                      <span className="text-2xl mt-1">{opt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{opt.label}</p>
                        <p className="text-[12px] mt-1" style={{ color: '#64748b' }}>{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Goals */}
              {step === 3 && (
                <div className="space-y-3">
                  {GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => toggleGoal(opt.id)}
                      className="w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4"
                      style={{
                        background: data.goals.includes(opt.id) ? 'rgba(16,185,129,0.08)' : '#f8fafc',
                        borderColor: data.goals.includes(opt.id) ? '#10b981' : 'rgba(16,185,129,0.15)',
                        boxShadow: data.goals.includes(opt.id) ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
                      }}
                    >
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: data.goals.includes(opt.id) ? '#10b981' : '#cbd5e1', background: data.goals.includes(opt.id) ? '#10b981' : 'transparent' }}>
                        {data.goals.includes(opt.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-lg">{opt.icon}</span>
                      <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Company Info */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Company Name *</label>
                    <input
                      type="text"
                      value={data.companyName}
                      onChange={e => setData({ ...data, companyName: e.target.value })}
                      placeholder="Enter your company name"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#f8fafc', border: '1px solid rgba(16,185,129,0.2)', color: '#0f172a' }}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = 'rgba(16,185,129,0.2)'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Company Website</label>
                    <input
                      type="url"
                      value={data.companyWebsite}
                      onChange={e => setData({ ...data, companyWebsite: e.target.value })}
                      placeholder="https://yourcompany.com"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#f8fafc', border: '1px solid rgba(16,185,129,0.2)', color: '#0f172a' }}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = 'rgba(16,185,129,0.2)'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>What does your company do?</label>
                    <textarea
                      value={data.companyDescription}
                      onChange={e => setData({ ...data, companyDescription: e.target.value })}
                      placeholder="Briefly describe your company's main business, products, or services..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                      style={{ background: '#f8fafc', border: '1px solid rgba(16,185,129,0.2)', color: '#0f172a' }}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = 'rgba(16,185,129,0.2)'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              {step > 0 ? (
                <button
                  onClick={handleBack}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                  style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >
                  ← Back
                </button>
              ) : (
                <button
                  onClick={() => { onComplete(); navigate('/dashboard', { replace: true }); }}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                  style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canProceed() ? 'linear-gradient(135deg, #10b981, #06b6d4)' : '#e2e8f0',
                  color: canProceed() ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  cursor: canProceed() ? 'pointer' : 'not-allowed',
                  boxShadow: canProceed() ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                }}
              >
                {step === STEPS.length - 1 ? 'Get Started →' : 'Continue →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
