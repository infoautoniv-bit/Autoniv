import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AuthDialog = lazy(() =>
  import('../pages/public/AuthDialog').then((m) => ({ default: m.AuthDialog }))
);

const GoogleTranslate = lazy(() =>
  import('./GoogleTranslate').then((m) => ({ default: m.GoogleTranslate }))
);

const LOGO_SRC = '/logo-180.webp';
const LOGO_SRC_2X = '/logo-360.webp';

function MagBtn({
  children,
  className,
  to,
  onClick,
  style,
}: {
  children: React.ReactNode;
  className: string;
  to?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const onEnter = () => {
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect();
  };

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!rectRef.current) rectRef.current = el.getBoundingClientRect();
    const r = rectRef.current;
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.35}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  };

  const onLeave = () => {
    rectRef.current = null;
    if (ref.current) ref.current.style.transform = 'none';
  };

  const inner = to ? (
    <Link to={to} className={className} style={style}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );

  return (
    <div
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform .28s cubic-bezier(.23,1,.32,1)', display: 'inline-block' }}
    >
      {inner}
    </div>
  );
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'reset_password';

export type NavItem = {
  label: string;
  href: string;
  isHash?: boolean;
  badge?: string;
  hasDropdown?: boolean;
  dropdownItems?: {
    label: string;
    desc?: string;
    href: string;
    icon?: React.ReactNode;
    badgeBg?: string;
  }[];
};

