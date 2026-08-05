import { STUDIES } from '../pages/public/caseStudiesData';

export type Meta = { title: string; description: string };

export const DEFAULT_META: Meta = {
  title: 'Autoniv | 24/7 AI Assistance for Businesses in 20+ Languages',
  description:
    'Autoniv provides 24/7 AI assistance for businesses with AI voice agents and chatbots, supporting customer calls, support, sales, & inquiries in 20+ languages. Start free.',
};

export const EXACT_META: Record<string, Meta> = {
  '/': DEFAULT_META,
  '/ai-voice-agent': { title: 'AI Voice Agents for Business Automation | Autoniv', description: 'Deploy intelligent, natural-sounding AI voice agents to automate inbound & outbound customer calls, qualify leads, and schedule appointments 24/7.' },
  '/ai-chatbot': { title: 'Intelligent AI Chatbots & Customer Assistants | Autoniv', description: 'Engage website visitors and automate customer support with AI chatbots that handle sales inquiries, support tickets, and leads in 20+ languages.' },
  '/ai-phone-answering': { title: '24/7 AI Phone Answering Service & Receptionist | Autoniv', description: 'Automate your front desk with an intelligent AI phone receptionist. Handle unlimited concurrent calls, filter spam, and transfer to humans when needed.' },
  '/appointment-booking': { title: 'Automated AI Appointment Booking & Scheduling | Autoniv', description: 'Let AI schedule, reschedule, and manage client bookings directly over voice calls and chat. Direct real-time calendar and CRM integrations.' },
  '/customer-support': { title: 'AI-Powered Customer Support Automation | Autoniv', description: 'Streamline support workflows with AI voice and chat assistants that resolve up to 80% of customer FAQs instantly, reducing operations cost by 70%.' },
  '/industries/real-estate': { title: 'AI Agents for Real Estate Automation | Autoniv', description: 'Qualify property leads, schedule home viewings, and follow up with buyers 24/7 using tailored AI voice agents and chatbots for real estate.' },
  '/industries/healthcare': { title: 'HIPAA-Compliant AI Voice & Chat for Healthcare | Autoniv', description: 'Automate patient intake, appointment scheduling, prescription refills, and follow-ups with secure, intelligent healthcare AI assistants.' },
  '/privacy': { title: 'Privacy Policy - Autoniv', description: 'Read the privacy policy of Autoniv. Learn how we handle, process, and protect your enterprise data under international and local regulations.' },
  '/terms': { title: 'Terms & Conditions - Autoniv', description: 'Review the terms of service governing the use of the Autoniv platform, AI agents, and billing systems.' },
  '/help': { title: 'Help Center & Documentation | Autoniv', description: 'Access support, documentation, API guides, and tutorials to configure and optimize your Autoniv AI voice and chat assistants.' },
  '/about': { title: 'About Us - The Team Behind Autoniv AI', description: 'Learn about our mission to make state-of-the-art conversational AI technology accessible and cost-effective for businesses globally.' },
  '/careers': { title: 'Careers - Join the Autoniv Team', description: 'Explore open roles and career opportunities at Autoniv. Help us build the future of autonomous voice and chat AI assistants.' },
  '/blog': { title: 'Autoniv Blog - AI Voice Technology & Business Automation', description: 'Read the latest insights, strategies, and trends on conversational AI, voice agents, chatbots, and business process automation.' },
  '/press': { title: 'Press Room & Media Kit | Autoniv', description: 'Get the latest press releases, media coverage, and brand assets for Autoniv.' },
  '/services': { title: 'AI Voice & Chat Solutions for Enterprise | Autoniv', description: 'Explore our full suite of autonomous voice agents, chat assistants, and business automation integrations.' },
  '/case-studies': { title: 'Success Stories & Customer Case Studies | Autoniv', description: 'Discover how businesses across healthcare, real estate, finance, and e-commerce achieve 70% cost reduction and 3x lead growth with Autoniv.' },
  '/pricing': { title: 'Pricing Plans - Autoniv', description: 'Choose the right plan for your business. Start free with 100 conversations per month, no credit card required, and scale as you grow.' },
  '/pricing/voice-assistance': { title: 'AI Voice Agent Pricing - Plans from Rs.4,999/mo | Autoniv', description: 'Compare AI voice agent pricing plans from Rs.4,999/month. See features, add-ons, and a free ROI calculator. No hidden fees, 30-day money-back guarantee.' },
  '/pricing/ai-chatbot': { title: 'AI Chatbot Pricing | Autoniv', description: 'Compare Autoniv AI chatbot pricing for Website, WhatsApp, Instagram & Facebook automation. Plans from free to enterprise. Start free.' },
  '/news': { title: 'Latest News - Autoniv', description: 'Stay updated with product announcements, brand news, and major updates from the Autoniv team.' },
  '/connect': { title: 'Contact Autoniv AI Specialist', description: 'Get in touch with Autoniv team for enterprise AI automation solutions.' },
  '/contact': { title: 'Contact Autoniv AI Specialist', description: 'Get in touch with Autoniv team for enterprise AI automation solutions.' },
  '/contact-ad': { title: 'Contact Autoniv AI Specialist', description: 'Get in touch with Autoniv team for enterprise AI automation solutions.' },
};

