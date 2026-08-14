import Stripe from 'stripe';
import crypto from 'crypto';
import { log } from './logger.js';

// ─── Stripe Setup ─────────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripe = null;
if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.startsWith('your-')) {
  stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
}

// ─── Razorpay Setup ───────────────────────────────────────────────────────────
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function getRazorpayAuth() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

// ─── Price Mapping (in cents for Stripe, paise for Razorpay) ──────────────────
const PLAN_PRICES = {
  // Voice plans
  voice_free:      { USD: 14900, INR: 499900 },
  voice_starter:   { USD: 34900, INR: 1499900 },
  voice_growth:    { USD: 79900, INR: 3499900 },
  voice_enterprise: { USD: 0, INR: 0 },
  // Chat plans
  chat_free:       { USD: 0, INR: 0 },
  chat_starter:    { USD: 2900, INR: 149900 },
  chat_growth:     { USD: 9900, INR: 499900 },
  chat_enterprise: { USD: 0, INR: 0 },
  // Both plans
  both_free:       { USD: 14900, INR: 499900 },
  both_starter:    { USD: 37800, INR: 1649800 },
  both_growth:     { USD: 89800, INR: 3999800 },
  both_enterprise: { USD: 0, INR: 0 },
  // Legacy
  free:            { USD: 14900, INR: 499900 },
  starter:         { USD: 34900, INR: 1499900 },
  growth:          { USD: 79900, INR: 3499900 },
  enterprise:      { USD: 0, INR: 0 },
};

const YEARLY_MULTIPLIER = 10; // ~2 months free (10 months price for 12)

// ─── Stripe Functions ─────────────────────────────────────────────────────────
export async function createStripeCheckoutSession({ userId, planKey, billingCycle, currency = 'usd', successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe is not configured');

  const basePrice = PLAN_PRICES[planKey]?.[currency.toUpperCase()] || PLAN_PRICES[planKey]?.USD || 0;
  if (basePrice === 0) throw new Error('Enterprise plans require custom pricing');

  const amount = billingCycle === 'yearly' ? basePrice * (YEARLY_MULTIPLIER / 12) : basePrice;
  const finalAmount = Math.round(amount);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'ideal', 'bancontact'],
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: `Autoniv ${planKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          metadata: { planKey },
        },
        unit_amount: finalAmount,
        recurring: { interval: billingCycle === 'yearly' ? 'year' : 'month' },
      },
      quantity: 1,
    }],
    metadata: { userId: userId.toString(), planKey, billingCycle },
    success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/pricing`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    amount: finalAmount / 100,
    currency: currency.toUpperCase(),
  };
}

export async function verifyStripeWebhook(rawBody, signature) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return null;
  return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}

export async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, planKey } = session.metadata || {};
      return { type: 'payment_success', userId, planKey, providerPaymentId: session.payment_intent };
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const { userId, planKey } = invoice.metadata || {};
      return { type: 'payment_failed', userId, planKey, reason: invoice.last_finalization_error?.message };
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const { userId } = subscription.metadata || {};
      return { type: 'subscription_cancelled', userId };
    }
    default:
      return null;
  }
}

// ─── Razorpay Functions ───────────────────────────────────────────────────────
export async function createRazorpayOrder({ userId, planKey, billingCycle, currency = 'INR' }) {
  const auth = getRazorpayAuth();
  if (!auth) throw new Error('Razorpay is not configured');

  const basePrice = PLAN_PRICES[planKey]?.[currency.toUpperCase()] || PLAN_PRICES[planKey]?.INR || 0;
  if (basePrice === 0) throw new Error('Enterprise plans require custom pricing');

  const amount = billingCycle === 'yearly' ? basePrice * (YEARLY_MULTIPLIER / 12) : basePrice;
  const finalAmount = Math.round(amount);

  const orderId = `order_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  const order = {
    id: orderId,
    amount: finalAmount,
    currency,
    receipt: userId.toString(),
    notes: { planKey, billingCycle, userId: userId.toString() },
  };

  log.info('razorpay_order_created', { orderId, amount: finalAmount, currency, planKey });

  return {
    orderId: order.id,
    amount: finalAmount / 100,
    currency,
    keyId: RAZORPAY_KEY_ID,
  };
}

export async function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const auth = getRazorpayAuth();
  if (!auth) throw new Error('Razorpay is not configured');

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

export async function verifyRazorpayWebhook(rawBody, signature) {
  if (!RAZORPAY_WEBHOOK_SECRET) return null;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
}

export function handleRazorpayEvent(event) {
  switch (event.event) {
    case 'payment.captured': {
      const payment = event.payload.payment?.entity;
      const { userId, planKey } = payment?.notes || {};
      return { type: 'payment_success', userId, planKey, providerPaymentId: payment?.id };
    }
    case 'payment.failed': {
      const payment = event.payload.payment?.entity;
      const { userId, planKey } = payment?.notes || {};
      return { type: 'payment_failed', userId, planKey, reason: payment?.error_description };
    }
    case 'subscription.activated': {
      const subscription = event.payload.subscription?.entity;
      const { userId, planKey } = subscription?.notes || {};
      return { type: 'subscription_activated', userId, planKey };
    }
    case 'subscription.cancelled': {
      const subscription = event.payload.subscription?.entity;
      const { userId } = subscription?.notes || {};
      return { type: 'subscription_cancelled', userId };
    }
    default:
      return null;
  }
}

// ─── Shared Functions ─────────────────────────────────────────────────────────
export function detectCurrency(country) {
  const indiaCountries = ['IN', 'India'];
  return indiaCountries.includes(country) ? 'INR' : 'USD';
}

export function getAvailableProviders(currency) {
  const providers = [];
  if (stripe) providers.push('stripe');
  if (getRazorpayAuth() && currency === 'INR') providers.push('razorpay');
  return providers;
}
