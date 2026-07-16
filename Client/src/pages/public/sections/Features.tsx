import React from "react";
import { motion } from "framer-motion";
import { features } from "./data";
import { CountUp, GradientText } from "./anim";
import { Reveal } from "./utils";

const ANALYTICS_VALUES = [25, 45, 30, 60, 85, 55, 95] as const;

function renderVisualizer(index: number, color: string) {
  switch (index) {
    case 0: // AI Voice Agents: Bouncing wave
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
    case 1: // AI Chatbots: Bouncing typing indicators
      return (
        <div className="flex items-center justify-center gap-1.5 h-12 w-full">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${color}20` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: "0s" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: "0.15s" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: "0.3s" }} />
            <span className="text-[9px] text-slate-500 font-bold ml-1">AI Chatbot Typing...</span>
          </div>
        </div>
      );
    case 2: // Omnichannel Support: WhatsApp, Web, Socials
      return (
        <div className="flex items-center justify-center gap-3 h-12 w-full px-2">
          <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-emerald-500">WhatsApp</span>
          <span className="text-[10px] font-black bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg text-blue-500">Web Widget</span>
          <span className="text-[10px] font-black bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg text-purple-500">Social DMs</span>
        </div>
      );
    case 3: // Ultra-Realistic Voices: sound ripples
      return (
        <div className="relative flex items-center justify-center h-12 w-full">
          <div className="absolute w-12 h-12 rounded-full border animate-ping" style={{ borderColor: `${color}20`, animationDuration: '3s' }} />
          <div className="absolute w-8 h-8 rounded-full border animate-pulse" style={{ borderColor: `${color}40`, animationDuration: '2s' }} />
          <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full border bg-white shadow-sm text-xs font-bold" style={{ borderColor: `${color}20` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-700">11Labs Engine</span>
          </div>
        </div>
      );
    case 4: // Unified Analytics: neon bar chart
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
    case 5: // CRM & Tech Integrations: traveling pulse
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
    default:
      return null;
  }
}

const FeatureCard = React.memo(function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <div
      className="group relative p-7 rounded-2xl overflow-hidden h-full cursor-default flex flex-col justify-between transition-[transform,box-shadow] duration-350 hover:-translate-y-1.5 hover:shadow-lg"
      style={{
        background: "#f8fafc",
        border: "1px solid rgba(37, 99, 235, 0.14)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Hover radial wash */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 30% 30%,${feature.color}14,transparent 60%)` }}
      />

      {/* Animated border glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${feature.color}59, 0 0 30px -4px ${feature.color}40` }}
      />

      <div>
        {/* Icon with hover scale/rotation */}
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{ background: `${feature.color}14`, border: `1px solid ${feature.color}26` }}
        >
          <span>{feature.icon}</span>
        </div>

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
          className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
          style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
        />
        <CountUp value={feature.metric} className="text-2xl font-extrabold" style={{ color: feature.color }} />
        <span className="tag text-[10px]" style={{ color: "#2563EB" }}>{feature.metricLabel}</span>
      </div>
    </div>
  );
});

export function Features() {
  return (
    <section id="features" className="section-box white">
      <div className="section-pad relative overflow-hidden">
        {/* Ambient gradients */}
        <div style={{ position: "absolute", bottom: 0, right: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(37, 99, 235, 0.05), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "10%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.04), transparent 70%)", pointerEvents: "none" }} />

        <div className="relative" style={{ zIndex: 1 }}>
          {/* Header with stagger Reveal */}
          <Reveal className="text-center mb-16 space-y-4">
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
          </Reveal>

          {/* Feature cards with responsive Reveal entry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 0.08} from="bottom">
                <FeatureCard feature={f} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
