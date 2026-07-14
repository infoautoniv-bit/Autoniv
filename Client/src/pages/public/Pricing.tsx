import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { USPSlider } from './sections/USPSlider';
import { PublicNavbar } from '../../components/PublicNavbar';
import { motion } from 'framer-motion';
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, Reveal, SectionLabel, GradientText, FAQItem, CTADecorations } from './design';

interface Plan {
  name: string;
  icon: string;
  iconBg: string;
  monthlyPrice: string;
  yearlyPrice: string;
  period: string;
  badge: string | null;
  monthlyPriceINR: string;
  yearlyPriceINR: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  checkColor: string;
  border: string;
  bg: string;
  shadow: string;
  hoverShadow: string;
  setupFee?: string;
  setupFeeINR?: string;
}

const chatPlans: Plan[] = [
  {
    name: 'Free', icon: '💬', iconBg: 'rgba(100,116,139,0.12)',
    monthlyPrice: '$0', yearlyPrice: '$0', period: 'forever', badge: 'ALWAYS FREE',
    monthlyPriceINR: '₹0', yearlyPriceINR: '₹0',
    desc: 'For individuals & small side projects.',
    features: ['1 chatbot','100 conversations / month','Website embed','Basic FAQ & lead capture','No CRM integration','Branding visible'],
    cta: 'Get started free', popular: false, checkColor: '#64748b',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
  },
  {
    name: 'Starter', icon: '🚀', iconBg: 'rgba(37,99,235,0.10)',
    monthlyPrice: '$49', yearlyPrice: '$39', period: '/month', badge: null,
    monthlyPriceINR: '₹3,499', yearlyPriceINR: '₹2,799',
    desc: 'Freelancers & small businesses getting serious.',
    features: ['3 chatbots','1,000 conversations / month','Website + email channel','Remove branding','Email & chat support','No CRM integration'],
    cta: 'Start 14-day trial', popular: false, checkColor: '#2563EB',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
  },
  {
    name: 'Growth', icon: '📈', iconBg: 'rgba(16,185,129,0.10)',
    monthlyPrice: '$149', yearlyPrice: '$119', period: '/month', badge: 'MOST POPULAR',
    monthlyPriceINR: '₹9,999', yearlyPriceINR: '₹7,999',
    desc: 'SMBs and mid-market teams scaling fast.',
    features: ['10 chatbots','5,000 conversations / month','All channels + multi-language','CRM & helpdesk integrations','Full analytics dashboard','Priority support'],
    cta: 'Start 14-day trial', popular: true, checkColor: '#10B981',
    border: '2px solid #10B981', bg: SURFACE,
    shadow: '0 8px 30px rgba(16,185,129,0.15)', hoverShadow: '0 12px 48px rgba(16,185,129,0.25)',
  },
  {
    name: 'Enterprise', icon: '🏢', iconBg: 'rgba(139,92,246,0.10)',
    monthlyPrice: 'Custom', yearlyPrice: 'Custom', period: '', badge: 'CUSTOM',
    monthlyPriceINR: 'Custom', yearlyPriceINR: 'Custom',
    desc: 'Large orgs with custom AI, compliance & SLAs.',
    features: ['Unlimited chatbots','Unlimited conversations','Custom AI model training','GDPR / HIPAA / SOC 2','SLA + 99.9% uptime','Dedicated account manager'],
    cta: 'Contact sales', popular: false, checkColor: '#8b5cf6',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
  },
];

const voicePlans: Plan[] = [
  {
    name: 'Trial', icon: '🎙️', iconBg: 'rgba(100,116,139,0.12)',
    monthlyPrice: '$59', yearlyPrice: '$59', period: '/month', badge: 'TRIAL',
    monthlyPriceINR: '₹4,999', yearlyPriceINR: '₹4,999',
    desc: 'Test the system. See results in 30 days.',
    features: ['1 AI Voice Assistant','30 calls / month','Lead capture & logging','WhatsApp delivery','30-day upgrade path'],
    cta: 'Start Free Trial', popular: false, checkColor: '#64748b',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
    setupFee: '$0', setupFeeINR: '₹0',
  },
  {
    name: 'Foundation', icon: '🎤', iconBg: 'rgba(37,99,235,0.10)',
    monthlyPrice: '$179', yearlyPrice: '$143', period: '/month', badge: null,
    monthlyPriceINR: '₹14,999', yearlyPriceINR: '₹11,999',
    desc: 'For businesses automating first conversations.',
    features: ['1 AI Voice Assistant','120 calls / month','Lead capture & logging','WhatsApp data delivery','Basic analytics','Free demo call'],
    cta: 'Book Demo Call', popular: false, checkColor: '#2563EB',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
    setupFee: '$179', setupFeeINR: '₹14,999',
  },
  {
    name: 'Scale', icon: '📞', iconBg: 'rgba(16,185,129,0.10)',
    monthlyPrice: '$359', yearlyPrice: '$287', period: '/month', badge: 'MOST POPULAR',
    monthlyPriceINR: '₹29,999', yearlyPriceINR: '₹23,999',
    desc: 'For teams replacing a full calling function.',
    features: ['Up to 3 AI Workflows','400 calls / month','Custom call scripts','CRM integration','Analytics dashboard','Priority support','Free demo call'],
    cta: 'Book Demo Call →', popular: true, checkColor: '#10B981',
    border: '2px solid #10B981', bg: SURFACE,
    shadow: '0 8px 30px rgba(16,185,129,0.15)', hoverShadow: '0 12px 48px rgba(16,185,129,0.25)',
    setupFee: '$479', setupFeeINR: '₹39,999',
  },
  {
    name: 'Dominate', icon: '🏢', iconBg: 'rgba(139,92,246,0.10)',
    monthlyPrice: '$899', yearlyPrice: '$719', period: '/month', badge: 'ENTERPRISE',
    monthlyPriceINR: '₹74,999', yearlyPriceINR: '₹59,999',
    desc: 'For high-volume operations that can\'t slow down.',
    features: ['Unlimited Workflows','1,200 calls / month','Advanced automation','Full API & CRM integrations','Dedicated account manager','Custom reporting','White-label option'],
    cta: 'Contact Sales', popular: false, checkColor: '#8b5cf6',
    border: `1px solid ${HAIRLINE}`, bg: SURFACE,
    shadow: '0 4px 20px rgba(0,0,0,0.04)', hoverShadow: '0 8px 40px rgba(0,0,0,0.08)',
    setupFee: '$1,079', setupFeeINR: '₹89,999',
  },
];

