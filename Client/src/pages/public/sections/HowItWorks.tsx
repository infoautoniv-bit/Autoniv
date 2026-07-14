import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useReducedMotion, useInView, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { STEPS } from "./data";
import { MagBtn } from "./utils";
import { GradientText } from "./anim";
import { EASE_OUT } from "./motionConstants";

const STEP_COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

function colorFor(i: number) {
  return STEP_COLORS[i % STEP_COLORS.length];
}

// ─── Single timeline step ───────────────────────────────────────────────────

function TimelineStep({
  step,
  index,
  active,
  onClick
}: {
  step: (typeof STEPS)[0];
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion() ?? false;
  const color = colorFor(index);

  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.75, delay: index * 0.1, ease: EASE_OUT }}
      className="relative flex-1 min-w-[200px] cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        whileHover={reduced ? undefined : { y: -6, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative rounded-2xl p-5 h-full overflow-hidden transition-all duration-300"
        style={{
          background: active 
            ? "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(15,23,42,0.6))"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${active ? `${color}55` : "rgba(255,255,255,0.06)"}`,
          boxShadow: active ? `0 16px 40px ${color}18, inset 0 0 16px ${color}10` : "none",
        }}
      >
        {/* Animated corner glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 20% 20%, ${color}15, transparent 60%)` }}
        />

        {/* Top hairline shimmer */}
        {active && (
          <div
            className="absolute inset-x-0 top-0 h-[2px] pointer-events-none transition-opacity duration-300"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />
        )}

        {/* Step number + icon */}
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}1a`, border: `1px solid ${color}33` }}
            animate={active && !reduced ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {step.icon}
          </motion.div>
          <div>
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase block"
              style={{ color }}
            >
              Step {String(step.n).padStart(2, "0")}
            </span>
            <h3 className="text-base font-bold text-white leading-tight">{step.title}</h3>
          </div>
        </div>

        <p className="relative z-10 text-[13px] leading-relaxed text-slate-400 m-0">{step.desc}</p>

        {/* Bottom progress sliver */}
        <div className="relative z-10 mt-4 h-[3px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Previews for each step in Mock Console ───────────────────────────────

function Step1Preview() {
  const [text, setText] = useState("");
  const fullText = "Create a friendly Patient Care coordinator voice agent for HealthFirst Clinic. It should answer FAQs, ask patients for their name, and book slots in Google Calendar.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setText((prev) => prev + fullText[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-mono">AI Prompt Editor</span>
        <span className="text-[10px] text-blue-400 font-bold animate-pulse">● Typing requirements...</span>
      </div>
      <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 font-mono text-xs text-white leading-relaxed min-h-[90px]">
        {text}
        <span className="animate-pulse inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5" />
      </div>
      {text.length === fullText.length && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 pt-1"
        >
          {["🏥 Healthcare Persona Created", "💬 Dialogues Calibrated", "📅 Google Calendar Linked"].map((badge, k) => (
            <span key={k} className="text-[9px] font-bold bg-blue-600/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
              {badge}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Step2Preview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-mono">Agent Voice Configurator</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Active Voice</label>
            <div className="bg-slate-900 border border-white/10 px-3.5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-between">
              <span>Rachel (Inbound Premium)</span>
              <span className="text-emerald-400 font-mono">Selected ✓</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Language</label>
            <div className="bg-slate-900 border border-white/10 px-3.5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-between">
              <span>English (US Accent)</span>
              <span className="text-slate-500">▼</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl border border-emerald-500/20 mb-3 animate-pulse">
          🎙️
        </div>
        <h4 className="text-xs font-bold text-white mb-1">Voice Calibration</h4>
        <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">Rachel's parameters have been optimized for high clarity and responsiveness.</p>
      </div>
    </div>
  );
}

function Step3Preview() {
  const [messages, setMessages] = useState<Array<{ r: string; t: string }>>([]);

  useEffect(() => {
    const dialog = [
      { r: "user", t: "Hi, I need to reschedule my doctor visit for next Monday." },
      { r: "agent", t: "Sure, let me check the openings. I have slots at 10 AM or 3 PM. Which works?" },
      { r: "user", t: "10 AM works best." },
      { r: "agent", t: "Done! Your appointment is rescheduled for Monday at 10 AM. ✓" }
    ];

    let current = 0;
    const addMessage = () => {
      if (current < dialog.length) {
        setMessages((prev) => [...prev, dialog[current]]);
        current++;
        setTimeout(addMessage, 2200);
      }
    };

    const firstDelay = setTimeout(addMessage, 500);
    return () => {
      clearTimeout(firstDelay);
      setMessages([]);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-mono">Agent Testing sandbox</span>
        <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
          Test Call Running
        </span>
      </div>

      <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5 space-y-3 max-h-[140px] overflow-y-auto">
        {messages.map((m, k) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${m.r === "user" ? "items-end" : "items-start"}`}
          >
            <div className={`rounded-xl px-3 py-1.5 text-xs max-w-[85%] ${
              m.r === "user" 
                ? "bg-purple-600/90 text-white rounded-tr-none" 
                : "bg-slate-950 border border-white/10 text-slate-350 rounded-tl-none"
            }`}>
              {m.t}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Step4Preview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-mono">Deployment Methods</span>
        <span className="text-[9px] text-emerald-450 font-bold font-mono">Connected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Phone Number", icon: "📞", val: "+1 (800) 555-0199", action: "Assigned" },
          { label: "Web Widget", icon: "💬", val: "Embed Script Widget", action: "Configured" },
          { label: "Webhook Integration", icon: "⚡", val: "POST /v1/calls", action: "Live" }
        ].map((item, k) => (
          <div key={k} className="bg-slate-900/80 border border-white/5 rounded-xl p-4 hover:border-amber-500/20 transition-all duration-300">
            <span className="text-xl block mb-2">{item.icon}</span>
            <h4 className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">{item.label}</h4>
            <p className="text-xs text-white font-bold truncate mt-1">{item.val}</p>
            <span className="inline-block text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-3">
              {item.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step5Preview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase font-mono">Real-time Analytics Dashboard</span>
        <span className="text-[9px] text-emerald-450 font-bold font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { n: "1,248", l: "Total Calls", color: "#60a5fa" },
          { n: "98.2%", l: "CSAT Score", color: "#34d399" },
          { n: "78%", l: "Auto deflection", color: "#a78bfa" },
          { n: "₹12.50", l: "Cost / Call", color: "#fbbf24" }
        ].map((stat, k) => (
          <div key={k} className="bg-slate-900 border border-white/5 rounded-xl p-3.5 text-center">
            <div className="text-lg font-black font-mono" style={{ color: stat.color }}>{stat.n}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wide font-bold mt-1">{stat.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepConsolePreview({ index }: { index: number }) {
  const color = colorFor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl border border-white/10 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))",
        boxShadow: `0 24px 60px rgba(0,0,0,0.5), inset 0 0 24px ${color}05`
      }}
    >
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/65 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="text-[10px] font-bold text-slate-500 font-mono tracking-widest uppercase">
          autoniv_dashboard // {STEPS[index].title}
        </div>
        <div className="w-8" />
      </div>

      {/* Console Body */}
      <div className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-center">
        {index === 0 && <Step1Preview />}
        {index === 1 && <Step2Preview />}
        {index === 2 && <Step3Preview />}
        {index === 3 && <Step4Preview />}
        {index === 4 && <Step5Preview />}
      </div>
    </motion.div>
  );
}

