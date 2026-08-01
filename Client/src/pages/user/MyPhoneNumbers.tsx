import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { phoneNumberService } from '../../services/api';
import type { PhoneNumber, PhoneNumberPlatform, AssignableUser, AssignableAgent } from '../../types';
import { Modal } from '../../components/Modal';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const stagger = { container: { animate: { transition: { staggerChildren: 0.04 } } } };

const PLATFORM_CONFIG: Record<
  PhoneNumberPlatform,
  { name: string; bg: string; color: string; fields: { key: string; label: string; placeholder: string; required?: boolean }[] }
> = {
  twilio: {
    name: 'Twilio',
    bg: 'bg-red-500/10 border-red-500/30 text-red-400',
    color: '#F22F46',
    fields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', required: true },
      { key: 'authToken', label: 'Auth Token', placeholder: 'your_auth_token', required: true },
    ],
  },
  exotel: {
    name: 'Exotel',
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    color: '#10B981',
    fields: [
      { key: 'accountSid', label: 'Account SID / Subdomain', placeholder: 'your_exotel_sid', required: true },
      { key: 'apiKey', label: 'API Key', placeholder: 'your_api_key', required: true },
      { key: 'apiToken', label: 'API Token', placeholder: 'your_api_token', required: true },
    ],
  },
  plivo: {
    name: 'Plivo',
    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    color: '#3B82F6',
    fields: [
      { key: 'authId', label: 'Auth ID', placeholder: 'MAxxxxxxxxxxxxxxxxxx', required: true },
      { key: 'authToken', label: 'Auth Token', placeholder: 'your_plivo_auth_token', required: true },
    ],
  },
  ozonetel: {
    name: 'Ozonetel',
    bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    color: '#A855F7',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'your_ozonetel_api_key', required: true },
      { key: 'customerName', label: 'Customer Name', placeholder: 'your_customer_name', required: true },
      { key: 'userName', label: 'User Name', placeholder: 'agent_user_name' },
    ],
  },
  mcube: {
    name: 'MCUBE',
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    color: '#F59E0B',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'mcube_api_key', required: true },
      { key: 'domain', label: 'Domain', placeholder: 'mcube.in' },
    ],
  },
  tatatele: {
    name: 'Tata Tele (TATATHR)',
    bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    color: '#6366F1',
    fields: [
      { key: 'authKey', label: 'Auth Key', placeholder: 'tata_auth_key', required: true },
      { key: 'userId', label: 'User ID', placeholder: 'tata_user_id', required: true },
    ],
  },
  maqsam: {
    name: 'Maqsam',
    bg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
    color: '#14B8A6',
    fields: [
      { key: 'accessKey', label: 'Access Key', placeholder: 'maqsam_access_key', required: true },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'maqsam_secret_key', required: true },
    ],
  },
  vobiz: {
    name: 'Vobiz',
    bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    color: '#06B6D4',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'vobiz_api_key', required: true },
      { key: 'accountId', label: 'Account ID', placeholder: 'vobiz_account_id' },
    ],
  },
  voicelink: {
    name: 'VoiceLink',
    bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    color: '#0EA5E9',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'voicelink_api_key', required: true },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'voicelink_secret_key' },
    ],
  },
  vapi: {
    name: 'Vapi AI',
    bg: 'bg-green-500/10 border-green-500/30 text-green-400',
    color: '#22C55E',
    fields: [
      { key: 'phoneNumberId', label: 'Vapi Phone Number ID', placeholder: 'vapi_phone_id', required: true },
      { key: 'apiKey', label: 'Vapi Private API Key', placeholder: 'vapi_private_key' },
    ],
  },
  retell: {
    name: 'Retell AI',
    bg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    color: '#8B5CF6',
    fields: [
      { key: 'phoneNumberId', label: 'Retell Phone ID', placeholder: 'retell_phone_id', required: true },
      { key: 'apiKey', label: 'Retell API Key', placeholder: 'key_xxxxxxxx' },
    ],
  },
  telnyx: {
    name: 'Telnyx',
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    color: '#F43F5E',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'KEY01xxxxxxxx', required: true },
      { key: 'connectionId', label: 'Connection ID', placeholder: 'telnyx_conn_id' },
    ],
  },
  signalwire: {
    name: 'SignalWire',
    bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    color: '#EA580C',
    fields: [
      { key: 'projectId', label: 'Project ID', placeholder: 'project_uuid', required: true },
      { key: 'apiToken', label: 'API Token', placeholder: 'PTxxxxxxxx', required: true },
      { key: 'spaceUrl', label: 'Space URL', placeholder: 'your-space.signalwire.com' },
    ],
  },
  custom: {
    name: 'Custom / SIP',
    bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    color: '#94A3B8',
    fields: [
      { key: 'providerName', label: 'Provider Name', placeholder: 'e.g. Acme Telecom', required: true },
      { key: 'sipEndpoint', label: 'SIP Endpoint', placeholder: 'sip:call@sip.provider.com' },
      { key: 'apiKey', label: 'API / Auth Key', placeholder: 'auth_key' },
    ],
  },
};

