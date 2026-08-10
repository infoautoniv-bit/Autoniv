import { useEffect, useState, memo } from 'react';
import { useReducedMotion } from 'framer-motion';

export const AnimatedCounter = memo(({ value, suffix = '', prefix = '', className = '' }: { 
  value: number; suffix?: string; prefix?: string; className?: string 
}) => {
  const [display, setDisplay] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      const handle = setTimeout(() => setDisplay(value), 0);
      return () => clearTimeout(handle);
    }
    let frame = 0;
    const total = 35;
    let animId: number;
    const tick = () => {
      frame++;
      const progress = frame / total;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (frame < total) animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [value, prefersReduced]);

  return <span className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
});
