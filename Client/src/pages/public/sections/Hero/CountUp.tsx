import { useRef, useEffect, useState } from "react";
import { animate } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function CountUp({ to, duration = 1.6, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
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
    let last = 0;
    const controls = animate(0, to, {
      duration,
      ease: easeOut,
      onUpdate: (v) => {
        const next = Math.round(v);
        if (next === to || next - last > 5) {
          setVal(next);
          last = next;
        }
      },
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
