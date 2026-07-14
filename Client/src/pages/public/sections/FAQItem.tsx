import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

export function FAQItem({ question, answer, index }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0);
    }
  }, [open]);

  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: open
          ? "linear-gradient(145deg, rgba(37,99,235,0.04), rgba(16,185,129,0.02))"
          : "rgba(255,255,255,0.85)",
        border: open ? "1px solid rgba(37,99,235,0.2)" : "1px solid rgba(37,99,235,0.08)",
        boxShadow: open
          ? "0 12px 40px rgba(37,99,235,0.08), 0 0 0 1px rgba(37,99,235,0.06)"
          : "0 2px 12px rgba(0,0,0,0.02)",
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
        style={{
          background: open
            ? "linear-gradient(180deg, #2563EB, #10B981)"
            : "transparent",
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.03), transparent 60%)" }}
      />

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 text-left relative z-10"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        {/* Number indicator */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all duration-300"
          style={{
            background: open
              ? "linear-gradient(135deg, #2563EB, #10B981)"
              : "rgba(37,99,235,0.06)",
            color: open ? "#ffffff" : "#2563EB",
            border: open ? "none" : "1px solid rgba(37,99,235,0.12)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <span
          className="text-sm sm:text-base font-semibold pr-4 flex-1 transition-colors duration-300"
          style={{ color: open ? "#0a0a0a" : "#334155" }}
        >
          {question}
        </span>

        {/* Chevron */}
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: open ? "rgba(37,99,235,0.08)" : "rgba(37,99,235,0.04)",
            border: `1px solid ${open ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.06)"}`,
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke={open ? "#2563EB" : "#94a3b8"}
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Content with CSS transition */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-400"
        style={{
          height: height,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 ml-12">
          <div
            className="h-px mb-4"
            style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.12), transparent)" }}
          />
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
