import { useRef } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { PublicNavbar } from "../../components/PublicNavbar";
import { USPSlider } from "./sections/USPSlider";
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, Reveal, SectionLabel, GradientText, StatCard, CTADecorations } from './design';
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Pricing as PricingSection } from "./sections/Pricing";
import { injectSchema, SERVICE_SCHEMAS } from "../../utils/schema";

const EASE = [0.16, 1, 0.3, 1] as const;

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

// ─── Services Data ───
const SERVICES = [
  {
    id: "chat",
    title: "AI Chatbot",
    icon: "💬",
    color: "#2563EB",
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

// ─── Animated counter ───
function AnimatedValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
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

/* ─── Live call preview (hero visual) ─── */
const TRANSCRIPT = [
  { from: "ai", text: "Hi! Thanks for calling Autoniv. How can I help you today?" },
  { from: "user", text: "I'd like to book a demo for next week." },
  { from: "ai", text: "Absolutely — I have Tuesday 2pm or Wednesday 11am open." },
  { from: "user", text: "Wednesday works great." },
  { from: "ai", text: "Done ✓ You're booked for Wed 11am. Confirmation sent!" },
];

function LiveWave() {
  const bars = Array.from({ length: 28 });
  return (
    <div className="flex items-center gap-[3px] h-6">
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
  const [count, setCount] = useState(2);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c >= TRANSCRIPT.length ? 2 : c + 1));
    }, 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
      className="relative w-full max-w-[400px] rounded-3xl overflow-hidden"
      style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, boxShadow: "0 30px 70px -24px rgba(37,99,235,0.28), 0 2px 8px rgba(15,23,42,0.05)" }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg,#eff6ff,#f0fdf9)", border: "1px solid rgba(37,99,235,0.14)" }}>
            🎙️
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: INK }}>Autoniv Voice Agent</div>
            <div className="flex items-center gap-1.5">
              <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
              <span className="text-[11px] font-medium" style={{ color: "#10B981", fontFamily: MONO }}>LIVE · 00:42</span>
            </div>
          </div>
        </div>
        <LiveWave />
      </div>

      {/* transcript */}
      <div className="px-5 py-5 space-y-3 min-h-[280px]">
        <AnimatePresence initial={false}>
          {TRANSCRIPT.slice(0, count).map((m, i) => (
            <motion.div
              key={`${i}-${m.text.slice(0, 8)}`}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] px-4 py-2.5 text-[13px] leading-snug"
                style={
                  m.from === "user"
                    ? { background: BRAND, color: "#fff", borderRadius: "16px 16px 4px 16px" }
                    : { background: "#f1f5f9", color: INK, borderRadius: "16px 16px 16px 4px" }
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* footer metric strip */}
      <div className="grid grid-cols-3 px-5 py-4" style={{ borderTop: `1px solid ${HAIRLINE}`, background: "#fafcff" }}>
        {[
          { v: "0.3s", l: "Latency" },
          { v: "98%", l: "Accuracy" },
          { v: "50+", l: "Languages" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-sm font-bold font-mono" style={{ color: "#2563EB" }}>{s.v}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: MUTE }}>{s.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="section-box tint">
      <div className="max-w-6xl mx-auto section-pad relative" style={{ zIndex: 1 }}>
        {/* Ambient drifting orbs */}
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

        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <Reveal>
              <div className="flex justify-center lg:justify-start">
                <SectionLabel text="AI Services · Powered by Autoniv" />
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                style={{ fontSize: "clamp(30px,4.4vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, lineHeight: 1.1, margin: "0 0 16px" }}
              >
                Chat & Voice <GradientText>AI Solutions</GradientText> that never sleep
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.22 }}
                style={{ fontSize: 15.5, color: SLATE, maxWidth: 520, lineHeight: 1.65, margin: "0 0 28px" }}
                className="mx-auto lg:mx-0"
              >
                Deploy intelligent chat and voice assistants that work 24/7 to engage customers, qualify leads, and drive
                conversions — across every channel.
              </motion.p>

              {/* trust chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
                className="flex flex-wrap justify-center lg:justify-start gap-2 mb-7"
              >
                {["No-code setup", "Live in 48h", "50+ languages"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}>
                    <span style={{ color: "#10B981" }}>✓</span> {t}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.38 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="px-8 py-3.5 rounded-full text-sm font-bold text-white no-underline text-center inline-block"
                    style={{ background: BRAND, boxShadow: "0 8px 26px -4px rgba(16,185,129,0.34)" }}
                  >
                    Book a Free Demo →
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-3.5 rounded-full text-sm font-bold text-center"
                    style={{ background: SURFACE, border: "1.5px solid rgba(15,23,42,0.10)", color: "#475569", cursor: "pointer" }}
                  >
                    ▶ See How It Works
                  </button>
                </motion.div>
              </motion.div>
            </Reveal>
          </div>

          {/* Right: live call preview */}
          <div className="flex justify-center lg:justify-end">
            <CallPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Service Card ─── */
function ServiceCard({ service, index }: { service: typeof SERVICES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: EASE }}
      whileHover={{ y: -12, scale: 1.02 }}
      className="group rounded-2xl p-8 h-full flex flex-col justify-between border relative overflow-hidden bg-white transition-shadow duration-300"
      style={{ borderColor: "rgba(37, 99, 235, 0.08)", boxShadow: "0 8px 32px -12px rgba(0,0,0,0.08), 0 2px 8px -4px rgba(0,0,0,0.04)" }}
    >
      <div
        className="absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{ background: `linear-gradient(135deg, ${service.color}, rgba(37,99,235,0.2))` }}
      />
      <div className="absolute inset-0 rounded-2xl bg-white group-hover:bg-white/95 transition-colors duration-300 z-0" />

      <motion.div
        className="absolute -top-28 -right-28 w-[380px] h-[380px] rounded-full blur-[120px] pointer-events-none opacity-25 group-hover:opacity-40"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.3 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        style={{ background: `radial-gradient(circle, ${service.color}15 0%, rgba(37,99,235,0.08) 50%, transparent 70%)` }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      />

      <motion.div
        className="absolute top-12 bottom-12 left-0 w-1.5 rounded-r-full origin-top"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
        style={{ background: `linear-gradient(180deg, ${service.color}40, ${service.color}10)`, opacity: 0.6, boxShadow: `0 0 20px ${service.color}30` }}
        whileHover={{ scaleY: 1.2 }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
        style={{ background: `linear-gradient(90deg, transparent, ${service.color}40, transparent)`, boxShadow: `0 0 20px ${service.color}30` }}
      />

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-6 relative group/header">
          <motion.div
            whileHover={{ scale: 1.15, rotate: -8, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f8faff, #f0f5ff)", border: `1px solid ${service.color}20`, boxShadow: `0 4px 16px ${service.color}10` }}
          >
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover/header:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle, ${service.color}20 0%, transparent 70%)` }}
            />
            <span className="relative z-10">{service.icon}</span>
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{service.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-blue-200/60 cursor-default"
                style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf9)", color: "#2563EB", boxShadow: "0 1px 3px rgba(37,99,235,0.08)" }}
              >
                {service.features.length} features
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-gray-200/60 cursor-default"
                style={{ background: "linear-gradient(135deg, #f9fafb, #f3f4f6)", color: "#4b5563", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                {service.useCases.length} use cases
              </motion.span>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-6 text-gray-600 relative z-10 transition-colors duration-300 group-hover:text-gray-800">
          {service.description}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
          {service.metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.05, y: -3, boxShadow: `0 8px 20px ${service.color}20`, borderColor: `${service.color}40` }}
              className="text-center p-3.5 rounded-xl border cursor-pointer relative overflow-hidden group/metric"
              style={{ background: "linear-gradient(135deg, #fafcff, #f0f7ff)", borderColor: "#e2e8f0" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover/metric:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${service.color}10, transparent)` }}
              />
              <div className="relative z-10">
                <motion.div className="text-lg font-bold font-mono tracking-tight" style={{ color: service.color }} whileHover={{ scale: 1.1 }}>
                  <AnimatedValue value={metric.value} />
                </motion.div>
                <div className="text-[9px] font-medium uppercase tracking-wider text-gray-500 mt-1.5">{metric.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 relative z-10">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 text-blue-500">What's included</div>
          <div className="flex flex-wrap gap-1.5">
            {service.features.map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05, y: -2, background: `${service.color}08`, borderColor: `${service.color}30` }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer group/feature"
                style={{ background: "#fafcff", borderColor: "#eef2f6", color: "#4a5568" }}
              >
                <motion.span style={{ color: service.color, fontSize: 8 }} className="group-hover/feature:scale-125 transition-transform">
                  ●
                </motion.span>{" "}
                {f}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 text-blue-500">Best for</div>
          <div className="space-y-2">
            {service.useCases.map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                whileHover={{ x: 4, background: `${service.color}05`, borderColor: `${service.color}20`, y: -2 }}
                className="flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer group/useCase"
                style={{ background: "transparent", borderColor: "transparent" }}
              >
                <motion.span
                  className="text-sm p-1.5 rounded-lg bg-blue-50/60 flex-shrink-0 mt-0.5 border border-blue-100/30 group-hover/useCase:scale-110 group-hover/useCase:bg-blue-50/80 transition-transform"
                  whileHover={{ rotate: 5 }}
                >
                  {useCase.icon}
                </motion.span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{useCase.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{useCase.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px mb-5 bg-gradient-to-r from-blue-200/20 via-blue-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
        <Link
          to="/register"
          className="text-sm font-semibold flex items-center justify-center gap-2 py-3 px-6 rounded-xl no-underline cursor-pointer relative overflow-hidden group/cta"
          style={{ background: "linear-gradient(135deg, #f8faff, #f0f5ff)", border: "1.5px solid #e2e8f0", color: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.08)" }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover/cta:opacity-100"
            style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.7) 50%, transparent 70%)" }}
            initial={{ x: "-120%" }}
            whileHover={{ x: "120%" }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          <span className="relative z-10 flex items-center gap-2 transition-all duration-300 group-hover/cta:gap-3">
            Get Started
            <motion.svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" whileHover={{ x: 3, strokeWidth: 2.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </motion.svg>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ─── Services Section ─── */
function ServicesSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <Reveal>
        <div className="text-center mb-14">
          <SectionLabel text="Our Services" />
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-4">
            Chat & Voice <GradientText>AI Solutions</GradientText>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Choose the right AI assistant for your business needs or combine both for omnichannel customer
            engagement.
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {SERVICES.map((service, index) => (
          <div key={service.id} className="group relative h-full">
            <ServiceCard service={service} index={index} />
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: service.color }} />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: service.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comparison Section ─── */
const COMPARISON_ROWS = [
  { feature: "24/7 Availability", chat: "✅", voice: "✅" },
  { feature: "Natural Language Processing", chat: "✅", voice: "✅" },
  { feature: "Multi-language Support", chat: "✅", voice: "✅" },
  { feature: "Real-time Responses", chat: "✅", voice: "✅" },
  { feature: "Phone Call Handling", chat: "❌", voice: "✅" },
  { feature: "Website Widget", chat: "✅", voice: "❌" },
  { feature: "WhatsApp Integration", chat: "✅", voice: "✅" },
  { feature: "Appointment Scheduling", chat: "✅", voice: "✅" },
  { feature: "CRM Integration", chat: "✅", voice: "✅" },
  { feature: "Lead Qualification", chat: "✅", voice: "✅" },
];

function ComparisonSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <Reveal>
        <div className="text-center">
          <SectionLabel text="Compare Solutions" />
          <h2 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 800, letterSpacing: "-0.025em", color: INK, margin: "0 0 10px" }}>
            Choose Your <GradientText>AI Assistant</GradientText>
          </h2>
          <p style={{ fontSize: 14, color: SLATE, marginBottom: 36 }}>
            Compare features and capabilities to find the perfect fit for your business.
          </p>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="overflow-x-auto rounded-2xl" style={{ boxShadow: "0 8px 32px -16px rgba(0,0,0,0.06)" }}>
          <table className="w-full rounded-2xl" style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: MUTE, fontFamily: MONO }}>
                  Feature
                </th>
                <th className="p-4 text-center text-sm font-bold" style={{ color: SERVICES[0].color }}>
                  💬 Chat Assistant
                </th>
                <th className="p-4 text-center text-sm font-bold" style={{ color: SERVICES[1].color }}>
                  🎙️ Voice Assistant
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
                  whileHover={{ backgroundColor: "rgba(37,99,235,0.025)" }}
                  style={{ borderBottom: i < COMPARISON_ROWS.length - 1 ? `1px solid ${HAIRLINE}` : "none" }}
                >
                  <td className="p-4 text-sm font-medium" style={{ color: INK }}>
                    {row.feature}
                  </td>
                  <td className="p-4 text-center text-lg" style={{ color: SERVICES[0].color }}>
                    <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 + 0.15, type: "spring", stiffness: 400, damping: 18 }}>
                      {row.chat}
                    </motion.span>
                  </td>
                  <td className="p-4 text-center text-lg" style={{ color: SERVICES[1].color }}>
                    <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 + 0.22, type: "spring", stiffness: 400, damping: 18 }}>
                      {row.voice}
                    </motion.span>
                  </td>
                </motion.tr>
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
  { step: "01", title: "Create Your Chatbot", desc: "Write a custom prompt or pick a template. Set your brand color and welcome message.", icon: "🧠", color: "#2563EB" },
  { step: "02", title: "Connect Channels", desc: "Enable WhatsApp or copy the embed code for your website. Takes under 2 minutes.", icon: "🔗", color: "#10B981" },
  { step: "03", title: "Go Live & Scale", desc: "Your chatbot handles conversations on WhatsApp and web simultaneously. Scale to thousands.", icon: "🚀", color: "#f97316" },
];

function HowItWorks() {
  return (
    <div id="how-it-works" className="max-w-6xl mx-auto relative">
      <Reveal>
        <div className="text-center mb-16">
          <SectionLabel text="How It Works" />
          <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, margin: "0 0 10px" }}>
            Deploy in <GradientText>3 Simple Steps</GradientText>
          </h2>
          <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: SLATE }}>
            Get your custom AI agent trained and live on your channels in under 48 hours.
          </p>
        </div>
      </Reveal>

      <div className="relative">
        {/* Connection line that draws in on scroll */}
        <motion.div
          className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 z-0 pointer-events-none origin-left"
          style={{ borderTop: "2px dashed rgba(148,163,184,0.4)" }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {STEPS.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: EASE }}
              whileHover={{ y: -6, borderColor: item.color, boxShadow: `0 20px 40px -10px ${item.color}26` }}
              key={item.step}
              className="rounded-3xl p-8 bg-white border border-slate-200/50 flex flex-col items-center text-center group cursor-default"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.5, ease: EASE }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-6 relative z-10"
                style={{ background: `${item.color}0c`, border: `2.5px solid ${item.color}25` }}
              >
                {item.icon}
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-[9px] font-black text-white flex items-center justify-center font-mono"
                  style={{ background: item.color }}
                >
                  {item.step}
                </div>
              </motion.div>

              <h3 className="text-base font-extrabold mb-2 text-slate-900">{item.title}</h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-500 max-w-[240px]">{item.desc}</p>
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
          {TRUSTED_BRANDS.map((b, i) => (
            <motion.span
              key={b}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
              whileHover={{ y: -3, borderColor: "rgba(37,99,235,0.25)", boxShadow: "0 8px 18px rgba(37,99,235,0.08)" }}
              className="px-4 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}
            >
              {b}
            </motion.span>
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
        <div className="mb-6">
          <SectionLabel text="Integrations" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-3">
          Seamlessly plugs into <GradientText>your tech stack</GradientText>
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-10">
          Autoniv connects directly with the platforms, CRMs, and LLMs you already use.
        </p>
      </Reveal>

      <div className="relative flex overflow-x-hidden py-4">
        <div className="flex gap-4 animate-marquee whitespace-nowrap min-w-full">
          {integrations.concat(integrations).map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3, scale: 1.04, borderColor: "rgba(37,99,235,0.25)", boxShadow: "0 10px 22px rgba(37,99,235,0.1)" }}
              transition={{ duration: 0.2, ease: EASE }}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{item.name}</span>
            </motion.div>
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
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </div>
  );
}

