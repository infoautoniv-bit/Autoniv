import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const REAL_ESTATE_STATS = [
  { value: "3X", label: "More Qualified Leads", description: "Instantly call Zillow & website leads within 15 seconds" },
  { value: "24/7", label: "Viewing Booking", description: "Schedule open house & property viewings automatically" },
  { value: "85%", label: "Lead Response Speedup", description: "Never lose a buyer to slow agent response times" },
  { value: "100%", label: "CRM Integration", description: "Direct sync with Follow Up Boss, HubSpot, & KvCORE" },
];

const REAL_ESTATE_FEATURES = [
  {
    icon: "🏠",
    title: "Instant Buyer & Renter Qualification",
    description: "Qualify pre-approval status, target budget, move-in timelines, and preferred neighborhoods over voice or text.",
  },
  {
    icon: "🔑",
    title: "Automated Property Tour Scheduling",
    description: "AI syncs agent availability and automatically books home viewings with buyers directly into your calendar.",
  },
  {
    icon: "📲",
    title: "Zillow & Facebook Lead Speed-to-Call",
    description: "When a new lead fills out a form on Zillow, Realtor.com, or Facebook, AI calls them within 15 seconds.",
  },
  {
    icon: "📋",
    title: "Property Listing Q&A",
    description: "Answers buyer questions about HOA fees, square footage, school districts, and parking features 24/7.",
  },
  {
    icon: "🔄",
    title: "Past Client Nurturing Calls",
    description: "Conduct automated check-in calls for home valuation updates, anniversary greetings, and market report check-ins.",
  },
  {
    icon: "💼",
    title: "Agent Handoff & Hot Transfers",
    description: "Hot leads ready for an offer or direct consultation get transferred immediately to the listing agent's mobile phone.",
  },
];

const REAL_ESTATE_FAQS = [
  {
    question: "Can the AI answer specific questions about my active property listings?",
    answer: "Yes! You can link your MLS feed, IDX website, or property brochures. The AI pulls listing specs (bedrooms, baths, HOA, price) instantly.",
  },
  {
    question: "How does the AI transfer hot leads to my phone?",
    answer: "When a buyer meets your pre-qualification thresholds, the AI says 'Let me transfer you straight to the lead agent' and patches the call directly to your mobile.",
  },
];

export function RealEstateIndustry() {
  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #F0FDF4 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="Real Estate Industry AI" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                AI Voice & Chat Solutions for <GradientText>Real Estate Brokerages</GradientText>
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Qualify property buyers 24/7, book home viewings automatically, and respond to new leads in 15 seconds with custom Real Estate AI.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Deploy Real Estate AI →
                </Link>
                <Link to="/case-studies" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  See Case Studies
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {REAL_ESTATE_STATS.map((st, i) => (
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
              <SectionLabel text="Brokerage Automation" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Tailored Workflows for Realtors & Agents</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {REAL_ESTATE_FEATURES.map((feat, i) => (
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
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Real Estate AI FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REAL_ESTATE_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Close More Deals with Real Estate AI</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Deploy your dedicated real estate AI assistant in 10 minutes.</p>
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
