import type { AddOnCatalogEntry } from '../types';

export const STATIC_ADDON_CATALOG: AddOnCatalogEntry[] = [
  { id: 'whatsapp-channel',   icon: '💬', title: 'WhatsApp Channel',   price: '₹2,499 / month', category: 'recurring', description: 'Native WhatsApp Business API with template support.', type: 'chat' },
  { id: 'advanced-analytics', icon: '📊', title: 'Advanced Analytics',  price: '₹1,499 / month', category: 'recurring', description: 'Funnel analysis, CSAT scores, and conversation heatmaps.', type: 'chat' },
  { id: 'priority-support',   icon: '🎧', title: 'Priority Support',   price: '₹4,999 / month', category: 'recurring', description: 'Dedicated Slack channel, 2-hour SLA, and onboarding specialist.', type: 'chat' },

  { id: 'monthly-performance-report', icon: '📊', title: 'Monthly Performance Report', price: '₹3,999–₹6,999 / month', category: 'recurring', description: 'Branded PDF with call quality scores, script performance, A/B outcomes, and industry benchmarks.', type: 'voice' },
  { id: 'script-ab-testing', icon: '🧪', title: 'Script A/B Testing', price: '₹8,999 / month', category: 'recurring', description: 'Run two scripts simultaneously. Analyze conversion rates and receive an optimized version monthly.', type: 'voice' },
  { id: 'whatsapp-followup', icon: '💬', title: 'WhatsApp Follow-Up Sequences', price: '₹4,999 / month', category: 'recurring', description: 'Automated post-call WhatsApp flows: reminders, no-show follow-ups, requalification messages.', type: 'voice' },
  { id: 'regional-language-agent', icon: '🌐', title: 'Regional Language Agent', price: '₹8,000 / month per language', category: 'recurring', description: 'Hindi, Tamil, Telugu, Bengali — reach Tier 2/3 city leads in their native language.', type: 'voice' },
  { id: 'reactivation-campaigns', icon: '🔁', title: 'Reactivation Campaigns', price: '₹14,999 / campaign', category: 'one-time', description: 'We call your dormant lead database quarterly. New pipeline with zero new ad spend.', type: 'voice' },
  { id: 'white-label-reseller', icon: '🏷️', title: 'White-Label Reseller', price: '₹49,999 setup + revenue share', category: 'one-time', description: 'Agencies and consultants: resell Autoniv under your brand with full support.', type: 'voice' }
];

export default STATIC_ADDON_CATALOG;
