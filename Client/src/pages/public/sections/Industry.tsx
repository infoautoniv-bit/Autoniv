import { useState, useCallback, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useCases, integrationsRow1, integrationsRow2 } from "./data";
import { Reveal } from "./utils";


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

const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Animated counter for stats ──────────────────────────────────────────────

const AnimatedStat = memo(function AnimatedStat({ value }: { value: string }) {
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
});

// ─────────────────────────────────────────────────────────────────────────────

const IntegrationRow = memo(function IntegrationRow({ items, direction = "normal" }: { items: IntegrationItem[]; direction?: "normal" | "reverse" }) {
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
});

// ─── Main Component ───────────────────────────────────────────────────────────

const INTEGRATION_STATS = [
  { n: "40+", l: "Pre-built integrations" },
  { n: "∞", l: "Custom API possibilities" },
  { n: "5 min", l: "Average setup time" },
] as const;

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
] as const;

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
] as const;

export const Industry = memo(function Industry() {
  const [activeUseCase, setActiveUseCase] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/industries/healthcare") {
      setActiveUseCase(0);
      const el = document.getElementById("industry");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } else if (location.pathname === "/industries/real-estate") {
      setActiveUseCase(1);
      const el = document.getElementById("industry");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, [location.pathname]);
  const uc = useCases[activeUseCase] as UseCase;

  const scrollToContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const [activeTab, setActiveTab] = useState<"chat" | "voice">("voice");
  const tabVariant = activeTab === "chat" ? uc.chat : uc.voice;
  const isVoice = activeTab === "voice";

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
            <span
              className="tag px-4 py-1.5 rounded-full inline-block text-xs font-bold tracking-wider uppercase"
              style={{ color: "#ffffff", background: "var(--gg)" }}
            >
              Industry Solutions
            </span>
            <h2
              className="font-extrabold tracking-tight mt-4"
              style={{ fontSize: "clamp(28px,4vw,48px)", color: "#0a0a0a" }}
            >
              Tailored for Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Industry
              </span>
            </h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto mt-3" style={{ color: "#64748b" }}>
              Our agents are customized for specific workflows, vocabulary, and compliance rules of your business sector.
            </p>
          </Reveal>

          {/* ── Grid Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Responsive grid of selector tabs */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:gap-2.5">
              {useCases.map((item, idx) => {
                const isActive = idx === activeUseCase;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveUseCase(idx)}
                    whileHover={{ y: isActive ? 0 : -3, scale: isActive ? 1 : 1.01 }}
                    className="w-full flex items-center justify-between p-3 sm:p-3.5 lg:p-4 rounded-2xl text-left border-none cursor-pointer transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, rgba(37,99,235,0.065), rgba(16,185,129,0.04))"
                        : "rgba(255,255,255,0.4)",
                      boxShadow: isActive
                        ? "0 4px 20px -2px rgba(37,99,235,0.08), inset 0 0 12px rgba(255,255,255,0.8)"
                        : "none",
                    }}
                  >
                    {/* Active highlight border */}
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-blue-600 to-emerald-500 rounded-r" />
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span
                        className="text-sm font-bold transition-colors"
                        style={{ color: isActive ? "#0a0a0a" : "#475569" }}
                      >
                        {item.title}
                      </span>
                    </div>

                    <span
                      className="hidden lg:inline text-xs transition-transform duration-300"
                      style={{
                        color: isActive ? "#2563EB" : "#94a3b8",
                        transform: isActive ? "translateX(0)" : "translateX(-4px)",
                      }}
                    >
                      {isActive ? "✦" : "→"}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Right: Rich Preview card */}
            <div className="lg:col-span-8">
              <div
                className="bg-white rounded-3xl p-6 sm:p-8"
                style={{
                  border: "1px solid rgba(37,99,235,0.11)",
                  boxShadow: "0 24px 64px rgba(37,99,235,0.04)",
                }}
              >
                {/* Mode Selector tabs (Voice vs Chat) */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{uc.icon}</span>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 m-0">
                      {uc.title}
                    </h3>
                  </div>

                  <div className="flex bg-slate-100/80 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveTab("voice")}
                      className="px-4 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all"
                      style={{
                        background: isVoice ? "#ffffff" : "transparent",
                        color: isVoice ? "#2563EB" : "#64748b",
                        boxShadow: isVoice ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      🎤 Voice Agent
                    </button>
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="px-4 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-all"
                      style={{
                        background: !isVoice ? "#ffffff" : "transparent",
                        color: !isVoice ? "#2563EB" : "#64748b",
                        boxShadow: !isVoice ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                      }}
                    >
                      💬 Chatbot
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Mode details */}
                  <div className="md:col-span-7 space-y-6">
                    <p className="text-slate-600 text-sm leading-relaxed m-0">
                      {tabVariant.desc}
                    </p>

                    {/* Key stats banner */}
                    <div
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{
                        background: isVoice ? "rgba(16,185,129,0.06)" : "rgba(37,99,235,0.06)",
                        border: isVoice
                          ? "1px solid rgba(16,185,129,0.15)"
                          : "1px solid rgba(37,99,235,0.15)",
                      }}
                    >
                      <div className="text-2xl font-black text-slate-900 leading-none">
                        <AnimatedStat value={tabVariant.stat} />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Average Target Impact
                      </span>
                    </div>

                    {/* Outcomes checklist */}
                    <div>
                      <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
                        Key Outcomes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tabVariant.outcomes.map((item, i) => (
                          <div
                            key={i}
                            className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex flex-col"
                          >
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                              {item.label}
                            </span>
                            <span
                              className="text-xs font-black mt-0.5"
                              style={{ color: isVoice ? "#10B981" : "#2563EB" }}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mode interactive visual sandbox */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden shadow-xl">
                      {/* Sandbox window bar */}
                      <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-900 border-b border-slate-950">
                        <span className="w-2 h-2 rounded-full bg-rose-500/80" />
                        <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                        <span className="text-[9px] font-bold text-slate-500 font-mono tracking-widest uppercase ml-auto">
                          Agent Sandbox
                        </span>
                      </div>

                      <div className="p-5 min-h-[160px] flex flex-col justify-center bg-slate-950/80 relative">
                        <AnimatePresence mode="wait">
                          {isVoice ? (
                            <motion.div
                              key={`voice-${activeUseCase}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-center py-2"
                            >
                              {/* Glowing voice ripple mic */}
                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400 mx-auto mb-3 animate-pulse">
                                🎙️
                              </div>
                              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-mono">
                                AI Voice Stream
                              </p>
                              <p className="text-white text-xs leading-relaxed font-mono mt-2 italic px-2">
                                "{VOICE_DIALOGUES[activeUseCase]}"
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`chat-${activeUseCase}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-3"
                            >
                              <div className="flex justify-end">
                                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-1.5 text-[11px] max-w-[85%] font-medium">
                                  {CHAT_DIALOGUES[activeUseCase].q}
                                </div>
                              </div>
                              <div className="flex justify-start">
                                <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none px-3 py-1.5 text-[11px] max-w-[85%] leading-relaxed font-medium">
                                  {CHAT_DIALOGUES[activeUseCase].a}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <button
                      onClick={scrollToContact}
                      className="w-full py-3.5 rounded-2xl text-xs font-bold text-center border-none cursor-pointer transition-all duration-300 text-white"
                      style={{
                        background: "linear-gradient(135deg, #0f172a, #1e293b)",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(15,23,42,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.15)";
                      }}
                    >
                      Request Custom Sandbox →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Integrations Marquees ── */}
          <div className="mt-20 border-t border-slate-100 pt-16">
            <Reveal className="text-center max-w-xl mx-auto mb-10 space-y-3">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Integrates with your existing tech stack
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[340px] mx-auto">
                No migrations or complex onboarding. Autoniv plugs right into your CRM, database, and messaging platforms.
              </p>
            </Reveal>

            <div className="space-y-4 max-w-5xl mx-auto">
              <IntegrationRow items={integrationsRow1} direction="normal" />
              <IntegrationRow items={integrationsRow2} direction="reverse" />
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-12 text-center">
              {INTEGRATION_STATS.map((item, i) => (
                <div key={i}>
                  <p
                    className="text-lg sm:text-2xl font-black leading-none"
                    style={{ color: "#2563EB" }}
                  >
                    {item.n}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-bold">
                    {item.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});