/* ─── Global Stats ─── */
function GlobalStats() {
  return (
    <div>
      <Reveal>
        <div className="text-center">
          <SectionLabel text="By the Numbers" />
          <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, letterSpacing: "-0.025em", color: INK, margin: "0 0 28px" }}>
            Autoniv in <GradientText>Numbers</GradientText>
          </h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {GLOBAL_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            whileHover={{ y: -4 }}
          >
            <StatCard value={s.value} label={s.label} description={s.desc} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section
      className="section-box white"
      style={{ background: "linear-gradient(135deg,#eff6ff 0%,#f0fdf9 100%)", border: "1.5px solid rgba(37,99,235,0.14)", boxShadow: "0 20px 56px -16px rgba(37,99,235,0.14)" }}
    >
      <div className="section-pad text-center relative overflow-hidden">
        <CTADecorations />
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, margin: "0 0 16px", lineHeight: 1.15 }}
          >
            Deploy Your <GradientText>AI Assistant</GradientText> Today
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            style={{ fontSize: 15, color: SLATE, maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}
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
              <Link
                to="/register"
                className="px-8 py-4 rounded-full text-sm font-bold text-white no-underline inline-block text-center"
                style={{ background: BRAND, boxShadow: "0 8px 26px -4px rgba(16,185,129,0.34)" }}
              >
                Book a Demo →
              </Link>
            </motion.div>
             <motion.div whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/dashboard/support"
                className="px-8 py-4 rounded-full text-sm font-bold no-underline inline-block text-center"
                style={{ background: SURFACE, border: "1.5px solid rgba(15,23,42,0.10)", color: "#475569" }}
              >
                🎧 Talk to Expert
              </Link>
            </motion.div>
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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
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
      transition={{ ease: "linear" }}
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
                  {HERO_STATS.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
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

          {/* ── Services Section ── */}
          <section className="section-box black relative" style={{ background: "#030812" }}>
            <motion.div
              className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"
              animate={{ x: [0, -26, 0], y: [0, 22, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="section-pad max-w-6xl mx-auto relative z-10">
              <ServicesSection />
            </div>
          </section>

          {/* ── Comparison Section ── */}
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

          {/* ── Pricing Section ── */}
          <PricingSection />

          {/* ── Trusted Brands ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <TrustedSection />
            </div>
          </section>

          {/* ── Integrations Section ── */}
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