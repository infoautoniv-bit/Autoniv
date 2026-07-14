import { useState, useEffect, memo } from 'react';

const USPS = [
  { icon: '🎙️', text: 'AI Voice Agents – Answer, Qualify & Convert Leads 24/7' },
  { icon: '🌍', text: 'Multi-Language Support – AI That Speaks Your Customers\' Language' },
  { icon: '⚡', text: 'Quick Setup – Live in Minutes, No Code Needed' },
] as const;

export const USPSlider = memo(function USPSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((i) => (i + 1) % USPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] overflow-hidden" style={{ background: 'linear-gradient(90deg,#030B2E 0%,#0a1628 50%,#030B2E 100%)', borderBottom: '1px solid rgba(16,185,129,0.15)', height: '36px' }}>
      <div className="relative flex items-center justify-center h-full px-4 sm:px-6">
        {USPS.map((usp, i) => (
          <span key={i} className="absolute inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm font-medium transition-all duration-500 text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[90vw] sm:max-w-full"
            style={{ color: 'rgba(255,255,255,0.85)', opacity: i === current ? 1 : 0, transform: i === current ? 'translateY(0)' : 'translateY(12px)' }}>
            <span className="text-xs sm:text-sm flex-shrink-0">{usp.icon}</span>
            <span className="truncate">{usp.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
});
