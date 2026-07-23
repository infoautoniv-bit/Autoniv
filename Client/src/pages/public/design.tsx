import { useEffect, useRef, useState } from 'react';
import logoBrand from '../../assets/autoniv-brand-logo.webp';

/* ─── Design Tokens ─── */
export const LOGO_SRC = logoBrand;
export const BRAND = 'linear-gradient(135deg,#2563EB,#10B981)';
export const INK = '#0f172a';
export const SLATE = '#64748b';
export const MUTE = '#94a3b8';
export const HAIRLINE = 'rgba(15,23,42,0.08)';
export const SURFACE = '#ffffff';
export const TINT = '#f6f8fb';
export const MONO = "'JetBrains Mono', monospace";
export const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

/* ─── Scroll Reveal ─── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Section Label (eyebrow) ─── */
export function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <div style={{ width: 18, height: 2, borderRadius: 2, background: BRAND }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#2563EB', textTransform: 'uppercase', fontFamily: MONO }}>
        {text}
      </span>
    </div>
  );
}

/* ─── Gradient word helper ─── */
export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
      {children}
    </span>
  );
}

/* ─── Hero waveform ─── */
export function HeroWaveform() {
  const bars = Array.from({ length: 64 });
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 160, opacity: 0.55, pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <linearGradient id="waveFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {bars.map((_, i) => {
        const x = (i / bars.length) * 800;
        const seed = Math.sin(i * 1.7) * Math.cos(i * 0.6);
        const h = 18 + Math.abs(seed) * 90 + Math.abs(Math.sin(i * 0.35)) * 30;
        return (
          <rect key={i} x={x} y={160 - h} width={800 / bars.length - 3} height={h} rx={2} fill="url(#waveFade)"
            style={{ animation: `wavePulse 3.2s ease-in-out ${(i % 12) * 0.12}s infinite`, transformOrigin: 'bottom' }}
          />
        );
      })}
      <style>{`
        @keyframes wavePulse { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.62)} }
        @media (prefers-reduced-motion: reduce) { rect { animation: none !important; } }
      `}</style>
    </svg>
  );
}

/* ─── FAQ Item ─── */
export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [answer]);

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{
      background: SURFACE,
      border: `1px solid ${open ? 'rgba(37,99,235,0.28)' : HAIRLINE}`,
      boxShadow: open ? '0 12px 32px -8px rgba(37,99,235,0.16), 0 2px 8px rgba(15,23,42,0.04)' : '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
        style={{ background: 'none', border: 'none' }} aria-expanded={open}>
        <span className="text-sm sm:text-base font-semibold" style={{ color: INK }}>{question}</span>
        <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? BRAND : 'rgba(15,23,42,0.05)', transition: 'background 0.3s' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <path d="M2 4.5L6 8.5L10 4.5" stroke={open ? '#fff' : '#64748b'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      <div style={{ maxHeight: open ? contentHeight ?? 400 : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
        <div ref={contentRef} className="px-6 pb-5" style={{ borderTop: '1px solid rgba(37,99,235,0.08)' }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: SLATE }}>{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1" style={{
      background: SURFACE,
      border: `1px solid ${HAIRLINE}`,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 2, borderRadius: '0 0 4px 4px', background: BRAND, opacity: 0.7 }} />
      <div className="text-4xl sm:text-5xl font-black mb-2 tracking-tight" style={{ background: BRAND, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: MONO }}>
        {value}
      </div>
      <div className="text-sm font-bold mb-0.5" style={{ color: INK }}>{label}</div>
      <div className="text-xs" style={{ color: MUTE, fontFamily: MONO, letterSpacing: '0.01em' }}>{description}</div>
    </div>
  );
}

/* ─── Decorative CTA circles ─── */
export function CTADecorations() {
  return (
    <>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)', pointerEvents: 'none' }} />
    </>
  );
}
