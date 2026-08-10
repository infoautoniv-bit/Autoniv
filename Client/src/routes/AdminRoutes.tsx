import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
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
      <Route path="/" element={<RouteErrorBoundary><AdminDashboard /></RouteErrorBoundary>} />
      <Route path="/users" element={<RouteErrorBoundary><AdminUsers /></RouteErrorBoundary>} />
      <Route path="/users/new" element={<RouteErrorBoundary><CreateUser /></RouteErrorBoundary>} />
      <Route path="/agents" element={<RouteErrorBoundary><AdminAgents /></RouteErrorBoundary>} />
      <Route path="/calls" element={<RouteErrorBoundary><AdminCalls /></RouteErrorBoundary>} />
      <Route path="/leads" element={<RouteErrorBoundary><AdminLeads /></RouteErrorBoundary>} />
      <Route path="/appointments" element={<RouteErrorBoundary><AdminAppointments /></RouteErrorBoundary>} />
      <Route path="/billing" element={<RouteErrorBoundary><AdminBilling /></RouteErrorBoundary>} />
      <Route path="/upgrade-requests" element={<RouteErrorBoundary><AdminUpgradeRequests /></RouteErrorBoundary>} />
      <Route path="/add-ons" element={<RouteErrorBoundary><AdminAddOns /></RouteErrorBoundary>} />
      <Route path="/chat" element={<RouteErrorBoundary><AdminChat /></RouteErrorBoundary>} />
    </Routes>
  );
}
