import mongoose from 'mongoose';
import crypto from 'crypto';

// ─── API Key Hashing ────────────────────────────────────────────────────────
const API_KEY_SALT = process.env.API_KEY_HASH_SALT || 'autoniv-api-key-salt';

export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key + API_KEY_SALT).digest('hex');
}

export function generateApiKey() {
  return 'ak_' + crypto.randomBytes(24).toString('hex');
}

// ─── Plan configurations ──────────────────────────────────────────────────────
// limits: { calls, minutes, chatbots, conversations }
// features: boolean flags per plan tier
const PLAN_CONFIG = {
  // ── Chat-only plans ──
  chat_free: {
    name: 'Chat Free', monthlyPrice: 0, monthlyPriceUSD: 0, setupFee: 0,
    limits: { calls: 0, minutes: 0, chatbots: 1, conversations: 100 },
    features: {
      whatsapp: false, removeBranding: false, hindiSupport: false,
      allChannels: false, crmIntegration: false, analytics: false,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
    },
  },
  chat_starter: {
    name: 'Chat Starter', monthlyPrice: 1499, monthlyPriceUSD: 29, setupFee: 0,
    limits: { calls: 0, minutes: 0, chatbots: 2, conversations: 1500 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: false, crmIntegration: false, analytics: false,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
    },
  },
  chat_growth: {
    name: 'Chat Growth', monthlyPrice: 4999, monthlyPriceUSD: 99, setupFee: 0,
    limits: { calls: 0, minutes: 0, chatbots: -1, conversations: 6000 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: true, crmIntegration: true, analytics: true,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
    },
  },
  chat_enterprise: {
    name: 'Chat Enterprise', monthlyPrice: 0, monthlyPriceUSD: 0, setupFee: 0,
    limits: { calls: 0, minutes: 0, chatbots: -1, conversations: -1 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: true, crmIntegration: true, analytics: true,
      customAI: true, dpdpCompliance: true, dedicatedManager: true,
    },
  },

  // ── Voice-only plans ──
  voice_free: {
    name: 'Voice Trial', monthlyPrice: 4999, monthlyPriceUSD: 59, setupFee: 0,
    limits: { calls: 30, minutes: 30, chatbots: 1, conversations: 0 },
    features: {
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: false, crmIntegration: false, analytics: false,
      prioritySupport: false, customReporting: false, whiteLabel: false,
      advancedAutomation: false, dedicatedManager: false,
    },
  },
  voice_starter: {
    name: 'Voice Foundation', monthlyPrice: 14999, monthlyPriceUSD: 179, setupFee: 14999,
    limits: { calls: 120, minutes: 120, chatbots: 1, conversations: 0 },
    features: {
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: false, crmIntegration: false, analytics: true,
      prioritySupport: false, customReporting: false, whiteLabel: false,
      advancedAutomation: false, dedicatedManager: false,
    },
  },
  voice_growth: {
    name: 'Voice Scale', monthlyPrice: 29999, monthlyPriceUSD: 359, setupFee: 39999,
    limits: { calls: 400, minutes: 400, chatbots: 3, conversations: 0 },
    features: {
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: true, crmIntegration: true, analytics: true,
      prioritySupport: true, customReporting: false, whiteLabel: false,
      advancedAutomation: false, dedicatedManager: false,
    },
  },
  voice_enterprise: {
    name: 'Voice Dominate', monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999,
    limits: { calls: 1200, minutes: -1, chatbots: -1, conversations: 0 },
    features: {
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: true, crmIntegration: true, analytics: true,
      prioritySupport: true, customReporting: true, whiteLabel: true,
      advancedAutomation: true, dedicatedManager: true,
    },
  },

  // ── Both plans (combined chat + voice) ──
  both_free: {
    name: 'Chat + Voice Trial', monthlyPrice: 4999, monthlyPriceUSD: 59, setupFee: 0,
    limits: { calls: 30, minutes: 30, chatbots: 1, conversations: 100 },
    features: {
      // chat features
      whatsapp: false, removeBranding: false, hindiSupport: false,
      allChannels: false, crmIntegration: false, analytics: false,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
      // voice features
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: false, prioritySupport: false, customReporting: false,
      whiteLabel: false, advancedAutomation: false,
    },
  },
  both_starter: {
    name: 'Chat + Voice Foundation', monthlyPrice: 16498, monthlyPriceUSD: 208, setupFee: 14999,
    limits: { calls: 120, minutes: 120, chatbots: 2, conversations: 1500 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: false, crmIntegration: false, analytics: true,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: false, prioritySupport: false, customReporting: false,
      whiteLabel: false, advancedAutomation: false,
    },
  },
  both_growth: {
    name: 'Chat + Voice Scale', monthlyPrice: 34998, monthlyPriceUSD: 458, setupFee: 39999,
    limits: { calls: 400, minutes: 400, chatbots: -1, conversations: 6000 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: true, crmIntegration: true, analytics: true,
      customAI: false, dpdpCompliance: false, dedicatedManager: false,
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: true, prioritySupport: true, customReporting: false,
      whiteLabel: false, advancedAutomation: false,
    },
  },
  both_enterprise: {
    name: 'Chat + Voice Dominate', monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999,
    limits: { calls: 1200, minutes: -1, chatbots: -1, conversations: -1 },
    features: {
      whatsapp: true, removeBranding: true, hindiSupport: true,
      allChannels: true, crmIntegration: true, analytics: true,
      customAI: true, dpdpCompliance: true, dedicatedManager: true,
      leadCapture: true, whatsappDelivery: true, upgradePath: true,
      customScripts: true, prioritySupport: true, customReporting: true,
      whiteLabel: true, advancedAutomation: true,
    },
  },

  // ── Legacy fallback (treated as both) ──
  free:       { name: 'Trial',       monthlyPrice: 4999,  monthlyPriceUSD: 59,  setupFee: 0,     limits: { calls: 30,  minutes: 30,  chatbots: 1,  conversations: 100  }, features: { whatsapp: false, removeBranding: false, hindiSupport: false, allChannels: false, crmIntegration: false, analytics: false, customAI: false, dpdpCompliance: false, dedicatedManager: false, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: false, prioritySupport: false, customReporting: false, whiteLabel: false, advancedAutomation: false } },
  starter:    { name: 'Foundation',  monthlyPrice: 14999, monthlyPriceUSD: 179, setupFee: 14999, limits: { calls: 120, minutes: 120, chatbots: 2,  conversations: 1500 }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: false, crmIntegration: false, analytics: true, customAI: false, dpdpCompliance: false, dedicatedManager: false, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: false, prioritySupport: false, customReporting: false, whiteLabel: false, advancedAutomation: false } },
  growth:     { name: 'Scale',       monthlyPrice: 29999, monthlyPriceUSD: 359, setupFee: 39999, limits: { calls: 400, minutes: 400, chatbots: -1, conversations: 6000 }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, customAI: false, dpdpCompliance: false, dedicatedManager: false, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true, customReporting: false, whiteLabel: false, advancedAutomation: false } },
  enterprise: { name: 'Dominate',    monthlyPrice: 74999, monthlyPriceUSD: 899, setupFee: 89999, limits: { calls: 1200, minutes: -1, chatbots: -1, conversations: -1 }, features: { whatsapp: true, removeBranding: true, hindiSupport: true, allChannels: true, crmIntegration: true, analytics: true, customAI: true, dpdpCompliance: true, dedicatedManager: true, leadCapture: true, whatsappDelivery: true, upgradePath: true, customScripts: true, prioritySupport: true, customReporting: true, whiteLabel: true, advancedAutomation: true } },
};

