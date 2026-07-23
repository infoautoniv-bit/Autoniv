import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText, StatCard, FAQItem } from './design';

const CHATBOT_STATS = [
  { value: "85%", label: "First Contact Resolution", description: "Answer routine customer questions automatically" },
  { value: "24/7", label: "Instant Lead Capture", description: "Qualify visitors & collect leads day or night" },
  { value: "<2s", label: "Response Time", description: "Zero waiting time for website visitors" },
  { value: "20+", label: "Multilingual Support", description: "Detects and replies in caller language automatically" },
];

const CHATBOT_FEATURES = [
  {
    icon: "💬",
    title: "Multi-Channel Deployment",
    description: "Embed on your website with a single script tag or connect seamlessly to WhatsApp, Instagram Direct, and Facebook Messenger.",
  },
  {
    icon: "🧠",
    title: "Knowledge Base & Doc Ingestion",
    description: "Upload PDFs, Notion pages, website URLs, or support docs — the chatbot instantly learns your product details without manual coding.",
  },
  {
    icon: "🎯",
    title: "Proactive Lead Capture Forms",
    description: "Prompt users at key moments to capture email, phone number, budget, and project requirements directly inside the chat stream.",
  },
  {
    icon: "🎨",
    title: "Custom Brand Personality",
    description: "Match your company tone perfectly — friendly, professional, empathetic, or authoritative — with custom system prompts.",
  },
  {
    icon: "🔀",
    title: "Live Agent Escalation",
    description: "Hand off complex conversations seamlessly to human team members with push notifications and complete chat history.",
  },
  {
    icon: "📈",
    title: "Real-Time Sentiment Analytics",
    description: "Track conversation volume, visitor satisfaction, top asked questions, and lead conversion rates from your dashboard.",
  },
];

const CHATBOT_FAQS = [
  {
    question: "Can I customize the design to match my brand website?",
    answer: "Yes! You can customize widget colors, typography, avatar images, launcher icon style, greeting messages, and position with zero coding.",
  },
  {
    question: "How does the chatbot train on my company data?",
    answer: "Simply paste your website URL or upload PDF documents and FAQ sheets. Autoniv crawls and indexes your content in seconds.",
  },
  {
    question: "Can I connect the chatbot to WhatsApp and Instagram?",
    answer: "Yes, Autoniv supports official Meta Business APIs for WhatsApp, Instagram, and Facebook Messenger integration.",
  },
  {
    question: "What happens when the chatbot cannot answer a question?",
    answer: "You can configure fallback behaviors such as asking for contact details to create a ticket, or transferring live to a human agent.",
  },
];

export function AiChatbot() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([
    { role: 'bot', text: 'Hi there! 👋 How can I help you accelerate your customer support or capture more leads today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `Thanks for asking! Autoniv AI chatbots handle queries like "${userMsg}" with customized knowledge base training and 24/7 instant replies.`,
        },
      ]);
    }, 600);
  };

  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #EFF6FF 0%, #FAFBFD 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="AI Chatbots" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Intelligent <GradientText>AI Chatbots</GradientText> for Web & WhatsApp Automation
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Convert website visitors into qualified leads and resolve up to 85% of customer support inquiries instantly in 20+ languages.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none'
                }}>
                  Create Free Chatbot →
                </Link>
                <Link to="/pricing/ai-chatbot" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  View Chatbot Pricing
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {CHATBOT_STATS.map((st, i) => (
              <Reveal key={i} delay={i * 100}>
                <StatCard value={st.value} label={st.label} description={st.description} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Chat Sandbox Preview */}
      <section style={{ padding: '80px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <SectionLabel text="Live Interactive Demo" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Test Drive Our AI Chatbot</h2>
              <p style={{ color: SLATE, marginTop: 8 }}>Type a question below to experience real-time conversational response.</p>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 24, border: `1px solid ${HAIRLINE}`, padding: 24, boxShadow: '0 16px 40px -12px rgba(15,23,42,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${HAIRLINE}`, marginBottom: 20 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Autoniv Assistant (Online)</span>
                <span style={{ fontSize: 12, color: SLATE, marginLeft: 'auto', fontFamily: MONO }}>24/7 Customer AI</span>
              </div>

              <div style={{ minHeight: 220, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: m.role === 'user' ? '#2563EB' : SURFACE,
                    color: m.role === 'user' ? '#fff' : INK,
                    padding: '12px 18px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: m.role === 'bot' ? `1px solid ${HAIRLINE}` : 'none',
                    fontSize: 14, lineHeight: 1.5,
                    boxShadow: m.role === 'bot' ? '0 2px 6px rgba(15,23,42,0.03)' : 'none',
                  }}>
                    {m.text}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message or question..."
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 999, border: `1px solid ${HAIRLINE}`,
                    outline: 'none', background: SURFACE, fontSize: 14
                  }}
                />
                <button
                  onClick={handleSend}
                  style={{
                    background: BRAND, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 999,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  Send
                </button>
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
              <SectionLabel text="Chatbot Features" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Everything Required to Engage Visitors</h2>
              <p style={{ color: SLATE, marginTop: 12 }}>Powerful tools for automated lead generation and instant customer support.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {CHATBOT_FEATURES.map((feat, i) => (
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
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>AI Chatbot FAQs</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {CHATBOT_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Start Automating Your Web Chat Today</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Deploy your custom AI chatbot in minutes. 100 free conversations included.</p>
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
