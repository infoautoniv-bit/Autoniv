import { Fragment, useRef, useState, memo, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion, useInView } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const services = [
  {
    id: "voice",
    icon: "📞",
    tag: "VOICE AI",
    title: "AI Voice Agents",
    subtitle:
      "Human-like agents that pick up every call, qualify leads, and book appointments — without a single dropped conversation.",
    accent: "#10B981",
    accentDim: "rgba(16,185,129,0.08)",
    accentBorder: "rgba(16,185,129,0.25)",
    glow: "rgba(16,185,129,0.18)",
    features: [
      "Inbound & Outbound Calls",
      "Natural Conversation Flow",
      "Appointment Booking",
      "Call Summary in CRM",
    ],
    stat: { value: "99.3%", label: "Answer Rate" },
    details: {
      description:
        "Our AI Voice Agents use advanced natural language processing to handle calls with human-like fluency. They understand context, handle interruptions, and adapt tone based on the conversation — making every caller feel like they're speaking to a trained professional.",
      howItWorks: [
        "Agent answers incoming calls 24/7 with zero hold time",
        "Qualifies leads by asking smart, dynamic questions",
        "Books appointments directly into your calendar",
        "Logs full call summary and transcript into your CRM",
      ],
      useCases: [
        "Real estate firms handling high call volumes",
        "Healthcare clinics managing patient appointments",
        "SaaS companies qualifying inbound trial signups",
        "E-commerce order confirmations and support",
      ],
      integrations: ["HubSpot", "Salesforce", "Google Calendar", "Zapier", "Twilio"],
    },
  },
  {
    id: "chat",
    icon: "💬",
    tag: "MESSAGING",
    title: "AI Chatbot",
    subtitle:
      "Deploy smart chatbots across your website, WhatsApp, Facebook & Instagram. Capture leads and support customers around the clock.",
    accent: "#3B82F6",
    accentDim: "rgba(59,130,246,0.08)",
    accentBorder: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.18)",
    features: [
      "Multi-platform Support",
      "Lead Capture & Qualification",
      "Instant Responses",
      "Human Handover",
    ],
    stat: { value: "4× faster", label: "Response Time" },
    details: {
      description:
        "Deploy a single AI chatbot that works across your website, WhatsApp, Facebook Messenger, and Instagram DMs. It captures leads, answers FAQs, and routes complex queries to your team — all from one unified inbox.",
      howItWorks: [
        "Widget installs on your site in under 5 minutes",
        "Connects to WhatsApp Business API, FB & IG pages",
        "AI learns from your docs, FAQs, and past conversations",
        "Seamless handover to human agents when needed",
      ],
      useCases: [
        "SaaS onboarding and feature education",
        "E-commerce product recommendations and order tracking",
        "Service businesses answering pricing and availability",
        "Agencies qualifying leads before demo calls",
      ],
      integrations: ["WhatsApp Business", "Facebook Messenger", "Instagram DMs", "Slack", "Zendesk"],
    },
  },
  {
    id: "crm",
    icon: "🔄",
    tag: "AUTOMATION",
    title: "CRM Automation",
    subtitle:
      "Automate workflows, follow-ups, and pipeline management. Plugs directly into your existing CRM without ripping it apart.",
    accent: "#8B5CF6",
    accentDim: "rgba(139,92,246,0.08)",
    accentBorder: "rgba(139,92,246,0.25)",
    glow: "rgba(139,92,246,0.18)",
    features: [
      "Lead Management",
      "Automated Follow-ups",
      "Pipeline Management",
      "Reports & Analytics",
    ],
    stat: { value: "60%", label: "Less Manual Work" },
    details: {
      description:
        "Eliminate repetitive tasks and keep your pipeline moving. Our CRM Automation module syncs data across your tools, triggers follow-up sequences, and gives your team a real-time view of every deal — without manual data entry.",
      howItWorks: [
        "Syncs leads and contacts across all connected tools",
        "Auto-triggers follow-up emails, calls, or tasks based on activity",
        "Updates deal stages as prospects move through your funnel",
        "Generates pipeline reports with conversion insights",
      ],
      useCases: [
        "Sales teams automating follow-up sequences",
        "Marketing ops syncing leads from ads to CRM",
        "Customer success teams tracking renewal timelines",
        "Founders who need a hands-off sales pipeline",
      ],
      integrations: ["HubSpot", "Salesforce", "Pipedrive", "Zapier", "Make"],
    },
  },
  {
    id: "booking",
    icon: "📅",
    tag: "SCHEDULING",
    title: "Smart Appointment Booking",
    subtitle:
      "AI books directly into Google Calendar, Outlook, or Calendly — no back-and-forth emails, no missed slots.",
    accent: "#06B6D4",
    accentDim: "rgba(6,182,212,0.08)",
    accentBorder: "rgba(6,182,212,0.25)",
    glow: "rgba(6,182,212,0.18)",
    features: [
      "Google Calendar Sync",
      "Outlook & Calendly",
      "Auto Reminders",
      "Rescheduling Flows",
    ],
    stat: { value: "3× more", label: "Bookings/Day" },
    details: {
      description:
        "Let AI handle the scheduling headache. Smart Appointment Booking checks real-time availability across your calendars, finds the perfect slot, and sends confirmations — so you never double-book or miss a meeting.",
      howItWorks: [
        "Connects to Google Calendar, Outlook, and Calendly",
        "Checks real-time availability before suggesting slots",
        "Sends booking confirmations and calendar invites instantly",
        "Handles rescheduling and cancellations with zero friction",
      ],
      useCases: [
        "Consultants managing client discovery calls",
        "Healthcare providers scheduling patient visits",
        "Agencies booking demo calls with prospects",
        "Event organizers managing speaker and attendee slots",
      ],
      integrations: ["Google Calendar", "Outlook", "Calendly", "Microsoft Teams", "Zoom"],
    },
  },
  {
    id: "analytics",
    icon: "📊",
    tag: "INSIGHTS",
    title: "Analytics & Reporting",
    subtitle:
      "Real-time dashboards with call transcripts, sentiment scores, and conversion metrics so you always know what's working.",
    accent: "#F59E0B",
    accentDim: "rgba(245,158,11,0.08)",
    accentBorder: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.18)",
    features: [
      "Call Transcripts",
      "Sentiment Scores",
      "Conversion Metrics",
      "Custom Reports",
    ],
    stat: { value: "2.4×", label: "ROI Average" },
    details: {
      description:
        "Turn every conversation into actionable intelligence. Our Analytics module provides real-time dashboards with call transcripts, sentiment analysis, conversion tracking, and custom reports — so you always know what's working and what needs improvement.",
      howItWorks: [
        "Auto-transcribes every call and chat with 98%+ accuracy",
        "Scores sentiment (positive, neutral, negative) per conversation",
        "Tracks conversions from first touch to closed deal",
        "Generates custom reports filtered by agent, date, or campaign",
      ],
      useCases: [
        "Sales managers coaching reps with call transcripts",
        "Marketing teams measuring campaign ROI",
        "CX leaders tracking customer satisfaction trends",
        "Executives getting real-time business health dashboards",
      ],
      integrations: ["Google Looker Studio", "Power BI", "Tableau", "Slack", "Email Reports"],
    },
  },
  {
    id: "language",
    icon: "🌍",
    tag: "MULTILINGUAL",
    title: "Multi-Language Support",
    subtitle:
      "Deploy agents in Hindi, Tamil, Telugu, Bengali and 17 more — with region-appropriate accents and cultural context baked in.",
    accent: "#EC4899",
    accentDim: "rgba(236,72,153,0.08)",
    accentBorder: "rgba(236,72,153,0.25)",
    glow: "rgba(236,72,153,0.18)",
    features: [
      "20+ Languages",
      "Regional Accents",
      "Script Adaptation",
      "Cultural Context",
    ],
    stat: { value: "20+", label: "Languages" },
    details: {
      description:
        "Break the language barrier with AI agents that speak your customers' language — literally. Deploy agents in 20+ Indian and global languages with region-appropriate accents, script rendering, and cultural context baked in for natural conversations.",
      howItWorks: [
        "Select target languages from the dashboard in one click",
        "AI auto-detects caller language and switches seamlessly",
        "Regional accents and tone adapt to local norms",
        "Supports Devanagari, Tamil, Bengali, and Latin scripts",
      ],
      useCases: [
        "National brands serving multi-state customer bases",
        "Government and healthcare agencies serving diverse populations",
        "E-commerce platforms handling regional customer queries",
        "EdTech companies delivering multilingual support",
      ],
      integrations: ["Voice AI Agent", "AI Chatbot", "WhatsApp", "SMS Gateway", "IVR Systems"],
    },
  },
];

