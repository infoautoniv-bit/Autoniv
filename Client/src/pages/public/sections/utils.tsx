import { useRef, useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import { PARTICLE_FIELD } from "./data";

/* ─── NoiseOverlay ───────────────────────────────────── */
export function NoiseOverlay() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const S = 256;
    c.width = S;
    c.height = S;
    const id = ctx.createImageData(S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 10;
    }
    ctx.putImageData(id, 0, 0);
  }, []);
  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.025]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/* ─── Aurora ─────────────────────────────────────────────── */
export function Aurora() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="aurora-orb aurora-1" />
      <div className="aurora-orb aurora-2" />
      <div className="aurora-orb aurora-3" />
    </div>
  );
}



/* ───────────────────────────────────────────────────────────────────
   2) COMPONENTS — add alongside your other component definitions
   (e.g. near Waveform / VoiceOrb)
   ─────────────────────────────────────────────────────────────────── */

/* ─── Full Spectrum Field (bars + particles, low height, slow speed) ── */

export const SpectrumField = memo(function SpectrumField({ active }: { active: boolean }) {
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
            style={{
              animation: active
                ? `dotFlicker ${2.2 + p.delay}s ease-in-out ${p.delay}s infinite`
                : "none",
            }}
          />
        ))}
      </svg>

      {/* Bar spectrum layer — bars are centered vertically as a column, growing symmetrically
          from a fixed midline (NOT skewed/rotated). Each bar's own height controls how far
          it extends above/below that midline equally, capped well inside the panel. */}
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
        {Array.from({ length: 48 }).map((_, i) => {
          const total = 48;
          const center = (total - 1) / 2;
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

          const h = Math.max(
            2,
            Math.min(16, envelope * jitter * 16 * centerGap),
          );

          const isLeftHalf = i < total / 2;

          return (
            <div
              key={i}
              className="spectrum-bar"
              style={{
                width: 3,
                borderRadius: 99,
                height: `${h}%`,
                background: isLeftHalf
                  ? "linear-gradient(180deg,#5eead4,#10b981)"
                  : "linear-gradient(180deg,#7dd3fc,#3b82f6)",
                opacity: active ? 0.88 : 0.15,
                boxShadow: active
                  ? isLeftHalf
                    ? "0 0 4px rgba(16,185,129,0.3)"
                    : "0 0 4px rgba(59,130,246,0.3)"
                  : "none",
                transform: active ? "scaleY(1)" : "scaleY(0.12)",
                transformOrigin: "center",
                animation: active
                  ? `waveBounce ${3.0 + (i % 6) * 0.35}s ease-in-out ${i * 0.05}s infinite`
                  : "none",
                transition: "transform .4s ease, opacity .4s ease",
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 90% at 50% 50%, transparent 0%, transparent 55%, rgba(10,10,10,0.0) 100%)",
        }}
      />
    </div>
  );
});

/* ─── Glow Ring Orb (cyan ring + solid mic circle) ── */
export const GlowRingOrb = memo(function GlowRingOrb({
  active,
  scale = 1,
}: {
  active: boolean;
  scale?: number;
}) {
  const s = (n: number) => n * scale;
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: s(150),
        height: s(150),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      {/* outer soft glow */}
      <div
        className="glow-ring-orb-glow"
        style={{
          position: "absolute",
          width: s(140),
          height: s(140),
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.04) 55%, transparent 75%)",
          filter: `blur(${s(10)}px)`,
          willChange: active ? "transform, opacity" : "auto",
          animation: active ? "orbPulseGlow 2.6s ease-in-out infinite" : "none",
        }}
      />
      {/* glowing ring */}
      <div
        style={{
          position: "absolute",
          width: s(110),
          height: s(110),
          borderRadius: "50%",
          border: `${Math.max(2, s(4))}px solid`,
          borderColor: "#22d3ee",
          boxShadow: `0 0 ${s(12)}px rgba(34,211,238,0.45), 0 0 ${s(24)}px rgba(59,130,246,0.2), inset 0 0 ${s(10)}px rgba(34,211,238,0.20)`,
        }}
      />
      {/* faint outer ring echo */}
      <div
        style={{
          position: "absolute",
          width: s(130),
          height: s(130),
          borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
      />
      {/* solid mic circle */}
      <div
        style={{
          position: "relative",
          width: s(60),
          height: s(60),
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%,#3b82f6,#1d4ed8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${s(16)}px rgba(37,99,235,0.4)`,
        }}
      >
        <svg
          width={s(24)}
          height={s(24)}
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

/* ─── Scroll Reveal ──────────────────────────────────── */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          revealed.current = true;
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    bottom: "translateY(32px)",
    left: "translateX(-32px)",
    right: "translateX(32px)",
    scale: "scale(0.92)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : transforms[from],
        transition: `opacity .85s ${delay}s cubic-bezier(.16,1,.3,1), transform .85s ${delay}s cubic-bezier(.16,1,.3,1)`,
        willChange: isVisible ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

/* ─── TiltCard ───────────────────────────────────────── */
export function TiltCard({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(14px)`;
    const sh = el.querySelector<HTMLElement>(".shine");
    if (sh) sh.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%,rgba(34,197,94,.10) 0%,transparent 60%)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
    const sh = el.querySelector<HTMLElement>(".shine");
    if (sh) sh.style.background = "transparent";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={{ transition: "transform .14s ease-out", transformStyle: "preserve-3d", ...style }}>
      <div className="shine absolute inset-0 rounded-[inherit] pointer-events-none z-10 transition-all duration-200" />
      {children}
    </div>
  );
}

/* ─── Magnetic Button ────────────────────────────────── */
export function MagBtn({ children, className, to, onClick, style }: {
  children: React.ReactNode; className: string; to?: string; onClick?: () => void; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.35}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = "none"; };
  const inner = to ? (
    <Link to={to} className={className} style={style}>{children}</Link>
  ) : (
    <button onClick={onClick} className={className} style={style}>{children}</button>
  );
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transition: "transform .28s cubic-bezier(.23,1,.32,1)", display: "inline-block" }}>
      {inner}
    </div>
  );
}
