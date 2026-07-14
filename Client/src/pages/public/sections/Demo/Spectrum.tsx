import React from "react";
import { PARTICLE_FIELD } from "../data";

const total = 48;
const center = (total - 1) / 2;

const BARS_DATA = Array.from({ length: total }).map((_, i) => {
  const dist = Math.abs(i - center);
  const distRatio = dist / center;
  const centerGap = distRatio < 0.3 ? 0 : 1;
  const peakPos = 0.18;
  const envelope =
    distRatio < peakPos
      ? 0.45 + (distRatio / peakPos) * 0.35
      : 1 - ((distRatio - peakPos) / (1 - peakPos)) * 0.78;

  const seed = (i * 7919 + 104729) % 1000;
  const jitter = 0.75 + (seed / 1000) * 0.4;
  const h = Math.max(2, Math.min(16, envelope * jitter * 16 * centerGap));
  const isLeftHalf = i < total / 2;
  const background = isLeftHalf
    ? "linear-gradient(180deg,#5eead4,#10b981)"
    : "linear-gradient(180deg,#7dd3fc,#3b82f6)";
  const shadow = isLeftHalf
    ? "0 0 4px rgba(16,185,129,0.3)"
    : "0 0 4px rgba(59,130,246,0.3)";

  return { h, background, shadow, index: i };
});

export const Spectrum = React.memo(function Spectrum({ active }: { active: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        transform: "none",
        perspective: "none",
      }}
    >
      {/* Particle dots layer */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {PARTICLE_FIELD.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={50 + p.y * 38}
            r={p.size * 0.35}
            fill={p.x < 50 ? "#34D399" : "#60a5fa"}
            opacity={active ? p.opacity : p.opacity * 0.35}
            style={
              active
                ? {
                    animation: `dotFlicker ${2.2 + p.delay}s ease-in-out ${p.delay}s infinite`,
                  }
                : undefined
            }
          />
        ))}
      </svg>

      {/* Bar spectrum layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          paddingLeft: "5%",
          paddingRight: "5%",
          transform: "none",
        }}
      >
        {BARS_DATA.map((bar) => (
          <div
            key={bar.index}
            className="spectrum-bar"
            style={{
              width: 3,
              borderRadius: 99,
              height: `${bar.h}%`,
              background: bar.background,
              opacity: active ? 0.88 : 0.15,
              boxShadow: active ? bar.shadow : "none",
              transform: active ? "scaleY(1)" : "scaleY(0.12)",
              transformOrigin: "center",
              animation: active
                ? `waveBounce ${3.0 + (bar.index % 6) * 0.35}s ease-in-out ${bar.index * 0.05}s infinite`
                : "none",
              transition: "transform .4s ease, opacity .4s ease",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
});
