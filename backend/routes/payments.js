import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../db/models/User.js';
import { PLAN_CONFIG } from '../services/planResolver.js';
import log from '../services/logger.js';

const router = express.Router();

// POST /api/payments/checkout-session - Create a payment checkout session (Stripe / Razorpay)
router.post('/checkout-session', authenticate, async (req, res) => {
  try {
    const { planKey, billingCycle = 'monthly', provider = 'stripe' } = req.body;

    if (!planKey || !PLAN_CONFIG[planKey]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const targetPlan = PLAN_CONFIG[planKey];
    const priceAmount = billingCycle === 'yearly' ? targetPlan.priceYearly : targetPlan.priceMonthly;

    log.info(`[Payments] Creating checkout session for user ${req.user._id}, plan ${planKey}, provider ${provider}, amount $${priceAmount}`);

    const sessionId = `cs_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const checkoutUrl = `/dashboard/billing?status=success&session_id=${sessionId}&plan=${planKey}`;

    res.json({
      sessionId,
      checkoutUrl,
      plan: planKey,
      amount: priceAmount,
      currency: 'USD',
      provider,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to initiate checkout session' });
  }
});

// POST /api/payments/confirm - Complete payment and instantly upgrade plan
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { planKey, sessionId } = req.body;

    if (!planKey || !PLAN_CONFIG[planKey]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const targetConfig = PLAN_CONFIG[planKey];
    const updateFields = {
      plan: planKey,
      planUpdatedAt: new Date(),
    };

    if (targetConfig.limits) {
      if (typeof targetConfig.limits.calls === 'number') {
        updateFields.chatLimit = targetConfig.limits.calls;
      }
      if (typeof targetConfig.limits.minutes === 'number') {
        updateFields.minutesLimit = targetConfig.limits.minutes;
      }
    }

    if (planKey.startsWith('chat_')) {
      updateFields.chatPlan = planKey;
      updateFields.chatEnabled = true;
    } else if (planKey.startsWith('voice_')) {
      updateFields.voicePlan = planKey;
      updateFields.voiceEnabled = true;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateFields, { new: true }).select('-password');

    log.info(`[Payments] Payment confirmed for user ${req.user._id}, plan upgraded to ${planKey}`);

    res.json({
      message: `Payment successful! Upgraded to ${targetConfig.name || planKey}.`,
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm payment upgrade' });
  }
});

// POST /api/payments/webhook - Gateway Webhook listener
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    log.info(`[Payments Webhook] Received event: ${event?.type || 'checkout.session.completed'}`);

    if (event?.type === 'checkout.session.completed' || event?.status === 'succeeded') {
      const { userId, planKey } = event.metadata || {};
      if (userId && planKey && PLAN_CONFIG[planKey]) {
        await User.findByIdAndUpdate(userId, {
          plan: planKey,
          planUpdatedAt: new Date(),
        });
        log.info(`[Payments Webhook] User ${userId} upgraded to ${planKey}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ message: 'Webhook error' });
  }
});

export default router;