const NAV_ITEMS: NavItem[] = [
  { label: 'How It Works', href: '#how-it-works', isHash: true },
  { label: 'Features', href: '#features', isHash: true },
  { label: 'Services', href: '/services' },
  { label: 'Case Studies', href: '/case-studies' },
  {
    label: 'Pricing',
    href: '/pricing',
    hasDropdown: true,
    dropdownItems: [
      {
        label: 'AI Voice Assistance',
        desc: 'Custom voice agents & phone automation',
        href: '/pricing/voice-assistance',
        badgeBg: 'bg-blue-50 border-blue-100 text-blue-600',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ),
      },
      {
        label: 'AI Chatbots',
        desc: 'Smart web & WhatsApp chat widgets',
        href: '/pricing/ai-chatbot',
        badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
    ],
  },
  { label: 'Demos', href: '/demos', badge: 'LIVE' },
  { label: 'News', href: '/news', badge: 'NEW' },
  { label: 'Contact', href: '#contact', isHash: true },
  { label: 'About Us', href: '/about' },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialog, setAuthDialog] = useState<AuthMode | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = NAV_ITEMS;

  const [selectedLabel, setSelectedLabel] = useState<string | null>(() => {
    const match = NAV_ITEMS.find((i) => !i.isHash && i.href === location.pathname);
    return match ? match.label : null;
  });

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthDialog(mode);
  };
  const closeAuth = () => setAuthDialog(null);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const c = (e: MouseEvent) => {
      const target = e.target as Node;
      if (drawerRef.current?.contains(target)) return;
      if (navRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', c);
    return () => document.removeEventListener('mousedown', c);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMobileMenuOpen(false);
      if (!location.hash) {
        const match = NAV_ITEMS.find((i) => !i.isHash && i.href === location.pathname);
        if (match) setSelectedLabel(match.label);
        else if (location.pathname === '/') setSelectedLabel(null);
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    setSelectedLabel(item.label);
    if (item.isHash) {
      e.preventDefault();
      const targetId = item.href.replace('#', '');
      if (location.pathname === '/') {
        const el =
          document.getElementById(targetId) ||
          document.getElementById(targetId + 's') ||
          (targetId.endsWith('s') ? document.getElementById(targetId.slice(0, -1)) : null);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      } else {
        navigate('/' + item.href);
      }
    }
  };

  return (
    <>
      <div className="fixed top-9 sm:top-9 xl:top-9 inset-x-0 z-50 px-3 sm:px-5 lg:px-6 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          ref={navRef}
          className="w-full max-w-[1400px] h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 rounded-full shadow-lg pointer-events-auto transition-all duration-300 overflow-hidden"
          style={{
            background: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.90)',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center h-full notranslate"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Autoniv home"
          >
            <img
              src={LOGO_SRC}
              srcSet={`${LOGO_SRC} 1x, ${LOGO_SRC_2X} 2x`}
              alt="Autoniv Brand Logo"
              width={180}
              height={120}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="h-30 sm:h-30 w-auto object-contain transition-transform hover:scale-105"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden xl:flex items-center gap-0.5 2xl:gap-1.5 flex-1 justify-center h-full px-1 min-w-0">
            {navItems.map((item) => {
              if (item.dropdownItems) {
                return (
                  <div key={item.label} className="relative group flex items-center h-full py-2 flex-shrink-0">
                    <Link
                      to={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className="relative px-1.5 2xl:px-2.5 py-1.5 text-xs 2xl:text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap rounded-full flex items-center gap-1"
                      style={{ color: '#475569' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#0a0a0a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                    >
                      <span>{item.label}</span>
                      <svg className="w-2.5 h-2.5 ml-0.5 inline text-slate-400 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-2 space-y-1">
                        <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                          Pricing Options
                        </div>
                        {item.dropdownItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.href}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/sub"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${subItem.badgeBg || 'bg-blue-50 text-blue-600 border-blue-100'} transition-transform group-hover/sub:scale-105`}>
                              {subItem.icon}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 group-hover/sub:text-blue-600 transition-colors leading-tight">
                                {subItem.label}
                              </span>
                              {subItem.desc && (
                                <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                  {subItem.desc}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.isHash ? `/${item.href}` : item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className="relative px-1.5 2xl:px-2.5 py-1.5 text-xs 2xl:text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap rounded-full flex items-center flex-shrink-0"
                  style={{ color: '#475569' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-[8px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden xl:flex items-center gap-1.5 2xl:gap-2 flex-shrink-0">
            <Suspense fallback={<div className="w-[72px] h-[34px]" />}>
              <GoogleTranslate />
            </Suspense>
            <button
              onClick={() => openAuth('login')}
              className="px-3 2xl:px-4 py-2 text-xs 2xl:text-sm font-semibold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer"
              style={{
                color: '#475569',
                border: '1px solid rgba(37,99,235,0.15)',
                background: 'transparent',
                minHeight: '38px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)';
                e.currentTarget.style.background = 'rgba(37,99,235,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.borderColor = 'rgba(37,99,235,0.15)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Sign In
            </button>
            <MagBtn
              onClick={() => openAuth('register')}
              className="font-bold text-white cursor-pointer whitespace-nowrap"
              style={{
                background: 'var(--gg)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                borderRadius: '9999px',
                padding: '8px 14px',
                border: 'none',
                fontSize: '12px',
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Get Started Free
            </MagBtn>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              color: '#475569',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        className="xl:hidden fixed inset-0 z-[55] transition-opacity duration-300"
        style={{
          background: 'rgba(15,23,42,0.45)',
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
        }}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Slide-in drawer */}
      <div
        ref={drawerRef}
        className="xl:hidden fixed top-0 right-0 h-full z-[100] flex flex-col"
        style={{
          width: 'min(85vw, 320px)',
          background: 'rgba(255,255,255,0.99)',
          borderLeft: '1px solid rgba(37,99,235,0.12)',
          boxShadow: mobileMenuOpen ? '-12px 0 40px rgba(0,0,0,0.14)' : 'none',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .32s cubic-bezier(.23,1,.32,1)',
          willChange: 'transform',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 h-14 sm:h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(37,99,235,0.10)' }}
        >
          <Link
            to="/"
            className="flex items-center"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Autoniv home"
          >
            <img src={LOGO_SRC} alt="Autoniv Brand Logo" width={240} height={160} className="-ml-6 h-40 sm:h-40 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-11 h-11 rounded-lg"
            style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const hasSub = item.dropdownItems;
            return (
              <div key={item.label} className="flex flex-col">
                <Link
                  to={item.isHash ? `/${item.href}` : item.href}
                  onClick={(e) => {
                    if (!hasSub) {
                      handleNavClick(e, item);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="flex items-center min-h-[48px] px-4 py-3 text-sm font-semibold rounded-xl transition-colors duration-150"
                  style={{
                    color: selectedLabel === item.label ? '#2563EB' : '#475569',
                    background: selectedLabel === item.label ? 'rgba(37,99,235,0.06)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
                {hasSub && (
                  <div className="ml-4 pl-3 py-1 space-y-1 border-l-2 border-blue-500/30 my-1">
                    {item.dropdownItems?.map((subItem) => (
                      <Link
                        key={subItem.label}
                        to={subItem.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors"
                      >
                        <span className="text-blue-600 shrink-0">{subItem.icon}</span>
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Drawer footer CTAs */}
        <div
          className="mb-10 px-4 py-4 space-y-2 flex-shrink-0 flex flex-col items-center"
          style={{ borderTop: '1px solid rgba(37,99,235,0.10)' }}
        >
          <div className="w-full flex justify-center pb-2">
            <Suspense fallback={<div className="w-[72px] h-[34px]" />}>
              <GoogleTranslate />
            </Suspense>
          </div>
          <button
            onClick={() => {
              openAuth('login');
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center w-full min-h-[48px] px-4 py-3 text-sm font-semibold rounded-xl transition-colors duration-150"
            style={{
              color: '#475569',
              background: 'none',
              border: '1px solid rgba(37,99,235,0.18)',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              openAuth('register');
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-center w-full min-h-[48px] px-4 py-3 text-sm font-bold text-white rounded-xl transition-opacity duration-150 hover:opacity-90"
            style={{
              background: 'var(--gg)',
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start for Free
          </button>
        </div>
      </div>

      <Suspense fallback={null}>
        <AuthDialog
          isOpen={authDialog !== null}
          mode={authMode}
          onClose={closeAuth}
          onSwitch={(m) => {
            setAuthMode(m);
            setAuthDialog(m);
          }}
        />
      </Suspense>
    </>
  );
}

export default PublicNavbar;