const DASHBOARD_TITLES: Record<string, string> = {
  '/dashboard/ai-voice-agent': 'My Voice Agents - Autoniv',
  '/dashboard/ai-phone-answering': 'Custom Call Test - Autoniv',
  '/dashboard/calls': 'Call History - Autoniv',
  '/dashboard/leads': 'My Leads - Autoniv',
  '/dashboard/appointment-booking': 'My Appointments - Autoniv',
  '/dashboard/ai-chatbot': 'My Chatbots - Autoniv',
  '/dashboard/chatbots': 'My Chatbots - Autoniv',
  '/dashboard/chatbots/new': 'Create Chatbot - Autoniv',
  '/dashboard/billing': 'Billing & Plan - Autoniv',
  '/dashboard/add-ons': 'Billing Add-ons - Autoniv',
};

const ADMIN_TITLES: Record<string, string> = {
  '/admin/users': 'Manage Users - Admin',
  '/admin/agents': 'Manage Voice Agents - Admin',
  '/admin/calls': 'Call Logs - Admin',
  '/admin/leads': 'Leads Directory - Admin',
  '/admin/appointments': 'Appointments Directory - Admin',
  '/admin/billing': 'Billing Logs - Admin',
  '/admin/upgrade-requests': 'Upgrade Requests - Admin',
  '/admin/add-ons': 'Manage Add-ons - Admin',
  '/admin/chat': 'Chat Sessions - Admin',
};

export const NOINDEX_PREFIXES = ['/dashboard', '/admin', '/onboarding', '/login', '/register', '/forgot-password'];

const BREADCRUMB_LABELS: Record<string, string> = {
  'ai-voice-agent': 'AI Voice Agent', 'ai-chatbot': 'AI Chatbot', 'ai-phone-answering': 'AI Phone Answering',
  'appointment-booking': 'Appointment Booking', 'customer-support': 'Customer Support', 'real-estate': 'Real Estate',
  healthcare: 'Healthcare', industries: 'Industries', services: 'Services', 'case-studies': 'Case Studies',
  pricing: 'Pricing', blog: 'Blog', about: 'About Us', careers: 'Careers', press: 'Press', help: 'Help Center',
};

export function resolveMeta(path: string): Meta {
  if (path in EXACT_META) return EXACT_META[path];
  if (path.startsWith('/case-studies/')) {
    const index = parseInt(path.split('/')[2], 10);
    if (!isNaN(index) && STUDIES[index]) {
      const s = STUDIES[index];
      const n = s.subcategory || s.category;
      return { title: `${n} Case Study (${s.metric} ${s.metricLabel}) | Autoniv`, description: `Discover how ${n} achieved ${s.metric} ${s.metricLabel} using Autoniv AI voice agents and chatbots. Read full results.` };
    }
    return { title: 'Case Study Details - Autoniv', description: 'Explore detailed outcomes, metrics, and implementations of our AI voice and chatbot deployment.' };
  }
  if (path.startsWith('/dashboard')) return { title: DASHBOARD_TITLES[path] ?? (path.includes('/ai-voice-agent/new') ? 'Create Voice Agent - Autoniv' : path.includes('/ai-phone-answering') ? 'Custom Call Test - Autoniv' : 'User Dashboard - Autoniv'), description: DEFAULT_META.description };
  if (path.startsWith('/admin')) return { title: ADMIN_TITLES[path] ?? 'Admin Dashboard - Autoniv', description: DEFAULT_META.description };
  return DEFAULT_META;
}

export function setMetaTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

export function getBreadcrumbLabel(part: string): string {
  return BREADCRUMB_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
}
