import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AuthDialog = lazy(() =>
  import('../pages/public/AuthDialog').then((m) => ({ default: m.AuthDialog }))
);

import logoBrand from '../assets/autoniv-brand-logo.webp';

const LOGO_SRC = logoBrand;

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
  dropdownItems?: { label: string; href: string }[];
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
      { label: 'AI Voice Assistance', href: '/pricing/voice-assistance' },
      { label: 'AI Chatbots', href: '/pricing/ai-chatbot' },
    ],
  },
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
        const el = document.getElementById(targetId);
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
      <div className="fixed top-[35px] inset-x-0 z-50 px-4 sm:px-6 lg:px-8 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          ref={navRef}
          className="w-full max-w-8xl h-14 sm:h-16 flex items-center justify-between px-6 rounded-full shadow-lg pointer-events-auto transition-all duration-300"
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
            className="flex-shrink-0 flex items-center h-full"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Autoniv home"
          >
            <img
              src={LOGO_SRC}
              alt="Autoniv Brand Logo"
              width={180}
              height={120}
              fetchPriority="high"
              decoding="sync"
              className="h-30 sm:h-30 w-auto object-contain transition-transform hover:scale-105"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center h-full">
            {navItems.map((item) => {
              if (item.dropdownItems) {
                return (
                  <div key={item.label} className="relative group flex items-center h-full py-2">
                    <Link
                      to={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className="relative px-2 xl:px-3 py-1.5 text-xs xl:text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap rounded-full flex items-center gap-1"
                      style={{ color: '#475569' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#0a0a0a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                    >
                      <span>{item.label}</span>
                      <svg className="w-2.5 h-2.5 ml-1 inline text-slate-400 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    {/* Dropdown Menu */}
                    <div className="absolute top-[80%] left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50">
                      {item.dropdownItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          to={subItem.href}
                          className="block px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.isHash ? `/${item.href}` : item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className="relative px-2 xl:px-3 py-1.5 text-xs xl:text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap rounded-full flex items-center"
                  style={{ color: '#475569' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1.5 text-[8px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openAuth('login')}
              className="px-4 py-2 text-xs xl:text-sm font-semibold rounded-full transition-all duration-150 whitespace-nowrap cursor-pointer"
              style={{
                color: '#475569',
                border: '1px solid rgba(37,99,235,0.15)',
                background: 'transparent',
                minHeight: '40px',
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
                padding: '10px 16px',
                border: 'none',
                fontSize: '13px',
                minHeight: '40px',
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
            className="lg:hidden flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0"
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
        className="lg:hidden fixed inset-0 z-[55] transition-opacity duration-300"
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
        className="lg:hidden fixed top-9 right-0 h-full z-[100] flex flex-col"
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
        aria-hidden={!mobileMenuOpen}
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
                  <div className="pl-4 space-y-0.5 mt-0.5 border-l border-slate-100 ml-4 mb-2">
                    {item.dropdownItems?.map((subItem) => (
                      <Link
                        key={subItem.label}
                        to={subItem.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        {subItem.label}
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
          className="mb-10 px-4 py-4 space-y-2 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(37,99,235,0.10)' }}
        >
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