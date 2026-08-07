import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../App';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const CreateUser = lazy(() => import('../pages/admin/CreateUser').then(m => ({ default: m.CreateUser })));
const AdminAgents = lazy(() => import('../pages/admin/AdminAgents').then(m => ({ default: m.AdminAgents })));
const AdminCalls = lazy(() => import('../pages/admin/AdminCalls').then(m => ({ default: m.AdminCalls })));
const AdminBilling = lazy(() => import('../pages/admin/AdminBilling').then(m => ({ default: m.AdminBilling })));
const AdminLeads = lazy(() => import('../pages/admin/AdminLeads').then(m => ({ default: m.AdminLeads })));
const AdminUpgradeRequests = lazy(() => import('../pages/admin/AdminUpgradeRequests').then(m => ({ default: m.AdminUpgradeRequests })));
const AdminAddOns = lazy(() => import('../pages/admin/AdminAddOns').then(m => ({ default: m.AdminAddOns })));
const AdminAppointments = lazy(() => import('../pages/admin/AdminAppointments').then(m => ({ default: m.AdminAppointments })));
const AdminChat = lazy(() => import('../pages/admin/AdminChat').then(m => ({ default: m.AdminChat })));

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminDashboard /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminUsers /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/users/new" element={<ProtectedRoute adminOnly><RouteErrorBoundary><CreateUser /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/agents" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminAgents /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminCalls /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminLeads /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminAppointments /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminBilling /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/upgrade-requests" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminUpgradeRequests /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/add-ons" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminAddOns /></RouteErrorBoundary></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute adminOnly><RouteErrorBoundary><AdminChat /></RouteErrorBoundary></ProtectedRoute>} />
    </Routes>
  );
}
