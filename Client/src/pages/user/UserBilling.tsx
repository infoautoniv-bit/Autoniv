import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { createUpgradeRequest, fetchMyUpgradeRequests } from '../../store/slices/upgradeRequestsSlice';
import { fetchMyAgents } from '../../store/slices/agentsSlice';
import { isChatPlan, isVoicePlan, getPlanConfigByKey } from '../../utils/plan';

const CONTACT_PHONE_RAW = import.meta.env.VITE_CONTACT_PHONE_RAW || '917065990307';
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '+917065990307';

// ─── Plan Configurations ────────────────────────────────────────────────
const planCategories = {
  chat: [
    {
      id: 'chat_free', name: 'Chat Free', tagline: 'For individuals & small side projects.',
      price: 0, priceUSD: 0, callsPerMonth: 100, minutesPerMonth: 0,
      features: [
        { text: '1 chatbot', included: true },
        { text: '100 conversations / month', included: true },
        { text: 'Website embed', included: true },
        { text: 'Basic FAQ & lead capture', included: true },
        { text: 'No CRM integration', included: false },
        { text: 'Branding visible', included: false },
      ],
      icon: '💬', style: 'dashed', accentColor: 'from-slate-400 to-slate-500'
    },
    {
      id: 'chat_starter', name: 'Chat Starter', tagline: 'Freelancers & small businesses getting serious.',
      price: 1499, priceUSD: 29, callsPerMonth: 1500, minutesPerMonth: 0,
      features: [
        { text: '2 chatbots', included: true },
        { text: '1,500 conversations / month', included: true },
        { text: 'Website + WhatsApp channel', included: true },
        { text: 'Remove branding', included: true },
        { text: 'Email support', included: true },
        { text: 'No CRM integration', included: false },
      ],
      icon: '🚀', style: 'solid', accentColor: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'chat_growth', name: 'Chat Growth', tagline: 'SMBs and mid-market teams scaling fast.',
      price: 4999, priceUSD: 99, callsPerMonth: 6000, minutesPerMonth: 0,
      badge: 'Most Popular', icon: '📈', style: 'featured',
      features: [
        { text: 'Unlimited chatbots', included: true },
        { text: '6,000 conversations / month', included: true },
        { text: 'All 5 channels (Web, WhatsApp, Instagram, Messenger, Telegram)', included: true },
        { text: 'CRM & helpdesk integrations', included: true },
        { text: 'Full analytics dashboard', included: true },
        { text: 'Priority support', included: true },
      ],
      accentColor: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'chat_enterprise', name: 'Chat Enterprise', tagline: 'Large orgs with custom AI, compliance & SLAs.',
      price: 0, priceUSD: 0, callsPerMonth: 99999, minutesPerMonth: 0,
      features: [
        { text: 'Unlimited chatbots', included: true },
        { text: 'Unlimited conversations', included: true },
        { text: 'Custom AI model training', included: true },
        { text: 'GDPR / HIPAA / SOC 2', included: true },
        { text: 'SLA + 99.9% uptime', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
      icon: '🏢', style: 'solid', accentColor: 'from-violet-500 to-purple-650'
    }
  ],
  voice: [
    {
      id: 'voice_free', name: 'Voice Trial', tagline: 'Test the system. See results in 30 days.',
      price: 4999, priceUSD: 59, callsPerMonth: 30, minutesPerMonth: 30,
      features: [
        { text: '1 AI Voice Assistant', included: true },
        { text: '30 calls / month', included: true },
        { text: 'Lead capture & logging', included: true },
        { text: 'WhatsApp delivery', included: true },
        { text: '30-day upgrade path', included: true },
        { text: 'CRM integration', included: false },
      ],
      icon: '🎙️', style: 'dashed', accentColor: 'from-slate-400 to-slate-500'
    },
    {
      id: 'voice_starter', name: 'Voice Foundation', tagline: 'For businesses automating first conversations.',
      price: 14999, priceUSD: 179, callsPerMonth: 120, minutesPerMonth: 120, setupFee: 14999, setupFeeUSD: 179,
      features: [
        { text: '1 AI Voice Assistant', included: true },
        { text: '120 calls / month', included: true },
        { text: 'Lead capture & logging', included: true },
        { text: 'WhatsApp data delivery', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Free demo call', included: true },
      ],
      icon: '🎤', style: 'solid', accentColor: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'voice_growth', name: 'Voice Scale', tagline: 'For teams replacing a full calling function.',
      price: 29999, priceUSD: 359, callsPerMonth: 400, minutesPerMonth: 400, setupFee: 39999, setupFeeUSD: 479,
      badge: 'Most Popular', icon: '📞', style: 'featured',
      features: [
        { text: 'Up to 3 AI Workflows', included: true },
        { text: '400 calls / month', included: true },
        { text: 'Custom call scripts', included: true },
        { text: 'CRM integration', included: true },
        { text: 'Analytics dashboard', included: true },
        { text: 'Priority support', included: true },
      ],
      accentColor: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'voice_enterprise', name: 'Voice Dominate', tagline: 'For high-volume operations that can\'t slow down.',
      price: 74999, priceUSD: 899, callsPerMonth: 1200, minutesPerMonth: -1, setupFee: 89999, setupFeeUSD: 1079,
      features: [
        { text: 'Unlimited Workflows', included: true },
        { text: '1,200 calls / month', included: true },
        { text: 'Advanced automation', included: true },
        { text: 'Full API & CRM integrations', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom reporting', included: true },
      ],
      icon: '🏢', style: 'solid', accentColor: 'from-violet-500 to-purple-650'
    }
  ],
  both: [
    {
      id: 'both_free', name: 'Chat + Voice Trial', tagline: 'Test both chat and voice capabilities.',
      price: 4999, priceUSD: 59, callsPerMonth: 100, minutesPerMonth: 30,
      features: [
        { text: '1 chatbot & 1 voice agent', included: true },
        { text: '100 conversations & 30 calls', included: true },
        { text: 'Website embed', included: true },
        { text: 'Basic FAQ & lead capture', included: true },
        { text: 'WhatsApp delivery', included: true },
        { text: 'CRM integration', included: false },
      ],
      icon: '✨', style: 'dashed', accentColor: 'from-slate-400 to-slate-500'
    },
    {
      id: 'both_starter', name: 'Chat + Voice Foundation', tagline: 'Combined package for growing businesses.',
      price: 16498, priceUSD: 208, callsPerMonth: 1500, minutesPerMonth: 120, setupFee: 14999, setupFeeUSD: 179,
      features: [
        { text: '2 chatbots & 3 voice agents', included: true },
        { text: '1,500 chats & 120 calls', included: true },
        { text: 'WhatsApp + website', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Free demo call', included: true },
        { text: 'No CRM integration', included: false },
      ],
      icon: '⚡', style: 'solid', accentColor: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'both_growth', name: 'Chat + Voice Scale', tagline: 'Complete automation for scaling teams.',
      price: 34998, priceUSD: 458, callsPerMonth: 6000, minutesPerMonth: 400, setupFee: 39999, setupFeeUSD: 479,
      badge: 'Best Value', icon: '🔥', style: 'featured',
      features: [
        { text: 'Unlimited chatbots & 3 AI workflows', included: true },
        { text: '6,000 chats & 400 calls', included: true },
        { text: 'All channels incl. Instagram', included: true },
        { text: 'Custom call scripts', included: true },
        { text: 'CRM & helpdesk integrations', included: true },
        { text: 'Priority support', included: true },
      ],
      accentColor: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'both_enterprise', name: 'Chat + Voice Dominate', tagline: 'Complete customized AI architecture.',
      price: 74999, priceUSD: 899, callsPerMonth: 99999, minutesPerMonth: -1, setupFee: 89999, setupFeeUSD: 1079,
      features: [
        { text: 'Unlimited chatbots & agents', included: true },
        { text: 'Unlimited chats & voice mins', included: true },
        { text: 'Custom voice & LLM training', included: true },
        { text: 'GDPR / HIPAA / SOC 2', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom deployment node', included: true },
      ],
      icon: '🏢', style: 'solid', accentColor: 'from-violet-500 to-purple-650'
    }
  ]
};

// Flat array for lookup convenience
const legacyPlansMap: Record<string, string> = {
  free: 'both_free',
  starter: 'both_starter',
  growth: 'both_growth',
  enterprise: 'both_enterprise'
};

function getPlanConfig(planId: string | undefined) {
  const normId = planId ? (legacyPlansMap[planId] || planId) : 'chat_free';

  // Find in chat
  let found = planCategories.chat.find(p => p.id === normId);
  if (found) return { plan: found, type: 'chat' as const };

  // Find in voice
  found = planCategories.voice.find(p => p.id === normId);
  if (found) return { plan: found, type: 'voice' as const };

  // Find in both
  found = planCategories.both.find(p => p.id === normId);
  if (found) return { plan: found, type: 'both' as const };

  // Fallback to chat_free
  return { plan: planCategories.chat[0], type: 'chat' as const };
}

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
};
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};
const fadeSlide = {
  initial: { opacity: 0, x: 15 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

function getUsageBarColor(pct: number) {
  if (pct > 90) return 'from-rose-500 to-pink-500';
  if (pct > 70) return 'from-amber-500 to-orange-500';
  return 'from-blue-500 to-emerald-400';
}

function LockedSectionOverlay({ title, desc, onUnlock }: { title: string; desc: string; onUnlock: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900/65 backdrop-blur-[4px] rounded-2xl text-center select-none border border-white/5 animate-fadeIn">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white mb-4 shadow-lg animate-pulse">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-sm font-extrabold text-white tracking-tight">{title}</h3>
      <p className="text-[11px] text-slate-300 max-w-xs mt-1.5 font-semibold leading-relaxed">{desc}</p>
      <button
        onClick={onUnlock}
        className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-550 transition-all hover:scale-[1.02] shadow-md hover:shadow-indigo-500/10 cursor-pointer border-none"
      >
        Unlock Plan
      </button>
    </div>
  );
}

export function UserBilling() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const myAgents = useAppSelector((state) => state.agents.myAgents);
  const pendingRequest = useAppSelector((state) =>
    state.upgradeRequests.my.find((r) => r.status === 'pending')
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [modalTab, setModalTab] = useState<'chat' | 'voice' | 'both'>('chat');
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');

  const isChat = user ? isChatPlan(user) : true;
  const isVoice = user ? isVoicePlan(user) : false;

  useEffect(() => {
    dispatch(fetchMyUpgradeRequests({}));
    if (isVoice) {
      dispatch(fetchMyAgents({ page: 1, limit: 50 }));
    }
  }, [dispatch, isVoice]);

  const { plan: activePlanConfig, type: activePlanType } = getPlanConfig(user?.plan);

  // Synchronize upgrade modal default tab
  useEffect(() => {
    if (showUpgrade) {
      setModalTab(activePlanType);
      setSelectedPlan(null);
    }
  }, [showUpgrade, activePlanType]);

  const chatLimit = user?.chatLimit || activePlanConfig.callsPerMonth || 100;
  const rawMinutesLimit = user?.minutesLimit ?? activePlanConfig.minutesPerMonth ?? 0;
  const isUnlimitedMinutes = rawMinutesLimit === -1;
  const minutesLimit = isUnlimitedMinutes ? 0 : rawMinutesLimit || 50;

  const planCfg = user?.plan ? getPlanConfigByKey(user.plan) : null;
  const voiceCallsLimit = user?.callsLimit || planCfg?.limits.calls || 0;
  const voiceCallsUsed = user?.callsUsed || 0;
  const isUnlimitedCalls = voiceCallsLimit === -1;
  const voiceCallsPct = isUnlimitedCalls ? 0 : voiceCallsLimit > 0 ? (voiceCallsUsed / voiceCallsLimit) * 100 : 0;
  const voiceCallsRemaining = isUnlimitedCalls ? Infinity : voiceCallsLimit - voiceCallsUsed;

  const chatUsagePct = chatLimit > 0 ? ((user?.chatUsed || 0) / chatLimit) * 100 : 0;
  const voiceUsagePct = isUnlimitedMinutes ? 0 : minutesLimit > 0 ? ((user?.minutesUsed || 0) / minutesLimit) * 100 : 0;

  const chatRemaining = chatLimit - (user?.chatUsed || 0);
  const voiceRemaining = isUnlimitedMinutes ? Infinity : minutesLimit - (user?.minutesUsed || 0);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgrading(true);
    try {
      await dispatch(createUpgradeRequest(selectedPlan)).unwrap();
      setShowUpgrade(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Something went wrong';
      alert(msg);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-12 pr-1 scroll-smooth">
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 pt-1 pb-1">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[9px] font-black tracking-[0.22em] uppercase text-emerald-600">
                ◈ BILLING & SUBSCRIPTION
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-lg border bg-blue-50 text-[var(--primary-blue)] border-blue-200/50">
                System Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-800 leading-none">Billing</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-semibold">Manage plan levels, monitor usage quotas, and check invoices</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden shrink-0">
              <button
                onClick={() => setCurrency('usd')}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border-none ${currency === 'usd'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency('inr')}
                className={`px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border-none ${currency === 'inr'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
              >
                INR
              </button>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm w-fit whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500 shrink-0" />
              <span className="text-xs text-slate-700 font-bold">
                {activePlanConfig.name} Plan Active
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Current Plan Card ── */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm p-6 sm:p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-blue-500/5 to-transparent rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-radial-gradient from-emerald-500/5 to-transparent rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8 relative">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-200 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  CURRENT ACTIVE PLAN
                </span>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  {activePlanConfig.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 font-semibold leading-relaxed max-w-xs">{activePlanConfig.tagline}</p>
                <div className="flex flex-col gap-1 mt-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-800 tracking-tight">
                      {activePlanConfig.id.endsWith('enterprise') ? 'Custom' : currency === 'usd' ? `$${(activePlanConfig.priceUSD || 0).toLocaleString()}` : `₹${activePlanConfig.price.toLocaleString()}`}
                    </span>
                    {!activePlanConfig.id.endsWith('enterprise') && <span className="text-slate-500 font-bold text-xs">/ month</span>}
                  </div>
                  {!activePlanConfig.id.endsWith('enterprise') && (
                    <span className="text-xs text-slate-400 font-extrabold tracking-wide">
                      {currency === 'usd' ? `₹${activePlanConfig.price.toLocaleString()} INR` : `$${(activePlanConfig.priceUSD || 0).toLocaleString()} USD`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {pendingRequest ? (
              <div className="w-full py-4 rounded-xl font-bold text-center text-xs bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Upgrade request to {getPlanConfig(pendingRequest.requestedPlan).plan.name} is pending admin review
              </div>
            ) : activePlanConfig.id.endsWith('enterprise') ? (
              <div className="w-full py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center text-xs text-slate-500">
                Enterprise Plan — Contact support for custom volume quotas
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowUpgrade(true)}
                className="btn-cta w-full py-3.5 rounded-xl font-bold transition-all shadow-sm bg-gradient-to-r from-blue-600 to-indigo-650 text-white flex items-center justify-center gap-2 text-xs cursor-pointer btn-press border-none"
              >
                Upgrade Subscription
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            )}
          </motion.div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <motion.div variants={fadeSlide} className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6">
              <h3 className="text-[10px] font-black text-slate-400 mb-5 tracking-[0.16em] uppercase">Plan Entitlements</h3>
              <ul className="space-y-3">
                {activePlanConfig.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.22, ease }}
                    className="flex items-center gap-3.5"
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.included ? 'bg-blue-50 border border-blue-100 text-blue-500' : 'bg-slate-50 border border-slate-200 text-slate-400'
                      }`}>
                      {feature.included ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-[9px] font-black">–</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${feature.included ? 'text-slate-700' : 'text-slate-400 line-through decoration-slate-200'}`}>
                      {feature.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeSlide} className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-radial-gradient from-blue-500/5 to-transparent rounded-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                </div>
                <h3 className="text-xs font-extrabold text-slate-800 tracking-tight">Need assistance?</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-4">Our dedicated operations and billing team is here to support you at any stage.</p>
              <button className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer">
                Contact Billing Support
              </button>
            </motion.div>

            <motion.div variants={fadeSlide} className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6">
              <h3 className="text-[10px] font-black text-slate-400 mb-4 tracking-[0.16em] uppercase">Billing Cycle</h3>
              <div className="space-y-3">
                {[
                  { label: 'Billing Period', value: 'Monthly recurring' },
                  { label: 'Next Renewal', value: '1st of next month' },
                  { label: 'Setup Fee', value: 'Waived ($0 / ₹0)' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">{item.label}</span>
                    <span className="text-slate-700 font-extrabold">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── My Chat ── */}
        <div className="relative">
          {!isChat && (
            <LockedSectionOverlay
              title="Chat Capabilities Locked"
              desc="Upgrade your plan to a Chat Plan or combined Chat + Voice Plan to access chatbot conversations."
              onUnlock={() => setShowUpgrade(true)}
            />
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease }}
            className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden"
            style={{ filter: !isChat ? 'blur(4px)' : 'none', pointerEvents: !isChat ? 'none' : 'auto' }}
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial-gradient from-blue-500/5 to-transparent rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.25em] uppercase text-blue-600 mb-1">MY CHAT</p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Chat Conversations</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Conversation usage according to your current active subscription</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-extrabold text-blue-700">{activePlanConfig.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Conversations used</span>
                  <span className="text-xs font-extrabold text-slate-700 tabular-nums">
                    {user?.chatUsed || 0}
                    <span className="text-slate-400 font-medium">
                      {activePlanConfig.id.endsWith('enterprise') ? ' / ∞' : ` / ${chatLimit}`}
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(chatUsagePct, 100)}%` }}
                    transition={{ delay: 0.35, duration: 0.95, ease }}
                    className={`h-full rounded-full bg-gradient-to-r ${getUsageBarColor(chatUsagePct)} relative`}
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-glow" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2.5 font-bold">
                  <span>{chatUsagePct.toFixed(1)}% of monthly limit</span>
                  <span className="text-blue-600">
                    {activePlanConfig.id.endsWith('enterprise') ? 'Unlimited' : `${Math.max(0, chatRemaining).toLocaleString()} conversations remaining`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Chats Used', value: user?.chatUsed || 0, bg: 'bg-blue-50 border-blue-100 text-blue-600' },
                  { label: 'Available', value: activePlanConfig.id.endsWith('enterprise') ? '∞' : Math.max(0, chatRemaining), bg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                  { label: 'Monthly Limit', value: activePlanConfig.id.endsWith('enterprise') ? '∞' : chatLimit, bg: 'bg-slate-50 border-slate-200 text-slate-700' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.28, ease }}
                    className={`${stat.bg} border rounded-xl p-3.5 text-center`}
                  >
                    <p className="text-2xl font-black tracking-tight tabular-nums">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── My Agents ── */}
        <div className="relative">
          {!isVoice && (
            <LockedSectionOverlay
              title="Voice Agent Capabilities Locked"
              desc="Upgrade your plan to a Voice Plan or combined Chat + Voice Plan to build, test and deploy voice receptionists."
              onUnlock={() => setShowUpgrade(true)}
            />
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35, ease }}
            className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden"
            style={{ filter: !isVoice ? 'blur(4px)' : 'none', pointerEvents: !isVoice ? 'none' : 'auto' }}
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial-gradient from-emerald-50/5 to-transparent rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black tracking-[0.25em] uppercase text-emerald-600 mb-1">MY AGENTS</p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Voice Agents</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Voice usage according to your current active subscription</p>
              </div>
              <Link
                to="/dashboard/ai-voice-agent"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 transition-all shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-none"
              >
                Manage Agents
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Voice calls usage */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Voice calls used</span>
                <span className="text-xs font-extrabold text-slate-700 tabular-nums">
                  {voiceCallsUsed}
                  <span className="text-slate-400 font-medium">
                    {activePlanConfig.id.endsWith('enterprise') ? ' / ∞' : voiceCallsLimit > 0 ? ` / ${voiceCallsLimit}` : ' / —'}
                  </span>
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(voiceCallsPct, 100)}%` }}
                  transition={{ delay: 0.35, duration: 0.95, ease }}
                  className={`h-full rounded-full bg-gradient-to-r ${getUsageBarColor(voiceCallsPct)} relative`}
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-glow" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2.5 font-bold">
                <span>{voiceCallsPct.toFixed(1)}% of monthly limit</span>
                <span className="text-emerald-600">
                  {activePlanConfig.id.endsWith('enterprise') ? 'Unlimited' : isUnlimitedCalls ? 'Unlimited' : voiceCallsLimit > 0 ? `${Math.max(0, voiceCallsRemaining).toLocaleString()} calls remaining` : 'No call limit set'}
                </span>
              </div>
            </div>

            {/* Voice minutes usage */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Voice minutes used</span>
                <span className="text-xs font-extrabold text-slate-700 tabular-nums">
                  {user?.minutesUsed || 0}
                  <span className="text-slate-400 font-medium">
                    {activePlanConfig.id.endsWith('enterprise') ? ' / ∞' : ` / ${minutesLimit}`}
                  </span>
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(voiceUsagePct, 100)}%` }}
                  transition={{ delay: 0.35, duration: 0.95, ease }}
                  className={`h-full rounded-full bg-gradient-to-r ${getUsageBarColor(voiceUsagePct)} relative`}
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-glow" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-2.5 font-bold">
                <span>{voiceUsagePct.toFixed(1)}% of monthly limit</span>
                <span className="text-emerald-600">
                  {activePlanConfig.id.endsWith('enterprise') ? 'Unlimited' : `${Math.max(0, voiceRemaining).toLocaleString()} minutes remaining`}
                </span>
              </div>
            </div>

            {/* Agent cards */}
            {myAgents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {myAgents.slice(0, 8).map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${agent.isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                            {agent.type === 'receptionist' ? '🎙️' : agent.type === 'appointment' ? '📅' : '❓'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 truncate max-w-[120px]">{agent.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold capitalize">{agent.type} Agent</p>
                          </div>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-600">{agent.callCount || 0}</span>
                          <span className="text-[8px] text-slate-400 font-semibold">calls</span>
                        </div>
                        {agent.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-500 font-medium truncate max-w-[100px]">{agent.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center">
                <p className="text-xs font-bold text-slate-400">No active agents</p>
                <Link to="/dashboard/ai-voice-agent" className="text-xs font-bold text-emerald-600 hover:underline mt-1 inline-block">
                  Create your first agent →
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Upgrade Modal ── */}
        <AnimatePresence>
          {showUpgrade && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4"
              onClick={() => setShowUpgrade(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 12 }}
                transition={{ duration: 0.32, ease }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100 flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-800">Choose Your Upgrade Path</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Select the scale that matches your business growth</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Categories Tabs */}
                <div className="flex border-b border-slate-100 px-6 bg-slate-50/10 gap-1">
                  {(['chat', 'voice', 'both'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setModalTab(tab); setSelectedPlan(null); }}
                      className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 ${
                        modalTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab === 'chat' ? '💬 Chat Plans' : tab === 'voice' ? '🎙️ Voice Plans' : '⚡ Combined Plans'}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                  {modalTab === 'both' ? (
                    /* ── Combined Plans → Contact Admin ── */
                    <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl scale-150 pointer-events-none" />
                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>

                      <p className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-500 mb-2">Combined Chat + Voice</p>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Custom Bundle Plans</h3>
                      <p className="text-sm text-slate-500 font-semibold max-w-sm leading-relaxed mb-8">
                        Combined Chat + Voice plans are custom-configured by our team to match your exact business needs, volume, and workflow.
                      </p>

                      <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {[
                          { icon: '💬', label: 'Chat + Voice in one plan' },
                          { icon: '📞', label: 'Custom call & chat limits' },
                          { icon: '🔗', label: 'Unified CRM integrations' },
                          { icon: '💰', label: 'Bundled pricing discount' },
                          { icon: '🎯', label: 'Dedicated onboarding' },
                          { icon: '🛡️', label: 'Priority SLA support' },
                        ].map((f) => (
                          <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <span>{f.icon}</span>{f.label}
                          </span>
                        ))}
                      </div>

                      {/* Contact card */}
                      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 shadow-2xl shadow-indigo-900/30 border border-white/10 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Admin Team · Available</span>
                          </div>
                          <h4 className="text-lg font-black text-white mb-1">Contact Our Admin</h4>
                          <p className="text-xs text-slate-400 font-semibold mb-5 leading-relaxed">
                            Reach out to our admin team to configure your perfect combined plan. We'll set it up within 24 hours.
                          </p>
                          <div className="space-y-2.5">
                            <a href="mailto:hello@autoniv.com" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all group no-underline">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 font-semibold">Email us at</p>
                                <p className="text-xs text-white font-bold truncate group-hover:text-blue-300 transition-colors">hello@autoniv.com</p>
                              </div>
                              <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </a>
                            <a href={`https://wa.me/${CONTACT_PHONE_RAW}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all group no-underline">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 font-semibold">WhatsApp us</p>
                                <p className="text-xs text-white font-bold group-hover:text-emerald-300 transition-colors">{CONTACT_PHONE}</p>
                              </div>
                              <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </a>
                          </div>
                          <p className="text-[10px] text-slate-600 font-semibold text-center mt-4">
                            Typical response time: <span className="text-slate-400 font-bold">under 2 hours</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Chat / Voice plan cards ── */
                    <div className="px-6 py-5">
                      {/* Guarantee banner */}
                      <div className="mb-5 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3.5">
                        <div className="text-xl">🛡️</div>
                        <div>
                          <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wide">30-Day Performance Guarantee</p>
                          <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">We stand by our AI voice & chat performance. If our systems do not meet your requirements, request a full refund within 30 days.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {planCategories[modalTab as 'chat' | 'voice'].map((p) => {
                          const isCurrent = p.id === user?.plan;
                          const isSelected = selectedPlan === p.id;
                          const isFeatured = p.style === 'featured';
                          return (
                            <motion.button
                              key={p.id}
                              whileHover={!isCurrent ? { scale: 1.02, y: -2 } : undefined}
                              whileTap={!isCurrent ? { scale: 0.98 } : undefined}
                              onClick={() => !isCurrent && setSelectedPlan(p.id)}
                              disabled={isCurrent}
                              className={`relative p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col h-full ${
                                isCurrent ? 'border-emerald-200 bg-emerald-50/20 opacity-70 cursor-default'
                                : isSelected ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                                : isFeatured ? 'border-indigo-200 bg-indigo-50/5 hover:border-indigo-300'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              {p.badge && !isCurrent && (
                                <div className="btn-cta absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md uppercase tracking-wider whitespace-nowrap">
                                  {p.badge}
                                </div>
                              )}
                              {isCurrent && (
                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black text-white bg-emerald-500 shadow-md uppercase tracking-wider whitespace-nowrap">
                                  Current Plan
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mt-1">
                                  {p.icon && <span className="text-lg">{p.icon}</span>}
                                  <h3 className="text-base font-black text-slate-800 tracking-tight">{p.name}</h3>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-semibold h-10 overflow-hidden leading-normal">{p.tagline}</p>
                                <div className="mt-4">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                                      {p.id.endsWith('enterprise') ? 'Custom' : currency === 'usd' ? `$${(p.priceUSD || 0).toLocaleString()}` : `₹${p.price.toLocaleString()}`}
                                    </span>
                                    {!p.id.endsWith('enterprise') && <span className="text-[10px] text-slate-400 font-bold">/mo</span>}
                                  </div>
                                  {!p.id.endsWith('enterprise') && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      {currency === 'usd' ? `₹${p.price.toLocaleString()} INR` : `$${(p.priceUSD || 0).toLocaleString()} USD`}
                                    </p>
                                  )}
                                  <p className="text-[10px] mt-1.5 font-black text-blue-600">
                                    {p.callsPerMonth > 0 && `${p.callsPerMonth.toLocaleString()} ${modalTab === 'voice' ? 'calls' : 'chats'} / mo`}
                                  </p>
                                </div>
                                <div className="h-px bg-slate-100 my-4" />
                                <ul className="space-y-2 mb-4">
                                  {p.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                      {f.included ? (
                                        <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <span className="w-3 h-3 flex items-center justify-center flex-shrink-0 text-slate-300 text-xs">—</span>
                                      )}
                                      <span className={!f.included ? 'opacity-35 line-through font-normal' : ''}>{f.text}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-blue-100">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wide">Selected</span>
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected plan summary bar */}
                <AnimatePresence>
                  {selectedPlan && modalTab !== 'both' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 8, height: 0 }}
                      transition={{ duration: 0.2, ease }}
                      className="overflow-hidden"
                    >
                      <div className="mx-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-xs font-bold text-blue-800">
                          Selected: <span className="font-extrabold text-blue-900">{getPlanConfig(selectedPlan).plan.name}</span>
                          {' — '}
                          <span className="font-extrabold text-blue-900">
                            {selectedPlan.endsWith('enterprise') 
                              ? 'Custom pricing' 
                              : currency === 'usd' 
                                ? `$${(getPlanConfig(selectedPlan).plan.priceUSD || 0).toLocaleString()}/mo (approx. ₹${getPlanConfig(selectedPlan).plan.price.toLocaleString()}/mo)` 
                                : `₹${getPlanConfig(selectedPlan).plan.price.toLocaleString()}/mo (approx. $${(getPlanConfig(selectedPlan).plan.priceUSD || 0).toLocaleString()}/mo)`}
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/20 flex items-center gap-3">
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    Cancel
                  </button>
                  {modalTab !== 'both' ? (
                    <button
                      onClick={handleUpgrade}
                      disabled={!selectedPlan || upgrading}
                      className="btn-cta flex-1 py-3 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border-none"
                    >
                      {upgrading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending request...
                        </>
                      ) : (
                        <>
                          Submit Upgrade Request
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href="mailto:admin@autoniv.ai"
                      className="btn-cta flex-1 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center gap-2 shadow-sm border-none hover:opacity-90 no-underline"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Admin for Combined Plan
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Add-Ons CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35, ease }}
          className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none rounded-2xl" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial-gradient from-indigo-500/5 to-transparent rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative">
            <div>
              <p className="text-[9px] font-black tracking-[0.25em] uppercase text-indigo-600 mb-2">
                SYSTEM ADD-ONS
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Supercharge your system flows
              </h2>
              <p className="mt-2 text-xs font-semibold text-slate-500 max-w-lg leading-relaxed">
                Explore additional modules including regional language voice packs, daily performance insights, WhatsApp workflows, and advanced CRM webhooks.
              </p>
            </div>
            <Link
              to="/dashboard/add-ons"
              className="btn-cta flex-shrink-0 inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 transition-all shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border-none"
            >
              Browse Modules
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
