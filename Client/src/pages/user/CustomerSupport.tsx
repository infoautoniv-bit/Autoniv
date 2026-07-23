import { useState } from 'react';
import { motion } from 'framer-motion';
import { supportService } from '../../services/api';
import ActiveAddOnsBanner from '../../components/ActiveAddOnsBanner';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };

const FAQ_ITEMS = [
  {
    q: 'How do I create a new AI agent?',
    a: 'Go to Dashboard → Create Agent. Choose a template (Dental, Real Estate, etc.) or build a custom agent. Configure the voice, prompt, and phone number, then click Create.',
  },
  {
    q: 'How do I assign a phone number to my agent?',
    a: 'Open your agent from My Agents → click Config → scroll to Phone Number section. You can buy a new number or link your existing Twilio number.',
  },
  {
    q: 'Why isn\'t my agent answering calls?',
    a: 'Check that: 1) The agent is assigned a phone number, 2) The phone number status is "active", 3) Your Twilio balance is sufficient, 4) The Vapi assistant ID is linked correctly.',
  },
  {
    q: 'How do I change the voice of my agent?',
    a: 'Open your agent → Voice tab → select a voice from the grid. Click the play button to preview. Languages and voices are grouped by provider (ElevenLabs, Deepgram, Azure, etc.).',
  },
  {
    q: 'How does billing work?',
    a: 'You are charged per minute for Vapi calls and per message for custom engine calls. Check User Billing for usage breakdown. Add-ons are billed monthly.',
  },
  {
    q: 'Can I use my own Twilio number?',
    a: 'Yes. Go to Agent Config → Phone Number → enter your Twilio Account SID and Auth Token. The system will handle call routing automatically.',
  },
  {
    q: 'How do I view my leads and call logs?',
    a: 'Go to My Leads for captured caller information. Go to My Calls for detailed call logs with duration, cost, and transcript.',
  },
  {
    q: 'What languages are supported?',
    a: 'English, Spanish, French, German, Italian, Portuguese, Hindi, Arabic, Japanese, and Korean. Each voice has language-specific variants.',
  },
];

const CONTACT_OPTIONS = [
  { icon: '📧', label: 'Email', value: import.meta.env.VITE_CONTACT_EMAIL || 'support@autoniv.com', action: `mailto:${import.meta.env.VITE_CONTACT_EMAIL || 'support@autoniv.com'}` },
  { icon: '💬', label: 'Live Chat', value: 'Available 9 AM – 6 PM IST', action: null },
  { icon: '📞', label: 'Phone', value: import.meta.env.VITE_CONTACT_PHONE || '+91 98765 43210', action: `tel:${import.meta.env.VITE_CONTACT_PHONE_RAW || '917065990307'}` },
];

export function CustomerSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = ticketForm.name.trim();
    const trimmedEmail = ticketForm.email.trim();
    const trimmedSubject = ticketForm.subject.trim();
    const trimmedMessage = ticketForm.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return;
    }

    setLoading(true);
    try {
      await supportService.submit({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTicketForm({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    } catch (err: any) {
      console.error('Support ticket error:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Customer Support</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          We're here to help. Find answers or reach out to our team.
        </p>
      </motion.div>

      {/* Active Priority Support Add-On Banner */}
      <motion.div {...fadeUp} className="mb-6">
        <ActiveAddOnsBanner filterIds={['priority-support']} />
      </motion.div>

      {/* Contact Cards */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {CONTACT_OPTIONS.map((opt) => (
          <motion.div
            key={opt.label}
            variants={fadeUp}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4 hover:border-[var(--primary)]/30 transition-colors"
          >
            <span className="text-2xl">{opt.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">{opt.label}</p>
              {opt.action ? (
                <a href={opt.action} className="text-xs text-[var(--primary)] hover:underline truncate block">
                  {opt.value}
                </a>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">{opt.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span className="text-sm font-medium text-[var(--text)]">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform flex-shrink-0 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-4 pb-3"
                  >
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Submit Ticket Form */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">Submit a Ticket</h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            {submitted ? (
              <div className="text-center py-8">
                <span className="text-3xl mb-3 block">✅</span>
                <p className="text-sm font-semibold text-[var(--text)]">Ticket Submitted!</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--s1)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit Ticket'}
                </button>
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
