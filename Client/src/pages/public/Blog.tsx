import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { injectSchema, BLOG_POSTING_SCHEMA } from '../../utils/schema';

const BLOG_POSTS = [
  {
    title: 'What Are AI Voice Agents and How Do They Work?',
    excerpt: 'A complete guide to understanding AI voice agents, their technology, and how they can transform your business communication.',
    category: 'Product',
    date: 'June 2026',
    readTime: '5 min read',
    emoji: '🎙️',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))'
  },
  {
    title: '10 Ways AI Voice Agents Can Boost Your Sales',
    excerpt: 'Discover how businesses are using AI-powered calling to increase lead conversion rates by 3x.',
    category: 'Use Cases',
    date: 'June 2026',
    readTime: '7 min read',
    emoji: '📈',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(245,158,11,0.1))'
  },
  {
    title: 'The Future of Customer Support: AI vs Human Agents',
    excerpt: 'Why the best approach combines AI efficiency with human empathy for exceptional customer experiences.',
    category: 'Industry',
    date: 'May 2026',
    readTime: '6 min read',
    emoji: '🤝',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(244,63,94,0.1))'
  },
  {
    title: 'How to Set Up Your First AI Voice Agent in 5 Minutes',
    excerpt: 'Step-by-step tutorial to deploy your first AI agent on Autoniv — no coding required.',
    category: 'Tutorial',
    date: 'May 2026',
    readTime: '4 min read',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.1))'
  },
];

const tagStyles: Record<string, { color: string; bg: string }> = {
  Product: { color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  "Use Cases": { color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  Industry: { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  Tutorial: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" }
};

export function Blog() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const cleanups = BLOG_POSTS.map((post, i) =>
      injectSchema(`blog-post-${i}`, BLOG_POSTING_SCHEMA({
        title: post.title,
        description: post.excerpt,
        image: 'https://autoniv.com/og-blog.png',
        datePublished: '2026-06-01',
        author: 'Autoniv Team',
      }))
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

  const featured = BLOG_POSTS[0];
  const gridPosts = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050d1a' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)', pointerEvents: 'none' }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#10B981]" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            Newsroom
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Latest Insights <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">& Updates</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Tips, industry guides, and the latest release news from the Autoniv engineering team.
          </p>
        </div>

        {/* Featured Post */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <div 
              className="group relative rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer flex flex-col md:flex-row h-full md:min-h-[380px]"
              style={{
                background: 'rgba(13, 27, 42, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
              }}
            >
              {/* Cover emoji container */}
              <div 
                className="w-full md:w-[45%] h-56 md:h-auto flex items-center justify-center text-7xl relative overflow-hidden"
                style={{ background: featured.gradient }}
              >
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <span className="transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 z-10">{featured.emoji}</span>
              </div>

              {/* Cover Details */}
              <div className="p-8 md:p-10 flex flex-col justify-center flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span 
                    className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border"
                    style={{
                      color: tagStyles[featured.category]?.color || '#3B82F6',
                      background: tagStyles[featured.category]?.bg || 'rgba(39,130,246,0.08)',
                      borderColor: (tagStyles[featured.category]?.color || '#3B82F6') + '25'
                    }}
                  >
                    {featured.category}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{featured.date}</span>
                  <span className="text-xs text-slate-500 font-bold">·</span>
                  <span className="text-xs text-slate-500 font-bold">{featured.readTime}</span>
                </div>

                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">★ Featured Article</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  {featured.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-semibold">
                  {featured.excerpt}
                </p>

                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mt-auto">
                  Read Full Article
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="transform group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {gridPosts.map((post, i) => {
            const tagStyle = tagStyles[post.category] || tagStyles.Product;
            return (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-full"
              >
                <div 
                  className="group rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer flex flex-col h-full"
                  style={{
                    background: 'rgba(13, 27, 42, 0.3)',
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 15px 35px -15px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
                    e.currentTarget.style.boxShadow = '0 25px 50px -15px rgba(59,130,246,0.1), 0 0 0 1px rgba(59,130,246,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.boxShadow = '0 15px 35px -15px rgba(0,0,0,0.3)';
                  }}
                >
                  {/* cover image */}
                  <div className="h-44 w-full flex items-center justify-center text-5xl relative overflow-hidden" style={{ background: post.gradient }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <span className="transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500 inline-block z-10">{post.emoji}</span>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span 
                        className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border"
                        style={{
                          color: tagStyle.color,
                          background: tagStyle.bg,
                          borderColor: tagStyle.color + '20'
                        }}
                      >
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{post.date}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-white mb-2 leading-snug group-hover:text-blue-400 transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-semibold text-slate-400/80">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/60">
                      <span className="text-xs font-bold text-slate-500">{post.readTime}</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                        Read
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subscribe Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-3xl p-8 sm:p-12 border text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.6), rgba(10, 15, 30, 0.4))',
            borderColor: 'rgba(59, 130, 246, 0.15)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, rgba(16,185,129,0.03), transparent 70%)', pointerEvents: 'none' }} />
          
          <div className="relative z-10 max-w-lg mx-auto space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-white">Subscribe to our newsletter</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold leading-relaxed">
              Get the latest guides, release notes, and industry benchmarks directly in your inbox. No spam. Unsubscribe anytime.
            </p>

            {subscribed ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-3 px-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold inline-block"
              >
                ✓ Thanks for subscribing! Check your inbox soon.
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 mt-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="flex-grow px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer border-none"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #10B981)', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}
                >
                  Join Newsletter
                </button>
              </form>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default Blog;
