import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const HEALTHCARE_STATS = [
  { value: "HIPAA", label: "Security Compliant", description: "Encrypted data handling & strict privacy guardrails" },
  { value: "24/7", label: "Patient Intake", description: "Schedule appointments & answer clinic FAQs around the clock" },
  { value: "50%", label: "Reduction in No-Shows", description: "Automated SMS & voice appointment confirmation calls" },
  { value: "80%", label: "Routine Call Deflection", description: "Frees front-desk staff to focus on in-clinic patient care" },
];

const HEALTHCARE_FEATURES = [
  {
    icon: "🏥",
    title: "Patient Appointment Scheduling",
    description: "AI receptionist handles doctor calendar availability, patient slot bookings, and rescheduling requests 24/7.",
  },
  {
    icon: "💊",
    title: "Prescription Refill & Inquiry Routing",
    description: "Collect patient prescription requests, verify pharmacy details, and queue requests directly for medical staff review.",
  },
  {
    icon: "📋",
    title: "Pre-Visit Intake & Screening",
    description: "Gather basic symptom details, insurance provider info, and visit reasons prior to the patient arriving at the clinic.",
  },
  {
    icon: "🔔",
    title: "Appointment Reminders & Confirmations",
    description: "Send automated appointment reminder calls and text messages with 1-click confirmation or rescheduling.",
  },
  {
    icon: "🔒",
    title: "HIPAA-Aligned Enterprise Security",
    description: "End-to-end encryption for patient audio, transcripts, and metadata stored in compliance with healthcare standards.",
  },
  {
    icon: "🚨",
    title: "Emergency Triage & Handoff",
    description: "Detect urgent medical keywords and instantly instruct callers to dial emergency services or patch directly to on-call doctors.",
  },
];

const HEALTHCARE_FAQS = [
  {
    question: "Is Autoniv AI compliant with HIPAA privacy guidelines?",
    answer: "Yes. Autoniv offers BAA execution, end-to-end encryption, strict role-based access control, and secure data storage for healthcare organizations.",
  },
  {
    question: "How does the AI handle medical emergencies?",
    answer: "Our healthcare AI includes strict triage protocol rules. If a patient mentions chest pain, severe bleeding, or acute distress, the AI immediately directs them to 911 or patches emergency numbers.",
  },
];

export function HealthcareIndustry() {
  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #F0F9FF 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="Healthcare Industry AI" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Secure <GradientText>AI Voice & Chat</GradientText> for Healthcare Clinics
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Automate patient appointment bookings, phone reception, intake screening, and prescription inquiries with HIPAA-aligned AI.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Deploy Healthcare AI →
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
            {HEALTHCARE_STATS.map((st, i) => (
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
              <SectionLabel text="Clinical Workflows" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Built for Medical Clinics & Practice Front Desks</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {HEALTHCARE_FEATURES.map((feat, i) => (
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
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Healthcare AI FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {HEALTHCARE_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Transform Patient Access with Healthcare AI</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Schedule a demo or set up your clinic receptionist today.</p>
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
