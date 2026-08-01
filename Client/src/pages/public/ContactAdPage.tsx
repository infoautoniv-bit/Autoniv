import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MetaRobots, PRIVATE_ROBOTS } from '../../components/MetaRobots';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from './Footer';
import { USPSlider } from './sections/USPSlider';
import { contactService } from '../../services/api';


interface FormData {
  // Step 1: Contact
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  
  // Step 2: Business
  industry: string;
  companySize: string;

  // Step 3: Needs
  needs: string[];
  callVolume: string;
  challenge: string;

  // Step 4: Preferences
  contactMethod: string;
  preferredTime: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  contactMethod?: string;
}

const INDUSTRIES = [
  'Healthcare',
  'Real Estate',
  'Finance',
  'Education',
  'E-commerce',
  'Automotive',
  'Restaurant',
  'Home Services',
  'Recruitment',
  'Other',
];

const COMPANY_SIZES = [
  '1–10 Employees',
  '11–50 Employees',
  '51–200 Employees',
  '201–1000 Employees',
  '1000+',
];

const NEEDS_OPTIONS = [
  'AI Voice Agent',
  'AI Chatbot',
  'AI Receptionist',
  'Appointment Booking',
  'Customer Support Automation',
  'Lead Qualification',
  'Outbound Calling',
  'Custom AI Solution',
];

const CALL_VOLUMES = [
  'Less than 500',
  '500–2,000',
  '2,000–10,000',
  '10,000+',
];

const CONTACT_METHODS = [
  { id: 'Phone Call', label: '📞 Phone Call' },
  { id: 'WhatsApp', label: '💬 WhatsApp' },
  { id: 'Email', label: '✉️ Email' },
  { id: 'Google Meet', label: '🎥 Google Meet' },
];

const PREFERRED_TIMES = [
  'Morning (9 AM–12 PM)',
  'Afternoon (12 PM–4 PM)',
  'Evening (4 PM–8 PM)',
];

