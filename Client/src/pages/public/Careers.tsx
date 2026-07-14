import { Link } from 'react-router-dom';

const OPEN_ROLES = [
  { department: 'Engineering', title: 'Senior Full-Stack Engineer', type: 'Full-time', location: 'Remote' },
  { department: 'Engineering', title: 'AI/ML Engineer', type: 'Full-time', location: 'Remote' },
  { department: 'Product', title: 'Product Designer', type: 'Full-time', location: 'Remote' },
  { department: 'Growth', title: 'Growth Marketing Lead', type: 'Full-time', location: 'Remote' },
  { department: 'Sales', title: 'Enterprise Account Executive', type: 'Full-time', location: 'India / Remote' },
];

const PERKS = [
  { icon: '🌍', title: 'Remote-First', desc: 'Work from anywhere in the world.' },
  { icon: '💰', title: 'Competitive Pay', desc: 'Top-of-market salary and equity.' },
  { icon: '🏥', title: 'Health Benefits', desc: 'Comprehensive health coverage for you and family.' },
  { icon: '📚', title: 'Learning Budget', desc: 'Annual budget for courses, books, and conferences.' },
  { icon: '🏖️', title: 'Unlimited PTO', desc: 'Take time off when you need it.' },
  { icon: '🚀', title: 'Fast Growth', desc: 'Grow your career with a rapidly scaling startup.' },
];

export function Careers() {
  return (
    <div className="min-h-screen" style={{ background: '#050d1a' }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ color: '#e8f8ff', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Careers at Autoniv</h1>
          <p style={{ color: 'rgba(148,175,210,0.7)', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            Help us build the future of AI-powered business communication.
            We're looking for passionate people to join our team.
          </p>
        </div>

        {/* Perks */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#0077ff', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Why Join Us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {PERKS.map(p => (
              <div key={p.title} style={{
                padding: 20, borderRadius: 12,
                border: '1px solid rgba(0,119,255,0.12)',
                background: 'rgba(6,18,36,0.5)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                <h3 style={{ color: '#e8f8ff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.title}</h3>
                <p style={{ color: 'rgba(148,175,210,0.6)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Roles */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#0077ff', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Open Positions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OPEN_ROLES.map(r => (
              <div key={r.title} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                padding: '16px 20px', borderRadius: 12,
                border: '1px solid rgba(0,119,255,0.12)',
                background: 'rgba(6,18,36,0.5)',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,119,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,119,255,0.12)'}
              >
                <div>
                  <h3 style={{ color: '#e8f8ff', fontSize: 14.5, fontWeight: 600, margin: '0 0 4px' }}>{r.title}</h3>
                  <p style={{ color: 'rgba(148,175,210,0.55)', fontSize: 12.5, margin: 0 }}>
                    {r.department} · {r.location} · {r.type}
                  </p>
                </div>
                <span style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(0,119,255,0.2)',
                  color: '#0077ff', fontSize: 12.5, fontWeight: 500, flexShrink: 0,
                }}>Apply</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{
          textAlign: 'center', padding: 40, borderRadius: 16,
          border: '1px solid rgba(0,119,255,0.15)', background: 'rgba(0,119,255,0.04)',
        }}>
          <h3 style={{ color: '#e8f8ff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Don't see your role?</h3>
          <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 14, marginBottom: 20 }}>
            Send us your resume and we'll reach out when something fits.
          </p>
          <Link to="/#contact" style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 10,
            background: 'linear-gradient(135deg, #0077ff, #00c8b4)',
            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>Get in Touch</Link>
        </div>

      </div>
    </div>
  );
}

export default Careers;
