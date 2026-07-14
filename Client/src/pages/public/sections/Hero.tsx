import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionValue, useSpring, animate } from "framer-motion";
import { MicrophoneIcon, PhoneIcon, SpeakerWaveIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { WAVE_HEIGHTS } from "./data";
import { WordReveal } from "./anim";

const easeOut = [0.22, 1, 0.36, 1] as const;
const springSoft = { type: "spring" as const, stiffness: 260, damping: 24 };

// Animated count-up for the "Leads Captured" stat.
function CountUp({ to, duration = 1.6, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [inView, setInView] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const controls = animate(0, to, {
      duration,
      ease: easeOut,
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// Wraps a floating card with a staggered entrance + continuous gentle float,
// and a slight magnetic tilt toward the cursor for polish.
function FloatingCard({
  children,
  className,
  delay,
  floatY = [0, -10, 0],
  duration = 5,
  reduced,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
  floatY?: number[];
  duration?: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: easeOut }}
    >
      <motion.div
        animate={reduced ? undefined : { y: floatY }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 }}
        whileHover={reduced ? undefined : { scale: 1.05, y: -4, transition: { duration: 0.25, ease: easeOut } }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Hero({ openAuth }: { openAuth: (m: "login" | "register") => void }) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Subtle foreground/background parallax for depth as the hero scrolls past.
  const yCards = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [48, -48]);
  const yGlow = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-36, 36]);
  const yText = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -28]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0, 0, 0] : [-3, 0, 3]);

  // Mouse-driven tilt on the phone mockup for a premium 3D feel.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, -22]), { stiffness: 150, damping: 18 });

  const handlePhoneMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handlePhoneMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const heroVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.10, delayChildren: 0.02 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  };

  return (
    <section ref={ref} className="section-box tint" style={{ contain: "layout style", contentVisibility: "auto", containIntrinsicSize: "auto 700px" } as React.CSSProperties}>
            <div
              className="section-pad relative overflow-hidden"
              style={{ paddingTop: 40, paddingBottom: 40, transform: "translateZ(0)" }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)",
                  backgroundSize: "48px 48px",
                  maskImage:
                    "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 80% 50% at 50% 100%,black,transparent)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
              />

              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full">
                {/* Text Content - First on mobile (order-1), Left on desktop (lg:order-1) */}
                <motion.div
                  style={{ y: yText }}
                  variants={heroVariants}
                  initial="hidden"
                  animate="show"
                  className="lg:col-span-7 flex flex-col justify-center text-left space-y-4 lg:space-y-6 z-10 order-1 lg:order-1"
                >
                  <motion.div variants={fadeUp}>
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      whileHover={reduced ? undefined : { scale: 1.04 }}
                      transition={springSoft}
                      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full tag text-xs sm:text-sm overflow-hidden"
                      style={{
                        color: "#2563EB",
                        background: "rgba(37,99,235,0.08)",
                        border: "1px solid rgba(37,99,235,0.3)",
                      }}
                    >
                      <motion.span
                        animate={reduced ? undefined : { rotate: [0, 15, -10, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                        className="inline-block"
                      >
                        ✦
                      </motion.span>
                      AI Voice • Chat Solutions
                      {/* shimmer sweep */}
                      {!reduced && (
                        <motion.span
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(110deg, transparent 40%, rgba(37,99,235,0.25) 50%, transparent 60%)",
                          }}
                          initial={{ x: "-120%" }}
                          animate={{ x: "120%" }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                        />
                      )}
                    </motion.span>
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <h1
                      className="font-extrabold leading-[1.08] tracking-tight"
                      style={{
                        fontSize: "clamp(32px,8vw,66px)",
                        color: "#0a0a0a",
                      }}
                    >
                      <WordReveal text="Your Business Never Stops." /> <br />
                      <WordReveal
                        text="Neither Does Your AI Team."
                        wordClassName="hero-gradient-text animated-gradient"
                        delay={0.35}
                      />
                    </h1>
                  </motion.div>

                  <motion.p
                    variants={fadeUp}
                    className="text-[#475569] text-sm sm:text-base lg:text-lg leading-relaxed max-w-[560px] m-0"
                  >
                    Deploy AI Voice Agents and AI Chatbots that handle calls,
                    chats, and more – 24/7. Qualify leads, book appointments,
                    answer questions and delight customers automatically.
                  </motion.p>

                  {/* Buttons - Mobile Optimized */}
                  <motion.div variants={fadeUp} className="mt-4 hero-cta-row flex flex-col gap-4 w-full" style={{ opacity: 1, overflow: "visible" }}>

  {/* Row 1: Buttons */}
  <div className="hero-btn-row flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full" style={{ overflow: "visible" }}>
   <motion.button
      onClick={() => openAuth("register")}
      whileHover={reduced ? undefined : { y: -3, scale: 1.02, boxShadow: "0 10px 28px rgba(16,185,129,0.35)" }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      animate={reduced ? undefined : { boxShadow: ["0 4px 14px rgba(16,185,129,0.25)", "0 4px 22px rgba(16,185,129,0.4)", "0 4px 14px rgba(16,185,129,0.25)"] }}
      transition={{ boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, default: { type: "spring", stiffness: 400, damping: 22 } }}
      className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white relative overflow-hidden"
      style={{
        background: "var(--gg)",
        minHeight: "48px",
        fontSize: "15px",
      }}
    >
      <motion.svg
        className="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        animate={reduced ? undefined : { rotate: [0, 12, -8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
      >
        <path d="M13 2L3 14h6l-1 8 10-12h-6l1-8z" />
      </motion.svg>
      Book a Free Demo
      <motion.svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
        whileHover={{ x: 4 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </motion.svg>
    </motion.button>

    <motion.button
      onClick={() => openAuth("register")}
      whileHover={reduced ? undefined : { y: -3, scale: 1.02, boxShadow: "0 10px 24px rgba(37,99,235,0.18)" }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl"
      style={{
        background: "#ffffff",
        color: "#0a0a0a",
        border: "1px solid rgba(10,10,10,0.15)",
        minHeight: "48px",
        fontSize: "15px",
      }}
    >
      <motion.span
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: "22px", height: "22px", background: "#2563EB" }}
        animate={reduced ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="w-3 h-3" fill="white" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </motion.span>
      Watch Live Demo

    </motion.button>
  </div>

  {/* Row 2: Avatars + rating */}
  <motion.div
    className="flex items-center gap-3 flex-wrap w-full"
    initial="hidden"
    animate="show"
    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.7 } } }}
  >
    <div className="flex -space-x-2 shrink-0">
      {[
        { img: "https://i.pravatar.cc/80?img=11", alt: "Sarah C." },
        { img: "https://i.pravatar.cc/80?img=32", alt: "Michael J." },
        { img: "https://i.pravatar.cc/80?img=47", alt: "Emma R." },
        { img: "https://i.pravatar.cc/80?img=56", alt: "Alex K." },
      ].map((av, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, scale: 0.4, x: -8 }, show: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.4, ease: "backOut" } } }}
          whileHover={{ y: -3, scale: 1.12, zIndex: 10 }}
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
          style={{ zIndex: 5 - i }}
        >
          <img
            src={av.img}
            alt={av.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      ))}
    </div>
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, k) => (
          <motion.svg
            key={k}
            variants={{ hidden: { opacity: 0, scale: 0, rotate: -90 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.35, ease: "backOut" } } }}
            className="w-4 h-4 shrink-0"
            style={{ fill: "#f59e0b" }}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </motion.svg>
        ))}
      </div>
      <p className="text-xs text-[#475569] m-0">
        Trusted by{" "}
        <span className="font-semibold text-[var(--text)]">100+</span>{" "}
        businesses
      </p>
    </div>
  </motion.div>
