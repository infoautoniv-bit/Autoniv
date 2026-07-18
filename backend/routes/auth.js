import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import RefreshToken from '../db/models/RefreshToken.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, authLimiter } from '../middleware/rateLimiters.js';
import { contentFilter } from '../services/contentModeration.js';
import {
  isValidEmail,
  passwordError,
  phoneError,
  normalizeEmail,
  trimString,
  NAME_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
} from '../services/validators.js';
import { resolvePlans, getPlanTier, PLAN_CONFIG } from '../services/planResolver.js';
import {
  isAccountLocked,
  getLockRemainingMs,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '../middleware/accountLockout.js';
import { log, IS_PROD } from '../services/logger.js';
import { constantTimeStringEqual } from '../services/crypto.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  tokenResponse,
  authSecurityEvent,
} from '../services/tokenService.js';
import {
  setTokenCookies,
  clearTokenCookies,
  extractRefreshFromCookie,
} from '../services/cookieService.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();

const BCRYPT_COST = 10;

function getClientIp(req) {
  return (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').toString().slice(0, 64);
}

function getUserAgent(req) {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 500) : null;
}

async function issueTokensForUser({ user, req }) {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const tokenHash = hashRefreshToken(refreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    createdAtIp: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  RefreshToken.deleteMany({
    userId: user._id,
    expiresAt: { $lt: new Date() },
  }).catch(() => { });

  return { accessToken, refreshToken };
}

async function performLoginAttempt(req, email, password) {
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    await bcrypt.compare(password, '$2b$12$invalidhashplaceholderforconstttimepadding..').catch(() => false);
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  if (isAccountLocked(user)) {
    log.warn('login_attempt_locked_account', { userId: String(user._id), ip: getClientIp(req) });
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  if (user.isActive === false) {
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordFailedLogin(user);
    authSecurityEvent('login_failed', { email, userId: String(user._id), ip: getClientIp(req) });
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { loginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: getClientIp(req) }, $unset: { lockUntil: '' } },
  );

  const [{ accessToken, refreshToken }, dashboardStats] = await Promise.all([
    issueTokensForUser({ user, req }),
    (async () => {
      if (user.role === 'admin') {
        const [totalUsers, activeAgents, totalMinutesResult, callsToday] = await Promise.all([
          User.countDocuments({ role: 'user' }),
          Agent.countDocuments({ isActive: true }),
          User.aggregate([{ $group: { _id: null, total: { $sum: '$minutesUsed' } } }]),
          Call.countDocuments({
            startedAt: { $gte: new Date(new Date().toISOString().split('T')[0]) },
          }),
        ]);
        return {
          totalUsers,
          activeAgents,
          totalMinutes: Math.round(totalMinutesResult[0]?.total || 0),
          callsToday,
        };
      } else {
        const [agentCount, callCount, leadCount, calls] = await Promise.all([
          Agent.countDocuments({ userId: user._id }),
          Call.countDocuments({ userId: user._id }),
          Lead.countDocuments({ userId: user._id }),
          Call.find({
            userId: user._id,
            status: 'completed',
            endedAt: { $ne: null },
            startedAt: { $ne: null },
          }).lean(),
        ]);
        const minuteUsed = calls.reduce((sum, c) => {
          const diff = new Date(c.endedAt) - new Date(c.startedAt);
          return sum + Math.max(0, Math.floor(diff / 60000));
        }, 0);
        return { agentCount, callCount, leadCount, minuteUsed };
      }
    })(),
  ]);

  log.info('login_success', { userId: String(user._id), role: user.role, ip: getClientIp(req) });

  return {
    ok: true,
    payload: tokenResponse({ user, dashboardStats, accessToken, refreshToken }),
  };
}

router.post('/register', registerLimiter, contentFilter('name', 'company'), async (req, res) => {
  try {
    const name = trimString(req.body?.name, NAME_MAX_LENGTH);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const company = trimString(req.body?.company, COMPANY_MAX_LENGTH);
    const phoneNumber = trimString(req.body?.phoneNumber, 30);

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });
    const pwdErr = passwordError(password);
    if (pwdErr) return res.status(400).json({ message: pwdErr });
    const phoneErr = phoneError(phoneNumber);
    if (phoneErr) return res.status(400).json({ message: phoneErr });

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
      const otp = crypto.randomInt(100000, 999999).toString();
      existing.name = name;
      existing.password = hashedPassword;
      existing.phoneNumber = phoneNumber;
      existing.company = company;
      existing.otpCode = otp;
      existing.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      existing.otpPurpose = 'register';
      await existing.save();

      await sendOtpEmail({ to: email, otp, purpose: 'register' });

      log.info('user_registration_updated_otp', { userId: String(existing._id), ip: getClientIp(req) });

      return res.status(200).json({
        requiresOtp: true,
        email,
        message: 'Verification code sent to your email. Please verify to complete registration.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    const otp = crypto.randomInt(100000, 999999).toString();
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      company,
      role: 'user',
      plan: 'chat_free',
      chatPlan: 'chat_free',
      voicePlan: 'none',
      chatEnabled: true,
      voiceEnabled: false,
      isVerified: false,
      otpCode: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      otpPurpose: 'register',
      passwordChangedAt: new Date(),
    });

    await sendOtpEmail({ to: email, otp, purpose: 'register' });

    log.info('user_registered_pending_otp', { userId: String(user._id), ip: getClientIp(req) });

    return res.status(200).json({
      requiresOtp: true,
      email,
      message: 'Verification code sent to your email. Please verify to complete registration.',
    });
  } catch (error) {
    log.error('register_error', { error: error.message, stack: error.stack, email: req.body?.email });
    return res.status(500).json({ message: 'Registration failed', detail: IS_PROD ? undefined : error.message });
  }
});

