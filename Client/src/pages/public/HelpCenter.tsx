import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText, FAQItem } from './design';

const CATEGORIES = [
  { icon: '🚀', title: 'Getting Started', desc: 'Basic platform setup & first agent creation' },
  { icon: '🎙️', title: 'AI Voice Agents', desc: 'Voice settings, languages, telephony & calls' },
  { icon: '💬', title: 'AI Chatbots', desc: 'Website widget, WhatsApp & persona setup' },
  { icon: '💳', title: 'Billing & Plans', desc: 'Pricing, minute usage, add-ons & invoices' },
  { icon: '🔌', title: 'Integrations & API', desc: 'CRMs, webhooks, REST API & triggers' },
  { icon: '🔒', title: 'Security & HIPAA', desc: 'Data privacy, encryption & compliance' },
];

const FAQ_DATA = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create my first AI voice agent?',
        a: 'Navigate to Dashboard → My Agents → Create Agent. Select a template or describe your agent in natural text, choose a voice persona and primary language, then click Save. Your agent is ready to take calls in under 2 minutes.',
      },
      {
        q: 'Do I need programming knowledge to use Autoniv?',
        a: 'No coding is required! Autoniv is designed for business owners, marketers, and operations managers. You can build, test, and launch voice agents and chatbots through our visual dashboard.',
      },
      {
        q: 'How do I connect a phone number to my voice agent?',
        a: 'Go to Dashboard → Phone Numbers. You can acquire a new local/toll-free number in 50+ countries or connect your existing Twilio or SIP provider trunk with 1-click.',
      },
      {
        q: 'How do I test my agent before going live?',
        a: 'Use the built-in browser web call test inside the Dashboard to make test calls directly from your microphone and review live transcript generation in real-time.',
      },
    ],
  },
  {
    category: 'AI Voice Agents & Telephony',
    questions: [
      {
        q: 'How many languages and dialects are supported?',
        a: 'Autoniv supports 50+ languages natively, including English (US, UK, IN, AU), Hindi, Spanish, French, German, Arabic, Japanese, Korean, Mandarin, Portuguese, and regional Indian languages.',
      },
      {
        q: 'Can callers interrupt the voice agent while speaking?',
        a: 'Yes! Our full-duplex conversational AI engine processes real-time caller speech. If a caller interrupts mid-sentence, the agent pauses immediately and adapts to the new input.',
      },
      {
        q: 'Can the voice agent transfer calls to human staff?',
        a: 'Absolutely. You can set up smart call handoff rules (e.g., transfer to a manager when high purchase intent or urgent support request is detected). Live transcripts are automatically forwarded.',
      },
    ],
  },
  {
    category: 'AI Chatbots & WhatsApp',
    questions: [
      {
        q: 'How do I embed the chatbot widget on my website?',
        a: 'Go to Dashboard → Chatbots → Select Chatbot → Embed Code. Copy the 1-line HTML script tag and paste it into your site before the closing </body> tag. It works with WordPress, Shopify, Webflow, React, and custom HTML.',
      },
      {
        q: 'Can I train the chatbot on my own PDF documents or website URLs?',
        a: 'Yes! Simply paste your website URL or upload PDFs, Word docs, and FAQ sheets inside Knowledge Base. The AI indexes your content automatically to answer customer questions accurately.',
      },
      {
        q: 'Does Autoniv support official WhatsApp Business integration?',
        a: 'Yes. Autoniv integrates directly with the Meta WhatsApp Business API so your AI chatbot can handle customer chats and send automated follow-up messages on WhatsApp.',
      },
    ],
  },
  {
    category: 'Billing, Minutes & Usage',
    questions: [
      {
        q: 'How does call minute billing work?',
        a: 'Minutes are deducted only for active call durations. Unused plan minutes roll over or can be topped up via Add-ons at any time.',
      },
      {
        q: 'Is there a free trial available?',
        a: 'Yes! When you register a new account, you receive free trial credits to build agents, test web calls, and try chatbot conversations with zero credit card required.',
      },
      {
        q: 'How do I upgrade or change my plan?',
        a: 'Go to Dashboard → Billing to change your subscription tier, add team seats, or purchase top-up minute packages instantly.',
      },
    ],
  },
  {
    category: 'Integrations, API & Security',
    questions: [
      {
        q: 'Which CRMs and calendars can Autoniv sync with?',
        a: 'We provide direct 2-way sync with Google Calendar, Outlook, HubSpot, Salesforce, Follow Up Boss, Zoho CRM, and Zapier.',
      },
      {
        q: 'Is enterprise customer data secure and HIPAA-aligned?',
        a: 'Yes. All voice calls, chat logs, and customer metadata are encrypted both in transit (TLS 1.3) and at rest (AES-256). We offer signed BAAs for enterprise healthcare clients.',
      },
    ],
  },
];

