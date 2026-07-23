import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { USPSlider } from './sections/USPSlider';
import { PublicNavbar } from '../../components/PublicNavbar';
import { motion, AnimatePresence } from 'framer-motion';

import { INK, SANS, Reveal, SectionLabel, GradientText } from './design';

interface VoicePlan {
  key: string;
  name: string;
  icon: string;
  tag: string;
  price: { usd: number | null; inr: number | null };
  yearlyNote: string;
  extraMinUsd: string;
  extraMinInr: string;
  setupUsd: string;
  setupInr: string;
  why: string | null;
  features: string[];
  cta: string;
  popular: boolean;
}

const PLANS: VoicePlan[] = [
  {
    key: 'launch',
    name: 'Launch',
    icon: '🚀',
    tag: 'Start automating your calls.',
    price: { usd: 149, inr: 4999 },
    yearlyNote: 'or ₹3,999/mo billed yearly ($119/mo)',
    extraMinUsd: '$0.18/min',
    extraMinInr: '₹12/min',
    setupUsd: 'One-time setup: $499',
    setupInr: 'One-time setup: ₹14,999',
    why: null,
    features: [
      '1 AI Voice Agent',
      '500 Minutes / month',
      '1 Phone Number',
      '1 AI Workflow',
      'Lead Capture',
      'Appointment Booking',
      'Call Recording',
      'Basic Analytics',
      'Email Support',
    ],
    cta: 'Start Now →',
    popular: false,
  },
  {
    key: 'growth',
    name: 'Growth',
    icon: '📈',
    tag: 'Grow faster with AI-powered conversations.',
    price: { usd: 349, inr: 14999 },
    yearlyNote: 'or ₹11,999/mo billed yearly ($279/mo)',
    extraMinUsd: '$0.16/min',
    extraMinInr: '₹11/min',
    setupUsd: 'One-time setup: $999',
    setupInr: 'One-time setup: ₹29,999',
    why: 'Most popular: 3x the minutes of Launch for growing teams',
    features: [
      '1 AI Voice Agent',
      '1,500 Minutes / month',
      '2 Phone Numbers',
      'Up to 5 AI Workflows',
      'Lead Capture',
      'Appointment Booking',
      'Call Recording',
      'AI Call Summary',
      'Multi-Language Support',
      'Knowledge Base Training',
      'Advanced Analytics',
      'CRM Integration',
      'Priority Support',
    ],
    cta: 'Book a Demo →',
    popular: true,
  },
  {
    key: 'scale',
    name: 'Scale',
    icon: '⚡',
    tag: 'Built for high-volume businesses.',
    price: { usd: 799, inr: 34999 },
    yearlyNote: 'or ₹27,999/mo billed yearly ($639/mo)',
    extraMinUsd: '$0.14/min',
    extraMinInr: '₹10/min',
    setupUsd: 'One-time setup: $1,999',
    setupInr: 'One-time setup: ₹49,999',
    why: 'For teams past 2,000+ min/month needing full control',
    features: [
      '1 AI Voice Agent',
      '4,000 Minutes / month',
      'Multiple Phone Numbers',
      'Unlimited AI Workflows',
      'Lead Capture',
      'Appointment Booking',
      'Call Recording',
      'AI Call Summary',
      'Multi-Language Support',
      'Knowledge Base Training',
      'Advanced + CRM Analytics',
      'CRM Integration',
      'Webhook/API Integration',
      'WhatsApp Follow-ups',
      'Team Dashboard',
      'Dedicated Success Manager',
      'SLA Guarantee',
      'Priority Support',
    ],
    cta: 'Get Started →',
    popular: false,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    icon: '🏢',
    tag: 'Tailored AI automation for large organizations.',
    price: { usd: null, inr: null },
    yearlyNote: '',
    extraMinUsd: 'Volume Pricing',
    extraMinInr: 'Volume Pricing',
    setupUsd: 'Custom setup',
    setupInr: 'Custom setup',
    why: null,
    features: [
      'Unlimited AI Voice Agents',
      'Custom Minutes',
      'Unlimited Phone Numbers',
      'Unlimited AI Workflows',
      'All Features in Scale',
      'White Label Included',
      'Custom Integrations & API',
      'Dedicated Success Manager',
      'SLA Guarantee',
      'Advanced Security (SOC 2 / HIPAA ready)',
      '24×7 Premium Support',
    ],
    cta: 'Contact Sales →',
    popular: false,
  },
];

