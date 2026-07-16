// import AIAssistantChat from '../../components/AIAssistantChat';
import { Link } from 'react-router-dom';
import { Stagger, StaggerItem } from './sections/anim';

import logoAutonivFull from '../../assets/autoniv-full-logo.webp';

const LOGO_SRC = logoAutonivFull;

const SOCIAL_LINKS = [
  {
    label: 'X (Twitter)',
    href: 'https://x.com/Autoniv_',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.843L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/autoniv/',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61577457813652&sk',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/autoniv_/',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
];

const NAV_COLS = [
  {
    heading: 'Product',
    links: [
      { href: '#features', label: 'Features', scroll: true },
      { href: '#contact', label: 'Contact Us', scroll: true },
      { href: '#addons', label: 'Add-Ons', scroll: true },
      { href: '#', label: 'API Docs' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/careers', label: 'Careers' },
      { href: '/blog', label: 'Blog' },
      { href: '/press', label: 'Press' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { href: '/help', label: 'Help Center' },
      { href: '#contact', label: 'Contact', scroll: true },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
];

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export default function Footer() {
  return (
    <>
    <footer
      style={{
        borderTop: '1px solid rgba(16,185,129,0.10)',
        background: 'rgba(4,8,18,0.98)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Green-Blue glow effect */}
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.04), rgba(37,99,235,0.02) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.03), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-10" style={{ position: 'relative', zIndex: 1 }}>
        <Stagger className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12" stagger={0.12} amount={0.15}>

          {/* Brand column — FULL WIDTH on mobile (col-span-1), spans 2 on tablet, spans 2 on lg */}
          <StaggerItem variant="fadeUp" className="col-span-1 sm:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block -mb-8 -mx-6 sm:-mx-4 -mt-10 sm:mt-0">
              <img src={LOGO_SRC} alt="Autoniv Full Logo" width={180} height={120} style={{ height: 120 }} />
            </Link>
            <p
              style={{
                color: 'rgba(148,175,210,0.75)',
                fontSize: 13.5,
                lineHeight: 1.7,
                maxWidth: 260,
                marginBottom: 20,
              }}
            >
              AI voice agents that handle your calls, capture every lead, and
              scale your business 24/7.
            </p>

            {/* Social icons - Green-Blue theme */}
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="social-bounce"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.14)',
                    color: 'rgba(148,175,210,0.7)',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.16)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)';
                    e.currentTarget.style.color = '#34d399';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.07)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.14)';
                    e.currentTarget.style.color = 'rgba(148,175,210,0.7)';
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Trust badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '6px 14px',
              borderRadius: 99,
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.08)',
            }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span style={{ fontSize: 11, color: 'rgba(148,175,210,0.6)' }}>
                Trusted by 2,000+ businesses
              </span>
            </div>
          </StaggerItem>

          {/* Nav columns - On mobile: each takes full width (col-span-1) */}
          {NAV_COLS.map((col) => (
            <StaggerItem key={col.heading} variant="fadeUp" className="col-span-1">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(16,185,129,0.7)',
                  marginBottom: 16,
                }}
              >
                {col.heading}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map(({ href, label, scroll }) => (
                  <li key={label} style={{ marginBottom: 10 }}>
                    {href.startsWith('/') ? (
                      <Link
                        to={href}
                        className="link-underline"
                        style={{
                          fontSize: 13.5,
                          color: 'rgba(148,175,210,0.65)',
                          textDecoration: 'none',
                          transition: 'color 0.18s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'rgba(148,175,210,1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(148,175,210,0.65)';
                        }}
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        className="link-underline"
                        onClick={
                          scroll
                            ? (e) => scrollToSection(e as React.MouseEvent<HTMLAnchorElement>, href)
                            : undefined
                        }
                        style={{
                          fontSize: 13.5,
                          color: 'rgba(148,175,210,0.65)',
                          textDecoration: 'none',
                          transition: 'color 0.18s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'rgba(148,175,210,1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(148,175,210,0.65)';
                        }}
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Trust badges row - Green-Blue theme */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(16,185,129,0.08)',
          }}
        >
          {[
            { icon: '🔒', text: 'SOC 2 Certified' },
            { icon: '🌐', text: '20+ Languages' },
            { icon: '⚡', text: '99.9% Uptime' },
            { icon: '🔗', text: '50+ Integrations' },
            { icon: '⭐', text: '4.9/5 Rating' },
          ].map(({ icon, text }) => (
            <span
              key={text}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 20,
                background: 'rgba(16,185,129,0.04)',
                border: '1px solid rgba(16,185,129,0.08)',
                fontSize: 11.5,
                color: 'rgba(148,175,210,0.7)',
                letterSpacing: '0.01em',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.08)';
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.04)';
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 12 }}>{icon}</span>
              {text}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <p
            style={{
              fontSize: 11.5,
              color: 'rgba(148,175,210,0.38)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            © 2026 Autoniv. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            />

          </div>
        </div>

        {/* Newsletter signup (optional enhancement) */}
        <div style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid rgba(16,185,129,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{
            fontSize: 12,
            color: 'rgba(148,175,210,0.5)',
          }}>
            🚀 Stay updated with the latest AI voice technology
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(16,185,129,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: '#e2e8f0',
                fontSize: 12,
                width: 200,
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.1)';
              }}
            />
            <button
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #2563eb)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

    </footer>
    </>
  );
}