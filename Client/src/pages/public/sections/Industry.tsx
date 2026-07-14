import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { useCases, integrationsRow1, integrationsRow2 } from "./data";
import { Reveal } from "./utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = "login" | "register";


interface OutcomeItem {
  label: string;
  value: string;
}

interface ModeVariant {
  desc: string;
  stat: string;
  outcomes: OutcomeItem[];
  features: string[];
  cta: string;
}

interface UseCase {
  icon: string;
  title: string;
  chat: ModeVariant;
  voice: ModeVariant;
}

interface IntegrationItem {
  icon: string;
  name: string;
}

interface IndustryProps {
  activeUseCase: number;
  setActiveUseCase: (i: number) => void;
  openAuth: (m: AuthMode) => void;
}

// ─── Motion presets ───────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;


// ─── Animated counter for stats ──────────────────────────────────────────────

function AnimatedStat({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(value.match(/^\D*0/) ? value : value);

  useEffect(() => {
    if (!inView) return;
    const numMatch = value.match(/[\d.]+/);
    if (!numMatch) {
      setDisplay(value);
      return;
    }
    const target = parseFloat(numMatch[0]);
    const prefix = value.slice(0, numMatch.index);
    const suffix = value.slice((numMatch.index ?? 0) + numMatch[0].length);
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


// ─────────────────────────────────────────────────────────────────────────────

function IntegrationRow({ items, direction = "normal" }: { items: IntegrationItem[]; direction?: "normal" | "reverse" }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background:
          direction === "normal"
            ? "linear-gradient(135deg, rgba(37,99,235,0.03), rgba(37,99,235,0.01))"
            : "linear-gradient(135deg, rgba(16,185,129,0.03), rgba(16,185,129,0.01))",
        border: "1px solid rgba(37,99,235,0.06)",
      }}
    >
      <div className="absolute inset-y-0 left-0 w-28 z-10 pointer-events-none" style={{ background: "linear-gradient(90deg, #f8fafc, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-28 z-10 pointer-events-none" style={{ background: "linear-gradient(270deg, #f8fafc, transparent)" }} />

      <div className={`flex gap-3 py-4 px-3 ${direction === "normal" ? "animate-marquee-left" : "animate-marquee-right"}`} style={{ width: "max-content" }}>
        {[...items, ...items, ...items].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.06, y: -2, boxShadow: "0 8px 20px rgba(37,99,235,0.12)" }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(37,99,235,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#475569" }}>
              {item.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const INTEGRATION_STATS = [
  { n: "40+", l: "Pre-built integrations" },
  { n: "∞", l: "Custom API possibilities" },
  { n: "5 min", l: "Average setup time" },
] as const;

export function Industry({ activeUseCase, setActiveUseCase, openAuth }: IndustryProps) {
  const uc = useCases[activeUseCase] as UseCase;

  const scrollToContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const CHAT_DIALOGUES = [
    // 0: Healthcare
    { q: "Hi! I need to book a check-up for tomorrow.", a: "Sure! Dr. Smith has slots at 10 AM or 2 PM. Which works best?" },
    // 1: Real Estate
    { q: "Hi, is the 2-bed apartment on Oak St still available?", a: "Yes! Would you like to schedule a viewing tour this afternoon?" },
    // 2: Financial Services
    { q: "When is my next loan installment due?", a: "Your payment of ₹15,000 is due on July 10th. Tap here to pay securely." },
    // 3: E-Commerce
    { q: "Where is my order #8492?", a: "It's on the way! Estimated delivery is tomorrow by 5 PM. Track here." },
    // 4: Education
    { q: "What is the fee structure for the MBA course?", a: "The tuition fee is ₹2.5 Lakhs per year. I can email you the brochure!" },
    // 5: Travel & Hospitality
    { q: "Can I upgrade my booking to a deluxe room?", a: "Yes, we have deluxe rooms available for ₹1,500 extra. Should I confirm?" }
  ];

  const VOICE_DIALOGUES = [
    // 0: Healthcare
    "Hello! Confirming your appointment for tomorrow at 10 AM.",
    // 1: Real Estate
    "Hi! I saw you inquired about the villa. Are you looking to buy or rent?",
    // 2: Financial Services
    "Hello, this is a friendly reminder that your EMI is due in 3 days.",
    // 3: E-Commerce
    "Hi, confirming that your return request for order #3928 is approved.",
    // 4: Education
    "Hi! Calling from EduLearn to help complete your admissions application.",
    // 5: Travel & Hospitality
    "Hello! Your flight booking is confirmed. Would you like to add meals?"
  ];

  return (
    <section id="industry" className="section-box white">
      <div className="section-pad relative overflow-hidden">
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.04) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%,black,transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 50%,black,transparent)",
          }}
        />

        {/* Decorative orbs — slow ambient drift */}
        <motion.div
          className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 left-[5%] w-[400px] h-[400px] rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: "radial-gradient(circle, #10B981, transparent 70%)" }}
          animate={{ x: [0, -24, 0], y: [0, 18, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* ── Header ── */}
          <Reveal className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="tag px-4 py-1.5 rounded-full inline-block text-xs font-bold tracking-wider uppercase"
              style={{ color: "#ffffff", background: "var(--gg)" }}
            >
              Industry Solutions
            </motion.span>

            <h2 className="font-extrabold tracking-tight mt-4" style={{ fontSize: "clamp(28px, 5vw, 48px)", color: "#0a0a0a" }}>
              Built for{" "}
              <span className="relative inline-block">
                <span className="gradient-text">every industry</span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-1 rounded-full"
                  style={{ background: "linear-gradient(90deg, #2563EB, #10B981)" }}
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                />
              </span>
            </h2>

            <p style={{ color: "#475569", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Highly functional, human-sounding AI voice and chat agents that can perform
              different tasks across industries without needing a break.
            </p>
          </Reveal>

          {/* ── Tabs Selection ── */}
          <Reveal className="flex justify-start lg:justify-center mb-12 overflow-x-auto pb-4 max-w-full px-4 md:px-8">
            <div className="inline-flex bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50 shadow-inner whitespace-nowrap">
              {useCases.map((caseItem, i) => (
                <button
                  key={i}
                  onClick={() => setActiveUseCase(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-350 border-none cursor-pointer`}
                  style={{
                    background: activeUseCase === i ? '#ffffff' : 'transparent',
                    color: activeUseCase === i ? '#10B981' : '#64748B',
                    boxShadow: activeUseCase === i ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <span style={{ color: activeUseCase === i ? '#10B981' : '#64748B', marginRight: '4px' }}>{caseItem.icon}</span>
                  {caseItem.title}
                </button>
              ))}
            </div>
          </Reveal>

          {/* ── Content Grid ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeUseCase}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20"
            >
              {/* Chat Card (Left) */}
              <div className="bg-[#f4f6fa]/60 border border-slate-200/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Visual */}
                <div className="relative w-full h-48 bg-gradient-to-tr from-emerald-50/20 to-teal-50/10 rounded-2xl border border-slate-100 flex items-center justify-center p-4 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_2rem] opacity-30" />
                  
                  <div className="w-full flex flex-col gap-2 z-10">
                    {/* Customer bubble */}
                    <div className="self-end bg-emerald-600 text-white rounded-2xl rounded-tr-none px-3.5 py-1.5 text-[10px] sm:text-xs max-w-[80%] shadow-sm">
                      {CHAT_DIALOGUES[activeUseCase]?.q || "Hi, I have a question."}
                    </div>
                    {/* Assistant bubble */}
                    <div className="self-start bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-none px-3.5 py-1.5 text-[10px] sm:text-xs max-w-[85%] shadow-sm flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">AI</span>
                      <span>{CHAT_DIALOGUES[activeUseCase]?.a || "Sure! Let me help you."}</span>
                    </div>
                  </div>
                </div>
                {/* Text Content */}
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">Chat Assistant</h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">
                        {uc.chat.stat}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{uc.chat.desc}</p>
                  </div>

                  {/* Capabilities checklist */}
                  <div className="grid gap-2">
                    {uc.chat.features.map((feat, j) => (
                      <div key={j} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="text-emerald-500 text-sm leading-none flex-shrink-0">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Outcomes panel */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/50">
                    {uc.chat.outcomes.map((item, j) => (
                      <div key={j} className="text-center p-2 rounded bg-white border border-slate-100 shadow-sm">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                        <span className="block text-sm font-extrabold text-slate-800 mt-0.5 font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => openAuth("register")}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm border-none cursor-pointer transition-all hover:opacity-90 mt-2"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}
                  >
                    {uc.chat.cta}
                  </button>
                </div>
              </div>

              {/* Voice Card (Right) */}
              <div className="bg-[#f4f6fa]/60 border border-slate-200/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Visual */}
                <div className="relative w-full h-48 bg-gradient-to-tr from-slate-50/50 to-emerald-50/10 rounded-2xl border border-slate-100 flex items-center justify-center gap-4 px-4 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_2rem] opacity-30" />
                  
                  {/* Customer profile bubble */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-2.5 z-10 w-[130px]">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      JS
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-800 truncate">John Smith</span>
                      <span className="text-[8px] text-slate-400">Customer</span>
                    </div>
                  </div>

                  {/* Phone wave connection line */}
                  <div className="w-12 h-6 flex items-center justify-center z-10">
                    <svg className="w-full h-full text-emerald-400" viewBox="0 0 48 24" fill="none">
                      <path d="M 0 12 L 44 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <polygon points="44,9 48,12 44,15" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Voice agent card container */}
                  <div className="bg-white rounded-xl shadow-md border border-slate-100 p-3 flex flex-col gap-1.5 z-10 w-[150px] relative">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs">
                        🎙️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-800">Voice AI</span>
                        <span className="text-[7px] text-emerald-500 font-semibold flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Live Call
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      <span>Active Agent</span>
                      <div className="w-4 h-2 bg-emerald-600 rounded-full relative pointer-events-none">
                        <div className="w-1.5 h-1.5 bg-white rounded-full absolute right-0.5 top-[1px]" />
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 rounded p-1 text-[8px] text-emerald-700 italic border border-emerald-50/80">
                      "{VOICE_DIALOGUES[activeUseCase] || "Let me assist you."}"
                    </div>
                  </div>
                </div>
                {/* Text Content */}
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">Voice Agent</h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">
                        {uc.voice.stat}
                      </span>
                    </div>
                    <p className="text-sm text-slate-650 leading-relaxed">{uc.voice.desc}</p>
                  </div>

                  {/* Capabilities checklist */}
                  <div className="grid gap-2">
                    {uc.voice.features.map((feat, j) => (
                      <div key={j} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="text-emerald-500 text-sm leading-none flex-shrink-0">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Outcomes panel */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200/50">
                    {uc.voice.outcomes.map((item, j) => (
                      <div key={j} className="text-center p-2 rounded bg-white border border-slate-100 shadow-sm">
                        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                        <span className="block text-sm font-extrabold text-slate-800 mt-0.5 font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => openAuth("register")}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm border-none cursor-pointer transition-all hover:opacity-90 mt-2"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)' }}
                  >
                    {uc.voice.cta}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Integrations ── */}
          <Reveal className="text-center mb-12 space-y-3">
            <span
              className="tag px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#475569", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}
            >
              <span className="text-base">🔌</span>
              Seamless Integrations
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#0a0a0a" }}>
              Connect your favorite tools
            </h3>
            <p className="text-sm" style={{ color: "#475569", maxWidth: 400, margin: "0 auto" }}>
              Native integrations with the platforms you already use
            </p>
          </Reveal>

          <Reveal>
            <div className="space-y-3">
              <IntegrationRow items={integrationsRow1 as IntegrationItem[]} direction="normal" />
              <IntegrationRow items={integrationsRow2 as IntegrationItem[]} direction="reverse" />
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {INTEGRATION_STATS.map(({ n, l }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                  whileHover={{ y: -4, boxShadow: "0 16px 36px rgba(37,99,235,0.1)" }}
                  className="group relative rounded-2xl p-6 text-center overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(37,99,235,0.06)" }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.05), transparent 70%)" }}
                  />
                  <dt className="relative text-xs font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>
                    {l}
                  </dt>
                  <dd className="relative text-3xl sm:text-4xl font-extrabold mt-2 gradient-text">
                    <AnimatedStat value={n} />
                  </dd>
                </motion.div>
              ))}
            </div>
          </Reveal>

          {/* CTA Banner */}
          <Reveal>
            <motion.div
              whileHover="hover"
              className="mt-10 relative rounded-3xl p-8 sm:p-10 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.05))",
                border: "1px solid rgba(37,99,235,0.10)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.03)",
              }}
            >
              <motion.div
                variants={{ hover: { scale: 1.15 } }}
                transition={{ duration: 0.6, ease: EASE }}
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-[0.09] pointer-events-none"
                style={{ background: "radial-gradient(circle, #10B981, transparent 70%)" }}
              />
              <div
                className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-[0.06] pointer-events-none"
                style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)" }}
              />

              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h4 className="text-lg font-bold" style={{ color: "#0a0a0a" }}>
                    Need a custom integration?
                  </h4>
                  <p className="text-sm mt-1" style={{ color: "#475569" }}>
                    Our API supports webhooks, real-time events, and everything in between.
                  </p>
                </div>
                <motion.button
                  onClick={scrollToContact}
                  whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(16,185,129,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                  style={{ background: "var(--gg)", boxShadow: "0 4px 20px rgba(16,185,129,0.25)", border: "none", cursor: "pointer" }}
                >
                  Contact Support →
                </motion.button>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>

      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #2563EB, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .animate-marquee-left {
          animation: marquee-left 25s linear infinite;
        }

        .animate-marquee-right {
          animation: marquee-right 25s linear infinite;
        }

        .animate-marquee-left:hover,
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}