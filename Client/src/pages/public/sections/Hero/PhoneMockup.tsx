import React, { useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MicrophoneIcon, PhoneIcon, SpeakerWaveIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { WAVE_HEIGHTS } from "../data";

const center = (WAVE_HEIGHTS.length - 1) / 2;
const BG_BARS = WAVE_HEIGHTS.map((baseH, i) => {
  const dist = Math.abs(i - center);
  const envelope = Math.max(0.15, 1 - (dist / center) * 0.7);
  return Math.max(4, baseH * envelope * 0.45);
});

const FG_BARS = WAVE_HEIGHTS.map((baseH, i) => {
  const dist = Math.abs(i - center);
  const envelope = Math.max(0.15, 1 - (dist / center) * 0.7);
  return { h: Math.max(5, baseH * envelope), dist };
});

interface PhoneMockupProps {
  reduced: boolean;
  isMobile: boolean;
  lowPower: boolean;
  documentLoaded: boolean;
  phoneRotate: any;
  yGlow: any;
}

export const PhoneMockup = React.memo(function PhoneMockup({
  reduced,
  isMobile,
  lowPower,
  documentLoaded,
  phoneRotate,
  yGlow,
}: PhoneMockupProps) {
  // Mouse-driven tilt on the phone mockup for a premium 3D feel.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, -22]), { stiffness: 150, damping: 18 });

  const handlePhoneMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [reduced, mx, my]);

  const handlePhoneMouseLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <div className="mt-4 lg:col-span-5 flex justify-center items-center relative min-h-[380px] sm:min-h-[450px] lg:min-h-[580px] z-10 w-full order-2 lg:order-2 pt-4 lg:pt-0">
      {/* Glow orbs: blur + scale animation via CSS classes */}
      <motion.div
        style={{ y: yGlow, willChange: "transform" }}
        className={`absolute top-[20%] left-[20%] w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16)_0%,transparent_70%)] filter blur-3xl pointer-events-none ${
          lowPower ? "" : "animate-[orbPulse_6s_ease-in-out_infinite]"
        }`}
      />
      <motion.div
        style={{ y: yGlow, willChange: "transform" }}
        className={`absolute bottom-[20%] right-[10%] w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.12)_0%,transparent_70%)] filter blur-3xl pointer-events-none ${
          lowPower ? "" : "animate-[orbPulse_7s_ease-in-out_infinite_1s]"
        }`}
      />

      {/* Phone Mockup */}
      <motion.div
        className={reduced || isMobile ? "" : "phone-float"}
        style={{ rotate: phoneRotate, willChange: "transform" }}
        onMouseMove={handlePhoneMouseMove}
        onMouseLeave={handlePhoneMouseLeave}
      >
        {/* Static wrapper handles clip */}
        <div
          className="w-[150px] h-[310px] sm:w-[200px] sm:h-[410px] lg:w-[245px] lg:h-[490px] rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] shadow-2xl overflow-hidden"
          style={{ transform: "rotate(6deg)" }}
        >
          <motion.div
            className="w-full h-full bg-[#0a0a0a] border-[4px] sm:border-[6px] lg:border-[7px] border-[#1a1a1a] relative flex flex-col items-center p-2 sm:p-3 select-none"
            style={{
              rotateX: isMobile ? 0 : tiltX,
              rotateY: isMobile ? -18 : tiltY,
              transformPerspective: 1000,
            }}
          >
            {/* Notch */}
            <div className="w-20 sm:w-24 h-3 sm:h-4 bg-black rounded-full absolute top-2 sm:top-2.5 z-30" />
            {/* Screen bg */}
            <div className="absolute inset-0 rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] overflow-hidden bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#030303] z-0" />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-4 sm:py-6">
              {/* Header */}
              <div className="text-center mt-2 sm:mt-3">
                <p className="text-[8px] sm:text-xs text-white/40 font-medium tracking-wide uppercase m-0">
                  AI Voice Agent
                </p>
                <p className="text-[8px] sm:text-[10px] text-white/30 font-mono mt-0.5 m-0">
                  00:24
                </p>
              </div>

              {/* Orb + Waves */}
              <div className="relative flex items-center justify-center" style={{ width: "160px", height: "100px" }}>
                {/* Rings (CSS animated) */}
                <div className={`absolute rounded-full border border-cyan-400/20 z-0 ${lowPower ? "" : "rings-pulse-1"}`} style={{ width: "90px", height: "90px" }} />
                <div className={`absolute rounded-full border border-cyan-400/10 z-0 ${lowPower ? "" : "rings-pulse-2"}`} style={{ width: "120px", height: "120px" }} />
                <div className={`absolute rounded-full border border-cyan-400/[0.06] z-0 ${lowPower ? "" : "rings-pulse-3"}`} style={{ width: "155px", height: "155px" }} />

                {/* BG wave bars — single SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 160 100">
                  {BG_BARS.map((h, i) => {
                    const spacing = 160 / BG_BARS.length;
                    const x = i * spacing + 1;
                    const y = 50 - h / 2;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width="1.2"
                        height={h}
                        rx="0.6"
                        fill="rgba(34,211,238,0.12)"
                        style={
                          documentLoaded
                            ? {
                                animation: "waveBounce 1.2s ease-in-out infinite",
                                animationDelay: `${i * 0.045}s`,
                                transformOrigin: `${x + 0.6}px 50px`,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </svg>

                {/* Orb (CSS animated) — z-20 */}
                <div
                  className={`relative z-20 rounded-full flex items-center justify-center flex-shrink-0 ${lowPower ? "" : "orb-pulse"}`}
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "radial-gradient(circle at 35% 35%, #22d3ee, #0ea5e9, #1d4ed8)",
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

                {/* FG wave bars — single SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 160 100">
                  {FG_BARS.map(({ h, dist }, i) => {
                    if (dist < 7) return null;
                    const spacing = 160 / FG_BARS.length;
                    const x = i * spacing + 1;
                    const y = 50 - h / 2;
                    const color =
                      i % 3 === 0
                        ? "url(#cyan-grad-1)"
                        : i % 3 === 1
                        ? "url(#green-grad-1)"
                        : "url(#cyan-grad-2)";
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width="1.2"
                        height={h}
                        rx="0.6"
                        fill={color}
                        opacity="0.65"
                        style={
                          documentLoaded
                            ? {
                                animation: "waveBounce 1.0s ease-in-out infinite",
                                animationDelay: `${i * 0.045}s`,
                                transformOrigin: `${x + 0.6}px 50px`,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                  <defs>
                    <linearGradient id="cyan-grad-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="green-grad-1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="cyan-grad-2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0e7490" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Controls */}
              <div className="w-full px-2 sm:px-4 space-y-2 sm:space-y-4">
                <div className="grid grid-cols-3 gap-y-2 sm:gap-y-3 text-center">
                  {[
                    { icon: MicrophoneIcon, label: "Mute" },
                    { icon: Squares2X2Icon, label: "Keypad" },
                    { icon: SpeakerWaveIcon, label: "Speaker" },
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#141414] border border-slate-700/30 flex items-center justify-center text-white/40 hover:scale-110 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer">
                          <IconComponent className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <span className="text-[7px] sm:text-[9px] text-white/30 mt-0.5 sm:mt-1">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center">
                  <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20 cursor-pointer hover:bg-red-600 transition-colors">
                    {/* compositor-friendly pulse instead of animated box-shadow */}
                    {!lowPower && <span aria-hidden className="absolute inset-0 rounded-[inherit] pointer-events-none bg-red-500/50 animate-[ringsPulse1_2s_ease-out_infinite]" />}
                    <PhoneIcon className="relative w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-[135deg]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});
