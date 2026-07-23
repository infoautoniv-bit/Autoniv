import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import rajneshYadav from '../../assets/rajnesh-yadav-founder-ceo.webp';

interface PressRelease {
  id: string;
  date: string;
  category: string;
  title: string;
  summary: string;
  location: string;
  fullBody: {
    dateline: string;
    paragraphs: string[];
    quote?: { text: string; author: string; title: string };
    boilerplate: string;
  };
}

const PRESS_RELEASES: PressRelease[] = [
  {
    id: 'pr-white-label-launch',
    date: 'July 15, 2026',
    category: 'Product Announcement',
    location: 'NEW DELHI & SAN FRANCISCO',
    title: 'Autoniv Launches Enterprise White-Label & Custom CNAME Domain Suite for AI Voice Platforms',
    summary: 'Agencies and enterprise resellers can now deploy fully branded AI voice agents and custom call dialers under their own domain and logo with zero platform branding.',
    fullBody: {
      dateline: 'NEW DELHI & SAN FRANCISCO — July 15, 2026',
      paragraphs: [
        'Autoniv, a global leader in autonomous conversational AI technology, today announced the official release of its Enterprise White-Label and Custom Branding Suite.',
        'The new feature allows enterprise clients, digital agencies, and SaaS resellers to deploy 24/7 AI voice agents and omnichannel chatbots completely rebranded under their own corporate identity, custom logo, custom favicon, support email, and CNAME domain mapping (e.g. ai.yourcompany.com).',
        'In addition to total branding removal, the White-Label suite unlocks custom voice fine-tuning, dedicated API webhooks, and sub-account management tools.',
      ],
      quote: {
        text: 'Our agency partners wanted to offer state-of-the-art voice AI under their own brand without engineering a backend from scratch. Today, we give them complete ownership of the experience.',
        author: 'Rajnesh Yadav',
        title: 'Founder & CEO, Autoniv',
      },
      boilerplate: 'Autoniv is an omnichannel conversational AI platform powering intelligent voice agents and chatbots in 20+ languages for enterprise sales, healthcare, real estate, and customer support.',
    },
  },
  {
    id: 'pr-1000-deployments',
    date: 'June 28, 2026',
    category: 'Company Milestone',
    location: 'NEW DELHI',
    title: 'Autoniv Surpasses 1,000 Active Business Deployments Across Real Estate & Healthcare',
    summary: 'Platform reaches landmark growth milestone, processing over 2.5 million minutes of AI voice conversations and automated appointment bookings.',
    fullBody: {
      dateline: 'NEW DELHI — June 28, 2026',
      paragraphs: [
        'Autoniv today announced it has crossed 1,000 active corporate deployments globally across high-touch verticals including real estate agencies, healthcare clinics, e-commerce brands, and financial services.',
        'Over the past quarter, Autoniv AI voice agents handled more than 2.5 million conversation minutes with an average round-trip audio latency under 300ms, achieving a 98% call resolution score.',
      ],
      quote: {
        text: 'Crossing 1,000 active business deployments validates our commitment to delivering zero-latency, human-sounding voice automation that drives measurable ROI.',
        author: 'Rajnesh Yadav',
        title: 'Founder & CEO, Autoniv',
      },
      boilerplate: 'Autoniv provides 24/7 AI assistance for businesses with AI voice agents and chatbots supporting customer calls, sales qualification, and scheduling.',
    },
  },
  {
    id: 'pr-whatsapp-omnichannel',
    date: 'May 18, 2026',
    category: 'Integration',
    location: 'SAN FRANCISCO',
    title: 'Autoniv Integrates Official WhatsApp Business API for Instant Post-Call Messaging',
    summary: 'New integration allows AI voice agents to automatically send instant WhatsApp appointment confirmations, PDF brochures, and calendar invites immediately after phone calls.',
    fullBody: {
      dateline: 'SAN FRANCISCO — May 18, 2026',
      paragraphs: [
        'Autoniv has unveiled its direct integration with Meta’s Official WhatsApp Business API.',
        'Businesses can now connect their voice agents with automated messaging workflows. As soon as an AI voice agent concludes a phone call with a booked appointment or lead capture, the platform automatically dispatches verified WhatsApp confirmations.',
      ],
      boilerplate: 'Autoniv powers voice and messaging AI workflows for modern growth companies.',
    },
  },
  {
    id: 'pr-iso-hipaa-certification',
    date: 'April 05, 2026',
    category: 'Security & Compliance',
    location: 'NEW DELHI',
    title: 'Autoniv Achieves ISO 27001 & HIPAA Compliance Security Certification',
    summary: 'Platform earns top security credentials for end-to-end data encryption, clinical patient privacy, and enterprise access governance.',
    fullBody: {
      dateline: 'NEW DELHI — April 05, 2026',
      paragraphs: [
        'Autoniv today announced the completion of its ISO 27001 certification and full HIPAA compliance verification.',
        'The compliance audit confirms that Autoniv’s cloud infrastructure meets standard security controls for protecting Protected Health Information (PHI) and enterprise customer records.',
      ],
      boilerplate: 'Autoniv delivers secure, enterprise-grade AI assistants.',
    },
  },
];

