import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { features } from "./data";
import { CountUp, GradientText } from "./anim";
import { EASE_OUT } from "./motionConstants";

const LANGUAGES = ["English", "हिन्दी", "Español", "Deutsch", "العربية", "தமிழ்", "বাংলা"] as const;
const ANALYTICS_VALUES = [25, 45, 30, 60, 85, 55, 95] as const;

const cardAnimations = [
  // Card 1: Slide from left (transform-only for GPU)
  { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  // Card 2: Fade up with scale
  { hidden: { opacity: 0, y: 40, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } },
  // Card 3: Scale with bounce
  { hidden: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1 } },
  // Card 4: Fade up from below (safe for mobile, no 3D)
  { hidden: { opacity: 0, y: 50, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } },
  // Card 5: Rise with glow
  { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
  // Card 6: Fade up (safe for mobile)
  { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
] as const;

function renderVisualizer(index: number, color: string) {
  switch (index) {
    case 0: // AI Voice Agents: Bouncing wave (CSS optimized)
      return (
        <div className="flex items-end justify-center gap-1 h-12 w-full px-2">
          {Array.from({ length: 13 }).map((_, bar) => (
            <div
              key={bar}
              className="w-1 rounded-full"
              style={{
                backgroundColor: color,
                height: "24px",
                animation: `waveBounce ${1.0 + (bar % 3) * 0.15}s ease-in-out ${bar * 0.1}s infinite`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>
      );
    case 1: // Global Language Support: Floating language badges
      return (
        <div className="flex flex-wrap gap-1.5 justify-center items-center h-12 w-full px-2 overflow-hidden">
          {LANGUAGES.map((lang, idx) => (
            <span
              key={idx}
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all duration-300 group-hover:scale-105"
              style={{
                borderColor: `${color}25`,
                backgroundColor: `${color}08`,
                color: color,
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      );
    case 2: // Premium Voice Selection: Pulsing sound ripples
      return (
        <div className="relative flex items-center justify-center h-12 w-full">
          <div className="absolute w-12 h-12 rounded-full border animate-ping" style={{ borderColor: `${color}20`, animationDuration: '3s' }} />
          <div className="absolute w-8 h-8 rounded-full border animate-pulse" style={{ borderColor: `${color}40`, animationDuration: '2s' }} />
          <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full border bg-white shadow-sm text-xs font-bold" style={{ borderColor: `${color}20` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-700">Realistic Voice Engine</span>
          </div>
        </div>
      );
    case 3: // Smart Analytics: Neon bar chart
      return (
        <div className="flex items-end justify-between gap-1.5 h-12 w-full px-4">
          {ANALYTICS_VALUES.map((val, idx) => (
            <div key={idx} className="flex-1 bg-slate-200/50 rounded-t h-full relative overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${val}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: idx * 0.05, ease: "easeOut" }}
                className="absolute bottom-0 left-0 right-0 rounded-t"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>
      );
    case 4: // CRM Integration: Pulse traveling between system icons (CSS optimized)
      return (
        <div className="flex items-center justify-center gap-4 h-12 w-full px-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border bg-white" style={{ borderColor: `${color}15`, color }}>🤖</div>
          <div className="relative flex-1 h-[2px] bg-slate-200">
            <div
              className="absolute top-[-3px] w-2 h-2 rounded-full shadow-lg travel-pulse-anim"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border bg-white" style={{ borderColor: `${color}15`, color }}>💼</div>
        </div>
      );
    case 5: // Enterprise Security: Scanning security badge (CSS optimized)
      return (
        <div className="relative flex items-center justify-center h-12 w-full overflow-hidden border rounded-xl bg-slate-50" style={{ borderColor: `${color}15` }}>
          <div
            className="absolute left-0 right-0 h-[1.5px] opacity-70 scan-vertical-anim"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
            <span style={{ color }}>🛡️</span> Encrypted & Audited
          </div>
        </div>
      );
    default:
      return null;
  }
}

const FeatureCard = React.memo(function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion() ?? false;
  const anim = cardAnimations[index % cardAnimations.length];

  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : anim.hidden}
      animate={inView ? anim.visible : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: EASE_OUT,
      }}
      style={{ perspective: 1000 }}
    >
      <div
        className="group relative p-7 rounded-2xl overflow-hidden h-full cursor-default transition-all duration-500 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg"
        style={{
          background: "#f8fafc",
          border: "1px solid rgba(37, 99, 235, 0.14)",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
          willChange: "transform",
        }}
      >
        {/* Hover radial wash */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 30% 30%,${feature.color}14,transparent 60%)` }}
        />

        {/* Animated border glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
          style={{ boxShadow: `inset 0 0 0 1px ${feature.color}59, 0 0 30px -4px ${feature.color}40` }}
        />

        <div>
          {/* Icon with rotation entrance */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -180, scale: 0.3 }}
            animate={inView ? { opacity: 1, rotate: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-2xl"
            style={{ background: `${feature.color}14`, border: `1px solid ${feature.color}26` }}
          >
            <span className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 inline-block">{feature.icon}</span>
          </motion.div>

          <h3 className="text-base font-bold mb-2" style={{ color: "#0a0a0a" }}>{feature.title}</h3>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#475569" }}>{feature.desc}</p>
        </div>

        {/* Visualizer segment */}
        <div className="my-4 min-h-[48px] flex items-center justify-center">
          {renderVisualizer(index, feature.color)}
        </div>

        {/* Metric with animated border */}
        <div
          className="flex items-baseline gap-2 pt-4 relative"
          style={{ borderTop: "1px solid rgba(37, 99, 235, 0.14)" }}
        >
          {/* Animated underline on hover */}
          <div
            className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
            style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
          />
          <CountUp value={feature.metric} className="text-2xl font-extrabold" style={{ color: feature.color }} />
          <span className="tag text-[10px]" style={{ color: "#2563EB" }}>{feature.metricLabel}</span>
        </div>
      </div>
    </motion.div>
  );
});

export function Features() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section id="features" className="section-box white">
      <div className="section-pad relative overflow-hidden">
        {/* Ambient gradients */}
        <div style={{ position: "absolute", bottom: 0, right: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(37, 99, 235, 0.05), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "10%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.04), transparent 70%)", pointerEvents: "none" }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* Header with stagger */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <span className="tag px-4 py-1.5 rounded-full inline-block" style={{ color: "#ffffff", background: "var(--gg)" }}>
              Platform Capabilities
            </span>
            <h2 className="font-extrabold tracking-tight mt-4" style={{ fontSize: "clamp(28px,4vw,48px)", color: "#0a0a0a" }}>
              Everything You Need{" "}
              <GradientText animate={false} colors={["#2563EB", "#10B981"]}>
                to Scale
              </GradientText>
            </h2>
            <p style={{ color: "#475569", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Powerful AI infrastructure designed to capture more leads and serve customers around the clock.
            </p>
          </motion.div>

          {/* Feature cards with unique animations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
