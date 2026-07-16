import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/useStore';
import { logout, checkAuth, login as loginAction, register as registerAction, verifyOtp as verifyOtpAction, googleLogin as googleLoginAction } from './store/slices/authSlice';
import { useEffect, useMemo, lazy, Suspense, type ReactNode } from 'react';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MetaRobots, PUBLIC_ROBOTS, PRIVATE_ROBOTS } from './components/MetaRobots';
import { isChatPlan, isVoicePlan } from './utils/plan';
import UnifiedAssistantWidget from './components/UnifiedAssistantWidget';

const Landing = lazy(() => import('./pages/public').then(m => ({ default: m.Landing })));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard').then(m => ({ default: m.UserDashboard })));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsConditions = lazy(() => import('./pages/public/TermsConditions').then(m => ({ default: m.TermsConditions })));
const HelpCenter = lazy(() => import('./pages/public/HelpCenter').then(m => ({ default: m.HelpCenter })));
const AboutUs = lazy(() => import('./pages/public/AboutUs').then(m => ({ default: m.AboutUS })));
const Careers = lazy(() => import('./pages/public/Careers').then(m => ({ default: m.Careers })));
const Blog = lazy(() => import('./pages/public/Blog').then(m => ({ default: m.Blog })));
const Press = lazy(() => import('./pages/public/Press').then(m => ({ default: m.Press })));
const Agents = lazy(() => import('./pages/public/Agents').then(m => ({ default: m.default })));
const CaseStudies = lazy(() => import('./pages/public/CaseStudies').then(m => ({ default: m.CaseStudies })));
const CaseStudyDetail = lazy(() => import('./pages/public/CaseStudyDetail'));
const Pricing = lazy(() => import('./pages/public/Pricing').then(m => ({ default: m.Pricing })));
const News = lazy(() => import('./pages/public/News').then(m => ({ default: m.News })));
const MyAgents = lazy(() => import('./pages/user/MyAgents').then(m => ({ default: m.MyAgents })));
const CustomWebCall = lazy(() => import('./pages/user/CustomWebCall').then(m => ({ default: m.CustomWebCall })));
const CreateAgent = lazy(() => import('./pages/user/CreateAgent').then(m => ({ default: m.CreateAgent })));
const CreateCustomAgent = lazy(() => import('./pages/user/CreateCustomAgent').then(m => ({ default: m.CreateCustomAgent })));
const MyCalls = lazy(() => import('./pages/user/MyCalls').then(m => ({ default: m.MyCalls })));
const MyLeads = lazy(() => import('./pages/user/MyLeads').then(m => ({ default: m.MyLeads })));
const UserBilling = lazy(() => import('./pages/user/UserBilling').then(m => ({ default: m.UserBilling })));
const MyAddOns = lazy(() => import('./pages/user/MyAddOns').then(m => ({ default: m.MyAddOns })));
const MyAppointments = lazy(() => import('./pages/user/MyAppointments').then(m => ({ default: m.MyAppointments })));
const MyChat = lazy(() => import('./pages/user/MyChat').then(m => ({ default: m.MyChat })));
const CustomerSupport = lazy(() => import('./pages/user/CustomerSupport').then(m => ({ default: m.CustomerSupport })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const CreateUser = lazy(() => import('./pages/admin/CreateUser').then(m => ({ default: m.CreateUser })));
const AdminAgents = lazy(() => import('./pages/admin/AdminAgents').then(m => ({ default: m.AdminAgents })));
const AdminCalls = lazy(() => import('./pages/admin/AdminCalls').then(m => ({ default: m.AdminCalls })));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling').then(m => ({ default: m.AdminBilling })));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads').then(m => ({ default: m.AdminLeads })));
const AdminUpgradeRequests = lazy(() => import('./pages/admin/AdminUpgradeRequests').then(m => ({ default: m.AdminUpgradeRequests })));
const AdminAddOns = lazy(() => import('./pages/admin/AdminAddOns').then(m => ({ default: m.AdminAddOns })));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments').then(m => ({ default: m.AdminAppointments })));
const AdminChat = lazy(() => import('./pages/admin/AdminChat').then(m => ({ default: m.AdminChat })));
const WelcomeOnboarding = lazy(() => import('./components/WelcomeOnboarding').then(m => ({ default: m.default })));
const NotFound = lazy(() => import('./pages/public/NotFound').then(m => ({ default: m.NotFound })));

// ---------------------------------------------------------------------------
// Route metadata — hoisted to module scope so it's built once, not per-render.
// ---------------------------------------------------------------------------

type Meta = { title: string; description: string };

const DEFAULT_META: Meta = {
  title: 'Autoniv | 24/7 AI Assistance for Businesses in 20+ Languages',
  description:
    'Autoniv provides 24/7 AI assistance for businesses with AI voice agents and chatbots, supporting customer calls, support, sales, & inquiries in 20+ languages. Start free.',
};

