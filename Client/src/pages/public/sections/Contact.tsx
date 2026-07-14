import { Reveal } from "./utils";
import { ContactForm } from "./ContactForm";

const CONTACT_PHONE_RAW = import.meta.env.VITE_CONTACT_PHONE_RAW || '917065990307';

export function Contact() {
  return (
    <section id="contact" className="section-box white">
      <div className="section-pad relative overflow-hidden">
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(37,99,94,0.05), transparent 70%)", pointerEvents: "none" }} />
        <div className="relative" style={{ zIndex: 1 }}>
          <Reveal className="text-center mb-16 space-y-4">
            <span className="tag px-4 py-1.5 rounded-full inline-block" style={{ color: "#ffffff", background: "var(--gg)" }}>Contact Us</span>
            <h2 className="font-extrabold tracking-tight mt-4" style={{ fontSize: "clamp(26px,3.5vw,44px)", color: "#0a0a0a" }}>Get In Touch</h2>
            <p style={{ color: "#475569", fontSize: 16 }}>Tell us about your needs. Our team will get back within 24 hours.</p>
          </Reveal>
          <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
            <Reveal from="left">
              <div className="rounded-3xl p-8 sm:p-10" style={{ background: "linear-gradient(135deg, rgba(37,99,235,.04), rgba(16,185,129,.03), #ffffff)", border: "1px solid rgba(16,185,129,.16)", boxShadow: "0 0 60px rgba(16,185,129,.05), 0 40px 80px rgba(0,0,0,.05)" }}>
                <ContactForm />
                <div style={{ marginTop: 24, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, borderTop: "1px solid rgba(37,99,235,.10)" }}>
                  <span style={{ fontSize: 14, color: "#0a0a0a" }}>Or chat directly on</span>
                  <a href={`https://wa.me/${CONTACT_PHONE_RAW}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: "rgba(37,211,102,.1)", border: "1px solid rgba(37,211,102,.25)", color: "#25d366", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal from="right" delay={0.1}>
              <div className="space-y-6">
                <div className="rounded-2xl p-6" style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(37, 99, 235, 0.14)", boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", marginBottom: 14 }}>Why businesses choose Autoniv</h3>
                  <div className="space-y-4">
                    {[{ icon: "⚡", title: "2-min setup", desc: "No code, no engineers. Describe your agent and go live instantly." },
                      { icon: "🌍", title: "20+ languages", desc: "Serve customers in their native language across India and worldwide." },
                      { icon: "📊", title: "Real-time analytics", desc: "Live dashboards with call logs, transcripts, and conversion scores." },
                      { icon: "🔗", title: "50+ integrations", desc: "Plugs into your existing CRM, scheduling tools, and APIs." }].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.55 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-6" style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(37, 99, 235, 0.14)", boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", marginBottom: 12 }}>What happens next?</h3>
                  {[{ n: "1", t: "We review your message within 24 hours" }, { n: "2", t: "Schedule a 15-min discovery call" }, { n: "3", t: "Get a custom pricing plan for your use case" }].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: i < 2 ? 12 : 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#2563EB", flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>{s.n}</div>
                      <span style={{ fontSize: 13, color: "#475569" }}>{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
