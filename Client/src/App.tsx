import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/useStore';
import { useAuth } from './hooks/useAuth';
import { useEffect, useMemo, lazy, Suspense } from 'react';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MetaRobots, PUBLIC_ROBOTS, PRIVATE_ROBOTS } from './components/MetaRobots';
import { injectSchema, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, SOFTWARE_APPLICATION_SCHEMA } from './utils/schema';
import { resolveMeta, setMetaTag, NOINDEX_PREFIXES, getBreadcrumbLabel } from './config/routeMeta';

// ── Lazy public pages ──
const UnifiedAssistantWidget = lazy(() => import('./components/UnifiedAssistantWidget'));
const Login = lazy(() => import('./pages/public/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/public/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsConditions = lazy(() => import('./pages/public/TermsConditions').then(m => ({ default: m.TermsConditions })));
const HelpCenter = lazy(() => import('./pages/public/HelpCenter').then(m => ({ default: m.HelpCenter })));
const AboutUs = lazy(() => import('./pages/public/AboutUs').then(m => ({ default: m.AboutUS })));
const Careers = lazy(() => import('./pages/public/Careers').then(m => ({ default: m.Careers })));
const Blog = lazy(() => import('./pages/public/Blog').then(m => ({ default: m.Blog })));
const Press = lazy(() => import('./pages/public/Press').then(m => ({ default: m.Press })));
const Agents = lazy(() => import('./pages/public/Agents').then(m => ({ default: m.default })));
const AiVoiceAgent = lazy(() => import('./pages/public/AiVoiceAgent').then(m => ({ default: m.AiVoiceAgent })));
const AiChatbot = lazy(() => import('./pages/public/AiChatbot').then(m => ({ default: m.AiChatbot })));
const AiPhoneAnswering = lazy(() => import('./pages/public/AiPhoneAnswering').then(m => ({ default: m.AiPhoneAnswering })));
const AppointmentBooking = lazy(() => import('./pages/public/AppointmentBooking').then(m => ({ default: m.AppointmentBooking })));
const CustomerSupportPublic = lazy(() => import('./pages/public/CustomerSupportPublic').then(m => ({ default: m.CustomerSupportPublic })));
const RealEstateIndustry = lazy(() => import('./pages/public/RealEstateIndustry').then(m => ({ default: m.RealEstateIndustry })));
const HealthcareIndustry = lazy(() => import('./pages/public/HealthcareIndustry').then(m => ({ default: m.HealthcareIndustry })));
const CaseStudies = lazy(() => import('./pages/public/CaseStudies').then(m => ({ default: m.CaseStudies })));
const CaseStudyDetail = lazy(() => import('./pages/public/CaseStudyDetail'));
const Pricing = lazy(() => import('./pages/public/Pricing').then(m => ({ default: m.Pricing })));
const VoiceAssistancePricing = lazy(() => import('./pages/public/VoiceAssistancePricing').then(m => ({ default: m.VoiceAssistancePricing })));
const AiChatbotPricing = lazy(() => import('./pages/public/AiChatbotPricing').then(m => ({ default: m.AiChatbotPricing })));
const News = lazy(() => import('./pages/public/News').then(m => ({ default: m.News })));
const ContactAdPage = lazy(() => import('./pages/public/ContactAdPage').then(m => ({ default: m.ContactAdPage })));
const NotFound = lazy(() => import('./pages/public/NotFound').then(m => ({ default: m.NotFound })));
const DashboardShell = lazy(() => import('./DashboardShell'));
const Landing = lazy(() => import('./pages/public/sections/LandingSection').then(m => ({ default: m.LandingSection })));

function AppRoutes() {
  const { user } = useAuth();
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const { title, description } = resolveMeta(path);
    const url = path === '/' ? 'https://autoniv.com/' : `https://autoniv.com${path.startsWith('/') ? path : '/' + path}`;

    document.title = title;

    const meta = (name: string, content: string) => setMetaTag(`meta[${name.includes('og:') ? 'property' : 'name'}="${name}"]`, () => { const m = document.createElement('meta'); m.setAttribute(name.includes('og:') ? 'property' : 'name', name); return m; }, 'content', content);

    meta('robots', NOINDEX_PREFIXES.some(p => path.startsWith(p)) ? 'noindex, nofollow' : 'index, follow');
    meta('description', description);
    meta('og:title', title);
    meta('og:description', description);
    meta('og:url', url);
    meta('og:image', 'https://autoniv.com/og-image.webp');
    meta('og:type', 'website');
    meta('og:site_name', 'Autoniv');
    meta('twitter:card', 'summary_large_image');
    meta('twitter:title', title);
    meta('twitter:description', description);
    meta('twitter:image', 'https://autoniv.com/og-image.webp');

    setMetaTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l; }, 'href', url);

    injectSchema('organization-jsonld', ORGANIZATION_SCHEMA);
    injectSchema('website-jsonld', WEBSITE_SCHEMA);
    injectSchema('software-app-jsonld', SOFTWARE_APPLICATION_SCHEMA);
    injectSchema('webpage-jsonld', { '@context': 'https://schema.org', '@type': 'WebPage', name: title.split('|')[0].trim(), url, description, isPartOf: { '@type': 'WebSite', url: 'https://autoniv.com/' } });

    const parts = path.split('/').filter(Boolean);
    let cur = '';
    const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://autoniv.com/' }];
    parts.forEach((p, i) => { cur += '/' + p; items.push({ '@type': 'ListItem', position: i + 2, name: getBreadcrumbLabel(p), item: 'https://autoniv.com' + cur }); });
    injectSchema('breadcrumb-jsonld', { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
  }, [location.pathname]);

  const isProtected = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname === '/onboarding';
  if (token && !initialized && isProtected) return <LoadingScreen />;

  const home = useMemo(() => <Landing />, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ScrollToTop />
      <MetaRobots content={
        location.pathname.startsWith('/dashboard/support') ? PUBLIC_ROBOTS :
        (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/onboarding') || location.pathname === '/connect' || location.pathname === '/contact' || location.pathname === '/contact-ad') ? PRIVATE_ROBOTS :
        PUBLIC_ROBOTS
      } />
      <Routes>
        <Route path="/" element={home} />
        <Route path="/connect" element={<ContactAdPage />} />
        <Route path="/contact" element={<ContactAdPage />} />
        <Route path="/contact-ad" element={<ContactAdPage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/press" element={<Press />} />
        <Route path="/services" element={<Agents />} />
        <Route path="/ai-voice-agent" element={<AiVoiceAgent />} />
        <Route path="/ai-chatbot" element={<AiChatbot />} />
        <Route path="/ai-phone-answering" element={<AiPhoneAnswering />} />
        <Route path="/appointment-booking" element={<AppointmentBooking />} />
        <Route path="/customer-support" element={<CustomerSupportPublic />} />
        <Route path="/industries/real-estate" element={<RealEstateIndustry />} />
        <Route path="/industries/healthcare" element={<HealthcareIndustry />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/pricing/voice-assistance" element={<VoiceAssistancePricing />} />
        <Route path="/pricing/ai-chatbot" element={<AiChatbotPricing />} />
        <Route path="/news" element={<News />} />
        <Route path="/dashboard/*" element={<DashboardShell />} />
        <Route path="/admin/*" element={<DashboardShell />} />
        <Route path="/onboarding" element={<DashboardShell />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!user && <UnifiedAssistantWidget />}
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
