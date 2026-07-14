import type { User } from '../types';

// ─── Shared plan configuration (mirrors backend PLAN_CONFIG) ──────────────────
export interface PlanLimits {
  chatbots: number;       // -1 = unlimited
  conversations: number;  // -1 = unlimited
  calls: number;          // -1 = unlimited
  minutes: number;        // -1 = unlimited
}

export interface PlanFeatures {
  // chat features
  whatsapp: boolean;
  removeBranding: boolean;
  hindiSupport: boolean;
  allChannels: boolean;
  crmIntegration: boolean;
  analytics: boolean;
  customAI: boolean;
  dpdpCompliance: boolean;
  dedicatedManager: boolean;
  // voice features
  leadCapture: boolean;
  whatsappDelivery: boolean;
  upgradePath: boolean;
  customScripts: boolean;
  prioritySupport: boolean;
  customReporting: boolean;
  whiteLabel: boolean;
  advancedAutomation: boolean;
}

export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  monthlyPriceUSD: number;
  setupFee: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

const ALL_FEATURES_FALSE: PlanFeatures = {
  whatsapp: false, removeBranding: false, hindiSupport: false,
  allChannels: false, crmIntegration: false, analytics: false,
  customAI: false, dpdpCompliance: false, dedicatedManager: false,
  leadCapture: false, whatsappDelivery: false, upgradePath: false,
  customScripts: false, prioritySupport: false, customReporting: false,
  whiteLabel: false, advancedAutomation: false,
};

const PLAN_CONFIG: Record<string, PlanConfig> = {
  chat_free:       { name: 'Chat Free',       monthlyPrice: 0,     monthlyPriceUSD: 0,   setupFee: 0,     limits: { chatbots: 1,   conversations: 100,   calls: 0,   minutes: 0   }, features: { ...ALL_FEATURES_FALSE } },
  chat_starter:    { name: 'Chat Starter',    monthlyPrice: 3499,  monthlyPriceUSD: 49,  setupFee: 0,     limits: { chatbots: 3,   conversations: 1000,  calls: 0,   minutes: 0   }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true } },
  chat_growth:     { name: 'Chat Growth',     monthlyPrice: 9999,  monthlyPriceUSD: 149, setupFee: 0,     limits: { chatbots: 10,  conversations: 5000,  calls: 0,   minutes: 0   }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true } },
  chat_enterprise: { name: 'Chat Enterprise', monthlyPrice: 0,     monthlyPriceUSD: 0,   setupFee: 0,     limits: { chatbots: -1,  conversations: -1,    calls: 0,   minutes: 0   }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, customAI: true, dpdpCompliance: true, dedicatedManager: true, leadCapture: false, whatsappDelivery: false, upgradePath: false, customScripts: false, prioritySupport: false, customReporting: false, whiteLabel: false, advancedAutomation: false } },

  voice_free:       { name: 'Voice Trial',       monthlyPrice: 4999,  monthlyPriceUSD: 59,  setupFee: 0,     limits: { chatbots: 0, conversations: 0,   calls: 30,   minutes: 30   }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true } },
  voice_starter:    { name: 'Voice Foundation',  monthlyPrice: 14999, monthlyPriceUSD: 179, setupFee: 14999, limits: { chatbots: 0, conversations: 0,   calls: 120,  minutes: 120  }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true, analytics: true } },
  voice_growth:     { name: 'Voice Scale',       monthlyPrice: 29999, monthlyPriceUSD: 359, setupFee: 39999, limits: { chatbots: 0, conversations: 0,   calls: 400,  minutes: 400  }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, crmIntegration: true, analytics: true, prioritySupport: true } },
  voice_enterprise: { name: 'Voice Dominate',    monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999, limits: { chatbots: 0, conversations: 0,   calls: 1200, minutes: -1   }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, crmIntegration: true, analytics: true, prioritySupport: true, customReporting: true, whiteLabel: true, advancedAutomation: true, dedicatedManager: true } },

  both_free:       { name: 'Chat + Voice Trial',       monthlyPrice: 4999,  monthlyPriceUSD: 59,  setupFee: 0,     limits: { chatbots: 1,   conversations: 100,   calls: 30,   minutes: 30   }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true } },
  both_starter:    { name: 'Chat + Voice Foundation',  monthlyPrice: 18498, monthlyPriceUSD: 228, setupFee: 14999, limits: { chatbots: 1,   conversations: 1000,  calls: 120,  minutes: 120  }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, analytics: true } },
  both_growth:     { name: 'Chat + Voice Scale',       monthlyPrice: 39998, monthlyPriceUSD: 508, setupFee: 39999, limits: { chatbots: 10,  conversations: 5000,  calls: 400,  minutes: 400  }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true } },
  both_enterprise: { name: 'Chat + Voice Dominate',    monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999, limits: { chatbots: -1,  conversations: -1,    calls: 1200, minutes: -1   }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, customAI: true, dpdpCompliance: true, dedicatedManager: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true, customReporting: true, whiteLabel: true, advancedAutomation: true } },

  free:       { name: 'Trial',       monthlyPrice: 4999,  monthlyPriceUSD: 59,  setupFee: 0,     limits: { chatbots: 1,   conversations: 100,   calls: 30,   minutes: 30   }, features: { ...ALL_FEATURES_FALSE, leadCapture: true, whatsappDelivery: true, upgradePath: true } },
  starter:    { name: 'Foundation',  monthlyPrice: 14999, monthlyPriceUSD: 179, setupFee: 14999, limits: { chatbots: 1,   conversations: 1000,  calls: 120,  minutes: 120  }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, analytics: true } },
  growth:     { name: 'Scale',       monthlyPrice: 29999, monthlyPriceUSD: 359, setupFee: 39999, limits: { chatbots: 10,  conversations: 5000,  calls: 400,  minutes: 400  }, features: { ...ALL_FEATURES_FALSE, whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true } },
  enterprise: { name: 'Dominate',    monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999, limits: { chatbots: -1,  conversations: -1,    calls: 1200, minutes: -1   }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, customAI: true, dpdpCompliance: true, dedicatedManager: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true, customReporting: true, whiteLabel: true, advancedAutomation: true } },
};