const MEDIA_KIT_ITEMS = [
  {
    title: 'Autoniv Primary Logo Package',
    format: 'SVG, PNG (Dark & Light Variants)',
    size: '4.2 MB',
    desc: 'High-resolution vector logos, symbol icons, and wordmarks for digital and print media.',
    type: 'logo',
  },
  {
    title: 'Executive Leadership Headshots',
    format: 'High-Res WebP / JPEG',
    size: '12.8 MB',
    desc: 'Official portrait headshots of Founder & CEO Rajnesh Yadav and senior executive team.',
    type: 'photo',
  },
  {
    title: 'Autoniv Product Screenshots',
    format: '4K PNG / WebP',
    size: '18.5 MB',
    desc: 'High-resolution screenshots of the User Dashboard, Voice Dialer, Analytics, and Workflow Builder.',
    type: 'screenshot',
  },
  {
    title: 'Autoniv Company Fact Sheet 2026',
    format: 'PDF Document',
    size: '1.1 MB',
    desc: 'One-page overview of company history, key metrics, leadership, and technology architecture.',
    type: 'doc',
  },
];

export function Press() {
  const [activeRelease, setActiveRelease] = useState<PressRelease | null>(null);

  const handleDownloadAsset = (title: string) => {
    alert(`Downloading ${title} media package...`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Background Orbs - subtle white theme */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(37,99,235,0.03)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none" style={{ background: 'rgba(16,185,129,0.03)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ color: '#2563EB', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.3)' }}
          >
            <span>📰 Autoniv Press Room & Media Center</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight"
            style={{ color: '#0a0a0a' }}
          >
            News, Announcements <span className="bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600 bg-clip-text text-transparent">& Brand Assets</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed"
            style={{ color: '#475569' }}
          >
            Official press releases, media kits, executive leadership bios, and brand guidelines for journalists, partners, and media organizations.
          </motion.p>

          {/* Quick Stats Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="p-4 rounded-2xl text-center" style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)' }}>
              <p className="text-xl sm:text-2xl font-black" style={{ color: '#0f172a' }}>1,000+</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Active Clients</p>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)' }}>
              <p className="text-xl sm:text-2xl font-black" style={{ color: '#2563EB' }}>20+</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Languages Supported</p>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)' }}>
              <p className="text-xl sm:text-2xl font-black" style={{ color: '#10B981' }}>&lt;300ms</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Voice Latency</p>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)' }}>
              <p className="text-xl sm:text-2xl font-black" style={{ color: '#8B5CF6' }}>4-Hour</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>PR Response SLA</p>
            </div>
          </motion.div>
        </div>

        {/* Section 1: Press Releases */}
        <div className="mb-20 space-y-6">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Official Press Releases</h2>
              <p className="text-xs font-semibold mt-1" style={{ color: '#64748b' }}>Read product milestone announcements and company news</p>
            </div>
            <span className="text-xs font-bold" style={{ color: '#2563EB' }}>{PRESS_RELEASES.length} Releases</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRESS_RELEASES.map((pr, idx) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveRelease(pr)}
                className="rounded-3xl overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl"
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid rgba(15, 23, 42, 0.08)', 
                  boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{ color: '#2563EB', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      {pr.category}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>{pr.date}</span>
                  </div>

                  <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors leading-snug mb-3" style={{ color: '#0f172a' }}>
                    {pr.title}
                  </h3>

                  <p className="text-xs font-medium leading-relaxed line-clamp-3 mb-6" style={{ color: '#475569' }}>
                    {pr.summary}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-semibold" style={{ borderTop: '1px solid rgba(15,23,42,0.06)', color: '#64748b' }}>
                  <span>{pr.location}</span>
                  <span className="font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1" style={{ color: '#10B981' }}>
                    Read Full Statement →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 2: Downloadable Media Kit */}
        <div className="mb-20 space-y-6">
          <div className="pb-4" style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>Brand Assets & Media Kit</h2>
            <p className="text-xs font-semibold mt-1" style={{ color: '#64748b' }}>Download official logos, screenshots, Fact Sheets, and executive photos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MEDIA_KIT_ITEMS.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl overflow-hidden transition-all duration-500 group hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between"
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid rgba(15, 23, 42, 0.08)', 
                  boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl"
                    style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {item.type === 'logo' ? '🎨' : item.type === 'photo' ? '👤' : item.type === 'screenshot' ? '🖥️' : '📄'}
                  </div>

                  <h4 className="text-sm font-bold mb-1.5" style={{ color: '#0f172a' }}>{item.title}</h4>
                  <p className="text-xs font-medium leading-relaxed mb-4" style={{ color: '#475569' }}>{item.desc}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold mb-3" style={{ color: '#94a3b8' }}>
                    <span>{item.format}</span>
                    <span>{item.size}</span>
                  </div>

                  <button
                    onClick={() => handleDownloadAsset(item.title)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-blue-600"
                    style={{ background: '#2563EB' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Package
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 3: Executive Leadership Spotlight */}
        <div className="mb-20 rounded-3xl p-8 sm:p-12"
          style={{ 
            background: '#ffffff', 
            border: '1px solid rgba(15, 23, 42, 0.08)', 
            boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden shadow-2xl"
                  style={{ border: '3px solid rgba(37,99,235,0.2)' }}>
                  <img
                    src={rajneshYadav}
                    alt="Rajnesh Yadav Founder CEO"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-3 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg"
                  style={{ background: '#2563EB' }}>
                  FOUNDER & CEO
                </span>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#10B981' }}>EXECUTIVE SPOTLIGHT</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
                "Our mission is to make natural conversational AI accessible to every business globally."
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: '#475569' }}>
                Under the leadership of Founder & CEO <strong style={{ color: '#0f172a' }}>Rajnesh Yadav</strong>, Autoniv has grown into an omnichannel AI power platform supporting 20+ languages with zero-latency streaming architecture and enterprise white-label solutions.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-bold" style={{ color: '#64748b' }}>
                <span>📍 New Delhi & San Francisco</span>
                <span>•</span>
                <span>📧 rajnesh@autoniv.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: PR Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(16,185,129,0.04))',
            border: '1px solid rgba(37,99,235,0.15)',
          }}
        >
          <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight" style={{ color: '#0f172a' }}>
            Media Inquiries & Press Relations
          </h3>
          <p className="text-xs sm:text-sm max-w-xl mx-auto mb-6 font-medium leading-relaxed" style={{ color: '#475569' }}>
            Are you a journalist, analyst, or podcaster covering Conversational AI or Enterprise Software? Our press team responds to media inquiries within 4 hours.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:press@autoniv.com"
              className="px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg hover:scale-[1.02] cursor-pointer hover:bg-blue-600"
              style={{ background: '#2563EB' }}
            >
              Contact Press Team (press@autoniv.com)
            </a>
            <button
              onClick={() => handleDownloadAsset('Full Autoniv Media Kit ZIP')}
              className="px-6 py-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer hover:border-blue-500"
              style={{ color: '#475569', background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.12)' }}
            >
              Download Complete Media Kit (.ZIP)
            </button>
          </div>
        </motion.div>
      </div>

      {/* Press Release Reader Modal */}
      <AnimatePresence>
        {activeRelease && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)' }}
            >
              <div className="p-6 sm:p-8 flex items-start justify-between gap-4" style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.08)', background: '#f8fafc' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{ color: '#2563EB', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      {activeRelease.category}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#64748b' }}>{activeRelease.date}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug" style={{ color: '#0f172a' }}>
                    {activeRelease.title}
                  </h2>
                </div>

                <button
                  onClick={() => setActiveRelease(null)}
                  className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-slate-100"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed font-normal" style={{ color: '#334155' }}>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#2563EB' }}>
                  {activeRelease.fullBody.dateline}
                </p>

                {activeRelease.fullBody.paragraphs.map((para, idx) => (
                  <p key={idx} className="font-medium leading-relaxed" style={{ color: '#334155' }}>
                    {para}
                  </p>
                ))}

                {activeRelease.fullBody.quote && (
                  <div className="p-5 rounded-2xl space-y-2 my-6" style={{ background: 'rgba(37,99,235,0.04)', borderLeft: '4px solid #2563EB' }}>
                    <p className="italic font-medium" style={{ color: '#1e293b' }}>"{activeRelease.fullBody.quote.text}"</p>
                    <p className="text-xs font-bold" style={{ color: '#2563EB' }}>
                      — {activeRelease.fullBody.quote.author}, {activeRelease.fullBody.quote.title}
                    </p>
                  </div>
                )}

                <div className="pt-6 text-xs space-y-2" style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', color: '#64748b' }}>
                  <p className="font-bold" style={{ color: '#0f172a' }}>About Autoniv:</p>
                  <p>{activeRelease.fullBody.boilerplate}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex justify-end" style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#f8fafc' }}>
                <button
                  onClick={() => setActiveRelease(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:bg-blue-600"
                  style={{ background: '#2563EB' }}
                >
                  Close Press Release
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Press;