const ADDONS = [
  { icon: '⏱️', title: 'Extra 500 Minutes', inr: '₹5,000', usd: '$69', desc: 'Top up minutes mid-cycle without waiting for renewal.' },
  { icon: '📞', title: 'Additional Phone Number', inr: '₹999 / month', usd: '$14 / month', desc: 'Run a second line for a new team, region, or campaign.' },
  { icon: '💬', title: 'WhatsApp Follow-up Automation', inr: '₹2,999 / month', usd: '$39 / month', desc: 'Auto-send confirmations, reminders, and follow-ups after every call.' },
  { icon: '🔗', title: 'CRM Integration', inr: '₹2,999 / month', usd: '$39 / month', desc: 'Two-way sync with Salesforce, HubSpot, Zoho, or a custom CRM.' },
  { icon: '🎙️', title: 'Custom AI Voice', inr: '₹4,999', usd: '$69', desc: 'Clone a real voice — founder or brand ambassador — for every AI call.' },
  { icon: '🧠', title: 'AI Prompt Optimization', inr: '₹4,999', usd: '$69', desc: 'Expert-tuned scripts and prompts for higher conversion per call.' },
  { icon: '🧩', title: 'Custom Call Flow Design', inr: '₹9,999', usd: '$139', desc: 'A bespoke call flow mapped to your exact sales or support process.' },
  { icon: '⚡', title: 'Priority SLA', inr: '₹9,999 / month', usd: '$139 / month', desc: 'Guaranteed response times and uptime commitments in writing.' },
  { icon: '🏷️', title: 'White Label', inr: '₹19,999 / month', usd: '$269 / month', desc: 'Remove Autoniv branding and present the platform as your own.' },
  { icon: '🧑‍💼', title: 'Dedicated AI Consultant', inr: 'Custom', usd: 'Custom', desc: 'A named expert managing optimization and strategy for your account.' },
  { icon: '➕', title: 'Additional AI Workflow Setup', inr: '₹2,999 / each', usd: '$39 / each', desc: 'Add a new workflow for another department, product line, or use case.' },
  { icon: '🔌', title: 'Custom API Integration', inr: 'Custom', usd: 'Custom', desc: 'Connect Autoniv to any internal tool or proprietary system.' },
];

const INDUSTRIES = [
  { icon: '🏥', title: 'Dental & healthcare clinics', desc: 'Appointment booking, rescheduling, and insurance FAQs handled without hold music.' },
  { icon: '🏨', title: 'Hospitality', desc: 'Room bookings, reservation confirmations, and guest queries around the clock.' },
  { icon: '🌾', title: 'Agriculture & distribution', desc: 'Order intake, dealer queries, and dispatch updates without a call center.' },
  { icon: '💰', title: 'Financial services', desc: 'Lead qualification, KYC follow-ups, and appointment scheduling for advisors.' },
  { icon: '💡', title: 'Solar & home services', desc: 'Site-visit scheduling and quote follow-ups for high-intent inbound calls.' },
  { icon: '🏠', title: 'Real estate', desc: 'Qualifies buyers, books site visits, and routes hot leads to agents instantly.' },
  { icon: '🛒', title: 'E-commerce & D2C', desc: 'Order status, returns, and cart-recovery calls at any hour, any volume.' },
  { icon: '⚖️', title: 'Legal & professional services', desc: 'Intake screening and consultation scheduling with full call logs.' },
];

const TESTIMONIALS = [
  {
    quote: '"We stopped losing after-hours leads within the first week. The Growth plan paid for itself in under a month."',
    name: 'Riya Sharma',
    role: 'Operations Head, Dental Zone',
    initials: 'RS',
  },
  {
    quote: '"Our missed-call rate dropped from 30% to under 4%. Setup took two days, not two months."',
    name: 'Arjun Kapoor',
    role: 'Founder, FinVest',
    initials: 'AK',
  },
  {
    quote: '"It genuinely sounds human. Patients don\'t realise they\'re not talking to our front desk."',
    name: 'Meera Nair',
    role: 'Practice Manager, City Hospital',
    initials: 'MN',
  },
];