// ─── Plan resolution helpers ──────────────────────────────────────────────────

const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, growth: 2, enterprise: 3 };

/** Strip chat_/voice_/both_ prefix to get bare tier name */
export function getTierFromPlan(plan?: string | null): string {
  if (!plan || plan === 'none') return 'free';
  const tier = plan.replace(/^(chat_|voice_|both_)/, '');
  return TIER_ORDER[tier] !== undefined ? tier : 'free';
}

/** Get tier numeric order (higher = better) */
export function getTierOrder(tier: string): number {
  return TIER_ORDER[tier] ?? 0;
}

/** Resolve a user's effective plan to a PLAN_CONFIG key */
export function resolvePlanKey(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): string {
  return user.plan || user.chatPlan || 'chat_free';
}

/** Get the PLAN_CONFIG for a user */
export function getPlanConfig(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): PlanConfig {
  const key = resolvePlanKey(user);
  return PLAN_CONFIG[key] || PLAN_CONFIG.chat_free;
}

/** Get plan config by raw key */
export function getPlanConfigByKey(key: string): PlanConfig {
  return PLAN_CONFIG[key] || PLAN_CONFIG.chat_free;
}

/** Check if user has an active chat plan */
export function isChatPlan(user: Pick<User, 'chatPlan' | 'chatEnabled' | 'role'>): boolean {
  if (user.role === 'admin') return true;
  if (user.chatPlan) return user.chatPlan !== 'none';
  return user.chatEnabled !== undefined ? user.chatEnabled : true;
}

/** Check if user has an active voice plan */
export function isVoicePlan(user: Pick<User, 'voicePlan' | 'voiceEnabled' | 'role'>): boolean {
  if (user.role === 'admin') return true;
  if (user.voicePlan) return user.voicePlan !== 'none';
  return user.voiceEnabled !== undefined ? user.voiceEnabled : false;
}

/** Check if user has a specific feature */
export function hasFeature(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan' | 'role'>, featureName: keyof PlanFeatures): boolean {
  if (user.role === 'admin') return true;
  const config = getPlanConfig(user);
  return config.features[featureName] === true;
}

/** Get the max chatbots allowed for a user */
export function getMaxChatbots(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): number {
  const config = getPlanConfig(user);
  return config.limits.chatbots;
}

/** Get the max conversations allowed for a user */
export function getMaxConversations(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): number {
  const config = getPlanConfig(user);
  return config.limits.conversations;
}

/** Get the max calls allowed for a user */
export function getMaxCalls(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): number {
  const config = getPlanConfig(user);
  return config.limits.calls;
}

/** Get the max minutes allowed for a user */
export function getMaxMinutes(user: Pick<User, 'plan' | 'chatPlan' | 'voicePlan'>): number {
  const config = getPlanConfig(user);
  return config.limits.minutes;
}

/** Get plan badge color classes */
export function getPlanColor(plan?: string): { bg: string; border: string; text: string } {
  const tier = getTierFromPlan(plan);
  switch (tier) {
    case 'enterprise': return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' };
    case 'growth':     return { bg: 'bg-[var(--primary-soft)]', border: 'border-[var(--border)]', text: 'text-[var(--primary)]' };
    case 'starter':    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' };
    default:           return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
  }
}

/** Get plan display name */
export function getPlanDisplayName(plan?: string): string {
  if (!plan) return 'Free';
  const config = PLAN_CONFIG[plan];
  if (config) return config.name;
  const tier = getTierFromPlan(plan);
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export { PLAN_CONFIG };
