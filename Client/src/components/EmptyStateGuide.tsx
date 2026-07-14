import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface GuideStep {
  icon: React.ReactNode;
  label: string;
  description: string;
  to: string;
  cta: string;
}

interface EmptyStateGuideProps {
  title: string;
  description: string;
  steps: GuideStep[];
}

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.08 } } } };

export function EmptyStateGuide({ title, description, steps }: EmptyStateGuideProps) {
  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="relative rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/30 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(16,185,129,0.05) 100%)' }} />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(37,99,235,0.04) 100%)' }} />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(37,99,235,0.2)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
          </div>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="group relative rounded-xl border border-slate-200/60 bg-white p-5 transition-all duration-200 hover:border-[var(--primary)]/30 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Step number badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-[10px] font-black shadow-sm" style={{ background: 'var(--gg)', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}>
                  {i + 1}
                </span>
                <span className="text-xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
                  {step.icon}
                </span>
              </div>

              {/* Content */}
              <h4 className="text-sm font-bold text-slate-800 mb-1.5 leading-tight group-hover:text-[var(--primary)] transition-colors">{step.label}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{step.description}</p>

              {/* CTA link */}
              <Link
                to={step.to}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity no-underline"
              >
                {step.cta}
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Connector line between steps (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-1/2 -right-3 w-6 h-px">
                  <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.3), transparent)' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom hint */}
        <motion.div variants={fadeUp} className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <p className="text-[11px] text-slate-400 font-medium">Typically takes less than 5 minutes to get started</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
