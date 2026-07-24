import React from "react";
import { motion } from "framer-motion";
import { WordReveal } from "../anim";
import { AVATARS } from "./constants";

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const heroVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.10, delayChildren: 0.02 } },
};

interface HeroContentProps {
  openAuth: (m: "login" | "register") => void;
  reduced: boolean;
  lowPower: boolean;
}

// Compositor-friendly pulse ring
function PulseRing({ color }: { color: string }) {
  return (
    <motion.span
      aria-hidden
      className="absolute inset-0 rounded-[inherit] pointer-events-none"
      style={{ background: color, willChange: "transform, opacity" }}
      animate={{ scale: [1, 1.25, 1.25], opacity: [0.35, 0, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

export const HeroContent = React.memo(function HeroContent({
  openAuth,
  reduced,
  lowPower,
}: HeroContentProps) {
  return (
    <motion.div
      variants={heroVariants}
      initial="hidden"
      animate="show"
      className="lg:col-span-7 flex flex-col justify-center text-left space-y-4 lg:space-y-6 z-10 order-1 lg:order-1"
    >
      <motion.div variants={fadeUp}>
        <motion.span
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          whileHover={reduced ? undefined : { scale: 1.04 }}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full tag text-xs sm:text-sm overflow-hidden"
          style={{
            color: "#2563EB",
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(37,99,235,0.3)",
          }}
        >
          <motion.span
            animate={lowPower ? undefined : { rotate: [0, 15, -10, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
            className="inline-block"
          >
            ✦
          </motion.span>
          AI Voice • Chat Solutions
          {!lowPower && (
            <motion.span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(110deg, transparent 40%, rgba(37,99,235,0.25) 50%, transparent 60%)",
                willChange: "transform",
              }}
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
          )}
        </motion.span>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h1
          className="font-extrabold leading-[1.08] tracking-tight"
          style={{
            fontSize: "clamp(32px,8vw,66px)",
            color: "#0a0a0a",
          }}
        >
          <WordReveal text="Your Business Never Stops." /> <br />
          <WordReveal
            text="Neither Does Your AI Team."
            wordClassName="hero-gradient-text animated-gradient"
            delay={0.35}
          />
        </h1>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="text-[#475569] text-sm sm:text-base lg:text-lg leading-relaxed max-w-[560px] m-0"
      >
        Deploy AI Voice Agents and AI Chatbots that handle calls,
        chats, and more – 24/7. Qualify leads, book appointments,
        answer questions and delight customers automatically.
      </motion.p>

      {/* Buttons - Mobile Optimized */}
      <motion.div variants={fadeUp} className="mt-4 hero-cta-row flex flex-col gap-4 w-full" style={{ opacity: 1, overflow: "visible" }}>
        {/* Row 1: Buttons */}
        <div className="hero-btn-row flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full" style={{ overflow: "visible" }}>
          <motion.button
            onClick={() => openAuth("register")}
            whileHover={reduced ? undefined : { y: -3, scale: 1.02, boxShadow: "0 10px 28px rgba(16,185,129,0.35)" }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white relative overflow-hidden cursor-pointer"
            style={{
              background: "var(--gg)",
              minHeight: "48px",
              fontSize: "15px",
              boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              border: "none",
            }}
          >
            {!lowPower && <PulseRing color="rgba(16,185,129,0.45)" />}
            <motion.svg
              className="w-4 h-4 relative"
              fill="currentColor"
              viewBox="0 0 24 24"
              animate={lowPower ? undefined : { rotate: [0, 12, -8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            >
              <path d="M13 2L3 14h6l-1 8 10-12h-6l1-8z" />
            </motion.svg>
            <span className="relative">Book a Free Demo</span>
            <motion.svg
              className="w-4 h-4 relative"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              whileHover={{ x: 4 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </motion.svg>
          </motion.button>

          <motion.button
            onClick={() => openAuth("register")}
            whileHover={reduced ? undefined :
              { y: -3, scale: 1.02, boxShadow: "0 10px 24px rgba(37,99,235,0.18)" }}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            className="font-bold flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl relative overflow-hidden cursor-pointer backdrop-blur-md"
            style={{
              background: "rgba(37,99,235,0.08)",
              color: "#2563EB",
              border: "1px solid rgba(37,99,235,0.25)",
              minHeight: "48px",
              fontSize: "15px",
            }}
          >
            <svg className="w-4 h-4" fill="#2563EB" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Live Demo
          </motion.button>
        </div>

        {/* Row 2: Avatars + rating */}
        <motion.div
          className="flex items-center gap-3 flex-wrap w-full"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.7 } } }}
        >
          <div className="flex -space-x-2 shrink-0">
            {AVATARS.map((av, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.4, x: -8 },
                  show: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.4, ease: "backOut" } },
                }}
                whileHover={{ y: -3, scale: 1.12, zIndex: 10 }}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden"
                style={{ zIndex: 5 - i }}
              >
                <img
                  src={av.img}
                  alt={`User ${av.alt}`}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding="async"
                />
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, k) => (
                <motion.svg
                  key={k}
                  variants={{
                    hidden: { opacity: 0, scale: 0, rotate: -90 },
                    show: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.35, ease: "backOut" } },
                  }}
                  className="w-4 h-4 shrink-0"
                  style={{ fill: "#f59e0b" }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
              ))}
            </div>
            <p className="text-xs text-[#475569] m-0">
              Trusted by{" "}
              <span className="font-semibold text-[var(--text)]">100+</span>{" "}
              businesses
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
