import { Fragment, useRef } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { PublicNavbar } from "../../components/PublicNavbar";
import { USPSlider } from "./sections/USPSlider";
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, Reveal, SectionLabel, GradientText, StatCard, CTADecorations } from './design';
import { motion, useInView, animate, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Pricing as PricingSection } from "./sections/Pricing";
import { injectSchema, SERVICE_SCHEMAS } from "../../utils/schema";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "-60px" } as const;

/* Shared scroll-reveal props. Collapses to a plain fade when the visitor has
   asked for reduced motion — the inline whileInView animations used to ignore
   that preference entirely. */
function useRevealProps() {
  const reduced = useReducedMotion() ?? false;
  return (delay = 0) =>
    reduced
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: VIEWPORT, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: VIEWPORT,
          transition: { duration: 0.55, delay, ease: EASE },
        };
}

const HERO_STATS = [
  { value: "24/7", label: "Always On", desc: "99.9% uptime guaranteed" },
  { value: "10K+", label: "Calls Daily", desc: "Handled concurrently" },
  { value: "98%", label: "Satisfaction", desc: "Customer rating" },
  { value: "50+", label: "Languages", desc: "Supported natively" },
];

const GLOBAL_STATS = [
  { value: "500+", label: "Businesses Served", desc: "Across industries" },
  { value: "2M+", label: "Conversations", desc: "Handled to date" },
  { value: "30%+", label: "Conversion Lift", desc: "Average increase" },
  { value: "24/7", label: "AI Agents", desc: "Always working" },
  { value: "98%", label: "Satisfaction", desc: "Client rating" },
  { value: "₹50Cr+", label: "Revenue Generated", desc: "For clients" },
];

/* ─── Services Data ───
   Two headline agents, then the supporting modules that ship alongside them. */
const PRIMARY_SERVICES = [
  {
    id: "chat",
    title: "AI Chatbot",
    icon: "💬",
    color: "#2563EB",
    tagline: "Website · WhatsApp · Social",
    description: "Create custom AI chatbots with unique personalities. Deploy on your website or WhatsApp — each chatbot learns your brand voice, answers questions, captures leads, and handles support 24/7.",
    features: ["Custom AI Personality", "WhatsApp + Website", "Lead Capture", "Smart Escalation", "Analytics Dashboard"],
    metrics: [
      { value: "85%", label: "Resolution Rate" },
      { value: "24/7", label: "Availability" },
      { value: "45%", label: "Cost Reduction" },
    ],
    useCases: [
      { icon: "🛒", title: "E-commerce Support", desc: "Help customers find products, track orders, and resolve issues." },
      { icon: "🏥", title: "Healthcare Triage", desc: "Pre-screen patients and schedule appointments." },
      { icon: "🏦", title: "Banking Queries", desc: "Handle account questions and transaction support." },
    ],
  },
  {
    id: "voice",
    title: "Voice Assistant",
    icon: "🎙️",
    color: "#10B981",
    tagline: "Inbound · Outbound · Telephony",
    description: "Advanced voice AI agents that handle inbound/outbound calls, book appointments, qualify leads, and provide natural conversational experiences.",
    features: ["Natural Language Understanding", "Call Routing", "Appointment Scheduling", "CRM Integration", "Multi-language Support"],
    metrics: [
      { value: "98%", label: "Accuracy" },
      { value: "3.2X", label: "More Leads" },
      { value: "40%", label: "Efficiency Gain" },
    ],
    useCases: [
      { icon: "📞", title: "Receptionist", desc: "Answer calls 24/7, handle FAQs, and filter spam." },
      { icon: "📅", title: "Scheduler", desc: "Book, reschedule, or cancel appointments on the call." },
      { icon: "🎯", title: "Lead Qualifier", desc: "Engage leads instantly with qualifying questions." },
    ],
  },
];

