import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import User from '../db/models/User.js';
import { securityEvent, IS_PROD, log } from '../services/logger.js';

function getAccessSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (IS_PROD) {
      log.fatal('startup_fatal_missing_jwt_secret');
      process.exit(1);
    } else {
      log.warn('jwt_secret_using_insecure_dev_fallback');
      return 'dev-fallback-secret-do-not-use-in-production';
    }
  }
  return secret;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
}

function getSecrets() {
  return { access: getAccessSecret(), refresh: getRefreshSecret() };
}

const ALGORITHM = 'HS256';
const ISSUER = 'autoniv';
const AUDIENCE = 'autoniv-api';

export const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || '15m';
export const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL || '7d';
export const REFRESH_TOKEN_TTL_MS = ms(REFRESH_TOKEN_TTL);

function ms(str) {
  const m = String(str).match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2] || 'ms';
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
}

export function signAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL,
    noTimestamp: false,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign({ ...payload, kind: 'refresh' }, getRefreshSecret(), {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: REFRESH_TOKEN_TTL,
    noTimestamp: false,
    jwtid: crypto.randomBytes(16).toString('hex'),
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  });
}

export function verifyAccessTokenIgnoreExpiry(token) {
  return jwt.verify(token, getAccessSecret(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
    ignoreExpiration: true,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  });
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function tokenResponse({ user, dashboardStats, accessToken, refreshToken }) {
  let chatPlan = user.chatPlan || 'none';
  let voicePlan = user.voicePlan || 'none';
  const userPlan = user.plan || 'chat_free';

  if (!chatPlan || chatPlan === 'none') {
    if (userPlan.startsWith('chat_')) {
      chatPlan = userPlan;
    } else if (userPlan.startsWith('voice_')) {
      chatPlan = 'none';
    } else if (userPlan.startsWith('both_')) {
      chatPlan = userPlan.replace('both_', 'chat_');
    } else {
      chatPlan = `chat_${userPlan}`;
    }
  }

  if (!voicePlan || voicePlan === 'none') {
    if (userPlan.startsWith('voice_')) {
      voicePlan = userPlan;
    } else if (userPlan.startsWith('chat_')) {
      voicePlan = 'none';
    } else if (userPlan.startsWith('both_')) {
      voicePlan = userPlan.replace('both_', 'voice_');
    } else {
      voicePlan = `voice_${userPlan}`;
    }
  }

  chatPlan = chatPlan || 'none';
  voicePlan = voicePlan || 'none';

  const getTier = (planName) => {
    if (!planName || planName === 'none') return 'free';
    if (planName.includes('starter')) return 'starter';
    if (planName.includes('growth')) return 'growth';
    if (planName.includes('enterprise')) return 'enterprise';
    return 'free';
  };

  const chatTier = getTier(chatPlan);
  const voiceTier = getTier(voicePlan);

  // Build features from PLAN_CONFIG
  const PLAN_CONFIG = User.PLAN_CONFIG;
  const features = { chat: {}, voice: {} };

  if (chatPlan !== 'none' && PLAN_CONFIG[chatPlan]) {
    features.chat = { ...PLAN_CONFIG[chatPlan].features };
    features.chat.conversations = PLAN_CONFIG[chatPlan].limits.conversations;
    features.chat.chatbots = PLAN_CONFIG[chatPlan].limits.chatbots;
  }

  if (voicePlan !== 'none' && PLAN_CONFIG[voicePlan]) {
    features.voice = { ...PLAN_CONFIG[voicePlan].features };
    features.voice.calls = PLAN_CONFIG[voicePlan].limits.calls;
    features.voice.minutes = PLAN_CONFIG[voicePlan].limits.minutes;
  }

  const plan = user.plan || (chatPlan !== 'none' ? chatPlan : voicePlan);

  const out = {
    accessToken,
    token: accessToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      company: user.company,
      plan,
      chatPlan,
      voicePlan,
      minutesUsed: user.minutesUsed,
      minutesLimit: voicePlan !== 'none' && PLAN_CONFIG[voicePlan] ? PLAN_CONFIG[voicePlan].limits.minutes : user.minutesLimit,
      callsUsed: user.callsUsed || 0,
      callsLimit: voicePlan !== 'none' && PLAN_CONFIG[voicePlan] ? PLAN_CONFIG[voicePlan].limits.calls : user.callsLimit,
      chatUsed: user.chatUsed || 0,
      chatLimit: chatPlan !== 'none' && PLAN_CONFIG[chatPlan] ? PLAN_CONFIG[chatPlan].limits.conversations : (user.chatLimit || 0),
      isActive: user.isActive,
      chatEnabled: chatPlan !== 'none',
      voiceEnabled: voicePlan !== 'none',
      features,
    },
  };
  if (refreshToken) out.refreshToken = refreshToken;
  if (dashboardStats) out.dashboardStats = dashboardStats;
  return out;
}

export function authSecurityEvent(event, extra) {
  securityEvent(`auth.${event}`, extra);
}
