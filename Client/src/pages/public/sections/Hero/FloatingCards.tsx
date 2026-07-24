import React from "react";
import { motion } from "framer-motion";
import { CountUp } from "./CountUp";

interface FloatingCardsProps {
  lowPower: boolean;
}

export const FloatingCards = React.memo(function FloatingCards({ lowPower }: FloatingCardsProps) {
  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <>
      {/* Card 1: Incoming Call - Top Right */}
      <div className={`absolute top-[10%] right-[0%] sm:top-[4%] sm:-right-[8%] z-20 pointer-events-auto w-[100px] sm:w-[185px] ${lowPower ? "" : "card-float-1"}`}>
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
          <div className="flex justify-between items-center">
            <span className="text-[6px] sm:text-[10px] font-semibold text-[#2563EB] tracking-wide uppercase">
              Incoming Call
            </span>
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="mt-0.5 sm:mt-1">
            <div className="text-[8px] sm:text-xs font-bold text-[#0a0a0a] m-0 truncate">
              +1 (415) 555-0178
            </div>
            <p className="text-[6px] sm:text-[9px] text-[var(--muted)] m-0 mt-0.5">
              Sales Inquiry
            </p>
          </div>
          <div className="flex gap-0.5 sm:gap-2 justify-end mt-0.5 sm:mt-1">
            <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-100 flex items-center justify-center cursor-pointer hover:bg-red-200 transition-colors">
              <span className="text-[5px] sm:text-[9px]">❌</span>
            </div>
            <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center cursor-pointer hover:bg-green-200 transition-colors">
              <span className="text-[5px] sm:text-[9px]">📞</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Appointment Booked - Bottom Right */}
      <div className={`absolute bottom-[2%] right-[4%] sm:bottom-[16%] sm:-right-[2%] z-20 pointer-events-auto w-[95px] sm:w-[180px] ${lowPower ? "" : "card-float-2"}`}>
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)] flex items-center gap-1.5 sm:gap-3">
          <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.2)] flex items-center justify-center text-xs sm:text-lg flex-shrink-0 animate-[ringsPulse1_3s_ease-in-out_infinite_1.5s]">
            📅
          </div>
          <div className="min-w-0">
            <div className="text-[7px] sm:text-[11px] font-bold text-[#0a0a0a] leading-tight m-0 truncate">
              Appointment Booked
            </div>
            <p className="text-[5px] sm:text-[9px] text-[var(--muted)] mt-0.5 m-0">
              May 24, 2025
            </p>
            <p className="text-[5px] sm:text-[9px] font-medium m-0" style={{ color: '#1d4ed8' }}>
               10:00 AM
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: AI Assistant - Top Left */}
      <div className={`absolute top-[10%] left-[4%] sm:top-[4%] sm:-left-[4%] z-20 pointer-events-auto w-[100px] sm:w-[195px] ${lowPower ? "" : "card-float-3"}`}>
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[6px] sm:text-[9px] text-[var(--muted)]">
              🤖 AI Assistant
            </span>
          </div>
          <div className="space-y-0.5 sm:space-y-1.5 mt-0.5 sm:mt-1">
            <div className="bg-[rgba(37,99,235,0.06)] border border-[rgba(37,99,235,0.12)] text-[var(--text-secondary)] p-1 sm:p-2 rounded-lg sm:rounded-xl rounded-tl-sm text-[6px] sm:text-[10px] leading-relaxed max-w-[90%]">
              How can I help you today?
            </div>
            <div className="flex justify-end">
              <div
                className="text-white p-1 sm:p-2 rounded-lg sm:rounded-xl rounded-tr-sm text-[6px] sm:text-[10px] leading-relaxed max-w-[90%]"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#10B981)",
                }}
              >
                I need help with my order.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Leads Captured - Bottom Left */}
      <div className={`absolute bottom-[2%] left-[4%] sm:bottom-[8%] sm:-left-[4%] z-20 pointer-events-auto w-[100px] sm:w-[185px] ${lowPower ? "" : "card-float-4"}`}>
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 shadow-[0_8px_28px_rgba(37,99,235,0.10)] border border-[rgba(37,99,235,0.2)]">
          <div>
            <p className="text-[5px] sm:text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider m-0">
              Leads Captured
            </p>
            <div className="flex items-baseline gap-0.5 sm:gap-1.5 mt-0.5">
              <span className="text-sm sm:text-lg font-bold text-[var(--text)]">
                <CountUp to={2847} />
              </span>
              <span className="text-[5px] sm:text-[9px] font-semibold" style={{ color: '#047857' }}>
                +32.6%
              </span>
            </div>
          </div>
          <div className="h-5 sm:h-10 w-full mt-0.5 sm:mt-1">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,25 Q15,22 30,12 T60,18 T90,5 L100,5 L100,30 L0,30 Z" fill="url(#chart-glow)" />
              <motion.path
                d="M0,25 Q15,22 30,12 T60,18 T90,5 L100,5"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.3, delay: 1.1, ease: easeOut }}
              />
              <motion.circle
                cx="100"
                cy="5"
                r="2.5"
                fill="#2563EB"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 2.3, duration: 0.3, ease: "backOut" }}
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
});
