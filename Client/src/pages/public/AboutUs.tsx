import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import rajneshSirPhoto from '../../assets/rajnesh-yadav-founder-ceo.webp';
import Footer from './Footer';
import ScrollToTop from '../../components/ScrollToTop';
import { PublicNavbar } from '../../components/PublicNavbar';
import { USPSlider } from './sections/USPSlider';
import { injectSchema, LOCAL_BUSINESS_SCHEMA } from '../../utils/schema';

/* ───────────────────────────────────────────────────────────
   Design tokens (kept in one place so every section reads off
   the same system instead of inventing new values per-block)
─────────────────────────────────────────────────────────────── */
const BRAND = 'linear-gradient(135deg,#2563EB,#10B981)';
const INK = '#0f172a';
const SLATE = '#64748b';
const MUTE = '#94a3b8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const SURFACE = '#ffffff';
const TINT = '#f6f8fb';
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

/* ───────────────────────────────────────────────────────────
   Scroll reveal — small intersection-observer hook.
   Respects prefers-reduced-motion; one orchestrated pattern
   reused everywhere instead of bespoke animation per section.
─────────────────────────────────────────────────────────────── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

/* ─── FAQ Item ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: SURFACE,
        border: `1px solid ${open ? 'rgba(37,99,235,0.28)' : HAIRLINE}`,
        boxShadow: open
          ? '0 12px 32px -8px rgba(37,99,235,0.16), 0 2px 8px rgba(15,23,42,0.04)'
          : '0 1px 2px rgba(15,23,42,0.04)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
        style={{ background: 'none', border: 'none' }}
        aria-expanded={open}
      >
        <span className="text-sm sm:text-base font-semibold" style={{ color: INK }}>
          {question}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: open ? BRAND : 'rgba(15,23,42,0.05)',
            transition: 'background 0.3s',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
          >
            <path d="M2 4.5L6 8.5L10 4.5" stroke={open ? '#fff' : '#64748b'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      <div
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div ref={contentRef} className="px-6 pb-5" style={{ borderTop: '1px solid rgba(37,99,235,0.08)' }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: SLATE }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
  return (
    <div
      className="p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1"
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 16,
          right: 16,
          height: 2,
          borderRadius: '0 0 4px 4px',
          background: BRAND,
          opacity: 0.7,
        }}
      />
      <div
        className="text-4xl sm:text-5xl font-black mb-2 tracking-tight"
        style={{
          background: BRAND,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: MONO,
        }}
      >
        {value}
      </div>
      <div className="text-sm font-bold mb-0.5" style={{ color: INK }}>{label}</div>
      <div className="text-xs" style={{ color: MUTE, fontFamily: MONO, letterSpacing: '0.01em' }}>{description}</div>
    </div>
  );
}

/* ─── Value Card ─── */
function ValueCard({ icon, title, description, accent }: { icon: string; title: string; description: string; accent: string }) {
  return (
    <div
      className="p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.08)',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: `${accent}14`,
          border: `1px solid ${accent}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 21,
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: INK }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: SLATE }}>{description}</p>
    </div>
  );
}

/* ─── Process Step ───
   Numbering is justified here: this is a real, ordered
   implementation sequence, not decoration. */
function Step({ number, title, description, last }: { number: string; title: string; description: string; last?: boolean }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: BRAND,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
          }}
        >
          {number}
        </div>
        {!last && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 44,
              marginTop: 6,
              background: 'repeating-linear-gradient(to bottom, rgba(37,99,235,0.35) 0, rgba(37,99,235,0.35) 4px, transparent 4px, transparent 9px)',
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: last ? 0 : 34 }}>
        <h3 className="text-base font-bold mb-1.5" style={{ color: INK }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: SLATE }}>{description}</p>
      </div>
    </div>
  );
}

/* ─── Section Label (eyebrow) ─── */
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <div style={{ width: 18, height: 2, borderRadius: 2, background: BRAND }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#2563EB',
          textTransform: 'uppercase',
          fontFamily: MONO,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ─── Gradient word helper ─── */
function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: BRAND,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

/* ─── Main Export ─── */
export function AboutUS() {
  useEffect(() => {
    return injectSchema('local-business-jsonld', LOCAL_BUSINESS_SCHEMA);
  }, []);

  const faqs = [
    { q: 'What exactly does Autoniv do?', a: 'Autoniv deploys AI voice agents that handle your business phone calls 24/7 — answering inbound calls, running outbound campaigns, qualifying leads, booking appointments, and following up with customers, all without adding headcount.' },
    { q: 'Is this just another IVR or phone bot?', a: "No. Traditional IVRs make callers press buttons and navigate menus. Autoniv's AI voice agents hold natural two-way conversations, handle unexpected questions, and respond intelligently — the way a trained human rep would." },
    { q: 'How fast can we go live?', a: "Most clients go live in under 24 hours. We handle the full setup — voice design, agent configuration, and CRM integration — so there's no months-long implementation or complex tech work on your end." },
    { q: "Will our customers know they're talking to AI?", a: "Autoniv's voice agents are designed to sound natural and conversational. When a caller needs or requests a human, the AI transfers the call seamlessly with full context — so no one ever has to repeat themselves." },
    { q: "What happens when the AI doesn't know the answer?", a: "The agent transfers the call to a live team member, passing along everything discussed so the conversation continues smoothly. No dropped calls, no frustrated customers starting over." },
    { q: 'Which tools does Autoniv integrate with?', a: 'Autoniv connects to your CRM, calendar, and phone system during setup. Leads are logged automatically, appointments are booked in real time, and zero manual data entry is required.' },
    { q: 'What kinds of businesses is Autoniv built for?', a: 'Autoniv serves healthcare, real estate, finance, insurance, startups, enterprises, service businesses, agencies, and small businesses. Each AI voice agent is configured for the specific language and needs of your industry.' },
    { q: 'How much does Autoniv cost compared to a call center?', a: 'Clients typically reduce their cost per call interaction by up to 70% compared to a traditional call center — eliminating staffing, training, overtime, and inconsistency costs. For a quote tailored to your call volume, book a free strategy call.' },
    { q: 'Can I track what my AI agent says on calls?', a: 'Yes. Every call is transcribed and searchable in a real-time dashboard. You can review exactly what your AI agent said, spot trends, and continuously improve performance with real data.' },
    { q: 'How do I get started?', a: "Book a free 30-minute strategy call with the Autoniv team. We'll map your call flows, show you where you're losing revenue, and walk you through what your custom AI voice agent would look like — no credit card, no obligation." },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: TINT,
        fontFamily: SANS,
        color: INK,
      }}
    >
      <USPSlider />
      <PublicNavbar />

      <div style={{ paddingTop: 130 }}>

        {/* ── Hero ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
            borderBottom: `1px solid ${HAIRLINE}`,
            padding: '76px 24px 0',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="max-w-4xl mx-auto text-center" style={{ position: 'relative', zIndex: 1, paddingBottom: 56 }}>
            <Reveal>
              <SectionLabel text="About Autoniv" />
              <h1
                style={{
                  fontSize: 'clamp(34px,5.2vw,62px)',
                  fontWeight: 900,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.08,
                  color: INK,
                  margin: '0 0 20px',
                }}
              >
                We give your business a voice{' '}
                <GradientText>that never sleeps.</GradientText>
              </h1>
              <p style={{ fontSize: 17, color: SLATE, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
                Autoniv deploys intelligent AI voice agents that handle your calls, qualify leads, book appointments, and delight customers — 24/7, without adding headcount.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/register"
                  className="px-8 py-3.5 rounded-full text-sm font-bold text-white no-underline inline-block text-center transition-all duration-200"
                  style={{
                    background: BRAND,
                    boxShadow: '0 6px 24px -4px rgba(16,185,129,0.32)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px -4px rgba(16,185,129,0.42)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px -4px rgba(16,185,129,0.32)'; }}
                >
                  Start Automating Calls →
                </Link>
                <Link
                  to="/services"
                  className="px-8 py-3.5 rounded-full text-sm font-bold no-underline inline-block text-center transition-all duration-200"
                  style={{ background: SURFACE, border: '1.5px solid rgba(15,23,42,0.10)', color: '#475569' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.32)'; e.currentTarget.style.color = '#2563EB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.10)'; e.currentTarget.style.color = '#475569'; }}
                >
                  See How It Works
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ padding: '60px 24px 64px', background: TINT }}>
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard value="10×" label="Faster Call Response" description="vs human teams" />
                <StatCard value="24/7" label="Always Available" description="without overtime costs" />
                <StatCard value="70%" label="Cost Reduction" description="per call interaction" />
                <StatCard value="<48h" label="Deployment Time" description="average time to go live" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Mission ── */}
  <div style={{ padding: '0 24px 64px', background: TINT }}>
  <div className="max-w-6xl mx-auto">
    <Reveal>
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: SURFACE,
          border: `1px solid ${HAIRLINE}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 20px 48px -20px rgba(15,23,42,0.10)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div style={{ padding: '52px 48px' }}>
            <SectionLabel text="Our Mission" />
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 18px', lineHeight: 1.2 }}>
              Automation that<br />
              <GradientText>actually sounds human</GradientText>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.75, margin: 0 }}>
                Every missed call is a missed opportunity. Every hold queue erodes trust. Every understaffed customer service moment costs you a customer you worked hard to earn.
              </p>
              <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.75, margin: 0 }}>
                At Autoniv, we're on a mission to eliminate those moments forever — for businesses of every size, in every industry. We believe the future of business communication isn't more people answering phones. It's smarter AI voice agents that sound natural, respond instantly, and never have a bad day.
              </p>
            </div>
          </div>
          
          {/* Quote panel with Extra Large Founder Image */}
          <div
            style={{
              padding: '52px 48px',
              background: 'linear-gradient(135deg,rgba(37,99,235,0.05),rgba(16,185,129,0.05))',
              borderLeft: `1px solid ${HAIRLINE}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: 3,
                background: BRAND,
              }}
            />
            
            {/* Extra Large Founder Image */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {/* Glow behind image */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)',
                    animation: 'pulseGlow 3s ease-in-out infinite',
                  }}
                />
                
                <div
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '4px solid rgba(37,99,235,0.25)',
                    boxShadow: '0 12px 48px rgba(37,99,235,0.25), 0 4px 16px rgba(0,0,0,0.08)',
                    background: 'linear-gradient(135deg, #2563EB, #10B981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  className="founder-image-container"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 16px 56px rgba(37,99,235,0.35), 0 4px 16px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(37,99,235,0.25), 0 4px 16px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Decorative gradient ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: '3px solid transparent',
                      background: 'linear-gradient(135deg, #2563EB, #10B981, #2563EB) border-box',
                      WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'destination-out',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                      animation: 'spinRing 8s linear infinite',
                    }}
                  />
                  
                  <img 
                    src={rajneshSirPhoto} 
                    alt="Rajnesh Yadav - Founder & CEO of Autoniv" 
                    width={500}
                    height={500}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* Fallback initials if image fails to load */}
                  <span 
                    style={{ 
                      fontSize: 64, 
                      fontWeight: 800, 
                      color: '#fff',
                      display: 'none',
                      fontFamily: MONO,
                      textShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    className="fallback-initials"
                  >
                    RY
                  </span>
                </div>
              </div>
              
              {/* Name and Title */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <div style={{ 
                  fontSize: 22, 
                  fontWeight: 800, 
                  color: INK,
                  letterSpacing: '-0.02em',
                }}>
                  Rajnesh Yadav
                </div>
                <div style={{ 
                  fontSize: 14, 
                  color: MUTE, 
                  fontFamily: MONO, 
                  marginTop: 4,
                  letterSpacing: '0.02em',
                }}>
                  Founder &amp; CEO, Autoniv
                </div>
                
                {/* Social/Trust badges */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 12, 
                  marginTop: 12,
                }}>
                  <span style={{ 
                    fontSize: 11, 
                    padding: '4px 12px', 
                    borderRadius: 99,
                    background: 'rgba(37,99,235,0.08)',
                    color: '#2563EB',
                    fontFamily: MONO,
                    fontWeight: 600,
                  }}>
                    ✦ 10+ Years
                  </span>
                  <span style={{ 
                    fontSize: 11, 
                    padding: '4px 12px', 
                    borderRadius: 99,
                    background: 'rgba(16,185,129,0.08)',
                    color: '#10B981',
                    fontFamily: MONO,
                    fontWeight: 600,
                  }}>
                    ✦ AI Expert
                  </span>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div style={{ marginTop: 28, textAlign: 'center', maxWidth: 420 }}>
              <div
                style={{
                  fontSize: 56,
                  lineHeight: 0.8,
                  color: 'rgba(37,99,235,0.08)',
                  fontFamily: 'Georgia, serif',
                  marginBottom: 4,
                }}
              >
                "
              </div>
              <p style={{ 
                fontSize: 17, 
                color: INK, 
                lineHeight: 1.7, 
                fontStyle: 'italic', 
                fontWeight: 500, 
                margin: 0,
              }}>
                Your business doesn't sleep. Your phone system shouldn't either. We built Autoniv so every call gets the best possible answer — every single time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  </div>
  
  {/* Add animations */}
  <style>{`
    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 1; }
    }
    
    @keyframes spinRing {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .founder-image-container {
      will-change: transform, box-shadow;
    }
  `}</style>
</div>

        {/* ── Founder pillars ── */}
        <div style={{ padding: '0 24px 64px', background: TINT }}>
          <Reveal>
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '🎯', label: 'Industry Focus', value: 'AI Voice Automation & Conversational AI' },
                { icon: '🏢', label: 'Sectors Served', value: 'Healthcare, Real Estate, Finance, Agencies, SMBs' },
                { icon: '⚡', label: 'Core Belief', value: 'Every business deserves enterprise-grade AI' },
                { icon: '🌏', label: 'Vision', value: 'Voice automation for every business, no tech degree required' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${HAIRLINE}`,
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: INK, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: MUTE, lineHeight: 1.5 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ── The Story ── */}
        <div style={{ padding: '0 24px 64px', background: TINT }}>
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div
                className="rounded-3xl p-10 sm:p-14"
                style={{
                  background: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 20px 48px -20px rgba(15,23,42,0.10)',
                }}
              >
                <SectionLabel text="Our Story" />
                <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 6px', lineHeight: 1.2 }}>
                  Built by someone who watched businesses{' '}
                  <GradientText>bleed revenue</GradientText>{' '}
                  through missed calls.
                </h2>
                <p style={{ fontSize: 13, color: MUTE, marginBottom: 28, fontFamily: MONO }}>— Rajnesh Yadav, Founder</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
                  {[
                    "Rajnesh Yadav didn't build Autoniv in a vacuum. He watched — up close — how small businesses, real estate agencies, healthcare providers, and growing startups were losing thousands of dollars every week to a completely solvable problem: unanswered and poorly handled phone calls.",
                    "The receptionists were overwhelmed. The call centers were expensive and inconsistent. The chatbots were cold and frustrating. And the customers? They were hanging up and calling competitors.",
                    "Rajnesh believed there was a better way. A way that combined the warmth of a human conversation with the precision and availability of AI. So he built Autoniv — an AI voice automation platform designed not for the Fortune 500, but for the businesses that needed it most.",
                    "Today, Autoniv's AI voice agents handle inbound calls, conduct outbound campaigns, qualify leads in real time, book appointments automatically, and follow up with prospects — all in a voice that sounds natural enough that callers don't realize they're talking to AI. That's not a bug. That's the point.",
                  ].map((text, i) => (
                    <p key={i} style={{ fontSize: 14, color: SLATE, lineHeight: 1.8, margin: 0 }}>{text}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Core Values ── */}
        <div style={{ padding: '0 24px 64px', background: TINT }}>
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-10">
                <SectionLabel text="Core Values" />
                <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 10px' }}>
                  What drives every decision we make
                </h2>
                <p style={{ fontSize: 14, color: MUTE, maxWidth: 440, margin: '0 auto' }}>
                  Four principles we've held since day one — and still won't compromise on.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ValueCard icon="⚡" title="Speed of Impact" description="We don't believe in 90-day onboarding timelines. Our clients go live in under 48 hours. Because every day without automation is a day of revenue lost." accent="#2563EB" />
                <ValueCard icon="🎯" title="Results Over Features" description="We don't sell you a feature list. We sell you outcomes — more leads qualified, more appointments booked, lower call abandonment, higher customer satisfaction." accent="#10B981" />
                <ValueCard icon="🤝" title="Human-First AI" description="Our AI sounds natural because we obsess over conversational design. Every voice agent is built to leave callers feeling heard, helped, and respected." accent="#6366f1" />
                <ValueCard icon="🔓" title="Radical Accessibility" description="Enterprise-grade AI voice technology shouldn't require an enterprise budget. A 5-person startup can deploy the same power as a 500-person call center." accent="#f59e0b" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── How It Works ── */}
        <div
          style={{
            padding: '68px 24px',
            background: SURFACE,
            borderTop: `1px solid ${HAIRLINE}`,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <Reveal>
                <div>
                  <SectionLabel text="How It Works" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 10px', lineHeight: 1.2 }}>
                    From silent phone to{' '}
                    <GradientText>revenue machine</GradientText>
                    {' '}— in 4 steps.
                  </h2>
                  <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.7, margin: '0 0 36px' }}>
                    No long implementations. No complex tech. Just a working AI voice agent in under 48 hours.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white no-underline transition-all duration-200"
                    style={{ background: BRAND, boxShadow: '0 6px 18px -4px rgba(16,185,129,0.28)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Get started today →
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <div>
                  <Step number="01" title="Discovery & Voice Design" description="We map your call flows, define personas, and design conversation scripts tailored to your industry, tone, and customer journey." />
                  <Step number="02" title="AI Agent Configuration" description="Your custom AI voice agent is trained on your business logic — products, pricing, FAQs, objections, and escalation protocols." />
                  <Step number="03" title="Integration & Deployment" description="We connect your AI agent to your CRM, calendar, phone system, and data sources. Go live in under 48 hours." />
                  <Step number="04" title="Monitor, Optimize, Scale" description="Track every call in a real-time dashboard. We continuously optimize performance and scale capacity as your business grows." last />
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ padding: '68px 24px', background: TINT }}>
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="text-center mb-10">
                <SectionLabel text="FAQ" />
                <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 10px' }}>
                  Everything you need to know
                </h2>
                <p style={{ fontSize: 14, color: MUTE }}>
                  Got questions? We've got answers. Here's what businesses ask us most.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faqs.map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
              <div
                className="mt-8 p-7 rounded-2xl text-center"
                style={{ background: SURFACE, border: `1px solid ${HAIRLINE}` }}
              >
                <p style={{ fontSize: 14, color: SLATE, margin: '0 0 14px' }}>
                  Still have questions? We're here to help.
                </p>
                <Link
                  to="/contact"
                  className="inline-block px-6 py-2.5 rounded-full text-sm font-bold text-white no-underline transition-all duration-200"
                  style={{ background: BRAND, boxShadow: '0 6px 18px -4px rgba(16,185,129,0.24)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Contact Our Team →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ padding: '0 24px 80px', background: TINT }}>
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div
                className="rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,#eff6ff 0%,#f0fdf9 100%)',
                  border: '1.5px solid rgba(37,99,235,0.14)',
                  boxShadow: '0 20px 56px -16px rgba(37,99,235,0.14)',
                }}
              >
                {/* decorative circles */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)', pointerEvents: 'none' }} />
                <div className="relative z-10">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 16px',
                      borderRadius: 99,
                      background: 'rgba(37,99,235,0.09)',
                      border: '1px solid rgba(37,99,235,0.18)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#2563EB',
                      letterSpacing: '0.08em',
                      marginBottom: 20,
                      fontFamily: MONO,
                    }}
                  >
                    ✦ &nbsp;FREE STRATEGY CALL
                  </div>
                  <h2 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: INK, margin: '0 0 16px', lineHeight: 1.15 }}>
                    Your competitors are already automating.
                    <br />
                    <GradientText>Are you?</GradientText>
                  </h2>
                  <p style={{ fontSize: 15, color: SLATE, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
                    Book a free 30-minute strategy call. We'll map your call flows, identify your biggest leaks, and show you exactly what your custom AI voice agent would look like — no obligation.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Link
                      to="/login"
                      className="px-8 py-4 rounded-full text-sm font-bold text-white no-underline inline-block text-center transition-all duration-200"
                      style={{ background: BRAND, boxShadow: '0 8px 26px -4px rgba(16,185,129,0.34)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(16,185,129,0.44)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 26px -4px rgba(16,185,129,0.34)'; }}
                    >
                      Book My Free Strategy Call →
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 rounded-full text-sm font-bold no-underline inline-block text-center transition-all duration-200"
                      style={{ background: SURFACE, border: '1.5px solid rgba(15,23,42,0.10)', color: '#475569' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.32)'; e.currentTarget.style.color = '#2563EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.10)'; e.currentTarget.style.color = '#475569'; }}
                    >
                      See a Live Demo
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs" style={{ color: MUTE }}>
                    <span>🔒 No credit card required</span>
                    <span>↩ Cancel anytime</span>
                    <span>⚡ Go live in &lt;48 hours</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default AboutUS;