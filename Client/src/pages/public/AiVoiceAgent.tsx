import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText, StatCard, FAQItem, HeroWaveform } from './design';

const VOICE_STATS = [
  { value: "<300ms", label: "Ultra Low Latency", description: "Human-like instant response speed" },
  { value: "50+", label: "Native Languages", description: "Accents, dialects, & multilingual switching" },
  { value: "99.8%", label: "Voice Recognition", description: "Clear audio parsing in noisy environments" },
  { value: "10K+", label: "Concurrent Calls", description: "Scale effortlessly during high call spikes" },
];

const VOICE_FEATURES = [
  {
    icon: "🎙️",
    title: "Natural-Sounding Vocal Tone",
    description: "Employs neural text-to-speech synthesis with dynamic inflections, pitch modulation, and realistic pauses for true human feel.",
  },
  {
    icon: "⚡",
    title: "Real-Time Interruption Handling",
    description: "Callers can interrupt, pause, or change topics mid-sentence — the AI stops speaking immediately and adapts in real-time.",
  },
  {
    icon: "📅",
    title: "Autonomous Appointment Booking",
    description: "Directly checks slot availability and books appointments into Google Calendar, Outlook, or custom CRMs during calls.",
  },
  {
    icon: "🔄",
    title: "Smart Call Handoff",
    description: "Transfers complex, high-touch callers to human agents with complete live transcripts and context pre-packaged.",
  },
  {
    icon: "📊",
    title: "Live Transcripts & Sentiment",
    description: "Analyze call recordings, structured sentiment analysis, customer Intent tags, and summary insights instantly.",
  },
  {
    icon: "🌐",
    title: "Local & International Lines",
    description: "Connect custom SIP trunks, Twilio lines, or acquire toll-free and regional numbers directly within Autoniv.",
  },
];

const VOICE_USE_CASES = [
  {
    title: "Inbound Support & Reception",
    icon: "📞",
    description: "Answer 100% of incoming customer queries, handle FAQs, direct callers, and record caller intent 24 hours a day.",
  },
  {
    title: "Outbound Lead Qualification",
    icon: "🚀",
    description: "Instantly call new form submissions, qualify buying intent, collect requirements, and book sales calls automatically.",
  },
  {
    title: "Reminders & Follow-Ups",
    icon: "⏰",
    description: "Reduce no-shows with friendly automated reminder calls for upcoming appointments, overdue balances, or renewals.",
  },
];

const VOICE_FAQS = [
  {
    question: "Does the voice agent sound robotic or artificial?",
    answer: "No. Autoniv utilizes next-generation neural audio synthesis trained on natural human conversation patterns. Callers frequently mistake our AI agents for real human representatives.",
  },
  {
    question: "Can callers interrupt the AI while it's speaking?",
    answer: "Yes! Full-duplex conversational AI allows callers to interrupt at any point. The agent pauses immediately, listens to the new input, and responds seamlessly.",
  },
  {
    question: "How long does it take to set up an AI Voice Agent?",
    answer: "You can configure and deploy a fully trained AI Voice Agent in under 10 minutes using our pre-built templates or prompt builder.",
  },
  {
    question: "Can I connect my existing phone numbers?",
    answer: "Absolutely. You can forward your existing business number, connect your Twilio or SIP provider, or purchase dedicated local/toll-free numbers directly.",
  },
];

