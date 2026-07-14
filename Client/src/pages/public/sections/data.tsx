export const features = [
  { icon: "🎙️", title: "AI Voice Agents", desc: "Deploy intelligent voice assistants with 20+ languages and 100+ realistic voices for natural, human-like conversation.", metric: "3×", metricLabel: "faster response", color: "#2563EB" },
  { icon: "🌍", title: "Global Language Support", desc: "Serve customers worldwide with AI agents that speak 20+ languages including English, Hindi, Arabic, and more.", metric: "20+", metricLabel: "languages", color: "#10B981" },
  { icon: "🎧", title: "Premium Voice Selection", desc: "Choose from 100+ realistic voices across different ages, genders, and accents to match your brand perfectly.", metric: "100+", metricLabel: "voices", color: "#8B5CF6" },
  { icon: "📊", title: "Smart Analytics", desc: "Track call performance, lead conversion, and agent effectiveness with real-time dashboards.", metric: "99.8%", metricLabel: "accuracy rate", color: "#06B6D4" },
  { icon: "🔗", title: "CRM Integration", desc: "Seamlessly sync leads and call data with your existing CRM and business tools.", metric: "50+", metricLabel: "integrations", color: "#6366F1" },
  { icon: "🛡️", title: "Enterprise Security", desc: "Bank-grade encryption and compliance for your business communication needs.", metric: "SOC 2", metricLabel: "certified", color: "#F43F5E" },
];

export const WAVE_HEIGHTS = Array.from({ length: 38 }, (_, i) => {
  return 14 + Math.sin(i * 0.7) * 18 + Math.cos(i * 1.3) * 10 + Math.sin(i * 2.1) * 6;
});

export const STEPS = [
  { n: "01", title: "Describe", desc: "Tell us what your agent should do in plain text — no code, no prompts, no config files.", icon: "✍️" },
  { n: "02", title: "Configure", desc: "Pick a voice, language, and persona. Fine-tune with drag-and-drop or just keep chatting with the editor.", icon: "🎛️" },
  { n: "03", title: "Test", desc: "Simulate real calls, edge cases, and stress scenarios before going live. Catch issues early.", icon: "🧪" },
  { n: "04", title: "Deploy", desc: "Go live on your phone number, website widget, or API in one click.", icon: "🚀" },
  { n: "05", title: "Observe", desc: "Live dashboards, call transcripts, sentiment scores, and conversion tracking — all in one place.", icon: "📊" },
];

export const COMPARISON = [
  { capability: "Pricing model", autoniv: "Flat subscription", intercom: "Seat + per-resolution", zendesk: "Per agent/seat", tidio: "3 separate quotas", freshchat: "Per seat/mo", botpenguin: "Flat" },
  { capability: "Entry price", autoniv: "$49/mo all-in", intercom: "$29/seat + $0.99/res", zendesk: "$55/agent/mo", tidio: "$29 + Lyro add-on", freshchat: "$19/seat/mo", botpenguin: "$29/mo" },
  { capability: "Real cost @ 1K conv/mo", autoniv: "$49", intercom: "~$1,075+", zendesk: "~$825+", tidio: "~$108–150", freshchat: "~$57–100", botpenguin: "~$59–89" },
  { capability: "Annual cost (Growth)", autoniv: "$1,788/yr", intercom: "$30k–$80k+/yr", zendesk: "$9,900+/yr", tidio: "$708+/yr", freshchat: "$684+/yr", botpenguin: "$708/yr" },
  { capability: "Hidden fees", autoniv: "None — ever", intercom: "$0.99/resolution", zendesk: "$1.50/AI resolution", tidio: "Lyro + Flows + base", freshchat: "Freddy AI extra", botpenguin: "None" },
  { capability: "Free ongoing plan", autoniv: "✓ 100 conv/mo", intercom: "✗ None", zendesk: "✗ None", tidio: "50 total (one-time)", freshchat: "✓ 10 agents", botpenguin: "✓ Yes" },
  { capability: "No seat limit", autoniv: "✓ Always", intercom: "✗ Per seat", zendesk: "✗ Per agent", tidio: "Cap at 10 agents", freshchat: "✗ Per seat", botpenguin: "✓ Yes" },
  { capability: "WhatsApp-native", autoniv: "✓ From Starter", intercom: "Add-on only", zendesk: "Add-on only", tidio: "Add-on only", freshchat: "✓ Yes", botpenguin: "✓ Yes" },
  { capability: "India / INR pricing", autoniv: "✓ Native", intercom: "✗ USD only", zendesk: "✗ USD only", tidio: "✗ USD only", freshchat: "Partial", botpenguin: "✓ Yes" },
  { capability: "DPDP Act 2023", autoniv: "✓ Compliant", intercom: "✗ No", zendesk: "✗ No", tidio: "✗ No", freshchat: "Partial", botpenguin: "Partial" },
  { capability: "14-day free trial", autoniv: "✓ Yes", intercom: "✓ Yes", zendesk: "✓ Yes", tidio: "✓ Yes", freshchat: "✓ Yes", botpenguin: "7 days only" },
  { capability: "Self-serve signup", autoniv: "✓ Instant", intercom: "✓ Yes", zendesk: "✓ Yes", tidio: "✓ Yes", freshchat: "✓ Yes", botpenguin: "✓ Yes" },
  { capability: "Verdict", autoniv: "Best value", intercom: "Very expensive", zendesk: "Enterprise only", tidio: "Confusing billing", freshchat: "Seat-limited", botpenguin: "Narrow features" },
];