const TRUST_CARDS = [
  { icon: '🔒', title: 'SOC 2 Type II', desc: 'Independently audited controls' },
  { icon: '🇮🇳', title: 'DPDP Act aligned', desc: 'India data protection compliant' },
  { icon: '🌍', title: 'GDPR ready', desc: 'For international customer calls' },
  { icon: '🛡️', title: '256-bit encryption', desc: 'Data encrypted in transit & at rest' },
  { icon: '📞', title: 'Consent-based recording', desc: 'Call recording disclosure built-in' },
  { icon: '⏱️', title: '99.9% uptime SLA', desc: 'On Scale and Enterprise plans' },
  { icon: '💳', title: 'PCI-aware handling', desc: 'No raw card data stored in calls' },
  { icon: '↩️', title: '30-day guarantee', desc: 'Full refund if it\'s not a fit' },
];

const WHY_CARDS = [
  { n: '01', title: 'No-code setup, not a dev toolkit', desc: 'Competitors like Vapi and Retell AI are infrastructure — you need engineers to wire prompts, telephony, and CRMs together. Autoniv ships a finished product: tell us your call scripts, we build the agent.' },
  { n: '02', title: 'India & Global currency options', desc: 'Transparent INR & USD pricing, WhatsApp follow-ups by default, and multi-language voice support for seamless global and local deployments.' },
  { n: '03', title: 'Outcome-based plans, not API credits', desc: 'Plans are priced around minutes and workflows your business actually uses, not opaque per-minute API billing that\'s hard to forecast.' },
  { n: '04', title: 'Human oversight included', desc: 'Every plan above Launch includes dedicated support — not just an automated ticket queue.' },
  { n: '05', title: 'Fast time-to-value', desc: 'Live in 48 hours versus the days-to-weeks integration timeline typical of raw voice-AI infrastructure platforms.' },
  { n: '06', title: 'Built-in compliance', desc: 'SOC 2, DPDP, and consent-based recording ship by default — not a bolt-on you have to engineer yourself.' },
];

const FAQS = [
  {
    q: 'How much does an AI voice assistant cost per month?',
    a: 'Autoniv\'s AI voice assistant pricing starts at ₹4,999/month ($149/month) on the Launch plan with 500 minutes included, and scales to a custom Enterprise plan for unlimited voice agents and minutes. The Growth plan at ₹14,999/month ($349/month) is the most popular, with 1,500 minutes and up to 5 AI workflows.',
  },
  {
    q: 'Is there a setup fee for Autoniv\'s AI receptionist plans?',
    a: 'Yes, a one-time setup fee applies on Launch, Growth, and Scale plans, ranging from ₹14,999 to ₹49,999 ($499 to $1,999) depending on plan complexity. The fee covers building, training, and testing your AI voice agent before it goes live. Enterprise setup is custom-scoped.',
  },
  {
    q: 'Can I add extra minutes or phone numbers to my plan?',
    a: 'Yes. Extra minutes, phone numbers, WhatsApp follow-up automation, CRM integrations, custom AI voices, and dedicated consultants can all be added to any plan without upgrading tiers.',
  },
  {
    q: 'What is included in AI call automation pricing?',
    a: 'Every Autoniv plan includes an AI voice agent, included minutes, a phone number, lead capture, appointment booking, and call recording. Higher tiers add CRM integration, WhatsApp follow-ups, advanced analytics, API access, and priority support.',
  },
  {
    q: 'Does Autoniv offer yearly billing discounts?',
    a: 'Yes. Switching to yearly billing on any Autoniv plan saves 20% compared to monthly pricing.',
  },
  {
    q: 'Is Autoniv\'s AI voice assistant cheaper than a human receptionist?',
    a: 'Yes. A full-time human receptionist in India typically costs ₹25,000–₹40,000/month in salary alone and can only handle one call at a time during business hours. Autoniv\'s plans start at ₹4,999/month, run 24/7, and handle unlimited simultaneous calls.',
  },
  {
    q: 'How does Autoniv compare to Bland AI, Retell AI, Synthflow, Vapi, ElevenLabs, or PolyAI?',
    a: 'Those are developer-first voice AI platforms priced per API minute, requiring your team to build and maintain the agent. Autoniv is a managed AI voice assistant product with flat monthly plans, done-for-you setup, and dedicated support — built for business teams, not engineering teams.',
  },
];

