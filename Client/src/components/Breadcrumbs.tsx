import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  agents: 'My Agents',
  calls: 'Call History',
  leads: 'Leads',
  appointments: 'Appointments',
  billing: 'Billing',
  admin: 'Admin',
  users: 'Users',
  'upgrade-requests': 'Upgrades',
  chat: 'AI Chat',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => {
      const path = '/' + parts.slice(0, i + 1).join('/');
      const label = labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      return { path, label, isLast: i === parts.length - 1 };
    });
  }, [pathname]);

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs mt-6 sm:-mt-8 sm:mb-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="w-3 h-3 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {crumb.isLast ? (
            <span className="text-[var(--text-secondary)] font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-[var(--text-secondary)] hover:text-[var(--cyan)]-400 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
