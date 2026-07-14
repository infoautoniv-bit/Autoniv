import User from '../db/models/User.js';

const PLAN_CONFIG = User.PLAN_CONFIG;

export function resolvePlans(user) {
  let chatPlan = user.chatPlan || 'none';
  let voicePlan = user.voicePlan || 'none';
  const plan = user.plan || 'chat_free';

  if (!chatPlan || chatPlan === 'none' || !PLAN_CONFIG[chatPlan]) {
    if (plan.startsWith('chat_')) {
      chatPlan = plan;
    } else if (plan.startsWith('voice_')) {
      chatPlan = 'none';
    } else if (plan.startsWith('both_')) {
      chatPlan = plan.replace('both_', 'chat_');
    } else {
      chatPlan = `chat_${plan}`;
    }
  }

  if (!voicePlan || voicePlan === 'none' || !PLAN_CONFIG[voicePlan]) {
    if (plan.startsWith('voice_')) {
      voicePlan = plan;
    } else if (plan.startsWith('chat_')) {
      voicePlan = 'none';
    } else if (plan.startsWith('both_')) {
      voicePlan = plan.replace('both_', 'voice_');
    } else {
      voicePlan = `voice_${plan}`;
    }
  }

  return {
    chatPlan: chatPlan || 'none',
    voicePlan: voicePlan || 'none',
  };
}

export function getPlanTier(planName) {
  if (!planName || planName === 'none') return 'free';
  if (planName.includes('starter')) return 'starter';
  if (planName.includes('growth')) return 'growth';
  if (planName.includes('enterprise')) return 'enterprise';
  return 'free';
}

export { PLAN_CONFIG };
