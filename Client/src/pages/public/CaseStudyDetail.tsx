import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { STUDIES } from './caseStudiesData';
import Footer from './Footer';
import ScrollToTop from '../../components/ScrollToTop';
import { PublicNavbar } from '../../components/PublicNavbar';
import { USPSlider } from './sections/USPSlider';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── FAQ Item ─── */
function FAQItem({ question, answer, accentColor }: { question: string; answer: string; accentColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden transition-all duration-300 border"
      style={{
        background: open ? '#ffffff' : 'rgba(239, 246, 255, 0.7)',
        borderColor: open ? accentColor : 'rgba(37, 99, 235, 0.15)',
        boxShadow: open ? `0 10px 30px -10px ${accentColor}25` : 'none',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer transition-colors duration-200"
        style={{ background: 'transparent', border: 'none', color: '#1e293b' }}
      >
        <span className="text-sm sm:text-base font-bold text-slate-800 hover:text-slate-900 transition-colors">{question}</span>
        <span
          className="text-xl flex-shrink-0 transition-transform duration-300 font-bold"
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: open ? accentColor : '#94a3b8',
          }}
        >
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-6 pb-5 pt-1 border-t border-blue-100"
          >
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CaseStudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const studyIndex = parseInt(id || '0');
  const study = STUDIES[studyIndex];

  if (!study || !study.story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Case Study Not Found</h1>
          <button onClick={goBack} className="text-blue-600 font-semibold hover:underline cursor-pointer" style={{ background: 'none', border: 'none' }}>← Back to Case Studies</button>
        </div>
      </div>
    );
  }

  const { story } = study;
  const accentColor = study.badgeColor;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: '#1e293b',
        background: 'linear-gradient(145deg, #f0f7ff 0%, #ffffff 40%, #eff6ff 70%, #f8faff 100%)',
      }}
    >
      {/* Background Mesh Overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <USPSlider />
      <PublicNavbar />

      <div className="relative z-10" style={{ paddingTop: 130, paddingBottom: 80 }}>
        {/* Hero Section */}
        <div className="border-b border-blue-100 pb-12 mb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={goBack}
              className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
              style={{ background: 'none', border: 'none' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Case Studies
            </motion.button>

            {/* Header Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: `${accentColor}15`,
                      border: `1.5px solid ${accentColor}30`
                    }}
                  >
                    {study.icon}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold uppercase tracking-widest" style={{ color: accentColor }}>{study.category}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{study.subcategory}</div>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5 leading-tight tracking-tight text-slate-900"
                >
                  Voice AI for{' '}
                  <span style={{ color: accentColor }}>
                    {study.category === 'Healthcare' ? 'Appointment-Based Businesses' : study.category === 'Real Estate' ? 'Smart Real Estate Sales' : study.category === 'E-Commerce' ? 'E-commerce Revenue Recovery' : 'Repetitive Customer Calls'}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-base sm:text-lg leading-relaxed text-slate-500 max-w-3xl"
                >
                  How Autoniv's AI Voice Agents helps{' '}
                  {study.category === 'Healthcare' ? 'service businesses turn every enquiry into a confirmed booking' : study.category === 'Real Estate' ? 'real estate teams qualify leads faster and convert more site visits' : study.category === 'E-Commerce' ? 'D2C brands recover abandoned carts and verify COD orders' : 'businesses improve customer response and free their teams'}
                </motion.p>
              </div>

              {/* Top Stats Cards */}
              <div className="lg:col-span-4 grid grid-cols-1 gap-4">
                {study.results.map((r, i) => (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    className="p-5 rounded-2xl border flex items-center justify-between group"
                    style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(37, 99, 235, 0.1)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 12px rgba(37,99,235,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${r.color}40`;
                      e.currentTarget.style.boxShadow = `0 10px 30px -15px ${r.color}35`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.1)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(37,99,235,0.06)';
                    }}
                  >
                    <div>
                      <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">{r.label}</div>
                      <div className="text-2xl font-black mt-1 font-mono tracking-tight" style={{ color: r.color }}>{r.value}</div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${r.color}12`, border: `1px solid ${r.color}25` }}
                    >
                      📈
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left Main Column */}
            <div className="lg:col-span-8 space-y-12">

              {/* Challenge Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">⚠️</span>
                  <h2 className="text-2xl font-black text-slate-800">{story.challenge.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {story.challenge.points.map((point, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: 'rgba(255,255,255,0.75)',
                        borderColor: 'rgba(37,99,235,0.1)',
                        boxShadow: '0 2px 10px rgba(37,99,235,0.05)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: accentColor }}
                        >
                          {i + 1}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm">{point.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500">{point.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Solution / Journey Map Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚙️</span>
                  <h2 className="text-2xl font-black text-slate-800">{story.solution.title}</h2>
                </div>
                <p className="text-sm text-slate-500 mb-8 max-w-2xl leading-relaxed">{story.solution.description}</p>

                {/* Onboarding Timeline / Flow */}
                <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-blue-200 space-y-6">
                  {story.solution.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      className="relative group cursor-default"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      {/* Circle indicator */}
                      <div
                        className="absolute left-0 -translate-x-[33px] sm:-translate-x-[41px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white transition-all duration-300 group-hover:scale-115"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, #10B981)`,
                          boxShadow: `0 0 12px ${accentColor}35`
                        }}
                      >
                        {i + 1}
                      </div>

                      <div
                        className="p-4 rounded-xl border transition-all duration-300"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          borderColor: 'rgba(37,99,235,0.08)',
                          boxShadow: '0 1px 6px rgba(37,99,235,0.05)',
                        }}
                      >
                        <span className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">{step}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Comparison Impact Table Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">📈</span>
                  <h2 className="text-2xl font-black text-slate-800">{story.impact.title}</h2>
                </div>
                <div
                  className="rounded-2xl border overflow-hidden overflow-x-auto"
                  style={{
                    borderColor: 'rgba(37,99,235,0.1)',
                    background: 'rgba(255,255,255,0.85)',
                    boxShadow: '0 4px 20px rgba(37,99,235,0.07)',
                  }}
                >
                  <table className="w-full text-left min-w-[480px]">
                    <thead>
                      <tr className="border-b border-blue-100" style={{ background: 'rgba(239,246,255,0.8)' }}>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Operational Metric</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Before Autoniv</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>After Autoniv</th>
                      </tr>
                    </thead>
                    <tbody>
                      {story.impact.metrics.map((m, i) => (
                        <tr
                          key={i}
                          className="border-b last:border-0 transition-colors"
                          style={{
                            borderColor: 'rgba(37,99,235,0.06)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,246,255,0.5)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td className="p-4 text-xs sm:text-sm font-medium text-slate-700">{m.metric}</td>
                          <td className="p-4 text-xs sm:text-sm text-slate-400 font-mono">
                            <span className="text-red-400 mr-1.5">✖</span>{m.before}
                          </td>
                          <td className="p-4 text-xs sm:text-sm font-black font-mono" style={{ color: accentColor }}>
                            <span className="mr-1.5">✔</span>{m.after}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* FAQs Accordion */}
              {story.faqs && story.faqs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="pt-4"
                >
                  <h2 className="text-2xl font-black text-slate-800 mb-6">Case Study FAQs</h2>
                  <div className="space-y-4">
                    {story.faqs.map((faq, i) => (
                      <FAQItem key={i} question={faq.q} answer={faq.a} accentColor={accentColor} />
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Right Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">

              {/* Quote Block */}
              {story.quote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="p-6 rounded-3xl border relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    borderColor: 'rgba(37,99,235,0.12)',
                    boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                  }}
                >
                  {/* Decorative quote mark */}
                  <div className="absolute top-0 right-4 text-[120px] font-serif leading-none select-none pointer-events-none opacity-[0.06] font-black" style={{ color: accentColor }}>
                    "
                  </div>

                  <div className="relative z-10">
                    <div className="flex gap-1.5 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-sm" style={{ color: accentColor }}>★</span>
                      ))}
                    </div>

                    <p className="text-sm italic leading-relaxed text-slate-600 mb-6 font-medium">
                      "{story.quote.text}"
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-blue-100">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, #10B981)` }}
                      >
                        {story.quote.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-800">{story.quote.author.split(',')[0]}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{story.quote.author.split(',').slice(1).join(',')}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Side CTA Block */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="p-6 sm:p-8 rounded-3xl border relative overflow-hidden text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(16,185,129,0.06) 100%)',
                  borderColor: 'rgba(37,99,235,0.15)',
                  boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-15 pointer-events-none" style={{ background: accentColor }} />

                <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to get similar results?</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  See how Autoniv can transform your {study.category.toLowerCase()} operations with custom workflows.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-white no-underline transition-all hover:-translate-y-0.5 text-xs"
                    style={{
                      background: 'linear-gradient(135deg,#2563EB,#10B981)',
                      boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                    }}
                  >
                    Get Started Free
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold no-underline transition-all text-xs border text-slate-600 border-blue-200 hover:border-blue-400 hover:text-blue-600 bg-white/60"
                  >
                    See a Live Demo →
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}