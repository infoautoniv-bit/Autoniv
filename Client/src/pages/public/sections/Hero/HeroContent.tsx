import React from "react";
import { WordReveal } from "../anim";
import { AVATARS } from "./constants";

interface HeroContentProps {
  openAuth: (m: "login" | "register") => void;
  reduced: boolean;
  lowPower: boolean;
}

export const HeroContent = React.memo(function HeroContent({
  openAuth,
  reduced,
  lowPower,
}: HeroContentProps) {
  return (
    <div
      className="lg:col-span-7 flex flex-col justify-center text-left space-y-4 lg:space-y-6 z-10 order-1 lg:order-1"
    >
      <div className="animate-[fadeInUp_0.5s_ease-out_0.02s_forwards] opacity-0">
        <span
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full tag text-xs sm:text-sm overflow-hidden"
          style={{
            color: "#2563EB",
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(37,99,235,0.3)",
          }}
        >
          <span className="inline-block animate-[wiggle_2.2s_ease-in-out_1.4s_infinite]">
            ✦
          </span>
          AI Voice • Chat Solutions
          {!lowPower && (
            <span
              className="absolute inset-0 pointer-events-none animate-[shimmerSlide_2s_ease-in-out_3s_infinite]"
              style={{
                background:
                  "linear-gradient(110deg, transparent 40%, rgba(37,99,235,0.25) 50%, transparent 60%)",
              }}
            />
          )}
        </span>
      </div>

      <div className="animate-[fadeInUp_0.5s_ease-out_0.12s_forwards] opacity-0">
        <h1
          className="font-bold leading-[1.08] tracking-tight"
          style={{
            fontSize: "clamp(32px,8vw,62px)",
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
      </div>

      <p
        className="text-[#475569] text-sm sm:text-base lg:text-lg leading-relaxed max-w-[560px] m-0 animate-[fadeInUp_0.5s_ease-out_0.22s_forwards] opacity-0"
      >
        Deploy AI Voice Agents and AI Chatbots that handle calls,
        chats, and more – 24/7. Qualify leads, book appointments,
        answer questions and delight customers automatically.
      </p>

      {/* Buttons - Mobile Optimized */}
      <div className="mt-4 hero-cta-row flex flex-col gap-4 w-full animate-[fadeInUp_0.5s_ease-out_0.32s_forwards] opacity-0" style={{ opacity: 1, overflow: "visible" }}>
        {/* Row 1: Buttons */}
        <div className="hero-btn-row flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full" style={{ overflow: "visible" }}>
          <button
            onClick={() => openAuth("register")}
            className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white relative overflow-hidden cursor-pointer btn-press"
            style={{
              background: "var(--gg)",
              minHeight: "48px",
              fontSize: "15px",
              boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              border: "none",
            }}
          >
            {!lowPower && <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none bg-green-400/45 rings-pulse-1" />}
            <svg
              className="w-4 h-4 relative animate-[wiggle_1.8s_ease-in-out_2s_infinite]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 2L3 14h6l-1 8 10-12h-6l1-8z" />
            </svg>
            <span className="relative">Book a Free Demo</span>
            <svg
              className="w-4 h-4 relative group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          <button
            onClick={() => openAuth("register")}
            className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl relative overflow-hidden cursor-pointer backdrop-blur-md btn-press"
            style={{
              background: "rgba(37,99,235,0.08)",
              color: "#2563EB",
              border: "1px solid rgba(37,99,235,0.25)",
              minHeight: "48px",
              fontSize: "15px",
            }}
          >
            <svg className="w-4 h-4" fill="#2563EB" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Live Demo
          </button>
        </div>

        {/* Row 2: Avatars + rating */}
        <div
          className="flex items-center gap-3 flex-wrap w-full"
        >
          <div className="flex -space-x-2 shrink-0">
            {AVATARS.map((av, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden animate-[scaleIn_0.4s_ease-out_${0.7 + i * 0.08}s_forwards] opacity-0"
                style={{ zIndex: 5 - i, animationDelay: `${0.7 + i * 0.08}s` }}
              >
                <img
                  src={av.img}
                  alt={`User ${av.alt}`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, k) => (
                <svg
                  key={k}
                  className="w-4 h-4 shrink-0 animate-[scaleIn_0.35s_ease-out_${0.9 + k * 0.05}s_forwards] opacity-0"
                  style={{ fill: "#f59e0b", animationDelay: `${0.9 + k * 0.05}s` }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-[#475569] m-0">
              Trusted by{" "}
              <span className="font-semibold text-[var(--text)]">100+</span>{" "}
              businesses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
