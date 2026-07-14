import { VOICE_ADDONS, CHAT_ADDONS } from "./data";

function AddonGrid({ items }: { items: typeof VOICE_ADDONS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {items.map((addon) => (
        <div
          key={addon.id}
          className="rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(34,197,94,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              {addon.icon}
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}
            >
              {addon.category === "recurring" ? "Monthly" : "One-time"}
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-base mb-2" style={{ color: "#0a0a0a" }}>{addon.title}</h3>
          <p className="text-xs sm:text-sm mb-3" style={{ color: "#475569" }}>{addon.description}</p>
          <div className="font-bold text-sm" style={{ color: "#16a34a", fontFamily: "'JetBrains Mono', monospace" }}>
            {addon.price}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AddOns() {
  return (
    <section id="addons" className="section-box white">
      <div className="section-pad relative overflow-hidden">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="tag px-4 py-1.5 rounded-full inline-block" style={{ color: "#ffffff", background: "var(--gg)" }}>Add-Ons</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4" style={{ color: "#0a0a0a" }}>
            Power-ups
          </h2>
          <p className="text-sm sm:text-base max-w-lg mx-auto mt-3" style={{ color: "#475569" }}>
            Stack only what you need. Available on all paid Autoniv plans.
          </p>
        </div>

        {/* Voice Add-Ons */}
        <div className="mb-10 sm:mb-14">
          <h3 className="text-lg font-bold mb-6" style={{ color: "#0a0a0a" }}>
            📞 Voice
          </h3>
          <AddonGrid items={VOICE_ADDONS} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(34,197,94,0.15)", marginBottom: "2.5rem" }} />

        {/* Chat Add-Ons */}
        <div>
          <h3 className="text-lg font-bold mb-6" style={{ color: "#0a0a0a" }}>
            💬 Chat
          </h3>
          <AddonGrid items={CHAT_ADDONS} />
        </div>

      </div>
    </section>
  );
}