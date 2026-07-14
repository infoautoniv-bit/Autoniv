import { useState } from "react";
import { contactService } from "../../../services/api";

const CONTACT_PHONE_RAW = import.meta.env.VITE_CONTACT_PHONE_RAW || '917065990307';

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const openWA = () => {
    const lines = ["Hello! I have an inquiry via Contact Us form:", "", `Name: ${name}`, `Email: ${email}`, phone ? `Phone: ${phone}` : "", company ? `Company: ${company}` : "", "", `Message: ${message}`].filter(Boolean);
    window.open(`https://wa.me/${CONTACT_PHONE_RAW}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await contactService.submit({ name, email, phone, company, message });
      openWA();
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  const inputStyle = { background: "rgba(37,99,235,.03)", border: "1px solid rgba(37,99,235,.18)", color: "#0a0a0a" } as React.CSSProperties;
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(37,99,235,.5)");
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.target.style.borderColor = "rgba(37,99,235,.18)");
  if (submitted) return (
    <div className="text-center py-8 space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.25)" }}>
        <svg className="w-7 h-7" fill="none" stroke="#10B981" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h3 className="text-xl font-bold" style={{ color: "#0a0a0a" }}>Thank you!</h3>
      <p className="text-sm" style={{ color: "#52525b" }}>Your details have been sent to our team on WhatsApp. We'll get back to you within 24 hours.</p>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ label: "Full Name *", type: "text", val: name, set: setName, ph: "John Doe", req: true },
          { label: "Email *", type: "email", val: email, set: setEmail, ph: "you@company.com", req: true }].map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#52525b" }}>{f.label}</label>
            <input type={f.type} required={f.req} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder-black/30" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ label: "Phone", type: "tel", val: phone, set: setPhone, ph: "9876543210" },
          { label: "Company", type: "text", val: company, set: setCompany, ph: "Your Company" }].map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#52525b" }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder-black/30" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#52525b" }}>Message *</label>
        <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your needs — team size, call volume, use case..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none placeholder-black/30" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
      </div>
      {error && <p className="text-sm font-medium" style={{ color: "#ff4d4d" }}>{error}</p>}
      <button type="submit" disabled={loading}
        className="btn-cta btn-responsive-lg w-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "var(--gg)", color: "#ffffff" }}>
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </>
        ) : (
          <>
            Send Message
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </button>
      <p className="text-center text-[11px]" style={{ color: "#a1a1aa" }}>No spam. We'll only reach out to discuss your requirements.</p>
    </form>
  );
}
