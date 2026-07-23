
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  animate,
  type Variants,
} from "framer-motion";
import { EXPO_OUT, VIEWPORT } from "./motionConstants";

/* ────────────────────────────────────────────────────────────────────────────
   Shared Framer Motion animation kit for the landing page.

   Goals:
   - Each section gets a DISTINCT entrance variant (not the same fade-up).
   - Animations run ONCE when the section enters the viewport.
   - GPU-friendly: only `transform` / `opacity` / `filter` are animated.
   - prefers-reduced-motion is respected globally — every helper here collapses
     to an instant opacity-only state when the user opts out.
   ──────────────────────────────────────────────────────────────────────────── */

export type RevealVariant =
  | "fadeUp"
  | "slideLeft"
  | "slideRight"
  | "scaleFade"
  | "blurUp";

/** Build entrance variants. When reduced motion is on, collapse to opacity only. */
function buildVariants(variant: RevealVariant, reduced: boolean): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.2 } },
    };
  }
  const hiddenByVariant: Record<RevealVariant, Variants["hidden"]> = {
    fadeUp: { opacity: 0, y: 36 },
    slideLeft: { opacity: 0, x: -56 },
    slideRight: { opacity: 0, x: 56 },
    scaleFade: { opacity: 0, scale: 0.92 },
    blurUp: { opacity: 0, y: 28 },
  };
  return {
    hidden: hiddenByVariant[variant],
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: EXPO_OUT },
    },
  };
}

/* ─── MotionReveal ─────────────────────────────────────────────────────────
   Drop-in replacement for the old <Reveal>, but with selectable entrance
   personality per section. Fires once on view. */
export function MotionReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
  style,
  as = "div",
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion() ?? false;
  const variants = buildVariants(variant, reduced);
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/* ─── Stagger container + item ─────────────────────────────────────────────
   Wrap a list in <Stagger> and each child in <StaggerItem> for a smooth
   cascading reveal. The container drives timing; children inherit it. */
export function Stagger({
  children,
  className,
  style,
  stagger = 0.09,
  delayChildren = 0.05,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  stagger?: number;
  delayChildren?: number;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  variant = "fadeUp",
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: RevealVariant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      className={className}
      style={style}
      variants={buildVariants(variant, reduced)}
    >
      {children}
    </motion.div>
  );
}

/* ─── WordReveal ───────────────────────────────────────────────────────────
   Reveals a headline word-by-word on view. Preserves an optional gradient/
   styled className on the words (used for the Hero's coloured line). */
export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.08,
  style,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion() ?? false;
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      style={{ display: "inline", ...style }}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
        >
          <motion.span
            className={wordClassName}
            style={{ display: "inline-block", willChange: "transform" }}
            variants={
              reduced
                ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                : {
                    hidden: { opacity: 0, y: "0.9em" },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: EXPO_OUT },
                    },
                  }
            }
            aria-hidden
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </motion.span>
  );
}

/* ─── CountUp ──────────────────────────────────────────────────────────────
   Animates the numeric part of a display string from 0 → target when in view.
   Preserves any prefix ($, ~), suffix (%, ×, +, /yr, /mo …) and comma grouping
   from the original string. Non-numeric strings ("Custom", "SOC 2") render as-is. */