// Capability tier per provider on our own voice orchestrator. Mirrors
// backend/services/telephony/capabilities.js (activeTier). 'realtime' streams
// live audio (lowest latency); 'basic' is the turn-based Gather loop (works,
// higher latency); 'unsupported' cannot run on our engine (its own AI engine).
type CapabilityTier = 'realtime' | 'basic' | 'unsupported';

const PLATFORM_TIER: Record<PhoneNumberPlatform, CapabilityTier> = {
  twilio: 'realtime',
  signalwire: 'realtime',
  exotel: 'basic',
  plivo: 'basic',
  ozonetel: 'basic',
  mcube: 'basic',
  tatatele: 'basic',
  maqsam: 'basic',
  vobiz: 'basic',
  voicelink: 'basic',
  telnyx: 'basic',
  custom: 'basic',
  retell: 'unsupported',
  vapi: 'unsupported',
};

const TIER_BADGE: Record<CapabilityTier, { label: string; cls: string }> = {
  realtime: { label: 'Real-time', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  basic: { label: 'Basic', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  unsupported: { label: 'Unsupported', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

export function MyPhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [usersList, setUsersList] = useState<AssignableUser[]>([]);
  const [agentsList, setAgentsList] = useState<AssignableAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);

  // Form State
  const [selectedPlatform, setSelectedPlatform] = useState<PhoneNumberPlatform>('twilio');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [friendlyNameInput, setFriendlyNameInput] = useState('');
  const [credentialsInput, setCredentialsInput] = useState<Record<string, string>>({});
  const [assignedAgentInput, setAssignedAgentInput] = useState('');
  const [assignedUserInput, setAssignedUserInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyNumber = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [numsRes, usersRes, agentsRes] = await Promise.all([
        phoneNumberService.getAll(),
        phoneNumberService.getUsersList(),
        phoneNumberService.getAgentsList(),
      ]);
      setPhoneNumbers(numsRes.data.phoneNumbers || []);
      setUsersList(usersRes.data.users || []);
      setAgentsList(agentsRes.data.agents || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load phone numbers';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const handleOpenAdd = () => {
    setPhoneNumberInput('');
    setFriendlyNameInput('');
    setCredentialsInput({});
    setAssignedAgentInput('');
    setAssignedUserInput('');
    setSelectedPlatform('twilio');
    setModalSearch('');
    setShowAddModal(true);
  };

  const handleCreateNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberInput.trim()) return;

    if (PLATFORM_TIER[selectedPlatform] === 'unsupported') {
      alert(`${PLATFORM_CONFIG[selectedPlatform].name} runs its own AI engine and cannot be used with our voice orchestrator. Please choose a real-time or basic provider.`);
      return;
    }

    setSubmitting(true);
    try {
      await phoneNumberService.create({
        phoneNumber: phoneNumberInput.trim(),
        friendlyName: friendlyNameInput.trim() || undefined,
        platform: selectedPlatform,
        credentials: credentialsInput,
        assignedToAgent: assignedAgentInput || null,
        assignedToUser: assignedUserInput || null,
        capabilities: ['voice'],
      });
      setShowAddModal(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add phone number';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssign = (num: PhoneNumber) => {
    setSelectedNumber(num);
    setAssignedAgentInput(num.assignedToAgent?.id || '');
    setAssignedUserInput(num.assignedToUser?.id || '');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedNumber) return;
    setSubmitting(true);
    try {
      await phoneNumberService.assign(selectedNumber.id, {
        assignedToAgent: assignedAgentInput || null,
        assignedToUser: assignedUserInput || null,
      });
      setShowAssignModal(false);
      setSelectedNumber(null);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update assignment';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this phone number?')) return;
    try {
      await phoneNumberService.delete(id);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete phone number';
      alert(message);
    }
  };

  const filteredNumbers = phoneNumbers.filter((num) => {
    const matchesSearch =
      num.phoneNumber.toLowerCase().includes(search.toLowerCase()) ||
      (num.friendlyName && num.friendlyName.toLowerCase().includes(search.toLowerCase())) ||
      (num.assignedToAgent?.name && num.assignedToAgent.name.toLowerCase().includes(search.toLowerCase()));

    const matchesPlatform = filterPlatform === 'all' || num.platform === filterPlatform;
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'assigned'
        ? !!num.assignedToAgent || !!num.assignedToUser
        : filterStatus === 'unassigned'
        ? !num.assignedToAgent && !num.assignedToUser
        : true;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const totalAssigned = phoneNumbers.filter((n) => n.assignedToAgent || n.assignedToUser).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 85% 0%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(ellipse 50% 90% at 10% 100%, rgba(37,99,235,0.08), transparent 60%)',
          }}
        />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary-soft)] shadow-sm">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <span className="text-[9px] font-black tracking-[0.22em] uppercase text-[var(--primary-blue)]">
                Telephony Providers &amp; Routing
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Phone Numbers</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1 max-w-md">
                Connect numbers from 14+ global providers and route calls to your AI Agents or team members
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn-cta inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all shadow-md cursor-pointer border-none shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Phone Number
          </button>
        </div>
      </motion.div>

      {/* Stats Summary Cards */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Numbers',
            value: phoneNumbers.length,
            accent: 'text-slate-800',
            iconBg: 'bg-slate-100 text-slate-500',
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            ),
          },
          {
            label: 'Assigned',
            value: totalAssigned,
            accent: 'text-[var(--primary)]',
            iconBg: 'bg-emerald-50 text-emerald-500',
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
          {
            label: 'Unassigned',
            value: phoneNumbers.length - totalAssigned,
            accent: 'text-amber-500',
            iconBg: 'bg-amber-50 text-amber-500',
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
          {
            label: 'Active Platforms',
            value: new Set(phoneNumbers.map((n) => n.platform)).size,
            accent: 'text-[var(--primary-blue)]',
            iconBg: 'bg-blue-50 text-blue-500',
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a9.004 9.004 0 018.716 6.747M12 3a9.004 9.004 0 00-8.716 6.747M21.75 12H2.25" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5"
          >
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                {stat.icon}
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-bold truncate">{stat.label}</p>
              <p className={`text-2xl font-black leading-tight ${stat.accent}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-3 shadow-sm"
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search number, label or agent name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-shadow"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
          >
            <option value="all">All Platforms</option>
            {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[var(--primary)] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </motion.div>

      {/* Main List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-24 rounded-full bg-slate-200/80" />
                <div className="h-5 w-16 rounded-full bg-slate-200/80" />
              </div>
              <div className="h-6 w-40 rounded-lg bg-slate-200/80 mb-2" />
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
              <div className="mt-5 h-9 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      ) : filteredNumbers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 backdrop-blur-md p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center mx-auto mb-5 rotate-3">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-700">
            {phoneNumbers.length === 0 ? 'No phone numbers yet' : 'No numbers match your filters'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1.5 max-w-xs mx-auto">
            {phoneNumbers.length === 0
              ? 'Add your first phone number to start receiving & assigning calls'
              : 'Try adjusting the search or filter options above'}
          </p>
          {phoneNumbers.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all shadow-md cursor-pointer border-none mt-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Phone Number
            </button>
          )}
        </div>
      ) : (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNumbers.map((num) => {
            const platformCfg = PLATFORM_CONFIG[num.platform] || PLATFORM_CONFIG.custom;
            const tier = PLATFORM_TIER[num.platform] || 'basic';
            const isAssigned = !!num.assignedToAgent || !!num.assignedToUser;
            return (
              <motion.div
                key={num.id}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                className="group rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:border-slate-300 transition-all relative overflow-hidden"
              >
                {/* Soft provider-tinted glow, top-right */}
                <div
                  className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
                  style={{ background: `radial-gradient(circle, ${platformCfg.color}, transparent 70%)` }}
                />

                <div className="p-5 pb-4 relative">
                  {/* Row 1: provider identity + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Provider avatar */}
                      <div
                        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${platformCfg.color}, ${platformCfg.color}cc)`,
                          boxShadow: `0 4px 12px ${platformCfg.color}33`,
                        }}
                      >
                        {platformCfg.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide truncate">
                          {platformCfg.name}
                        </p>
                        <span className={`inline-block mt-0.5 px-1.5 py-px rounded text-[9px] font-black uppercase border ${TIER_BADGE[tier].cls}`}>
                          {TIER_BADGE[tier].label}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        isAssigned
                          ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}
                    >
                      <span className="relative flex w-1.5 h-1.5">
                        {isAssigned && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-60" />
                        )}
                        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${isAssigned ? 'bg-[var(--primary)]' : 'bg-amber-500'}`} />
                      </span>
                      {isAssigned ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>

                  {/* Row 2: the number itself */}
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-3.5 py-2.5">
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-slate-800 tracking-tight tabular-nums truncate leading-tight">
                        {num.phoneNumber}
                      </h3>
                      <p className={`text-[11px] font-semibold truncate ${num.friendlyName ? 'text-slate-500' : 'text-slate-300 italic'}`}>
                        {num.friendlyName || 'No label'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(num.id, num.phoneNumber)}
                      title="Copy number"
                      className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 border ${
                        copiedId === num.id
                          ? 'text-[var(--primary)] bg-[var(--primary-soft)] border-[var(--primary)]/20'
                          : 'text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                      }`}
                    >
                      {copiedId === num.id ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Row 3: routing chips */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className={`rounded-xl border px-3 py-2 min-w-0 ${num.assignedToAgent ? 'border-[var(--primary)]/20 bg-[var(--primary-soft)]/60' : 'border-slate-100 bg-slate-50/60'}`}>
                      <div className="flex items-center gap-1.5">
                        <svg className={`w-3 h-3 shrink-0 ${num.assignedToAgent ? 'text-[var(--primary)]' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">AI Agent</span>
                      </div>
                      <p className={`text-xs font-bold truncate mt-1 ${num.assignedToAgent ? 'text-slate-700' : 'text-slate-300'}`}>
                        {num.assignedToAgent ? num.assignedToAgent.name : 'None'}
                      </p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 min-w-0 ${num.assignedToUser ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-slate-50/60'}`}>
                      <div className="flex items-center gap-1.5">
                        <svg className={`w-3 h-3 shrink-0 ${num.assignedToUser ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">User</span>
                      </div>
                      <p className={`text-xs font-bold truncate mt-1 ${num.assignedToUser ? 'text-slate-700' : 'text-slate-300'}`}>
                        {num.assignedToUser ? num.assignedToUser.name : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAssign(num)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer border-none shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    {isAssigned ? 'Reassign' : 'Assign'}
                  </button>
                  <button
                    onClick={() => handleDeleteNumber(num.id)}
                    className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer bg-white"
                    title="Delete Phone Number"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Phone Number Modal with Dark Theme Styling & Provider Sidebar */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Phone Number" size="xl">
        <form onSubmit={handleCreateNumber} className="flex flex-col md:flex-row gap-6 min-h-[420px]">
          {/* Left Provider Sidebar inside Dark Modal */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-5 flex flex-col shrink-0 space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Select Provider</p>
              <div className="relative">
                <svg
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter providers..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#071322] border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-1.5 pr-1 custom-scrollbar">
              {Object.entries(PLATFORM_CONFIG)
                .filter(([key]) => PLATFORM_TIER[key as PhoneNumberPlatform] !== 'unsupported')
                .filter(([key, cfg]) => cfg.name.toLowerCase().includes(modalSearch.toLowerCase()) || key.includes(modalSearch.toLowerCase()))
                .map(([key, cfg]) => {
                  const isSelected = selectedPlatform === key;
                  const kTier = PLATFORM_TIER[key as PhoneNumberPlatform];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(key as PhoneNumberPlatform);
                        setCredentialsInput({});
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#10B981]/10 border-[#10B981]/60 text-white shadow-[0_0_16px_rgba(16,185,129,0.12)]'
                          : 'bg-[#071322] hover:bg-white/5 border-white/10 text-white/70 hover:text-white/90'
                      }`}
                    >
                      {/* Provider initials avatar */}
                      <span
                        className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                        style={{
                          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}99)`,
                          boxShadow: isSelected ? `0 0 10px ${cfg.color}55` : 'none',
                        }}
                      >
                        {cfg.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{cfg.name}</span>
                        <span
                          className={`block text-[9px] font-extrabold uppercase tracking-wide mt-px ${
                            kTier === 'realtime' ? 'text-emerald-400/80' : 'text-amber-400/70'
                          }`}
                        >
                          {TIER_BADGE[kTier].label}
                        </span>
                      </span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-[#10B981] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Main Form Display Panel */}
          <div className="flex-1 flex flex-col justify-between space-y-5">
            <div className="space-y-5">
              {/* Selected provider hero */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 relative overflow-hidden">
                <div
                  className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-20"
                  style={{ background: `radial-gradient(circle, ${PLATFORM_CONFIG[selectedPlatform].color}, transparent 70%)` }}
                />
                <div
                  className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-sm font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${PLATFORM_CONFIG[selectedPlatform].color}, ${PLATFORM_CONFIG[selectedPlatform].color}99)`,
                    boxShadow: `0 4px 16px ${PLATFORM_CONFIG[selectedPlatform].color}44`,
                  }}
                >
                  {PLATFORM_CONFIG[selectedPlatform].name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 relative">
                  <h4 className="text-sm font-extrabold text-white truncate">
                    Configure {PLATFORM_CONFIG[selectedPlatform].name} Number
                  </h4>
                  <p className="text-[11px] text-white/50 font-semibold mt-0.5">
                    Enter number and {PLATFORM_CONFIG[selectedPlatform].name} integration credentials
                  </p>
                </div>
                <span className={`ml-auto shrink-0 px-2 py-1 rounded-full text-[9px] font-black uppercase border relative ${TIER_BADGE[PLATFORM_TIER[selectedPlatform]].cls}`}>
                  {TIER_BADGE[PLATFORM_TIER[selectedPlatform]].label}
                </span>
              </div>

              {/* Capability notice for the selected provider */}
              {(() => {
                const tier = PLATFORM_TIER[selectedPlatform];
                const msg =
                  tier === 'realtime'
                    ? 'Streams live audio into our voice engine for the lowest latency.'
                    : tier === 'basic'
                    ? 'Works via a turn-based voice loop (play + listen). Fully functional, with slightly higher latency than real-time providers.'
                    : `${PLATFORM_CONFIG[selectedPlatform].name} runs its own AI engine and cannot be connected to our voice orchestrator. Adding it here is disabled.`;
                const iconCls = tier === 'realtime' ? 'text-emerald-400' : tier === 'basic' ? 'text-amber-400' : 'text-rose-400';
                return (
                  <div className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2.5 ${TIER_BADGE[tier].cls}`}>
                    <svg className={`w-4 h-4 shrink-0 ${iconCls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      {tier === 'realtime' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      )}
                    </svg>
                    <p className="text-[11px] font-semibold leading-relaxed">{msg}</p>
                  </div>
                );
              })()}

              {/* Inbound webhook URL — configure this in the carrier console */}
              {PLATFORM_TIER[selectedPlatform] !== 'unsupported' && (
                <div className="rounded-xl border border-white/10 bg-[#071322] px-3.5 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Inbound Webhook URL</p>
                  </div>
                  <p className="text-[11px] text-white/60 font-semibold leading-relaxed">
                    Point this {PLATFORM_CONFIG[selectedPlatform].name} number's voice webhook here so incoming calls reach your agent:
                  </p>
                  {(() => {
                    const webhookUrl = `${(import.meta.env.VITE_API_URL || `${window.location.origin}/api`).replace(/\/$/, '')}/webhooks/incoming-call`;
                    return (
                      <div className="flex items-center gap-2 bg-black/30 rounded-lg pl-2.5 pr-1.5 py-1.5">
                        <code className="flex-1 text-[11px] text-[#10B981] font-mono break-all">{webhookUrl}</code>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber('webhook', webhookUrl)}
                          title="Copy webhook URL"
                          className={`p-1.5 rounded-md transition-all cursor-pointer border shrink-0 ${
                            copiedId === 'webhook'
                              ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                              : 'text-white/40 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                          }`}
                        >
                          {copiedId === 'webhook' ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Number details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[10px] font-black flex items-center justify-center">1</span>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-wider">Number Details</p>
                  <span className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Phone Number <span className="text-white/35 font-medium">(E.164 format)</span>
                    </label>
                    <div className="relative">
                      <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        type="text"
                        required
                        placeholder="+919876543210 or +1234567890"
                        value={phoneNumberInput}
                        onChange={(e) => setPhoneNumberInput(e.target.value)}
                        className="w-full pl-8.5 pr-3 py-2.5 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">
                      Friendly Name <span className="text-white/35 font-medium">(Optional)</span>
                    </label>
                    <div className="relative">
                      <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="e.g. Sales Support HotLine"
                        value={friendlyNameInput}
                        onChange={(e) => setFriendlyNameInput(e.target.value)}
                        className="w-full pl-8.5 pr-3 py-2.5 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-shadow"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Specific Credential Fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[10px] font-black flex items-center justify-center">2</span>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                    {PLATFORM_CONFIG[selectedPlatform].name} Credentials
                  </p>
                  <span className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORM_CONFIG[selectedPlatform].fields.map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-white/70 mb-1.5">
                        {f.label}
                        {f.required ? <span className="text-rose-400 ml-0.5">*</span> : <span className="text-white/35 font-medium ml-1">(Optional)</span>}
                      </label>
                      <input
                        type="text"
                        required={f.required}
                        placeholder={f.placeholder}
                        value={credentialsInput[f.key] || ''}
                        onChange={(e) =>
                          setCredentialsInput({ ...credentialsInput, [f.key]: e.target.value })
                        }
                        className="w-full px-3 py-2.5 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-shadow font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Initial Assignment */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[10px] font-black flex items-center justify-center">3</span>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-wider">Initial Assignment</p>
                  <span className="text-[9px] text-white/30 font-bold uppercase">Optional</span>
                  <span className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Assign AI Agent</label>
                    <select
                      value={assignedAgentInput}
                      onChange={(e) => setAssignedAgentInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
                    >
                      <option value="" className="bg-[#0c1222] text-white">None</option>
                      {agentsList.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#0c1222] text-white">
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1.5">Assign User</label>
                    <select
                      value={assignedUserInput}
                      onChange={(e) => setAssignedUserInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981] cursor-pointer"
                    >
                      <option value="" className="bg-[#0c1222] text-white">None</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#0c1222] text-white">
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/20 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || PLATFORM_TIER[selectedPlatform] === 'unsupported'}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer hover:-translate-y-0.5"
                style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
              >
                {submitting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : PLATFORM_TIER[selectedPlatform] === 'unsupported' ? (
                  'Not Supported'
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add {PLATFORM_CONFIG[selectedPlatform].name} Number
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Assign Modal with Dark Theme Styling */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Phone Number" size="md">
        <div className="space-y-4">
          <p className="text-xs text-white/70 font-semibold">
            Assigning <span className="text-white font-bold">{selectedNumber?.phoneNumber}</span>
          </p>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Assign to AI Agent</label>
            <select
              value={assignedAgentInput}
              onChange={(e) => setAssignedAgentInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981]"
            >
              <option value="" className="bg-[#0c1222] text-white">None (Unassigned)</option>
              {agentsList.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#0c1222] text-white">
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Assign to System User</label>
            <select
              value={assignedUserInput}
              onChange={(e) => setAssignedUserInput(e.target.value)}
              className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981]"
            >
              <option value="" className="bg-[#0c1222] text-white">None (Unassigned)</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#0c1222] text-white">
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 border-none cursor-pointer"
              style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
            >
              {submitting ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
