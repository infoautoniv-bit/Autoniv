import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { injectSchema, BLOG_POSTING_SCHEMA } from '../../utils/schema';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: 'Product' | 'Use Cases' | 'Industry' | 'Tutorials' | 'Engineering';
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  emoji: string;
  gradient: string;
  featured?: boolean;
  content: {
    intro: string;
    sections: { heading: string; body: string; bullets?: string[] }[];
    takeaway: string;
  };
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'ai-voice-agents-guide',
    title: 'What Are AI Voice Agents and How Do They Work?',
    excerpt: 'A complete guide to understanding AI voice agents, their underlying LLM & TTS architecture, and how they transform business communication.',
    category: 'Product',
    date: 'July 2026',
    readTime: '5 min read',
    author: 'Rajnesh Yadav',
    authorRole: 'Founder & CEO',
    emoji: '🎙️',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))',
    featured: true,
    content: {
      intro: 'Conversational AI has evolved rapidly from basic IVR press-button menus to natural, ultra-low-latency voice agents that speak like real humans in 20+ languages.',
      sections: [
        {
          heading: '1. The Core Architecture: ASR, LLM, and TTS',
          body: 'An AI Voice Agent relies on a three-stage pipeline working in milliseconds:',
          bullets: [
            'Automatic Speech Recognition (ASR): Converts caller speech to text in real time (e.g. Deepgram, Sarvam).',
            'Large Language Model (LLM): Processes intent, retrieves knowledge base documents, and generates precise responses (e.g. Groq Llama 3.3, GPT-4).',
            'Text-to-Speech (TTS): Converts LLM text output into human-sounding voice audio with emotional inflection (e.g. ElevenLabs, Sarvam Bulbul).',
          ],
        },
        {
          heading: '2. Why Latency Matters in Voice Conversations',
          body: 'Humans expect responses within 500ms during a phone conversation. High latency leads to awkward pauses and interruptions. Modern voice engines optimize stream caching to achieve under 300ms round-trip latency.',
        },
        {
          heading: '3. Real-World Business Value',
          body: 'Businesses deploying voice agents report an immediate 70% reduction in customer support operating costs while handling 100% of incoming caller demand 24/7 without hold times.',
        },
      ],
      takeaway: 'AI Voice Agents are no longer the future — they are the standard for high-growth businesses aiming for zero missed calls.',
    },
  },
  {
    id: 'boost-sales-conversion',
    title: '10 Ways AI Voice Agents Boost Lead Conversion by 3x',
    excerpt: 'Discover how top sales teams deploy automated outbound calling and instant lead callback to increase conversion rates.',
    category: 'Use Cases',
    date: 'July 2026',
    readTime: '7 min read',
    author: 'Autoniv Growth Team',
    authorRole: 'Sales & Growth',
    emoji: '📈',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(245,158,11,0.15))',
    content: {
      intro: 'Studies show that calling a lead within 5 minutes of form submission increases conversion rates by over 390%. AI agents make instant callbacks effortless.',
      sections: [
        {
          heading: 'Instant Lead Callback (Under 30 Seconds)',
          body: 'When a prospective buyer fills out a form on your website or Meta Lead ad, Autoniv triggers an instant outbound AI call before your competitors even see the notification.',
        },
        {
          heading: 'Automated Qualification Questions',
          body: 'The AI agent asks pre-qualifying questions (budget, timeline, location) and tags interested buyers directly into your HubSpot or Salesforce CRM.',
        },
        {
          heading: '24/7 After-Hours Lead Capture',
          body: 'Never lose weekend or late-night leads again. AI agents handle calls 24 hours a day, 365 days a year without missing a single lead.',
        },
      ],
      takeaway: 'Speed-to-lead is the single biggest predictor of deal closure. AI agents ensure you are always first to call.',
    },
  },
  {
    id: 'whatsapp-ai-automation',
    title: 'How to Connect AI Voice Agents with WhatsApp Workflows',
    excerpt: 'Learn how to automatically send instant WhatsApp appointment confirmations and lead brochures right after a phone call ends.',
    category: 'Tutorials',
    date: 'July 2026',
    readTime: '6 min read',
    author: 'Engineering Team',
    authorRole: 'Integrations Lead',
    emoji: '💬',
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))',
    content: {
      intro: 'Combining voice calls with instant messaging creates a seamless customer journey that boosts appointment show-up rates by 45%.',
      sections: [
        {
          heading: 'Post-Call Automation Triggers',
          body: 'As soon as an AI voice call ends with an appointment booking or lead capture, Autoniv triggers an automated webhook to Meta Official WhatsApp API.',
        },
        {
          heading: 'WhatsApp Media & Calendar Invites',
          body: 'Send PDF brochures, location maps, and interactive Google Calendar links directly to the caller’s WhatsApp inbox within 2 seconds of call completion.',
        },
      ],
      takeaway: 'Multi-channel post-call engagement converts phone inquiries into confirmed, paying customers.',
    },
  },
  {
    id: 'future-customer-support',
    title: 'The Future of Support: AI Speed Meets Human Empathy',
    excerpt: 'Why modern enterprises combine 80% AI automated resolution with seamless human escalation for peak customer satisfaction.',
    category: 'Industry',
    date: 'June 2026',
    readTime: '6 min read',
    author: 'Autoniv Product Team',
    authorRole: 'Product Research',
    emoji: '🤝',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(244,63,94,0.15))',
    content: {
      intro: 'Customers do not want to wait on hold for simple questions, but they do want compassionate human help for complex issues.',
      sections: [
        {
          heading: 'Resolving Tier-1 Routine Queries Instantly',
          body: '80% of incoming customer support volume consists of repetitive questions: business hours, order tracking, booking changes, and pricing inquiries.',
        },
        {
          heading: 'Seamless Warm Transfer to Human Staff',
          body: 'When a caller requests specialized assistance, the AI agent performs a warm transfer to your human team along with the live transcript so the caller never repeats themselves.',
        },
      ],
      takeaway: 'Hybrid AI-human support workflows deliver 98% CSAT scores while reducing support burnout.',
    },
  },
  {
    id: 'setup-first-agent-5-mins',
    title: 'Step-by-Step Guide: Deploy Your First AI Agent in 5 Minutes',
    excerpt: 'A complete zero-code walkthrough to set up, customize prompts, select voices, and go live with your first AI assistant.',
    category: 'Tutorials',
    date: 'June 2026',
    readTime: '4 min read',
    author: 'Customer Success',
    authorRole: 'Onboarding Team',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(59,130,246,0.15))',
    content: {
      intro: 'You don’t need a team of developers or machine learning engineers to deploy an enterprise-grade AI voice agent.',
      sections: [
        {
          heading: 'Step 1: Choose Your Template',
          body: 'Select from pre-built templates for Receptionist, Scheduler, Q&A Support, Real Estate, or Healthcare.',
        },
        {
          heading: 'Step 2: Customize Your Voice & Prompt',
          body: 'Pick from 100+ hyper-realistic voices and define your business instructions, tone, and FAQ answers.',
        },
        {
          heading: 'Step 3: Test & Go Live',
          body: 'Use our built-in web call dialer to test your agent live before assigning an inbound phone number.',
        },
      ],
      takeaway: 'Going live with AI voice automation takes minutes, not months.',
    },
  },
  {
    id: 'healthcare-hipaa-ai-compliance',
    title: 'Healthcare AI: Security, Privacy & Compliance Standards',
    excerpt: 'How healthcare providers use HIPAA-compliant AI voice agents for patient appointment scheduling and prescription refills.',
    category: 'Engineering',
    date: 'June 2026',
    readTime: '8 min read',
    author: 'Security Engineering',
    authorRole: 'Compliance Officer',
    emoji: '🛡️',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))',
    content: {
      intro: 'Patient data security is paramount. Conversational AI deployed in clinical environments must adhere to strict encryption and privacy rules.',
      sections: [
        {
          heading: 'End-to-End Encryption & BAA',
          body: 'All audio streams, transcripts, and patient metadata are encrypted using AES-256 at rest and TLS 1.3 in transit.',
        },
        {
          heading: 'Automated Patient Reminders',
          body: 'Clinics reduce no-show rates by 50% using automated AI voice reminders that confirm appointment dates and prep instructions.',
        },
      ],
      takeaway: 'Compliant AI allows clinics to improve patient outcomes while protecting data privacy.',
    },
  },
];