export function CountUp({
  value,
  className,
  style,
  duration = 1.4,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  // Parse once per value: leading prefix, the number (with , and .), trailing suffix.
  // Skip when the prefix contains letters (e.g. "SOC 2") — counting those reads oddly.
  // Memoised so its identity is stable across the re-renders that setDisplay triggers
  // (otherwise the count-up effect would restart every frame and never progress).
  const parts = useMemo(() => {
    const m = value.match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
    if (!m || /[A-Za-z]/.test(m[1])) return null;
    const [, prefix, numStr, suffix] = m;
    const intStr = numStr.split(".")[0].replace(/,/g, "");
    return {
      prefix,
      suffix,
      hasComma: numStr.includes(","),
      decimals: numStr.includes(".") ? numStr.split(".")[1].length : 0,
      padLen: intStr.startsWith("0") && intStr.length > 1 ? intStr.length : 0,
      target: parseFloat(numStr.replace(/,/g, "")),
    };
  }, [value]);

  const [display, setDisplay] = useState(() =>
    parts && !reduced ? `${parts.prefix}${"0".padStart(parts.padLen || 1, "0")}${parts.suffix}` : value,
  );

  useEffect(() => {
    // Reduced-motion / non-numeric values render statically (already the initial state).
    if (!parts || reduced || !inView) return;
    const { prefix, suffix, hasComma, decimals, padLen, target } = parts;
    const controls = animate(0, target, {
      duration,
      ease: EXPO_OUT,
      onUpdate(v) {
        const fixed = v.toFixed(decimals);
        const decPart = fixed.includes(".") ? fixed.split(".")[1] : "";
        let intPart = fixed.split(".")[0];
        if (hasComma) intPart = Number(intPart).toLocaleString("en-US");
        else if (padLen) intPart = intPart.padStart(padLen, "0");
        setDisplay(`${prefix}${intPart}${decPart ? "." + decPart : ""}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [inView, parts, reduced, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PREMIUM ANIMATION COMPONENTS — Apple/Stripe-quality motion
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── ClipReveal ─────────────────────────────────────────────────────────────
   Reveals content using clip-path — unique per direction. */
export function ClipReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.8,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "circle";
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion() ?? false;

  const clips: Record<string, string> = {
    up: "inset(100% 0 0 0)",
    down: "inset(0 0 100% 0)",
    left: "inset(0 100% 0 0)",
    right: "inset(0 0 0 100%)",
    circle: "circle(0% at 50% 50%)",
  };

  const finalClip: Record<string, string> = {
    up: "inset(0% 0 0 0)",
    down: "inset(0% 0 0 0)",
    left: "inset(0% 0 0 0)",
    right: "inset(0% 0 0 0)",
    circle: "circle(100% at 50% 50%)",
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: clips[direction], opacity: 0 }}
      animate={inView ? { clipPath: finalClip[direction], opacity: 1 } : {}}
      transition={{
        duration: reduced ? 0.1 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── PerspectiveCard ────────────────────────────────────────────────────────
   3D perspective card that follows mouse with spotlight effect. */
export function PerspectiveCard({
  children,
  className,
  style,
  glareColor = "rgba(37,99,235,0.08)",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glareColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlarePos({ x: 50, y: 50 });
    setIsHovered(false);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform,
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        transformStyle: "preserve-3d",
        position: "relative",
        ...style,
      }}
    >
      {/* Glare overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.4s ease",
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 60%)`,
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

/* ─── MagneticHover ──────────────────────────────────────────────────────────
   Elements that follow cursor with spring physics. */
export function MagneticHover({
  children,
  className,
  strength = 0.3,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("translate(0px, 0px)");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setTransform(`translate(${x}px, ${y}px)`);
  };

  const handleMouseLeave = () => setTransform("translate(0px, 0px)");

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      animate={{ x: 0, y: 0 }}
      style={{
        transform,
        transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1)",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── GradientText ───────────────────────────────────────────────────────────
   Animated gradient text with optional movement. */
export function GradientText({
  children,
  className,
  animate: shouldAnimate = true,
  colors = ["#2563EB", "#10B981", "#8b5cf6", "#2563EB"],
}: {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  colors?: string[];
}) {
  const gradient = `linear-gradient(135deg, ${colors.join(", ")})`;
  const gradientSize = shouldAnimate ? "300% 300%" : "100% 100%";

  return (
    <span
      className={className}
      style={{
        background: gradient,
        backgroundSize: gradientSize,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        animation: shouldAnimate ? "gradientShift 6s ease infinite" : "none",
      }}
    >
      {children}
    </span>
  );
}

/* ─── FloatingOrbs ───────────────────────────────────────────────────────────
   Ambient floating orbs for background depth. */
export function FloatingOrbs({
  count = 3,
  colors = ["#2563EB", "#10B981", "#8b5cf6"],
}: {
  count?: number;
  colors?: string[];
}) {
  const orbs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        size: 200 + (i * 80) % 200,
        x: (i * 37) % 80 + 10,
        y: (i * 53) % 80 + 10,
        duration: 15 + (i * 5),
        delay: i * 2,
      })),
    [count, colors],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, ${orb.color}12, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 20, -40, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── ScrollProgress ─────────────────────────────────────────────────────────
   Scroll progress indicator — thin gradient bar at top of section. */
export function ScrollProgress({
  color = "linear-gradient(90deg, #2563EB, #10B981)",
  height = 2,
}: {
  color?: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={ref} className="absolute top-0 left-0 right-0" style={{ height, zIndex: 50 }}>
      <motion.div
        style={{
          height: "100%",
          background: color,
          scaleX: scrollYProgress,
          transformOrigin: "left",
          borderRadius: 99,
        }}
      />
    </div>
  );
}

/* ─── AnimatedCounter ────────────────────────────────────────────────────────
   Number counter with animated progress ring. */
export function AnimatedCounter({
  value,
  label,
  icon,
  color = "#10B981",
  delay = 0,
}: {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      ref={ref}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div
        className="text-3xl sm:text-4xl font-extrabold"
        style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1 font-medium tracking-wide">{label}</div>
    </motion.div>
  );
}

/* ─── SlideReveal ────────────────────────────────────────────────────────────
   Content slides in from a direction with a mask/clip effect. */
export function SlideReveal({
  children,
  className,
  from = "bottom",
  delay = 0,
  duration = 0.8,
  distance = 80,
}: {
  children: React.ReactNode;
  className?: string;
  from?: "top" | "bottom" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion() ?? false;

  const dirMap = {
    top: { x: 0, y: -distance },
    bottom: { x: 0, y: distance },
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
  };

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, ...dirMap[from] }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ─── GlowBorder ─────────────────────────────────────────────────────────────
   Animated glowing border that follows mouse position. */
export function GlowBorder({
  children,
  className,
  color = "#2563EB",
  intensity = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [visible, setVisible] = useState(false);

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "inherit",
          padding: 1,
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${color}${Math.round(intensity * 255).toString(16).padStart(2, "0")}, transparent 60%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}