// Exact-path matches (marketing + auth + legal pages)
const EXACT_META: Record<string, Meta> = {
  '/ai-voice-agent': {
    title: 'AI Voice Agents for Business Automation | Autoniv',
    description:
      'Deploy intelligent, natural-sounding AI voice agents to automate inbound & outbound customer calls, qualify leads, and schedule appointments 24/7.',
  },
  '/ai-chatbot': {
    title: 'Intelligent AI Chatbots & Customer Assistants | Autoniv',
    description:
      'Engage website visitors and automate customer support with AI chatbots that handle sales inquiries, support tickets, and leads in 20+ languages.',
  },
  '/ai-phone-answering': {
    title: '24/7 AI Phone Answering Service & Receptionist | Autoniv',
    description:
      'Automate your front desk with an intelligent AI phone receptionist. Handle unlimited concurrent calls, filter spam, and transfer to humans when needed.',
  },
  '/appointment-booking': {
    title: 'Automated AI Appointment Booking & Scheduling | Autoniv',
    description:
      'Let AI schedule, reschedule, and manage client bookings directly over voice calls and chat. Direct real-time calendar and CRM integrations.',
  },
  '/customer-support': {
    title: 'AI-Powered Customer Support Automation | Autoniv',
    description:
      'Streamline support workflows with AI voice and chat assistants that resolve up to 80% of customer FAQs instantly, reducing operations cost by 70%.',
  },
  '/industries/real-estate': {
    title: 'AI Agents for Real Estate Automation | Autoniv',
    description:
      'Qualify property leads, schedule home viewings, and follow up with buyers 24/7 using tailored AI voice agents and chatbots for real estate.',
  },
  '/industries/healthcare': {
    title: 'HIPAA-Compliant AI Voice & Chat for Healthcare | Autoniv',
    description:
      'Automate patient intake, appointment scheduling, prescription refills, and follow-ups with secure, intelligent healthcare AI assistants.',
  },
  '/login': {
    title: 'Login - Autoniv',
    description: 'Log in to your Autoniv account to manage your AI voice agents, review call logs, update billing, and view analytics.',
  },
  '/register': {
    title: 'Register - Autoniv',
    description: 'Create a free Autoniv account to deploy your first AI voice agent or chatbot. Get started with 100 free conversations per month.',
  },
  '/forgot-password': {
    title: 'Reset Password - Autoniv',
    description: 'Recover or reset your Autoniv account password.',
  },
  '/privacy': {
    title: 'Privacy Policy - Autoniv',
    description: 'Read the privacy policy of Autoniv. Learn how we handle, process, and protect your enterprise data under international and local regulations.',
  },
  '/terms': {
    title: 'Terms & Conditions - Autoniv',
    description: 'Review the terms of service governing the use of the Autoniv platform, AI agents, and billing systems.',
  },
  '/help': {
    title: 'Help Center & Documentation | Autoniv',
    description: 'Access support, documentation, API guides, and tutorials to configure and optimize your Autoniv AI voice and chat assistants.',
  },
  '/about': {
    title: 'About Us - The Team Behind Autoniv AI',
    description: 'Learn about our mission to make state-of-the-art conversational AI technology accessible and cost-effective for businesses globally.',
  },
  '/careers': {
    title: 'Careers - Join the Autoniv Team',
    description: 'Explore open roles and career opportunities at Autoniv. Help us build the future of autonomous voice and chat AI assistants.',
  },
  '/blog': {
    title: 'Autoniv Blog - AI Voice Technology & Business Automation',
    description: 'Read the latest insights, strategies, and trends on conversational AI, voice agents, chatbots, and business process automation.',
  },
  '/press': {
    title: 'Press Room & Media Kit | Autoniv',
    description: 'Get the latest press releases, media coverage, and brand assets for Autoniv.',
  },
  '/services': {
    title: 'AI Voice & Chat Solutions for Enterprise | Autoniv',
    description: 'Explore our full suite of autonomous voice agents, chat assistants, and business automation integrations.',
  },
  '/case-studies': {
    title: 'Success Stories & Customer Case Studies | Autoniv',
    description: 'Discover how businesses across healthcare, real estate, finance, and e-commerce achieve 70% cost reduction and 3x lead growth with Autoniv.',
  },
  '/pricing': {
    title: 'Pricing Plans - Autoniv',
    description: 'Choose the right plan for your business. Start free with 100 conversations per month, no credit card required, and scale as you grow.',
  },
  '/news': {
    title: 'Latest News - Autoniv',
    description: 'Stay updated with product announcements, brand news, and major updates from the Autoniv team.',
  },
};

