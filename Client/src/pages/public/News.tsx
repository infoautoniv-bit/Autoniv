import { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import ScrollToTop from '../../components/ScrollToTop';
import { USPSlider } from './sections/USPSlider';
import { PublicNavbar } from '../../components/PublicNavbar';
import { BRAND, INK, SLATE, MUTE, HAIRLINE, SURFACE, TINT, MONO, SANS, Reveal, SectionLabel, GradientText, StatCard, CTADecorations } from './design';
import { motion, AnimatePresence } from 'framer-motion';

const NEWS_ARTICLES = [
  {
    id: 1, category: 'Product Release', date: 'June 18, 2026',
    title: 'Autoniv 2.0 Released: Real-time Voice Cloning & Calendar Sync',
    desc: 'We are thrilled to launch Autoniv 2.0, introducing state-of-the-art voice cloning latency improvements and direct native integrations with Google Calendar and Microsoft Outlook for seamless booking.',
    fullContent: 'We are thrilled to launch Autoniv 2.0, introducing state-of-the-art voice cloning latency improvements and direct native integrations with Google Calendar and Microsoft Outlook for seamless booking. This major update reduces voice cloning latency by 40% and introduces real-time voice modulation capabilities. The new calendar sync feature automatically detects scheduling conflicts and suggests optimal meeting times, reducing back-and-forth communication by up to 70%. Early adopters have reported a 45% increase in booking conversion rates within the first week of implementation.',
    readTime: '4 min read', emoji: '🖥️', featured: true,
  },
  {
    id: 2, category: 'Industry Guide', date: 'June 10, 2026',
    title: 'How AI Voice Agents Are Redefining Customer Service in 2026',
    desc: 'Explore the state of voice conversational interfaces. We analyze latency benchmarks, accuracy improvements in accent comprehension, and why multi-lingual configurations are vital for modern scaling businesses.',
    fullContent: 'Explore the state of voice conversational interfaces. We analyze latency benchmarks, accuracy improvements in accent comprehension, and why multi-lingual configurations are vital for modern scaling businesses. Our comprehensive guide covers the evolution of voice AI from basic IVR systems to sophisticated conversational agents capable of understanding context, emotion, and intent. We examine real-world case studies showing how businesses have reduced customer service costs by 60% while improving satisfaction scores by 35%. The guide also provides actionable insights on implementing multilingual support, handling complex queries, and measuring ROI from AI voice investments.',
    readTime: '6 min read', emoji: '🎙️',
  },
  {
    id: 3, category: 'Security & Compliance', date: 'May 28, 2026',
    title: 'Autoniv Achieves SOC 2 Type II Security Certification',
    desc: 'Security is at the core of our business communication platform. Autoniv has successfully completed the SOC 2 Type II audit, ensuring the highest standards of data protection and server compliance for enterprise customers.',
    fullContent: 'Security is at the core of our business communication platform. Autoniv has successfully completed the SOC 2 Type II audit, ensuring the highest standards of data protection and server compliance for enterprise customers. This certification validates our commitment to security across five key trust service criteria: security, availability, processing integrity, confidentiality, and privacy. The rigorous audit process involved thorough examination of our access controls, encryption standards, incident response procedures, and disaster recovery plans. Enterprise customers can now confidently deploy Autoniv knowing their data meets the strictest compliance requirements.',
    readTime: '3 min read', emoji: '🔒',
  },
  {
    id: 4, category: 'Case Study Highlights', date: 'May 15, 2026',
    title: 'How a Local Home Services Agency Scaled to 10,000 Inbound Calls',
    desc: 'Read how PeakPlumbing integrated Autoniv scheduling agents to automate dispatch operations. The AI agent booked emergency service requests in real time, increasing clinic booking speed and customer satisfaction.',
    fullContent: 'Read how PeakPlumbing integrated Autoniv scheduling agents to automate dispatch operations. The AI agent booked emergency service requests in real time, increasing clinic booking speed and customer satisfaction. Within three months of implementation, PeakPlumbing scaled from managing 500 monthly calls to handling over 10,000 inbound inquiries. The AI voice agent successfully booked 82% of calls directly without human intervention, reducing dispatcher workload by 75%. Customer satisfaction scores rose from 3.2 to 4.8 out of 5, with customers praising the quick response times and seamless booking experience. The case study details implementation strategies, common challenges, and key metrics for measuring success.',
    readTime: '5 min read', emoji: '🚐',
  },
  {
    id: 5, category: 'Industry Guide', date: 'April 22, 2026',
    title: 'The Complete Guide to Building an AI-Powered Sales Funnel',
    desc: 'From lead capture to conversion, learn how AI voice agents can automate every stage of your sales pipeline and boost revenue by 30% or more.',
    fullContent: 'From lead capture to conversion, learn how AI voice agents can automate every stage of your sales pipeline and boost revenue by 30% or more. This comprehensive guide walks through each stage of the sales funnel—awareness, interest, consideration, intent, evaluation, and purchase—and shows how AI voice agents can optimize conversion at every step. Discover how to design conversational scripts that qualify leads, handle objections, and close sales automatically. The guide includes templates for call scripts, integration strategies for CRMs, and analytics frameworks to track AI performance. Real examples from successful implementations demonstrate how businesses have doubled their conversion rates using AI voice technology.',
    readTime: '8 min read', emoji: '📈',
  },
  {
    id: 6, category: 'Product Release', date: 'April 5, 2026',
    title: 'Introducing WhatsApp Business API Integration',
    desc: 'Connect your Autoniv AI agents directly to WhatsApp Business API for seamless customer engagement across voice and chat channels.',
    fullContent: 'Connect your Autoniv AI agents directly to WhatsApp Business API for seamless customer engagement across voice and chat channels. This integration allows businesses to manage customer communications through a unified interface, switching between voice and text channels based on customer preference and context. The WhatsApp integration supports automated responses, order confirmations, appointment reminders, and customer support queries. Early beta testers have reported a 40% increase in customer engagement and a 55% reduction in response times. The integration complies with WhatsApp\'s business policies and includes built-in analytics for tracking conversation metrics.',
    readTime: '3 min read', emoji: '💬',
  },
];

const CATEGORIES = [
  { name: 'Product Releases', count: 12, icon: '🚀' },
  { name: 'Industry Guides', count: 18, icon: '📚' },
  { name: 'Security & Compliance', count: 6, icon: '🔒' },
  { name: 'Case Studies', count: 15, icon: '📊' },
  { name: 'Company News', count: 8, icon: '🏢' },
  { name: 'Tips & Tutorials', count: 22, icon: '💡' },
];

const STATS_DATA = [
  { value: '50+', label: 'Articles Published', desc: 'And counting every month' },
  { value: '10K+', label: 'Monthly Readers', desc: 'Growing audience base' },
  { value: '4.8', label: 'Avg. Reader Rating', desc: 'Out of 5.0 stars' },
  { value: '20+', label: 'Industry Topics', desc: 'From AI to automation' },
];

const TIMELINE = [
  { date: 'June 2026', title: 'Autoniv 2.0 Launch', desc: 'Voice cloning, calendar sync, and 50+ improvements.' },
  { date: 'May 2026', title: 'SOC 2 Type II Certified', desc: 'Enterprise-grade security compliance achieved.' },
  { date: 'April 2026', title: 'WhatsApp API Integration', desc: 'Native WhatsApp Business API support launched.' },
  { date: 'March 2026', title: '100+ Businesses Milestone', desc: 'Crossed 100 active business customers.' },
];

function ArticleModal({ article, onClose }: { article: typeof NEWS_ARTICLES[0] | null; onClose: () => void }) {
  if (!article) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
          style={{ background: SURFACE, boxShadow: '0 32px 64px -16px rgba(15,23,42,0.24)' }}
        >
          <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10" style={{ background: SURFACE, borderBottom: `1px solid ${HAIRLINE}` }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{article.emoji}</span>
              <span className="text-xs font-medium" style={{ color: MUTE }}>{article.category}</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: MUTE, background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium" style={{ color: SLATE }}>{article.date}</span>
              <span style={{ color: MUTE }}>•</span>
              <span className="text-xs font-medium" style={{ color: SLATE }}>{article.readTime}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: INK }}>{article.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: SLATE }}>{article.fullContent}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function News() {
  const [selectedArticle, setSelectedArticle] = useState<typeof NEWS_ARTICLES[0] | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: TINT, fontFamily: SANS, color: INK }}>
      <USPSlider />
      <PublicNavbar />

      <div className="page-bg" style={{ paddingTop: 130, paddingBottom: 80 }}>
        <div className="box-wrap">

          {/* ── Hero ── */}
          <section className="section-box tint">
            <div
              className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center section-pad"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Reveal>
                <SectionLabel text="News & Updates" />
                <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.03em', color: INK, lineHeight: 1.15, margin: '0 0 14px' }}>
                  Autoniv <GradientText>News & Updates</GradientText>
                </h1>
                <p style={{ fontSize: 15, color: SLATE, maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
                  Stay up to date with the latest voice AI features, guides, security audits, and success stories.
                </p>
              </Reveal>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {STATS_DATA.map((s) => (
                    <StatCard key={s.label} value={s.value} label={s.label} description={s.desc} />
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Featured Article ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="text-center mb-10">
                  <SectionLabel text="Featured" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: 0 }}>
                    This Month's <GradientText>Highlight</GradientText>
                  </h2>
                </div>
              </Reveal>
              {NEWS_ARTICLES.filter(a => a.featured).map((art) => (
                    <Reveal key={art.title} delay={80}>
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={{ 
                          y: -12, 
                          scale: 1.02,
                          boxShadow: '0 32px 64px -16px rgba(15,23,42,0.2)'
                        }}
                        className="group cursor-pointer transition-all duration-500 relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff, #fafcff)',
                          borderRadius: '24px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                        }}
                        onClick={() => setSelectedArticle(art)}
                      >
<div className="grid grid-cols-1 md:grid-cols-2 relative z-10">
                       <div className="h-40 sm:h-56 md:h-auto flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-emerald-50/20"></div>
                         <motion.span
                           className="text-5xl sm:text-7xl md:text-8xl relative z-10 transform-gpu"
                           whileHover={{ 
                             scale: 1.15, 
                             rotate: 8,
                             y: -5,
                             filter: 'brightness(1.1)'
                           }}
                           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                         >
                           {art.emoji}
                         </motion.span>
                       </div>
                       <div className="p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden">
                         <div className="relative z-10">
                           <div className="flex flex-wrap items-center gap-3 mb-4">
                             <motion.span 
                               whileHover={{ scale: 1.05, y: -2 }}
                               className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-default"
                               style={{ 
                                 background: 'linear-gradient(135deg, #eff6ff, #f0fdf9)',
                                 color: '#2563EB',
                                 border: '1px solid rgba(37,99,235,0.15)',
                                 boxShadow: '0 2px 8px rgba(37,99,235,0.1)'
                               }}
                             >{art.category}</motion.span>
                             <motion.span 
                               whileHover={{ scale: 1.05 }}
                               className="text-xs font-medium transition-colors duration-300"
                               style={{ color: MUTE }}
                             >{art.date}</motion.span>
                           </div>
                           
                           <h3 className="text-xl sm:text-2xl font-bold mb-3 leading-snug transition-all duration-300 group-hover:text-blue-900" style={{ color: INK }}>{art.title}</h3>
                           <p className="text-sm leading-relaxed mb-6 transition-all duration-300 group-hover:text-slate-800" style={{ color: SLATE }}>{art.desc}</p>
                           
                           <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative overflow-hidden">
                             <span className="text-xs font-medium transition-colors duration-300" style={{ color: MUTE }}>{art.readTime}</span>
                             <motion.span 
                               className="inline-flex items-center gap-2 text-sm font-bold transition-all cursor-pointer relative overflow-hidden"
                               style={{ color: '#2563EB' }}
                               whileHover={{ gap: 3 }}
                             >
                               <span className="relative z-10">Read More</span>
                               <motion.svg 
                                 className="w-4 h-4 transition-all duration-300 relative z-10" 
                                 fill="none" 
                                 viewBox="0 0 24 24" 
                                 stroke="currentColor"
                                 whileHover={{ x: 3, strokeWidth: 2.5 }}
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                               </motion.svg>
                             </motion.span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 </Reveal>
               ))}
             </div>
           </section>

           {/* ── All Articles ── */}
           <section className="section-box white">
             <div className="section-pad max-w-6xl mx-auto">
               <Reveal>
                 <div className="text-center mb-10">
                   <SectionLabel text="Articles" />
                   <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: 0 }}>
                     All <GradientText>Articles</GradientText>
                   </h2>
                 </div>
               </Reveal>
               <Reveal delay={80}>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {NEWS_ARTICLES.filter(a => !a.featured).map((art, i) => (
                     <motion.div
                       key={art.title}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-40px" }}
                       transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                       whileHover={{ 
                         y: -10, 
                         scale: 1.02,
                         boxShadow: '0 20px 40px -12px rgba(15,23,42,0.15)'
                       }}
                       className="group cursor-pointer transition-all duration-500 relative overflow-hidden"
                       style={{
                         background: 'linear-gradient(135deg, #ffffff, #fafcff)',
                         borderRadius: '20px',
                         boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                         border: '1px solid rgba(37,99,235,0.06)'
                       }}
                       onClick={() => setSelectedArticle(art)}
                     >
                       <div className="h-32 sm:h-40 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f7ff, #f8fbfd)' }}>
                         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ 
                           background: 'radial-gradient(circle at center, rgba(37,99,235,0.08), transparent 70%)' 
                         }} />
                         <motion.span
                           className="text-4xl sm:text-5xl relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                           whileHover={{ scale: 1.1, rotate: 6, y: -5, filter: 'brightness(1.1)' }}
                           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                         >
                           {art.emoji}
                         </motion.span>
                       </div>
                       <div className="p-6 sm:p-6 relative">
                         <div className="relative z-10">
                           <div className="flex flex-wrap items-center gap-2 mb-3">
                             <motion.span 
                               whileHover={{ scale: 1.03, y: -1 }}
                               className="inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 cursor-default"
                               style={{ 
                                 background: 'linear-gradient(135deg, #eff6ff, #f0fdf9)',
                                 color: '#2563EB',
                                 border: '1px solid rgba(37,99,235,0.12)',
                                 boxShadow: '0 2px 6px rgba(37,99,235,0.08)'
                               }}
                             >{art.category}</motion.span>
                             <motion.span 
                               whileHover={{ scale: 1.03 }}
                               className="text-[10px] font-medium transition-colors duration-300"
                               style={{ color: MUTE }}
                             >{art.date}</motion.span>
                           </div>
                           
                           <h3 className="text-sm font-bold mb-2.5 leading-snug line-clamp-2 transition-all duration-300 group-hover:text-blue-900" style={{ color: INK }}>{art.title}</h3>
                           <p className="text-xs leading-relaxed mb-4 line-clamp-2 transition-all duration-300 group-hover:text-slate-700" style={{ color: SLATE }}>{art.desc}</p>
                           
                           <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 relative overflow-hidden">
                             <span className="text-[10px] font-medium transition-colors duration-300" style={{ color: MUTE }}>{art.readTime}</span>
                             <motion.span 
                               className="text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1 group-hover:gap-2"
                               style={{ color: '#2563EB' }}
                               whileHover={{ x: 2 }}
                             >
                               Read More →
                               <motion.svg 
                                 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-300" 
                                 fill="none" 
                                 viewBox="0 0 24 24" 
                                 stroke="currentColor"
                                 initial={{ x: -2, opacity: 0 }}
                                 whileHover={{ x: 0, opacity: 1 }}
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                               </motion.svg>
                             </motion.span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Subtle hover effect line */}
                       <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all duration-500 ease-out" />
                     </motion.div>
                   ))}
                 </div>
               </Reveal>
             </div>
           </section>

          {/* ── Categories ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="text-center mb-10">
                  <SectionLabel text="Topics" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: 0 }}>
                    Browse by <GradientText>Topic</GradientText>
                  </h2>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {CATEGORIES.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4, boxShadow: '0 8px 24px -8px rgba(37,99,235,0.12)' }}
                      className="group rounded-2xl p-5 sm:p-6 transition-all duration-300 bg-white border cursor-pointer"
                      style={{ borderColor: HAIRLINE }}
                    >
                      <motion.div
                        className="text-3xl mb-3"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {cat.icon}
                      </motion.div>
                      <div className="text-sm font-bold mb-1" style={{ color: INK }}>{cat.name}</div>
                      <div className="text-xs" style={{ color: MUTE }}>{cat.count} articles</div>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Timeline ── */}
          <section className="section-box white">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="text-center mb-10">
                  <SectionLabel text="Milestones" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: 0 }}>
                    Product <GradientText>Timeline</GradientText>
                  </h2>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <div className="max-w-3xl mx-auto bg-slate-50/50 border border-slate-100/80 rounded-2xl p-6 sm:p-8">
                  {TIMELINE.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="flex gap-4 sm:gap-6"
                      style={{ marginBottom: i < TIMELINE.length - 1 ? 24 : 0 }}
                    >
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                          style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: BRAND, boxShadow: '0 0 0 3px rgba(37,99,235,0.12)' }}
                        />
                        {i < TIMELINE.length - 1 && <div className="w-px flex-1 mt-2" style={{ background: HAIRLINE }} />}
                      </div>
                      <div style={{ paddingBottom: i < TIMELINE.length - 1 ? 24 : 0 }}>
                        <div className="text-xs font-bold tracking-wider mb-1" style={{ color: '#2563EB', fontFamily: MONO }}>{item.date}</div>
                        <div className="text-sm font-bold mb-1" style={{ color: INK }}>{item.title}</div>
                        <div className="text-xs" style={{ color: SLATE }}>{item.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── Newsletter ── */}
          <section className="section-box tint">
            <div className="section-pad max-w-6xl mx-auto">
              <Reveal>
                <div className="max-w-lg mx-auto text-center">
                  <SectionLabel text="Stay Connected" />
                  <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.025em', color: INK, margin: '0 0 10px' }}>
                    Subscribe to our <GradientText>Newsletter</GradientText>
                  </h2>
                  <p style={{ fontSize: 14, color: SLATE, marginBottom: 28 }}>
                    Get product announcements, tips, and voice AI insights sent straight to your inbox.
                  </p>
                  <form onSubmit={e => { e.preventDefault(); alert('Thank you for subscribing!'); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input type="email" required placeholder="Enter your work email"
                      className="flex-1 px-5 py-3.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'white', border: `1px solid ${HAIRLINE}`, color: INK }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = HAIRLINE; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button type="submit" className="px-8 py-3.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all duration-200"
                      style={{ background: BRAND, border: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.35)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      Subscribe
                    </button>
                  </form>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="section-box white" style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#f0fdf9 100%)', border: '1.5px solid rgba(37,99,235,0.14)', boxShadow: '0 20px 56px -16px rgba(37,99,235,0.14)' }}>
            <div className="section-pad max-w-6xl mx-auto text-center relative overflow-hidden">
              <CTADecorations />
              <div className="relative z-10">
                <h2 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.03em', color: INK, margin: '0 0 16px', lineHeight: 1.15 }}>
                  Ready to Grow with <GradientText>AI?</GradientText>
                </h2>
                <p style={{ fontSize: 15, color: SLATE, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
                  Join 500+ businesses using Autoniv AI Voice Agents to capture more leads and serve customers 24/7.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link to="/register"
                    className="px-8 py-4 rounded-full text-sm font-bold text-white no-underline inline-block text-center transition-all duration-200"
                    style={{ background: BRAND, boxShadow: '0 8px 26px -4px rgba(16,185,129,0.34)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(16,185,129,0.44)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 26px -4px rgba(16,185,129,0.34)'; }}>
                    Start Free Trial →
                  </Link>
                  <Link to="/agents"
                    className="px-8 py-4 rounded-full text-sm font-bold no-underline inline-block text-center transition-all duration-200"
                    style={{ background: SURFACE, border: '1.5px solid rgba(15,23,42,0.10)', color: '#475569' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.32)'; e.currentTarget.style.color = '#2563EB'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.10)'; e.currentTarget.style.color = '#475569'; }}>
                    Explore AI Agents
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export default News;