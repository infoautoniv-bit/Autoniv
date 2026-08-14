import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import User from '../db/models/User.js';
import Payment from '../db/models/Payment.js';
import { PLAN_CONFIG } from '../services/planResolver.js';
import { notifyPlanChange } from '../services/planNotifier.js';
import {
  createStripeCheckoutSession,
  verifyStripeWebhook,
  handleStripeEvent,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyRazorpayWebhook,
  handleRazorpayEvent,
  detectCurrency,
  getAvailableProviders,
} from '../services/paymentService.js';
import log from '../services/logger.js';

const router = express.Router();

// ─── GET /api/payments/config - Get available providers and pricing ────────────
router.get('/config', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const currency = detectCurrency(user?.country);
    const providers = getAvailableProviders(currency);

    const plans = Object.entries(PLAN_CONFIG).map(([key, config]) => ({
      key,
      name: config.name,
      monthlyPrice: config.monthlyPrice,
      monthlyPriceUSD: config.monthlyPriceUSD,
      setupFee: config.setupFee,
      limits: config.limits,
      features: config.features,
    }));

    res.json({ providers, currency, plans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment config' });
  }
});

// ─── POST /api/payments/checkout - Create checkout session ────────────────────
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { planKey, billingCycle = 'monthly', provider = 'stripe', currency: reqCurrency } = req.body;

    if (!planKey || !PLAN_CONFIG[planKey]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const user = await User.findById(req.user._id).lean();
    const currency = reqCurrency || detectCurrency(user?.country);

    const targetPlan = PLAN_CONFIG[planKey];
    log.info('payment_checkout_initiated', { userId: req.user._id, planKey, provider, currency, billingCycle });

    let result;

    if (provider === 'razorpay' && currency === 'INR') {
      result = await createRazorpayOrder({
        userId: req.user._id,
        planKey,
        billingCycle,
        currency,
      });
      result.provider = 'razorpay';
    } else {
      result = await createStripeCheckoutSession({
        userId: req.user._id,
        planKey,
        billingCycle,
        currency: currency === 'INR' ? 'usd' : currency.toLowerCase(),
        successUrl: `${process.env.FRONTEND_URL}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}&plan=${planKey}`,
        cancelUrl: `${process.env.FRONTEND_URL}/pricing`,
      });
      result.provider = 'stripe';
    }

    // Create pending payment record
    await Payment.create({
      userId: req.user._id,
      planKey,
      amount: result.amount,
      currency,
      provider: result.provider,
      providerOrderId: result.sessionId || result.orderId,
      status: 'pending',
      billingCycle,
    });

    res.json(result);
  } catch (err) {
    log.error('payment_checkout_error', { error: err.message, userId: req.user?._id });
    res.status(500).json({ message: err.message || 'Failed to create checkout session' });
  }
});

