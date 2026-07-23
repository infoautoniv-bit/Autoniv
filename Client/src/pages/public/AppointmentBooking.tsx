import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const BOOKING_STATS = [
  { value: "0", label: "Double Bookings", description: "Real-time 2-way sync prevents slot conflicts" },
  { value: "3.5X", label: "More Booked Appointments", description: "Convert callers into confirmed slots instantly on call" },
  { value: "65%", label: "Reduction in No-Shows", description: "Automated multi-channel SMS & WhatsApp reminders" },
  { value: "24/7", label: "Self-Service Booking", description: "Schedule appointments weekends, holidays, & after hours" },
];

const BOOKING_FEATURES = [
  {
    icon: "📅",
    title: "Direct Calendar Synchronization",
    description: "Connect Google Calendar, Outlook, Office 365, or custom booking platforms for instant real-time slot checking.",
  },
  {
    icon: "🎙️",
    title: "Conversational Voice Scheduling",
    description: "Callers can negotiate dates, ask for alternative times, and reschedule appointments directly over a voice call.",
  },
  {
    icon: "💬",
    title: "Instant SMS & WhatsApp Confirmation",
    description: "Automatically trigger calendar invites (.ics files) and instant WhatsApp confirmation messages upon booking.",
  },
  {
    icon: "⏰",
    title: "Smart Automated Reminders",
    description: "Send automated voice calls or WhatsApp reminders 24h and 2h prior to the appointment with 1-click confirmation.",
  },
  {
    icon: "💳",
    title: "Deposit & Payment Collection",
    description: "Optionally send secure payment links during or immediately following the call to lock in high-intent bookings.",
  },
  {
    icon: "🔄",
    title: "Rescheduling & Cancellations",
    description: "Allow clients to self-manage, move, or cancel existing appointments without requiring staff intervention.",
  },
];

const BOOKING_FAQS = [
  {
    question: "Which calendar platforms does Autoniv integrate with?",
    answer: "Autoniv natively integrates with Google Calendar, Microsoft Outlook, Office 365, iCal, and custom webhooks/CRMs like Calendly and HubSpot.",
  },
  {
    question: "Can I customize booking rules and buffer times between slots?",
    answer: "Yes! You can define working hours, minimum notice times, buffer intervals between slots, and maximum daily bookings.",
  },
  {
    question: "How does the AI handle time zones for remote clients?",
    answer: "The AI automatically detects or clarifies the client's time zone during phone calls or chat sessions to eliminate any confusion.",
  },
];

export function AppointmentBooking() {
  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #FAF5FF 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="Appointment Booking" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Automated <GradientText>AI Appointment Scheduling</GradientText> Over Voice & Chat
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Let AI fill your calendar 24/7. Handle scheduling, rescheduling, real-time calendar sync, and automated SMS reminders automatically.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Automate Bookings Free →
                </Link>
                <Link to="/pricing" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  Explore Pricing
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {BOOKING_STATS.map((st, i) => (
              <Reveal key={i} delay={i * 100}>
                <StatCard value={st.value} label={st.label} description={st.description} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '90px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
              <SectionLabel text="Booking Engine" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Smart Calendar Integration & Workflow</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {BOOKING_FEATURES.map((feat, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: '#F8FAFC', borderRadius: 20, padding: 32, border: `1px solid ${HAIRLINE}`,
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)', height: '100%'
                }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{feat.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{feat.title}</h3>
                  <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>{feat.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '90px 24px', background: '#FAFBFD', borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <SectionLabel text="Frequently Asked Questions" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Appointment Booking FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BOOKING_FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 80}>
                <FAQItem question={faq.question} answer={faq.answer} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section style={{ padding: '90px 24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Fill Your Calendar Automatically</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Connect your calendar and launch your AI booking assistant today.</p>
          <Link to="/register" style={{
            background: BRAND, color: '#fff', padding: '16px 36px', borderRadius: 999, fontWeight: 700, fontSize: 16,
            textDecoration: 'none', display: 'inline-block', boxShadow: '0 10px 30px -5px rgba(37,99,235,0.5)'
          }}>
            Get Started Free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
