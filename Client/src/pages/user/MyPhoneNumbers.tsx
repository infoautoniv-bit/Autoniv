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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load phone numbers');
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
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add phone number');
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
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNumber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this phone number?')) return;
    try {
      await phoneNumberService.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete phone number');
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
      {/* Header & Actions */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[9px] font-black tracking-[0.22em] uppercase text-[var(--primary-blue)]">
            TELEPHONY PROVIDERS & ROUTING
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Phone Numbers</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Connect phone numbers from 14+ global providers and assign them to AI Agents or Users
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all shadow-sm cursor-pointer border-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Phone Number
        </button>
      </motion.div>

      {/* Stats Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold">Total Numbers</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{phoneNumbers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold">Assigned</p>
          <p className="text-2xl font-black text-[var(--primary)] mt-1">{totalAssigned}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold">Unassigned</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{phoneNumbers.length - totalAssigned}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold">Active Platforms</p>
          <p className="text-2xl font-black text-[var(--primary-blue)] mt-1">
            {new Set(phoneNumbers.map((n) => n.platform)).size}
          </p>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-3 shadow-sm">
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
            placeholder="Search number or agent name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </motion.div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading phone numbers...</div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold">{error}</div>
      ) : filteredNumbers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-sm font-extrabold text-slate-700">No phone numbers found</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1.5">Add your first phone number to start receiving & assigning calls</p>
        </div>
      ) : (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNumbers.map((num) => {
            const platformCfg = PLATFORM_CONFIG[num.platform] || PLATFORM_CONFIG.custom;
            return (
              <motion.div
                key={num.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${platformCfg.bg}`}>
                        {platformCfg.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${TIER_BADGE[PLATFORM_TIER[num.platform] || 'basic'].cls}`}>
                        {TIER_BADGE[PLATFORM_TIER[num.platform] || 'basic'].label}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${num.assignedToAgent || num.assignedToUser ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      {num.assignedToAgent || num.assignedToUser ? 'Assigned' : 'Unassigned'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{num.phoneNumber}</h3>
                  {num.friendlyName && (
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{num.friendlyName}</p>
                  )}

                  {/* Assignments */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">AI Agent:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        {num.assignedToAgent ? num.assignedToAgent.name : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Assigned User:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        {num.assignedToUser ? num.assignedToUser.name : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenAssign(num)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-none cursor-pointer"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => handleDeleteNumber(num.id)}
                    className="p-2 rounded-xl text-xs text-rose-500 hover:bg-rose-50 transition-colors border-none cursor-pointer"
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
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4 flex flex-col shrink-0 space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Select Provider</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter providers..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[340px] space-y-1 pr-1 custom-scrollbar">
              {Object.entries(PLATFORM_CONFIG)
                .filter(([key]) => PLATFORM_TIER[key as PhoneNumberPlatform] !== 'unsupported')
                .filter(([key, cfg]) => cfg.name.toLowerCase().includes(modalSearch.toLowerCase()) || key.includes(modalSearch.toLowerCase()))
                .map(([key, cfg]) => {
                  const isSelected = selectedPlatform === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(key as PhoneNumberPlatform);
                        setCredentialsInput({});
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--primary-soft)]/20 border-[#10B981] text-[#10B981] shadow-sm'
                          : 'bg-[#071322] hover:bg-white/5 border-white/10 text-white/80'
                      }`}
                    >
                      <span>{cfg.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold border ${TIER_BADGE[PLATFORM_TIER[key as PhoneNumberPlatform]].cls}`}>
                        {TIER_BADGE[PLATFORM_TIER[key as PhoneNumberPlatform]].label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Main Form Display Panel */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Configure {PLATFORM_CONFIG[selectedPlatform].name} Number
                  </h4>
                  <p className="text-[11px] text-white/50 font-semibold mt-0.5">
                    Enter number and {PLATFORM_CONFIG[selectedPlatform].name} integration credentials
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${PLATFORM_CONFIG[selectedPlatform].bg}`}>
                  {PLATFORM_CONFIG[selectedPlatform].name}
                </span>
              </div>

              {/* Capability notice for the selected provider */}
              {(() => {
                const tier = PLATFORM_TIER[selectedPlatform];
                const badge = TIER_BADGE[tier];
                const msg =
                  tier === 'realtime'
                    ? 'Streams live audio into our voice engine for the lowest latency.'
                    : tier === 'basic'
                    ? 'Works via a turn-based voice loop (play + listen). Fully functional, with slightly higher latency than real-time providers.'
                    : `${PLATFORM_CONFIG[selectedPlatform].name} runs its own AI engine and cannot be connected to our voice orchestrator. Adding it here is disabled.`;
                return (
                  <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${badge.cls}`}>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5">{badge.label}</span>
                    <p className="text-[11px] font-semibold leading-relaxed">{msg}</p>
                  </div>
                );
              })()}

              {/* Inbound webhook URL — configure this in the carrier console */}
              {PLATFORM_TIER[selectedPlatform] !== 'unsupported' && (
                <div className="rounded-xl border border-white/10 bg-[#071322] px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Inbound Webhook URL</p>
                  <p className="text-[11px] text-white/60 font-semibold leading-relaxed">
                    Point this {PLATFORM_CONFIG[selectedPlatform].name} number's voice webhook here so incoming calls reach your agent:
                  </p>
                  <code className="block text-[11px] text-[#10B981] font-mono break-all bg-black/30 rounded-lg px-2.5 py-1.5">
                    {`${(import.meta.env.VITE_API_URL || `${window.location.origin}/api`).replace(/\/$/, '')}/webhooks/incoming-call`}
                  </code>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Phone Number (E.164 format)</label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543210 or +1234567890"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Friendly Name / Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Support HotLine"
                    value={friendlyNameInput}
                    onChange={(e) => setFriendlyNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              {/* Provider Specific Credential Fields */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="text-xs font-black text-[#10B981] uppercase tracking-wider">
                  {PLATFORM_CONFIG[selectedPlatform].name} Required Keys
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PLATFORM_CONFIG[selectedPlatform].fields.map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-white/70 mb-1">{f.label}</label>
                      <input
                        type="text"
                        required={f.required}
                        placeholder={f.placeholder}
                        value={credentialsInput[f.key] || ''}
                        onChange={(e) =>
                          setCredentialsInput({ ...credentialsInput, [f.key]: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Initial Assignment */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="text-xs font-semibold text-white/80">Initial Assignment (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Assign AI Agent</label>
                    <select
                      value={assignedAgentInput}
                      onChange={(e) => setAssignedAgentInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981]"
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
                    <label className="block text-[11px] text-white/50 mb-1">Assign User</label>
                    <select
                      value={assignedUserInput}
                      onChange={(e) => setAssignedUserInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[#071322] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#10B981]"
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
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || PLATFORM_TIER[selectedPlatform] === 'unsupported'}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                style={{ background: 'var(--gg)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
              >
                {submitting ? 'Saving...' : PLATFORM_TIER[selectedPlatform] === 'unsupported' ? 'Not Supported' : `Add ${PLATFORM_CONFIG[selectedPlatform].name} Number`}
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
