import React from "react";
import { Spectrum } from "./Spectrum";

interface OrbProps {
  speaking: "user" | "agent" | "idle";
  demoRunning: boolean;
  documentLoaded: boolean;
}

// Glowing Ring voice mic orb component
export const GlowRingOrb = React.memo(function GlowRingOrb({ active }: { active: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 150,
        height: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      {/* outer soft glow (CSS animated) */}
      <div
        className={`glow-ring-orb-glow absolute w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18)_0%,rgba(34,211,238,0.04)_55%,transparent_75%)] filter blur-[10px] ${
          active ? "orb-glow-pulse" : ""
        }`}
        style={{ willChange: "transform, opacity" }}
      />
      {/* glowing ring */}
      <div
        className="absolute w-[110px] h-[110px] rounded-full border-[4px] border-[#22d3ee]"
        style={{
          boxShadow: "0 0 12px rgba(34,211,238,0.45), 0 0 24px rgba(59,130,246,0.2), inset 0 0 10px rgba(34,211,238,0.20)",
        }}
      />
      {/* faint outer ring echo */}
      <div className="absolute w-[130px] h-[130px] rounded-full border border-cyan-400/12" />
      {/* solid mic circle */}
      <div
        className="relative w-[60px] h-[60px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#3b82f6,#1d4ed8)] flex items-center justify-center"
        style={{
          boxShadow: "0 0 16px rgba(37,99,235,0.4)",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      </div>
    </div>
  );
});

export const Orb = React.memo(function Orb({
  speaking,
  demoRunning,
  documentLoaded,
}: OrbProps) {
  const active = (speaking !== "idle" || demoRunning) && documentLoaded;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "44px 32px",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "#0a0e16",
        position: "relative",
        gap: 28,
        overflow: "hidden",
        height: "100%",
        minHeight: "420px",
      }}
    >
      {/* Background Spectrum visualizer */}
      <Spectrum active={active} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at 50% 60%,black 20%,transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 60%,black 20%,transparent 75%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          height: "100%",
          paddingBottom: 20,
          gap: 16,
        }}
      >
        <GlowRingOrb active={active} />

        {/* Mini wave bars indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 99,
            background: "rgba(10,14,22,0.85)",
            border: "1px solid rgba(255,255,255,0.10)",
            fontSize: 13,
            color: "#e2e8f0",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            {[3, 4.5, 2.5, 4, 2].map((height, i) => (
              <rect
                key={i}
                x={i * 4}
                y={10 - height / 2}
                width="2"
                rx="1"
                height={height}
                fill="#34D399"
                style={
                  active
                    ? {
                        animation: "waveBounce 1.6s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`,
                        transformOrigin: "center",
                      }
                    : undefined
                }
              />
            ))}
          </svg>
        </div>

        {/* AI Agent Speaking Status Badge */}
        <div
          className="hidden md:flex"
          style={{
            position: "relative",
            zIndex: 20,
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(10,14,22,0.9)",
            border: "1px solid rgba(16,185,129,0.18)",
            opacity: speaking === "agent" ? 1 : 0.3,
            transition: "opacity 0.4s ease",
          }}
        >
          <div
            className={speaking === "agent" && documentLoaded ? "live-pulse" : ""}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: speaking === "agent" ? "#10B981" : "#475569",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace",
              color: speaking === "agent" ? "#10B981" : "#64748b",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            AI Agent Speaking
          </span>
        </div>
      </div>
    </div>
  );
});
