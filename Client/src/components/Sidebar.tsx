import { useState, useEffect, useCallback, useRef } from 'react';
import logoSymbol from '../assets/autoniv-symbol-logo.webp';
import logoText from '../assets/autoniv-text-logo.webp';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { logout, checkAuth } from '../store/slices/authSlice';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { userService, authService } from '../services/api';
import type { User } from '../types';
import { isChatPlan, isVoicePlan } from '../utils/plan';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string | null;
}

// ─── Icons (optimized) ────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  agents: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  calls: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  leads: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  appointments: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  billing: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  overview: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  signOut: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
};

// ─── Navigation Items ─────────────────────────────────────────────────────────
const userNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', badge: null },
  { path: '/dashboard/ai-voice-agent', label: 'My Agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: null },
  { path: '/dashboard/ai-phone-answering', label: 'Custom Call', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', badge: null },
  { path: '/dashboard/ai-chatbot', label: 'My Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: null },
  { path: '/dashboard/calls', label: 'Call History', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', badge: null },
  { path: '/dashboard/leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: null },
  { path: '/dashboard/appointment-booking', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', badge: null },
  { path: '/dashboard/billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', badge: null },
  { path: '/dashboard/add-ons', label: 'Add-Ons', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', badge: null },
];

const adminNavItems: NavItem[] = [
  { path: '/admin', label: 'Overview', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', badge: null },
  { path: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', badge: null },
  { path: '/admin/agents', label: 'Agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', badge: null },
  { path: '/admin/calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', badge: null },
  { path: '/admin/leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: null },
  { path: '/admin/appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', badge: null },
  { path: '/admin/billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', badge: null },
  { path: '/admin/upgrade-requests', label: 'Upgrades', icon: 'M13 10V3L4 14h7v7l9-11h-7z', badge: null },
  { path: '/admin/add-ons', label: 'Add-Ons', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', badge: null },
  // { path: '/admin/chat', label: 'AI Chat', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', badge: null },
];

// ─── Custom Hooks ─────────────────────────────────────────────────────────────
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

// ─── Tooltip Component ────────────────────────────────────────────────────────
const Tooltip: React.FC<{ label: string; visible: boolean }> = ({ label, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -4 }}
        transition={{ duration: 0.12 }}
        className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-[9999]
                   bg-[#0a1a2e] text-white text-xs font-medium px-2.5 py-1.5
                   rounded-lg whitespace-nowrap pointer-events-none shadow-lg
                   before:content-[''] before:absolute before:right-full before:top-1/2
                   before:-translate-y-1/2 before:border-4 before:border-transparent
                   before:border-r-[#0a1a2e]"
        style={{ border: '1px solid rgba(37,99,235,0.2)' }}
      >
        {label}
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── NavLink Component ────────────────────────────────────────────────────────
const NavLinkItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
  onClick: () => void;
}> = ({ item, isActive, isCollapsed, index, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={item.path} onClick={onClick}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: isCollapsed ? 0 : 4, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.015 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer
          ${isActive
            ? 'shadow-lg font-semibold'
            : 'text-white/60 hover:text-white hover:bg-white/5'
          }
          ${isCollapsed ? 'justify-center' : ''}`}
        style={
          isActive
            ? {
              background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(16,185,129,0.15))',
              border: '1px solid rgba(16,185,129,0.40)',
              color: '#10B981',
              boxShadow: '0 0 20px rgba(16,185,129,0.15)',
            }
            : { background: 'transparent', boxShadow: 'none' }
        }
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute left-0 w-1 h-8 rounded-r-full"
            style={{ background: 'linear-gradient(180deg, #2563EB, #10B981)' }}
          />
        )}

        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
        </svg>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium text-sm whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {isCollapsed && item.badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--s1)', borderWidth: '1.5px' }}
          />
        )}

        {isCollapsed && <Tooltip label={item.label} visible={hovered} />}
      </motion.div>
    </Link>
  );
};

// ─── User Section Component ───────────────────────────────────────────────────
const UserSection: React.FC<{
  user: User | null;
  isCollapsed: boolean;
  onLogout: () => void;
}> = ({ user, isCollapsed, onLogout }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useClickOutside(dropdownRef, () => setOpen(false));

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    onLogout();
    setShowLogoutModal(false);
  };

  useEffect(() => {
    if (showProfile && user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [showProfile, user]);

  const handleProfileSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await userService.update(user.id, {
        name: profileForm.name,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber || undefined,
      });
      dispatch(checkAuth());
      setShowProfile(false);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 10) {
      setPasswordError('Password must be at least 10 characters');
      return;
    }

    if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword)) {
      setPasswordError('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed successfully! Please login again.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        dispatch(logout());
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-3 border-t border-white/5 space-y-3" ref={dropdownRef}>
      {/* User Info Card */}
      <motion.div
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-white/5 ${isCollapsed ? 'justify-center' : ''}`}
        onClick={() => !isCollapsed && setOpen(!open)}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: 'var(--gg)',
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)'
            }}>
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--primary-soft)]0 rounded-full animate-pulse"
            style={{ borderColor: 'var(--s1)', borderWidth: '2px' }} />
        </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <p className="text-xs capitalize text-white/60">{user?.role}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/40"
          >
            {Icons.chevronDown}
          </motion.span>
        )}
      </motion.div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl overflow-hidden shadow-xl"
            style={{
              backgroundColor: '#0a1a2e',
              border: '1px solid rgba(37,99,235,0.18)'
            }}
          >
            <button
              onClick={() => { setOpen(false); setShowProfile(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-white/70 hover:text-white"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {Icons.settings}
              Profile
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-rose-400 hover:text-rose-300"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 138, 138, 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {Icons.signOut}
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Tooltip */}
      {isCollapsed && <Tooltip label={user?.name || 'User'} visible={open} />}

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out" size="sm">
        <p className="text-white/80">Are you sure you want to sign out?</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="px-4 py-2 text-sm transition-colors rounded-lg text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={confirmLogout}
            className="px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium bg-rose-500 hover:bg-rose-600"
          >
            Sign Out
          </button>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal isOpen={showProfile} onClose={() => { setShowProfile(false); setShowPasswordChange(false); setPasswordError(''); setPasswordSuccess(''); }} title={showPasswordChange ? 'Change Password' : 'Edit Profile'} size="sm">
        {!showPasswordChange ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-white/60">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-white/60">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-white/60">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowProfile(false)}
                className="px-4 py-2 text-sm transition-colors rounded-lg text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
              >
                {saving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-[var(--primary-soft)]/10 border border-[var(--border)] rounded-lg text-[var(--primary)] text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm mb-1 text-white/60">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-white/60">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordForm.newPassword.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {[
                      { label: 'At least 10 characters', met: passwordForm.newPassword.length >= 10 },
                      { label: 'Uppercase letter', met: /[A-Z]/.test(passwordForm.newPassword) },
                      { label: 'Lowercase letter', met: /[a-z]/.test(passwordForm.newPassword) },
                      { label: 'Number', met: /\d/.test(passwordForm.newPassword) },
                      { label: 'Special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-white/40'}>
                          {check.met ? '✓' : '○'}
                        </span>
                        <span className={check.met ? 'text-[var(--primary)]' : 'text-white/40'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1 text-white/60">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 rounded-lg text-white text-sm focus:outline-none transition-colors bg-[#0a1a2e] border border-white/10 focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowPasswordChange(false); setPasswordError(''); setPasswordSuccess(''); }}
                className="px-4 py-2 text-sm transition-colors rounded-lg text-white/60 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="px-4 py-2 text-sm text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
              >
                {changingPassword && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export function Sidebar() {
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // Keyboard shortcut: Alt+S
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleSidebar]);

  const isChat = user ? isChatPlan(user) : true;
  const isVoice = user ? isVoicePlan(user) : false;

  const navItems = isAdmin
    ? adminNavItems
    : userNavItems.filter((item) => {
      if (item.path === '/dashboard/ai-chatbot') return isChat;
      if (
        item.path === '/dashboard/ai-voice-agent' ||
        item.path === '/dashboard/ai-phone-answering' ||
        item.path === '/dashboard/calls'
      ) {
        return isVoice;
      }
      return true;
    });

  const renderLogo = (forceExpanded: boolean) => (
    <div className={`p-4 border-b border-white/5 ${isCollapsed && !forceExpanded ? 'px-3' : ''}`}>
      <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"

        >
          <img
            src={logoSymbol}
            alt="Autoniv Symbol Logo"
            width={48}
            height={40}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <AnimatePresence mode="wait">
          {(!isCollapsed || forceExpanded) && (
            <motion.img
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              src={logoText}
              alt="Autoniv Text Logo"
              width={113}
              height={20}
              className="-ml-2 h-5 w-auto whitespace-nowrap"
            />
          )}
        </AnimatePresence>
      </Link>
    </div>
  );

  const sidebarContent = (forceExpanded = false) => (
    <>
      {/* Logo */}
      {renderLogo(forceExpanded)}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavLinkItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            isCollapsed={isCollapsed}
            index={index}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User Section */}
      <UserSection user={user} isCollapsed={isCollapsed} onLogout={handleLogout} />
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        initial={false}
        animate={{ opacity: mobileOpen ? 0 : 1, scale: mobileOpen ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        style={{ pointerEvents: mobileOpen ? 'none' : 'auto' }}
        className="md:hidden fixed top-4 left-4 z-[60] p-2.5 bg-[#050d1a]
                   border border-white/10 rounded-xl text-white
                   hover:bg-[#0a1a2e] transition-colors shadow-lg"
      >
        {Icons.menu}
      </motion.button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden fixed inset-y-0 left-0 z-50 w-64
                       bg-[#050d1a] border-r border-white/5 flex flex-col shadow-2xl overflow-y-auto"
          >
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 p-1.5 text-white/60 
                         hover:text-white rounded-lg hover:bg-[var(--surface)] transition-colors"
            >
              {Icons.close}
            </button>
            {sidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen
                   bg-[#050d1a] border-r border-white/5 shadow-2xl z-20 overflow-y-auto"
      >
        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (Alt+S)`}
          className="absolute -right-2.5 top-20 w-6 h-6 rounded-full
                     bg-[#0a1a2e] border border-white/10
                     flex items-center justify-center
                     hover:bg-[#122845] transition-all hover:scale-110 z-30"
        >
          <motion.svg
            className="w-3 h-3 text-white/60"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </motion.svg>
        </button>

        {sidebarContent()}
      </motion.aside>
    </>
  );
}