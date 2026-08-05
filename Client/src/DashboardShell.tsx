import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Breadcrumbs } from './components/Breadcrumbs';
import LoadingScreen from './components/LoadingScreen';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';

// ── Dashboard (user) pages ──
const UserDashboard = lazy(() => import('./pages/user/UserDashboard').then(m => ({ default: m.UserDashboard })));
const MyAgents = lazy(() => import('./pages/user/MyAgents').then(m => ({ default: m.MyAgents })));
const CustomWebCall = lazy(() => import('./pages/user/CustomWebCall').then(m => ({ default: m.CustomWebCall })));
const CreateAgent = lazy(() => import('./pages/user/CreateAgent').then(m => ({ default: m.CreateAgent })));
const CreateCustomAgent = lazy(() => import('./pages/user/CreateCustomAgent').then(m => ({ default: m.CreateCustomAgent })));
const MyCalls = lazy(() => import('./pages/user/MyCalls').then(m => ({ default: m.MyCalls })));
const BulkCallDashboard = lazy(() => import('./components/BulkCallDashboard').then(m => ({ default: m.BulkCallDashboard })));
const MyPhoneNumbers = lazy(() => import('./pages/user/MyPhoneNumbers').then(m => ({ default: m.MyPhoneNumbers })));
const MyLeads = lazy(() => import('./pages/user/MyLeads').then(m => ({ default: m.MyLeads })));
const UserBilling = lazy(() => import('./pages/user/UserBilling').then(m => ({ default: m.UserBilling })));
const MyTeam = lazy(() => import('./pages/user/MyTeam').then(m => ({ default: m.MyTeam })));
const MyAddOns = lazy(() => import('./pages/user/MyAddOns').then(m => ({ default: m.MyAddOns })));
const MyAppointments = lazy(() => import('./pages/user/MyAppointments').then(m => ({ default: m.MyAppointments })));
const MyChat = lazy(() => import('./pages/user/MyChat').then(m => ({ default: m.MyChat })));
const MyChatbots = lazy(() => import('./pages/user/MyChatbots').then(m => ({ default: m.MyChatbots })));
const CreateChatbot = lazy(() => import('./pages/user/CreateChatbot').then(m => ({ default: m.CreateChatbot })));
const CustomerSupport = lazy(() => import('./pages/user/CustomerSupport').then(m => ({ default: m.CustomerSupport })));
const WelcomeOnboarding = lazy(() => import('./components/WelcomeOnboarding').then(m => ({ default: m.default })));

// ── Admin pages ──
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

// ── Lazy shared (only needed when logged in) ──
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));

// Sidebar layout for authenticated routes
function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <MobileBottomNav />
    </div>
  );
}

// Manual route matcher — keeps all admin/user imports inside this chunk only
function matchRoute(pathname: string) {
  // Onboarding
  if (pathname === '/onboarding') return <ProtectedRoute hideSidebar><WelcomeOnboarding onComplete={() => {}} /></ProtectedRoute>;

  // ── Admin routes ──
  if (pathname === '/admin') return <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>;
  if (pathname === '/admin/users') return <ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>;
  if (pathname === '/admin/users/new') return <ProtectedRoute adminOnly><CreateUser /></ProtectedRoute>;
  if (pathname === '/admin/agents') return <ProtectedRoute adminOnly><AdminAgents /></ProtectedRoute>;
  if (pathname === '/admin/calls') return <ProtectedRoute adminOnly><AdminCalls /></ProtectedRoute>;
  if (pathname === '/admin/leads') return <ProtectedRoute adminOnly><AdminLeads /></ProtectedRoute>;
  if (pathname === '/admin/appointments') return <ProtectedRoute adminOnly><AdminAppointments /></ProtectedRoute>;
  if (pathname === '/admin/billing') return <ProtectedRoute adminOnly><AdminBilling /></ProtectedRoute>;
  if (pathname === '/admin/upgrade-requests') return <ProtectedRoute adminOnly><AdminUpgradeRequests /></ProtectedRoute>;
  if (pathname === '/admin/add-ons') return <ProtectedRoute adminOnly><AdminAddOns /></ProtectedRoute>;
  if (pathname === '/admin/chat') return <ProtectedRoute adminOnly><AdminChat /></ProtectedRoute>;

  // ── User dashboard routes ──
  if (pathname === '/dashboard') return <ProtectedRoute><RouteErrorBoundary><UserDashboard /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/ai-voice-agent') return <ProtectedRoute feature="voice"><RouteErrorBoundary><MyAgents /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/ai-phone-answering' || pathname.startsWith('/dashboard/ai-phone-answering/')) return <ProtectedRoute feature="voice"><RouteErrorBoundary><CustomWebCall /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/ai-voice-agent/new') return <ProtectedRoute feature="voice"><RouteErrorBoundary><CreateAgent /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/ai-voice-agent/new-custom') return <ProtectedRoute feature="voice"><RouteErrorBoundary><CreateCustomAgent /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/calls') return <ProtectedRoute feature="voice"><RouteErrorBoundary><MyCalls /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/bulk-calls') return <ProtectedRoute feature="voice"><RouteErrorBoundary><BulkCallDashboard /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/phone-numbers') return <ProtectedRoute feature="voice"><RouteErrorBoundary><MyPhoneNumbers /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/leads') return <ProtectedRoute><RouteErrorBoundary><MyLeads /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/appointment-booking') return <ProtectedRoute><RouteErrorBoundary><MyAppointments /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/ai-chatbot') return <ProtectedRoute feature="chat"><RouteErrorBoundary><MyChat /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/chatbots') return <ProtectedRoute feature="chat"><RouteErrorBoundary><MyChatbots /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/chatbots/new' || pathname.match(/^\/dashboard\/chatbots\/[^/]+$/)) return <ProtectedRoute feature="chat"><RouteErrorBoundary><CreateChatbot /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/billing') return <ProtectedRoute><RouteErrorBoundary><UserBilling /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/team') return <ProtectedRoute><RouteErrorBoundary><MyTeam /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/add-ons') return <ProtectedRoute><RouteErrorBoundary><MyAddOns /></RouteErrorBoundary></ProtectedRoute>;
  if (pathname === '/dashboard/support') return <ProtectedRoute><RouteErrorBoundary><CustomerSupport /></RouteErrorBoundary></ProtectedRoute>;

  // ── Redirect aliases ──
  if (pathname === '/agents') return <Navigate to="/dashboard/ai-voice-agent" replace />;
  if (pathname === '/calls') return <Navigate to="/dashboard/calls" replace />;
  if (pathname === '/leads') return <Navigate to="/dashboard/leads" replace />;
  if (pathname === '/chatbots') return <Navigate to="/dashboard/ai-chatbot" replace />;

  // Fallback
  return <Navigate to="/" replace />;
}

export default function DashboardShell() {
  const { pathname } = useLocation();

  // Onboarding has no sidebar
  if (pathname === '/onboarding') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CommandPalette />
        {matchRoute(pathname)}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <CommandPalette />
      <DashboardLayout>
        {matchRoute(pathname)}
      </DashboardLayout>
    </Suspense>
  );
}