export function ContactAdPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    industry: '',
    companySize: '',
    needs: ['AI Voice Agent'],
    callVolume: '',
    challenge: '',
    contactMethod: 'Phone Call',
    preferredTime: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [serverError, setServerError] = useState('');

  const validateStep = (currentStep: number): boolean => {
    const errs: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Please enter your full name.';
      if (!formData.email.trim()) {
        errs.email = 'Please enter a valid email.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
      if (!formData.phone.trim()) {
        errs.phone = 'Please enter a valid phone number.';
      } else if (formData.phone.replace(/[^0-9]/g, '').length < 7) {
        errs.phone = 'Please enter a valid phone number.';
      }
      if (!formData.company.trim()) errs.company = 'Please enter your company name.';
    } else if (currentStep === 2) {
      if (!formData.industry) errs.industry = 'Please select your industry.';
      if (!formData.companySize) errs.companySize = 'Please select a company size.';
    } else if (currentStep === 4) {
      if (!formData.contactMethod) errs.contactMethod = 'Please choose a contact method.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (validateStep(step)) {
      if (step < 4) setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const toggleNeed = (need: string) => {
    setFormData((prev) => {
      const exists = prev.needs.includes(need);
      return {
        ...prev,
        needs: exists ? prev.needs.filter((n) => n !== need) : [...prev.needs, need],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      handleNext();
      return;
    }

    if (!validateStep(4)) return;

    setSubmitting(true);
    setServerError('');
    try {
      const compositeMessage = `[Company: ${formData.company}] [Website: ${formData.website || 'N/A'}] [Industry: ${formData.industry}] [Company Size: ${formData.companySize}] [Needs: ${formData.needs.join(', ') || 'None selected'}] [Monthly Volume: ${formData.callVolume || 'N/A'}] [Preferred Method: ${formData.contactMethod}] [Preferred Time: ${formData.preferredTime || 'N/A'}]\nChallenge / Notes: ${formData.challenge.trim() || 'None specified.'}`;

      const res = await contactService.submit({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        message: compositeMessage,
      });

      const generatedRef = res.data?.contactId
        ? `AUT-${res.data.contactId.slice(-6).toUpperCase()}`
        : `AUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      setRefId(generatedRef);
      setSubmitted(true);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to submit request. Please check your connection and try again.';
      setServerError(message || 'Failed to submit request. Please check your connection and try again.');
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
      website: '',
      industry: '',
      companySize: '',
      needs: ['AI Voice Agent'],
      callVolume: '',
      challenge: '',
      contactMethod: 'Phone Call',
      preferredTime: '',
    });
    setErrors({});
    setStep(1);
    setSubmitted(false);
    setRefId('');
  };

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#2563EB] selection:text-white pt-[36px] relative"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* STRICT NOINDEX META TAG FOR ADS LANDING PAGE */}
      <MetaRobots content={PRIVATE_ROBOTS} />

      <USPSlider />
      <PublicNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-20 lg:py-30 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT BRAND PANEL */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-12">
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                AI Automation
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0F172A] leading-[1.15] tracking-tight mb-5">
                Let's automate <br className="hidden sm:block" />
                <span className="inline-block bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent italic font-extrabold pr-3 py-1">
                  your business.
                </span>
              </h1>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-prose mb-8 font-medium">
                Fill out the form and one of our AI automation specialists will reach out within 24 hours with a tailored plan for your business.
              </p>

              {/* Social Proof with Real Avatar Images */}
              <div className="flex items-center gap-3.5 mb-9">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Client"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Client"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                    alt="Client"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Client"
                  />
                </div>
                <div className="text-xs sm:text-sm text-[#64748B] font-medium leading-snug">
                  <b className="text-[#0F172A] font-extrabold">120+</b> businesses already automated with Autoniv
                </div>
              </div>

              {/* Side Stats */}
              <div className="flex flex-wrap gap-7 sm:gap-9 mb-9">
                <div>
                  <b className="text-2xl sm:text-[28px] font-extrabold bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent inline-block whitespace-nowrap pr-1">
                    24h
                  </b>
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-bold block mt-0.5">
                    RESPONSE TIME
                  </span>
                </div>
                <div>
                  <b className="text-2xl sm:text-[28px] font-extrabold bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent inline-block whitespace-nowrap pr-1">
                    0 ₹
                  </b>
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-bold block mt-0.5">
                    CONSULTATION COST
                  </span>
                </div>
                <div>
                  <b className="text-2xl sm:text-[28px] font-extrabold bg-gradient-to-r from-[#2563EB] to-[#10B981] bg-clip-text text-transparent inline-block whitespace-nowrap pr-1">
                    100%
                  </b>
                  <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-bold block mt-0.5">
                    CUSTOM BUILT
                  </span>
                </div>
              </div>

              {/* Trust List */}
              <div className="pt-6 border-t border-slate-200/80 space-y-3.5">
                {[
                  'Free consultation, no strings attached',
                  'Custom AI strategy for your industry',
                  'No obligation to proceed',
                  'We reply within 24 hours, guaranteed',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-[#64748B]">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-[#10B981] font-bold text-xs">
                      ✓
                    </div>
                    <span className="font-semibold text-[#334155]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT FORM CARD */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl shadow-slate-200/50">
              {/* Top Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-teal-500 to-[#10B981]" />

              {!submitted ? (
                <div>
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Progress Row */}
                    <div className="flex items-center justify-between text-xs font-mono text-[#64748B] mb-2 mt-1">
                      <span className="font-semibold">
                        Step <b className="text-[#2563EB] font-extrabold">{String(step).padStart(2, '0')}</b> / 04 <span className="text-[#94A3B8] font-normal">· ~60 sec</span>
                      </span>
                      <span className="font-bold text-[#10B981]">{progressPercent}%</span>
                    </div>

                    {/* Progress Track */}
                    <div className="h-2 w-full bg-slate-100 rounded-full mb-6 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] rounded-full"
                        initial={{ width: '25%' }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                      />
                    </div>

                    {/* Step Names */}
                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-8 pt-1">
                      <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#0F172A] font-extrabold' : step > 1 ? 'text-[#10B981]' : ''}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-[#2563EB]' : step > 1 ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                        Contact
                      </span>
                      <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#0F172A] font-extrabold' : step > 2 ? 'text-[#10B981]' : ''}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-[#2563EB]' : step > 2 ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                        Business
                      </span>
                      <span className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#0F172A] font-extrabold' : step > 3 ? 'text-[#10B981]' : ''}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-[#2563EB]' : step > 3 ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
                        Needs
                      </span>
                      <span className={`flex items-center gap-1.5 ${step === 4 ? 'text-[#0F172A] font-extrabold' : ''}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${step === 4 ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                        Preferences
                      </span>
                    </div>

                    {serverError && (
                      <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-semibold" role="alert">
                        {serverError}
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* STEP 1: Contact information */}
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
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-1">
                              Contact information
                            </h2>
                            <p className="text-xs sm:text-sm text-[#64748B]">
                              Tell us who we're speaking with.
                            </p>
                          </div>

                          {/* Full Name */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                              Full Name <span className="text-[#2563EB]">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Jordan Michaels"
                              value={formData.fullName}
                              onChange={(e) => {
                                setFormData({ ...formData, fullName: e.target.value });
                                if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                              }}
                              className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all font-medium ${
                                errors.fullName
                                  ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                  : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                              }`}
                            />
                            {errors.fullName && (
                              <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                ⚠️ {errors.fullName}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Work Email */}
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Work Email <span className="text-[#2563EB]">*</span>
                              </label>
                              <input
                                type="email"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={(e) => {
                                  setFormData({ ...formData, email: e.target.value });
                                  if (errors.email) setErrors({ ...errors, email: undefined });
                                }}
                                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all font-medium ${
                                  errors.email
                                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              />
                              {errors.email && (
                                <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                  ⚠️ {errors.email}
                                </p>
                              )}
                            </div>

                            {/* Phone Number */}
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Phone Number <span className="text-[#2563EB]">*</span>
                              </label>
                              <input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={(e) => {
                                  setFormData({ ...formData, phone: e.target.value });
                                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all font-medium ${
                                  errors.phone
                                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              />
                              {errors.phone ? (
                                <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                  ⚠️ {errors.phone}
                                </p>
                              ) : (
                                <p className="text-[11px] text-[#94A3B8] mt-1 font-medium">
                                  🔒 We'll only use this to reach you. No spam, ever.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Company Name */}
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Company Name <span className="text-[#2563EB]">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Acme Inc."
                                value={formData.company}
                                onChange={(e) => {
                                  setFormData({ ...formData, company: e.target.value });
                                  if (errors.company) setErrors({ ...errors, company: undefined });
                                }}
                                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none transition-all font-medium ${
                                  errors.company
                                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              />
                              {errors.company && (
                                <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                  ⚠️ {errors.company}
                                </p>
                              )}
                            </div>

                            {/* Website */}
                            <div>
                              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Website <span className="text-[#94A3B8] font-normal lowercase">(optional)</span>
                              </label>
                              <input
                                type="url"
                                placeholder="acme.com"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-medium"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2: Business information */}
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
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-1">
                              Business information
                            </h2>
                            <p className="text-xs sm:text-sm text-[#64748B]">
                              Help us understand your business better.
                            </p>
                          </div>

                          {/* Industry */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Industry <span className="text-[#2563EB]">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={formData.industry}
                                onChange={(e) => {
                                  setFormData({ ...formData, industry: e.target.value });
                                  if (errors.industry) setErrors({ ...errors, industry: undefined });
                                }}
                                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none appearance-none cursor-pointer transition-all pr-10 font-medium ${
                                  errors.industry
                                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              >
                                <option value="" disabled>Select your industry</option>
                                {INDUSTRIES.map((ind) => (
                                  <option key={ind} value={ind}>
                                    {ind}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            {errors.industry && (
                              <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                ⚠️ {errors.industry}
                              </p>
                            )}
                          </div>

                          {/* Company Size */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Company Size <span className="text-[#2563EB]">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={formData.companySize}
                                onChange={(e) => {
                                  setFormData({ ...formData, companySize: e.target.value });
                                  if (errors.companySize) setErrors({ ...errors, companySize: undefined });
                                }}
                                className={`w-full bg-slate-50/50 border rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none appearance-none cursor-pointer transition-all pr-10 font-medium ${
                                  errors.companySize
                                    ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                                    : 'border-slate-200 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white'
                                }`}
                              >
                                <option value="" disabled>Select company size</option>
                                {COMPANY_SIZES.map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            {errors.companySize && (
                              <p className="text-xs text-red-600 font-mono font-semibold mt-1">
                                ⚠️ {errors.companySize}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3: What are you looking for? */}
                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-1">
                              What are you looking for?
                            </h2>
                            <p className="text-xs sm:text-sm text-[#64748B]">
                              Select all that apply.
                            </p>
                          </div>

                          {/* Needs Grid Checkboxes */}
                          <div>
                            <div className="flex flex-wrap gap-2.5">
                              {NEEDS_OPTIONS.map((needOption) => {
                                const isChecked = formData.needs.includes(needOption);
                                return (
                                  <label
                                    key={needOption}
                                    onClick={() => toggleNeed(needOption)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm border cursor-pointer select-none transition-all ${
                                      isChecked
                                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] font-bold shadow-xs'
                                        : 'border-slate-200 bg-slate-50/50 text-[#64748B] hover:border-slate-300 hover:text-[#0F172A]'
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full transition-all ${isChecked ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                                    {needOption}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Monthly Call Volume */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Monthly Call Volume
                            </label>
                            <div className="relative">
                              <select
                                value={formData.callVolume}
                                onChange={(e) => setFormData({ ...formData, callVolume: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none cursor-pointer transition-all pr-10 font-medium"
                              >
                                <option value="" disabled>Select call volume</option>
                                {CALL_VOLUMES.map((vol) => (
                                  <option key={vol} value={vol}>
                                    {vol}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Current Challenge */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Current Challenge
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Tell us about your business and what you'd like to automate."
                              value={formData.challenge}
                              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-y min-h-[90px] font-medium"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 4: Preferences */}
                      {step === 4 && (
                        <motion.div
                          key="step4"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-1">
                              Preferences
                            </h2>
                            <p className="text-xs sm:text-sm text-[#64748B]">
                              How and when should we reach you?
                            </p>
                          </div>

                          {/* Preferred Contact Method */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Preferred Contact Method <span className="text-[#2563EB]">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                              {CONTACT_METHODS.map((method) => {
                                const isSelected = formData.contactMethod === method.id;
                                return (
                                  <label
                                    key={method.id}
                                    onClick={() => {
                                      setFormData({ ...formData, contactMethod: method.id });
                                      if (errors.contactMethod) setErrors({ ...errors, contactMethod: undefined });
                                    }}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm border cursor-pointer select-none transition-all ${
                                      isSelected
                                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] font-bold shadow-xs'
                                        : 'border-slate-200 bg-slate-50/50 text-[#64748B] hover:border-slate-300 hover:text-[#0F172A]'
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-[#2563EB]' : 'bg-slate-300'}`} />
                                    {method.label}
                                  </label>
                                );
                              })}
                            </div>
                            {errors.contactMethod && (
                              <p className="text-xs text-red-600 font-mono font-semibold mt-1.5">
                                ⚠️ {errors.contactMethod}
                              </p>
                            )}
                          </div>

                          {/* Preferred Time */}
                          <div>
                            <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                              Preferred Time
                            </label>
                            <div className="relative">
                              <select
                                value={formData.preferredTime}
                                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none cursor-pointer transition-all pr-10 font-medium"
                              >
                                <option value="" disabled>Select a time window</option>
                                {PREFERRED_TIMES.map((timeOption) => (
                                  <option key={timeOption} value={timeOption}>
                                    {timeOption}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Nav Buttons Row */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-4">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          disabled={submitting}
                          className="px-6 py-3 rounded-xl border border-slate-200 text-[#64748B] text-xs sm:text-sm font-bold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                        >
                          ← Back
                        </button>
                      ) : <div />}

                      {step < 4 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="ml-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-xs sm:text-sm font-extrabold hover:brightness-105 active:scale-98 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          Continue →
                        </button>
                      ) : (
                        <div className="w-full space-y-3">
                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#10B981] text-white text-sm sm:text-base font-extrabold hover:brightness-105 active:scale-98 transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {submitting ? 'Submitting Request...' : 'Get My Free AI Consultation →'}
                          </button>
                          <div className="text-center text-xs text-[#94A3B8] font-medium">
                            🔒 Your information is 100% secure. No spam. No obligation.
                          </div>
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Card Footer Trust */}
                  <div className="flex flex-wrap justify-center gap-5 sm:gap-7 mt-7 pt-5 border-t border-slate-100 text-xs text-[#94A3B8] font-medium">
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#10B981] font-extrabold">✓</strong> Free Consultation
                    </span>
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#10B981] font-extrabold">✓</strong> Custom AI Strategy
                    </span>
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#10B981] font-extrabold">✓</strong> No Obligation
                    </span>
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#10B981] font-extrabold">✓</strong> Response within 24 Hours
                    </span>
                  </div>
                </div>
              ) : (
                /* SUCCESS PANEL */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-center py-6 sm:py-8 space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-[#10B981] shadow-md">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12.5L9.5 18L20 6" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                      🎉 Thank you!
                    </h2>
                    <p className="text-sm sm:text-base text-[#64748B] mt-3 max-w-md mx-auto leading-relaxed font-medium">
                      We've received your request. One of our <b className="text-[#0F172A] font-bold">AI automation specialists</b> will contact you within 24 hours to discuss how Autoniv can automate your customer interactions and help your business grow.
                    </p>
                  </div>

                  <div className="font-mono text-xs text-[#94A3B8] font-bold tracking-wider">
                    Reference ID: <span className="text-[#2563EB]">{refId}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                    <button
                      onClick={resetForm}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-[#64748B] text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                    <a
                      href="/"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md inline-block text-center cursor-pointer"
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
