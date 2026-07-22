import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { USPSlider } from './sections/USPSlider';
import { PublicNavbar } from '../../components/PublicNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, Reveal, SectionLabel, GradientText } from './design';

interface ChatPlan {
  name: string;
  desc: string;
  usdMonthly: string;
  usdYearly: string;
  inrMonthly: string;
  inrYearly: string;
  period: string;
  sublabel: string;
  features: string[];
  cta: string;
  popular: boolean;
  checkColor: string;
}

const plans: ChatPlan[] = [
  {
    name: 'Free',
    desc: 'Test AI automation on your website at zero cost.',
    usdMonthly: '$0',
    usdYearly: '$0',
    inrMonthly: '₹0',
    inrYearly: '₹0',
    period: 'forever',
    sublabel: 'forever',
    features: [
      'Website chatbot',
      '100 conversations / month',
      '1 chatbot',
      'Basic lead capture'
    ],
    cta: 'Start free',
    popular: false,
    checkColor: '#2563EB'
  },
  {
    name: 'Starter',
    desc: 'Automate your two highest-traffic channels: Website and WhatsApp.',
    usdMonthly: '$29',
    usdYearly: '$23',
    inrMonthly: '₹1,499',
    inrYearly: '₹1,199',
    period: '/mo',
    sublabel: 'billed monthly',
    features: [
      'Website + WhatsApp',
      '1,500 conversations / month',
      '2 chatbots',
      'Branding removed',
      'Email support'
    ],
    cta: 'Get started',
    popular: false,
    checkColor: '#2563EB'
  },
  {
    name: 'Growth',
    desc: 'Every channel your customers message you on, plus CRM sync and a team inbox.',
    usdMonthly: '$99',
    usdYearly: '$79',
    inrMonthly: '₹4,999',
    inrYearly: '₹3,999',
    period: '/mo',
    sublabel: 'billed monthly',
    features: [
      'All 5 channels (Web, WhatsApp, Instagram, Messenger, Telegram)',
      '6,000 conversations / month',
      'Unlimited chatbots',
      'CRM integration',
      'Lead qualification + booking',
      '5 team seats',
      'Priority support'
    ],
    cta: 'Start free trial',
    popular: true,
    checkColor: '#10B981'
  },
  {
    name: 'Enterprise',
    desc: 'Compliance, SLAs, and a dedicated team for large or regulated organizations.',
    usdMonthly: 'Custom',
    usdYearly: 'Custom',
    inrMonthly: 'Custom',
    inrYearly: 'Custom',
    period: '',
    sublabel: 'from ₹60,000/mo · $999/mo',
    features: [
      'Unlimited conversations',
      'White-labeling included',
      'SOC 2 / HIPAA-ready',
      '99.9% uptime SLA',
      'Dedicated account manager'
    ],
    cta: 'Talk to sales',
    popular: false,
    checkColor: '#8b5cf6'
  }
];