const trustItems = [
  { icon: "🛡️", label: "Secure & Compliant", desc: "Enterprise-grade security" },
  { icon: "⚡", label: "Go Live in Days", desc: "No lengthy onboarding" },
  { icon: "🔗", label: "Easy Integrations", desc: "Works with your stack" },
  { icon: "🎧", label: "24/7 Support", desc: "Always here to help" },
];

const MODULE_STATS = [
  { v: "6", l: "Modules" },
  { v: "20+", l: "Languages" },
  { v: "99.9%", l: "Uptime SLA" },
  { v: "$0", l: "Setup Fees" },
] as const;

// ─── Animation variants ─────────────────────────────────────────────────────

const easeOut = [0.22, 1, 0.36, 1] as const;

const cardContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeOut },
  },
};

const featureListVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const featureItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOut } },
};

const modalListVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const modalItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeOut } },
};

// ─── Mini sparkline SVG per service (animated draw-in) ──────────────────────

const SPARKLINE_POINTS = [
  [0, 40], [16, 32], [32, 36], [48, 22], [64, 28], [80, 14], [96, 18], [112, 8],
] as const;
const SPARKLINE_PTS = SPARKLINE_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
const SPARKLINE_FILL = [...SPARKLINE_POINTS, [112, 48], [0, 48]].map(([x, y]) => `${x},${y}`).join(" ");

