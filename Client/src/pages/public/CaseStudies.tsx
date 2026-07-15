import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from './Footer';
import ScrollToTop from '../../components/ScrollToTop';
import { PublicNavbar } from '../../components/PublicNavbar';
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, LOGO_SRC, Reveal, SectionLabel, GradientText, StatCard, CTADecorations } from './design';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import { STUDIES } from './caseStudiesData';

const EASE = [0.16, 1, 0.3, 1] as const;

const AuthDialog = lazy(() =>
  import('./AuthDialog').then((m) => ({ default: m.AuthDialog }))
);

const navItems = [
  { label: 'Agents', href: '/agents' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' }
];

const TRUSTED_BRANDS = [
  'RealtyMax', 'Care+ Clinics', 'LearnUp', 'The Skin Lounge',
  'EduSphere', 'FitNation', 'UrbanCart', 'FinTrack',
];

const GLOBAL_STATS = [
  { value: '500+', label: 'Businesses Served', desc: 'Across all industries' },
  { value: '2M+', label: 'Conversations', desc: 'Handled to date' },
  { value: '30%+', label: 'Conversion Lift', desc: 'Average increase' },
  { value: '24/7', label: 'AI Agents', desc: 'Always working' },
  { value: '98%', label: 'Satisfaction', desc: 'Client rating' },
  { value: '₹50Cr+', label: 'Revenue Generated', desc: 'For clients' },
];

import { USPSlider } from './sections/USPSlider';

// ─── Animated counter ───
function AnimatedValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const m = value.match(/[\d.]+/);
    if (!m) return;
    const target = parseFloat(m[0]);
    const prefix = value.slice(0, m.index);
    const suffix = value.slice((m.index ?? 0) + m[0].length);
    const controls = animate(0, target, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => {
        const formatted = Number.isInteger(target) ? Math.round(v).toString() : v.toFixed(1);
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
}

/* ─── Nav ─── */
export function Nav({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void }) {
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';
  const [authDialog, setAuthDialog] = useState<AuthMode | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthDialog(mode);
  };
  const closeAuth = () => setAuthDialog(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const c = (e: MouseEvent) => {
      const target = e.target as Node;
      if (drawerRef.current && drawerRef.current.contains(target)) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', c);
    return () => document.removeEventListener('mousedown', c);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-[36px] inset-x-0 z-50" style={{
        background: 'rgba(255,255,255,0.97)',
        borderBottom: '1px solid rgba(37,99,235,0.12)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="max-w-7xl -ml-10 lg:ml-30 md:ml-5 px-6 sm:px-6 h-[68px] flex items-center justify-between">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={LOGO_SRC} alt="Autoniv Brand Logo" width={240} height={160} className="h-40 sm:h-40 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.label} to={item.href} className="relative text-sm font-semibold py-2"
                  style={{ color: isActive ? '#2563EB' : '#475569' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#475569'; }}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="navActiveIndicator"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2563EB, #10B981)' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <motion.button
              onClick={() => openAuth('login')}
              whileHover={{ color: '#2563EB', background: 'rgba(37,99,235,0.06)' }}
              whileTap={{ scale: 0.96 }}
              className="px-4 py-2 text-sm font-medium rounded-lg"
              style={{ color: '#475569', border: 'none', cursor: 'pointer', background: 'transparent' }}
            >Sign In</motion.button>
            <motion.button
              onClick={() => openAuth('register')}
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(16,185,129,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-full"
              style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)', border: 'none', cursor: 'pointer' }}
            >Get Started Free</motion.button>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}
          >
            <motion.svg
              className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </motion.svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            onClick={() => setMobileMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed inset-0 z-[55]"
            style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
            aria-hidden={!mobileMenuOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="md:hidden fixed top-0 right-0 h-full z-[100] flex flex-col"
            style={{
              width: 'min(82vw, 340px)',
              background: 'rgba(255,255,255,0.99)',
              borderLeft: '1px solid rgba(37,99,235,0.12)',
              boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 h-[64px]" style={{ borderBottom: '1px solid rgba(37,99,235,0.10)' }}>
              <Link to="/" onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <img src={LOGO_SRC} alt="Autoniv Brand Logo" width={240} height={160} className="-ml-8 h-40 w-auto" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg"
                style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.35, ease: EASE }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold rounded-xl"
                    style={{
                      color: location.pathname === item.href ? '#2563EB' : '#475569',
                      background: location.pathname === item.href ? 'rgba(37,99,235,0.07)' : 'transparent',
                    }}
                  >{item.label}</Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35, ease: EASE }}
              className="px-5 py-5 mb-10 space-y-2"
              style={{ borderTop: '1px solid rgba(37,99,235,0.10)' }}
            >
              <button
                onClick={() => { openAuth('login'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-sm font-semibold rounded-xl"
                style={{ color: '#475569', background: 'none', border: '1px solid rgba(37,99,235,0.15)', cursor: 'pointer' }}
              >Sign In</button>
              <button
                onClick={() => { openAuth('register'); setMobileMenuOpen(false); }}
                className="block w-full text-center font-bold text-white px-4 py-3 rounded-xl"
                style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)', border: 'none', cursor: 'pointer' }}
              >Get Started Free</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AuthDialog
          isOpen={authDialog !== null}
          mode={authMode}
          onClose={closeAuth}
          onSwitch={(m) => {
            setAuthMode(m);
            setAuthDialog(m);
          }}
        />
      </Suspense>
    </>
  );
}

/* ─── Case Study Card ─── */
function StudyCard({ study, index }: { study: any; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      whileHover={{
        y: -10,
        scale: 1.03,
        boxShadow: `0 30px 60px -15px ${study.badgeColor}30, 0 0 0 2px ${study.badgeColor}20`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group rounded-2xl overflow-hidden flex flex-col border relative cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))',
        borderColor: hovered ? `${study.badgeColor}40` : 'rgba(37,99,235,0.12)',
        boxShadow: hovered
          ? `0 20px 50px -12px ${study.badgeColor}18, 0 0 0 1px ${study.badgeColor}12`
          : '0 4px 20px rgba(0,0,0,0.04)',
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <div className="relative">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * 0.12 + 0.2, ease: EASE }}
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${study.badgeColor}, ${study.badgeColor}66)`,
            transformOrigin: 'left',
            boxShadow: hovered ? `0 0 20px ${study.badgeColor}50` : 'none',
            transition: 'box-shadow 0.5s ease',
          }}
        />
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-t-2xl"
              style={{ background: `radial-gradient(40% 200% at 50% 0%, ${study.badgeColor}30, transparent 70%)` }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"
          style={{ background: `linear-gradient(135deg, ${study.badgeColor}03, rgba(255,255,255,0))` }}
        />

        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.15, rotate: -8, y: -3, boxShadow: `0 8px 24px ${study.badgeColor}30` }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl relative overflow-hidden"
              style={{ background: `${study.badgeColor}10`, border: `1px solid ${study.badgeColor}24`, boxShadow: `0 2px 8px ${study.badgeColor}10` }}
            >
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${study.badgeColor}30, transparent 70%)` }}
              />
              <span className="relative z-10">{study.icon}</span>
            </motion.div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{study.category}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{study.subcategory}</p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.12 + 0.3, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, background: `${study.badgeColor}20`, boxShadow: `0 4px 12px ${study.badgeColor}25` }}
            className="px-3.5 py-1.5 rounded-lg text-sm font-black cursor-default"
            style={{ color: study.badgeColor, background: `${study.badgeColor}10` }}
          >
            {study.metric}
          </motion.div>
        </div>

        <div className="mb-5 relative z-10">
          <p className="text-sm text-slate-600 leading-relaxed" style={{ lineHeight: '1.6' }}>{study.challenge}</p>
        </div>

        <div className="mb-5 relative z-10">
          <div className="flex flex-wrap gap-2">
            {study.solutions.map((s: any, i: number) => (
              <motion.span
                key={s.label}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.12 + 0.4 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05, x: 3, y: -2, background: `${study.badgeColor}20`, borderColor: `${study.badgeColor}40`, boxShadow: `0 4px 12px ${study.badgeColor}15` }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer border"
                style={{ background: 'rgba(37,99,235,0.04)', borderColor: 'rgba(37,99,235,0.08)', color: 'rgba(15,23,42,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
              >
                <motion.span whileHover={{ rotate: 15, scale: 1.2 }} transition={{ duration: 0.2 }}>{s.icon}</motion.span>
                <span>{s.label}</span>
              </motion.span>
            ))}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6 relative z-10 opacity-80" />

        <div className="grid grid-cols-3 gap-4 mb-7 relative z-10">
          {study.results.map((r: any, i: number) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.12 + 0.5 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.08, y: -3, filter: 'brightness(1.1)' }}
              className="text-center group/result cursor-default"
            >
              <motion.div className="text-lg font-black font-mono tracking-tight mb-1" style={{ color: r.color }} whileHover={{ scale: 1.1 }}>
                <AnimatedValue value={r.value} />
              </motion.div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight group-hover/result:text-slate-500 transition-colors">
                {r.label}
              </div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-current mx-auto mt-1 opacity-0 group-hover/result:opacity-100 transition-opacity duration-300" style={{ color: r.color }} />
            </motion.div>
          ))}
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Link
            to={`/case-studies/${index}`}
            className="mt-auto w-full py-3.5 rounded-xl text-sm font-bold text-center no-underline block relative overflow-hidden"
            style={{
              color: hovered ? '#ffffff' : study.badgeColor,
              background: hovered ? study.badgeColor : `${study.badgeColor}08`,
              border: `1px solid ${hovered ? study.badgeColor : `${study.badgeColor}25`}`,
              boxShadow: hovered ? `0 8px 24px ${study.badgeColor}35` : '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
              initial={{ x: '-120%' }}
              whileHover={{ x: '120%' }}
              transition={{ duration: 0.8, ease: EASE }}
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Read Full Story
              <motion.svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" whileHover={{ x: 5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </motion.svg>
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Impact preview (hero visual) ─── */
const IMPACT_SLIDES = [
  { company: 'PeakPlumbing', tag: 'Home Services', icon: '🚐', color: '#2563EB', metric: '10,000+', metricLabel: 'Calls handled / month', bars: [{ l: 'Before', v: 32 }, { l: 'After', v: 94 }], foot: [{ v: '+82%', l: 'Booked' }, { v: '4.8/5', l: 'CSAT' }, { v: '-75%', l: 'Workload' }] },
  { company: 'Care+ Clinics', tag: 'Healthcare', icon: '🏥', color: '#10B981', metric: '3.2×', metricLabel: 'More appointments', bars: [{ l: 'Before', v: 40 }, { l: 'After', v: 88 }], foot: [{ v: '+60%', l: 'Show rate' }, { v: '24/7', l: 'Coverage' }, { v: '-45%', l: 'Cost' }] },
  { company: 'UrbanCart', tag: 'E-Commerce', icon: '🛒', color: '#8b5cf6', metric: '+30%', metricLabel: 'Conversion lift', bars: [{ l: 'Before', v: 45 }, { l: 'After', v: 90 }], foot: [{ v: '85%', l: 'Resolved' }, { v: '0.3s', l: 'Latency' }, { v: '2M+', l: 'Chats' }] },
];

function ImpactCard() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((c) => (c + 1) % IMPACT_SLIDES.length), 3200);
    return () => clearInterval(id);
  }, []);
  const s = IMPACT_SLIDES[i];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
      className="relative w-full max-w-[400px] rounded-3xl overflow-hidden"
      style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: '0 30px 70px -24px rgba(37,99,235,0.28), 0 2px 8px rgba(15,23,42,0.05)' }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${s.color}12`, border: `1px solid ${s.color}28` }}>
            {s.icon}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: INK }}>{s.company}</div>
            <div className="text-[11px] font-medium" style={{ color: MUTE, fontFamily: MONO }}>{s.tag}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#10B981' }}>Verified</span>
        </div>
      </div>

      {/* body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="px-5 py-5 min-h-[220px]"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: MUTE }}>{s.metricLabel}</div>
          <div className="text-4xl font-black font-mono tracking-tight mb-5" style={{ color: s.color }}>{s.metric}</div>

          <div className="space-y-3">
            {s.bars.map((b, bi) => (
              <div key={b.l}>
                <div className="flex justify-between text-[11px] font-medium mb-1" style={{ color: SLATE }}>
                  <span>{b.l}</span><span>{b.v}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#eef2f7' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: bi === 0 ? '#cbd5e1' : `linear-gradient(90deg, ${s.color}, ${s.color}bb)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${b.v}%` }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.15 + bi * 0.15 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* footer metric strip */}
      <div className="grid grid-cols-3 px-5 py-4" style={{ borderTop: `1px solid ${HAIRLINE}`, background: '#fafcff' }}>
        {s.foot.map((f) => (
          <div key={f.l} className="text-center">
            <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{f.v}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: MUTE }}>{f.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Filter Tabs ─── */
function FilterTabs({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const categories = ['All', 'Healthcare', 'Real Estate', 'E-Commerce', 'Customer Support'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-2xl mx-auto">
      {categories.map(cat => {
        const isActive = active === cat;
        return (
          <motion.button
            key={cat}
            onClick={() => onChange(cat)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative px-5 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer border"
            style={{
              borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.08)',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'transparent' : 'rgba(255,255,255,0.06)',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="filterTabPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full -z-10"
                style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)', boxShadow: '0 6px 20px -6px rgba(16,185,129,0.35)' }}
              />
            )}
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Main export ─── */
export function CaseStudies() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? STUDIES.map((s, i) => ({ ...s, _idx: i }))
    : STUDIES.map((s, i) => ({ ...s, _idx: i })).filter(s => s.category === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: TINT, fontFamily: SANS, color: INK }}>
      <USPSlider />
      <PublicNavbar />

      <div className="page-bg" style={{ paddingTop: 130, paddingBottom: 8 }}>
        <div className="box-wrap">

          {/* ── Hero ── */}
          <section className="section-box tint">
            <div className="max-w-6xl mx-auto section-pad relative" style={{ zIndex: 1 }}>
              <motion.div
                className="absolute -top-16 left-[6%] w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)', filter: 'blur(40px)' }}
                animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute top-10 right-[4%] w-60 h-60 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)', filter: 'blur(40px)' }}
                animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left: copy */}
                <div className="text-center lg:text-left">
                  <Reveal>
                    <div className="flex justify-center lg:justify-start">
                      <SectionLabel text="Case Studies" />
                    </div>
                    <motion.h1
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                      style={{ fontSize: 'clamp(32px,4.6vw,54px)', fontWeight: 900, letterSpacing: '-0.03em', color: INK, lineHeight: 1.08, margin: '0 0 18px' }}
                    >
                      Real Businesses.<br />
                      <GradientText>Real Results.</GradientText>
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.22 }}
                      style={{ fontSize: 16, color: SLATE, maxWidth: 480, lineHeight: 1.7, margin: '0 0 28px' }}
                      className="mx-auto lg:mx-0"
                    >
                      See how Autoniv's AI Voice Agents, Chatbots & CRM Automation are helping businesses save time, convert more and grow faster.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.32 }}
                      className="flex flex-wrap justify-center lg:justify-start gap-6"
                    >
                      {[{ v: '500+', l: 'Businesses' }, { v: '2M+', l: 'Conversations' }, { v: '30%+', l: 'Avg. lift' }].map((st) => (
                        <div key={st.l} className="text-center lg:text-left">
                          <div className="text-2xl font-black font-mono" style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{st.v}</div>
                          <div className="text-[11px] uppercase tracking-wider" style={{ color: MUTE }}>{st.l}</div>
                        </div>
                      ))}
                    </motion.div>
                  </Reveal>
                </div>

                {/* Right: impact preview */}
                <div className="flex justify-center lg:justify-end">
                  <ImpactCard />
                </div>
              </div>
            </div>
          </section>

          {/* ── Case Studies Grid (Dark) ── */}
          <section className="section-box black" style={{ background: '#030812', position: 'relative' }}>
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"
              animate={{ x: [0, -26, 0], y: [0, 22, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="section-pad max-w-6xl mx-auto relative z-10">
              <Reveal>
                <div className="text-center mb-10">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                    Featured <GradientText>Case Studies</GradientText>
                  </h2>
                  <p className="text-sm text-white/40 max-w-md mx-auto">
                    Explore how businesses across industries are leveraging Autoniv to drive measurable growth.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={60}>
                <FilterTabs active={activeTab} onChange={setActiveTab} />
              </Reveal>

              <Reveal delay={100}>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((study, i) => (
                      <StudyCard key={study._idx} study={study} index={i} />
                    ))}
                  </AnimatePresence>
                </motion.div>
                {filtered.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-white/40 py-10"
                  >
                    No case studies in this category yet.
                  </motion.p>
                )}
              </Reveal>
            </div>
          </section>

          {/* ── Trusted By ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto text-center">
              <Reveal>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: MUTE, fontFamily: MONO, marginBottom: 24 }}>
                  ● TRUSTED BY 500+ BUSINESSES ●
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {TRUSTED_BRANDS.map((b, i) => (
                    <motion.span
                      key={b}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                      whileHover={{ y: -3, borderColor: 'rgba(37,99,235,0.25)', boxShadow: '0 8px 18px rgba(37,99,235,0.08)' }}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}
                    >
                      {b}
                    </motion.span>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="text-center">
                  <SectionLabel text="By the Numbers" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 28px' }}>
                    Autoniv in <GradientText>Numbers</GradientText>
                  </h2>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {GLOBAL_STATS.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-10%' }}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                      whileHover={{ y: -4 }}
                    >
                      <StatCard value={s.value} label={s.label} description={s.desc} />
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="section-box white" style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#f0fdf9 100%)', border: '1.5px solid rgba(37,99,235,0.14)', boxShadow: '0 20px 56px -16px rgba(37,99,235,0.14)' }}>
            <div className="section-pad max-w-6xl mx-auto text-center relative overflow-hidden">
              <CTADecorations />
              <div className="relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: INK, margin: '0 0 16px', lineHeight: 1.15 }}
                >
                  Let's Build Your <GradientText>Success Story</GradientText>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                  style={{ fontSize: 15, color: SLATE, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}
                >
                  Join 500+ businesses already growing with Autoniv.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                  className="flex flex-col sm:flex-row justify-center gap-3"
                >
                  <motion.div whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/"
                      className="px-8 py-4 rounded-full text-sm font-bold text-white no-underline inline-block text-center"
                      style={{ background: BRAND, boxShadow: '0 8px 26px -4px rgba(16,185,129,0.34)' }}>
                      Book a Demo →
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ y: -2, borderColor: 'rgba(37,99,235,0.32)', color: '#2563EB' }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-4 rounded-full text-sm font-bold"
                    style={{ background: SURFACE, border: '1.5px solid rgba(15,23,42,0.10)', color: '#475569', cursor: 'pointer' }}
                  >
                    Talk to Expert
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default CaseStudies;