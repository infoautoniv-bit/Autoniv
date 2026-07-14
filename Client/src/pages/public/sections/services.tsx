import { motion } from "framer-motion";
import { useCallback } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

export function VoiceAgentService() {
  const handleContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-[#f8fafc]/40 relative overflow-hidden">
      {/* Decorative backdrop grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ── Left Column: Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-6 text-left"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border"
              style={{
                borderColor: "rgba(16,185,129,0.2)",
                color: "#10B981",
                background: "rgba(16,185,129,0.05)"
              }}
            >
              Voice AI Agent
            </span>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Cut Costs, <span className="gradient-text">Stay Compliant.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              Deploy AI voice agents that automate calls, answer questions, schedule
              appointments, and manage conversations end-to-end.
            </p>
            
            <p className="text-slate-600 text-base leading-relaxed max-w-xl">
              Fully compliant with enterprise standards and deployable on-premise or in the
              cloud. We support any integration, so your agents fit seamlessly into your
              existing tech stack.
            </p>

            <div className="pt-2">
              <motion.button
                onClick={handleContact}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-full font-bold text-white text-sm border-none cursor-pointer shadow-lg shadow-emerald-500/20"
                style={{ background: "var(--gg)" }}
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
            transition={{ duration: 0.6, ease: EASE }}
            className="relative w-full h-[360px] sm:h-[420px] bg-gradient-to-tr from-slate-50 to-slate-100/50 rounded-3xl border border-slate-200/50 shadow-sm flex items-center justify-center overflow-hidden"
          >
            {/* Blurry nodes pattern in background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none filter blur-[1px]">
              {/* Voice Agents node */}
              <div className="absolute top-[20%] left-[8%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Voice Agents
              </div>
              {/* Consultant node */}
              <div className="absolute top-[15%] right-[10%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Consultant
              </div>
              {/* Phone icon node */}
              <div className="absolute top-[35%] left-[25%] bg-white/70 border border-slate-200 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                📞
              </div>
              {/* Heart icon node */}
              <div className="absolute top-[40%] left-[10%] bg-white/70 border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                ❤️
              </div>
              {/* Information node */}
              <div className="absolute top-[42%] right-[15%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Information
              </div>
              {/* Conversations node */}
              <div className="absolute bottom-[40%] left-[5%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Conversations
              </div>
              {/* Client icon node */}
              <div className="absolute bottom-[38%] right-[8%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Client
              </div>
              {/* Consultant node 2 */}
              <div className="absolute bottom-[22%] left-[45%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Consultant
              </div>
              {/* Calls node */}
              <div className="absolute bottom-[12%] left-[20%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Calls
              </div>
              {/* Mail icon node */}
              <div className="absolute bottom-[10%] right-[32%] bg-white/70 border border-slate-200 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                ✉️
              </div>
              {/* Sales node */}
              <div className="absolute bottom-[12%] right-[12%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
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
    </section>
  );
}

export function ChatAgentService() {
  const handleContact = useCallback(() => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
      {/* Decorative backdrop grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%,black,transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* ── Left Column: Visual Showcase (Alternating!) ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative w-full h-[360px] sm:h-[420px] bg-gradient-to-tr from-slate-50 to-slate-100/50 rounded-3xl border border-slate-200/50 shadow-sm flex items-center justify-center overflow-hidden lg:order-1 order-2"
          >
            {/* Blurry nodes pattern in background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none filter blur-[1px]">
              {/* WhatsApp node */}
              <div className="absolute top-[20%] left-[8%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                WhatsApp API
              </div>
              {/* Widget node */}
              <div className="absolute top-[15%] right-[10%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Web Widget
              </div>
              {/* Chat bubble icon node */}
              <div className="absolute top-[35%] left-[25%] bg-white/70 border border-slate-200 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                💬
              </div>
              {/* Checkmark icon node */}
              <div className="absolute top-[40%] left-[10%] bg-white/70 border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                ✓
              </div>
              {/* FAQ node */}
              <div className="absolute top-[42%] right-[15%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Knowledge Base
              </div>
              {/* Lead captured node */}
              <div className="absolute bottom-[40%] left-[5%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Lead Captured
              </div>
              {/* Support node */}
              <div className="absolute bottom-[38%] right-[8%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                24/7 Support
              </div>
              {/* Inbox node */}
              <div className="absolute bottom-[22%] left-[45%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Shared Inbox
              </div>
              {/* Facebook node */}
              <div className="absolute bottom-[12%] left-[20%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
                Messenger
              </div>
              {/* Instagram node */}
              <div className="absolute bottom-[12%] right-[12%] bg-white/70 border border-slate-200 px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-slate-700">
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
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-6 text-left lg:order-2 order-1"
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border"
              style={{
                borderColor: "rgba(37,99,235,0.2)",
                color: "#2563EB",
                background: "rgba(37,99,235,0.05)"
              }}
            >
              Chat AI Agent
            </span>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Engage 24/7, <span className="gradient-text">Capture Leads.</span>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              Deploy smart chat agents across your website, WhatsApp, and social media
              channels. Automate customer support and resolve FAQs in milliseconds.
            </p>
            
            <p className="text-slate-600 text-base leading-relaxed max-w-xl">
              Qualify prospects with interactive questionnaires, collect documents, and route
              complex support queries to live agents seamlessly using our shared inbox.
            </p>

            <div className="pt-2">
              <motion.button
                onClick={handleContact}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-full font-bold text-white text-sm border-none cursor-pointer shadow-lg shadow-blue-500/20"
                style={{ background: "var(--gg)" }}
              >
                Contact Us
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