const SUPPORTING_SERVICES = [
  {
    id: "crm",
    title: "CRM Automation",
    icon: "🔄",
    color: "#8B5CF6",
    description: "Automate workflows, follow-ups, and pipeline management — plugged into the CRM you already run.",
    features: ["Lead Management", "Automated Follow-ups", "Pipeline Sync", "Reports"],
    stat: { value: "60%", label: "Less Manual Work" },
  },
  {
    id: "booking",
    title: "Appointment Booking",
    icon: "📅",
    color: "#06B6D4",
    description: "Agents book straight into Google Calendar, Outlook, or Calendly. No back-and-forth, no double bookings.",
    features: ["Calendar Sync", "Auto Reminders", "Rescheduling", "Time-zone Aware"],
    stat: { value: "3×", label: "More Bookings" },
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    icon: "📊",
    color: "#F59E0B",
    description: "Live dashboards with transcripts, sentiment scoring, and conversion metrics so you know what is working.",
    features: ["Call Transcripts", "Sentiment Scores", "Conversion Metrics", "Custom Reports"],
    stat: { value: "2.4×", label: "Average ROI" },
  },
  {
    id: "language",
    title: "Multi-Language Support",
    icon: "🌍",
    color: "#EC4899",
    description: "Deploy in Hindi, Tamil, Telugu, Bengali and more, with region-appropriate accents and cultural context.",
    features: ["20+ Languages", "Regional Accents", "Script Adaptation", "Auto Detection"],
    stat: { value: "20+", label: "Languages" },
  },
];

/* ─── Animated counter ─── */
function AnimatedValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion() ?? false;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
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
  }, [inView, value, reduced]);

  return <span ref={ref}>{display}</span>;
}

/* ─── Live call preview (hero visual) ───
   Voice and chat are genuinely different conversations — the tab switch used to
   swap only the header label while replaying the same script underneath. */
const VOICE_TRANSCRIPT = [
  { from: "ai", text: "Hi! Thanks for calling Autoniv. How can I help you today?" },
  { from: "user", text: "I'd like to book a demo for next week." },
  { from: "ai", text: "Absolutely — I have Tuesday 2pm or Wednesday 11am open." },
  { from: "user", text: "Wednesday works great." },
  { from: "ai", text: "Done ✓ You're booked for Wed 11am. Confirmation sent!" },
];

const CHAT_TRANSCRIPT = [
  { from: "ai", text: "Hey 👋 Welcome to Autoniv. Looking for voice or chat automation?" },
  { from: "user", text: "Chat — we get a lot of WhatsApp orders." },
  { from: "ai", text: "Perfect. I can connect WhatsApp Business and answer order status automatically." },
  { from: "user", text: "How long does setup take?" },
  { from: "ai", text: "Under 48 hours. Drop your email and I'll send the setup guide ✓" },
];

const PREVIEW_MODES = {
  voice: {
    label: "🎙️ Voice Call",
    icon: "🎙️",
    title: "Autoniv Voice Engine",
    subtitle: "Multi-Turn Telecom · <200ms",
    transcript: VOICE_TRANSCRIPT,
    metrics: [
      { v: "0.2s", l: "Latency" },
      { v: "99.8%", l: "Uptime" },
      { v: "20+", l: "Languages" },
    ],
  },
  chat: {
    label: "💬 Live Chat",
    icon: "💬",
    title: "Autoniv Web Chatbot",
    subtitle: "Smart Lead Qualification",
    transcript: CHAT_TRANSCRIPT,
    metrics: [
      { v: "85%", l: "Resolved" },
      { v: "4×", l: "Faster" },
      { v: "4", l: "Channels" },
    ],
  },
} as const;