// Dashboard/admin sub-route titles (description stays generic for these — app UI, not indexed)
const DASHBOARD_TITLES: Record<string, string> = {
  '/dashboard/ai-voice-agent': 'My Voice Agents - Autoniv',
  '/dashboard/ai-phone-answering': 'Custom Call Test - Autoniv',
  '/dashboard/calls': 'Call History - Autoniv',
  '/dashboard/leads': 'My Leads - Autoniv',
  '/dashboard/appointment-booking': 'My Appointments - Autoniv',
  '/dashboard/ai-chatbot': 'My Chatbots - Autoniv',
  '/dashboard/billing': 'Billing & Plan - Autoniv',
  '/dashboard/add-ons': 'Billing Add-ons - Autoniv',
};

const ADMIN_TITLES: Record<string, string> = {
  '/admin/users': 'Manage Users - Admin',
  '/admin/agents': 'Manage Voice Agents - Admin',
  '/admin/calls': 'Call Logs - Admin',
  '/admin/leads': 'Leads Directory - Admin',
  '/admin/appointments': 'Appointments Directory - Admin',
  '/admin/billing': 'Billing Logs - Admin',
  '/admin/upgrade-requests': 'Upgrade Requests - Admin',
  '/admin/add-ons': 'Manage Add-ons - Admin',
  '/admin/chat': 'Chat Sessions - Admin',
};

const NOINDEX_PREFIXES = ['/dashboard', '/admin', '/onboarding', '/login', '/register', '/forgot-password'];

const BREADCRUMB_LABELS: Record<string, string> = {
  'ai-voice-agent': 'AI Voice Agent',
  'ai-chatbot': 'AI Chatbot',
  'ai-phone-answering': 'AI Phone Answering',
  'appointment-booking': 'Appointment Booking',
  'customer-support': 'Customer Support',
  'real-estate': 'Real Estate',
  healthcare: 'Healthcare',
  industries: 'Industries',
  services: 'Services',
  'case-studies': 'Case Studies',
  pricing: 'Pricing',
  blog: 'Blog',
  about: 'About Us',
  careers: 'Careers',
  press: 'Press',
  help: 'Help Center',
};

function resolveMeta(path: string): Meta {
  if (path in EXACT_META) return EXACT_META[path];

  if (path.startsWith('/case-studies/')) {
    return { title: 'Case Study Details - Autoniv', description: 'Explore detail outcomes, metrics, and implementations of our AI voice and chatbot deployment.' };
  }
  if (path.startsWith('/dashboard')) {
    const title = DASHBOARD_TITLES[path] ?? (path.includes('/ai-voice-agent/new') ? 'Create Voice Agent - Autoniv' : path.includes('/ai-phone-answering') ? 'Custom Call Test - Autoniv' : 'User Dashboard - Autoniv');
    return { title, description: DEFAULT_META.description };
  }
  if (path.startsWith('/admin')) {
    return { title: ADMIN_TITLES[path] ?? 'Admin Dashboard - Autoniv', description: DEFAULT_META.description };
  }
  return DEFAULT_META;
}

// Single helper that covers every "find-or-create tag, then set an attribute" case.
function setMetaTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

// ---------------------------------------------------------------------------

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token && !initialized) {
      dispatch(checkAuth());
    }
  }, [token, initialized, dispatch]);

  const login = async (email: string, password: string) => {
    return dispatch(loginAction({ email, password })).unwrap();
  };

  const register = async (data: { name: string; email: string; password: string; company?: string; phoneNumber?: string }) => {
    return dispatch(registerAction(data)).unwrap();
  };

  const verifyOtp = async (email: string, otp: string, purpose: 'register' | 'login') => {
    return dispatch(verifyOtpAction({ email, otp, purpose })).unwrap();
  };

  const googleLogin = async (credential: string) => {
    return dispatch(googleLoginAction(credential)).unwrap();
  };

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    verifyOtp,
    googleLogin,
    logout: () => dispatch(logout()),
  };
}