router.post('/register-admin', registerLimiter, contentFilter('name', 'company'), async (req, res) => {
  try {
    const name = trimString(req.body?.name, NAME_MAX_LENGTH);
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const company = trimString(req.body?.company, COMPANY_MAX_LENGTH);
    const secret = typeof req.body?.secret === 'string' ? req.body.secret : '';

    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret) {
      authSecurityEvent('admin_register_no_secret_configured', { ip: getClientIp(req) });
      return res.status(503).json({ message: 'Admin registration not configured' });
    }
    if (!constantTimeStringEqual(secret, expectedSecret)) {
      authSecurityEvent('admin_register_bad_secret', { ip: getClientIp(req) });
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Valid email is required' });
    const pwdErr = passwordError(password);
    if (pwdErr) return res.status(400).json({ message: pwdErr });

    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      company,
      role: 'admin',
      plan: 'both_enterprise',
      chatPlan: 'chat_enterprise',
      voicePlan: 'voice_enterprise',
      chatEnabled: true,
      voiceEnabled: true,
      passwordChangedAt: new Date(),
    });

    const { accessToken, refreshToken } = await issueTokensForUser({ user, req });

    log.info('admin_registered', { userId: String(user._id), ip: getClientIp(req) });

    const response = tokenResponse({ user, accessToken, refreshToken });
    setTokenCookies(res, accessToken, refreshToken);
    return res.status(201).json(response);
  } catch (error) {
    log.error('register_admin_error', { error: error.message });
    return res.status(500).json({ message: 'Admin registration failed' });
  }
});

router.post('/login', authLimiter, loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +isVerified');
    if (!user) {
      await bcrypt.compare(password, '$2b$12$invalidhashplaceholderforconstttimepadding..').catch(() => false);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (isAccountLocked(user)) {
      log.warn('login_attempt_locked_account', { userId: String(user._id), ip: getClientIp(req) });
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordFailedLogin(user);
      authSecurityEvent('login_failed', { email, userId: String(user._id), ip: getClientIp(req) });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { loginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: getClientIp(req) }, $unset: { lockUntil: '' } },
    );

    // Admin users skip OTP — issue tokens directly
    if (user.role === 'admin') {
      const { accessToken, refreshToken } = await issueTokensForUser({ user, req });
      setTokenCookies(res, accessToken, refreshToken);
      log.info('login_success_admin_skip_otp', { userId: String(user._id), ip: getClientIp(req) });
      return res.json(tokenResponse({ user, accessToken, refreshToken }));
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          otpCode: otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          otpPurpose: 'login',
        },
      }
    );

    log.info('login_pending_otp', { userId: String(user._id), ip: getClientIp(req) });

    // Respond immediately, send email in background
    sendOtpEmail({ to: email, otp, purpose: 'login' }).catch((err) => log.error('otp_email_send_failed', { error: err.message }));

    return res.json({
      requiresOtp: true,
      email,
      message: 'Verification code sent to your email. Please verify to complete sign in.',
    });
  } catch (error) {
    log.error('login_error', { error: error.message, stack: error.stack, email: req.body?.email });
    return res.status(500).json({ message: 'Login failed', detail: IS_PROD ? undefined : error.message });
  }
});

