import { useState } from 'react';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText } from './design';

const TOC_ITEMS = [
  { id: 'overview', title: '1. Overview & Data Controller' },
  { id: 'data-collected', title: '2. Information We Collect' },
  { id: 'data-use', title: '3. How We Use Your Data' },
  { id: 'ai-voice-privacy', title: '4. AI Voice & Transcript Protections' },
  { id: 'telephony-recording', title: '5. Telephony & Call Recordings' },
  { id: 'third-parties', title: '6. Data Sharing & Third-Party Processors' },
  { id: 'international-transfers', title: '7. International Data Transfers' },
  { id: 'data-retention', title: '8. Data Retention Schedules' },
  { id: 'security-measures', title: '9. Security & Compliance (SOC 2 / HIPAA)' },
  { id: 'user-rights', title: '10. Your Privacy Rights (GDPR & CCPA)' },
  { id: 'cookies-policy', title: '11. Cookies & Tracking Preferences' },
  { id: 'updates-contact', title: '12. Updates & Contact DPO' },
];

export function PrivacyPolicy() {
  const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'dpo@autoniv.com';
  const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '+91 70659 90307';
  const CONTACT_WEBSITE = import.meta.env.VITE_CONTACT_WEBSITE || 'Autoniv.com';

  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <PublicNavbar />

      {/* ─── HERO HEADER ─── */}
      <section style={{
        padding: '80px 24px 60px',
        background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFD 100%)',
        borderBottom: `1px solid ${HAIRLINE}`,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel text="LEGAL & COMPLIANCE" />
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: INK,
              marginBottom: 16
            }}>
              Privacy Policy for <GradientText>Autoniv AI Platform</GradientText>
            </h1>
            <p style={{ color: SLATE, fontSize: 15, marginBottom: 24 }}>
              Last updated: <strong>June 24, 2026</strong> · Effective Date: Immediate
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '9px 22px',
                  borderRadius: 999,
                  background: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  color: INK,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
                }}
              >
                🖨️ Print / Save PDF
              </button>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{
                  padding: '9px 22px',
                  borderRadius: 999,
                  background: 'rgba(37,99,235,0.08)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  color: '#2563EB',
                  fontSize: 13.5,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                ✉️ Contact Data Protection Officer
              </a>
            </div>
          </Reveal>

          {/* Privacy Highlights Grid (TL;DR Callouts) */}
          <div style={{ marginTop: 48 }}>
            <Reveal delay={150}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                textAlign: 'left'
              }}>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Bank-Grade Encryption</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    All data is encrypted in transit via TLS 1.3 and at rest via AES-256.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Zero Model Training</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Your private business data is NEVER used to train foundational AI models.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>GDPR & CCPA Compliant</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Full rights to export, access, or delete your personal and business data at any time.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📞</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Telephony & Voice Isolation</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Voice streams and audio logs are processed in isolated secure channels.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT WITH TABLE OF CONTENTS ─── */}
      <section style={{ padding: '60px 24px 100px', background: SURFACE }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 48, alignItems: 'start' }}>

          {/* Sticky Table of Contents Sidebar */}
          <aside className="hidden md:block" style={{
            position: 'sticky',
            top: 100,
            background: '#FAFBFD',
            padding: 24,
            borderRadius: 20,
            border: `1px solid ${HAIRLINE}`,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: INK, textTransform: 'uppercase', fontFamily: MONO, marginBottom: 16, letterSpacing: '0.05em' }}>
              Contents Overview
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TOC_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: activeSection === item.id ? 700 : 500,
                    color: activeSection === item.id ? '#2563EB' : SLATE,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    backgroundColor: activeSection === item.id ? 'rgba(37,99,235,0.08)' : 'transparent'
                  }}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Document Body */}
          <main style={{ color: SLATE, fontSize: 15, lineHeight: 1.8 }}>

            {/* Section 1 */}
            <section id="overview" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                1. Overview & Data Controller
              </h2>
              <p>
                This Privacy Policy explains how <strong>Autoniv</strong> ("Company", "We", "Us", or "Our") collects, uses, stores, and protects personal data and corporate communication telemetry when you access or use the Autoniv software platform, AI voice agents, web chatbots, API endpoints, and associated services (collectively, the "Services").
              </p>
              <p>
                For the purposes of applicable data protection laws (including the EU General Data Protection Regulation 2016/679 "GDPR", the California Consumer Privacy Act "CCPA/CPRA", and the Digital Personal Data Protection Act "DPDP"):
              </p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Data Controller:</strong> Autoniv Technologies, New Delhi, India.</li>
                <li><strong>Data Processor:</strong> When Autoniv processes customer caller data, voice audio streams, or CRM contact lists on behalf of our enterprise subscribers, Autoniv acts as a Data Processor under a Data Processing Addendum (DPA).</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="data-collected" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                2. Information We Collect
              </h2>
              <p>We collect information directly from you, automatically through your platform usage, and via third-party integrations.</p>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 20, marginBottom: 8 }}>A. Account & Profile Information</h3>
              <p>When you register an account or purchase a subscription, we collect:</p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li>Full name, corporate email address, password hash, and phone number.</li>
                <li>Company name, domain, industry vertical, and billing address.</li>
                <li>Payment details processed securely via Stripe/Razorpay (we do not store raw credit card numbers).</li>
              </ul>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 20, marginBottom: 8 }}>B. AI Voice & Conversation Data</h3>
              <p>In operating AI voice agents and web/WhatsApp chatbots on your behalf:</p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li>Real-time speech audio feeds and speech-to-text transcripts generated during inbound/outbound calls.</li>
                <li>Customer metadata provided during calls (e.g., caller name, appointment timestamps, inquiry details).</li>
                <li>Custom knowledge base documentation (PDFs, Word documents, URLs, FAQ sheets) uploaded to train your specific agent persona.</li>
              </ul>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 20, marginBottom: 8 }}>C. Technical & Telemetry Data</h3>
              <p>When interacting with our web applications and telephony servers:</p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li>IP address, device hardware specs, browser user-agent, operating system, and language preferences.</li>
                <li>SIP call headers, call duration, latency metrics, audio packet loss, and connection timestamps.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="data-use" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                3. How We Use Your Data
              </h2>
              <p>We process your data strictly for legitimate operational and business purposes:</p>
              <div style={{ background: '#FAFBFD', padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginBottom: 20 }}>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}><strong>Service Delivery & Execution:</strong> Synthesizing real-time AI responses, executing phone calls, scheduling calendar appointments, and forwarding leads to your CRM.</li>
                  <li style={{ marginBottom: 8 }}><strong>System Performance Tuning:</strong> Analyzing speech-to-text accuracy and latency metrics to ensure call turn-taking latency remains below 300ms.</li>
                  <li style={{ marginBottom: 8 }}><strong>Account Administration & Billing:</strong> Tracking usage minutes, issuing monthly invoices, managing team seats, and sending security updates.</li>
                  <li style={{ marginBottom: 8 }}><strong>Customer Support:</strong> Troubleshooting voice agent prompts, WebRTC connections, or API webhook issues when requested.</li>
                  <li style={{ marginBottom: 0 }}><strong>Legal Compliance & Fraud Prevention:</strong> Preventing telephony spam, fraudulent caller ID spoofing, and ensuring compliance with telecom regulations.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="ai-voice-privacy" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                4. AI Voice & Transcript Protections (Zero Training Guarantee)
              </h2>
              <div style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FDF4 100%)', padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: '0 0 8px' }}>🤖 Strict Private AI Commitment</h3>
                <p style={{ margin: 0, fontSize: 14.5 }}>
                  Autoniv explicitly guarantees that your proprietary business data, customer call audio, voice agent prompt instructions, and chat transcripts are <strong>NEVER used to train, retrain, or improve any public or shared foundation language models</strong> (including OpenAI, Anthropic, or open-source LLMs). All model inferences are isolated and ephemeral.
                </p>
              </div>
              <p>
                When customer audio is processed, speech tokens are converted to text in-memory and discarded post-processing unless call recording is explicitly enabled by your account admin for quality audit purposes.
              </p>
            </section>

            {/* Section 5 */}
            <section id="telephony-recording" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                5. Telephony Data & Call Recordings
              </h2>
              <p>
                When utilizing Autoniv AI voice agents for phone call automation, you (the Customer) are responsible for complying with all local, state, federal, and international call recording consent laws (e.g., two-party consent laws in US states such as California, Florida, and Massachusetts).
              </p>
              <p>
                We provide automated pre-call disclosures (e.g., <em>"This call may be recorded or monitored by an AI virtual assistant for quality purposes"</em>) which can be enabled in your agent settings dashboard.
              </p>
            </section>

            {/* Section 6 */}
            <section id="third-parties" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                6. Data Sharing & Third-Party Processors
              </h2>
              <p>We do NOT sell, rent, or trade personal data to third parties. We share data only with verified sub-processors necessary to operate our infrastructure:</p>

              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, background: SURFACE }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: `2px solid ${HAIRLINE}` }}>
                      <th style={{ padding: 12, textAlign: 'left', color: INK }}>Sub-processor</th>
                      <th style={{ padding: 12, textAlign: 'left', color: INK }}>Purpose</th>
                      <th style={{ padding: 12, textAlign: 'left', color: INK }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <td style={{ padding: 12, fontWeight: 600, color: INK }}>Amazon Web Services (AWS)</td>
                      <td style={{ padding: 12 }}>Cloud Hosting & Database Storage</td>
                      <td style={{ padding: 12 }}>USA / EU / India</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <td style={{ padding: 12, fontWeight: 600, color: INK }}>Twilio / Telnyx</td>
                      <td style={{ padding: 12 }}>Telephony Carrier & SIP Trunking</td>
                      <td style={{ padding: 12 }}>USA / Global</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <td style={{ padding: 12, fontWeight: 600, color: INK }}>OpenAI / Deepgram / ElevenLabs</td>
                      <td style={{ padding: 12 }}>Speech-to-Text & Text-to-Speech Inference</td>
                      <td style={{ padding: 12 }}>USA (Zero Data Retention API)</td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                      <td style={{ padding: 12, fontWeight: 600, color: INK }}>Stripe / Razorpay</td>
                      <td style={{ padding: 12 }}>Payment Gateway Processing</td>
                      <td style={{ padding: 12 }}>USA / India</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 7 */}
            <section id="international-transfers" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                7. International Data Transfers
              </h2>
              <p>
                Autoniv operates globally. Information collected may be transferred to and processed on servers located outside your home state or country. When transferring European Union or UK personal data internationally, we rely on EU Standard Contractual Clauses (SCCs) and robust technical safeguards (AES-256 encryption).
              </p>
            </section>

            {/* Section 8 */}
            <section id="data-retention" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                8. Data Retention Schedules
              </h2>
              <p>We maintain strict maximum data retention windows:</p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Account Data:</strong> Retained for the active lifecycle of your account plus up to 24 months post-closure for legal audit.</li>
                <li><strong>Call Audio Recordings & Transcripts:</strong> Retained for up to 90 days by default (customizable to 0 days for strict HIPAA accounts).</li>
                <li><strong>Web Server Telemetry Logs:</strong> Retained for up to 30 days for security anomaly detection and performance debugging.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="security-measures" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                9. Security Safeguards & Compliance (SOC 2 / HIPAA)
              </h2>
              <p>
                We enforce multi-layered defense mechanisms to protect data against unauthorized access, disclosure, or alteration:
              </p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Encryption Standards:</strong> TLS 1.3 for all web and WebSocket communication; AES-256 encryption at rest.</li>
                <li><strong>Access Control:</strong> Strict Role-Based Access Control (RBAC), multi-factor authentication (MFA), and zero-trust network access for engineering staff.</li>
                <li><strong>HIPAA Alignment:</strong> Enterprise Healthcare tier subscribers can execute a Business Associate Agreement (BAA) ensuring PHI compliance.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="user-rights" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                10. Your Privacy Rights (GDPR, CCPA & DPDP)
              </h2>
              <p>Depending on your location, you hold the following rights regarding your personal information:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#FAFBFD', padding: 16, borderRadius: 12, border: `1px solid ${HAIRLINE}` }}>
                  <strong style={{ color: INK }}>Right to Access / Portability:</strong> Request a copy of all personal data held about you in JSON/CSV format.
                </div>
                <div style={{ background: '#FAFBFD', padding: 16, borderRadius: 12, border: `1px solid ${HAIRLINE}` }}>
                  <strong style={{ color: INK }}>Right to Erasure (Be Forgotten):</strong> Request permanent deletion of your account and call transcripts.
                </div>
                <div style={{ background: '#FAFBFD', padding: 16, borderRadius: 12, border: `1px solid ${HAIRLINE}` }}>
                  <strong style={{ color: INK }}>Right to Rectification:</strong> Update inaccurate contact or business profile information in your settings dashboard.
                </div>
                <div style={{ background: '#FAFBFD', padding: 16, borderRadius: 12, border: `1px solid ${HAIRLINE}` }}>
                  <strong style={{ color: INK }}>Opt-Out of Communications:</strong> Unsubscribe from marketing communications at any time via the link in emails.
                </div>
              </div>
              <p>To exercise any of these rights, email our DPO at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2563EB', fontWeight: 600 }}>{CONTACT_EMAIL}</a>.</p>
            </section>

            {/* Section 11 */}
            <section id="cookies-policy" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                11. Cookies & Tracking Preferences
              </h2>
              <p>
                We use essential session cookies to maintain secure authentication and preferences. We do not use third-party cross-site advertising cookies. You can manage or disable cookies at any time through your browser settings.
              </p>
            </section>

            {/* Section 12 */}
            <section id="updates-contact" style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                12. Updates to This Policy & Contact Information
              </h2>
              <p>
                We may update this Privacy Policy periodically to reflect new features or legal requirements. Material changes will be communicated via email or platform notifications 30 days prior to taking effect.
              </p>
              <div style={{ background: SURFACE, padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginTop: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>Data Protection Office (DPO)</h4>
                <p style={{ margin: '0 0 6px' }}><strong>Autoniv Technologies</strong></p>
                <p style={{ margin: '0 0 6px' }}>Email: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#2563EB' }}>{CONTACT_EMAIL}</a></p>
                <p style={{ margin: '0 0 6px' }}>Phone: <span style={{ color: INK }}>{CONTACT_PHONE}</span></p>
                <p style={{ margin: 0 }}>Website: <span style={{ color: INK }}>{CONTACT_WEBSITE}</span></p>
              </div>
            </section>

          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default PrivacyPolicy;
