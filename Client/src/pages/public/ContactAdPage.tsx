import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetaRobots, PRIVATE_ROBOTS } from '../../components/MetaRobots';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from './Footer';
import { USPSlider } from './sections/USPSlider';
import { contactService } from '../../services/api';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  primaryGoal: string;
  teamSize: string;
  budget: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

const GOALS = [
  {
    id: 'voice_agent',
    title: 'AI Voice Agents',
    desc: 'Inbound & outbound 24/7 call automation',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: 'chatbot',
    title: 'AI Chatbots & WhatsApp',
    desc: 'Website & WhatsApp sales lead capture',
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'receptionist',
    title: 'Phone Receptionist',
    desc: '24/7 Front-desk call answering & transfer',
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: 'custom_ai',
    title: 'Enterprise Custom AI',
    desc: 'Bespoke LLM & CRM voice workflow integrations',
    icon: (
      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const TEAM_SIZES = ['1 - 10', '11 - 50', '51 - 200', '200+ employees'];
const BUDGET_RANGES = ['< ₹25k / $300 mo', '₹25k - ₹75k mo', '₹75k - ₹2L mo', 'Enterprise Custom'];

export function ContactAdPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    primaryGoal: 'voice_agent',
    teamSize: '1 - 10',
    budget: '₹25k - ₹75k mo',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [serverError, setServerError] = useState('');

  const validateStep1 = () => {
    const errs: FormErrors = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Business email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@company.com)';
    }
    if (formData.phone && !/^[0-9+\s-()]{7,17}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const selectedGoalObj = GOALS.find((g) => g.id === formData.primaryGoal);
      const compositeMessage = `[Primary Goal: ${selectedGoalObj?.title || formData.primaryGoal}] [Team Size: ${formData.teamSize}] [Budget: ${formData.budget}]\n${formData.message.trim() || 'No notes specified.'}`;

      const res = await contactService.submit({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        message: compositeMessage,
      });

      const generatedRef = res.data.contactId
        ? `ATN-${res.data.contactId.slice(-6).toUpperCase()}`
        : `ATN-${Math.floor(100000 + Math.random() * 900000)}`;

      setRefId(generatedRef);
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to submit request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      primaryGoal: 'voice_agent',
      teamSize: '1 - 10',
      budget: '₹25k - ₹75k mo',
      message: '',
    });
    setErrors({});
    setStep(1);
    setSubmitted(false);
    setRefId('');
  };

  const progressPercent = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#2563EB] selection:text-white pt-[36px] relative"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* STRICT NOINDEX META TAG FOR ADS LANDING PAGE */}
      <MetaRobots content={PRIVATE_ROBOTS} />

      <USPSlider />
      <PublicNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-20 lg:py-30 relative z-20">
        
        {/* Top Campaign Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            Ad Campaign Priority Desk
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Automate Sales & Support With <span className="bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent">Autonomous AI Agents</span>
          </h1>
          
          <p className="mt-4 text-base sm:text-lg text-[#64748B] leading-relaxed">
            Deploy 24/7 intelligent AI Voice & Chat Assistants to handle calls, qualify leads, schedule appointments, and resolve customer inquiries in 20+ languages.
          </p>
        </div>

        {/* Main Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Specs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stats Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-5">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Why Enterprise Teams Choose Autoniv</h3>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent block">99.8%</span>
                  <span className="text-xs font-bold text-[#0F172A] mt-1 block">Uptime SLA</span>
                  <span className="text-[10px] text-[#94A3B8]">Carrier-grade stack</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent block">&lt; 200ms</span>
                  <span className="text-xs font-bold text-[#0F172A] mt-1 block">Voice Latency</span>
                  <span className="text-[10px] text-[#94A3B8]">Human conversational</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent block">20+</span>
                  <span className="text-xs font-bold text-[#0F172A] mt-1 block">Languages</span>
                  <span className="text-[10px] text-[#94A3B8]">Global & regional accents</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-2xl font-black bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent block">70%</span>
                  <span className="text-xs font-bold text-[#0F172A] mt-1 block">Cost Reduction</span>
                  <span className="text-[10px] text-[#94A3B8]">Lower overhead cost</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">What You Get</h3>
              
              <div className="space-y-3.5 text-xs sm:text-sm text-[#64748B]">
                {[
                  'Instant 1-Line Embed Script & CRM Sync (HubSpot, Salesforce, Zoho, Custom Webhooks)',
                  'Human-Like AI Voice Agents in 20+ Languages with < 200ms Latency',
                  'Flexible Monthly Plans — No Lock-in Contracts with Risk-Free Trial',
                  'Enterprise-Grade HMAC SHA-256 Signature Security & End-to-End Encryption',
                  'Dedicated Technical Solutions Manager & 24/7 Priority Onboarding Support',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#10B981] flex-shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <span className="font-medium text-[#334155] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-teal-500 to-[#10B981]" />

              {!submitted ? (
                <div>
                  {/* Step Tracker */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
                      <span className="font-semibold text-[#0F172A]">
                        Step <strong className="text-[#2563EB] font-extrabold">{step}</strong> of 3
                      </span>
                      <span className="text-xs text-[#94A3B8]">Est. time: 30 secs</span>
                    </div>

                    {/* Progress Fill */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] rounded-full"
                        initial={{ width: '33%' }}
                        animate={{ width: progressPercent }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      />
                    </div>

                    {/* Step Pills */}
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] pt-1">
                      <span className={`flex items-center gap-1.5 py-1 ${step === 1 ? 'text-[#2563EB] font-extrabold' : 'text-[#64748B]'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                        1. Contact Info
                      </span>
                      <span className={`flex items-center gap-1.5 py-1 ${step === 2 ? 'text-[#2563EB] font-extrabold' : 'text-[#64748B]'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                        2. AI Goal
                      </span>
                      <span className={`flex items-center gap-1.5 py-1 ${step === 3 ? 'text-[#2563EB] font-extrabold' : 'text-[#64748B]'}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                        3. Requirements
                      </span>
                    </div>
                  </div>

                  {serverError && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                      {serverError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    <AnimatePresence mode="wait">
                      {/* STEP 1 */}
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-5"
                        >
                          <div>
                            <h2 className="text-xl font-extrabold text-[#0F172A]">Let's start with your contact details</h2>
                            <p className="text-xs text-[#64748B] mt-1">Fill in your contact info to continue to solution selection.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                              Full Name <span className="text-[#2563EB]">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Alex Morgan"
                              value={formData.fullName}
                              onChange={(e) => {
                                setFormData({ ...formData, fullName: e.target.value });
                                if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                              }}
                              className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all outline-none ${
                                errors.fullName
                                  ? 'border-red-400 bg-red-50/40 text-[#0F172A] ring-2 ring-red-200'
                                  : 'border-slate-200 bg-slate-50/50 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                              }`}
                            />
                            {errors.fullName && <p className="text-xs text-red-600 mt-1.5 font-mono font-semibold">⚠️ {errors.fullName}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                              Business Email <span className="text-[#2563EB]">*</span>
                            </label>
                            <input
                              type="email"
                              placeholder="alex@company.com"
                              value={formData.email}
                              onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: undefined });
                              }}
                              className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all outline-none ${
                                errors.email
                                  ? 'border-red-400 bg-red-50/40 text-[#0F172A] ring-2 ring-red-200'
                                  : 'border-slate-200 bg-slate-50/50 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                              }`}
                            />
                            {errors.email && <p className="text-xs text-red-600 mt-1.5 font-mono font-semibold">⚠️ {errors.email}</p>}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Phone Number <span className="text-[#94A3B8] font-normal lowercase">(optional)</span>
                              </label>
                              <input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={(e) => {
                                  setFormData({ ...formData, phone: e.target.value });
                                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                className={`w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all ${
                                  errors.phone
                                    ? 'border-red-400 bg-red-50/40 text-[#0F172A]'
                                    : 'border-slate-200 bg-slate-50/50 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              />
                              {errors.phone && <p className="text-xs text-red-600 mt-1 font-mono font-semibold">⚠️ {errors.phone}</p>}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Company Name <span className="text-[#94A3B8] font-normal lowercase">(optional)</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Acme Inc."
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2 */}
                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-xl font-extrabold text-[#0F172A]">AI Solution Goal</h2>
                            <p className="text-xs text-[#64748B] mt-1">Select what solution best fits your business requirement.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {GOALS.map((goal) => {
                              const isSelected = formData.primaryGoal === goal.id;
                              return (
                                <button
                                  key={goal.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, primaryGoal: goal.id })}
                                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#2563EB] bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100'}`}>
                                      {goal.icon}
                                    </div>
                                    <span className="font-extrabold text-sm text-[#0F172A]">{goal.title}</span>
                                  </div>
                                  <p className="text-xs text-[#64748B] leading-snug">{goal.desc}</p>
                                </button>
                              );
                            })}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">Team Scale</label>
                            <div className="flex flex-wrap gap-2">
                              {TEAM_SIZES.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, teamSize: size })}
                                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    formData.teamSize === size
                                      ? 'bg-gradient-to-r from-[#2563EB] to-teal-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">Target Budget</label>
                            <div className="flex flex-wrap gap-2">
                              {BUDGET_RANGES.map((b) => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, budget: b })}
                                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    formData.budget === b
                                      ? 'bg-gradient-to-r from-[#10B981] to-teal-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                                  }`}
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3 */}
                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-5"
                        >
                          <div>
                            <h2 className="text-xl font-extrabold text-[#0F172A]">Project Requirements</h2>
                            <p className="text-xs text-[#64748B] mt-1">Briefly share your use-case or specific questions.</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center text-[#64748B]">
                            <span>Goal: <strong className="text-[#0F172A]">{GOALS.find(g => g.id === formData.primaryGoal)?.title}</strong></span>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="text-[#2563EB] font-bold underline text-[11px]"
                            >
                              Edit
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                              Message / Requirements <span className="text-[#94A3B8] font-normal lowercase">(optional)</span>
                            </label>
                            <textarea
                              rows={4}
                              placeholder="e.g. We get around 50 inbound calls daily for appointment bookings. We want an AI Voice Agent to answer calls, handle FAQs, and sync bookings..."
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Nav Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-4">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={submitting}
                          className="px-6 py-3 rounded-xl border border-slate-200 text-[#64748B] text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                        >
                          ← Back
                        </button>
                      ) : <div />}

                      {step < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="ml-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs font-extrabold hover:brightness-105 active:scale-98 transition-all shadow-md shadow-blue-500/20 cursor-pointer relative z-30"
                        >
                          Continue →
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm font-extrabold hover:brightness-105 active:scale-98 transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 relative z-30"
                        >
                          {submitting ? 'Submitting Request...' : 'Submit Request & Get Free Consultation'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                /* SUCCESS STATE */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-[#10B981] shadow-md">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div>
                    <span className="text-xs font-mono font-bold tracking-widest text-[#2563EB] uppercase block mb-1">
                      Reference #{refId}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                      Thank You, {formData.fullName}!
                    </h2>
                    <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
                      Your priority request has been received. Our AI Strategy Specialist will review your details and reach out at <strong className="text-[#0F172A]">{formData.email}</strong> within 24 hours.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      onClick={resetForm}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 text-[#64748B] text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      Submit Another Inquiry
                    </button>
                    <a
                      href="/"
                      className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md cursor-pointer w-full sm:w-auto inline-block text-center"
                    >
                      Explore Autoniv Platform →
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactAdPage;
