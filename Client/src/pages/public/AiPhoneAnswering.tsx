import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const ANSWERING_STATS = [
  { value: "0", label: "Missed Calls", description: "Answer 100% of incoming callers instantly, day or night" },
  { value: "100+", label: "Concurrent Lines", description: "Never give a busy signal to potential customers" },
  { value: "70%", label: "Cost Savings", description: "Fraction of the cost of traditional live answering services" },
  { value: "100%", label: "Spam Protection", description: "Filter out robocalls, telemarketers, and fake leads" },
];

const ANSWERING_FEATURES = [
  {
    icon: "📞",
    title: "Always-On 24/7 Front Desk",
    description: "Never miss an AFTER-HOURS inquiry. The AI receptionist answers instantly, records customer details, and books appointments.",
  },
  {
    icon: "🛡️",
    title: "Robocall & Spam Filtering",
    description: "Blocks automated spam bots, scammers, and telemarketers before they tie up your phone lines or waste staff time.",
  },
  {
    icon: "🔀",
    title: "Smart Department Routing",
    description: "Ask callers for their intent and route calls dynamically to Sales, Billing, Emergency Support, or specific staff members.",
  },
  {
    icon: "💬",
    title: "Instant SMS Follow-up",
    description: "Automatically send text messages with website links, payment portals, or booking calendars right after a phone call.",
  },
  {
    icon: "📋",
    title: "Real-time Call Summaries",
    description: "Get structured email or SMS notifications containing caller name, phone number, summary notes, and action items.",
  },
  {
    icon: "🌐",
    title: "Multi-Language Receptionist",
    description: "Automatically detects whether a caller speaks English, Spanish, French, Hindi, or 20+ other languages and adapts instantly.",
  },
];

const ANSWERING_FAQS = [
  {
    question: "Can I keep my current business phone number?",
    answer: "Yes! You simply set up conditional call forwarding (e.g. forward when busy or unanswered) from your current telecom provider to your Autoniv AI number.",
  },
  {
    question: "What happens if a caller has an urgent emergency?",
    answer: "You can configure immediate live transfer rules so high-priority or urgent callers get patched directly to your cell phone or duty manager.",
  },
  {
    question: "How does the AI receptionist handle caller name and contact details?",
    answer: "The AI asks callers to spell their name or confirm their callback number if needed, transcribing everything into clean, structured digital leads.",
  },
];

export function AiPhoneAnswering() {
  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #F0FDF4 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="AI Phone Answering" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                24/7 Virtual <GradientText>AI Phone Receptionist</GradientText>
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Never miss another valuable call or lead. Let AI answer calls, filter spam, take detailed messages, and route urgent inquiries instantly.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Try AI Answering Free →
                </Link>
                <Link to="/pricing/voice-assistance" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  View Plans & Pricing
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {ANSWERING_STATS.map((st, i) => (
              <Reveal key={i} delay={i * 100}>
                <StatCard value={st.value} label={st.label} description={st.description} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Demo Box */}
      <section style={{ padding: '80px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <SectionLabel text="How It Works" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Seamless Front-Desk Automation</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <div style={{ background: '#F8FAFC', padding: 28, borderRadius: 20, border: `1px solid ${HAIRLINE}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>1</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Forward Unanswered Calls</h3>
                <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>Forward your existing business line when busy or after hours to your assigned Autoniv virtual number.</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 28, borderRadius: 20, border: `1px solid ${HAIRLINE}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>2</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>AI Greets & Assists Caller</h3>
                <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>Your custom AI receptionist greets callers in your company name, answers FAQs, and qualifies requirements.</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 28, borderRadius: 20, border: `1px solid ${HAIRLINE}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>3</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Receive Structured Lead Alert</h3>
                <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>Instantly get full transcripts, caller intent tags, and audio recordings delivered straight to your email or CRM.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '90px 24px', background: '#FAFBFD' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 60px' }}>
              <SectionLabel text="Reception Capabilities" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Complete Control Over Your Phone Front-Desk</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {ANSWERING_FEATURES.map((feat, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: SURFACE, borderRadius: 20, padding: 32, border: `1px solid ${HAIRLINE}`,
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
      <section style={{ padding: '90px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <SectionLabel text="Frequently Asked Questions" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Phone Reception FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ANSWERING_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Stop Missing High-Value Client Calls</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Deploy your 24/7 AI Phone Answering service in 5 minutes.</p>
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
