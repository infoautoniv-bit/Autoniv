import React, { useState, useEffect, useRef } from 'react';
import { teamService, type TeamData, type TeamMember } from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const UserPlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface RoleOption {
  value: 'member' | 'agent' | 'admin';
  label: string;
  icon: string;
  desc: string;
  badgeBg: string;
  badgeText: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'member',
    label: 'Member',
    icon: '👤',
    desc: 'Access chats, leads, and appointments',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    badgeText: 'Default',
  },
  {
    value: 'agent',
    label: 'Agent',
    icon: '🎧',
    desc: 'Handle live customer chats and calls',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeText: 'Support',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: '⚡',
    desc: 'Manage team, chatbots, and settings',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    badgeText: 'Full Access',
  },
];

const RoleDropdown: React.FC<{
  value: 'member' | 'agent' | 'admin';
  onChange: (val: 'member' | 'agent' | 'admin') => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = ROLE_OPTIONS.find((o) => o.value === value) || ROLE_OPTIONS[0];

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{selectedOption.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{selectedOption.label}</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${selectedOption.badgeBg}`}>
                {selectedOption.badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{selectedOption.desc}</p>
          </div>
        </div>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 space-y-1"
          >
            {ROLE_OPTIONS.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-50/80 border border-emerald-200/80'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{option.label}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${option.badgeBg}`}>
                          {option.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{option.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MyTeam: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [teamData, setTeamData] = useState<TeamData | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'agent' | 'admin'>('member');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await teamService.getTeam();
      setTeamData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchTeam();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter team member name');
      return;
    }
    if (!email.trim()) {
      toast.error('Please enter team member email');
      return;
    }

    try {
      setInviting(true);
      const res = await teamService.inviteMember({ name, email, role });
      toast.success(res.data.message || 'Team member added successfully!');
      setName('');
      setEmail('');
      setRole('member');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your team?`)) return;

    try {
      const res = await teamService.removeMember(memberId);
      toast.success(res.data.message || 'Team member removed');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove team member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const usedSeats = teamData?.usedSeats || 1;
  const totalSeats = teamData?.totalSeats || 5;
  const isFull = usedSeats >= totalSeats;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <UsersIcon />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Seats & Access</h1>
                  <span className="px-2.5 py-1 text-xs font-black uppercase bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                    {teamData?.planName || 'Growth Plan'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Manage team members, roles, and shared inbox access for your organization.</p>
              </div>
            </div>
          </div>

          {/* Seat Counter Badge */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col items-center sm:items-end min-w-[200px]">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Seats Used</div>
            <div className="text-2xl font-black text-slate-900">
              <span className="text-emerald-600">{usedSeats}</span> / {totalSeats}
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (usedSeats / totalSeats) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invite Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-4">
              <UserPlusIcon className="w-5 h-5 text-emerald-500" />
              <span>Add Team Member</span>
            </div>

            {isFull ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircleIcon className="w-4 h-4 text-amber-600" />
                  <span>Seat Limit Reached ({totalSeats} Seats)</span>
                </div>
                <p>You have used all {totalSeats} seats included in your current plan. Please upgrade your plan to add more team members.</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3">
                      <MailIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="sarah@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Role & Access Level
                  </label>
                  <RoleDropdown value={role} onChange={setRole} />
                </div>

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {inviting ? (
                    <span>Adding Member...</span>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Add to Team</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-emerald-500" />
              <span>Workspace Members</span>
            </h2>

            <div className="divide-y divide-slate-100">
              {/* Account Owner Card */}
              {teamData?.owner && (
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {teamData.owner.name ? teamData.owner.name.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{teamData.owner.name || 'Account Owner'}</span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-md">
                          Workspace Owner
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{teamData.owner.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </div>
                </div>
              )}

              {/* Team Members List */}
              {teamData?.teamMembers && teamData.teamMembers.length > 0 ? (
                teamData.teamMembers.map((member: TeamMember) => (
                  <div key={member._id || member.email} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 rounded-md">
                            {member.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        Added {new Date(member.addedAt).toLocaleDateString()}
                      </span>
                      {member._id && (
                        <button
                          onClick={() => handleRemove(member._id!, member.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No additional team members added yet. Invite your colleagues using the form to give them access to chats, leads, and bookings.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;