export const VOICE_ADDONS = [
  { id: 'performance-report',  icon: '📊', title: 'Monthly Performance Report',  price: '₹3,999–₹6,999 / month',         category: 'recurring', description: 'Branded PDF with call quality scores, script performance, A/B outcomes, and industry benchmarks.' },
  { id: 'ab-testing',          icon: '🧪', title: 'Script A/B Testing',          price: '₹8,999 / month',                  category: 'recurring', description: 'Run two scripts simultaneously. Analyze conversion rates and receive an optimized version monthly.' },
  { id: 'whatsapp-sequences',  icon: '💬', title: 'WhatsApp Follow-Up Sequences', price: '₹4,999 / month',                category: 'recurring', description: 'Automated post-call WhatsApp flows: reminders, no-show follow-ups, requalification messages.' },
  { id: 'regional-language',   icon: '🌐', title: 'Regional Language Agent',     price: '₹8,000 / month per language',     category: 'recurring', description: 'Hindi, Tamil, Telugu, Bengali — reach Tier 2/3 city leads in their native language.' },
  { id: 'reactivation',        icon: '🔁', title: 'Reactivation Campaigns',      price: '₹14,999 / campaign',              category: 'one-time',  description: 'We call your dormant lead database quarterly. New pipeline with zero new ad spend.' },
  { id: 'white-label',         icon: '🏷️', title: 'White-Label Reseller',         price: '₹49,999 setup + revenue share',   category: 'one-time',  description: 'Agencies and consultants: resell Autoniv under your brand with full support.' },
];

export const CHAT_ADDONS = [
  { id: "whatsapp-channel",    icon: "💬", title: "WhatsApp Channel",     price: "₹2,499/mo", category: "recurring", description: "Native WhatsApp Business API with template support." },
  { id: "advanced-analytics",  icon: "📊", title: "Advanced Analytics",   price: "₹1,499/mo", category: "recurring", description: "Funnel analysis, CSAT scores, and conversation heatmaps." },
  { id: "priority-support",    icon: "🎧", title: "Priority Support",     price: "₹4,999/mo", category: "recurring", description: "Dedicated Slack channel, 2-hour SLA, and onboarding specialist." },
];

export const testimonials = [
  { name: "Sarah Chen", role: "CEO, HealthFirst Clinic", quote: "Autoniv transformed our patient intake. We handle 3× more calls with the same staff. The AI books appointments and answers patient queries flawlessly.", initials: "SC", metric: "+40% leads", industry: "Healthcare", avatar: "#2563EB", photo: "https://i.pravatar.cc/150?img=32" },
  { name: "Marcus Johnson", role: "Director, BrightHome Services", quote: "The AI receptionist never sleeps. Our leads increased by 40% in the first month alone. It qualifies prospects before our team even wakes up.", initials: "MJ", metric: "3× capacity", industry: "Real Estate", avatar: "#10B981", photo: "https://i.pravatar.cc/150?img=11" },
  { name: "Emily Rodriguez", role: "VP Operations, FastTrack Auto", quote: "Setup was instant. The AI sounds so natural, customers don't know it's not human. Our call handling cost dropped by 60%.", initials: "ER", metric: "2min setup", industry: "Automotive", avatar: "#8b5cf6", photo: "https://i.pravatar.cc/150?img=5" },
  { name: "Rajesh Patel", role: "Founder, FinServe Capital", quote: "We replaced 3 full-time agents with Autoniv. The AI handles loan inquiries 24/7 and our conversion rate went up 35%.", initials: "RP", metric: "-60% costs", industry: "Finance", avatar: "#f59e0b", photo: "https://i.pravatar.cc/150?img=12" },
  { name: "Priya Sharma", role: "COO, EduLearn India", quote: "Admissions inquiries used to overwhelm our team. Now Autoniv handles 80% of them automatically. We enrolled 2× more students.", initials: "PS", metric: "2× enrollment", industry: "Education", avatar: "#ec4899", photo: "https://i.pravatar.cc/150?img=9" },
  { name: "James Wilson", role: "Head of CX, TravelHub", quote: "Our booking conversion jumped 55% after deploying Autoniv. Guests love the instant response — no more waiting on hold.", initials: "JW", metric: "+55% bookings", industry: "Travel", avatar: "#06b6d4", photo: "https://i.pravatar.cc/150?img=7" },
];

