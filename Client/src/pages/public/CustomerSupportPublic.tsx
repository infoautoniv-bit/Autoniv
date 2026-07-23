import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const SUPPORT_STATS = [
  { value: "80%", label: "FAQ Deflection Rate", description: "Instantly resolve routine customer questions" },
  { value: "70%", label: "Support Cost Reduction", description: "Lower operations expenditure per ticket" },
  { value: "<5s", label: "Average First Response", description: "Eliminate customer queue wait times" },
  { value: "98%", label: "Customer Satisfaction", description: "Consistently high CSAT ratings across channels" },
];

const SUPPORT_FEATURES = [
  {
    icon: "📚",
    title: "Instant Knowledge Base Sync",
    description: "Connect your Help Center, Zendesk, Notion, or internal documentation for automatic AI training.",
  },
  {
    icon: "🌐",
    title: "Omnichannel Support Suite",
    description: "Deliver unified customer support across Voice Calls, Web Chat, WhatsApp, Email, and Social Direct Messages.",
  },
  {
    icon: "🏷️",
    title: "Automated Ticket Triage",
    description: "Tag, categorize, and score ticket urgency automatically before escalating to appropriate support tiers.",
  },
  {
    icon: "🔍",
    title: "Order & Account Lookup",
    description: "Integrate APIs to let AI check order statuses, shipping updates, refund eligibility, or subscription details live.",
  },
  {
    icon: "🤝",
    title: "Seamless Human Handoff",
    description: "When complex issues arise, transfer to human agents with full conversation summaries and sentiment context.",
  },
  {
    icon: "📊",
    title: "CSAT & Analytics Dashboard",
    description: "Monitor issue resolution rates, agent performance metrics, sentiment trends, and customer feedback.",
  },
];

const SUPPORT_FAQS = [
  {
    question: "Can Autoniv integrate with my existing ticketing software like Zendesk or Freshdesk?",
    answer: "Yes! Autoniv connects with popular support tools like Zendesk, Freshdesk, Intercom, Salesforce Service Cloud, and custom REST APIs.",
  },
  {
    question: "How does the AI handle negative or frustrated customers?",
    answer: "The AI monitors sentiment analysis in real time. If anger or frustration is detected, it switches to empathetic messaging and immediately flags a human supervisor.",
  },
];

export function CustomerSupportPublic() {
  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="Customer Support AI" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                AI-Powered <GradientText>Customer Support Automation</GradientText>
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Scale support 24/7 across Voice and Chat. Resolve 80% of customer questions instantly while cutting operations costs by 70%.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Start Free Trial →
                </Link>
                <Link to="/pricing" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  View Plans
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {SUPPORT_STATS.map((st, i) => (
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
              <SectionLabel text="Support Intelligence" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Built to Resolve Issues, Not Just Answer</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {SUPPORT_FEATURES.map((feat, i) => (
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
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Customer Support AI FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SUPPORT_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Elevate Your Customer Experience Today</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Deploy AI Support in minutes. 100 free conversations included.</p>
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
