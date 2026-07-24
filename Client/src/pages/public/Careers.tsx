import { useState } from 'react';
import { PublicNavbar } from '../../components/PublicNavbar';
import Footer from './Footer';
import { BRAND, INK, SLATE, HAIRLINE, SURFACE, MONO, Reveal, SectionLabel, GradientText } from './design';

interface JobRole {
  id: string;
  title: string;
  department: 'engineering' | 'product' | 'sales' | 'marketing' | 'success';
  departmentName: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
}

const OPEN_ROLES: JobRole[] = [
  {
    id: 'sr-ai-ml-engineer',
    title: 'Senior AI/ML Engineer (Voice & Speech Latency)',
    department: 'engineering',
    departmentName: 'Engineering & AI',
    location: 'Remote (Global)',
    type: 'Full-time',
    experience: '5+ years',
    salary: '$130,000 - $170,000 + Equity',
    summary: 'Lead the optimization of sub-200ms real-time audio latency, text-to-speech synthesis, and fine-tuned domain LLM agents.',
    responsibilities: [
      'Architect low-latency streaming pipeline algorithms combining VAD, STT, LLM inference, and TTS.',
      'Fine-tune small language models (SLMs) for domain-specific call routing and real-time intent extraction.',
      'Optimize WebRTC and audio packet transmission across distributed edge servers.',
      'Collaborate with product teams to benchmark voice naturalness, turn-taking latency, and context recall.'
    ],
    requirements: [
      '5+ years experience in Machine Learning, Speech Processing, or NLP.',
      'Deep expertise in Python, PyTorch/TensorFlow, C++, and WebRTC audio streams.',
      'Proven experience deploying high-concurrency real-time AI models to production.',
      'Solid understanding of LLM context window optimization and streaming token execution.'
    ],
    skills: ['PyTorch', 'Python', 'WebRTC', 'TTS/STT', 'LLM Fine-Tuning', 'C++']
  },
  {
    id: 'sr-fullstack-engineer',
    title: 'Senior Full-Stack Engineer (React, Node, WebSockets)',
    department: 'engineering',
    departmentName: 'Engineering & AI',
    location: 'Remote (India / Global)',
    type: 'Full-time',
    experience: '4+ years',
    salary: '$110,000 - $150,000 + Equity',
    summary: 'Build high-performance real-time user interfaces, live audio wave visualizers, and white-label agent management dashboards.',
    responsibilities: [
      'Develop reactive dashboards for managing AI voice call flows, telephony trunks, and live chat widgets.',
      'Implement real-time WebSocket communication for live transcript streaming and audio call playback.',
      'Design clean, modular REST & GraphQL APIs connecting MongoDB/PostgreSQL backends.',
      'Maintain 99.9% uptime across production web clients and enterprise reseller white-label portals.'
    ],
    requirements: [
      '4+ years building production web applications using React, TypeScript, and Node.js.',
      'Extensive experience with state management, WebSockets, web audio APIs, and Tailwind/CSS.',
      'Solid knowledge of backend microservices, database indexing, and Redis caching.',
      'Passion for crafting ultra-fast, smooth, accessible user interfaces.'
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'WebSockets', 'Tailwind', 'MongoDB']
  },
  {
    id: 'staff-voip-telephony',
    title: 'Staff Telephony & VoIP Engineer (SIP / WebRTC / Twilio)',
    department: 'engineering',
    departmentName: 'Engineering & AI',
    location: 'Remote (Global)',
    type: 'Full-time',
    experience: '6+ years',
    salary: '$140,000 - $180,000 + Equity',
    summary: 'Architect enterprise SIP trunking, carrier routing, and global telephony infrastructure powering millions of automated minutes.',
    responsibilities: [
      'Scale our global SIP gateway infrastructure across AWS/GCP edge nodes for ultra-low jitter.',
      'Integrate Twilio, Telnyx, Plivo, and custom SIP trunks with our AI voice processing pipeline.',
      'Implement caller ID verification (STIR/SHAKEN), TCPA compliance filters, and emergency routing.',
      'Monitor call MOS scores, packet loss, and jitter buffers in real-time across worldwide call carriers.'
    ],
    requirements: [
      '6+ years in Telephony Engineering, FreeSWITCH, Kamailio, Asterisk, or OpenSIPS.',
      'Deep knowledge of SIP, RTP, WebRTC, SDP, codec negotiation (G.711, Opus), and network protocols.',
      'Experience with carrier-grade voice infrastructure and high-concurrency trunking.',
      'Strong scripting skills in Golang, C, or Python for network telemetry.'
    ],
    skills: ['FreeSWITCH', 'SIP Trunking', 'Kamailio', 'WebRTC', 'Go', 'Twilio']
  },
  {
    id: 'lead-product-designer',
    title: 'Lead Product Designer (AI Interfaces & Systems)',
    department: 'product',
    departmentName: 'Product & Design',
    location: 'Remote (Global)',
    type: 'Full-time',
    experience: '5+ years',
    salary: '$100,000 - $140,000 + Equity',
    summary: 'Shape the visual identity, agent builder workflows, and interactive conversational analytics for our enterprise platform.',
    responsibilities: [
      'Design end-to-end user journeys for zero-code voice agent configuration and workflow nodes.',
      'Build and maintain our comprehensive Figma design system and component UI library.',
      'Conduct user research with business owners, agency resellers, and support managers.',
      'Create high-fidelity micro-interactions, dark/light theme tokens, and data visualization specs.'
    ],
    requirements: [
      '5+ years as a Product Designer in B2B SaaS, developer tools, or AI platforms.',
      'Mastery of Figma, interactive prototyping, and design tokens.',
      'Strong portfolio demonstrating complex workflow simplification and visual elegance.',
      'Familiarity with HTML/CSS frontend capabilities and design system implementation.'
    ],
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'AI Workflows']
  },
  {
    id: 'enterprise-ae',
    title: 'Enterprise Account Executive (AI & SaaS Solutions)',
    department: 'sales',
    departmentName: 'Sales & Growth',
    location: 'Remote (US / India / APAC)',
    type: 'Full-time',
    experience: '4+ years',
    salary: '$100,000 Base / $200,000 OTE + Equity',
    summary: 'Drive net-new enterprise revenue by closing high-ticket AI voice agent contracts across Real Estate, Healthcare, and Finance.',
    responsibilities: [
      'Manage full sales cycles from discovery to contract execution for enterprise prospects.',
      'Conduct live technical demos of AI voice agents, phone answering, and CRM workflows.',
      'Partner with solution engineers to structure custom white-label and volume pricing agreements.',
      'Exceed quarterly revenue quotas while maintaining high CRM pipeline hygiene.'
    ],
    requirements: [
      '4+ years in enterprise B2B SaaS sales or technology solution selling.',
      'Proven track record of consistently exceeding $1M+ annual sales quotas.',
      'Strong understanding of conversational AI, API integrations, and corporate buying processes.',
      'Exceptional communication, negotiation, and relationship-building skills.'
    ],
    skills: ['Enterprise Sales', 'B2B SaaS', 'Solution Selling', 'Contract Negotiation']
  },
  {
    id: 'product-marketing-manager',
    title: 'Product Marketing Manager (AI & Developer Tools)',
    department: 'marketing',
    departmentName: 'Sales & Growth',
    location: 'Remote (Global)',
    type: 'Full-time',
    experience: '3+ years',
    salary: '$90,000 - $130,000 + Equity',
    summary: 'Lead product launches, customer case studies, positioning, and developer marketing collateral for Autoniv.',
    responsibilities: [
      'Draft compelling messaging and positioning for new AI voice & chatbot capabilities.',
      'Create high-converting landing pages, interactive product walkthroughs, and pitch decks.',
      'Analyze competitor landscapes, customer persona requirements, and industry vertical trends.',
      'Collaborate with product and growth teams to execute multi-channel launch campaigns.'
    ],
    requirements: [
      '3+ years in Product Marketing for B2B SaaS, developer platforms, or AI tech.',
      'Exceptional technical copywriting skills and storytelling abilities.',
      'Experience launching products on ProductHunt, TechCrunch, and developer forums.',
      'Analytical mindset with proficiency in tracking funnel conversion metrics.'
    ],
    skills: ['Product Launches', 'Copywriting', 'Positioning', 'GTM Strategy', 'Analytics']
  },
  {
    id: 'sr-customer-success-manager',
    title: 'Senior Customer Success Manager (AI Deployments)',
    department: 'success',
    departmentName: 'Customer Success',
    location: 'Remote (Global)',
    type: 'Full-time',
    experience: '4+ years',
    salary: '$85,000 - $115,000 + Equity',
    summary: 'Guide enterprise clients through onboarding, prompt tuning, CRM webhooks, and call optimization to maximize retention.',
    responsibilities: [
      'Own client relationships post-sale, ensuring rapid onboarding and agent launch.',
      'Review call transcripts and voice agent analytics to recommend prompt optimizations.',
      'Track net retention, expansion opportunities, and product adoption health scores.',
      'Serve as the primary liaison between key client stakeholders and our engineering team.'
    ],
    requirements: [
      '4+ years in B2B SaaS Customer Success, Account Management, or Technical Onboarding.',
      'Strong technical aptitude for understanding webhooks, API keys, and prompt engineering.',
      'Empathy, proactive problem-solving, and stellar written/verbal communication.',
      'Experience managing enterprise accounts with high ARR value.'
    ],
    skills: ['Customer Success', 'Onboarding', 'Account Retention', 'Prompt Tuning']
  }
];