// ─── Ambient floating particles in the background ───────────────────────────

function AmbientParticles({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  const particles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const size = 2 + (i % 3);
        const left = (i * 137.5) % 100;
        const color = colorFor(i);
        const duration = 9 + (i % 5) * 1.6;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: color,
              opacity: 0.35,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.5, 0] }}
            transition={{ duration, repeat: Infinity, delay: i * 0.9, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

// ─── Main section ────────────────────────────────────────────────────────────

export function HowItWorks({ openAuth }: { openAuth: (m: "login" | "register") => void }) {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const clamped = Math.min(Math.max(v, 0), 1);
    const idx = Math.min(STEPS.length - 1, Math.floor(clamped * STEPS.length));
    setActiveIndex(idx);
  });

  return (
    <section id="how-it-works" ref={sectionRef} className="section-box black">
      <div className="section-pad relative overflow-hidden">
        {/* Background radial */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            translateX: "-50%",
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at top, rgba(16,185,129,0.10), transparent 70%)",
            pointerEvents: "none",
          }}
          animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <AmbientParticles reduced={reduced} />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* Header */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <motion.span
              className="tag px-4 py-1.5 rounded-full inline-block relative overflow-hidden"
              style={{ color: "#ffffff", background: "var(--gg)" }}
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              Simple Process
              {!reduced && (
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)" }}
                  initial={{ x: "-120%" }}
                  animate={{ x: "120%" }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                />
              )}
            </motion.span>
            <h2 className="font-extrabold tracking-tight mt-4" style={{ fontSize: "clamp(28px,4vw,48px)", color: "#ffffff" }}>
              Live in <GradientText animate={false} colors={["#2563EB", "#10B981"]}>5 Steps</GradientText>
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 440, margin: "0 auto" }}>
              From idea to deployed voice agent in under 5 minutes — no code required.
            </p>
          </motion.div>

          {/* Horizontal step cards */}
          <div className="flex flex-col md:flex-row gap-5 max-w-6xl mx-auto mb-12">
            {STEPS.map((step, i) => (
              <TimelineStep key={i} step={step} index={i} active={i === activeIndex} onClick={() => setActiveIndex(i)} />
            ))}
          </div>

          {/* Console Preview Panel */}
          <div className="max-w-4xl mx-auto mb-14">
            <AnimatePresence mode="wait">
              <StepConsolePreview key={activeIndex} index={activeIndex} />
            </AnimatePresence>
          </div>

          {/* CTA */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-14"
          >
            <motion.div
              animate={
                reduced
                  ? undefined
                  : {
                      boxShadow: [
                        "0 4px 14px rgba(16,185,129,0.25)",
                        "0 4px 26px rgba(16,185,129,0.45)",
                        "0 4px 14px rgba(16,185,129,0.25)",
                      ],
                    }
              }
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block rounded-[14px]"
            >
              <MagBtn
                onClick={() => openAuth("register")}
                className="btn-responsive-lg font-bold text-white flex items-center gap-2 mx-auto"
                style={{ background: "var(--gg)", borderRadius: 14, padding: "14px 24px" }}
              >
                Build Your First Agent Free
                <motion.svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </motion.svg>
              </MagBtn>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}