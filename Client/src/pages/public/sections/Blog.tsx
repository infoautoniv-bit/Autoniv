import { Link } from "react-router-dom";
import { Reveal } from "./utils";

const posts = [
  { tag: "Product", date: "June 18, 2026", title: "Autoniv 2.0: Real-time Voice Cloning & Calendar Sync", desc: "Introducing state-of-the-art voice cloning latency improvements and direct native integrations with Google Calendar and Outlook.", readTime: "4 min read", emoji: "🖥️" },
  { tag: "Industry", date: "June 10, 2026", title: "How AI Voice Agents Are Redefining Customer Service in 2026", desc: "Explore the state of voice conversational interfaces — latency benchmarks, accuracy improvements, and multi-lingual configurations.", readTime: "6 min read", emoji: "🎙️" },
  { tag: "Security", date: "May 28, 2026", title: "Autoniv Achieves SOC 2 Type II Security Certification", desc: "Security is at the core of our platform. Learn how we completed the SOC 2 Type II audit for enterprise-grade data protection.", readTime: "3 min read", emoji: "🔒" },
];

const tagStyles = {
  Product: { color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  Industry: { color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  Security: { color: "#F43F5E", bg: "rgba(244,63,94,0.08)" }
};

export function Blog() {
  return (
    <section id="news" className="section-box white">
      <div className="section-pad relative overflow-hidden">
        {/* Decorative background orbs */}
        <div style={{ position: "absolute", bottom: "-10%", left: "5%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(37,99,235,0.03), transparent 70%)", pointerEvents: "none" }} />

        <div className="relative" style={{ zIndex: 1 }}>
          <Reveal className="text-center mb-12 space-y-4">
            <span className="tag px-4 py-1.5 rounded-full inline-block" style={{ color: "#2563EB", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.3)" }}>News</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold" style={{ color: "#0a0a0a" }}>Latest News <span className="gradient-text">& Updates</span></h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "#475569" }}>Tips, guides, and news from the Autoniv team</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {posts.map((post, i) => {
              const tagStyle = tagStyles[post.tag as keyof typeof tagStyles] || tagStyles.Product;
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <div className="rounded-3xl overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col h-full hover:-translate-y-1.5 hover:shadow-xl"
                    style={{ 
                      background: "#ffffff", 
                      border: "1px solid rgba(15, 23, 42, 0.08)", 
                      boxShadow: "0 15px 35px -15px rgba(15, 23, 42, 0.04)",
                      willChange: "transform",
                    }}
                  >
                    <div className="h-40 w-full flex items-center justify-center text-5xl relative overflow-hidden transition-all duration-500" 
                      style={{ background: `linear-gradient(135deg, rgba(37,99,235,${0.06 + i * 0.02}), rgba(16,185,129,${0.04 + i * 0.02}))` }}>
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                      <span className="transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500 inline-block">{post.emoji}</span>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border" 
                          style={{ 
                            color: tagStyle.color, 
                            background: tagStyle.bg, 
                            borderColor: tagStyle.color + "20" 
                          }}
                        >
                          {post.tag}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{post.date}</span>
                      </div>
                      <h3 className="text-base font-extrabold mb-2.5 leading-snug group-hover:text-blue-600 transition-colors duration-300" style={{ color: "#0f172a" }}>{post.title}</h3>
                      <p className="text-xs leading-relaxed mb-5 font-semibold text-slate-500">{post.desc}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400">{post.readTime}</span>
                        <Link to="/news" className="flex items-center gap-1.5 text-xs font-bold transition-all group-hover:translate-x-1" style={{ color: "#10B981", textDecoration: "none" }}>
                          Read More
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link to="/news" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all"
              style={{ border: "1px solid rgba(37,99,235,0.2)", color: "#2563EB", background: "transparent", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.06)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
              View All News
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