const CATEGORIES = ['All', 'Product', 'Use Cases', 'Industry', 'Tutorials', 'Engineering'] as const;

const TAG_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Product: { color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  'Use Cases': { color: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  Industry: { color: '#A78BFA', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
  Tutorials: { color: '#FBBF24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Engineering: { color: '#22D3EE', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' },
};

export function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const cleanups = BLOG_POSTS.map((post, i) =>
      injectSchema(
        `blog-post-${i}`,
        BLOG_POSTING_SCHEMA({
          title: post.title,
          description: post.excerpt,
          image: 'https://autoniv.com/og-blog.png',
          datePublished: '2026-07-01',
          author: post.author,
        })
      )
    );
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(37,99,235,0.03)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(16,185,129,0.03)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ color: '#10B981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <span>✨ Autoniv AI Insights & Newsroom</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight"
            style={{ color: '#0a0a0a' }}
          >
            Conversational AI <span className="bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600 bg-clip-text text-transparent">& Product Updates</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed"
            style={{ color: '#475569' }}
          >
            Explore tutorials, architectural breakdowns, ROI strategies, and product releases from the Autoniv engineering & voice research team.
          </motion.p>
        </div>

        {/* Search & Category Filter */}
        <div className="mb-12 space-y-6">
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Search articles, guides, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 pl-12 rounded-2xl text-sm transition-all font-semibold focus:outline-none focus:ring-2"
              style={{ 
                background: '#f8fafc', 
                border: '1px solid rgba(15, 23, 42, 0.1)', 
                color: '#0f172a',
              }}
            />
            <svg className="w-5 h-5 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#94a3b8' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none"
                  style={active ? {
                    background: '#2563EB',
                    color: '#ffffff',
                    border: '1px solid #2563EB',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                    transform: 'scale(1.03)',
                  } : {
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Banner (Shown when no search/category filter is restricting) */}
        {selectedCategory === 'All' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveArticle(featuredPost)}
            className="mb-16 rounded-3xl overflow-hidden p-6 sm:p-10 cursor-pointer transition-all hover:-translate-y-1.5 hover:shadow-xl group"
            style={{ 
              background: '#ffffff', 
              border: '1px solid rgba(15, 23, 42, 0.08)', 
              boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}>
                    ★ FEATURED ARTICLE
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#64748b' }}>{featuredPost.date}</span>
                  <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>• {featuredPost.readTime}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold group-hover:text-blue-600 transition-colors tracking-tight leading-tight" style={{ color: '#0f172a' }}>
                  {featuredPost.title}
                </h2>

                <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: '#475569' }}>
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-black text-sm">
                    {featuredPost.author.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#0f172a' }}>{featuredPost.author}</p>
                    <p className="text-[10px] font-semibold" style={{ color: '#64748b' }}>{featuredPost.authorRole}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex items-center justify-center">
                <div
                  className="w-full h-56 sm:h-64 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group-hover:scale-[1.02] transition-all"
                  style={{ background: featuredPost.gradient }}
                >
                  <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {featuredPost.emoji}
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#334155' }}>Read Deep Dive →</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPosts.map((post, idx) => {
            const tagStyle = TAG_STYLES[post.category] || TAG_STYLES.Product;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveArticle(post)}
                className="rounded-3xl overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl"
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid rgba(15, 23, 42, 0.08)', 
                  boxShadow: '0 15px 35px -15px rgba(15, 23, 42, 0.04)',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <div
                    className="w-full h-40 rounded-xl mb-5 flex items-center justify-center text-4xl group-hover:scale-[1.02] transition-transform"
                    style={{ background: post.gradient }}
                  >
                    {post.emoji}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{ color: tagStyle.color, background: tagStyle.bg, border: `1px solid ${tagStyle.border}` }}
                    >
                      {post.category}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: '#94a3b8' }}>{post.readTime}</span>
                  </div>

                  <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2" style={{ color: '#0f172a' }}>
                    {post.title}
                  </h3>

                  <p className="text-xs font-medium line-clamp-3 leading-relaxed mb-6" style={{ color: '#475569' }}>
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-semibold" style={{ borderTop: '1px solid rgba(15,23,42,0.06)', color: '#64748b' }}>
                  <span>{post.author}</span>
                  <span className="font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1" style={{ color: '#10B981' }}>
                    Read Article →
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Newsletter Subscription Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(16,185,129,0.04))',
            border: '1px solid rgba(37,99,235,0.15)',
          }}
        >
          <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight" style={{ color: '#0f172a' }}>
            Subscribe to Autoniv AI Insights
          </h3>
          <p className="text-xs sm:text-sm max-w-lg mx-auto mb-6 font-medium" style={{ color: '#475569' }}>
            Get bi-weekly technical deep-dives on conversational AI, voice latency benchmarks, and new release guides delivered to your inbox.
          </p>

          {subscribed ? (
            <div className="p-4 rounded-xl text-xs font-bold max-w-md mx-auto"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
              ✓ Thank you! You are now subscribed to Autoniv AI Insights.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold transition-all focus:outline-none"
                style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.1)', color: '#0f172a' }}
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md cursor-pointer hover:bg-blue-600"
                style={{ background: '#2563EB' }}
              >
                Subscribe Free
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
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
                      {activeArticle.category}
                    </span>
                    <span className="text-xs font-bold" style={{ color: '#64748b' }}>{activeArticle.date}</span>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>• {activeArticle.readTime}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug" style={{ color: '#0f172a' }}>
                    {activeArticle.title}
                  </h2>
                  <p className="text-xs font-semibold" style={{ color: '#64748b' }}>
                    Written by {activeArticle.author} ({activeArticle.authorRole})
                  </p>
                </div>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-slate-100"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed font-normal" style={{ color: '#334155' }}>
                <div className="p-4 rounded-2xl font-medium" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', color: '#1e40af' }}>
                  {activeArticle.content.intro}
                </div>

                {activeArticle.content.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-3 pt-2">
                    <h3 className="text-base font-bold tracking-tight" style={{ color: '#0f172a' }}>{sec.heading}</h3>
                    <p className="font-medium" style={{ color: '#334155' }}>{sec.body}</p>
                    {sec.bullets && (
                      <ul className="list-disc list-inside space-y-2 text-xs font-semibold pl-2" style={{ color: '#64748b' }}>
                        {sec.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <div className="p-5 rounded-2xl text-xs font-semibold mt-6" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', color: '#065f46' }}>
                  💡 <strong style={{ color: '#0f172a' }}>Key Takeaway:</strong> {activeArticle.content.takeaway}
                </div>
              </div>

              <div className="p-4 sm:p-6 flex justify-end" style={{ borderTop: '1px solid rgba(15, 23, 42, 0.08)', background: '#f8fafc' }}>
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:bg-blue-600"
                  style={{ background: '#2563EB' }}
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Blog;
