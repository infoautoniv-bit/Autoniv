import { useState } from 'react';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText } from './design';

const TOC_ITEMS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description-of-service', title: '2. Description of Services' },
  { id: 'account-security', title: '3. Account Registration & Security' },
  { id: 'acceptable-use', title: '4. Acceptable Use & Prohibited Conduct' },
  { id: 'telephony-compliance', title: '5. Telephony & TCPA Compliance' },
  { id: 'ai-disclosures', title: '6. AI Content & Voice Disclosures' },
  { id: 'intellectual-property', title: '7. IP & Data Ownership' },
  { id: 'billing-terms', title: '8. Billing, Usage Minutes & Refunds' },
  { id: 'sla-uptime', title: '9. Service Level Agreement (SLA)' },
  { id: 'limitation-liability', title: '10. Limitation of Liability' },
  { id: 'termination', title: '11. Term & Suspension' },
  { id: 'governing-law', title: '12. Governing Law & Contact' },
];

export function TermsConditions() {
  const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'legal@autoniv.com';
  const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '+91 70659 90307';
  const CONTACT_WEBSITE = import.meta.env.VITE_CONTACT_WEBSITE || 'Autoniv.com';

  const [activeSection, setActiveSection] = useState('acceptance');

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
            <SectionLabel text="LEGAL & AGREEMENTS" />
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: INK,
              marginBottom: 16
            }}>
              Terms and Conditions of <GradientText>Autoniv AI Services</GradientText>
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
                🖨️ Print Terms Agreement
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
                ✉️ Contact Legal Department
              </a>
            </div>
          </Reveal>

          {/* Highlights Grid */}
          <div style={{ marginTop: 48 }}>
            <Reveal delay={150}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                textAlign: 'left'
              }}>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📜</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Subscription Agreement</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Governs platform access, AI agent usage, API calls, and white-label tools.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📞</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>TCPA & Telecom Compliance</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Subscribers are required to comply with outbound calling and consent laws.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>99.9% Uptime Commitment</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    High-availability SIP gateways and distributed cloud processing infrastructure.
                  </p>
                </div>
                <div style={{ background: SURFACE, padding: 20, borderRadius: 16, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>Transparent Usage Metering</h4>
                  <p style={{ fontSize: 12.5, color: SLATE, margin: 0, lineHeight: 1.5 }}>
                    Clear minute billing with rollover options and no hidden surcharge fees.
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
              Terms Index
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
            <section id="acceptance" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using the services provided by <strong>Autoniv</strong> ("Company", "We", "Us", or "Our"), you ("Customer", "User", or "You") agree to be legally bound by these Terms and Conditions ("Terms") and our Privacy Policy.
              </p>
              <p>
                If you are entering into these Terms on behalf of a company, enterprise, or legal entity, you represent and warrant that you have full legal authority to bind such entity to these Terms. If you do not agree with any part of these Terms, you must immediately cease accessing and using the Service.
              </p>
            </section>

            {/* Section 2 */}
            <section id="description-of-service" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                2. Description of Services
              </h2>
              <p>
                Autoniv provides a cloud-based conversational artificial intelligence platform powering autonomous voice agents, phone answering services, website chatbots, WhatsApp business automation, and agency white-label portals (the "Services").
              </p>
              <p>
                The Services include access to web dashboards, API keys, WebRTC audio interfaces, SIP telephony integration, knowledge base vector indexing, and automated appointment scheduling integrations.
              </p>
            </section>

            {/* Section 3 */}
            <section id="account-security" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                3. Account Registration & Security
              </h2>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Registration:</strong> You agree to provide accurate, current, and complete account information during registration and keep your billing and team details updated.</li>
                <li><strong>Credential Safeguarding:</strong> You are solely responsible for maintaining the confidentiality of your account credentials, API secret keys, and SIP trunk passwords.</li>
                <li><strong>Unauthorized Use:</strong> You must immediately notify Autoniv upon discovering any security breach or unauthorized access to your account. Autoniv will not be liable for losses caused by compromised login credentials.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="acceptable-use" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                4. Acceptable Use & Prohibited Conduct
              </h2>
              <p>You agree to use the Services strictly for lawful, legitimate business purposes. You shall NOT:</p>
              <div style={{ background: '#FAFBFD', padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginBottom: 20 }}>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>Initiate illegal robocalls, unsolicited spam telemarketing, or malicious phone spam in violation of TCPA, TSR, or local telecom laws.</li>
                  <li style={{ marginBottom: 8 }}>Spoof caller ID headers to impersonate government agencies, emergency services, financial institutions, or individuals without explicit authorization.</li>
                  <li style={{ marginBottom: 8 }}>Use AI voice agents to transmit fraudulent, deceptive, harassing, defamatory, obscene, or unlawful speech.</li>
                  <li style={{ marginBottom: 8 }}>Reverse-engineer, decompile, or attempt to extract source code or underlying machine learning weights from our platform.</li>
                  <li style={{ marginBottom: 0 }}>Resell, sublicense, or rent the platform to third parties except under an authorized Enterprise White-Label agreement.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="telephony-compliance" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                5. Telephony, Calling & TCPA Compliance
              </h2>
              <p>
                When using Autoniv outbound voice agents or phone dialers:
              </p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Prior Express Written Consent:</strong> You guarantee that you have obtained all necessary consents required under the Telephone Consumer Protection Act (TCPA), CAN-SPAM, National Do Not Call (DNC) Registry, and applicable international laws prior to placing automated voice calls or sending messages to end users.</li>
                <li><strong>Call Recording Disclosures:</strong> You are responsible for ensuring that appropriate pre-call audio disclaimers are played to comply with single-party or two-party consent requirements in the caller's jurisdiction.</li>
                <li><strong>STIR/SHAKEN:</strong> All outbound calls placed via Autoniv phone trunks adhere to STIR/SHAKEN caller ID authentication standards. Accounts attempting caller ID spoofing will be permanently banned.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="ai-disclosures" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                6. AI Output & Virtual Assistant Disclosures
              </h2>
              <p>
                You acknowledge that Autoniv Services utilize generative artificial intelligence and large language models (LLMs). While our systems are optimized for sub-300ms latency and high accuracy:
              </p>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li>AI outputs are probabilistic. Autoniv does not warrant that AI agent speech or text responses will be 100% error-free in all domain scenarios.</li>
                <li>You are responsible for reviewing and testing your agent prompts, knowledge base context, and fallback handoffs before deploying agents to live callers.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="intellectual-property" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                7. Intellectual Property & Customer Data Ownership
              </h2>
              <div style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FDF4 100%)', padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: '0 0 8px' }}>💎 You Own Your Data & Content</h3>
                <p style={{ margin: 0, fontSize: 14.5 }}>
                  You retain 100% ownership of all uploaded documentation, customer CRM data, custom prompt templates, and conversation transcripts. Autoniv claims no ownership rights over your proprietary business assets.
                </p>
              </div>
              <p>
                Autoniv retains exclusive ownership of all software, source code, visual UI design, proprietary voice synthesis algorithms, logos, trademarks, and platform infrastructure.
              </p>
            </section>

            {/* Section 8 */}
            <section id="billing-terms" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                8. Billing, Usage Minutes & Refund Policy
              </h2>
              <ul style={{ paddingLeft: 22, marginBottom: 16 }}>
                <li><strong>Subscriptions:</strong> Fees are billed in advance on a recurring monthly or annual basis based on your selected plan.</li>
                <li><strong>Minute Metering:</strong> Voice agent call duration is calculated in 60-second increments. Unused monthly plan minutes roll over according to your tier plan terms.</li>
                <li><strong>Add-Ons & Top-Ups:</strong> Additional minute packages or team seats purchased are charged instantly to your default payment method.</li>
                <li><strong>Refund Policy:</strong> We offer a 30-day money-back guarantee for new subscription signups if platform performance does not meet technical specifications. Minute top-up packages are non-refundable once consumed.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="sla-uptime" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                9. Service Level Agreement (SLA) & Uptime
              </h2>
              <p>
                Autoniv targets 99.9% uptime for core platform services, webhooks, and SIP telephony gateways, excluding scheduled maintenance windows announced at least 48 hours in advance. Enterprise plan customers are eligible for service credits under our dedicated Enterprise SLA Agreement.
              </p>
            </section>

            {/* Section 10 */}
            <section id="limitation-liability" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                10. Limitation of Liability & Warranties
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AUTONIV AND ITS SUPPLIERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN CONNECTION WITH THE USE OF THE SERVICES.
              </p>
              <p>
                IN NO EVENT SHALL AUTONIV'S TOTAL AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO AUTONIV IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Section 11 */}
            <section id="termination" style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                11. Term & Suspension of Service
              </h2>
              <p>
                You may cancel your subscription at any time via your Dashboard billing page. Autoniv reserves the right to suspend or terminate your account immediately upon notice if you breach these Terms (including failure to pay fees or engaging in prohibited telemarketing activities).
              </p>
            </section>

            {/* Section 12 */}
            <section id="governing-law" style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${HAIRLINE}` }}>
                12. Governing Law, Dispute Resolution & Contact
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Delhi, India, without regard to its conflict of law principles. Any dispute arising out of or relating to these Terms shall be resolved through binding arbitration in New Delhi, India.
              </p>

              <div style={{ background: SURFACE, padding: 24, borderRadius: 16, border: `1px solid ${HAIRLINE}`, marginTop: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>Legal & Regulatory Inquiries</h4>
                <p style={{ margin: '0 0 6px' }}><strong>Autoniv Legal Department</strong></p>
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

export default TermsConditions;