export function HelpCenter() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const toggle = (key: string) => setOpenKey(openKey === key ? null : key);

  const filteredCategories = FAQ_DATA.map(cat => {
    if (activeCategory !== 'All' && !cat.category.toLowerCase().includes(activeCategory.toLowerCase())) {
      return { ...cat, questions: [] };
    }
    const matchingQuestions = cat.questions.filter(qa => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return qa.q.toLowerCase().includes(q) || qa.a.toLowerCase().includes(q);
    });
    return { ...cat, questions: matchingQuestions };
  }).filter(cat => cat.questions.length > 0);

  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Header */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 80, background: 'linear-gradient(180deg, #EFF6FF 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <Reveal>
            <SectionLabel text="Support & Knowledge Base" />
            <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
              How Can We <GradientText>Help You Today?</GradientText>
            </h1>
            <p style={{ color: SLATE, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', marginBottom: 36, maxWidth: 640, margin: '0 auto 36px' }}>
              Search tutorials, quick answers, integration guides, and platform troubleshooting resources.
            </p>

            {/* Search Input Box */}
            <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
              <svg style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search questions, setup guides, API..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px 16px 54px',
                  borderRadius: 999,
                  border: `1px solid ${HAIRLINE}`,
                  background: SURFACE,
                  color: INK,
                  fontSize: 15,
                  outline: 'none',
                  boxShadow: '0 8px 30px -6px rgba(15,23,42,0.08)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quick Category Cards */}
      <section style={{ padding: '40px 24px 60px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1150, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
              <button
                onClick={() => setActiveCategory('All')}
                style={{
                  padding: '18px 16px', borderRadius: 16, border: `1px solid ${activeCategory === 'All' ? '#2563EB' : HAIRLINE}`,
                  background: activeCategory === 'All' ? 'rgba(37,99,235,0.06)' : SURFACE,
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: activeCategory === 'All' ? '#2563EB' : INK }}>All Topics</div>
              </button>
              {CATEGORIES.map((c, i) => {
                const isActive = activeCategory === c.title;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(c.title)}
                    style={{
                      padding: '18px 16px', borderRadius: 16, border: `1px solid ${isActive ? '#2563EB' : HAIRLINE}`,
                      background: isActive ? 'rgba(37,99,235,0.06)' : SURFACE,
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? '#2563EB' : INK, marginBottom: 4 }}>{c.title}</div>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ Accordions Section */}
      <section style={{ padding: '80px 24px', background: '#FAFBFD' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: SLATE }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: INK }}>No matching help articles found</h3>
              <p style={{ fontSize: 14, marginTop: 4 }}>Try tweaking your search term or select another category.</p>
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.category} style={{ marginBottom: 48 }}>
                <Reveal>
                  <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#2563EB', textTransform: 'uppercase', fontFamily: MONO, marginBottom: 16 }}>
                    {cat.category}
                  </div>
                </Reveal>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cat.questions.map(qa => {
                    const key = `${cat.category}-${qa.q}`;
                    const isOpen = openKey === key;
                    return (
                      <Reveal key={key}>
                        <div style={{
                          background: SURFACE,
                          borderRadius: 16,
                          border: `1px solid ${isOpen ? 'rgba(37,99,235,0.3)' : HAIRLINE}`,
                          boxShadow: isOpen ? '0 10px 28px -6px rgba(37,99,235,0.12)' : '0 1px 3px rgba(15,23,42,0.03)',
                          overflow: 'hidden', transition: 'all 0.25s'
                        }}>
                          <button
                            onClick={() => toggle(key)}
                            style={{
                              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 700, color: INK, paddingRight: 16 }}>{qa.q}</span>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', background: isOpen ? BRAND : 'rgba(15,23,42,0.05)', transition: 'background 0.3s'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                <path d="M2 4.5L6 8.5L10 4.5" stroke={isOpen ? '#fff' : '#64748b'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </button>
                          {isOpen && (
                            <div style={{ padding: '0 24px 22px', borderTop: '1px solid rgba(37,99,235,0.08)' }}>
                              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: SLATE, paddingTop: 14, margin: 0 }}>{qa.a}</p>
                            </div>
                          )}
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Support CTA Footer Banner */}
      <section style={{ padding: '80px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FDF4 100%)', borderRadius: 24, padding: 44, border: `1px solid ${HAIRLINE}` }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Still Need Further Assistance?</h2>
              <p style={{ color: SLATE, fontSize: 15, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px' }}>
                Our 24/7 technical support team is standing by to help you configure agents or troubleshoot workflows.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/dashboard/support"
                  style={{
                    background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', boxShadow: '0 8px 24px -4px rgba(37,99,235,0.3)'
                  }}
                >
                  Open Support Ticket →
                </Link>
                <Link
                  to="/blog"
                  style={{
                    background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                    border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                  }}
                >
                  Explore Tutorials
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HelpCenter;