</motion.div>
                </motion.div>

                <motion.div
                  style={{ y: yCards, transform: "translateZ(0)" }}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
                  className="mt-4 lg:col-span-5 flex justify-center items-center relative min-h-[380px] sm:min-h-[450px] lg:min-h-[580px] z-10 w-full order-2 lg:order-2 pt-4 lg:pt-0"
                >
                  <motion.div
                    style={{ y: yGlow }}
                    className="absolute top-[20%] left-[20%] w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16)_0%,transparent_70%)] filter blur-3xl pointer-events-none"
                    animate={reduced ? undefined : { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    style={{ y: yGlow }}
                    className="absolute bottom-[20%] right-[10%] w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12)_0%,transparent_70%)] filter blur-3xl pointer-events-none"
                    animate={reduced ? undefined : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  />

                  {/* Phone Mockup - Smaller on mobile (slow float + cursor-tilt) */}
                  <motion.div
                    animate={reduced ? undefined : { y: [0, -12, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ rotate: phoneRotate }}
                    onMouseMove={handlePhoneMouseMove}
                    onMouseLeave={handlePhoneMouseLeave}
                  >
                 {/* Static wrapper handles clip — overflow:hidden on a 3D-animated element forces repaints */}
                 <div
                   className="w-[150px] h-[310px] sm:w-[200px] sm:h-[410px] lg:w-[245px] lg:h-[490px] rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] shadow-2xl overflow-hidden"
                   style={{ transform: "rotate(6deg)" }}
                 >
                 <motion.div
      className="w-full h-full bg-[#0a0a0a] border-[4px] sm:border-[6px] lg:border-[7px] border-[#1a1a1a] relative flex flex-col items-center p-2 sm:p-3 select-none"
      style={{
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 1000,
      }}
    >
      {/* Notch */}
      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-black rounded-full absolute top-2 sm:top-2.5 z-30" />
      {/* Screen bg */}
      <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] overflow-hidden bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#030303] z-0" />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-4 sm:py-6">
        {/* Header */}
        <motion.div
          className="text-center mt-2 sm:mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-[8px] sm:text-xs text-white/40 font-medium tracking-wide uppercase m-0">
            AI Voice Agent
          </p>
          <p className="text-[8px] sm:text-[10px] text-white/30 font-mono mt-0.5 m-0">
            00:24
          </p>
        </motion.div>

        {/* Orb + Waves */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: "160px", height: "100px" }}
        >
          {/* Rings */}
          <motion.div
            className="absolute rounded-full border border-cyan-400/20 z-0"
            style={{ width: "90px", height: "90px" }}
            animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full border border-cyan-400/10 z-0"
            style={{ width: "120px", height: "120px" }}
            animate={reduced ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.div
            className="absolute rounded-full border border-cyan-400/[0.06] z-0"
            style={{ width: "155px", height: "155px" }}
            animate={reduced ? undefined : { scale: [1, 1.16, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />

          {/* BG wave bars — behind orb, z-10 */}
          <div className="absolute inset-0 flex items-center justify-center gap-[2px] z-10 pointer-events-none">
            {WAVE_HEIGHTS.map((baseH, i) => {
              const center = (WAVE_HEIGHTS.length - 1) / 2;
              const dist = Math.abs(i - center);
              const envelope = Math.max(0.15, 1 - (dist / center) * 0.7);
              const h = Math.max(4, baseH * envelope * 0.45);
              return (
                <div
                  key={i}
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: "2px",
                    height: `${h}px`,
                    background: "rgba(34,211,238,0.12)",
                    animation: "bgWaveBounce 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.045}s`,
                    transformOrigin: "center",
                  }}
                />
              );
            })}
          </div>

          {/* Orb — z-20 */}
          <div
            className="relative z-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: "64px",
              height: "64px",
              background: "radial-gradient(circle at 35% 35%, #22d3ee, #0ea5e9, #1d4ed8)",
              animation: "orbPulseGlow 3s ease-in-out infinite",
            }}
          >
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                inset: "4px",
                background: "radial-gradient(circle at 35% 35%, #0e7490, #0c4a6e)",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <svg width="22" height="22" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
            </div>
          </div>

          {/* FG wave bars — in front of orb, z-30, center hidden */}
          <div className="absolute inset-0 flex items-center justify-center gap-[2px] z-30 pointer-events-none">
            {WAVE_HEIGHTS.map((baseH, i) => {
              const center = (WAVE_HEIGHTS.length - 1) / 2;
              const dist = Math.abs(i - center);
              const envelope = Math.max(0.15, 1 - (dist / center) * 0.7);
              // Full height — no * 0.5 reduction, taller bars
              const h = Math.max(5, baseH * envelope);

              if (dist < 7) {
                return (
                  <div
                    key={i}
                    className="flex-shrink-0"
                    style={{ width: "2px", height: `${h}px`, opacity: 0 }}
                  />
                );
              }
              return (
                <div
                  key={i}
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: "2px",
                    height: `${h}px`,
                    background:
                      i % 3 === 0
                        ? "linear-gradient(180deg,#67e8f9,#0891b2)"
                        : i % 3 === 1
                        ? "linear-gradient(180deg,#34d399,#059669)"
                        : "linear-gradient(180deg,#22d3ee,#0e7490)",
                    opacity: 0.65,
                    animation: "waveBounce 1s ease-in-out infinite",
                    animationDelay: `${i * 0.045}s`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <motion.div
          className="w-full px-2 sm:px-4 space-y-2 sm:space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: easeOut }}
        >
          <div className="grid grid-cols-3 gap-y-2 sm:gap-y-3 text-center">
            {[
              { icon: MicrophoneIcon, label: "Mute" },
              { icon: Squares2X2Icon, label: "Keypad" },
              { icon: SpeakerWaveIcon, label: "Speaker" },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.12, borderColor: "rgba(34,211,238,0.5)" }}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#141414] border border-slate-700/30 flex items-center justify-center text-white/40"
                  >
                    <IconComponent className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </motion.div>
                  <span className="text-[7px] sm:text-[9px] text-white/30 mt-0.5 sm:mt-1">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <motion.div
              whileHover={reduced ? undefined : { scale: 1.1 }}
              whileTap={reduced ? undefined : { scale: 0.9 }}
              animate={reduced ? undefined : { boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 8px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0)"] }}
              transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeOut" } }}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 cursor-pointer hover:bg-red-600 transition-colors"
            >
              <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-[135deg]" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
                 </div>{/* end static clip wrapper */}
                  </motion.div>

                  {/* Floating Cards - Smaller on mobile */}

                  {/* Card 1: Incoming Call - Top Right */}
                  <FloatingCard
                    reduced={reduced}
                    delay={0.5}
                    duration={5.5}
                    floatY={[0, -9, 0]}
                    className="absolute top-[10%] right-[0%] sm:top-[4%] sm:-right-[8%] z-20 pointer-events-auto w-[100px] sm:w-[185px]"
                  >
                    <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
                      <div className="flex justify-between items-center">
                        <span className="text-[6px] sm:text-[10px] font-semibold text-[#2563EB] tracking-wide uppercase">
                          Incoming Call
                        </span>
                        <motion.span
                          className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"
                          animate={reduced ? undefined : { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                      </div>
                      <div className="mt-0.5 sm:mt-1">
                        <div
                          className="text-[8px] sm:text-xs font-bold text-[var(--text)] m-0 truncate"
                          style={{ color: "#0a0a0a" }}
                        >
                          +1 (415) 555-0178
                        </div>
                        <p className="text-[6px] sm:text-[9px] text-[var(--muted)] m-0 mt-0.5">
                          Sales Inquiry
                        </p>
                      </div>
                      <div className="flex gap-0.5 sm:gap-2 justify-end mt-0.5 sm:mt-1">
                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-100 flex items-center justify-center cursor-pointer hover:bg-red-200 transition-colors">
                          <span className="text-[5px] sm:text-[9px]">❌</span>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center cursor-pointer hover:bg-green-200 transition-colors">
                          <span className="text-[5px] sm:text-[9px]">📞</span>
                        </motion.div>
                      </div>
                    </div>
                  </FloatingCard>

                  {/* Card 2: Appointment Booked - Bottom Right */}
                  <FloatingCard
                    reduced={reduced}
                    delay={0.65}
                    duration={6}
                    floatY={[0, -7, 0]}
                    className="absolute bottom-[2%] right-[4%] sm:bottom-[16%] sm:-right-[2%] z-20 pointer-events-auto w-[95px] sm:w-[180px]"
                  >
                    <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)] flex items-center gap-1.5 sm:gap-3">
                      <motion.div
                        className="w-5 h-5 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.2)] flex items-center justify-center text-xs sm:text-lg flex-shrink-0"
                        animate={reduced ? undefined : { rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                      >
                        📅
                      </motion.div>
                      <div className="min-w-0">
                        <div
                          className="text-[7px] sm:text-[11px] font-bold text-[var(--text)] leading-tight m-0 truncate"
                          style={{ color: "#0a0a0a" }}
                        >
                          Appointment Booked
                        </div>
                        <p className="text-[5px] sm:text-[9px] text-[var(--muted)] mt-0.5 m-0">
                          May 24, 2025
                        </p>
                        <p className="text-[5px] sm:text-[9px] text-[#2563EB] font-medium m-0">
                          10:00 AM
                        </p>
                      </div>
                    </div>
                  </FloatingCard>

                  {/* Card 3: AI Assistant - Top Left */}
                  <FloatingCard
                    reduced={reduced}
                    delay={0.8}
                    duration={5.2}
                    floatY={[0, -8, 0]}
                    className="absolute top-[10%] left-[4%] sm:top-[4%] sm:-left-[4%] z-20 pointer-events-auto w-[100px] sm:w-[195px]"
                  >
                    <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[6px] sm:text-[9px] text-[var(--muted)]">
                          🤖 AI Assistant
                        </span>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1.5 mt-0.5 sm:mt-1">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.1, duration: 0.4, ease: "backOut" }}
                          className="bg-[rgba(37,99,235,0.06)] border border-[rgba(37,99,235,0.12)] text-[var(--text-secondary)] p-1 sm:p-2 rounded-lg sm:rounded-xl rounded-tl-sm text-[6px] sm:text-[10px] leading-relaxed max-w-[90%]"
                        >
                          How can I help you today?
                        </motion.div>
                        <div className="flex justify-end">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 1.4, duration: 0.4, ease: "backOut" }}
                            className="text-white p-1 sm:p-2 rounded-lg sm:rounded-xl rounded-tr-sm text-[6px] sm:text-[10px] leading-relaxed max-w-[90%]"
                            style={{
                              background:
                                "linear-gradient(135deg,#2563EB,#10B981)",
                            }}
                          >
                            I need help with my order.
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </FloatingCard>

                  {/* Card 4: Leads Captured - Bottom Left */}
                  <FloatingCard
                    reduced={reduced}
                    delay={0.95}
                    duration={5.8}
                    floatY={[0, -10, 0]}
                    className="absolute bottom-[2%] left-[4%] sm:bottom-[8%] sm:-left-[4%] z-20 pointer-events-auto w-[100px] sm:w-[185px]"
                  >
                    <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
                      <div>
                        <p className="text-[5px] sm:text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider m-0">
                          Leads Captured
                        </p>
                        <div className="flex items-baseline gap-0.5 sm:gap-1.5 mt-0.5">
                          <span className="text-sm sm:text-lg font-bold text-[var(--text)]">
                            <CountUp to={2847} />
                          </span>
                          <span className="text-[5px] sm:text-[9px] font-semibold text-[var(--primary)]">
                            +32.6%
                          </span>
                        </div>
                      </div>
                      <div className="h-5 sm:h-10 w-full mt-0.5 sm:mt-1">
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 100 30"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient
                              id="chart-glow"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#2563EB"
                                stopOpacity="0.2"
                              />
                              <stop
                                offset="100%"
                                stopColor="#2563EB"
                                stopOpacity="0.0"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,25 Q15,22 30,12 T60,18 T90,5 L100,5 L100,30 L0,30 Z"
                            fill="url(#chart-glow)"
                          />
                          <motion.path
                            d="M0,25 Q15,22 30,12 T60,18 T90,5 L100,5"
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.3, delay: 1.1, ease: easeOut }}
                          />
                          <motion.circle
                            cx="100"
                            cy="5"
                            r="2.5"
                            fill="#2563EB"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 2.3, duration: 0.3, ease: "backOut" }}
                          />
                        </svg>
                      </div>
                    </div>
                  </FloatingCard>
                </motion.div>
              </div>

              {/* Logo marquee inside hero box */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: easeOut }}
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  borderTop: "1px solid rgba(37,99,235,0.12)",
                }}
              >
                <p
                  className="text-center tag mb-4 sm:mb-6 m-0 text-[10px] sm:text-xs"
                  style={{ color: "#475569", letterSpacing: "0.18em", fontWeight: 500 }}
                >
                  Trusted by leading companies
                </p>
                <div className="relative w-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 w-8 sm:w-16 z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, #F5F7FA, transparent)",
                    }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-8 sm:w-16 z-10 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(270deg, #F5F7FA, transparent)",
                    }}
                  />
                  <div className="flex gap-8 sm:gap-16 items-center animate-marquee opacity-90">
                    {[...Array(2)].flatMap((_, dup) =>
                      [
                        { n: "HealthFirst", c: "#0EA5E9", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
                        { n: "BrightHome", c: "#10B981", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
                        { n: "FastTrack", c: "#F59E0B", icon: "M13 2L3 14h6l-1 8 10-12h-6l1-8z" },
                        { n: "CloudBase", c: "#6366F1", icon: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" },
                        { n: "NovaTech", c: "#EC4899", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }
                      ].map((c, i) => (
                        <div
                          key={`${dup}-${i}`}
                          className="flex items-center gap-2 sm:gap-3 whitespace-nowrap"
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 24 24" fill={c.c} style={{ opacity: 0.7 }}>
                            <path d={c.icon} />
                          </svg>
                          <span
                            className="text-xs sm:text-sm font-semibold tracking-tight"
                            style={{ color: "#030B2E" }}
                          >
                            {c.n}
                          </span>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
  );
}