const PERKS = [
  { icon: '🌍', title: '100% Remote-First', desc: 'Work from anywhere in the world with flexible working hours tailored to your lifestyle.' },
  { icon: '💰', title: 'Top-of-Market Pay & Equity', desc: 'Competitive salary benchmarked against top global tech hubs plus generous stock options.' },
  { icon: '🏥', title: 'Comprehensive Healthcare', desc: 'Full medical, dental, and vision insurance coverage for you and your dependents.' },
  { icon: '📚', title: '$2,000 Learning Budget', desc: 'Annual budget for online courses, technical books, workshops, and global conferences.' },
  { icon: '💻', title: 'Latest Hardware & Office Setup', desc: 'Choice of M3/M4 MacBook Pro or custom workstation plus a $1,000 home office stipend.' },
  { icon: '🏖️', title: 'Unlimited Flexible PTO', desc: 'Take time off whenever you need it, with a mandatory minimum of 20 days off per year.' },
  { icon: '✈️', title: 'Annual Global Retreats', desc: 'All-expenses-paid team retreats to bring our worldwide team together in exciting locations.' },
  { icon: '👶', title: 'Parental & Wellness Leave', desc: 'Generous paid parental leave, mental health days, and monthly wellness reimbursements.' }
];

const VALUES = [
  {
    number: '01',
    title: 'Velocity & Continuous Iteration',
    desc: 'We move fast, test hypothesis quickly, and deploy code daily. Perfection is achieved through constant real-world feedback.'
  },
  {
    number: '02',
    title: 'Customer-Centric Precision',
    desc: 'Every voice agent prompt, latency optimization, and feature directly resolves real business bottlenecks and drives customer ROI.'
  },
  {
    number: '03',
    title: 'Extreme Ownership & Autonomy',
    desc: 'We trust our team members with full end-to-end responsibility. You own your projects from concept to production deployment.'
  },
  {
    number: '04',
    title: 'Radical Transparency & Trust',
    desc: 'We share metrics, strategy, and roadmaps openly across the company. Open communication builds trust and alignment.'
  },
  {
    number: '05',
    title: 'Continuous Mastery & Curiosity',
    desc: 'The AI landscape evolves weekly. We encourage relentless learning, experimentation with new tools, and sharing insights.'
  },
  {
    number: '06',
    title: 'Resilience & Enterprise Security',
    desc: 'We build enterprise infrastructure that handles millions of calls reliably. Security, privacy, and uptime are non-negotiable.'
  }
];

