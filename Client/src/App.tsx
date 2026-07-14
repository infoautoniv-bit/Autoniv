import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks/useStore';
import { logout, checkAuth, login as loginAction, register as registerAction, verifyOtp as verifyOtpAction, googleLogin as googleLoginAction } from './store/slices/authSlice';
import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isChatPlan, isVoicePlan } from './utils/plan';
import UnifiedAssistantWidget from './components/UnifiedAssistantWidget';
// import AIAssistantChat from './components/AIAssistantChat';

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

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    // Only hit the server if we actually have a token to validate
    if (token && !initialized) {
      dispatch(checkAuth());
    }
  }, [token, initialized, dispatch]);

  const login = async (email: string, password: string) => {
    const result = await dispatch(loginAction({ email, password })).unwrap();
    return result;
  };

  const register = async (data: { name: string; email: string; password: string; company?: string; phoneNumber?: string }) => {
    const result = await dispatch(registerAction(data)).unwrap();
    return result;
  };

  const verifyOtp = async (email: string, otp: string, purpose: 'register' | 'login') => {
    const result = await dispatch(verifyOtpAction({ email, otp, purpose })).unwrap();
    return result;
  };

  const googleLogin = async (credential: string) => {
    const result = await dispatch(googleLoginAction(credential)).unwrap();
    return result;
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
  feature
}: {
  children: ReactNode;
  adminOnly?: boolean;
  hideSidebar?: boolean;
  feature?: 'chat' | 'voice';
}) {
  const { user, isAdmin } = useAuth();
  const initialized = useAppSelector((s) => s.auth.initialized);
  const token = useAppSelector((s) => s.auth.token);

  // Still waiting on server validation of an existing token
  if (token && !initialized) return <LoadingScreen />;

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (feature && !isAdmin) {
    if (feature === 'chat') {
      if (!isChatPlan(user)) {
        return <Navigate to="/dashboard?error=chat_restricted" replace />;
      }
    }
    if (feature === 'voice') {
      if (!isVoicePlan(user)) {
        return <Navigate to="/dashboard?error=voice_restricted" replace />;
      }
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
          <div className="flex-1 min-w-0"><Breadcrumbs /></div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 md:mt-4 overflow-y-auto">
          <div className="hidden md:block"><Breadcrumbs /></div>
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
    let title = 'Autoniv - AI Voice Agents for Business';
    
    if (path === '/') title = 'Autoniv - AI Voice Agents for Business | Automate Calls with AI';
    else if (path === '/login') title = 'Login - Autoniv';
    else if (path === '/register') title = 'Register - Autoniv';
    else if (path === '/forgot-password') title = 'Reset Password - Autoniv';
    else if (path === '/privacy') title = 'Privacy Policy - Autoniv';
    else if (path === '/terms') title = 'Terms & Conditions - Autoniv';
    else if (path === '/help') title = 'Help Center - Autoniv';
    else if (path === '/about') title = 'About Us - Autoniv';
    else if (path === '/careers') title = 'Careers - Autoniv';
    else if (path === '/blog') title = 'Blog & News - Autoniv';
    else if (path === '/press') title = 'Press Room - Autoniv';
    else if (path === '/services') title = 'AI Voice Services - Autoniv';
    else if (path === '/case-studies') title = 'Case Studies - Autoniv';
    else if (path.startsWith('/case-studies/')) title = 'Case Study Details - Autoniv';
    else if (path === '/pricing') title = 'Pricing Plans - Autoniv';
    else if (path === '/news') title = 'Latest News - Autoniv';
    else if (path.startsWith('/dashboard')) {
      if (path === '/dashboard/agents') title = 'My Voice Agents - Autoniv';
      else if (path.includes('/agents/new')) title = 'Create Voice Agent - Autoniv';
      else if (path.includes('/agents/custom-call')) title = 'Custom Call Test - Autoniv';
      else if (path === '/dashboard/calls') title = 'Call History - Autoniv';
      else if (path === '/dashboard/leads') title = 'My Leads - Autoniv';
      else if (path === '/dashboard/appointments') title = 'My Appointments - Autoniv';
      else if (path === '/dashboard/chat') title = 'My Chatbots - Autoniv';
      else if (path === '/dashboard/billing') title = 'Billing & Plan - Autoniv';
      else if (path === '/dashboard/add-ons') title = 'Billing Add-ons - Autoniv';
      else title = 'User Dashboard - Autoniv';
    } else if (path.startsWith('/admin')) {
      if (path === '/admin/users') title = 'Manage Users - Admin';
      else if (path === '/admin/agents') title = 'Manage Voice Agents - Admin';
      else if (path === '/admin/calls') title = 'Call Logs - Admin';
      else if (path === '/admin/leads') title = 'Leads Directory - Admin';
      else if (path === '/admin/appointments') title = 'Appointments Directory - Admin';
      else if (path === '/admin/billing') title = 'Billing Logs - Admin';
      else if (path === '/admin/upgrade-requests') title = 'Upgrade Requests - Admin';
      else if (path === '/admin/add-ons') title = 'Manage Add-ons - Admin';
      else if (path === '/admin/chat') title = 'Chat Sessions - Admin';
      else title = 'Admin Dashboard - Autoniv';
    }

    document.title = title;
  }, [location.pathname]);

  // Only block render if we have a token but haven't validated it yet
  if (token && !initialized) return <LoadingScreen />;

  const home = user
    ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
    : <Landing />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={home} />
        <Route path="/login" element={home} />
        <Route path="/register" element={home} />
        <Route path="/onboarding" element={<ProtectedRoute hideSidebar><WelcomeOnboarding onComplete={() => { }} /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/press" element={<Press />} />
        <Route path="/services" element={<Agents />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/news" element={<News />} />

        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/agents" element={<ProtectedRoute feature="voice"><MyAgents /></ProtectedRoute>} />
        <Route path="/dashboard/agents/custom-call" element={<ProtectedRoute feature="voice"><CustomWebCall /></ProtectedRoute>} />
        <Route path="/dashboard/agents/custom-call/:agentId" element={<ProtectedRoute feature="voice"><CustomWebCall /></ProtectedRoute>} />
        <Route path="/dashboard/agents/new" element={<ProtectedRoute feature="voice"><CreateAgent /></ProtectedRoute>} />
        <Route path="/dashboard/agents/new-custom" element={<ProtectedRoute feature="voice"><CreateCustomAgent /></ProtectedRoute>} />
        <Route path="/dashboard/calls" element={<ProtectedRoute feature="voice"><MyCalls /></ProtectedRoute>} />
        <Route path="/dashboard/leads" element={<ProtectedRoute><MyLeads /></ProtectedRoute>} />
        <Route path="/dashboard/appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute feature="chat"><MyChat /></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><UserBilling /></ProtectedRoute>} />
        <Route path="/dashboard/add-ons" element={<ProtectedRoute><MyAddOns /></ProtectedRoute>} />

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

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
        <UnifiedAssistantWidget />
      </ErrorBoundary>
    </BrowserRouter>
  );
}