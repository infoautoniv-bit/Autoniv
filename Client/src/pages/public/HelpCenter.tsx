import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create my first AI voice agent?',
        a: 'Go to Dashboard → My Agents → Create Agent. Describe what your agent should do in plain text, pick a voice and language, then save. Your agent is ready to use in under 2 minutes.',
      },
      {
        q: 'Do I need coding knowledge?',
        a: 'No. Autoniv is built for non-technical users. Just describe your agent\'s role in plain English and it will handle the rest.',
      },
      {
        q: 'How do I get a phone number?',
        a: 'Go to Dashboard → Phone Numbers to purchase or connect a number. We support numbers from 50+ countries.',
      },
    ],
  },
  {
    category: 'Voices & Languages',
    questions: [
      {
        q: 'How many languages are supported?',
        a: 'Autoniv supports 20+ languages including English, Hindi, Spanish, French, German, Arabic, Japanese, Korean, Chinese, and more.',
      },
      {
        q: 'Can I customize the voice?',
        a: 'Yes. Choose from 100+ realistic voices across different ages, genders, and accents. You can also adjust tone and speed.',
      },
      {
        q: 'Does the agent understand accents?',
        a: 'Yes. Our AI is trained on diverse speech patterns and handles various accents and dialects naturally.',
      },
    ],
  },
  {
    category: 'Calls & Billing',
    questions: [
      {
        q: 'How much does a call cost?',
        a: 'Call costs depend on your plan and the destination. Check your dashboard for real-time usage and pricing details.',
      },
      {
        q: 'Is there a free tier?',
        a: 'Yes. You can start with our free tier to test the platform. No credit card required.',
      },
      {
        q: 'How do I track my usage?',
        a: 'Go to Dashboard → Billing to see your minutes used, calls made, and remaining balance.',
      },
    ],
  },
  {
    category: 'Integrations',
    questions: [
      {
        q: 'Which CRMs are supported?',
        a: 'We integrate with Salesforce, HubSpot, Pipedrive, and more. We also offer a REST API for custom integrations.',
      },
      {
        q: 'Can I connect to WhatsApp?',
        a: 'Yes. Our add-on service includes automated WhatsApp follow-up sequences after calls.',
      },
    ],
  },
];

export function HelpCenter() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (key: string) => setOpenIndex(openIndex === key ? null : key);

  const filtered = FAQ_DATA.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      qa => !searchQuery ||
        qa.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen" style={{ background: '#050d1a' }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ color: '#e8f8ff', fontSize: 36, fontWeight: 700, marginBottom: 12 }}>Help Center</h1>
          <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 15, marginBottom: 32 }}>
            Find answers to common questions or contact our support team.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,175,210,0.4)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                borderRadius: 12,
                border: '1px solid rgba(0,119,255,0.15)',
                background: 'rgba(6,18,36,0.8)',
                color: '#e8f8ff',
                fontSize: 14.5,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,119,255,0.4)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,119,255,0.15)'}
            />
          </div>
        </div>

        {/* FAQ Sections */}
        {filtered.map(cat => (
          <div key={cat.category} style={{ marginBottom: 40 }}>
            <h2 style={{ color: '#0077ff', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {cat.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cat.questions.map(qa => {
                const key = `${cat.category}-${qa.q}`;
                const isOpen = openIndex === key;
                return (
                  <div
                    key={key}
                    style={{
                      border: '1px solid rgba(0,119,255,0.12)',
                      borderRadius: 12,
                      background: isOpen ? 'rgba(0,119,255,0.06)' : 'rgba(6,18,36,0.5)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <button
                      onClick={() => toggle(key)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 18px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#e8f8ff',
                        fontSize: 14.5,
                        fontWeight: 500,
                        textAlign: 'left',
                      }}
                    >
                      {qa.q}
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{
                          flexShrink: 0,
                          marginLeft: 12,
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                          color: 'rgba(148,175,210,0.5)',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 18px 16px', color: 'rgba(148,175,210,0.75)', fontSize: 14, lineHeight: 1.7 }}>
                        {qa.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div style={{
          marginTop: 48,
          padding: 32,
          borderRadius: 16,
          border: '1px solid rgba(0,119,255,0.15)',
          background: 'rgba(0,119,255,0.04)',
          textAlign: 'center',
        }}>
          <h3 style={{ color: '#e8f8ff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Still need help?</h3>
          <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 14, marginBottom: 20 }}>
            Our support team is available 24/7 to assist you.
          </p>
          <Link
            to="/#contact"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0077ff, #00c8b4)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}

export default HelpCenter;