const FEATURES = {
  appointments: {
    whatsappNotification: { free: false, starter: true, growth: true, enterprise: true },
  },
  leads: {
    exportCsv:            { free: true,  starter: true, growth: true, enterprise: true },
    crmIntegration:       { free: false, starter: true,  growth: true, enterprise: true },
  },
  chat: {
    whatsappIntegration:  { free: false, starter: true, growth: true, enterprise: true },
    removeBranding:       { free: false, starter: true, growth: true, enterprise: true },
    multiLanguage:        { free: false, starter: true, growth: true, enterprise: true },
    allChannels:          { free: false, starter: false, growth: true, enterprise: true },
    crmIntegration:       { free: false, starter: true,  growth: true, enterprise: true },
    analytics:            { free: false, starter: false, growth: true, enterprise: true },
  },
  agents: {
    callRecording:        { free: false, starter: true, growth: true, enterprise: true },
    dedicatedPhone:       { free: false, starter: true, growth: true, enterprise: true },
    multiLanguage:        { free: false, starter: true, growth: true, enterprise: true },
    smartIVR:             { free: false, starter: false, growth: true, enterprise: true },
    customVoice:          { free: false, starter: false, growth: true, enterprise: true },
    crmIntegration:       { free: false, starter: true,  growth: true, enterprise: true },
  },
};

// ─── Tier level for upgrade path checks ───────────────────────────────────────
const TIER_ORDER = { free: 0, starter: 1, growth: 2, enterprise: 3 };