router.post('/google', authLimiter, loginLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify Google Token securely (supports both Access Token and ID Token)
    let payload;
    const isAccessToken = !credential.includes('.');

    if (isAccessToken) {
      // Verify via Google UserInfo API
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        log.error('google_access_token_verification_failed', { errorText });
        return res.status(401).json({ message: 'Invalid Google token' });
      }
      payload = await response.json();
    } else {
      // Verify via Google TokenInfo API (for ID Token)
      const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const response = await fetch(tokenInfoUrl);
      if (!response.ok) {
        const errorText = await response.text();
        log.error('google_id_token_verification_failed', { errorText });
        return res.status(401).json({ message: 'Invalid Google credential' });
      }
      payload = await response.json();
    }

    const email = normalizeEmail(payload.email);
    const name = trimString(payload.name || '');
    const googleId = payload.sub;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided in Google profile' });
    }

    // Verify audience (aud) matches GOOGLE_CLIENT_ID if it is set in .env and is an ID Token
    if (!isAccessToken) {
      const envClientId = process.env.GOOGLE_CLIENT_ID;
      if (envClientId && payload.aud !== envClientId) {
        log.warn('google_audience_mismatch', { aud: payload.aud, expected: envClientId });
        return res.status(401).json({ message: 'Google client ID mismatch' });
      }
    }


    let user = await User.findOne({ email }).select('+password');
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate a random secure password placeholder
      const randomPassword = crypto.randomBytes(24).toString('base64url');
      const hashedPassword = await bcrypt.hash(randomPassword, BCRYPT_COST);

      user = await User.create({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'user',
        plan: 'chat_free',
        chatPlan: 'chat_free',
        voicePlan: 'none',
        chatEnabled: true,
        voiceEnabled: false,
        isVerified: true, // Google already verified this email
        passwordChangedAt: new Date(),
      });
      log.info('google_user_created', { userId: String(user._id), email });
    } else {
      // If user exists but is not verified, mark them as verified now since Google authenticated them
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
      log.info('google_user_login', { userId: String(user._id), email });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is disabled. Contact support.' });
    }

    // Update login audit info
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date(), lastLoginIp: getClientIp(req) } }
    );

    // Issue tokens and respond
    const accessToken = signAccessToken({ userId: String(user._id), role: user.role });
    const refreshToken = await signRefreshToken(String(user._id));

    const tokenResp = tokenResponse({ user, accessToken, refreshToken });
    setTokenCookies(res, accessToken, refreshToken);

    return res.status(isNewUser ? 201 : 200).json(tokenResp);
  } catch (error) {
    log.error('google_auth_error', { error: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Google authentication failed', detail: IS_PROD ? undefined : error.message });
  }
});


