import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  label: string;
  title: string;
  description: string;
  iconPath: string;
  iconStroke: string;
}

const steps: Step[] = [
  {
    label: 'Step 1 of 3 — Getting started',
    title: 'Welcome to Autoniv',
    description: 'Your AI-powered voice agent platform. Get up and running in 3 quick steps.',
    iconStroke: '#0099ff',
    iconPath: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Step 2 of 3 — Your first agent',
    title: 'Create your first agent',
    description: 'Set up an AI agent to handle calls, book appointments, or answer FAQs — pick a name and type.',
    iconStroke: '#00c8b4',
    iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    label: 'Step 3 of 3 — Monitor results',
    title: 'Review calls & leads',
    description: 'Monitor call history, review transcripts, and capture leads — all from your dashboard.',
    iconStroke: '#00e5a0',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

interface OnboardingTourProps {
  onDismiss: () => void;
}

export function OnboardingTour({ onDismiss }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const next = useCallback(() => {
    if (!isLast) setStep(s => s + 1);
    else onDismiss();
  }, [isLast, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#0a1628',
        border: '1px solid rgba(0,119,255,0.20)',
        padding: '20px',
      }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 pointer-events-none"
        style={{ width: 200, height: 200, background: 'radial-gradient(circle at top right, rgba(0,119,255,0.10) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 pointer-events-none"
        style={{ width: 150, height: 150, background: 'radial-gradient(circle at bottom left, rgba(0,200,180,0.07) 0%, transparent 65%)', transform: 'translate(-30%,30%)' }} />

      {/* Step label */}
      <div className="relative z-10 flex items-center gap-2 mb-3.5" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(0,180,255,0.7)', textTransform: 'uppercase' }}>
        <span className="animate-live-pulse w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0099ff' }} />
        <AnimatePresence mode="wait">
          <motion.span key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {current.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Main row */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center"
          style={{ background: 'rgba(0,119,255,0.08)', border: '1px solid rgba(0,119,255,0.20)' }}>
          <AnimatePresence mode="wait">
            <motion.svg
              key={step}
              className="w-5 h-5"
              fill="none"
              stroke={current.iconStroke}
              viewBox="0 0 24 24"
              initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={current.iconPath} />
            </motion.svg>
          </AnimatePresence>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="font-bold mb-1" style={{ fontSize: 14, color: '#e8f8ff' }}>
                {current.title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(232,248,255,0.58)', lineHeight: 1.65 }}>
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  height: 3,
                  width: i === step ? 18 : 5,
                  borderRadius: 2,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === step ? '#0099ff' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.35s cubic-bezier(.16,1,.3,1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <button
            onClick={onDismiss}
            style={{ fontSize: 11, fontWeight: 500, color: 'rgba(232,248,255,0.32)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,248,255,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,248,255,0.32)')}
          >
            Skip
          </button>
          <button
            onClick={next}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#050d1a',
              background: 'linear-gradient(135deg, #00e5a0, #00c8b4, #0077cc)',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'transform 0.18s cubic-bezier(.16,1,.3,1), box-shadow 0.18s',
              boxShadow: '0 4px 16px rgba(0,119,255,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,119,255,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,119,255,0.25)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; }}
          >
            {isLast ? 'Get started ✓' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mt-4 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #0077ff, #00e5a0)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