export const useCases = [
  {
    title: "Healthcare", icon: "🏥",
    chat: { desc: "Answer patient queries, schedule appointments, and handle intake via your website & WhatsApp.", features: ["Instant FAQ responses for patients", "Appointment booking via chat widget", "Prescription refill request handling", "Insurance pre-auth document collection"], outcomes: [{ label: "Response time", value: "< 10 sec" }, { label: "Patient satisfaction", value: "4.8/5" }, { label: "FAQ deflection", value: "75%" }], stat: "80% faster replies", cta: "Start Chat Trial" },
    voice: { desc: "Automate patient scheduling, prescription reminders, and follow-up calls with AI voice agents.", features: ["Automated patient appointment scheduling", "Prescription refill reminders via call", "Post-visit follow-up and satisfaction surveys", "Insurance pre-auth intake collection"], outcomes: [{ label: "No-show reduction", value: "60%" }, { label: "Calls handled/day", value: "500+" }, { label: "Avg handle time", value: "< 2 min" }], stat: "60% fewer no-shows", cta: "Start Voice Trial" },
  },
  {
    title: "Real Estate", icon: "🏠",
    chat: { desc: "Capture and qualify leads from your website, answer property queries, and schedule viewings via chat.", features: ["Instant lead qualification from property portals", "Property listing Q&A via chat", "Viewing slot booking & confirmation", "Automated follow-ups on inquiries"], outcomes: [{ label: "Lead capture rate", value: "4×" }, { label: "Response time", value: "< 5 sec" }, { label: "Viewing bookings", value: "+85%" }], stat: "4× more leads captured", cta: "Start Chat Trial" },
    voice: { desc: "Qualify leads, schedule viewings, and follow up on listings 24/7 with AI voice agents.", features: ["Instant lead qualification from property portals", "24/7 viewing slot booking & confirmation", "Automated follow-ups on expired listings", "Multi-language support for NRI buyers"], outcomes: [{ label: "Lead qualification rate", value: "3×" }, { label: "Response time", value: "< 5 sec" }, { label: "Viewing bookings", value: "+85%" }], stat: "3× more qualified leads", cta: "Start Voice Trial" },
  },
  {
    title: "Financial Services", icon: "🏦",
    chat: { desc: "Handle loan inquiries, payment reminders, and account support via secure chat.", features: ["Loan inquiry intake and pre-qualification", "EMI due-date reminders via chat", "KYC document collection automation", "Account support without agent involvement"], outcomes: [{ label: "Inquiry resolution", value: "92%" }, { label: "Response time", value: "< 10 sec" }, { label: "Document collection", value: "3× faster" }], stat: "60% cost reduction", cta: "Start Chat Trial" },
    voice: { desc: "Handle loan inquiries, payment reminders, and account support calls with AI voice agents.", features: ["Loan inquiry intake and pre-qualification", "EMI due-date reminders and payment nudges", "KYC document follow-up automation", "Account support without agent involvement"], outcomes: [{ label: "Cost reduction", value: "50%" }, { label: "Inquiry resolution", value: "92%" }, { label: "Collections rate", value: "+38%" }], stat: "50% cost reduction", cta: "Start Voice Trial" },
  },
  {
    title: "E-Commerce", icon: "🛒",
    chat: { desc: "Automate order inquiries, shipping updates, return requests, and post-purchase upsells via chat.", features: ["Order status and shipping inquiry handling", "Return and exchange request processing", "Post-purchase upsell and cross-sell", "Abandoned cart recovery via chat"], outcomes: [{ label: "Order resolution time", value: "40%" }, { label: "Cart recovery rate", value: "+25%" }, { label: "CSAT score", value: "4.8/5" }], stat: "40% faster resolution", cta: "Start Chat Trial" },
    voice: { desc: "Handle order inquiries, shipping updates, return requests, and post-purchase calls with voice AI.", features: ["Order status and shipping inquiry handling", "Return and exchange request processing", "Post-purchase upsell and cross-sell calls", "Abandoned cart recovery via voice"], outcomes: [{ label: "Cart recovery rate", value: "+35%" }, { label: "Avg order value", value: "+18%" }, { label: "Customer effort score", value: "Low" }], stat: "35% cart recovery", cta: "Start Voice Trial" },
  },
  {
    title: "Education", icon: "🎓",
    chat: { desc: "Handle admissions inquiries, course info, fee follow-ups, and student support via chat.", features: ["Admissions inquiry and course info", "Fee payment reminders and follow-ups", "Student support ticket intake", "Exam schedule and result status updates"], outcomes: [{ label: "Admin time saved", value: "70%" }, { label: "Enrollment conversion", value: "+45%" }, { label: "Response time", value: "< 10 sec" }], stat: "70% admin time saved", cta: "Start Chat Trial" },
    voice: { desc: "Handle admissions inquiries, course info, fee follow-ups, and student support calls with voice AI.", features: ["Admissions inquiry and course info calls", "Fee payment reminders and follow-ups", "Student support ticket intake", "Exam schedule and result status updates"], outcomes: [{ label: "Inquiry-to-enrollment", value: "+45%" }, { label: "Peak call handling", value: "500+/day" }, { label: "Staff workload", value: "-70%" }], stat: "70% admin time saved", cta: "Start Voice Trial" },
  },
  {
    title: "Travel & Hospitality", icon: "🏨",
    chat: { desc: "Manage booking inquiries, reservation changes, concierge requests, and check-in via chat.", features: ["Booking inquiry and reservation management", "Modification and cancellation handling", "Concierge request intake", "Check-in reminders and post-stay follow-up"], outcomes: [{ label: "Booking conversion", value: "+55%" }, { label: "Inquiry response", value: "< 5 sec" }, { label: "Guest satisfaction", value: "4.7/5" }], stat: "55% more bookings", cta: "Start Chat Trial" },
    voice: { desc: "Manage booking inquiries, reservation changes, concierge requests, and check-in calls with voice AI.", features: ["Booking inquiry and reservation management", "Modification and cancellation handling", "Concierge request intake for guests", "Check-in reminders and post-stay follow-up"], outcomes: [{ label: "Booking conversion", value: "+55%" }, { label: "Inquiry response", value: "< 5 sec" }, { label: "Guest satisfaction", value: "4.7/5" }], stat: "55% more bookings", cta: "Start Voice Trial" },
  },
];