function LiveWave() {
  const reduced = useReducedMotion() ?? false;
  const bars = Array.from({ length: 28 });

  if (reduced) {
    return (
      <div className="flex items-center gap-[3px] h-6" aria-hidden="true">
        {bars.map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{ height: 6 + Math.abs(Math.sin(i * 1.3)) * 14, background: i % 2 ? "#10B981" : "#2563EB" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[3px] h-6" aria-hidden="true">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: i % 2 ? "#10B981" : "#2563EB" }}
          animate={{ height: [6, 8 + (Math.abs(Math.sin(i * 1.3)) * 18), 6] }}
          transition={{ duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: (i % 7) * 0.08 }}
        />
      ))}
    </div>
  );
}

function CallPreview() {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat'>('voice');
  const [count, setCount] = useState(2);
  const reduced = useReducedMotion() ?? false;
  const mode = PREVIEW_MODES[activeTab];

  // Restart the playback whenever the visitor switches mode.
  useEffect(() => {
    setCount(2);
  }, [activeTab]);

  useEffect(() => {
    if (reduced) {
      setCount(mode.transcript.length);
      return;
    }
    const id = setInterval(() => {
      setCount((c) => (c >= mode.transcript.length ? 2 : c + 1));
    }, 1900);
    return () => clearInterval(id);
  }, [mode.transcript.length, reduced]);

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      className="relative w-full max-w-[420px] rounded-3xl overflow-hidden border border-slate-200/80 bg-white"
      style={{ boxShadow: "0 24px 60px -24px rgba(15,23,42,0.28), 0 2px 8px rgba(15,23,42,0.04)" }}
    >
      {/* Mode switcher */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div role="tablist" aria-label="Preview mode" className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/60 w-full max-w-[260px]">
          {(Object.keys(PREVIEW_MODES) as Array<keyof typeof PREVIEW_MODES>).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {PREVIEW_MODES[key].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">Active</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-blue-50 border border-blue-100">
            {mode.icon}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900">{mode.title}</div>
            <span className="text-[11px] font-mono text-slate-400">{mode.subtitle}</span>
          </div>
        </div>
        {activeTab === 'voice' && <LiveWave />}
      </div>

      {/* Transcript */}
      <div className="px-5 py-5 space-y-3 min-h-[270px] bg-slate-50/50" aria-live="polite">
        <AnimatePresence initial={false}>
          {mode.transcript.slice(0, count).map((m, i) => (
            <motion.div
              key={`${activeTab}-${i}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed font-medium"
                style={
                  m.from === "user"
                    ? { background: BRAND, color: "#fff", borderRadius: "16px 16px 4px 16px" }
                    : { background: "#ffffff", border: "1px solid #e2e8f0", color: INK, borderRadius: "16px 16px 16px 4px" }
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-3 px-5 py-3.5 border-t border-slate-100 bg-white">
        {mode.metrics.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-xs sm:text-sm font-extrabold font-mono text-blue-600">{s.v}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Hero ─── */
function Hero() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="section-box tint">
      <div className="max-w-6xl mx-auto section-pad relative" style={{ zIndex: 1 }}>
        {!reduced && (
          <>
            <motion.div
              className="absolute -top-10 left-[6%] w-72 h-72 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)", filter: "blur(40px)" }}
              animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-10 right-[4%] w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%)", filter: "blur(40px)" }}
              animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <Reveal>
              <div className="flex justify-center lg:justify-start">
                <SectionLabel text="AI Services · Powered by Autoniv" />
              </div>
              <h1 style={{ fontSize: "clamp(30px,4.4vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, lineHeight: 1.1, margin: "0 0 16px" }}>
                Chat & Voice <GradientText>AI Solutions</GradientText> that never sleep
              </h1>
              <p
                style={{ fontSize: 15.5, color: SLATE, maxWidth: 520, lineHeight: 1.65, margin: "0 0 28px" }}
                className="mx-auto lg:mx-0"
              >
                Deploy intelligent chat and voice assistants that work 24/7 to engage customers, qualify leads, and drive
                conversions — across every channel.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-7">
                {["No-code setup", "Live in 48h", "50+ languages"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}>
                    <span style={{ color: "#10B981" }}>✓</span> {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link
                  to="/register"
                  className="h-12 px-6 rounded-full text-xs sm:text-sm font-extrabold text-white no-underline flex items-center justify-center whitespace-nowrap transition-transform hover:-translate-y-0.5"
                  style={{ background: BRAND, boxShadow: "0 8px 24px -4px rgba(16,185,129,0.35)" }}
                >
                  Book a Free Demo →
                </Link>

                <Link
                  to="/contact-ad"
                  className="h-12 px-5 rounded-full text-xs sm:text-sm font-extrabold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 no-underline flex items-center justify-center gap-2 whitespace-nowrap transition-all"
                >
                  <span className="text-sm">💬</span>
                  <span>Contact</span>
                </Link>

                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-12 px-5 rounded-full text-xs sm:text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
                >
                  <span className="text-xs">▶</span>
                  <span>How It Works</span>
                </button>
              </div>
            </Reveal>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CallPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Primary service card ───
   One accent colour, one hover target, one entrance. The previous version
   stacked five overlapping decorative layers and five nested hover groups. */
function ServiceCard({ service, index }: { service: typeof PRIMARY_SERVICES[0]; index: number }) {
  const reveal = useRevealProps();

  return (
    <motion.article
      {...reveal(index * 0.08)}
      className="group relative flex h-full flex-col rounded-3xl border bg-white p-7 sm:p-8 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1"
      style={{
        borderColor: HAIRLINE,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 18px 48px -28px rgba(15,23,42,0.18)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${service.color}55`;
        e.currentTarget.style.boxShadow = `0 1px 2px rgba(15,23,42,0.04), 0 26px 60px -26px ${service.color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = HAIRLINE;
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04), 0 18px 48px -28px rgba(15,23,42,0.18)";
      }}
    >
      {/* Single accent rule along the top edge */}
      <span
        aria-hidden="true"
        className="absolute inset-x-7 top-0 h-[3px] rounded-b"
        style={{ background: `linear-gradient(90deg, ${service.color}, ${service.color}00)` }}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-105"
          style={{ background: `${service.color}0f`, border: `1px solid ${service.color}26` }}
        >
          {service.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold leading-tight" style={{ color: INK }}>{service.title}</h3>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: service.color, fontFamily: MONO }}>
            {service.tagline}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed" style={{ color: SLATE }}>
        {service.description}
      </p>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {service.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border px-2 py-3 text-center"
            style={{ background: TINT, borderColor: HAIRLINE }}
          >
            <div className="text-lg font-black tracking-tight" style={{ color: service.color, fontFamily: MONO }}>
              <AnimatedValue value={metric.value} />
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTE }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mt-6">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTE, fontFamily: MONO }}>
          What's included
        </h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: INK }}>
              <span
                aria-hidden="true"
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                style={{ background: service.color }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Use cases */}
      <div className="mt-6">
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTE, fontFamily: MONO }}>
          Best for
        </h4>
        <ul className="space-y-1">
          {service.useCases.map((useCase) => (
            <li
              key={useCase.title}
              className="flex items-start gap-3 rounded-xl p-2.5 transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${service.color}0a`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span className="mt-0.5 flex-shrink-0 text-base" aria-hidden="true">{useCase.icon}</span>
              <div>
                <div className="text-xs font-bold" style={{ color: INK }}>{useCase.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug" style={{ color: SLATE }}>{useCase.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs pinned to the bottom so both cards align */}
      <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-5" style={{ borderColor: HAIRLINE, marginTop: "auto", paddingTop: 20 }}>
        <Link
          to="/register"
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white no-underline transition-transform hover:-translate-y-0.5"
          style={{ background: service.color, boxShadow: `0 8px 20px -8px ${service.color}` }}
        >
          <span>Get Started</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          to="/contact-ad"
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold no-underline transition-colors hover:bg-slate-100"
          style={{ background: SURFACE, borderColor: HAIRLINE, color: SLATE }}
        >
          <span aria-hidden="true">💬</span>
          <span>Talk to Sales</span>
        </Link>
      </div>
    </motion.article>
  );
}

/* ─── Supporting module card ─── */
function SupportingCard({ service, index }: { service: typeof SUPPORTING_SERVICES[0]; index: number }) {
  const reveal = useRevealProps();

  return (
    <motion.article
      {...reveal(index * 0.06)}
      className="flex h-full flex-col rounded-2xl border p-5 transition-transform duration-300 hover:-translate-y-1"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.09)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{ background: `${service.color}1f`, border: `1px solid ${service.color}3d` }}
        >
          {service.icon}
        </div>
        <div className="text-right">
          <div className="text-sm font-black leading-none" style={{ color: service.color, fontFamily: MONO }}>
            {service.stat.value}
          </div>
          <div className="mt-1 text-[9px] font-medium text-slate-400">{service.stat.label}</div>
        </div>
      </div>

      <h3 className="mt-4 text-sm font-bold text-white">{service.title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">{service.description}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {service.features.map((f) => (
          <li
            key={f}
            className="rounded-lg px-2 py-1 text-[10px] font-medium text-slate-300"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {f}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

/* ─── Services Section ─── */
function ServicesSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <Reveal>
        <div className="text-center mb-14">
          <div className="flex justify-center">
            <SectionLabel text="Our Services" tone="dark" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-4">
            Chat & Voice <GradientText>AI Solutions</GradientText>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Two core agents, plus the modules that make them useful on day one. Deploy what you need and add the rest
            when you're ready.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {PRIMARY_SERVICES.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </div>

      {/* Supporting modules */}
      <div className="mt-16">
        <Reveal>
          <div className="text-center mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Included with every plan
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Native modules that extend both agents — no extra vendors, no separate contracts.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUPPORTING_SERVICES.map((service, index) => (
            <SupportingCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Capability matrix ───
   Grouped by area, with a third "partial" state the old ✅/❌ table couldn't
   express. Support level is conveyed by text as well as glyph, so it survives
   screen readers and colour-blind viewing. */
type Support = "full" | "partial" | "none";

const CAPABILITY_GROUPS: { group: string; rows: { feature: string; chat: Support; voice: Support; note?: string }[] }[] = [
  {
    group: "Channels",
    rows: [
      { feature: "Website widget", chat: "full", voice: "none" },
      { feature: "Phone calls (inbound & outbound)", chat: "none", voice: "full" },
      { feature: "WhatsApp", chat: "full", voice: "full" },
      { feature: "Instagram & Facebook DMs", chat: "full", voice: "none" },
    ],
  },
  {
    group: "Conversation",
    rows: [
      { feature: "Natural language understanding", chat: "full", voice: "full" },
      { feature: "Real-time interruption handling", chat: "partial", voice: "full", note: "Chat has no barge-in to handle" },
      { feature: "Multi-language support", chat: "full", voice: "full" },
      { feature: "Handover to a human agent", chat: "full", voice: "full" },
    ],
  },
  {
    group: "Automation",
    rows: [
      { feature: "Lead qualification", chat: "full", voice: "full" },
      { feature: "Appointment scheduling", chat: "full", voice: "full" },
      { feature: "Document & file collection", chat: "full", voice: "none" },
      { feature: "CRM sync", chat: "full", voice: "full" },
    ],
  },
  {
    group: "Operations",
    rows: [
      { feature: "Full transcripts", chat: "full", voice: "full" },
      { feature: "Sentiment scoring", chat: "partial", voice: "full", note: "Tone signals are richer on voice" },
      { feature: "Concurrent sessions at scale", chat: "full", voice: "full" },
    ],
  },
];

const SUPPORT_META: Record<Support, { glyph: string; text: string; color: string }> = {
  full: { glyph: "●", text: "Supported", color: "#10B981" },
  partial: { glyph: "◐", text: "Partial", color: "#F59E0B" },
  none: { glyph: "—", text: "Not applicable", color: "#cbd5e1" },
};

function SupportCell({ level, note }: { level: Support; note?: string }) {
  const meta = SUPPORT_META[level];
  return (
    <td className="p-4 text-center align-middle">
      <span
        title={note ?? meta.text}
        className="inline-flex items-center gap-1.5 text-sm font-bold"
        style={{ color: meta.color }}
      >
        <span aria-hidden="true">{meta.glyph}</span>
        <span className="sr-only">{note ? `${meta.text} — ${note}` : meta.text}</span>
      </span>
    </td>
  );
}

function ComparisonSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <Reveal>
        <div className="text-center">
          <div className="flex justify-center">
            <SectionLabel text="Compare Solutions" />
          </div>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, letterSpacing: "-0.025em", color: INK, margin: "0 0 10px" }}>
            Which <GradientText>agent fits</GradientText> your workflow?
          </h2>
          <p style={{ fontSize: 14, color: SLATE, marginBottom: 20, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            Most teams run both. This is where each one genuinely differs.
          </p>

          {/* Legend */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            {(Object.keys(SUPPORT_META) as Support[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: SLATE }}>
                <span aria-hidden="true" style={{ color: SUPPORT_META[k].color }}>{SUPPORT_META[k].glyph}</span>
                {SUPPORT_META[k].text}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="overflow-x-auto rounded-2xl" style={{ boxShadow: "0 8px 32px -16px rgba(0,0,0,0.08)" }}>
          <table className="w-full border-collapse" style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 16 }}>
            <caption className="sr-only">
              Capability comparison between the AI Chatbot and the Voice Assistant
            </caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                <th scope="col" className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: MUTE, fontFamily: MONO }}>
                  Capability
                </th>
                <th scope="col" className="p-4 text-center text-sm font-bold whitespace-nowrap" style={{ color: PRIMARY_SERVICES[0].color }}>
                  💬 Chatbot
                </th>
                <th scope="col" className="p-4 text-center text-sm font-bold whitespace-nowrap" style={{ color: PRIMARY_SERVICES[1].color }}>
                  🎙️ Voice
                </th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_GROUPS.map((g) => (
                <Fragment key={g.group}>
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={3}
                      className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ background: TINT, color: SLATE, fontFamily: MONO, borderBottom: `1px solid ${HAIRLINE}` }}
                    >
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((row) => (
                    <tr key={row.feature} className="transition-colors hover:bg-slate-50" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <th scope="row" className="p-4 text-left text-sm font-medium" style={{ color: INK }}>
                        {row.feature}
                      </th>
                      <SupportCell level={row.chat} note={row.note} />
                      <SupportCell level={row.voice} note={row.note} />
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}

/* ─── How It Works ─── */
const STEPS = [
  { step: "01", title: "Create Your Agent", desc: "Write a custom prompt or pick a template. Set your brand color and welcome message.", icon: "🧠", color: "#2563EB" },
  { step: "02", title: "Connect Channels", desc: "Enable WhatsApp or copy the embed code for your website. Takes under 2 minutes.", icon: "🔗", color: "#10B981" },
  { step: "03", title: "Go Live & Scale", desc: "Your agent handles conversations on every channel simultaneously. Scale to thousands.", icon: "🚀", color: "#f97316" },
];

function HowItWorks() {
  const reveal = useRevealProps();
  const reduced = useReducedMotion() ?? false;

  return (
    <div id="how-it-works" className="max-w-6xl mx-auto relative">
      <Reveal>
        <div className="text-center mb-16">
          <div className="flex justify-center">
            <SectionLabel text="How It Works" />
          </div>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, margin: "0 0 10px" }}>
            Deploy in <GradientText>3 Simple Steps</GradientText>
          </h2>
          <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: SLATE }}>
            Get your custom AI agent trained and live on your channels in under 48 hours.
          </p>
        </div>
      </Reveal>

      <div className="relative">
        <motion.div
          className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 z-0 pointer-events-none origin-left"
          style={{ borderTop: "2px dashed rgba(148,163,184,0.4)" }}
          initial={{ scaleX: reduced ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: reduced ? 0 : 0.9, ease: EASE, delay: 0.15 }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {STEPS.map((item, index) => (
            <motion.div
              {...reveal(index * 0.08)}
              key={item.step}
              className="rounded-3xl p-8 bg-white border flex flex-col items-center text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5"
              style={{ borderColor: HAIRLINE, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 18px 44px -28px rgba(15,23,42,0.18)" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-6 relative"
                style={{ background: `${item.color}0f`, border: `2.5px solid ${item.color}2e` }}
              >
                {item.icon}
                <span
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                  style={{ background: item.color, fontFamily: MONO }}
                >
                  {item.step}
                </span>
              </div>

              <h3 className="text-base font-extrabold mb-2" style={{ color: INK }}>{item.title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed max-w-[240px]" style={{ color: SLATE }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trusted Brands ─── */
function TrustedSection() {
  const TRUSTED_BRANDS = ["RealtyMax", "Care+ Clinics", "LearnUp", "The Skin Lounge", "EduSphere", "FitNation", "UrbanCart", "FinTrack"];

  return (
    <div className="max-w-6xl mx-auto" style={{ textAlign: "center" }}>
      <Reveal>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: MUTE, fontFamily: MONO, marginBottom: 24 }}>
          ● TRUSTED BY 500+ BUSINESSES ●
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {TRUSTED_BRANDS.map((b) => (
            <span
              key={b}
              className="px-4 py-2.5 rounded-xl text-xs font-medium transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}
            >
              {b}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/* ─── Integrations Wall ─── */
function IntegrationsSection() {
  const integrations = [
    { name: "Azure", icon: "☁️" }, { name: "Gemini", icon: "💎" }, { name: "Anthropic", icon: "🧠" }, { name: "Groq", icon: "⚡" },
    { name: "Cartesia", icon: "🎙️" }, { name: "Make", icon: "🔄" }, { name: "n8n", icon: "🔗" }, { name: "Google Calendar", icon: "📅" },
    { name: "WhatsApp", icon: "💬" }, { name: "Discord", icon: "💜" }, { name: "Instagram", icon: "📸" }, { name: "Facebook", icon: "👤" },
    { name: "Telegram", icon: "✈️" }, { name: "Google Docs", icon: "📄" }, { name: "Microsoft", icon: "🪟" }, { name: "Twilio", icon: "📞" },
  ];

  return (
    <div className="max-w-6xl mx-auto text-center overflow-hidden">
      <Reveal>
        <div className="flex justify-center">
          <SectionLabel text="Integrations" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold mb-3" style={{ color: INK }}>
          Seamlessly plugs into <GradientText>your tech stack</GradientText>
        </h2>
        <p className="text-sm max-w-md mx-auto mb-10" style={{ color: SLATE }}>
          Autoniv connects directly with the platforms, CRMs, and LLMs you already use.
        </p>
      </Reveal>

      <div className="relative flex overflow-x-hidden py-4">
        <div className="flex gap-4 animate-marquee whitespace-nowrap min-w-full">
          {integrations.concat(integrations).map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border shadow-sm"
              style={{ borderColor: HAIRLINE }}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-sm font-semibold" style={{ color: SLATE }}>{item.name}</span>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
            mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          }
          .animate-marquee:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .animate-marquee { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ─── Global Stats ─── */
function GlobalStats() {
  const reveal = useRevealProps();

  return (
    <div>
      <Reveal>
        <div className="text-center">
          <div className="flex justify-center">
            <SectionLabel text="By the Numbers" />
          </div>
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, letterSpacing: "-0.025em", color: INK, margin: "0 0 28px" }}>
            Autoniv in <GradientText>Numbers</GradientText>
          </h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {GLOBAL_STATS.map((s, i) => (
          <motion.div key={s.label} {...reveal(i * 0.06)}>
            <StatCard value={s.value} label={s.label} description={s.desc} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const reveal = useRevealProps();

  return (
    <section
      className="section-box white"
      style={{ background: "linear-gradient(135deg,#eff6ff 0%,#f0fdf9 100%)", border: "1.5px solid rgba(37,99,235,0.14)", boxShadow: "0 20px 56px -16px rgba(37,99,235,0.14)" }}
    >
      <div className="section-pad text-center relative overflow-hidden">
        <CTADecorations />
        <div className="relative z-10">
          <motion.h2
            {...reveal()}
            style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, margin: "0 0 16px", lineHeight: 1.15 }}
          >
            Deploy Your <GradientText>AI Assistant</GradientText> Today
          </motion.h2>
          <motion.p
            {...reveal(0.08)}
            style={{ fontSize: 15, color: SLATE, maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}
          >
            Join 500+ businesses already growing with Autoniv.
          </motion.p>
          <motion.div {...reveal(0.16)} className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full text-sm font-bold text-white no-underline inline-block text-center transition-transform hover:-translate-y-0.5"
              style={{ background: BRAND, boxShadow: "0 8px 26px -4px rgba(16,185,129,0.34)" }}
            >
              Book a Demo →
            </Link>
            <Link
              to="/dashboard/support"
              className="px-8 py-4 rounded-full text-sm font-bold no-underline inline-block text-center transition-transform hover:-translate-y-0.5"
              style={{ background: SURFACE, border: "1.5px solid rgba(15,23,42,0.10)", color: "#475569" }}
            >
              🎧 Talk to Expert
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Scroll progress bar ─── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      setProgress(scrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${progress * 100}%`,
        background: "linear-gradient(90deg, #2563EB, #10B981)",
        zIndex: 100,
        transformOrigin: "left",
      }}
    />
  );
}

/* ─── Main ─── */
export function Agents() {
  useEffect(() => {
    const schemas = [
      { id: 'service-voice', schema: SERVICE_SCHEMAS.voiceAgent },
      { id: 'service-chat', schema: SERVICE_SCHEMAS.chatAgent },
      { id: 'service-phone', schema: SERVICE_SCHEMAS.phoneAnswering },
      { id: 'service-appointment', schema: SERVICE_SCHEMAS.appointmentBooking },
    ];
    const cleanups = schemas.map(({ id, schema }) => injectSchema(id, schema));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: TINT, fontFamily: SANS, color: INK }}>
      <ScrollProgress />
      <USPSlider />
      <PublicNavbar />

      <div className="page-bg" style={{ paddingTop: 130, paddingBottom: 8 }}>
        <div className="box-wrap">
          <Hero />

          {/* ── Stats ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {HERO_STATS.map((s) => (
                    <StatCard key={s.label} value={s.value} label={s.label} description={s.desc} />
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Services ── */}
          <section className="section-box black relative" style={{ background: "#030812" }}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60vw 40vw at 10% 0%, rgba(37,99,235,0.10), transparent 60%), radial-gradient(50vw 40vw at 90% 100%, rgba(16,185,129,0.09), transparent 60%)",
              }}
            />
            <div className="section-pad max-w-6xl mx-auto relative z-10">
              <ServicesSection />
            </div>
          </section>

          {/* ── Comparison ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <ComparisonSection />
            </div>
          </section>

          {/* ── How It Works ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <HowItWorks />
            </div>
          </section>

          {/* ── Pricing ── */}
          <PricingSection />

          {/* ── Trusted Brands ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <TrustedSection />
            </div>
          </section>

          {/* ── Integrations ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <IntegrationsSection />
            </div>
          </section>

          {/* ── Global Stats ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <GlobalStats />
            </div>
          </section>

          {/* ── CTA ── */}
          <CTASection />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Agents;
