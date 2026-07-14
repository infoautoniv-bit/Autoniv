const PRESS_RELEASES = [
  {
    date: 'June 2026',
    title: 'Autoniv Launches AI Voice Agent Platform for Businesses Worldwide',
    summary: 'New platform enables companies to deploy intelligent voice assistants in 20+ languages without writing code.',
  },
];

const MEDIA_ASSETS = [
  { name: 'Autoniv Logo (PNG)', desc: 'High-resolution logo for press use.' },
  { name: 'Autoniv Logo (SVG)', desc: 'Vector logo for print and digital.' },
  { name: 'Brand Colors', desc: 'Primary: #0077ff, Secondary: #00c8b4, Accent: #00e5a0' },
];

export function Press() {
  return (
    <div className="min-h-screen" style={{ background: '#050d1a' }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ color: '#e8f8ff', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Press & Media</h1>
          <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
            Resources for journalists, bloggers, and media partners.
          </p>
        </div>

        {/* Press Releases */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#0077ff', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Press Releases</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PRESS_RELEASES.map(pr => (
              <div key={pr.title} style={{
                padding: 24, borderRadius: 14,
                border: '1px solid rgba(0,119,255,0.12)',
                background: 'rgba(6,18,36,0.5)',
              }}>
                <span style={{ color: 'rgba(148,175,210,0.45)', fontSize: 12.5, display: 'block', marginBottom: 8 }}>{pr.date}</span>
                <h3 style={{ color: '#e8f8ff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{pr.title}</h3>
                <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{pr.summary}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand Assets */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ color: '#0077ff', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Brand Assets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MEDIA_ASSETS.map(a => (
              <div key={a.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                padding: '14px 18px', borderRadius: 10,
                border: '1px solid rgba(0,119,255,0.1)',
                background: 'rgba(6,18,36,0.4)',
              }}>
                <div>
                  <h4 style={{ color: '#e8f8ff', fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>{a.name}</h4>
                  <p style={{ color: 'rgba(148,175,210,0.5)', fontSize: 12, margin: 0 }}>{a.desc}</p>
                </div>
                <span style={{
                  padding: '5px 12px', borderRadius: 6,
                  border: '1px solid rgba(0,119,255,0.15)',
                  color: '#0077ff', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                }}>Download</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div style={{
          textAlign: 'center', padding: 40, borderRadius: 16,
          border: '1px solid rgba(0,119,255,0.15)', background: 'rgba(0,119,255,0.04)',
        }}>
          <h3 style={{ color: '#e8f8ff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Media Inquiries</h3>
          <p style={{ color: 'rgba(148,175,210,0.65)', fontSize: 14 }}>
            For press inquiries, please contact <span style={{ color: '#0077ff' }}>press@autoniv.com</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Press;