function ProtectedRoute({
  children,
  adminOnly = false,
  hideSidebar = false,
  feature,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  hideSidebar?: boolean;
  feature?: 'chat' | 'voice';
}) {
  const { user, isAdmin } = useAuth();
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  if (token && !initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (feature && !isAdmin) {
    if (feature === 'chat' && !isChatPlan(user)) {
      return <Navigate to="/dashboard?error=chat_restricted" replace />;
    }
    if (feature === 'voice' && !isVoicePlan(user)) {
      return <Navigate to="/dashboard?error=voice_restricted" replace />;
    }
  }

  if (hideSidebar) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header
          className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-16 shrink-0"
          style={{ background: 'rgba(248,250,252,0.97)', borderBottom: '1px solid #e2e8f0' }}
        >
          <div className="w-10" />
          <div className="flex-1 min-w-0">
            <Breadcrumbs />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 md:mt-4 overflow-y-auto">
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const { title, description } = resolveMeta(path);
    const url = 'https://autoniv.com' + path;

    document.title = title;

    setMetaTag('meta[name="robots"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'robots');
      return m;
    }, 'content', NOINDEX_PREFIXES.some((p) => path.startsWith(p)) ? 'noindex, nofollow' : 'index, follow');

    setMetaTag('meta[name="description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      return m;
    }, 'content', description);

    // OG/Twitter tags only get updated if they already exist in index.html
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);

    setMetaTag('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    }, 'href', url);

    // Breadcrumb JSON-LD
    const pathParts = path.split('/').filter(Boolean);
    const existingScript = document.getElementById('breadcrumb-jsonld');
    if (pathParts.length > 0) {
      let currentPath = '';
      const itemListElement = [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://autoniv.com/' }];
      pathParts.forEach((part, index) => {
        currentPath += '/' + part;
        const name = BREADCRUMB_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
        itemListElement.push({ '@type': 'ListItem', position: index + 2, name, item: 'https://autoniv.com' + currentPath });
      });

      const script = (existingScript as HTMLScriptElement) ?? document.createElement('script');
      if (!existingScript) {
        script.id = 'breadcrumb-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement });
    } else {
      existingScript?.remove();
    }
  }, [location.pathname]);

  if (token && !initialized) return <LoadingScreen />;

  const home = useMemo(
    () => (user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Landing />),
    [user]
  );

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ScrollToTop />
      <MetaRobots content={
        (location.pathname.startsWith('/dashboard/support')) ? PUBLIC_ROBOTS :
        (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/onboarding')) ? PRIVATE_ROBOTS :
        PUBLIC_ROBOTS
      } />
      <Routes>
        <Route path="/" element={home} />
        <Route path="/login" element={home} />
        <Route path="/register" element={home} />
        <Route path="/onboarding" element={<ProtectedRoute hideSidebar><WelcomeOnboarding onComplete={() => {}} /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/press" element={<Press />} />
        <Route path="/services" element={<Agents />} />
        <Route path="/ai-voice-agent" element={<Agents />} />
        <Route path="/ai-chatbot" element={<Agents />} />
        <Route path="/ai-phone-answering" element={<Agents />} />
        <Route path="/appointment-booking" element={<Agents />} />
        <Route path="/customer-support" element={<Agents />} />
        <Route path="/industries/real-estate" element={<Landing />} />
        <Route path="/industries/healthcare" element={<Landing />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/news" element={<News />} />

        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/ai-voice-agent" element={<ProtectedRoute feature="voice"><MyAgents /></ProtectedRoute>} />
        <Route path="/dashboard/ai-phone-answering" element={<ProtectedRoute feature="voice"><CustomWebCall /></ProtectedRoute>} />
        <Route path="/dashboard/ai-phone-answering/:agentId" element={<ProtectedRoute feature="voice"><CustomWebCall /></ProtectedRoute>} />
        <Route path="/dashboard/ai-voice-agent/new" element={<ProtectedRoute feature="voice"><CreateAgent /></ProtectedRoute>} />
        <Route path="/dashboard/ai-voice-agent/new-custom" element={<ProtectedRoute feature="voice"><CreateCustomAgent /></ProtectedRoute>} />
        <Route path="/dashboard/calls" element={<ProtectedRoute feature="voice"><MyCalls /></ProtectedRoute>} />
        <Route path="/dashboard/leads" element={<ProtectedRoute><MyLeads /></ProtectedRoute>} />
        <Route path="/dashboard/appointment-booking" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="/dashboard/ai-chatbot" element={<ProtectedRoute feature="chat"><MyChat /></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><UserBilling /></ProtectedRoute>} />
        <Route path="/dashboard/add-ons" element={<ProtectedRoute><MyAddOns /></ProtectedRoute>} />
        <Route path="/dashboard/support" element={<CustomerSupport />} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/users/new" element={<ProtectedRoute adminOnly><CreateUser /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute adminOnly><AdminAgents /></ProtectedRoute>} />
        <Route path="/admin/calls" element={<ProtectedRoute adminOnly><AdminCalls /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute adminOnly><AdminLeads /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute adminOnly><AdminAppointments /></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute adminOnly><AdminBilling /></ProtectedRoute>} />
        <Route path="/admin/upgrade-requests" element={<ProtectedRoute adminOnly><AdminUpgradeRequests /></ProtectedRoute>} />
        <Route path="/admin/add-ons" element={<ProtectedRoute adminOnly><AdminAddOns /></ProtectedRoute>} />
        <Route path="/admin/chat" element={<ProtectedRoute adminOnly><AdminChat /></ProtectedRoute>} />

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