export function VoiceAssistancePricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'inr' | 'usd'>('inr');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ROI Calculator states
  const [calls, setCalls] = useState(600);
  const [salary, setSalary] = useState(35000);
  const [missed, setMissed] = useState(25);
  const [leadValue, setLeadValue] = useState(2000);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleCtaClick = (planKey: string) => {
    if (planKey === 'enterprise') {
      navigate('/register');
    } else {
      navigate(`/register?plan=voice_${planKey}`);
    }
  };

  const fmtPrice = (amount: number | null, curr: 'usd' | 'inr') => {
    if (amount === null) return 'Custom';
    if (curr === 'usd') return '$' + amount.toLocaleString('en-US');
    return '₹' + amount.toLocaleString('en-IN');
  };

  // Compute ROI
  let roiPlan = 'Growth';
  let roiCost: number | null = 14999;

  if (calls <= 200) {
    roiPlan = 'Launch';
    roiCost = currency === 'usd' ? 149 : 4999;
  } else if (calls <= 600) {
    roiPlan = 'Growth';
    roiCost = currency === 'usd' ? 349 : 14999;
  } else if (calls <= 1500) {
    roiPlan = 'Scale';
    roiCost = currency === 'usd' ? 799 : 34999;
  } else {
    roiPlan = 'Enterprise';
    roiCost = null;
  }

  const extraLeads = Math.round(calls * (missed / 100));
  const recoveredRevenue = extraLeads * leadValue * 0.3;
  const staffSavings = roiCost !== null ? Math.max(salary - roiCost, 0) : salary;
  const totalSavings = Math.round(staffSavings + recoveredRevenue);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#f8fafc',
        fontFamily: SANS,
        color: INK,
      }}
    >
      {/* Schema.org FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-400/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-emerald-400/5 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <USPSlider />
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10">
        <Reveal>
          <SectionLabel text="AI Voice Assistant Pricing" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15] mb-6">
            AI receptionist pricing that pays for itself{' '}
            <GradientText>before your first invoice</GradientText>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 font-medium">
            Autoniv's AI voice assistant answers every call, books every appointment, and follows up automatically — starting at ₹4,999/month ($149/mo). No hidden charges. Cancel anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <button
              onClick={() => scrollToSection('pricing')}
              className="px-8 py-4 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 transition-all transform hover:-translate-y-0.5"
            >
              Start Now →
            </button>
            <button
              onClick={() => scrollToSection('roi')}
              className="px-8 py-4 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all transform hover:-translate-y-0.5"
            >
              Calculate my savings
            </button>
          </div>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Setup fee is one-time · Live in 48 hours · 30-day money-back guarantee
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
              <span>No Hidden Charges</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
              <span>Setup Fee is One-time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
              <span>30-day Money Back</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Control Toggles Bar */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 mb-16">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-center gap-6">
          {/* Billing Toggle */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200 last:border-r-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing</span>
            <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  billing === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billing === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-emerald-400/20 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold">−20%</span>
              </button>
            </div>
          </div>

          {/* Channel Toggle */}
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200 last:border-r-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Channel</span>
            <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => navigate('/pricing/ai-chatbot')}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
              >
                Chat
              </button>
              <button
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm transition-all"
              >
                Voice
              </button>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Currency</span>
            <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setCurrency('inr')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currency === 'inr'
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('usd')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currency === 'usd'
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid Section */}
      <section id="pricing" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionLabel text="AI Receptionist Pricing" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Plans built around call volume, not guesswork
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Every plan includes an AI voice agent, a dedicated phone number, lead capture, and appointment booking. Upgrade when your call volume asks for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {PLANS.map((plan) => {
            let numPrice = currency === 'usd' ? plan.price.usd : plan.price.inr;
            if (numPrice !== null && billing === 'yearly') {
              numPrice = Math.round(numPrice * 0.8);
            }
            const displayPrice = fmtPrice(numPrice, currency);
            const extraMinText = currency === 'usd' ? plan.extraMinUsd : plan.extraMinInr;
            const setupText = currency === 'usd' ? plan.setupUsd : plan.setupInr;

            return (
              <motion.div
                key={plan.key}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative bg-white rounded-3xl p-8 flex flex-direction-col flex-col border transition-all duration-200 ${
                  plan.popular
                    ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    ★ MOST POPULAR
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 min-h-[32px] mb-4">{plan.tag}</p>

                <div className="my-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{displayPrice}</span>
                  {plan.price.inr !== null && <span className="text-sm font-semibold text-slate-500">/mo</span>}
                </div>

                <div className="text-xs font-semibold text-emerald-600 min-h-[18px] mb-1">
                  {billing === 'yearly' && plan.price.inr !== null ? 'Billed yearly · 20% off monthly rate' : ''}
                </div>

                <div className="text-xs text-slate-400 font-medium min-h-[16px] mb-3">
                  {plan.price.inr !== null ? `Extra minutes: ${extraMinText}` : ''}
                </div>

                <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-xl text-center mb-4">
                  {setupText}
                </div>

                {plan.why && (
                  <div className="bg-blue-50/60 border-l-2 border-blue-600 text-blue-900 text-xs px-3 py-2 rounded-r-xl mb-4 font-medium">
                    {plan.why}
                  </div>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: feat }} />
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCtaClick(plan.key)}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:opacity-95 shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Not Sure CTA Box */}
        <div className="mt-12 bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-wrap items-center justify-between gap-6 shadow-sm">
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Not sure which plan is right for you?</h4>
            <p className="text-sm text-slate-600">Talk to our automation experts and get a custom recommendation.</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 transition-all shadow-sm"
          >
            Schedule a Free Consultation →
          </button>
        </div>
      </section>

      {/* Voice vs Human Comparison */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="AI Voice Assistant vs. Human Receptionist" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            What you're really comparing your price to
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Most buyers aren't comparing Autoniv to another SaaS tool — they're comparing it to a hire. Here's that math, laid out plainly.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  <th className="py-4 px-6">Factor</th>
                  <th className="py-4 px-6 text-blue-600">Autoniv AI Voice Assistant</th>
                  <th className="py-4 px-6">Human receptionist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Monthly cost</td>
                  <td className="py-4 px-6 font-bold text-blue-600">From ₹4,999 ($149)</td>
                  <td className="py-4 px-6 text-slate-600">₹25,000 – ₹40,000 salary + PF/benefits ($500+)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Availability</td>
                  <td className="py-4 px-6 font-bold text-blue-600">24/7/365, zero downtime</td>
                  <td className="py-4 px-6 text-slate-600">~8 hrs/day, 5–6 days/week</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Simultaneous calls</td>
                  <td className="py-4 px-6 font-bold text-blue-600">Unlimited, no hold queue</td>
                  <td className="py-4 px-6 text-slate-600">One caller at a time</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Ramp-up time</td>
                  <td className="py-4 px-6 font-bold text-blue-600">Live in 48 hours</td>
                  <td className="py-4 px-6 text-slate-600">2–6 weeks hiring + training</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Consistency</td>
                  <td className="py-4 px-6 font-bold text-blue-600">Same script quality, every call</td>
                  <td className="py-4 px-6 text-slate-600">Varies by mood, fatigue, turnover</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Sick days / attrition</td>
                  <td className="py-4 px-6 font-bold text-blue-600">None</td>
                  <td className="py-4 px-6 text-slate-600">Average frontline attrition 25–40%/yr</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Scaling for spikes</td>
                  <td className="py-4 px-6 font-bold text-blue-600">Instant, no extra hiring</td>
                  <td className="py-4 px-6 text-slate-600">Requires overtime or new hires</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-slate-700">Reporting & analytics</td>
                  <td className="py-4 px-6 font-bold text-blue-600">Every call logged and searchable</td>
                  <td className="py-4 px-6 text-slate-600">Manual notes, inconsistent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="compare" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="AI Call Automation Pricing" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Full feature comparison
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            See exactly what changes between tiers before you commit.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <th className="py-4 px-6 text-left font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-base">Launch</th>
                  <th className="py-4 px-4 font-bold text-blue-600 text-base bg-blue-50/30">Growth</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-base">Scale</th>
                  <th className="py-4 px-4 font-bold text-slate-900 text-base">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Monthly Price</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{currency === 'usd' ? '$149/mo' : '₹4,999/mo'}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">{currency === 'usd' ? '$349/mo' : '₹14,999/mo'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{currency === 'usd' ? '$799/mo' : '₹34,999/mo'}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Custom</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">One-Time AI Implementation</td>
                  <td className="py-3.5 px-4 text-slate-600">{currency === 'usd' ? '$499' : '₹14,999'}</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">{currency === 'usd' ? '$999' : '₹29,999'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{currency === 'usd' ? '$1,999' : '₹49,999'}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Custom</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">AI Voice Agent</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">1</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">AI Workflows</td>
                  <td className="py-3.5 px-4 text-slate-600">3</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">10</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">AI Voice Agents</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">1</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Included Minutes / Month</td>
                  <td className="py-3.5 px-4 text-slate-600">500</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">1,500</td>
                  <td className="py-3.5 px-4 text-slate-600">4,000</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Phone Numbers</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">2</td>
                  <td className="py-3.5 px-4 text-slate-600">Multiple</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">AI Workflows</td>
                  <td className="py-3.5 px-4 text-slate-600">1</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">Up to 5</td>
                  <td className="py-3.5 px-4 text-slate-600">Unlimited</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Lead Capture & Appointment Booking</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Call Recording</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">AI Call Summary</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Analytics</td>
                  <td className="py-3.5 px-4 text-slate-600">Basic</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">Advanced</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Advanced + CRM</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Custom</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">WhatsApp Follow-ups</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">CRM Integration</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">All features</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">API Access</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Team Dashboard</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">White Label</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Dedicated Account Manager</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Support</td>
                  <td className="py-3.5 px-4 text-slate-600">Email</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600 bg-blue-50/10">Priority</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Priority</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">24×7 Premium</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">Extra Minutes Rate</td>
                  <td className="py-3.5 px-4 text-slate-600">{currency === 'usd' ? '$0.18/min' : '₹12/min'}</td>
                  <td className="py-3.5 px-4 text-slate-600 bg-blue-50/10">{currency === 'usd' ? '$0.16/min' : '₹11/min'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{currency === 'usd' ? '$0.14/min' : '₹10/min'}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">Custom</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 text-left font-semibold text-slate-700">SLA Guarantee</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400 bg-blue-50/10">—</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Add-ons Grid */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="Add-ons" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Supercharge your plan with add-ons
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Customize your plan with powerful add-ons to fit your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ADDONS.map((addon, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl mb-4">
                {addon.icon}
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{addon.title}</h4>
              <div className="text-blue-600 font-extrabold text-lg my-1">
                {currency === 'usd' ? addon.usd : addon.inr}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{addon.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="ROI Calculator" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            See what an AI voice assistant saves you
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Adjust the sliders to match your current call volume and staffing cost.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                <span>Calls handled per month</span>
                <span className="text-blue-600 font-bold">{calls.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={calls}
                onChange={(e) => setCalls(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                <span>Current receptionist / staff cost ({currency === 'usd' ? '$' : '₹'}/month)</span>
                <span className="text-blue-600 font-bold">
                  {currency === 'usd' ? `$${Math.round(salary / 80).toLocaleString()}` : `₹${salary.toLocaleString('en-IN')}`}
                </span>
              </div>
              <input
                type="range"
                min="15000"
                max="80000"
                step="1000"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                <span>Missed calls today (%)</span>
                <span className="text-blue-600 font-bold">{missed}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={missed}
                onChange={(e) => setMissed(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                <span>Average value of a converted lead ({currency === 'usd' ? '$' : '₹'})</span>
                <span className="text-blue-600 font-bold">
                  {currency === 'usd' ? `$${Math.round(leadValue / 80).toLocaleString()}` : `₹${leadValue.toLocaleString('en-IN')}`}
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="20000"
                step="200"
                value={leadValue}
                onChange={(e) => setLeadValue(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-center gap-6">
            <div className="flex justify-between items-baseline border-b border-slate-200 pb-4">
              <span className="text-sm font-medium text-slate-600">Recommended plan</span>
              <span className="text-xl font-extrabold text-slate-900">{roiPlan}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-200 pb-4">
              <span className="text-sm font-medium text-slate-600">Autoniv monthly cost</span>
              <span className="text-xl font-extrabold text-slate-900">
                {roiCost !== null ? (currency === 'usd' ? `$${roiCost}` : `₹${roiCost.toLocaleString('en-IN')}`) : 'Custom'}
              </span>
            </div>
            <div className="flex justify-between items-baseline border-b border-slate-200 pb-4">
              <span className="text-sm font-medium text-slate-600">Extra leads captured / month</span>
              <span className="text-xl font-extrabold text-slate-900">{extraLeads.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-sm font-semibold text-slate-700">Estimated monthly savings + recovered revenue</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {currency === 'usd' ? `$${Math.round(totalSavings / 80).toLocaleString()}` : `₹${totalSavings.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Use Cases */}
      <section id="industries" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="Industry use cases" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Built for how your industry actually gets called
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Autoniv's AI voice assistants ship with scripts tuned for these verticals from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRIES.map((ind, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-3xl mb-3">{ind.icon}</div>
              <h4 className="font-bold text-slate-900 text-base mb-2">{ind.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Stories & Logos */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="Customer stories" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Teams already running on Autoniv
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {TESTIMONIALS.map((t, index) => (
            <div key={index} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="text-amber-400 tracking-widest text-sm mb-4">★★★★★</div>
              <p className="text-slate-600 text-sm italic mb-6 leading-relaxed">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Trusted by 500+ businesses across India & Globally
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 font-extrabold text-lg">
            <span>Dental Zone</span>
            <span>City Hospital</span>
            <span>Greenfield</span>
            <span>FinVest</span>
            <span>Bright</span>
            <span>SolarMax</span>
            <span>Prime</span>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="Security & compliance" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Enterprise-grade trust, from day one
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_CARDS.map((card, index) => (
            <div key={index} className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl">
                {card.icon}
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{card.title}</h4>
              <p className="text-xs text-slate-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Autoniv */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="Why Autoniv" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Why teams choose Autoniv over alternatives
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Bland AI, Retell AI, Synthflow, Vapi, ElevenLabs, and PolyAI are developer platforms — you still have to build the agent. Autoniv ships a working AI voice assistant, tuned to your business, in 48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY_CARDS.map((why, index) => (
            <div key={index} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="text-blue-600 font-extrabold text-sm mb-2">{why.n}</div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">{why.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{why.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <SectionLabel text="FAQ" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            AI voice assistant pricing, answered
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-6 text-left font-bold text-base sm:text-lg text-slate-900 flex justify-between items-center gap-4"
                >
                  <span>{faq.q}</span>
                  <span className="text-blue-600 text-xl font-light">{isOpen ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <SectionLabel text="Get started" />
        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4">
          Your next missed call is the last one you'll lose
        </h2>
        <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
          Start today, see real calls handled in 48 hours, and upgrade only when your volume asks for it.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 transition-all shadow-lg transform hover:-translate-y-0.5"
          >
            Start Now →
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all transform hover:-translate-y-0.5"
          >
            Book a Demo
          </button>
        </div>
      </section>

      {/* SEO footer text strip & Footer */}
      <div className="border-t border-slate-200 pt-8 pb-4 text-center px-4 max-w-6xl mx-auto">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Autoniv provides AI voice assistant pricing, AI receptionist pricing, AI phone answering service pricing, AI call automation pricing, and AI calling software plans for businesses across healthcare, hospitality, finance, solar, real estate, e-commerce, legal, and agriculture. Plans range from ₹4,999/month ($149/mo) to custom Enterprise pricing, with monthly and yearly (20% off) billing, USD and INR currency options, and both voice and chat channels.
        </p>
      </div>

      <Footer />
    </div>
  );
}

export default VoiceAssistancePricing;