export function AiVoiceAgent() {
  const [activeSample, setActiveSample] = useState<'inbound' | 'outbound'>('inbound');

  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 90, background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFD 100%)' }}>
        <HeroWaveform />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
              <SectionLabel text="AI Voice Agents" />
              <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 24 }}>
                Human-Like <GradientText>AI Voice Agents</GradientText> That Handle Calls 24/7
              </h1>
              <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: SLATE, lineHeight: 1.6, marginBottom: 40 }}>
                Automate inbound reception, outbound sales qualification, and appointment booking with ultra-low latency voice AI that speaks like a human.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15,
                  boxShadow: '0 10px 24px -4px rgba(37,99,235,0.35)', textDecoration: 'none', transition: 'transform 0.2s'
                }}>
                  Deploy Voice Agent Free →
                </Link>
                <Link to="/pricing/voice-assistance" style={{
                  background: SURFACE, color: INK, padding: '14px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15,
                  border: `1px solid ${HAIRLINE}`, textDecoration: 'none'
                }}>
                  View Voice Pricing
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {VOICE_STATS.map((st, i) => (
              <Reveal key={i} delay={i * 100}>
                <StatCard value={st.value} label={st.label} description={st.description} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Sample Preview */}
      <section style={{ padding: '80px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <SectionLabel text="Interactive Preview" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Hear the AI Voice Difference</h2>
              <p style={{ color: SLATE, marginTop: 8 }}>Test how Autoniv AI voice handles actual business scenarios in real-time.</p>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 24, border: `1px solid ${HAIRLINE}`, padding: 32, boxShadow: '0 12px 32px -8px rgba(15,23,42,0.06)' }}>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
                <button
                  onClick={() => setActiveSample('inbound')}
                  style={{
                    padding: '10px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    background: activeSample === 'inbound' ? BRAND : SURFACE,
                    color: activeSample === 'inbound' ? '#fff' : INK,
                    border: `1px solid ${activeSample === 'inbound' ? 'transparent' : HAIRLINE}`
                  }}
                >
                  Inbound Reception Demo
                </button>
                <button
                  onClick={() => setActiveSample('outbound')}
                  style={{
                    padding: '10px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    background: activeSample === 'outbound' ? BRAND : SURFACE,
                    color: activeSample === 'outbound' ? '#fff' : INK,
                    border: `1px solid ${activeSample === 'outbound' ? 'transparent' : HAIRLINE}`
                  }}
                >
                  Outbound Lead Booking Demo
                </button>
              </div>

              <div style={{ background: SURFACE, borderRadius: 16, padding: 24, border: `1px solid ${HAIRLINE}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    🎙️
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{activeSample === 'inbound' ? 'Inbound Dental Clinic Receptionist' : 'Outbound Solar Lead Qualifier'}</div>
                    <div style={{ fontSize: 12, color: SLATE, fontFamily: MONO }}>Latency: ~280ms • Accent: US Natural • Status: Live Interactive</div>
                  </div>
                </div>

                <div style={{ background: '#F1F5F9', padding: 20, borderRadius: 12, fontSize: 14, lineHeight: 1.7, color: INK }}>
                  {activeSample === 'inbound' ? (
                    <>
                      <strong>AI Agent:</strong> "Thanks for calling Apex Dental Clinic! I'm Sarah, your virtual assistant. Are you calling to book a new appointment or ask about existing treatment?"<br/><br/>
                      <strong>Caller:</strong> "Hi Sarah, I have a sharp tooth pain and need an urgent slot today."<br/><br/>
                      <strong>AI Agent:</strong> "I'm sorry to hear that. I have an emergency slot available with Dr. Vance at 3:30 PM today. Would that work for you?"
                    </>
                  ) : (
                    <>
                      <strong>AI Agent:</strong> "Hi Marcus, this is Alex from SunPower Solar! I saw you requested a rooftop quote on our website. Do you have 60 seconds to see if your home qualifies for state rebates?"<br/><br/>
                      <strong>Caller:</strong> "Yeah, sure. What is your average monthly bill requirement?"<br/><br/>
                      <strong>AI Agent:</strong> "Usually homeowners with electric bills over $120/month see the biggest savings. Is your monthly bill around that range?"
                    </>
                  )}
                </div>
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
              <SectionLabel text="Core Capabilities" />
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Built for High-Volume Enterprise Calling</h2>
              <p style={{ color: SLATE, marginTop: 12 }}>Everything you need to automate voice communication without sacrificing human quality.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {VOICE_FEATURES.map((feat, i) => (
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

      {/* Use Cases */}
      <section style={{ padding: '80px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <SectionLabel text="Applications" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Voice AI Tailored to Your Workflows</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {VOICE_USE_CASES.map((uc, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ background: '#F8FAFC', borderRadius: 20, padding: 28, border: `1px solid ${HAIRLINE}` }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{uc.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{uc.title}</h3>
                  <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>{uc.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '90px 24px', background: '#FAFBFD', borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <SectionLabel text="Frequently Asked Questions" />
              <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Everything You Need to Know About Voice AI</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {VOICE_FAQS.map((faq, i) => (
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
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 16 }}>Ready to Automate Your Phone Operations?</h2>
          <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 36 }}>Deploy your first AI Voice Agent today with 100 free minutes included.</p>
          <Link to="/register" style={{
            background: BRAND, color: '#fff', padding: '16px 36px', borderRadius: 999, fontWeight: 700, fontSize: 16,
            textDecoration: 'none', display: 'inline-block', boxShadow: '0 10px 30px -5px rgba(37,99,235,0.5)'
          }}>
            Get Started Free Now →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
