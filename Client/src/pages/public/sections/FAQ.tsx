import { useState } from "react";
import { FAQItem } from "./FAQItem";
import { MotionReveal } from "./anim";

const faqCategories = [
  { id: "all", label: "All", icon: "📋" },
  { id: "general", label: "General", icon: "💡" },
  { id: "setup", label: "Setup", icon: "⚡" },
  { id: "features", label: "Features", icon: "🚀" },
  { id: "pricing", label: "Pricing", icon: "💰" },
];

const faqs = [
  {
    q: "What exactly does Autoniv do?",
    a: "Autoniv deploys AI voice agents that handle your business phone calls 24/7. Our AI agents answer inbound calls, make outbound calls, qualify leads, book appointments, follow up with customers, and automate repetitive conversations—without increasing your team size.",
    category: "general",
  },
  {
    q: "Is this just another IVR or phone bot?",
    a: "No. Unlike traditional IVR systems that rely on menus and button presses, Autoniv's AI voice agents hold natural, human-like conversations. They understand context, answer unexpected questions, and respond intelligently just like a trained customer service representative.",
    category: "general",
  },
  {
    q: "How fast can we go live?",
    a: "Most businesses are live within 24 hours. Our team handles voice setup, agent configuration, workflow customization, and CRM integration, allowing you to start using your AI voice agent quickly without complex implementation.",
    category: "setup",
  },
  {
    q: "Will our customers know they're talking to AI?",
    a: "Our AI voice agents are designed to sound natural, professional, and conversational. If a customer requests a human or the conversation requires human assistance, the AI transfers the call seamlessly while sharing the full conversation context.",
    category: "features",
  },
  {
    q: "What happens if the AI doesn't know the answer?",
    a: "When the AI encounters a question outside its knowledge or requires human intervention, it immediately transfers the call to your team. The agent passes along the conversation history so your staff can continue without asking customers to repeat themselves.",
    category: "features",
  },
  {
    q: "Which tools does Autoniv integrate with?",
    a: "Autoniv integrates with leading CRMs, calendars, and business phone systems. Leads are automatically captured, appointments are scheduled in real time, customer information is synced instantly, and manual data entry is eliminated.",
    category: "features",
  },
  {
    q: "What types of businesses use Autoniv?",
    a: "Autoniv serves healthcare providers, real estate agencies, financial services, insurance companies, startups, enterprises, service businesses, agencies, and SMBs. Every AI voice agent is customized to match your industry's workflows and customer conversations.",
    category: "general",
  },
  {
    q: "How much can Autoniv reduce call center costs?",
    a: "Businesses typically reduce call-handling costs by up to 70% compared to traditional call centers by eliminating staffing overhead, repetitive manual work, training costs, and inconsistent customer experiences. Contact us for a custom quote based on your call volume.",
    category: "pricing",
  },
  {
    q: "Can I monitor what my AI agent says?",
    a: "Yes. Every call is automatically recorded, transcribed, and available in your real-time dashboard. You can review conversations, monitor performance, identify trends, and continuously improve your AI agent using detailed analytics.",
    category: "features",
  },
  {
    q: "How do I get started?",
    a: "Book a free 30-minute strategy call with the Autoniv team. We'll understand your business, map your call workflows, identify automation opportunities, and demonstrate how a customized AI voice agent can improve your customer experience—no obligation and no credit card required.",
    category: "setup",
  },
];

export function FAQ() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFaqs =
    activeCategory === "all"
      ? faqs
      : faqs.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="section-box tint" style={{ background: "#f8fafc" }}>
      {/* Background pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 40%, transparent 100%)",
        }}
      />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-20 left-[10%] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.04), transparent 70%)" }}
      />
      <div className="pointer-events-none absolute bottom-20 right-[10%] w-[350px] h-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.03), transparent 70%)" }}
      />

      <div className="relative z-10 py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <MotionReveal variant="blurUp" className="text-center mb-12">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase mb-6"
              style={{
                color: "#2563EB",
                background: "rgba(37,99,235,0.06)",
                border: "1px solid rgba(37,99,235,0.15)",
              }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6">
                <circle cx="3" cy="3" r="3" fill="#2563EB" />
              </svg>
              FAQ
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-4"
              style={{ color: "#0a0a0a" }}
            >
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-sm sm:text-base max-w-lg mx-auto mt-3" style={{ color: "#64748b" }}>
              Everything you need to know about Autoniv
            </p>
          </MotionReveal>

          {/* Category filters */}
          <MotionReveal variant="fadeUp" className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
                style={{
                  background: activeCategory === cat.id
                    ? "linear-gradient(135deg, #2563EB, #10B981)"
                    : "rgba(255,255,255,0.8)",
                  color: activeCategory === cat.id ? "#ffffff" : "#64748b",
                  border: activeCategory === cat.id
                    ? "none"
                    : "1px solid rgba(37,99,235,0.08)",
                  boxShadow: activeCategory === cat.id
                    ? "0 4px 16px rgba(16,185,129,0.25)"
                    : "0 1px 4px rgba(0,0,0,0.02)",
                }}
              >
                <span className="text-sm">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </MotionReveal>

          {/* FAQ list */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <FAQItem
                key={faq.q}
                question={faq.q}
                answer={faq.a}
                index={i}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <MotionReveal variant="fadeUp" className="text-center mt-12">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Still have questions?{" "}
              <a
                href="#contact"
                className="font-semibold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                Talk to our team →
              </a>
            </p>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