export const integrationsRow1 = [
  { name: "Azure", icon: "☁️" }, { name: "Gemini", icon: "💎" }, { name: "Anthropic", icon: "🧠" }, { name: "Groq", icon: "⚡" },
  { name: "Cartesia", icon: "🎙️" }, { name: "Make", icon: "🔄" }, { name: "n8n", icon: "🔗" }, { name: "Google Calendar", icon: "📅" },
];

export const integrationsRow2 = [
  { name: "WhatsApp", icon: "💬" }, { name: "Discord", icon: "💜" }, { name: "Instagram", icon: "📸" }, { name: "Facebook", icon: "👤" },
  { name: "Telegram", icon: "✈️" }, { name: "Google Docs", icon: "📄" }, { name: "Microsoft", icon: "🪟" }, { name: "Twilio", icon: "📞" },
];

export const CONVERSATION = [
  { role: "user", text: "Hi, I'd like to book an appointment", delay: 800 },
  { role: "agent", text: "Of course! What day works best for you?", delay: 2400 },
  { role: "user", text: "Next Tuesday around 2 PM if possible", delay: 4200 },
  { role: "agent", text: "Tuesday 2 PM is available — shall I confirm?", delay: 5900 },
  { role: "user", text: "Yes please!", delay: 7600 },
  { role: "agent", text: "Done! You're booked. See you Tuesday ✓", delay: 9100 },
];

export const PARTICLE_FIELD = Array.from({ length: 45 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rand = seed / 233280;
  const x = (i / 45) * 100;
  const distFromCenter = Math.abs(x - 50) / 50;
  const density = Math.max(0.15, 1 - distFromCenter * 0.7);
  return { x, y: (rand - 0.5) * 1.3, size: 1.3 + rand * 1.7, opacity: density * (0.3 + rand * 0.5), delay: rand * 3.5 };
});