// ─── Dashboard Stats (deferred — no longer blocks login) ────────────────────
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    let stats;
    if (user.role === 'admin') {
      const [totalUsers, activeAgents, totalMinutesResult, callsToday] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Agent.countDocuments({ isActive: true }),
        User.aggregate([{ $group: { _id: null, total: { $sum: '$minutesUsed' } } }]),
        Call.countDocuments({
          startedAt: { $gte: new Date(new Date().toISOString().split('T')[0]) },
        }),
      ]);
      stats = {
        totalUsers,
        activeAgents,
        totalMinutes: Math.round(totalMinutesResult[0]?.total || 0),
        callsToday,
      };
    } else {
      const [agentCount, callCount, leadCount, calls] = await Promise.all([
        Agent.countDocuments({ userId }),
        Call.countDocuments({ userId }),
        Lead.countDocuments({ userId }),
        Call.find({
          userId,
          status: 'completed',
          endedAt: { $ne: null },
          startedAt: { $ne: null },
        }).lean(),
      ]);
      const minuteUsed = calls.reduce((sum, c) => {
        const diff = new Date(c.endedAt) - new Date(c.startedAt);
        return sum + Math.max(0, Math.floor(diff / 60000));
      }, 0);
      stats = { agentCount, callCount, leadCount, minuteUsed };
    }

    res.json(stats);
  } catch (error) {
    log.error('dashboard_stats_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken = typeof req.body?.refreshToken === 'string'
      ? req.body.refreshToken.trim()
      : extractRefreshFromCookie(req) || '';
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
      }
      authSecurityEvent('refresh_verify_failed', { ip: getClientIp(req), reason: err.message });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (decoded.kind !== 'refresh' || !decoded.userId) {
      authSecurityEvent('refresh_wrong_kind', { ip: getClientIp(req) });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored || stored.revokedAt) {
      if (stored && stored.revokedAt) {
        await RefreshToken.updateMany(
          { userId: stored.userId, revokedAt: null },
          { $set: { revokedAt: new Date(), revokedReason: 'reuse_detected' } },
        );
        authSecurityEvent('refresh_reuse_detected', {
          userId: String(stored.userId),
          ip: getClientIp(req),
        });
      }
      return res.status(401).json({ message: 'Refresh token revoked' });
    }

    if (stored.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: 'User no longer active' });
    }

    const newPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);
    const newTokenHash = hashRefreshToken(newRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      createdAtIp: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    await RefreshToken.updateOne(
      { _id: stored._id },
      { $set: { revokedAt: new Date(), revokedReason: 'rotated', replacedByHash: newTokenHash } },
    );

    setTokenCookies(res, newAccessToken, newRefreshToken);
    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    log.error('refresh_error', { error: error.message });
    return res.status(500).json({ message: 'Refresh failed' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = typeof req.body?.refreshToken === 'string'
      ? req.body.refreshToken.trim()
      : extractRefreshFromCookie(req) || null;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await RefreshToken.updateOne(
        { tokenHash, userId: req.user.userId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
      );
    } else {
      await RefreshToken.updateMany(
        { userId: req.user.userId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
      );
    }
    clearTokenCookies(res);
    log.info('logout', { userId: req.user.userId, ip: getClientIp(req) });
    return res.json({ message: 'Logged out' });
  } catch (error) {
    log.error('logout_error', { error: error.message });
    return res.status(500).json({ message: 'Logout failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { chatPlan, voicePlan } = resolvePlans(user);

    const chatTier = getPlanTier(chatPlan);
    const voiceTier = getPlanTier(voicePlan);

    const tierOrder = { free: 0, starter: 1, growth: 2, enterprise: 3 };
    const sharedTier = tierOrder[chatTier] >= tierOrder[voiceTier] ? chatTier : voiceTier;

    const features = { appointments: {}, leads: {}, chat: {}, agents: {} };
    for (const [key, val] of Object.entries(User.FEATURES.appointments)) features.appointments[key] = val[sharedTier];
    for (const [key, val] of Object.entries(User.FEATURES.leads)) features.leads[key] = val[sharedTier];
    for (const [key, val] of Object.entries(User.FEATURES.chat)) features.chat[key] = val[chatTier];
    for (const [key, val] of Object.entries(User.FEATURES.agents)) features.agents[key] = val[voiceTier];

    const plan = user.plan || (chatPlan !== 'none' ? chatPlan : voicePlan);

    return res.json({
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
    });
  } catch (error) {
    log.error('me_error', { error: error.message });
    return res.status(500).json({ message: 'Failed to get user' });
  }
});

// ─── Lightweight plan-status check (for polling) ────────────────────────────
router.get('/plan-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('plan chatPlan voicePlan chatEnabled voiceEnabled minutesUsed minutesLimit callsUsed callsLimit chatUsed chatLimit')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { chatPlan, voicePlan } = resolvePlans(user);

    return res.json({
      plan: user.plan || (chatPlan !== 'none' ? chatPlan : voicePlan),
      chatPlan,
      voicePlan,
      chatEnabled: chatPlan !== 'none',
      voiceEnabled: voicePlan !== 'none',
      minutesUsed: user.minutesUsed,
      minutesLimit: voicePlan !== 'none' && PLAN_CONFIG[voicePlan] ? PLAN_CONFIG[voicePlan].limits.minutes : user.minutesLimit,
      callsUsed: user.callsUsed || 0,
      callsLimit: voicePlan !== 'none' && PLAN_CONFIG[voicePlan] ? PLAN_CONFIG[voicePlan].limits.calls : user.callsLimit,
      chatUsed: user.chatUsed || 0,
      chatLimit: chatPlan !== 'none' && PLAN_CONFIG[chatPlan] ? PLAN_CONFIG[chatPlan].limits.conversations : (user.chatLimit || 0),
    });
  } catch (error) {
    log.error('plan_status_error', { error: error.message });
    return res.status(500).json({ message: 'Failed to get plan status' });
  }
});

// ─── Forgot Password ────────────────────────────────────────────────────────

router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpPurpose = 'reset_password';
    await user.save();

    await sendOtpEmail({ to: email, otp, purpose: 'reset_password' });

    log.info('forgot_password_request_otp', { email, ip: getClientIp(req) });

    return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
  } catch (error) {
    log.error('forgot_password_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to process request' });
  }
});

