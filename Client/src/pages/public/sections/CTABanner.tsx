import { useMemo, useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { MagBtn } from "./utils";
import { GradientText } from "./anim";

interface DialogueItem {
  speaker: "customer" | "ai";
  text: string;
}

const DIALOGUES: DialogueItem[] = [
  { speaker: "customer", text: "Hi, I'd like to set up an AI voice receptionist." },
  { speaker: "ai", text: "I can help with that! What's your business name and website?" },
  { speaker: "customer", text: "It's Autoniv Web, autoniv.com. We handle 5,000+ calls." },
  { speaker: "ai", text: "Excellent. I've configured your inbound call agent. Ready for test! ✓" },
];

function AnimatedStat({ n, l, delay }: { n: string; l: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 sm:p-5 text-center cursor-default hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-350"
    >
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle at center, rgba(16,185,129,0.05), transparent 70%)" }}
      />
      <div className="relative">
        <div className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-blue-405 via-emerald-400 to-blue-405 bg-clip-text text-transparent"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {n}
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-semibold tracking-wide uppercase">{l}</div>
      </div>
    </motion.div>
  );
}

function ParticleField() {
  const particles = useMemo(() => {
    const seed = [12, 45, 78, 23, 56];
    return seed.map((s, i) => ({
      id: i,
      x: `${(s * 7) % 100}%`,
      y: `${(s * 13) % 100}%`,
      size: (s % 3) + 1,
      delay: (s % 50) / 10,
      duration: (s % 8) + 8,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: "rgba(255,255,255,0.15)",
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function MorphingBlob({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      animate={{
        x: [0, 20, -15, 0],
        y: [0, -15, 10, 0],
        scale: [1, 1.05, 0.97, 1],
      }}
      transition={{
        duration: 16,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        width: 250,
        height: 250,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}25, transparent 70%)`,
        willChange: "transform",
        filter: "blur(40px)",
      }}
    />
  );
}

function LiveCallWidget() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % DIALOGUES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto max-w-[340px] rounded-3xl p-[1px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(16,185,129,0.25))",
        boxShadow: "0 30px 60px rgba(0,0,0,0.4), 0 0 100px rgba(16,185,129,0.06)",
      }}
    >
      <div className="bg-slate-950/90 rounded-[23px] p-5 backdrop-blur-2xl flex flex-col h-[400px]">
        {/* Widget Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Agent Simulator</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold px-2.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">Active</span>
        </div>

        {/* Pulse Calling Animation */}
        <div className="flex flex-col items-center justify-center py-6 relative">
          <div className="relative flex items-center justify-center">
            {/* Double pulsing rings */}
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-16 h-16 rounded-full border-2 border-blue-500/40 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-16 h-16 rounded-full border-2 border-emerald-500/30 pointer-events-none"
            />
            
            {/* Center Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white text-2xl z-10 shadow-lg shadow-emerald-500/20">
              🎙️
            </div>
          </div>
          
          <h3 className="text-white text-sm font-bold mt-4 mb-0.5">Autoniv Voice Agent</h3>
          <p className="text-[10px] text-slate-500 font-medium">Inbound Call Routing...</p>
        </div>

        {/* Audio Wave Visualizer Bars */}
        <div className="flex items-center justify-center gap-1 h-6 my-2">
          {[...Array(9)].map((_, i) => {
            const delays = [0, 0.2, 0.4, 0.1, 0.3, 0.5, 0.2, 0.4, 0];
            return (
              <motion.div
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ duration: 0.8 + (i % 3) * 0.2, delay: delays[i], repeat: Infinity, ease: "easeInOut" }}
                className="w-1 rounded-full"
                style={{
                  background: "linear-gradient(to top, #2563EB, #10B981)",
                  height: "20%",
                }}
              />
            );
          })}
        </div>

        {/* Live Conversation Dialog bubbles */}
        <div className="flex-1 flex flex-col justify-end gap-3 mt-4 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className={`flex flex-col ${DIALOGUES[currentStep].speaker === "customer" ? "items-end" : "items-start"}`}
            >
              <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-1">
                {DIALOGUES[currentStep].speaker === "customer" ? "Customer" : "AI Assistant"}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                  DIALOGUES[currentStep].speaker === "customer"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-900 border border-white/10 text-slate-250 rounded-tl-none"
                }`}
              >
                {DIALOGUES[currentStep].text}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function CTABanner({ openAuth }: { openAuth: (m: "login" | "register") => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -60]);

  return (
    <section ref={ref} className="section-box black relative overflow-hidden" style={{ background: "#050d1a" }}>
      {/* Morphing blobs */}
      <MorphingBlob color="#2563EB" delay={0} />
      <MorphingBlob color="#10B981" delay={2} />
      <MorphingBlob color="#8b5cf6" delay={4} />

      {/* Particle field */}
      <ParticleField />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Central glow */}
      <motion.div
        style={{ y: bgY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
      >
        <div className="w-full h-full" style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, rgba(16,185,129,0.05) 40%, transparent 70%)" }} />
      </motion.div>

      <div className="relative z-10 py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Text Content and Action */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Badge */}
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase"
                  style={{ color: "#10B981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GET STARTED
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-extrabold tracking-tight text-white leading-[1.1]"
                style={{ fontSize: "clamp(32px, 4.5vw, 56px)" }}
              >
                Ready to Transform
                <br />
                <GradientText animate={true} colors={["#60a5fa", "#34d399", "#a78bfa", "#60a5fa"]}>
                  Your Business?
                </GradientText>
              </motion.h2>

              <motion.p
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl"
              >
                Join 10,000+ businesses already using AI voice agents to capture more leads and grow faster.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
              >
                <MagBtn
                  onClick={() => openAuth("register")}
                  className="group relative font-bold text-white flex items-center justify-center gap-2.5 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #10B981)",
                    boxShadow: "0 4px 24px rgba(16,185,129,0.3), 0 0 0 1px rgba(16,185,129,0.2)",
                    borderRadius: 16,
                    padding: "16px 32px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}
                  />
                  <span className="relative text-sm">Start Your Free Trial</span>
                  <svg className="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </MagBtn>
                <button
                  onClick={() => openAuth("login")}
                  className="group px-8 py-4 rounded-2xl text-sm font-semibold text-slate-350 transition-all duration-300 hover:text-white hover:bg-white/[0.04] cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Sign In Instead
                </button>
              </motion.div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 max-w-xl">
                <AnimatedStat n="5M+" l="Calls handled" delay={0.4} />
                <AnimatedStat n="99.8%" l="Accuracy" delay={0.5} />
                <AnimatedStat n="2 min" l="Setup time" delay={0.6} />
              </div>
            </div>

            {/* Right Column: Interactive Phone Widget */}
            <div className="lg:col-span-5 col-span-1">
              <LiveCallWidget />
            </div>

          </div>

          {/* Trust indicators */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-16 pt-8 border-t border-white/5"
          >
            {[
              { icon: "🔒", text: "SOC 2 Compliant" },
              { icon: "⚡", text: "99.9% Uptime" },
              { icon: "🌍", text: "20+ Languages" },
              { icon: "💳", text: "No Credit Card" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-slate-200 transition-all duration-300">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] font-bold tracking-wide">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
