import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Reveal } from "./utils";
import { motion } from "framer-motion";
import { Stagger, StaggerItem } from "./anim";

type Mode = "chat" | "voice" | "combo";

const plansByMode: Record<Mode, {
  name: string; icon: string; monthlyPrice: string; yearlyPrice: string; period: string;
  badge: string | null; monthlyPriceINR: string; yearlyPriceINR: string; desc: string;
  features: { text: string; included: boolean }[]; cta: string; highlight: boolean;
}> = {
  chat: {
    name: "Free", icon: "💬", monthlyPrice: "$0", yearlyPrice: "$0", period: "forever",
    badge: "ALWAYS FREE",
    monthlyPriceINR: "₹0", yearlyPriceINR: "₹0",
    desc: "For individuals & small side projects.",
    features: [
      { text: "1 chatbot", included: true },
      { text: "100 conversations / month", included: true },
      { text: "Website embed", included: true },
      { text: "Basic FAQ & lead capture", included: true },
      { text: "No CRM integration", included: false },
      { text: "Branding visible", included: false },
    ],
    cta: "Get Started", highlight: false,
  },
  voice: {
    name: "Trial", icon: "🎙️", monthlyPrice: "$59", yearlyPrice: "$59", period: "/month",
    badge: "TRIAL",
    monthlyPriceINR: "₹4,999", yearlyPriceINR: "₹4,999",
    desc: "Test the system. See results in 30 days.",
    features: [
      { text: "1 AI Voice Assistant", included: true },
      { text: "30 calls / month", included: true },
      { text: "Lead capture & logging", included: true },
      { text: "WhatsApp delivery", included: true },
      { text: "30-day upgrade path", included: true },
    ],
    cta: "Get Started", highlight: true,
  },
  combo: {
    name: "Enterprise", icon: "🏢", monthlyPrice: "Custom", yearlyPrice: "Custom", period: "",
    badge: "VOICE + CHAT",
    monthlyPriceINR: "Custom", yearlyPriceINR: "Custom",
    desc: "Voice and Chat unified, tailored to your scale, compliance & SLAs.",
    features: [
      { text: "Unlimited Voice + Chat agents", included: true },
      { text: "Unlimited conversations & calls", included: true },
      { text: "Custom AI model training", included: true },
      { text: "GDPR / HIPAA / SOC 2", included: true },
      { text: "SLA + 99.9% uptime", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales", highlight: false,
  },
};

const getPlanColor = (mode: Mode) => {
  switch (mode) {
    case "chat":
      return "#64748b";
    case "voice":
      return "#10B981";
    case "combo":
      return "#8b5cf6";
    default:
      return "#10B981";
  }
};

export function Pricing({ openAuth }: { openAuth?: (mode: 'login' | 'register') => void }) {
  const navigate = useNavigate();
  const [pricingYearly, setPricingYearly] = useState(false);
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');
  const modeOrder: Mode[] = ["chat", "voice", "combo"];

  return (
    <section id="pricing" className="section-box black" style={{ background: '#030812', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="section-pad relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-10 left-5 w-[500px] h-[500px] pointer-events-none bg-gradient-radial from-blue-600/5 to-transparent blur-[100px]" />
        <div className="absolute bottom-10 right-5 w-[500px] h-[500px] pointer-events-none bg-gradient-radial from-emerald-500/5 to-transparent blur-[100px]" />

        {/* Header */}
        <Reveal className="text-center mb-12 flex flex-col items-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981" }}>
            Pricing Plans
          </span>
          <h2 className="font-black tracking-tight mt-5 text-white" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
            Simple, transparent pricing.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">No hidden costs.</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-3">
            Choose the plan that fits your business. Upgrade or cancel anytime.
          </p>

          {/* Toggles Panel */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 mb-12 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md px-6 py-4 rounded-3xl max-w-4xl mx-auto shadow-xl mt-8">

            {/* Billing Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Billing:</span>
              <div className="relative inline-flex items-center bg-slate-950 border border-slate-800/60 rounded-full p-1 shadow-inner">
                <button
                  onClick={() => setPricingYearly(false)}
                  className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {!pricingYearly && (
                    <motion.div
                      layoutId="section-yearly-toggle"
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
                  className="relative px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {pricingYearly && (
                    <motion.div
                      layoutId="section-yearly-toggle"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                      style={{ zIndex: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 transition-colors duration-200 flex items-center gap-1.5" style={{ color: pricingYearly ? '#ffffff' : '#94a3b8' }}>
                    Yearly
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${pricingYearly ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      Save 20%
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Currency:</span>
              <div className="relative inline-flex items-center bg-slate-950 border border-slate-800/60 rounded-full p-1 shadow-inner">
                <button
                  onClick={() => setCurrency('usd')}
                  className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {currency === 'usd' && (
                    <motion.div
                      layoutId="section-currency-toggle"
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
                  className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {currency === 'inr' && (
                    <motion.div
                      layoutId="section-currency-toggle"
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
        </Reveal>

        {/* Pricing Cards — Chat, Voice, Voice+Chat shown together */}
        <Stagger className="grid gap-6 max-w-5xl mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch mt-12" stagger={0.12}>
          {modeOrder.map((mode) => {
            const plan = plansByMode[mode];
            const planColor = getPlanColor(mode);
            return (
              <StaggerItem key={mode} variant="fadeUp" style={{ height: "100%" }}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-500 border cursor-default group`}
                  style={{
                    borderColor: plan.highlight ? planColor : mode === 'chat' ? 'rgba(59,130,246,0.15)' : 'rgba(255, 255, 255, 0.06)',
                    boxShadow: plan.highlight 
                      ? `0 20px 50px -12px ${planColor}30, inset 0 0 20px rgba(255,255,255,0.02)` 
                      : mode === 'chat' 
                        ? '0 10px 30px -15px rgba(59,130,246,0.15)' 
                        : '0 10px 30px -15px rgba(0,0,0,0.3)',
                    background: plan.highlight 
                      ? 'linear-gradient(180deg, rgba(13,27,42,0.8) 0%, rgba(13,27,42,0.3) 100%)' 
                      : mode === 'chat'
                        ? 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.3) 100%)'
                        : 'linear-gradient(180deg, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.3) 100%)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = planColor;
                    e.currentTarget.style.boxShadow = `0 30px 60px -15px ${planColor}45, inset 0 0 20px rgba(255,255,255,0.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = plan.highlight ? planColor : mode === 'chat' ? 'rgba(59,130,246,0.15)' : 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = plan.highlight ? `0 20px 50px -12px ${planColor}30, inset 0 0 20px rgba(255,255,255,0.02)` : mode === 'chat' ? '0 10px 30px -15px rgba(59,130,246,0.15)' : '0 10px 30px -15px rgba(0,0,0,0.3)';
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-xl text-[10px] font-bold text-white uppercase tracking-widest"
                      style={{ 
                        background: plan.highlight 
                          ? `linear-gradient(135deg, ${planColor}, #2563EB)` 
                          : mode === 'chat' 
                            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                            : 'rgba(255,255,255,0.08)',
                        boxShadow: plan.highlight 
                          ? `0 4px 12px ${planColor}40` 
                          : mode === 'chat' 
                            ? '0 4px 12px rgba(59,130,246,0.3)' 
                            : 'none'
                      }}
                    >
                      {plan.badge}
                    </motion.div>
                  )}

                  {/* Content */}
                  <div className={`p-6 flex-1 ${plan.badge ? 'pt-10' : ''}`}>
                    {/* Plan type label */}
                    <div className="mb-3">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                        style={{
                          background: mode === 'chat' ? 'rgba(59,130,246,0.12)' : mode === 'voice' ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)',
                          color: mode === 'chat' ? '#60a5fa' : mode === 'voice' ? '#34d399' : '#a78bfa',
                          border: `1px solid ${mode === 'chat' ? 'rgba(59,130,246,0.25)' : mode === 'voice' ? 'rgba(16,185,129,0.25)' : 'rgba(139,92,246,0.25)'}`,
                        }}
                      >
                        {mode === 'chat' ? '💬 For Chat' : mode === 'voice' ? '🎙️ For Voice' : '💬🎙️ Voice + Chat'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{
                          background: plan.highlight ? `${planColor}1c` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${planColor}25`,
                        }}
                      >
                        {plan.icon}
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{plan.name}</h3>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{plan.desc}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="py-4 border-y border-slate-800/60 mb-5">
                      <div className="flex items-baseline gap-1">
                        <motion.span
                          key={`${mode}-${pricingYearly}-${currency}`}
                          initial={{ opacity: 0, y: -6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-mono tracking-tight"
                        >
                          {pricingYearly
                            ? (currency === 'inr' ? plan.yearlyPriceINR : plan.yearlyPrice)
                            : (currency === 'inr' ? plan.monthlyPriceINR : plan.monthlyPrice)}
                        </motion.span>
                        {plan.period && (
                          <span className="text-xs text-slate-500 font-medium">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs"
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.4, delay: 0.3 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.08, type: 'spring', stiffness: 200 }}
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              feature.included
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "bg-slate-700/10 border border-slate-700/20"
                            }`}
                          >
                            {feature.included ? (
                              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-2.5 h-2.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </motion.div>
                          <span className={feature.included ? "text-slate-300" : "text-slate-600"}>
                            {feature.text}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="p-6 pt-0 mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (plan.cta === "Contact Sales") {
                          const el = document.getElementById('contact');
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 72;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                        } else {
                          if (openAuth) {
                            openAuth('login');
                          } else {
                            navigate('/login');
                          }
                        }
                      }}
                      className={`w-full font-bold text-xs py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        plan.highlight
                          ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/25"
                          : "bg-transparent text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                      }`}
                    >
                      {plan.cta}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Trust Badges */}
        <Reveal className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { icon: "🔒", text: "No credit card required" },
              { icon: "⚡", text: "Live in under 48 hours" },
              { icon: "↩️", text: "Cancel anytime" },
              { icon: "🎧", text: "24/7 support included" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-xs text-slate-400 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Footer Link */}
        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-center text-xs text-slate-500">
            All plans include 99.9% uptime SLA and zero setup fees.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-300"
            style={{
              background: "var(--gg)",
              boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(16,185,129,0.25)";
            }}
          >
            View full pricing
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}