function getTierFromPlan(planKey) {
  if (!planKey || planKey === 'none') return 'free';
  const tier = planKey.replace(/^(chat_|voice_|both_)/, '');
  return TIER_ORDER[tier] !== undefined ? tier : 'free';
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },

    password: { type: String, required: true, select: false },

    name:        { type: String,  required: true, trim: true, maxlength: 100 },
    phoneNumber: { type: String,  default: '',    maxlength: 30 },
    role:        { type: String,  enum: ['admin', 'user'], default: 'user', index: true },
    company:     { type: String,  default: '',    maxlength: 200 },
    plan:        { type: String,  default: 'chat_free', enum: [
      'chat_free', 'chat_starter', 'chat_growth', 'chat_enterprise',
      'voice_free', 'voice_starter', 'voice_growth', 'voice_enterprise',
      'both_free', 'both_starter', 'both_growth', 'both_enterprise',
      'free', 'starter', 'growth', 'enterprise'
    ] },

    // Usage counters
    minutesUsed:  { type: Number, default: 0 },
    minutesLimit: { type: Number, default: 0 },
    callsUsed:    { type: Number, default: 0 },
    callsLimit:   { type: Number, default: 0 },
    chatUsed:     { type: Number, default: 0 },
    chatLimit:    { type: Number, default: 0 },

    isActive:  { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },

    chatEnabled:  { type: Boolean, default: true },
    voiceEnabled: { type: Boolean, default: false },

    chatPlan: {
      type: String,
      enum: ['chat_free', 'chat_starter', 'chat_growth', 'chat_enterprise', 'none'],
      default: 'chat_free'
    },
    voicePlan: {
      type: String,
      enum: ['voice_free', 'voice_starter', 'voice_growth', 'voice_enterprise', 'none'],
      default: 'none'
    },

    // Auth fields (hidden from API)
    loginAttempts:   { type: Number, default: 0, select: false },
    lockUntil:       { type: Date,   default: null, select: false },
    otpCode:         { type: String, default: null, select: false },
    otpExpiresAt:    { type: Date,   default: null, select: false },
    otpPurpose:      { type: String, default: null, select: false },
    passwordChangedAt: { type: Date,   default: null },
    lastLoginAt:     { type: Date,   default: null },
    lastLoginIp:     { type: String, default: null },

    apiKey: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