/* ─── Price helpers (billing UX) ─── */
function parsePrice(value: string): number | null {
  const digits = value.replace(/[^0-9.]/g, '');
  if (!digits) return null;
  const n = parseFloat(digits);
  return Number.isNaN(n) ? null : n;
}

function formatCurrency(amount: number, currency: 'usd' | 'inr'): string {
  return currency === 'usd'
    ? `$${amount.toLocaleString('en-US')}`
    : `₹${amount.toLocaleString('en-IN')}`;
}

/* ─── Why Choose Us ─── */
function WhyChooseUs() {
  const benefits = [
    { icon: '🇮🇳', title: 'Made for India', desc: 'Hindi, Tamil, Telugu, Bengali, Marathi and more — with region-appropriate accents and cultural context.', color: '#2563EB' },
    { icon: '⚡', title: 'Live in 24 Hours', desc: 'Onboarding in under a day. No 3-week enterprise sales cycles. Plug in your number and start receiving calls.', color: '#10B981' },
    { icon: '🔒', title: 'DPDP Act 2023 Ready', desc: 'Full compliance with India\'s data protection law. Your customer data stays in India-region cloud.', color: '#8b5cf6' },
    { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees, no per-seat charges, no surprise bills. What you see is what you pay.', color: '#f97316' },
    { icon: '🤖', title: 'Human-Like AI', desc: 'Not robotic scripts. Natural conversations that qualify, convert, and book — just like your best agent.', color: '#ec4899' },
    { icon: '📊', title: 'Real-Time Insights', desc: 'Live dashboards with call transcripts, sentiment scores, conversion metrics, and custom reports.', color: '#06b6d4' },
  ];

  return (
    <section className="section-box white" style={{ background: SURFACE }}>
      <div className="section-pad max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <SectionLabel text="WHY US" />
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-black mb-3" style={{ color: INK }}>
            Why Businesses Choose <GradientText>Autoniv</GradientText>
          </h2>
          <p className="text-sm sm:text-base font-semibold" style={{ color: SLATE, maxWidth: 520, margin: '0 auto' }}>
            Built for India. Designed for scale. Trusted by 500+ businesses across the country.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1"
              style={{
                background: SURFACE,
                border: `1px solid ${HAIRLINE}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                style={{ background: `${item.color}10`, border: `1px solid ${item.color}20` }}
              >
                {item.icon}
              </div>
              <h3 className="text-sm font-extrabold mb-2" style={{ color: INK }}>{item.title}</h3>
              <p className="text-xs leading-relaxed font-semibold" style={{ color: SLATE }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Value Props Bar ─── */
function ValuePropsBar() {
  const props = [
    { icon: '⚡', title: 'Setup in 24 Hours', sub: 'Get started quickly' },
    { icon: '🛡️', title: 'No Long-Term Contracts', sub: 'Cancel or change anytime' },
    { icon: '🌐', title: '20+ Languages Supported', sub: 'Global communication' },
    { icon: '🎧', title: 'Human Handoff Available', sub: 'Seamless escalation' },
  ];
  return (
    <section className="section-box white" style={{ background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 sm:p-6">
        {props.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              {p.icon}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold leading-tight" style={{ color: INK }}>{p.title}</div>
              <div className="text-[10px] sm:text-xs mt-0.5 font-semibold" style={{ color: MUTE }}>
                {p.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Social Proof ─── */
function SocialProof() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const logos = [
    { name: 'Freshworks', url: 'https://logo.clearbit.com/freshworks.com', icon: '🍀', color: '#00b386' },
    { name: 'Razorpay', url: 'https://logo.clearbit.com/razorpay.com', icon: '💳', color: '#0052cc' },
    { name: 'Zoho', url: 'https://logo.clearbit.com/zoho.com', icon: '⚙️', color: '#e21b1b' },
    { name: 'Swiggy', url: 'https://logo.clearbit.com/swiggy.com', icon: '🛵', color: '#fc8019' },
    { name: 'PhonePe', url: 'https://logo.clearbit.com/phonepe.com', icon: '📱', color: '#5f259f' },
    { name: 'CRED', url: 'https://logo.clearbit.com/cred.club', icon: '🪙', color: '#09090b' },
    { name: 'Zerodha', url: 'https://logo.clearbit.com/zerodha.com', icon: '📈', color: '#387ed1' },
    { name: 'Meesho', url: 'https://logo.clearbit.com/meesho.com', icon: '🛍️', color: '#f43f5e' },
  ];

  return (
    <section className="section-box white" style={{ background: SURFACE }}>
      {/* Company Logos */}
      <div className="py-10 px-6 sm:px-10 border-b" style={{ borderColor: HAIRLINE }}>
        <p className="text-center text-[10px] font-black uppercase tracking-[0.15em] mb-8 font-mono" style={{ color: MUTE, fontFamily: MONO }}>
          Trusted by innovative companies worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
          {logos.map((logo, i) => {
            const hasError = imageErrors[logo.name];
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.01)] group"
                style={{ background: TINT, border: `1px solid ${HAIRLINE}` }}
              >
                {!hasError ? (
                  <img
                    src={logo.url}
                    alt={logo.name}
                    className="h-5 sm:h-6 w-auto object-contain opacity-60 group-hover:opacity-100 transition-all duration-300 filter grayscale group-hover:grayscale-0"
                    onError={() => setImageErrors(prev => ({ ...prev, [logo.name]: true }))}
                  />
                ) : (
                  <span
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs"
                    style={{ background: `${logo.color}12`, color: logo.color }}
                  >
                    {logo.icon}
                  </span>
                )}
                <span className="text-[11px] sm:text-xs font-bold transition-colors duration-300" style={{ color: SLATE }}>
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100" style={{ background: TINT, borderColor: HAIRLINE }}>
        
        {/* Stat 1 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 px-6 text-center sm:text-left">
          <div className="flex -space-x-3">
            {[
              'https://i.pravatar.cc/100?img=11',
              'https://i.pravatar.cc/100?img=12',
              'https://i.pravatar.cc/100?img=13',
              'https://i.pravatar.cc/100?img=14',
              'https://i.pravatar.cc/100?img=15',
            ].map((img, i) => (
              <div
                key={i}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0"
                style={{ background: `hsl(${210 + i * 20},60%,92%)` }}
              >
                <img
                  src={img}
                  alt={`User ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ))}
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white border-2 border-white shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)' }}
            >
              100+
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black" style={{ color: INK }}>Trusted by 100+ Businesses</div>
            <div className="text-xs mt-0.5 font-semibold" style={{ color: SLATE }}>
              Across industries worldwide
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 px-6 text-center sm:text-left">
          <div className="flex gap-1 bg-amber-500/10 px-3.5 py-1.5 rounded-2xl border border-amber-500/10">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="text-lg leading-none" style={{ color: '#F59E0B' }}>
                ★
              </span>
            ))}
          </div>
          <div>
            <div className="text-sm sm:text-base font-black" style={{ color: INK }}>4.9/5 Customer Rating</div>
            <div className="text-xs mt-0.5 font-semibold" style={{ color: SLATE }}>
              Based on real customer reviews
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
function ROIEstimator() {
  const [calls, setCalls] = useState(2500);
  
  const humanCost = calls * 55;
  const autonivCost = calls * 15;
  const savings = humanCost - autonivCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative w-full max-w-[420px] rounded-3xl p-6 sm:p-7 border text-left"
      style={{
        background: SURFACE,
        borderColor: HAIRLINE,
        boxShadow: "0 30px 70px -24px rgba(37,99,235,0.18), 0 2px 8px rgba(15,23,42,0.05)"
      }}
    >
      <h3 className="text-base font-extrabold mb-1" style={{ color: INK }}>Savings & ROI Estimator</h3>
      <p className="text-xs mb-6 font-semibold" style={{ color: SLATE }}>See how much you save with Autoniv AI voice agents.</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Call Volume</span>
            <span className="text-sm font-black font-mono px-3 py-1 rounded-lg bg-blue-500/5 text-blue-600 border border-blue-500/10">
              {calls.toLocaleString()} calls
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="15000"
            step="500"
            value={calls}
            onChange={(e) => setCalls(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 font-mono">
            <span>500</span>
            <span>7,500</span>
            <span>15,000</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl space-y-3.5" style={{ background: TINT, border: `1px solid ${HAIRLINE}` }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold" style={{ color: SLATE }}>Human Agency Cost</span>
            <span className="text-xs font-bold font-mono" style={{ color: INK }}>₹{humanCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold" style={{ color: SLATE }}>Autoniv AI Cost</span>
            <span className="text-xs font-bold font-mono" style={{ color: '#10B981' }}>₹{autonivCost.toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-3 border-t border-slate-200/60 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Estimated Savings</span>
              <div className="text-2xl font-black font-mono leading-none mt-1 text-blue-600">
                ₹{savings.toLocaleString('en-IN')}
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-widest font-mono">
              72% Save
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50/50 border" style={{ borderColor: HAIRLINE }}>
            <div className="text-sm font-black font-mono" style={{ color: INK }}>100%</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: MUTE }}>Calls Answered</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/50 border" style={{ borderColor: HAIRLINE }}>
            <div className="text-sm font-black font-mono" style={{ color: INK }}>0 sec</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: MUTE }}>Hold Time</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const navigate = useNavigate();
  const [pricingYearly, setPricingYearly] = useState(false);
  const [pricingMode, setPricingMode] = useState<'chat' | 'voice'>('chat');
  const [currency, setCurrency] = useState<'usd' | 'inr'>('inr');

  const plans = pricingMode === 'chat' ? chatPlans : voicePlans;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: TINT,
        fontFamily: SANS,
        color: INK,
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-400/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-emerald-400/10 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-violet-400/5 to-transparent blur-[100px]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <USPSlider />
      <PublicNavbar />

      <div className="relative z-10 page-bg" style={{ paddingTop: 130, paddingBottom: 80 }}>
        <div className="box-wrap">

          {/* Hero */}
          <section className="section-box tint">
            <div className="max-w-6xl mx-auto section-pad relative" style={{ zIndex: 1 }}>
              {/* Ambient drifting orbs */}
              <motion.div
                className="absolute -top-10 left-[6%] w-72 h-72 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(37,99,235,0.06), transparent 70%)", filter: "blur(40px)" }}
                animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-10 right-[4%] w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)", filter: "blur(40px)" }}
                animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left: copy */}
                <div className="text-center lg:text-left">
                  <Reveal>
                    <div className="flex justify-center lg:justify-start">
                      <SectionLabel text="SIMPLE, TRANSPARENT & SCALABLE" />
                    </div>
                    <motion.h1
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      style={{ fontSize: "clamp(30px,4.4vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", color: INK, lineHeight: 1.1, margin: "0 0 16px" }}
                    >
                      Pricing That Scales <br />
                      <GradientText>With Your Business</GradientText>
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
                      style={{ fontSize: 15.5, color: SLATE, maxWidth: 520, lineHeight: 1.65, margin: "0 0 28px" }}
                      className="mx-auto lg:mx-0 font-semibold"
                    >
                      Powerful AI voice agents. Flexible plans. No hidden fees. Choose the plan that's right for you. Get started with our 14-day free trial.
                    </motion.p>

                    {/* trust chips */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                      className="flex flex-wrap justify-center lg:justify-start gap-2 mb-7"
                    >
                      {["No setup fees", "Cancel anytime", "DPDP Act Compliant"].map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
                          style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, color: SLATE }}>
                          <span style={{ color: "#10B981" }}>✓</span> {t}
                        </span>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.38 }}
                      className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                    >
                      <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          to="/register"
                          className="px-8 py-3.5 rounded-full text-sm font-bold text-white no-underline text-center inline-block border-none"
                          style={{ background: BRAND, boxShadow: "0 8px 26px -4px rgba(16,185,129,0.34)" }}
                        >
                          Start Free Trial →
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                        <button
                          onClick={() => {
                            const el = document.getElementById('pricing-grid');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-8 py-3.5 rounded-full text-sm font-bold text-center cursor-pointer"
                          style={{ background: SURFACE, border: "1.5px solid rgba(15,23,42,0.10)", color: "#475569" }}
                        >
                          See Pricing Plans
                        </button>
                      </motion.div>
                    </motion.div>
                  </Reveal>
                </div>

                {/* Right: Interactive ROI calculator */}
                <div className="flex justify-center lg:justify-end">
                  <ROIEstimator />
                </div>
              </div>
            </div>
          </section>

          {/* ── Dark Pricing Section ── */}
          <section id="pricing-grid" className="section-box black" style={{ background: '#030812' }}>
            {/* Ambient background glow blur blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 section-pad">
            {/* Toggles Panel */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 mb-12 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md px-6 py-4 rounded-3xl max-w-4xl mx-auto shadow-xl">
              
              {/* Billing Toggle */}
              <div className="flex items-center gap-3">
                <span id="billing-label" className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Billing:</span>
                <div role="group" aria-labelledby="billing-label" className="relative inline-flex items-center bg-slate-950 border border-slate-800/60 rounded-full p-1 shadow-inner">
                  <button
                    onClick={() => setPricingYearly(false)}
                    aria-pressed={!pricingYearly}
                    aria-label="Monthly billing"
                    className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {!pricingYearly && (
                      <motion.div
                        layoutId="yearly-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200" style={{ color: !pricingYearly ? '#ffffff' : '#94a3b8' }}>
                      Monthly
                    </span>
                  </button>
                  <button
                    onClick={() => setPricingYearly(true)}
                    aria-pressed={pricingYearly}
                    aria-label="Yearly billing, save 20%"
                    className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {pricingYearly && (
                      <motion.div
                        layoutId="yearly-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200 flex items-center gap-1.5" style={{ color: pricingYearly ? '#ffffff' : '#94a3b8' }}>
                      Yearly
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${pricingYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        -20%
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Chat / Voice Toggle */}
              <div className="flex items-center gap-3">
                <span id="channel-label" className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Channel:</span>
                <div role="group" aria-labelledby="channel-label" className="relative inline-flex items-center bg-slate-950 border border-slate-800/60 rounded-full p-1 shadow-inner">
                  <button
                    onClick={() => setPricingMode('chat')}
                    aria-pressed={pricingMode === 'chat'}
                    aria-label="Show chat plans"
                    className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {pricingMode === 'chat' && (
                      <motion.div
                        layoutId="mode-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200 flex items-center gap-1.5" style={{ color: pricingMode === 'chat' ? '#ffffff' : '#94a3b8' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Chat
                    </span>
                  </button>
                  <button
                    onClick={() => setPricingMode('voice')}
                    aria-pressed={pricingMode === 'voice'}
                    aria-label="Show voice plans"
                    className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {pricingMode === 'voice' && (
                      <motion.div
                        layoutId="mode-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200 flex items-center gap-1.5" style={{ color: pricingMode === 'voice' ? '#ffffff' : '#94a3b8' }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                      Voice
                    </span>
                  </button>
                </div>
              </div>

              {/* Currency Toggle */}
              <div className="flex items-center gap-3">
                <span id="currency-label" className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Currency:</span>
                <div role="group" aria-labelledby="currency-label" className="relative inline-flex items-center bg-slate-950 border border-slate-800/60 rounded-full p-1 shadow-inner">
                  <button
                    onClick={() => setCurrency('usd')}
                    aria-pressed={currency === 'usd'}
                    aria-label="Show prices in US dollars"
                    className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {currency === 'usd' && (
                      <motion.div
                        layoutId="currency-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-800 to-slate-700 shadow-md border border-slate-600/30"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200" style={{ color: currency === 'usd' ? '#ffffff' : '#94a3b8' }}>
                      $ USD
                    </span>
                  </button>
                  <button
                    onClick={() => setCurrency('inr')}
                    aria-pressed={currency === 'inr'}
                    aria-label="Show prices in Indian rupees"
                    className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    {currency === 'inr' && (
                      <motion.div
                        layoutId="currency-toggle"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-800 to-slate-700 shadow-md border border-slate-600/30"
                        style={{ zIndex: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 transition-colors duration-200" style={{ color: currency === 'inr' ? '#ffffff' : '#94a3b8' }}>
                      ₹ INR
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* Pricing Cards Grid */}
            <div key={pricingMode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
              {plans.map((plan, index) => {
                const isCustom = plan.monthlyPrice === 'Custom';
                const displayPrice = isCustom
                  ? 'Custom'
                  : currency === 'usd'
                    ? (pricingYearly ? plan.yearlyPrice : plan.monthlyPrice)
                    : (pricingYearly ? plan.yearlyPriceINR : plan.monthlyPriceINR);

                // Annual savings = (monthly - yearly) × 12, computed from the active currency.
                const monthlyNum = parsePrice(currency === 'usd' ? plan.monthlyPrice : plan.monthlyPriceINR);
                const yearlyNum = parsePrice(currency === 'usd' ? plan.yearlyPrice : plan.yearlyPriceINR);
                const annualSavings =
                  !isCustom && monthlyNum !== null && yearlyNum !== null && monthlyNum > yearlyNum
                    ? (monthlyNum - yearlyNum) * 12
                    : 0;

                return (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  key={plan.name}
                  className="shine-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden border transition-all duration-500 cursor-default group"
                  style={{
                    borderColor: plan.popular ? `${plan.checkColor}` : 'rgba(255, 255, 255, 0.06)',
                    boxShadow: plan.popular ? `0 20px 50px -12px ${plan.checkColor}30, inset 0 0 20px rgba(255,255,255,0.02)` : '0 10px 30px -15px rgba(0,0,0,0.3)',
                    background: plan.popular 
                      ? 'linear-gradient(180deg, rgba(13,27,42,0.8) 0%, rgba(13,27,42,0.3) 100%)' 
                      : 'linear-gradient(180deg, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.3) 100%)'
                  }}
                  whileHover={{ 
                    scale: 1.03,
                    y: -8,
                    boxShadow: plan.popular 
                      ? `0 30px 60px -15px ${plan.checkColor}45, 0 0 0 1px ${plan.checkColor}25` 
                      : `0 25px 50px -12px rgba(10,15,30,0.4), 0 0 0 1px rgba(255,255,255,0.15)`,
                    borderColor: plan.checkColor
                  }}
                >
                  {plan.popular && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1 rounded-b-xl text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)' }}
                    >
                      ★ MOST POPULAR
                    </div>
                  )}

                  <div className={plan.popular ? 'pt-5' : ''}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"
                        style={{ 
                          background: plan.popular ? `${plan.checkColor}1c` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${plan.checkColor}25`
                        }}
                      >
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                        <p className="text-[11px] leading-tight max-w-[160px] text-slate-400">
                          {plan.desc}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 mb-1">
                      <div className="flex items-baseline gap-1">
                        <motion.span
                          key={`${displayPrice}-${pricingYearly}-${currency}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="font-black leading-none bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
                          style={{
                            fontSize: isCustom ? '2.6rem' : '2.8rem',
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {displayPrice}
                        </motion.span>
                        <span className="text-sm font-semibold text-slate-400">
                          {plan.period}
                        </span>
                      </div>
                      {/* Billing context line — reserves height so cards stay aligned */}
                      <div className="mt-1.5 h-4 flex items-center">
                        {!isCustom && annualSavings > 0 && (
                          pricingYearly ? (
                            <span className="text-[11px] font-semibold text-emerald-400">
                              billed annually · save {formatCurrency(annualSavings, currency)}/yr
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500">
                              or {currency === 'usd' ? plan.yearlyPrice : plan.yearlyPriceINR}/mo billed yearly
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    {plan.setupFee && plan.setupFee !== '$0' && (
                      <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80 inline-block mb-4 mt-3 text-slate-400">
                        One-time setup: {currency === 'usd' ? plan.setupFee : plan.setupFeeINR}
                      </div>
                    )}

                    <div className="mb-5 mt-4 border-t border-slate-800/60" />

                    <ul className="space-y-3 mb-7">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 group-hover-li"
                        >
                          <div className="relative">
                            <svg
                              className="w-4 h-4 flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-125"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <circle cx="8" cy="8" r="7" fill={`${plan.checkColor}15`} stroke={`${plan.checkColor}40`} strokeWidth="0.5" />
                              <path
                                d="M5 8l2 2 4-4"
                                stroke={plan.checkColor}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="group-hover-li:check-icon"
                              />
                            </svg>
                            {/* Enhanced check glow effect */}
                            <div 
                              className="absolute inset-0 rounded-full opacity-0 group-hover-li:feature-glow transition-opacity duration-300"
                              style={{ boxShadow: `0 0 12px ${plan.checkColor}50` }}
                            />
                          </div>
                          <span className="group-hover-li:feat-text transition-colors duration-300">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3.5 rounded-xl font-bold transition-all duration-200 cursor-pointer text-sm flex items-center justify-center gap-2"
                    style={{
                      background: plan.popular ? 'linear-gradient(135deg,#2563EB,#10B981)' : 'rgba(255,255,255,0.03)',
                      color: plan.popular ? '#ffffff' : 'rgba(255,255,255,0.8)',
                      border: plan.popular ? 'none' : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = `${plan.checkColor}40`;
                        e.currentTarget.style.color = '#ffffff';
                      } else {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                      } else {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {plan.cta} →
                  </button>
                </motion.div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Value Props Bar */}
        <Reveal>
          <ValuePropsBar />
        </Reveal>

        {/* Social Proof */}
        <Reveal>
          <SocialProof />
        </Reveal>

        {/* Why Choose Us */}
        <Reveal>
          <WhyChooseUs />
        </Reveal>

        {/* ── Dark Add-Ons Section ── */}
        <section className="section-box black" style={{ background: '#030812' }}>
          {/* Ambient background glow blur blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 section-pad">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.12em] mb-5"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10B981',
                }}
              >
                ✦ ADD-ONS
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Power-ups.{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Stack only what you need.
                </span>
              </h2>
              <p className="text-sm mt-3 text-slate-400">
                Available on all paid Autoniv plans.
              </p>
            </div>

            {/* Voice Add-Ons */}
            <div className="mb-12">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="text-base">📞</span> Voice Add-Ons
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: '📊', freq: 'Monthly', title: 'Monthly Performance Report', desc: 'Branded PDF with call quality scores, script performance, A/B outcomes, and industry benchmarks.', price: '₹3,999–₹6,999', priceUSD: '$48–$84', period: '/ month' },
                  { icon: '🧪', freq: 'Monthly', title: 'Script A/B Testing', desc: 'Run two scripts simultaneously. Analyze conversion rates and receive an optimized version monthly.', price: '₹8,999', priceUSD: '$108', period: '/ month' },
                  { icon: '💬', freq: 'Monthly', title: 'WhatsApp Follow-Up Sequences', desc: 'Automated post-call WhatsApp flows: reminders, no-show follow-ups, requalification messages.', price: '₹4,999', priceUSD: '$60', period: '/ month' },
                  { icon: '🌐', freq: 'Monthly', title: 'Regional Language Agent', desc: 'Hindi, Tamil, Telugu, Bengali — reach Tier 2/3 city leads in their native language.', price: '₹8,000', priceUSD: '$96', period: '/ month per language' },
                  { icon: '🔁', freq: 'One-time', title: 'Reactivation Campaigns', desc: 'We call your dormant lead database quarterly. New pipeline with zero new ad spend.', price: '₹14,999', priceUSD: '$180', period: '/ campaign' },
                  { icon: '🏷️', freq: 'One-time', title: 'White-Label Reseller', desc: 'Agencies and consultants: resell Autoniv under your brand with full support.', price: '₹49,999', priceUSD: '$600', period: ' setup + revenue share' },
                ].map((addon, i) => (
                  <div
                    key={i}
                    className="shine-hover relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.14)',
                      background: 'linear-gradient(180deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.5) 100%)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)';
                      e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(16,185,129,0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-transform duration-300 group-hover:scale-110">{addon.icon}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors duration-200">{addon.title}</h4>
                          <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 inline-block mt-1">{addon.freq}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed font-semibold">{addon.desc}</p>
                    <div className="flex items-baseline gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-lg font-black text-emerald-400">
                        {currency === 'usd' ? addon.priceUSD : addon.price}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{addon.period}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Add-Ons */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="text-base">💬</span> Chat Add-Ons
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { icon: '💬', freq: 'Monthly', title: 'WhatsApp Channel', desc: 'Native WhatsApp Business API with template support.', price: '₹2,499', priceUSD: '$30', period: '/ mo' },
                  { icon: '📊', freq: 'Monthly', title: 'Advanced Analytics', desc: 'Funnel analysis, CSAT scores, and conversation heatmaps.', price: '₹1,499', priceUSD: '$18', period: '/ mo' },
                  { icon: '🎧', freq: 'Monthly', title: 'Priority Support', desc: 'Dedicated Slack channel, 2-hour SLA, and onboarding specialist.', price: '₹4,999', priceUSD: '$60', period: '/ mo' },
                ].map((addon, i) => (
                  <div
                    key={i}
                    className="shine-hover relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.14)',
                      background: 'linear-gradient(180deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.5) 100%)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)';
                      e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(16,185,129,0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-transform duration-300 group-hover:scale-110">{addon.icon}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors duration-200">{addon.title}</h4>
                          <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 inline-block mt-1">{addon.freq}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed font-semibold">{addon.desc}</p>
                    <div className="flex items-baseline gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-lg font-black text-emerald-400">
                        {currency === 'usd' ? addon.priceUSD : addon.price}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{addon.period}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-box tint">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 section-pad">
            <Reveal>
              <div className="text-center mb-10 sm:mb-12">
                <SectionLabel text="FAQ" />
                <h2 className="text-2xl sm:text-3xl font-black" style={{ color: INK }}>
                  Frequently Asked <GradientText>Questions</GradientText>
                </h2>
              </div>
            </Reveal>

            <Reveal>
              <div className="space-y-3">
                {[
                  { q: 'What happens after the 14-day free trial?', a: 'You can choose to upgrade to a paid plan or stay on the Free plan. No credit card required to start the trial, and we\'ll never charge you without your consent.' },
                  { q: 'Can I switch plans at any time?', a: 'Absolutely. Upgrade or downgrade anytime from your dashboard. When upgrading, you\'re billed the prorated difference. When downgrading, the credit applies to your next billing cycle.' },
                  { q: 'What languages does the AI support?', a: 'Our AI Voice Agents support 20+ languages including Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, and English — with region-appropriate accents for each.' },
                  { q: 'Is my data secure and compliant?', a: 'Yes. We\'re SOC 2 Type II certified and fully compliant with India\'s DPDP Act 2023. All data is stored in India-region cloud infrastructure with end-to-end encryption.' },
                  { q: 'Do you offer voice agent features in the Starter plan?', a: 'The Starter plan includes 500 voice agent calls per month with HD voice quality. For more calls and Ultra HD quality, upgrade to the Growth plan.' },
                  { q: 'What integrations are available?', a: 'Free plan: website embed only. Starter: WhatsApp + website. Growth: all channels including Instagram, plus CRM integrations (HubSpot, Salesforce, Zoho). Enterprise: custom integrations via API.' },
                  { q: 'How does the AI compare to a human agent?', a: 'Our AI handles 80% of routine calls with 98%+ accuracy. It qualifies leads, books appointments, answers FAQs, and escalates complex queries to human agents seamlessly.' },
                  { q: 'Is there a setup fee?', a: 'No setup fees on any plan. The AI learns your business from uploaded documents and conversation history, so you can go live within hours, not weeks.' },
                ].map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA - Dark section matching Agents component */}
        <Reveal>
          <section className="section-box black relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a0a0a,#1a1a2e)', border: `1px solid ${HAIRLINE}`, borderRadius: '24px' }}>
            <CTADecorations />
            <div className="section-pad text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Transform Your Business?</h2>
                <p className="text-sm sm:text-base mb-8" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 440, margin: '0 auto' }}>
                  Join 500+ businesses using Autoniv AI Voice Agents to capture more leads and serve customers 24/7.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-full text-sm font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-1 no-underline text-center"
                    style={{
                      background: 'linear-gradient(135deg,#2563EB,#10B981)',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.3)',
                    }}
                  >
                    Start Free Trial →
                  </Link>
                  <Link
                    to="/agents"
                    className="px-8 py-4 rounded-full text-sm font-bold text-white cursor-pointer transition-all hover:bg-white/10 no-underline text-center"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    Explore AI Agents →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Comparison Table */}
        <Reveal>
          <section className="section-box white" style={{ background: SURFACE }}>
            <div className="section-pad overflow-hidden">
              <h3
                className="text-xl sm:text-2xl font-extrabold mb-7 text-center sm:text-left"
                style={{ color: INK }}
              >
                Compare Plan Features
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <th className="py-4 font-bold text-xs sm:text-sm pr-4" style={{ color: MUTE, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '11px' }}>
                        Feature
                      </th>
                      <th className="py-4 font-bold text-sm sm:text-base px-4" style={{ color: MUTE }}>
                        Free
                      </th>
                      <th className="py-4 font-bold text-sm sm:text-base px-4" style={{ color: INK }}>
                        Starter
                      </th>
                      <th className="py-4 font-bold text-sm sm:text-base px-4" style={{ color: '#10B981' }}>
                        Growth
                      </th>
                      <th className="py-4 font-bold text-sm sm:text-base pl-4" style={{ color: INK }}>
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Chatbots', free: '1', starter: '3', growth: '10', enterprise: 'Unlimited' },
                      { feature: 'Conversations / month', free: '100', starter: '1,000', growth: '5,000', enterprise: 'Unlimited' },
                      { feature: 'Channels', free: 'Website', starter: 'WhatsApp + Website', growth: 'All incl. Instagram', enterprise: 'All Channels' },
                      { feature: 'Languages', free: 'English', starter: 'Hindi & Hinglish', growth: '10+ Indian Languages', enterprise: 'All + Custom' },
                      { feature: 'Branding', free: 'Visible', starter: 'Removed', growth: 'Removed', enterprise: 'White Label' },
                      { feature: 'CRM Integration', free: 'No', starter: 'Yes', growth: 'Yes', enterprise: 'Custom' },
                      { feature: 'Analytics', free: 'Basic', starter: 'Standard', growth: 'Full Dashboard', enterprise: 'Advanced + API' },
                      { feature: 'Support', free: 'Community', starter: 'Email', growth: 'Priority', enterprise: 'Dedicated 24/7' },
                      { feature: 'DPDP Act 2023', free: '—', starter: '—', growth: '—', enterprise: '✓ Compliant' },
                      { feature: 'India-region hosting', free: '—', starter: '—', growth: '—', enterprise: '✓' },
                      { feature: 'Voice Agent Calls', free: '—', starter: '500/mo', growth: '2,000/mo', enterprise: 'Unlimited' },
                      { feature: 'AI Voice Quality', free: 'Standard', starter: 'HD Voice', growth: 'Ultra HD', enterprise: 'Custom Clone' },
                      { feature: 'Appointment Booking', free: '—', starter: '✓', growth: '✓ + Calendar Sync', enterprise: '✓ + Multi-Calendar' },
                      { feature: 'Sentiment Analysis', free: '—', starter: '—', growth: '✓', enterprise: '✓ + Custom Models' },
                      { feature: 'Custom Workflows', free: '—', starter: '3 automations', growth: '15 automations', enterprise: 'Unlimited + API' },
                      { feature: 'API Access', free: '—', starter: '—', growth: 'Read-only', enterprise: 'Full CRUD' },
                      { feature: 'Webhooks', free: '—', starter: '—', growth: '✓', enterprise: '✓ + Custom Events' },
                      { feature: 'SSO / SAML', free: '—', starter: '—', growth: '—', enterprise: '✓' },
                      { feature: 'Uptime SLA', free: '99%', starter: '99.5%', growth: '99.9%', enterprise: '99.99%' },
                      { feature: 'Data Retention', free: '7 days', starter: '30 days', growth: '90 days', enterprise: 'Custom + Export' },
                    ].map((row) => (
                      <tr
                        key={row.feature}
                        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = TINT;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td className="py-3.5 font-medium text-xs sm:text-sm pr-4" style={{ color: INK }}>
                          {row.feature}
                        </td>
                        <td className="py-3.5 text-xs sm:text-sm px-4" style={{ color: row.free === 'No' || row.free === '—' ? MUTE : SLATE }}>
                          {row.free}
                        </td>
                        <td className="py-3.5 text-xs sm:text-sm px-4" style={{ color: row.starter === 'No' ? MUTE : SLATE }}>
                          {row.starter}
                        </td>
                        <td className="py-3.5 text-xs sm:text-sm px-4 font-medium" style={{ color: INK }}>
                          {row.growth}
                        </td>
                        <td className="py-3.5 text-xs sm:text-sm pl-4" style={{ color: SLATE }}>
                          {row.enterprise}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </Reveal>

      </div>
    </div>

    <Footer />
  </div>
);
}

export default Pricing;