export function AiChatbotPricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'usd' | 'inr'>('inr');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCtaClick = (planName: string) => {
    if (planName.toLowerCase().includes('sales') || planName.toLowerCase().includes('talk')) {
      navigate('/register');
    } else {
      navigate(`/register?plan=chat_${planName.toLowerCase()}`);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#f8fafc',
        fontFamily: SANS,
        color: INK
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-400/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-emerald-400/5 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <USPSlider />
      <PublicNavbar />

      {/* Hero Section */}
      <header className="relative z-10 pt-32 pb-16 bg-slate-950 text-white overflow-hidden">
        {/* SVG Ribbon Decoration */}
        <div className="absolute right-[-40px] top-[60px] w-[560px] opacity-20 pointer-events-none hidden lg:block">
          <svg width="560" height="420" viewBox="0 0 560 420" fill="none" xmlns="http://www.w3.org/2000/svg font-sans">
            <path d="M-20 120 C 100 40, 180 200, 300 140 S 480 40, 580 100" stroke="#10B981" strokeWidth="1.5" opacity="0.55"/>
            <path d="M-20 220 C 110 300, 190 140, 300 220 S 470 320, 580 240" stroke="#F0A631" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="40" cy="150" r="5" fill="#10B981"/>
            <circle cx="190" cy="90" r="5" fill="#F0A631"/>
            <circle cx="330" cy="185" r="5" fill="#10B981"/>
            <circle cx="460" cy="70" r="5" fill="#F0A631"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6 uppercase tracking-wider font-mono">
                AI Chatbot Pricing
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
                One AI platform for <br />
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">every conversation</span> your business has.
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
                Website, WhatsApp, Instagram, and Facebook automation in one place — with pricing that scales with your business, not your headcount. Built for solopreneurs, growing teams, and enterprises across India and worldwide.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => scrollToSection('plans')}
                  className="px-6 py-3.5 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
                >
                  Start free — no card required
                </button>
                <button
                  onClick={() => scrollToSection('compare')}
                  className="px-6 py-3.5 rounded-full text-sm font-bold text-slate-300 border border-slate-700 bg-transparent hover:bg-slate-900 hover:text-white active:scale-[0.98] transition-all cursor-pointer"
                >
                  Compare all plans
                </button>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Free forever plan available · Cancel anytime · Setup in under 10 minutes
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-slate-900 border-y border-slate-800 text-slate-400 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-y-4 justify-between items-center text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Trusted by 500+ businesses across India and 20+ countries
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            99.9% platform uptime
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Data encrypted in transit and at rest
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            GDPR-ready · SOC 2 in progress
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <section id="plans" className="py-20 relative z-10 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="Plans and pricing" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2">
              Pricing that grows with your business
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              Every plan includes AI-powered conversations, lead capture, and a no-code setup. Upgrade any time as your channels and team grow.
            </p>

            {/* Toggle Switch Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-10">
              {/* Billing Toggle */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                    billing === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none ${
                    billing === 'yearly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Yearly
                  <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">
                    -20%
                  </span>
                </button>
              </div>

              {/* Currency Toggle */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                <button
                  onClick={() => setCurrency('usd')}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                    currency === 'usd' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('inr')}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                    currency === 'inr' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  INR (₹)
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isEnterprise = plan.name === 'Enterprise';
              const displayPrice = isEnterprise
                ? 'Custom'
                : currency === 'usd'
                  ? (billing === 'monthly' ? plan.usdMonthly : plan.usdYearly)
                  : (billing === 'monthly' ? plan.inrMonthly : plan.inrYearly);

              return (
                <motion.div
                  key={plan.name}
                  className={`bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative border transition-all duration-300 group shadow-sm ${
                    plan.popular
                      ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                  whileHover={{ y: -8, scale: 1.01 }}
                >
                  {plan.popular && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#2563EB,#10B981)' }}
                    >
                      ★ Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6 min-h-[36px]">
                      {plan.desc}
                    </p>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {displayPrice}
                      </span>
                      {!isEnterprise && plan.name !== 'Free' && (
                        <span className="text-sm font-semibold text-slate-400">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-500 tracking-wide mb-6">
                      {isEnterprise
                        ? plan.sublabel
                        : (plan.name === 'Free' ? 'forever' : (billing === 'monthly' ? 'billed monthly' : 'billed annually'))}
                    </div>

                    <div className="border-t border-slate-100 my-6" />

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                          <span className="text-blue-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleCtaClick(plan.name)}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white border-none shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02]'
                        : 'bg-transparent text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-400 mt-12">
            Prices shown in USD and INR. Autoniv also offers{' '}
            <Link to="/pricing?mode=voice" className="text-blue-600 font-bold hover:underline">
              AI Voice Agents
            </Link>{' '}
            as a separate product — bundle and save 15% on Growth and Enterprise.
          </p>
        </div>
      </section>

      {/* Outcome Section */}
      <section className="py-20 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="Why businesses upgrade" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Pick a plan by the outcome you need, not the features you'll count
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-sm">
              <span className="inline-block px-3 py-1 rounded bg-blue-500/10 text-blue-650 text-xs font-bold font-mono tracking-wider uppercase mb-4">
                Starter
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-3">
                Stop losing leads outside business hours
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A Website + WhatsApp bot answers questions and qualifies / captures contact details 24/7, so a solo business owner never misses an enquiry sent at 11pm.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-sm">
              <span className="inline-block px-3 py-1 rounded bg-emerald-550/10 text-emerald-600 text-xs font-bold font-mono tracking-wider uppercase mb-4">
                Growth
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-3">
                Turn scattered conversations into a pipeline
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When every channel — WhatsApp, Instagram, Facebook, Website — feeds one CRM automatically, sales teams stop chasing screenshots and start closing faster.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 shadow-sm">
              <span className="inline-block px-3 py-1 rounded bg-purple-500/10 text-purple-600 text-xs font-bold font-mono tracking-wider uppercase mb-4">
                Enterprise
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-3">
                Automate at scale without the compliance risk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Healthcare, finance, and large retail teams get HIPAA/GDPR-ready infrastructure, guaranteed uptime, and a named account manager instead of a support queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="compare" className="py-20 bg-slate-50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="Feature comparison" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Compare Autoniv plans side by side
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              A detailed look at what's included in each AI chatbot plan.
            </p>
          </div>

          <div className="overflow-hidden border border-slate-200/80 rounded-3xl bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Feature</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Free</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Starter</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-blue-600 tracking-wider uppercase bg-blue-50/30">Growth</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Channels</td>
                  <td className="p-4 sm:p-5 text-slate-700">Website</td>
                  <td className="p-4 sm:p-5 text-slate-700">Website + WhatsApp</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">All 5 channels</td>
                  <td className="p-4 sm:p-5 text-slate-700">All + custom</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Conversations / month</td>
                  <td className="p-4 sm:p-5 text-slate-700">100</td>
                  <td className="p-4 sm:p-5 text-slate-700">1,500</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">6,000</td>
                  <td className="p-4 sm:p-5 text-slate-700">Unlimited*</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Chatbots</td>
                  <td className="p-4 sm:p-5 text-slate-700">1</td>
                  <td className="p-4 sm:p-5 text-slate-700">2</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Unlimited</td>
                  <td className="p-4 sm:p-5 text-slate-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Knowledge base</td>
                  <td className="p-4 sm:p-5 text-slate-700">5 pages</td>
                  <td className="p-4 sm:p-5 text-slate-700">50 pages</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Unlimited</td>
                  <td className="p-4 sm:p-5 text-slate-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Team members</td>
                  <td className="p-4 sm:p-5 text-slate-700">1</td>
                  <td className="p-4 sm:p-5 text-slate-700">1</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">5</td>
                  <td className="p-4 sm:p-5 text-slate-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">CRM integration</td>
                  <td className="p-4 sm:p-5 text-slate-400">—</td>
                  <td className="p-4 sm:p-5 text-slate-400">—</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold bg-blue-50/20">Included</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">Included + custom</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Lead qualification & booking</td>
                  <td className="p-4 sm:p-5 text-slate-700">Basic</td>
                  <td className="p-4 sm:p-5 text-slate-700">Basic</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Advanced</td>
                  <td className="p-4 sm:p-5 text-slate-700">Custom logic</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Analytics</td>
                  <td className="p-4 sm:p-5 text-slate-400">—</td>
                  <td className="p-4 sm:p-5 text-slate-700">Basic</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Full dashboard</td>
                  <td className="p-4 sm:p-5 text-slate-700">Custom / BI export</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Branding</td>
                  <td className="p-4 sm:p-5 text-slate-700">Autoniv branded</td>
                  <td className="p-4 sm:p-5 text-slate-700">Removable (add-on)</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Removed</td>
                  <td className="p-4 sm:p-5 text-slate-700">White-labeled</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Support</td>
                  <td className="p-4 sm:p-5 text-slate-700">Community</td>
                  <td className="p-4 sm:p-5 text-slate-700">Email</td>
                  <td className="p-4 sm:p-5 font-medium text-slate-900 bg-blue-50/20">Priority chat</td>
                  <td className="p-4 sm:p-5 text-slate-700">Dedicated manager</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Uptime SLA</td>
                  <td className="p-4 sm:p-5 text-slate-400">—</td>
                  <td className="p-4 sm:p-5 text-slate-400">—</td>
                  <td className="p-4 sm:p-5 text-slate-400 bg-blue-50/20">—</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold">99.9%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-normal">
            *Enterprise conversation volume is unlimited under fair-use policy.
          </p>
        </div>
      </section>

      {/* Add-ons Section */}
      <section id="addons" className="py-20 bg-white relative z-10 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="Add-ons" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Extend any plan as you grow
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              Add exactly what you need, when you need it — no forced upgrades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: '+1,000 conversations', desc: 'Extra volume for seasonal spikes.', price: '$12/mo · ₹599/mo' },
              { name: 'Extra team seat', desc: 'Add more people to your shared inbox.', price: '$9/mo · ₹399/mo' },
              { name: 'Add Instagram or Messenger (Starter)', desc: 'One more channel without a full upgrade.', price: '$12/mo · ₹699/mo' },
              { name: 'API access (Growth)', desc: 'Build custom workflows on top of Autoniv.', price: '$49/mo · ₹2,499/mo' },
              { name: 'White-label widget', desc: 'Resell Autoniv under your own brand.', price: '$99/mo · ₹4,999/mo' },
              { name: 'Done-for-you setup', desc: 'We configure your flows for you.', price: 'from $199 · ₹9,999' }
            ].map((addon) => (
              <div key={addon.name} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all hover:shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{addon.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{addon.desc}</p>
                <div className="font-mono text-xs sm:text-sm font-bold text-blue-650 bg-blue-50/50 inline-block px-3 py-1 rounded-lg">
                  {addon.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="What customers say" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Businesses running on Autoniv
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                quote: 'Our WhatsApp enquiries used to sit unanswered overnight. Now the bot qualifies every lead before our team even wakes up.',
                who: 'Real estate agency',
                where: 'Growth plan · Delhi NCR',
                initials: 'RK'
              },
              {
                quote: "Switching from a website-only chatbot to Autoniv's omnichannel setup cut our response time from hours to under a minute across every channel.",
                who: 'D2C skincare brand',
                where: 'Growth plan · Mumbai',
                initials: 'SP'
              },
              {
                quote: 'The CRM sync alone paid for the upgrade. We stopped losing leads between WhatsApp and our sales spreadsheet.',
                who: 'Healthcare clinic group',
                where: 'Enterprise plan · UK',
                initials: 'JM'
              }
            ].map((testi) => (
              <div key={testi.who} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-amber-500 text-sm mb-4">★★★★★</div>
                  <p className="text-sm sm:text-base text-slate-700 italic leading-relaxed mb-6">
                    "{testi.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-auto">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold font-mono text-sm">
                    {testi.initials}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{testi.who}</div>
                    <div className="text-[11px] text-slate-400">{testi.where}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionLabel text="How Autoniv compares" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Autoniv vs. other AI chatbot tools
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              One platform for every channel — instead of stitching several tools together.
            </p>
          </div>

          <div className="overflow-hidden border border-slate-200/80 rounded-3xl bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Capability</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-blue-600 tracking-wider uppercase bg-blue-50/30">Autoniv</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Text-only chatbot tools</th>
                  <th className="p-4 sm:p-5 font-mono text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase">Enterprise-only platforms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Website + WhatsApp + Instagram + Messenger</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold bg-blue-50/20">Included from Starter</td>
                  <td className="p-4 sm:p-5 text-slate-500">Website only, typically</td>
                  <td className="p-4 sm:p-5 text-slate-500">Custom build required</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">CRM-native lead qualification</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold bg-blue-50/20">Included on Growth</td>
                  <td className="p-4 sm:p-5 text-slate-400">Rarely included</td>
                  <td className="p-4 sm:p-5 text-slate-700">Included, high cost</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Appointment booking built in</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold bg-blue-50/20">Included on Growth</td>
                  <td className="p-4 sm:p-5 text-slate-400">Add-on or unavailable</td>
                  <td className="p-4 sm:p-5 text-slate-700">Included</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">India-first pricing</td>
                  <td className="p-4 sm:p-5 text-emerald-600 font-bold bg-blue-50/20">Yes, INR pricing</td>
                  <td className="p-4 sm:p-5 text-slate-450">Usually USD-only</td>
                  <td className="p-4 sm:p-5 text-slate-450">Usually USD-only</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-500">Entry price</td>
                  <td className="p-4 sm:p-5 font-semibold text-slate-900 bg-blue-50/20">Free, then $29/mo</td>
                  <td className="p-4 sm:p-5 text-slate-700">$29–40/mo</td>
                  <td className="p-4 sm:p-5 text-slate-700">$500+/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-20 bg-slate-50 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionLabel text="Frequently asked questions" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Common questions about Autoniv's AI chatbot pricing
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How much does an AI chatbot cost in India?',
                a: "Autoniv's plans in India start at ₹0 on the Free plan. The Starter plan is ₹1,499/month for Website and WhatsApp automation, and the Growth plan is ₹4,999/month for all messaging channels plus CRM integration. Enterprise pricing is custom, typically starting from ₹60,000/month."
              },
              {
                q: 'What is the best plan for a small business?',
                a: 'Most small businesses start with Starter for Website and WhatsApp automation. Businesses marketing across Instagram and Facebook too, or needing CRM and booking, usually choose Growth — Autoniv\'s most popular plan.'
              },
              {
                q: 'Does Autoniv offer a free AI chatbot plan?',
                a: 'Yes. The Free plan includes a website chatbot with 100 conversations per month at no cost, so you can test AI automation before upgrading.'
              },
              {
                q: 'What\'s included in the Growth plan?',
                a: 'All five messaging channels (Website, WhatsApp, Instagram, Facebook Messenger, Telegram), 6,000 conversations/month, CRM integration, lead qualification and booking workflows, a full analytics dashboard, five team seats, and priority support.'
              },
              {
                q: 'Can I change or cancel my plan anytime?',
                a: 'Yes — upgrade, downgrade, or cancel anytime with no lock-in on monthly billing. Annual plans are prepaid but can be adjusted at renewal.'
              },
              {
                q: 'Does Autoniv support WhatsApp Business API?',
                a: 'Yes. Starter and above include WhatsApp automation, with official WhatsApp Business API setup available as an add-on.'
              },
              {
                q: 'How is Autoniv different from Chatbase, Tidio, or Intercom?',
                a: 'Autoniv covers Website, WhatsApp, Instagram, and Facebook Messenger in every paid plan, with native CRM, lead qualification, and booking — rather than requiring separate text-only tools stitched together.'
              },
              {
                q: 'Is there a setup fee?',
                a: 'No mandatory setup fees on any plan. Optional done-for-you onboarding and WhatsApp API verification are available as paid add-ons.'
              }
            ].map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left font-bold text-slate-900 text-sm sm:text-base cursor-pointer bg-transparent border-none focus:outline-none"
                  >
                    <span>{item.q}</span>
                    <span className="text-blue-650 font-mono text-xl leading-none">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-20 bg-slate-950 text-white text-center relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_60%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <SectionLabel text="Get started" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight my-4">
            Your customers are already messaging you. <br />
            Give them an AI that answers.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base mb-8">
            Start free on Website automation today, and add WhatsApp, Instagram, and Facebook whenever you're ready.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-500 shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              Start free — no card required
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-full text-sm font-bold text-slate-300 border border-slate-700 bg-transparent hover:bg-slate-900 hover:text-white active:scale-[0.98] transition-all cursor-pointer"
            >
              Talk to sales
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