const HIRING_STEPS = [
  { step: '01', title: 'Application Review', desc: 'We carefully review your resume, portfolio, or past projects within 48 hours.' },
  { step: '02', title: 'Recruiter Chat', desc: 'A 30-minute introductory video call to discuss your career background and alignment.' },
  { step: '03', title: 'Technical / Skill Challenge', desc: 'A realistic, practical exercise or code review focused on real-world engineering tasks.' },
  { step: '04', title: 'Architecture & Team Deep-Dive', desc: 'A 90-minute session with engineering or functional leads to discuss system design & workflows.' },
  { step: '05', title: 'Offer & Onboarding', desc: 'We extend a competitive offer and set up your seamless remote onboarding journey.' }
];

export function Careers() {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [activeJobModal, setActiveJobModal] = useState<JobRole | null>(null);
  const [spontaneousModal, setSpontaneousModal] = useState<boolean>(false);

  // Application form states inside modal
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantLinkedin, setApplicantLinkedin] = useState('');
  const [applicantPortfolio, setApplicantPortfolio] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const filteredRoles = selectedDept === 'all'
    ? OPEN_ROLES
    : OPEN_ROLES.filter(r => r.department === selectedDept);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1200);
  };

  const resetModalForm = () => {
    setActiveJobModal(null);
    setSpontaneousModal(false);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
    setApplicantLinkedin('');
    setApplicantPortfolio('');
    setApplicantNote('');
    setSubmitSuccess(false);
  };

  return (
    <div style={{ background: '#FAFBFD', color: INK, minHeight: '100vh', fontFamily: SANS }}>
      <PublicNavbar />

      {/* ─── HERO SECTION ─── */}
      <section style={{
        position: 'relative',
        padding: '90px 24px 70px',
        background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFD 100%)',
        borderBottom: `1px solid ${HAIRLINE}`,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <SectionLabel text="CAREERS AT AUTONIV" />
            <h1 style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: INK,
              marginBottom: 20
            }}>
              Build the Future of <GradientText>Autonomous AI Voice</GradientText> & Communication
            </h1>
            <p style={{
              color: SLATE,
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              lineHeight: 1.7,
              maxWidth: 680,
              margin: '0 auto 36px'
            }}>
              Join a team of visionaries, machine learning engineers, and product builders transforming how businesses converse with customers globally in 50+ languages.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="#open-positions"
                style={{
                  background: BRAND,
                  color: '#fff',
                  padding: '14px 32px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px -4px rgba(37,99,235,0.3)'
                }}
              >
                Explore Open Roles ↓
              </a>
              <button
                onClick={() => setSpontaneousModal(true)}
                style={{
                  background: SURFACE,
                  color: INK,
                  padding: '14px 28px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  border: `1px solid ${HAIRLINE}`,
                  cursor: 'pointer'
                }}
              >
                Send General Resume
              </button>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div style={{ marginTop: 64 }}>
            <Reveal delay={200}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 20,
                background: SURFACE,
                padding: '24px 32px',
                borderRadius: 20,
                border: `1px solid ${HAIRLINE}`,
                boxShadow: '0 4px 20px -2px rgba(15,23,42,0.04)'
              }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', fontFamily: MONO }}>1,000+</div>
                  <div style={{ fontSize: 13, color: SLATE, marginTop: 4, fontWeight: 500 }}>Active Deployments</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', fontFamily: MONO }}>20+</div>
                  <div style={{ fontSize: 13, color: SLATE, marginTop: 4, fontWeight: 500 }}>Global Team Members</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', fontFamily: MONO }}>100%</div>
                  <div style={{ fontSize: 13, color: SLATE, marginTop: 4, fontWeight: 500 }}>Remote-First Culture</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', fontFamily: MONO }}>4.9 / 5</div>
                  <div style={{ fontSize: 13, color: SLATE, marginTop: 4, fontWeight: 500 }}>Employee Satisfaction</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── CULTURE & VALUES ─── */}
      <section style={{ padding: '90px 24px', background: SURFACE }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Reveal>
              <SectionLabel text="OUR CORE CULTURE" />
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 800, color: INK }}>
                The Values That Drive Our Engineering & Team Spirit
              </h2>
            </Reveal>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {VALUES.map((val, idx) => (
              <Reveal key={val.title} delay={idx * 80}>
                <div style={{
                  padding: 32,
                  borderRadius: 20,
                  background: '#FAFBFD',
                  border: `1px solid ${HAIRLINE}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', fontFamily: MONO, marginBottom: 12 }}>
                    {val.number}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 10 }}>
                    {val.title}
                  </h3>
                  <p style={{ fontSize: 14.5, color: SLATE, lineHeight: 1.65, margin: 0 }}>
                    {val.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PERKS & BENEFITS ─── */}
      <section style={{ padding: '90px 24px', background: '#F8FAFC', borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Reveal>
              <SectionLabel text="PERKS & BENEFITS" />
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 800, color: INK }}>
                Empowering You to Do Your Best Work
              </h2>
              <p style={{ color: SLATE, fontSize: 16, marginTop: 8, maxWidth: 560, margin: '8px auto 0' }}>
                We invest heavily in our people, providing premium compensation, continuous learning, and total flexibility.
              </p>
            </Reveal>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {PERKS.map((p, i) => (
              <Reveal key={p.title} delay={i * 60}>
                <div style={{
                  padding: 24,
                  borderRadius: 16,
                  background: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
                  height: '100%'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 6 }}>{p.title}</h3>
                  <p style={{ fontSize: 13.5, color: SLATE, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OPEN POSITIONS ─── */}
      <section id="open-positions" style={{ padding: '90px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <Reveal>
              <SectionLabel text="OPEN POSITIONS" />
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 800, color: INK }}>
                Join Us in Shaping Conversational AI
              </h2>
              <p style={{ color: SLATE, fontSize: 16, marginTop: 8 }}>
                Explore open opportunities across engineering, product, marketing, and success.
              </p>
            </Reveal>
          </div>

          {/* Department Filter Tabs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { id: 'all', label: 'All Roles' },
              { id: 'engineering', label: 'Engineering & AI' },
              { id: 'product', label: 'Product & Design' },
              { id: 'sales', label: 'Sales & Marketing' },
              { id: 'success', label: 'Customer Success' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedDept(tab.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 600,
                  border: `1px solid ${selectedDept === tab.id ? '#2563EB' : HAIRLINE}`,
                  background: selectedDept === tab.id ? 'rgba(37,99,235,0.08)' : SURFACE,
                  color: selectedDept === tab.id ? '#2563EB' : SLATE,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Roles List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredRoles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: SLATE }}>
                <p>No open roles currently match this category.</p>
              </div>
            ) : (
              filteredRoles.map(role => (
                <Reveal key={role.id}>
                  <div style={{
                    padding: '24px 28px',
                    borderRadius: 16,
                    background: '#FAFBFD',
                    border: `1px solid ${HAIRLINE}`,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 20,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}>
                    <div style={{ flex: '1 1 400px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(37,99,235,0.1)',
                          color: '#2563EB',
                          textTransform: 'uppercase',
                          fontFamily: MONO
                        }}>
                          {role.departmentName}
                        </span>
                        <span style={{ fontSize: 12.5, color: SLATE }}>📍 {role.location}</span>
                        <span style={{ fontSize: 12.5, color: SLATE }}>⏱️ {role.type}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: '0 0 6px' }}>
                        {role.title}
                      </h3>
                      <p style={{ fontSize: 14, color: SLATE, margin: '0 0 12px', lineHeight: 1.5 }}>
                        {role.summary}
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {role.skills.map(skill => (
                          <span key={skill} style={{
                            fontSize: 11.5,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: SURFACE,
                            border: `1px solid ${HAIRLINE}`,
                            color: SLATE
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#10B981', fontFamily: MONO }}>
                        {role.salary}
                      </div>
                      <button
                        onClick={() => {
                          setActiveJobModal(role);
                          setSubmitSuccess(false);
                        }}
                        style={{
                          background: BRAND,
                          color: '#fff',
                          padding: '10px 22px',
                          borderRadius: 999,
                          fontSize: 13.5,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px -2px rgba(37,99,235,0.3)'
                        }}
                      >
                        View Role & Apply →
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── HIRING PROCESS ─── */}
      <section style={{ padding: '90px 24px', background: '#F8FAFC', borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Reveal>
              <SectionLabel text="OUR HIRING PROCESS" />
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', fontWeight: 800, color: INK }}>
                Fast, Transparent, and Focused on Real Skills
              </h2>
            </Reveal>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {HIRING_STEPS.map((step, idx) => (
              <Reveal key={step.step} delay={idx * 70}>
                <div style={{
                  padding: 24,
                  borderRadius: 16,
                  background: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  position: 'relative',
                  height: '100%'
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: MONO, marginBottom: 10 }}>
                    {step.step}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: SLATE, lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPONTANEOUS CTA BANNER ─── */}
      <section style={{ padding: '90px 24px', background: SURFACE, borderTop: `1px solid ${HAIRLINE}` }}>
        <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{
              background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FDF4 100%)',
              borderRadius: 24,
              padding: '48px 36px',
              border: `1px solid ${HAIRLINE}`
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 12 }}>Don't See Your Exact Role?</h2>
              <p style={{ color: SLATE, fontSize: 15, marginBottom: 28, maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.6 }}>
                We are always looking for world-class talent in AI research, WebRTC infrastructure, and growth engineering. Send us your resume and background note.
              </p>
              <button
                onClick={() => {
                  setSpontaneousModal(true);
                  setSubmitSuccess(false);
                }}
                style={{
                  background: BRAND,
                  color: '#fff',
                  padding: '14px 36px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px -4px rgba(37,99,235,0.3)'
                }}
              >
                Submit General Application →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── JOB APPLICATION MODAL ─── */}
      {(activeJobModal || spontaneousModal) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: SURFACE,
            borderRadius: 24,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '36px 32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            border: `1px solid ${HAIRLINE}`
          }}>
            {/* Close Button */}
            <button
              onClick={resetModalForm}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(15,23,42,0.06)',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                color: INK
              }}
            >
              ✕
            </button>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: INK, marginBottom: 12 }}>Application Submitted Successfully!</h3>
                <p style={{ color: SLATE, fontSize: 15, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
                  Thank you for applying to Autoniv. Our recruiting team will review your information and get back to you within 48 hours.
                </p>
                <button
                  onClick={resetModalForm}
                  style={{
                    background: BRAND,
                    color: '#fff',
                    padding: '12px 32px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', fontFamily: MONO, textTransform: 'uppercase' }}>
                    {activeJobModal ? activeJobModal.departmentName : 'SPONTANEOUS APPLICATION'}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: '4px 0 8px' }}>
                    {activeJobModal ? activeJobModal.title : 'General Application — Autoniv Careers'}
                  </h2>
                  {activeJobModal && (
                    <p style={{ fontSize: 13.5, color: SLATE, margin: 0 }}>
                      📍 {activeJobModal.location} · 💰 {activeJobModal.salary}
                    </p>
                  )}
                </div>

                {activeJobModal && (
                  <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 14, marginBottom: 24, border: `1px solid ${HAIRLINE}` }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: INK, margin: '0 0 8px', textTransform: 'uppercase' }}>Key Responsibilities</h4>
                    <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: SLATE, lineHeight: 1.6 }}>
                      {activeJobModal.responsibilities.slice(0, 3).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={applicantName}
                        onChange={e => setApplicantName(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={applicantEmail}
                        onChange={e => setApplicantEmail(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>LinkedIn Profile URL</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={applicantLinkedin}
                        onChange={e => setApplicantLinkedin(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>GitHub / Portfolio URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={applicantPortfolio}
                        onChange={e => setApplicantPortfolio(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>Resume / CV Link *</label>
                    <input
                      type="url"
                      required
                      placeholder="Google Drive, Dropbox, or PDF URL"
                      value={applicantPhone}
                      onChange={e => setApplicantPhone(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 6 }}>Brief Introduction / Cover Note</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us briefly about your background and why you are excited about building AI voice agents at Autoniv..."
                      value={applicantNote}
                      onChange={e => setApplicantNote(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: `1px solid ${HAIRLINE}`, outline: 'none', fontSize: 14, fontFamily: SANS
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: BRAND,
                      color: '#fff',
                      padding: '14px',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: 8,
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application Now →'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Careers;
