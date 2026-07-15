import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { testimonials } from "./data";
import { GradientText } from "./anim";

interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  initials: string;
  metric: string;
  industry: string;
  avatar: string;
  photo: string;
}

function StarRating() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, k) => (
        <svg key={k} className="w-4 h-4 text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const INDUSTRIES = ["All", "Healthcare", "Real Estate", "Automotive", "Finance", "Education", "Travel"];

// Featured Card Component
function FeaturedTestimonialCard({ item }: { item: TestimonialItem }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative p-6 sm:p-8 lg:p-10 rounded-3xl flex flex-col justify-between overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderColor: isHovered ? item.avatar : "rgba(255, 255, 255, 0.08)",
        boxShadow: isHovered 
          ? `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px ${item.avatar}25, inset 0 0 32px ${item.avatar}05`
          : "0 24px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02)",
        backdropFilter: "blur(16px)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Move-sensitive glow */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${item.avatar}15, transparent 65%)`
          }}
        />
      )}

      {/* Quote Mark */}
      <span className="absolute right-8 top-6 text-[120px] font-serif select-none pointer-events-none opacity-5 font-bold leading-none" style={{ color: item.avatar }}>
        &rdquo;
      </span>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <StarRating />
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full"
            style={{
              color: item.avatar,
              background: `${item.avatar}15`,
              border: `1px solid ${item.avatar}30`,
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {item.industry}
          </span>
        </div>

        <p className="text-base sm:text-lg md:text-xl leading-relaxed text-white font-medium mb-8 italic relative z-10">
          &ldquo;{item.quote}&rdquo;
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t border-white/5 mt-auto relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-full opacity-60 blur-xs" style={{ background: `linear-gradient(135deg, ${item.avatar}, #34d399)` }} />
            <img src={item.photo} alt={`${item.name} Portrait`} width={48} height={48} className="relative w-12 h-12 rounded-full object-cover" style={{ border: `2px solid ${item.avatar}` }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{item.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{item.role}</p>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end justify-center px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[130px] text-center sm:text-right">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact Metric</span>
          <span className="text-xl font-black font-mono text-emerald-400">{item.metric}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Compact Thumbnail Card Component
function TestimonialThumbnailCard({
  item,
  isActive,
  onClick
}: {
  item: TestimonialItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative p-4 rounded-2xl cursor-pointer overflow-hidden border transition-all duration-300"
      style={{
        background: isActive 
          ? "rgba(15, 23, 42, 0.85)" 
          : "rgba(15, 23, 42, 0.35)",
        borderColor: isActive 
          ? item.avatar 
          : isHovered 
            ? "rgba(255,255,255,0.12)" 
            : "rgba(255,255,255,0.04)",
        boxShadow: isActive 
          ? `0 12px 28px rgba(0,0,0,0.35), inset 0 0 16px ${item.avatar}25` 
          : "none",
        backdropFilter: "blur(8px)"
      }}
    >
      {/* Mini hover glow */}
      {isHovered && !isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.03), transparent 60%)`
          }}
        />
      )}

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={item.photo}
            alt={`${item.name} Thumbnail`}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            style={{ border: `1.5px solid ${isActive ? item.avatar : "rgba(255,255,255,0.2)"}` }}
          />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-200">{item.name}</h4>
            <p className="text-[10px] text-slate-400 truncate">{item.role}</p>
          </div>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold font-mono whitespace-nowrap self-start"
          style={{
            color: "#10B981",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
        >
          {item.metric}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mt-3 line-clamp-2 italic">
        &ldquo;{item.quote}&rdquo;
      </p>
    </motion.div>
  );
}

export function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion() ?? false;

  // Filter testimonials based on selected industry
  const filtered = testimonials.filter(
    (t) => selectedIndustry === "All" || t.industry.toLowerCase() === selectedIndustry.toLowerCase()
  );

  // Safely clamp activeIndex if filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedIndustry]);

  // Auto-rotate among the filtered testimonials
  useEffect(() => {
    if (reduced || filtered.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reduced, filtered.length]);

  const activeTestimonial = filtered[activeIndex] || filtered[0] || testimonials[0];
  const isSingle = filtered.length <= 1;

  return (
    <section ref={ref} className="section-box black relative overflow-hidden" style={{ background: "#050d1a" }}>
      {/* Ambient glowing blobs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-60"
        style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)" }}
      />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[500px] h-[350px] rounded-full opacity-60"
        style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
      />

      {/* Subtle backdrop grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
              style={{ color: "#ffffff", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6" className="animate-pulse">
                <circle cx="3" cy="3" r="3" fill="#10B981" />
              </svg>
              TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Trusted by{" "}
              <GradientText animate={false} colors={["#60a5fa", "#34d399"]}>
                Industry Leaders
              </GradientText>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
              See how businesses are transforming their customer experience with Autoniv
            </p>
          </motion.div>

          {/* Industry Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2 flex-wrap mb-12 max-w-3xl mx-auto"
          >
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setSelectedIndustry(ind)}
                className="px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-300 cursor-pointer"
                style={{
                  background: selectedIndustry === ind 
                    ? "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(16,185,129,0.15))" 
                    : "rgba(255,255,255,0.02)",
                  borderColor: selectedIndustry === ind 
                    ? "#10B981" 
                    : "rgba(255,255,255,0.06)",
                  color: selectedIndustry === ind ? "#34d399" : "#94A3B8"
                }}
              >
                {ind}
              </button>
            ))}
          </motion.div>

          {/* Dual Panel Layout with Framer Motion Layout Animations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Panel: Featured Hero Card */}
            <div className={`${isSingle ? "lg:col-span-8 lg:col-start-3" : "lg:col-span-7"} col-span-1`}>
              <AnimatePresence mode="wait">
                <FeaturedTestimonialCard 
                  key={`${activeTestimonial.name}-${selectedIndustry}`} 
                  item={activeTestimonial} 
                />
              </AnimatePresence>
            </div>

            {/* Right Panel: Thumbnails Grid */}
            {!isSingle && (
              <div className="lg:col-span-5 col-span-1 flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <AnimatePresence>
                  {filtered.map((item, idx) => (
                    <TestimonialThumbnailCard
                      key={item.name}
                      item={item}
                      isActive={idx === activeIndex}
                      onClick={() => setActiveIndex(idx)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8 lg:gap-16 mt-16 pt-10 border-t border-white/5"
          >
            {[
              { n: "4.9/5", l: "Avg Rating", icon: "⭐" },
              { n: "2,500+", l: "Happy Clients", icon: "👥" },
              { n: "98%", l: "Satisfaction", icon: "🎯" },
            ].map((s, i) => (
              <div key={i} className="group flex flex-col items-center text-center cursor-default bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 min-w-[110px] sm:min-w-[140px] hover:border-emerald-500/25 transition-all duration-300">
                <span className="text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
                <div className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{s.n}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