// ─── Reset Password ─────────────────────────────────────────────────────────

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const newPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!isValidEmail(email) || !newPassword || !otp) {
      return res.status(400).json({ message: 'Email, new password, and verification code are required' });
    }

    const pwdErr = passwordError(newPassword);
    if (pwdErr) return res.status(400).json({ message: pwdErr });

    const user = await User.findOne({ email }).select('+password +otpCode +otpExpiresAt +otpPurpose');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otpCode || user.otpPurpose !== 'reset_password' || user.otpExpiresAt < new Date() || !constantTimeStringEqual(user.otpCode, otp)) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpPurpose = null;
    await user.save();

    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'password_reset' } },
    );

    log.info('password_reset_otp_success', { userId: String(user._id), ip: getClientIp(req) });

    return res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    log.error('reset_password_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

// ─── Change Password (authenticated) ────────────────────────────────────────

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const pwdErr = passwordError(newPassword);
    if (pwdErr) return res.status(400).json({ message: pwdErr });

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'password_changed' } },
    );

    log.info('password_changed', { userId: req.user.userId, ip: getClientIp(req) });

    return res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    log.error('change_password_error', { error: error.message, userId: req.user.userId });
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

// ─── Verify OTP (Login & Register) ──────────────────────────────────────────
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : '';

    if (!isValidEmail(email) || !otp || !purpose) {
      return res.status(400).json({ message: 'Email, verification code, and purpose are required' });
    }

    if (!['register', 'login'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid verification purpose' });
    }

    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt +otpPurpose +isVerified +role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otpCode || user.otpPurpose !== purpose || user.otpExpiresAt < new Date() || !constantTimeStringEqual(user.otpCode, otp)) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const updateFields = {
      otpCode: null,
      otpExpiresAt: null,
      otpPurpose: null,
    };

    if (purpose === 'register') {
      updateFields.isVerified = true;
    }

    await User.updateOne({ _id: user._id }, { $set: updateFields });

    const { accessToken, refreshToken } = await issueTokensForUser({ user, req });
    setTokenCookies(res, accessToken, refreshToken);

    log.info(`${purpose}_otp_success`, { userId: String(user._id), ip: getClientIp(req) });

    return res.json(tokenResponse({ user, accessToken, refreshToken }));
  } catch (error) {
    log.error('verify_otp_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Verification failed' });
  }
});

// ─── Resend OTP ─────────────────────────────────────────────────────────────
router.post('/resend-otp', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : '';

    if (!isValidEmail(email) || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required' });
    }

    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid verification purpose' });
    }

    const user = await User.findOne({ email }).select('+isVerified');
    if (!user) {
      return res.json({ message: 'If an account exists, a new code has been sent.' });
    }

    if (purpose === 'register' && user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          otpCode: otp,
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          otpPurpose: purpose,
        },
      }
    );

    await sendOtpEmail({ to: email, otp, purpose });

    log.info('resend_otp_success', { userId: String(user._id), purpose, ip: getClientIp(req) });

    return res.json({ message: 'Verification code resent successfully' });
  } catch (error) {
    log.error('resend_otp_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to resend code' });
  }
});

export default router;