// ─── Pre-save: auto-calculate limits & feature flags ──────────────────────────
userSchema.pre('save', function (next) {
  if (!this.apiKey) {
    this.apiKey = hashApiKey(generateApiKey());
  }

  let chatPlan = this.chatPlan;
  let voicePlan = this.voicePlan;
  const legacyPlan = this.plan || 'chat_free';

  if (!chatPlan || chatPlan === 'none') {
    if (legacyPlan.startsWith('chat_')) {
      chatPlan = legacyPlan;
    } else if (legacyPlan.startsWith('voice_')) {
      chatPlan = 'none';
    } else if (legacyPlan.startsWith('both_')) {
      chatPlan = legacyPlan.replace('both_', 'chat_');
    } else {
      chatPlan = `chat_${legacyPlan}`;
    }
    this.chatPlan = chatPlan;
  }

  if (!voicePlan || voicePlan === 'none') {
    if (legacyPlan.startsWith('voice_')) {
      voicePlan = legacyPlan;
    } else if (legacyPlan.startsWith('chat_')) {
      voicePlan = 'none';
    } else if (legacyPlan.startsWith('both_')) {
      voicePlan = legacyPlan.replace('both_', 'voice_');
    } else {
      voicePlan = `voice_${legacyPlan}`;
    }
    this.voicePlan = voicePlan;
  }

  // Set enabled flags
  this.chatEnabled = this.chatPlan && this.chatPlan !== 'none';
  this.voiceEnabled = this.voicePlan && this.voicePlan !== 'none';

  // Set chat limits from chat plan
  if (this.chatPlan && this.chatPlan !== 'none') {
    const chatConfig = PLAN_CONFIG[this.chatPlan];
    if (chatConfig) {
      this.chatLimit = chatConfig.limits.conversations;
    }
  } else {
    this.chatLimit = 0;
  }

  // Set voice limits from voice plan
  if (this.voicePlan && this.voicePlan !== 'none') {
    const voiceConfig = PLAN_CONFIG[this.voicePlan];
    if (voiceConfig) {
      this.callsLimit = voiceConfig.limits.calls;
      this.minutesLimit = voiceConfig.limits.minutes;
    }
  } else {
    this.callsLimit = 0;
    this.minutesLimit = 0;
  }

  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

// Get resolved chat/voice plan pair
userSchema.methods.getResolvedPlans = function () {
  let chatPlan = this.chatPlan;
  let voicePlan = this.voicePlan;
  const legacyPlan = this.plan || 'chat_free';

  if (!chatPlan || chatPlan === 'none') {
    if (legacyPlan.startsWith('chat_')) {
      chatPlan = legacyPlan;
    } else if (legacyPlan.startsWith('voice_')) {
      chatPlan = 'none';
    } else if (legacyPlan.startsWith('both_')) {
      chatPlan = legacyPlan.replace('both_', 'chat_');
    } else {
      chatPlan = `chat_${legacyPlan}`;
    }
  }

  if (!voicePlan || voicePlan === 'none') {
    if (legacyPlan.startsWith('voice_')) {
      voicePlan = legacyPlan;
    } else if (legacyPlan.startsWith('chat_')) {
      voicePlan = 'none';
    } else if (legacyPlan.startsWith('both_')) {
      voicePlan = legacyPlan.replace('both_', 'voice_');
    } else {
      voicePlan = `voice_${legacyPlan}`;
    }
  }

  return { chatPlan: chatPlan || 'none', voicePlan: voicePlan || 'none' };
};

// Get the full config object for a plan key
userSchema.methods.getPlanConfig = function (planKey) {
  return PLAN_CONFIG[planKey] || null;
};

// Check if user has a specific feature flag
userSchema.methods.hasFeature = function (featureName) {
  const { chatPlan, voicePlan } = this.getResolvedPlans();

  // Check chat plan features
  if (chatPlan !== 'none') {
    const cfg = PLAN_CONFIG[chatPlan];
    if (cfg && cfg.features && cfg.features[featureName] === true) return true;
  }

  // Check voice plan features
  if (voicePlan !== 'none') {
    const cfg = PLAN_CONFIG[voicePlan];
    if (cfg && cfg.features && cfg.features[featureName] === true) return true;
  }

  return false;
};

// Check if user can add another chatbot
userSchema.methods.canAddChatbot = function () {
  const { chatPlan } = this.getResolvedPlans();
  if (chatPlan === 'none') return false;
  const cfg = PLAN_CONFIG[chatPlan];
  if (!cfg) return false;
  const limit = cfg.limits.chatbots;
  if (limit === -1) return true; // unlimited
  // Count current agents/chatbots (caller should pass count)
  return true; // actual count check done in route
};

// Check if user has exceeded conversation limit
userSchema.methods.hasExceededConversations = function () {
  const { chatPlan } = this.getResolvedPlans();
  if (chatPlan === 'none') return true;
  const cfg = PLAN_CONFIG[chatPlan];
  if (!cfg) return true;
  const limit = cfg.limits.conversations;
  if (limit === -1) return false; // unlimited
  return this.chatUsed >= limit;
};

// Check if user has exceeded call limit
userSchema.methods.hasExceededCalls = function () {
  const { voicePlan } = this.getResolvedPlans();
  if (voicePlan === 'none') return true;
  const cfg = PLAN_CONFIG[voicePlan];
  if (!cfg) return true;
  const limit = cfg.limits.calls;
  if (limit === -1) return false;
  return this.callsUsed >= limit;
};

// Check if user has exceeded minutes limit
userSchema.methods.hasExceededMinutes = function () {
  const { voicePlan } = this.getResolvedPlans();
  if (voicePlan === 'none') return true;
  const cfg = PLAN_CONFIG[voicePlan];
  if (!cfg) return true;
  const limit = cfg.limits.minutes;
  if (limit === -1) return false;
  return this.minutesUsed >= limit;
};

userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, createdAt: -1 });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.otpCode;
    delete ret.otpExpiresAt;
    delete ret.otpPurpose;
    delete ret.apiKey;
    delete ret.passwordChangedAt;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.otpCode;
    delete ret.otpExpiresAt;
    delete ret.otpPurpose;
    delete ret.apiKey;
    delete ret.passwordChangedAt;
    return ret;
  },
});

userSchema.statics.PLAN_CONFIG  = PLAN_CONFIG;
userSchema.statics.VALID_PLANS  = Object.keys(PLAN_CONFIG);
userSchema.statics.FEATURES     = FEATURES;
userSchema.statics.TIER_ORDER   = TIER_ORDER;
userSchema.statics.getTierFromPlan = getTierFromPlan;
userSchema.statics.getFeatureTogglesForPlan = function (plan) {
  if (!plan) return { chatEnabled: true, voiceEnabled: false };
  if (plan.startsWith('chat_')) {
    return { chatEnabled: true, voiceEnabled: false };
  } else if (plan.startsWith('voice_')) {
    return { chatEnabled: false, voiceEnabled: true };
  } else {
    return { chatEnabled: true, voiceEnabled: true };
  }
};

const User = mongoose.model('User', userSchema);
export default User;