const Sparkline = memo(function Sparkline({ accent }: { accent: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <svg
      ref={ref}
      viewBox="0 0 112 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <motion.polyline
        points={SPARKLINE_FILL}
        fill={accent}
        fillOpacity="0.08"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      <motion.polyline
        points={SPARKLINE_PTS}
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.1, ease: easeOut, delay: 0.15 }}
      />
      <motion.circle
        cx="112"
        cy="8"
        r="3.5"
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.2, ease: "backOut" }}
      />
      <motion.circle
        cx="112"
        cy="8"
        r="3.5"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        initial={{ scale: 1, opacity: 0 }}
        animate={inView ? { scale: [1, 2.4], opacity: [0.6, 0] } : {}}
        transition={{ duration: 1.6, delay: 1.3, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
});

// ─── Service Detail Dialog ─────────────────────────────────────────────────────

const ServiceDetailDialog = memo(function ServiceDetailDialog({
  service,
  onClose,
  openAuth,
}: {
  service: (typeof services)[0] | null;
  onClose: () => void;
  openAuth?: (mode: 'login' | 'register') => void;
}) {
  if (!service) return null;
  const s = service;
  const d = s.details;

  return (
    <Transition appear show={!!service} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-[0.97] translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-[0.97] translate-y-4"
            >
              <Dialog.Panel
                className="w-full max-w-2xl transform overflow-hidden rounded-2xl transition-all relative"
                style={{
                  background: "linear-gradient(170deg, #0c1222 0%, #060a14 40%, #080e18 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
                }}
              >
                {/* Ambient glow */}
                <motion.div
                  className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-40"
                  style={{ background: `radial-gradient(circle, ${s.glow}, transparent 70%)` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.55, 0.4] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Header */}
                <div
                  className="flex items-center justify-between p-6 relative z-10"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: easeOut }}
                  >
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: s.accentDim, border: `1px solid ${s.accentBorder}` }}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.45, ease: "backOut", delay: 0.05 }}
                    >
                      {s.icon}
                    </motion.div>
                    <div>
                      <Dialog.Title className="text-lg font-bold text-white/90">
                        {s.title}
                      </Dialog.Title>
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: s.accent }}
                      >
                        {s.tag}
                      </span>
                    </div>
                  </motion.div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.2 }}
                    className="p-1.5 rounded-lg
                               text-white/30 hover:text-white/80
                               bg-white/[0.03] hover:bg-white/[0.06]
                               border border-white/[0.06] hover:border-white/[0.12]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Body */}
                <motion.div
                  className="p-6 max-h-[70vh] overflow-y-auto relative z-10 custom-scrollbar space-y-6"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
                >
                  {/* Description */}
                  <motion.p
                    variants={modalItemVariants}
                    className="text-slate-300 text-sm leading-relaxed"
                  >
                    {d.description}
                  </motion.p>

                  {/* Stat */}
                  <motion.div
                    variants={modalItemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: s.accentDim, border: `1px solid ${s.accentBorder}` }}
                  >
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
                      className="text-2xl font-extrabold"
                      style={{ color: s.accent, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.stat.value}
                    </motion.span>
                    <span className="text-sm text-slate-400">{s.stat.label}</span>
                  </motion.div>

                  {/* How It Works */}
                  <motion.div variants={modalItemVariants}>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: s.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      How It Works
                    </h4>
                    <motion.ul
                      variants={modalListVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-2.5"
                    >
                      {d.howItWorks.map((step, i) => (
                        <motion.li
                          key={i}
                          variants={modalItemVariants}
                          className="flex items-start gap-3 text-sm text-slate-300"
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                            style={{ background: s.accentDim, border: `1px solid ${s.accentBorder}`, color: s.accent }}
                          >
                            {i + 1}
                          </span>
                          {step}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  {/* Use Cases */}
                  <motion.div variants={modalItemVariants}>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: s.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Use Cases
                    </h4>
                    <motion.ul
                      variants={modalListVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-2"
                    >
                      {d.useCases.map((uc, i) => (
                        <motion.li
                          key={i}
                          variants={modalItemVariants}
                          className="flex items-center gap-2.5 text-sm text-slate-300"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: s.accent }}
                          />
                          {uc}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  {/* Integrations */}
                  <motion.div variants={modalItemVariants}>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: s.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Integrations
                    </h4>
                    <motion.div
                      variants={modalListVariants}
                      initial="hidden"
                      animate="show"
                      className="flex flex-wrap gap-2"
                    >
                      {d.integrations.map((intg, i) => (
                        <motion.span
                          key={i}
                          variants={modalItemVariants}
                          whileHover={{ scale: 1.06, y: -2 }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-default"
                          style={{
                            background: s.accentDim,
                            border: `1px solid ${s.accentBorder}`,
                            color: s.accent,
                          }}
                        >
                          {intg}
                        </motion.span>
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Footer */}
                <div
                  className="flex justify-end gap-3 p-6 relative z-10"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <motion.button
                    onClick={() => {
                      onClose();
                      openAuth?.('login');
                    }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer border-none"
                    style={{
                      background: `linear-gradient(135deg, ${s.accent}, ${s.accent}dd)`,
                      boxShadow: `0 8px 24px -6px ${s.glow}`,
                    }}
                  >
                    Get Started
                  </motion.button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});

// ─── Service Card ─────────────────────────────────────────────────────────────

const ServiceCard = memo(function ServiceCard({
  s,
  isPrimary = false,
  onLearnMore,
}: {
  s: (typeof services)[0];
  isPrimary?: boolean;
  onLearnMore: (service: (typeof services)[0]) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (isPrimary) {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        whileHover={{ y: -10, transition: { duration: 0.25, ease: easeOut } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex flex-col rounded-3xl cursor-default overflow-hidden p-8"
        style={{
          willChange: "transform",
          background: hovered
            ? "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
          border: `1.5px solid ${hovered ? s.accent : s.accentBorder}`,
          boxShadow: hovered
            ? `0 24px 60px -12px ${s.glow}, inset 0 0 16px 1px rgba(255,255,255,0.03)`
            : `0 8px 30px -10px ${s.glow}, inset 0 0 12px 1px rgba(255,255,255,0.02)`,
          transition: "border 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        {/* Glow indicator */}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${s.accent}, transparent 60%)`,
          }}
        />

        {/* Top ambient glow strip */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)`,
          }}
        />

        {/* Subtle moving sheen on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 30%, ${s.glow} 50%, transparent 70%)`,
          }}
          initial={{ x: "-120%" }}
          animate={hovered ? { x: "120%" } : { x: "-120%" }}
          transition={{ duration: 0.9, ease: easeOut }}
        />

        {/* Header row */}
        <div className="flex items-start justify-between pb-6">
          {/* Icon pill */}
          <motion.div
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
            style={{
              background: s.accentDim,
              border: `1px solid ${s.accentBorder}`,
            }}
            animate={hovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            <motion.span
              className="text-xl leading-none"
              animate={hovered ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1.2, 1.1, 1] } : { rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: easeOut }}
            >
              {s.icon}
            </motion.span>
            <span
              className="text-xs font-black tracking-widest"
              style={{ color: s.accent }}
            >
              {s.tag}
            </span>
          </motion.div>

          {/* Stat badge */}
          <div className="text-right">
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
              className="text-2xl font-extrabold leading-none tracking-tight"
              style={{ color: s.accent, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {s.stat.value}
            </motion.p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wider uppercase">{s.stat.label}</p>
          </div>
        </div>

        {/* Sparkline strip */}
        <div className="h-14 mb-6">
          <Sparkline accent={s.accent} />
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-white font-black text-2xl mb-3 leading-snug tracking-tight">{s.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{s.subtitle}</p>

          {/* Feature list */}
          <motion.ul
            variants={featureListVariants}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="space-y-3.5 mb-8 flex-1"
          >
            {s.features.map((f, j) => (
              <motion.li
                key={j}
                variants={featureItemVariants}
                className="flex items-center gap-3 text-sm text-slate-200 font-medium"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: s.accentDim, border: `1px solid ${s.accentBorder}` }}
                >
                  <motion.svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + j * 0.06 }}
                  >
                    <motion.path
                      d="M2 6l3 3 5-5"
                      stroke={s.accent}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </span>
                {f}
              </motion.li>
            ))}
          </motion.ul>

          {/* CTA */}
          <motion.button
            onClick={() => onLearnMore(s)}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mb-2 border-none cursor-pointer transition-all duration-350"
            style={{
              background: `linear-gradient(135deg, ${s.accent}, ${s.accent}dd)`,
              color: "#ffffff",
              boxShadow: `0 10px 30px -8px ${s.glow}`,
            }}
          >
            Learn More & Get Started
            <motion.svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              animate={hovered ? { x: 4 } : { x: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </motion.svg>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Secondary Card Layout (Cleaner, smaller, and without the highlighting)
  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: easeOut } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col rounded-2xl cursor-default overflow-hidden p-5"
      style={{
        willChange: "transform",
        background: hovered
          ? "rgba(255,255,255,0.035)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
        boxShadow: hovered ? "0 12px 28px rgba(0,0,0,0.4)" : "none",
        transition: "border 0.25s ease, background 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between pb-3">
        {/* Icon only */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {s.icon}
        </div>

        {/* Small Stat display */}
        <div className="text-right">
          <p
            className="text-sm font-extrabold leading-none text-slate-350"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {s.stat.value}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 font-medium">{s.stat.label}</p>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col">
        <h4 className="text-white font-bold text-sm mb-1.5 group-hover:text-white transition-colors">{s.title}</h4>
        <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">{s.subtitle}</p>

        {/* Muted Text Link CTA */}
        <button
          onClick={() => onLearnMore(s)}
          className="text-left text-xs font-bold flex items-center gap-1.5 border-none bg-transparent cursor-pointer transition-colors"
          style={{
            color: hovered ? s.accent : "rgba(255,255,255,0.45)",
          }}
        >
          Details
          <svg
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
});

const VoiceAgentShowcase = memo(function VoiceAgentShowcase() {
  const handleContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="py-16 sm:py-20 relative overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.01] my-8">
      {/* Decorative backdrop grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.02) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ── Left Column: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="space-y-6 text-left"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border"
              style={{
                borderColor: "rgba(16,185,129,0.25)",
                color: "#10B981",
                background: "rgba(16,185,129,0.05)"
              }}
            >
              Voice AI Agent
            </span>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Cut Costs, <span className="gradient-text">Stay Compliant.</span>
            </h3>

            <p className="text-slate-350 text-base sm:text-lg leading-relaxed max-w-xl">
              Deploy AI voice agents that automate calls, answer questions, schedule
              appointments, and manage conversations end-to-end.
            </p>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Fully compliant with enterprise standards and deployable on-premise or in the
              cloud. We support any integration, so your agents fit seamlessly into your
              existing tech stack.
            </p>

            <div className="pt-2">
              <motion.button
                onClick={handleContact}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-full font-bold text-white text-sm border-none cursor-pointer shadow-lg shadow-emerald-500/20"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
              >
                Contact Us
              </motion.button>
            </div>
          </motion.div>

          {/* ── Right Column: Visual Showcase ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="relative w-full h-[360px] sm:h-[420px] bg-white/[0.02] rounded-3xl border border-white/[0.06] shadow-sm flex items-center justify-center overflow-hidden"
          >
            {/* Blurry nodes pattern in background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none filter blur-[1px]">
              {/* Voice Agents node */}
              <div className="absolute top-[20%] left-[8%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Voice Agents
              </div>
              {/* Consultant node */}
              <div className="absolute top-[15%] right-[10%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Consultant
              </div>
              {/* Phone icon node */}
              <div className="absolute top-[35%] left-[25%] bg-white/[0.04] border border-white/[0.08] w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-slate-200">
                📞
              </div>
              {/* Heart icon node */}
              <div className="absolute top-[40%] left-[10%] bg-white/[0.04] border border-white/[0.08] w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-slate-200">
                ❤️
              </div>
              {/* Information node */}
              <div className="absolute top-[42%] right-[15%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Information
              </div>
              {/* Conversations node */}
              <div className="absolute bottom-[40%] left-[5%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Conversations
              </div>
              {/* Client icon node */}
              <div className="absolute bottom-[38%] right-[8%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Client
              </div>
              {/* Consultant node 2 */}
              <div className="absolute bottom-[22%] left-[45%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Consultant
              </div>
              {/* Calls node */}
              <div className="absolute bottom-[12%] left-[20%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Calls
              </div>
              {/* Mail icon node */}
              <div className="absolute bottom-[10%] right-[32%] bg-white/[0.04] border border-white/[0.08] w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-slate-200">
                ✉️
              </div>
              {/* Sales node */}
              <div className="absolute bottom-[12%] right-[12%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Sales
              </div>
            </div>

            {/* Glowing Center Call Square */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-28 h-28 rounded-3xl shadow-xl flex items-center justify-center z-10 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #2563EB, #10B981)",
                boxShadow: "0 20px 40px -10px rgba(16,185,129,0.4)"
              }}
            >
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400/30 animate-pulse pointer-events-none" />

              {/* Animating audio wave pulses */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-full h-full rounded-3xl border-2 border-emerald-300 pointer-events-none"
              />

              {/* Phone Icon */}
              <svg
                className="w-12 h-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                <path d="M14.05 2a9 9 0 0 1 7.95 7.95" strokeDasharray="2 2" />
                <path d="M14.05 6A5 5 0 0 1 18 10" />
              </svg>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </div>
  );
});

const ChatAgentShowcase = memo(function ChatAgentShowcase() {
  const handleContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="py-16 sm:py-20 relative overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.01] my-8">
      {/* Decorative backdrop grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.02) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ── Left Column: Visual Showcase (Alternating!) ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="relative w-full h-[360px] sm:h-[420px] bg-white/[0.02] rounded-3xl border border-white/[0.06] shadow-sm flex items-center justify-center overflow-hidden lg:order-1 order-2"
          >
            {/* Blurry nodes pattern in background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none filter blur-[1px]">
              {/* WhatsApp node */}
              <div className="absolute top-[20%] left-[8%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                WhatsApp API
              </div>
              {/* Widget node */}
              <div className="absolute top-[15%] right-[10%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Web Widget
              </div>
              {/* Chat bubble icon node */}
              <div className="absolute top-[35%] left-[25%] bg-white/[0.04] border border-white/[0.08] w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-slate-200">
                💬
              </div>
              {/* Checkmark icon node */}
              <div className="absolute top-[40%] left-[10%] bg-white/[0.04] border border-white/[0.08] w-8 h-8 rounded-full flex items-center justify-center shadow-sm text-slate-200">
                ✓
              </div>
              {/* FAQ node */}
              <div className="absolute top-[42%] right-[15%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Knowledge Base
              </div>
              {/* Lead captured node */}
              <div className="absolute bottom-[40%] left-[5%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Lead Captured
              </div>
              {/* Support node */}
              <div className="absolute bottom-[38%] right-[8%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                24/7 Support
              </div>
              {/* Inbox node */}
              <div className="absolute bottom-[22%] left-[45%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Shared Inbox
              </div>
              {/* Facebook node */}
              <div className="absolute bottom-[12%] left-[20%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Messenger
              </div>
              {/* Instagram node */}
              <div className="absolute bottom-[12%] right-[12%] bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-200">
                Instagram DMs
              </div>
            </div>

            {/* Glowing Center Chat Square */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-28 h-28 rounded-3xl shadow-xl flex items-center justify-center z-10 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #10B981, #2563EB)",
                boxShadow: "0 20px 40px -10px rgba(37,99,235,0.4)"
              }}
            >
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/30 animate-pulse pointer-events-none" />

              {/* Animating audio wave pulses */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-full h-full rounded-3xl border-2 border-blue-300 pointer-events-none"
              />

              {/* Chat Icon */}
              <svg
                className="w-12 h-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
          </motion.div>

          {/* ── Right Column: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="space-y-6 text-left lg:order-2 order-1"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border"
              style={{
                borderColor: "rgba(37,99,235,0.25)",
                color: "#2563EB",
                background: "rgba(37,99,235,0.05)"
              }}
            >
              Chat AI Agent
            </span>

            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Engage 24/7, <span className="gradient-text">Capture Leads.</span>
            </h3>

            <p className="text-slate-350 text-base sm:text-lg leading-relaxed max-w-xl">
              Deploy smart chat agents across your website, WhatsApp, and social media
              channels. Automate customer support and resolve FAQs in milliseconds.
            </p>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Qualify prospects with interactive questionnaires, collect documents, and route
              complex support queries to live agents seamlessly using our shared inbox.
            </p>

            <div className="pt-2">
              <motion.button
                onClick={handleContact}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-full font-bold text-white text-sm border-none cursor-pointer shadow-lg shadow-blue-500/20"
                style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
              >
                Contact Us
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
});

// ─── Main Section ─────────────────────────────────────────────────────────────

export function Services({ openAuth }: { openAuth?: (mode: 'login' | 'register') => void }) {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const [selectedService, setSelectedService] = useState<(typeof services)[0] | null>(null);
  const gridRef = useRef(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-100px" });

  const primaryServices = services.filter((s) => s.id === "voice" || s.id === "chat");
  const secondaryServices = services.filter((s) => s.id !== "voice" && s.id !== "chat");

  return (
    <section
      id="services"
      className="relative overflow-hidden section-box"
      style={{ background: "#050d1a" }}
    >
      {/* Ambient blobs (slow drifting animation) */}
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)",
        }}
        animate={{ x: ["-50%", "-46%", "-50%"], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)",
        }}
        animate={{ y: [0, -30, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">

        {/* ── Header ── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: easeOut }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={headerInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
            style={{
              background: "rgba(37,99,235,0.06)",
              border: "1px solid rgba(37,99,235,0.12)",
              color: "var(--primary-blue)",
            }}
          >
            <svg
              width="6"
              height="6"
              viewBox="0 0 6 6"
              className="animate-pulse"
            >
              <circle cx="3" cy="3" r="3" fill="#64ddff" />
            </svg>
            OUR SERVICES
          </motion.span>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-white mb-4">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 16 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
            >
              Everything your business needs
            </motion.span>
            <br />
            <motion.span
              className="gradient-text inline-block"
              initial={{ opacity: 0, y: 16 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.22, ease: easeOut }}
            >
              to run on autopilot.
            </motion.span>
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed"
          >
            Two core AI communication agents supported by native integration modules — deploy
            what you need, scale when you're ready.
          </motion.p>

          {/* Module count strip */}
          <motion.div
            className="flex items-center justify-center gap-6 mt-8"
            initial="hidden"
            animate={headerInView ? "show" : "hidden"}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}
          >
            {MODULE_STATS.map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.9 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "backOut" } },
                }}
                whileHover={{ y: -3 }}
              >
                <p
                  className="text-xl font-extrabold leading-none"
                  style={{
                    color: "#64ddff",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {item.v}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium tracking-wide">
                  {item.l}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Primary Services Grid ── */}
        <motion.div
          ref={gridRef}
          variants={cardContainerVariants}
          initial="hidden"
          animate={gridInView ? "show" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >
          {primaryServices.map((s) => (
            <ServiceCard key={s.id} s={s} isPrimary={true} onLearnMore={setSelectedService} />
          ))}
        </motion.div>

        {/* ── Voice & Chat Detailed Showcases ── */}
        <VoiceAgentShowcase />
        <ChatAgentShowcase />

        {/* ── Secondary Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="text-center mt-20 mb-10"
        >
          <h3 className="text-xl sm:text-2xl font-bold text-slate-350 tracking-tight">
            Supporting Capabilities & Integrations
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Complementary features built natively into our AI platform to automate your bookings, analytics, and CRM.
          </p>
        </motion.div>

        {/* ── Secondary Services Grid ── */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16"
        >
          {secondaryServices.map((s) => (
            <ServiceCard key={s.id} s={s} isPrimary={false} onLearnMore={setSelectedService} />
          ))}
        </motion.div>

        {/* ── Service Detail Dialog ── */}
        <ServiceDetailDialog
          service={selectedService}
          onClose={() => setSelectedService(null)}
          openAuth={openAuth}
        />

        {/* ── Trust Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: easeOut }}
          className="rounded-2xl px-6 sm:px-10 py-6 mt-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(100,221,255,0.04) 0%, rgba(52,211,153,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {trustItems.map((t, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
                }}
                whileHover={{ y: -3 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    background: "rgba(100,221,255,0.08)",
                    border: "1px solid rgba(100,221,255,0.15)",
                  }}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  {t.icon}
                </motion.div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm leading-tight">
                    {t.label}
                  </p>
                  <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer line */}
        <div className="flex flex-col items-center gap-3 mt-7">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-xs text-slate-600"
          >
            All Services
          </motion.p>
          <motion.a
            href="/services"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all duration-300 no-underline"
            style={{
              background: "linear-gradient(135deg, #2563EB, #10B981)",
              boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.25)";
            }}
          >
            View Services
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.a>
        </div>
      </div>
    </section>
  );
}