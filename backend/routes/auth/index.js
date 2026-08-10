import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../../db/models/User.js';
import Agent from '../../db/models/Agent.js';
import Call from '../../db/models/Call.js';
import Lead from '../../db/models/Lead.js';
import RefreshToken from '../../db/models/RefreshToken.js';
import { authenticate } from '../../middleware/auth.js';
import { loginLimiter, registerLimiter, authLimiter } from '../../middleware/rateLimiters.js';
import { contentFilter } from '../../services/contentModeration.js';
import {
  isValidEmail,
  passwordError,
  phoneError,
  normalizeEmail,
  trimString,
  NAME_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
} from '../../services/validators.js';
import { resolvePlans, getPlanTier, PLAN_CONFIG } from '../../services/planResolver.js';
import {
  isAccountLocked,
  getLockRemainingMs,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '../../middleware/accountLockout.js';
import { log, IS_PROD } from '../../services/logger.js';
import { constantTimeStringEqual } from '../../services/crypto.js';
import { auditLog } from '../../db/models/AuditLog.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  tokenResponse,
  authSecurityEvent,
} from '../../services/tokenService.js';
import {
  setTokenCookies,
  clearTokenCookies,
  extractRefreshFromCookie,
} from '../../services/cookieService.js';
import { sendOtpEmail } from '../../services/emailService.js';

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

async function issueLoginTokens(req, user) {
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

  return tokenResponse({ user, dashboardStats, accessToken, refreshToken });
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

  // Admins log in directly without OTP requirement
  if (user.role === 'admin') {
    return issueLoginTokens(req, user);
  }

  // Generate 6-digit OTP for login
  const otp = crypto.randomInt(100000, 999999).toString();
  user.otpCode = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  user.otpPurpose = 'login';
  await user.save();

  await sendOtpEmail({ to: email, otp, purpose: 'login' });

  log.info('login_otp_sent', { userId: String(user._id), ip: getClientIp(req) });

  return {
    ok: true,
    requiresOtp: true,
    email,
    message: 'Verification code sent to your email. Please verify to sign in.',
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
      existing.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
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
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
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

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await performLoginAttempt(req, email, password);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.json({
      requiresOtp: true,
      email: result.email,
      message: result.message,
    });
  } catch (error) {
    log.error('login_error', { error: error.message, stack: error.stack, email: req.body?.email });
    return res.status(500).json({ message: 'Login failed', detail: IS_PROD ? undefined : error.message });
  }
});

router.post('/verify-otp', loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const purpose = req.body?.purpose || 'login';

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt +otpPurpose +password');
    if (!user || !user.otpCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    if (user.otpPurpose && user.otpPurpose !== purpose) {
      return res.status(400).json({ message: 'Invalid verification request' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (!constantTimeStringEqual(user.otpCode, otp)) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpPurpose = null;
    user.isVerified = true;
    await user.save();

    const payload = await issueLoginTokens(req, user);
    setTokenCookies(res, payload.accessToken, payload.refreshToken);
    return res.json(payload);
  } catch (error) {
    log.error('verify_otp_error', { error: error.message, stack: error.stack, email: req.body?.email });
    return res.status(500).json({ message: 'Verification failed', detail: IS_PROD ? undefined : error.message });
  }
});

router.post('/resend-otp', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const purpose = req.body?.purpose || 'login';

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = purpose;
    await user.save();

    await sendOtpEmail({ to: email, otp, purpose });
    log.info('otp_resent', { userId: String(user._id), purpose, ip: getClientIp(req) });

    return res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    log.error('resend_otp_error', { error: error.message, email: req.body?.email });
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
});

router.post('/logout', authLimiter, async (req, res) => {
  try {
    const refreshToken = extractRefreshFromCookie(req) || req.body?.refreshToken;
    let userId = null;

    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await RefreshToken.deleteOne({ tokenHash }).catch(() => {});
      try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded?.userId) userId = decoded.userId;
      } catch {}
    }

    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1]?.trim();
        if (accessToken) {
          try {
            const decoded = verifyAccessToken(accessToken);
            if (decoded?.userId) userId = decoded.userId;
          } catch {}
        }
      }
    }

    if (userId) {
      await User.findByIdAndUpdate(userId, { tokenInvalidBefore: new Date() }).catch(() => {});
    }

    clearTokenCookies(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    log.error('logout_error', { error: error.message });
    clearTokenCookies(res);
    return res.json({ message: 'Logged out successfully' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken = extractRefreshFromCookie(req) || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (jwtErr) {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (!storedToken) {
      clearTokenCookies(res);
      authSecurityEvent('refresh_token_reuse_attempt', { userId: decoded.userId, ip: getClientIp(req) });
      return res.status(401).json({ message: 'Refresh token has been revoked' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isActive === false) {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'User account disabled' });
    }

    await RefreshToken.deleteOne({ _id: storedToken._id });

    const newPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      createdAtIp: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.json(tokenResponse({ user, accessToken: newAccessToken, refreshToken: newRefreshToken }));
  } catch (error) {
    log.error('refresh_error', { error: error.message });
    clearTokenCookies(res);
    return res.status(500).json({ message: 'Token refresh failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(tokenResponse({ user }));
  } catch (error) {
    log.error('me_error', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

router.get('/plan-status', authenticate, async (req, res) => {
  try {
    const targetId = req.user?.userId || req.user?._id;
    const user = targetId ? await User.findById(targetId).lean() : null;
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please log in again.', code: 'USER_NOT_FOUND' });
    }
    const resolved = resolvePlans(user);
    return res.json({
      plan: user.plan || resolved.chatPlan,
      chatPlan: resolved.chatPlan,
      voicePlan: resolved.voicePlan,
      chatEnabled: user.chatEnabled ?? (resolved.chatPlan !== 'none'),
      voiceEnabled: user.voiceEnabled ?? (resolved.voicePlan !== 'none'),
      minutesUsed: user.minutesUsed || 0,
      callsUsed: user.callsUsed || 0,
    });
  } catch (error) {
    log.error('plan_status_error', { error: error.message });
    return res.status(500).json({ message: 'Failed to fetch plan status' });
  }
});

export default router;
