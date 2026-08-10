import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { logout } from '../store/slices/authSlice';
import { Modal } from './Modal';

const ROUTE_PREFETCH_MAP: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('../pages/user/UserDashboard'),
  '/dashboard/ai-voice-agent': () => import('../pages/user/MyAgents'),
  '/dashboard/calls': () => import('../pages/user/MyCalls'),
  '/dashboard/leads': () => import('../pages/user/MyLeads'),
};

const HomeIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const AgentsIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CallsIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const LeadsIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/dashboard/ai-voice-agent', label: 'Agents', icon: AgentsIcon },
  { path: '/dashboard/calls', label: 'Calls', icon: CallsIcon },
  { path: '/dashboard/leads', label: 'Leads', icon: LeadsIcon },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return null;

  const prefetch = (path: string) => {
    try {
      ROUTE_PREFETCH_MAP[path]?.();
    } catch { /* ignore */ }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[50] bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => prefetch(item.path)}
              onTouchStart={() => prefetch(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-blue-400 font-extrabold bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 ${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* 1-Tap Logout Action */}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-150"
          aria-label="Sign Out"
        >
          <div className="p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out" size="sm">
        <p className="text-white/80 text-sm">Are you sure you want to sign out of Autoniv?</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white/60 hover:text-white bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowLogoutModal(false);
              dispatch(logout());
            }}
            className="px-4 py-2 text-xs text-white rounded-xl font-bold bg-rose-600 hover:bg-rose-500 transition-all shadow-md"
          >
            Sign Out
          </button>
        </div>
      </Modal>
    </>
  );
};