// ─── POST /api/payments/confirm - Confirm payment and upgrade ──────────────────
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { planKey, sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!planKey || !PLAN_CONFIG[planKey]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    let paymentVerified = false;
    let providerPaymentId = sessionId;

    // Verify Razorpay payment
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      paymentVerified = await verifyRazorpayPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      providerPaymentId = razorpay_payment_id;
    } else if (sessionId) {
      // Stripe - session is verified via webhook, just check it exists
      paymentVerified = true;
    }

    if (!paymentVerified) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update payment record
    await Payment.findOneAndUpdate(
      { userId: req.user._id, providerOrderId: sessionId || razorpay_order_id },
      { status: 'completed', providerPaymentId }
    );

    // Upgrade user plan
    const targetConfig = PLAN_CONFIG[planKey];
    const chatPlan = planKey.startsWith('chat_') ? planKey : (planKey.startsWith('both_') ? planKey.replace('both_', 'chat_') : undefined);
    const voicePlan = planKey.startsWith('voice_') ? planKey : (planKey.startsWith('both_') ? planKey.replace('both_', 'voice_') : undefined);
    const legacyPlan = planKey;

    const updateFields = {
      plan: legacyPlan,
      planUpdatedAt: new Date(),
    };

    if (chatPlan) {
      updateFields.chatPlan = chatPlan;
      updateFields.chatEnabled = true;
    }
    if (voicePlan) {
      updateFields.voicePlan = voicePlan;
      updateFields.voiceEnabled = true;
    }

    const chatConfig = chatPlan ? PLAN_CONFIG[chatPlan] : null;
    const voiceConfig = voicePlan ? PLAN_CONFIG[voicePlan] : null;

    if (voiceConfig) {
      updateFields.callsLimit = voiceConfig.limits?.calls ?? 100;
      updateFields.minutesLimit = voiceConfig.limits?.minutes ?? 100;
    }
    if (chatConfig) {
      updateFields.chatLimit = chatConfig.limits?.conversations ?? 1000;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateFields, { new: true }).select('-password');

    // Notify via WebSocket
    notifyPlanChange(req.user._id, {
      plan: legacyPlan,
      chatPlan: chatPlan || updatedUser.chatPlan,
      voicePlan: voicePlan || updatedUser.voicePlan,
      chatEnabled: updatedUser.chatEnabled,
      voiceEnabled: updatedUser.voiceEnabled,
      callsLimit: updatedUser.callsLimit,
      minutesLimit: updatedUser.minutesLimit,
      chatLimit: updatedUser.chatLimit,
    }).catch((err) => log.warn('notifyPlanChange_error', { error: err.message }));

    log.info('payment_confirmed', { userId: req.user._id, planKey, providerPaymentId });

    res.json({
      message: `Payment successful! Upgraded to ${targetConfig.name || planKey}.`,
      user: updatedUser,
    });
  } catch (err) {
    log.error('payment_confirm_error', { error: err.message, userId: req.user?._id });
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// ─── POST /api/payments/webhook/stripe - Stripe webhook handler ───────────────
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = await verifyStripeWebhook(req.body, signature);

    if (!event) {
      return res.status(400).json({ message: 'Invalid Stripe webhook signature' });
    }

    const result = await handleStripeEvent(event);
    if (result?.type === 'payment_success' && result.userId && result.planKey) {
      const targetConfig = PLAN_CONFIG[result.planKey];
      if (targetConfig) {
        await User.findByIdAndUpdate(result.userId, {
          plan: result.planKey,
          planUpdatedAt: new Date(),
        });
        await Payment.findOneAndUpdate(
          { userId: result.userId, providerOrderId: event.data.object.id },
          { status: 'completed', providerPaymentId: result.providerPaymentId }
        );
        log.info('stripe_webhook_payment_success', { userId: result.userId, planKey: result.planKey });
      }
    }

    res.json({ received: true });
  } catch (err) {
    log.error('stripe_webhook_error', { error: err.message });
    res.status(400).json({ message: 'Webhook error' });
  }
});

// ─── POST /api/payments/webhook/razorpay - Razorpay webhook handler ───────────
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = await verifyRazorpayWebhook(req.body.toString(), signature);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid Razorpay webhook signature' });
    }

    const event = JSON.parse(req.body.toString());
    const result = handleRazorpayEvent(event);

    if (result?.type === 'payment_success' && result.userId && result.planKey) {
      const targetConfig = PLAN_CONFIG[result.planKey];
      if (targetConfig) {
        await User.findByIdAndUpdate(result.userId, {
          plan: result.planKey,
          planUpdatedAt: new Date(),
        });
        await Payment.findOneAndUpdate(
          { userId: result.userId, providerOrderId: event.payload?.payment?.entity?.order_id },
          { status: 'completed', providerPaymentId: result.providerPaymentId }
        );
        log.info('razorpay_webhook_payment_success', { userId: result.userId, planKey: result.planKey });
      }
    }

    res.json({ received: true });
  } catch (err) {
    log.error('razorpay_webhook_error', { error: err.message });
    res.status(400).json({ message: 'Webhook error' });
  }
});

// ─── GET /api/payments/history - Get payment history ──────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// ─── GET /api/payments/admin/all - Admin: All payments ────────────────────────
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (status) filter.status = status;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

export default router;
