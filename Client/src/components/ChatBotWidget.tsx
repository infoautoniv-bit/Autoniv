import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agentChatService, agentService } from '../services/api';
import { Dropdown } from './Dropdown';
import { logger } from '../utils/logger';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  type?: 'success' | 'error' | 'info';
  agentId?: string;
  actions?: ActionButton[];
}

interface ActionButton {
  label: string;
  action: string;
  data?: any;
}

interface AgentForm {
  name: string;
  type: string;
  prompt: string;
  language: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  language: string;
  voiceId?: string;
  prompt?: string;
  createdAt?: string;
}

function formatResponse(text: string) {
  return text.split(/(\*\*.*?\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-[var(--text)] font-bold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

const SUGGESTED = [
  { label: 'Create agent', action: 'form' as const },
  { label: 'List agents',  action: 'list' as const },
  { label: 'Help',         cmd: 'help' },
];

const AGENT_ACTIONS = {
  'receptionist': [
    { label: '📞 Set greeting', action: 'set_greeting' },
    { label: '📅 Configure hours', action: 'set_hours' },
    { label: '🔊 Test voice', action: 'test_voice' },
    { label: '✏️ Edit', action: 'edit_agent' },
  ],
  'appointment': [
    { label: '📅 Set availability', action: 'set_availability' },
    { label: '⏰ Configure slots', action: 'set_slots' },
    { label: '📧 Setup reminders', action: 'set_reminders' },
    { label: '✏️ Edit', action: 'edit_agent' },
  ],
  'faq': [
    { label: '📚 Add FAQ', action: 'add_faq' },
    { label: '🔍 Train knowledge', action: 'train_knowledge' },
    { label: '📝 View common questions', action: 'view_faqs' },
    { label: '✏️ Edit', action: 'edit_agent' },
  ],
};

const AGENT_TYPES = [
  { value: 'receptionist', label: 'Receptionist', desc: 'Front desk & general inquiries' },
  { value: 'appointment', label: 'Appointment', desc: 'Booking & scheduling' },
  { value: 'faq', label: 'FAQ', desc: 'Q&A & knowledge base' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Portuguese', 'Japanese', 'Chinese'];

const TYPE_STYLES: Record<string, { border: string; bg: string }> = {
  success: { border: '#10b981', bg: 'rgba(16,185,129,0.05)' },
  error:   { border: '#f43f5e', bg: 'rgba(244,63,94,0.05)' },
  info:    { border: 'var(--primary-blue)', bg: 'rgba(37,99,235,0.05)' },
  default: { border: 'var(--slate-border)', bg: 'rgba(241,245,249,0.7)' },
};

export function ChatBotWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showAgentList, setShowAgentList] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentForm, setAgentForm] = useState<AgentForm>({ name: '', type: 'receptionist', prompt: '', language: 'English' });
  const [creating, setCreating] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'bot',
    text: '👋 Hi! I can help you manage your voice agents. Try a suggestion below or type `help` to get started.',
    type: 'info',
  }]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const handle = setTimeout(() => {
        setUnread(0);
        inputRef.current?.focus();
      }, 180);
      return () => clearTimeout(handle);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!open && messages.at(-1)?.role === 'bot') {
      const handle = setTimeout(() => setUnread((n) => n + 1), 0);
      return () => clearTimeout(handle);
    }
  }, [messages, open]);

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await agentService.getMy({ limit: 50 });
      const agentsList = res.data.items || res.data.agents || [];
      setAgents(agentsList);
      return agentsList;
    } catch (error) {
      logger.error('Failed to load agents:', error);
      return [];
    } finally {
      setLoadingAgents(false);
    }
  };

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await agentChatService.send(msg);
      const responseText = res.data.response;
      const responseType = res.data.type;
      
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: responseText,
        type: responseType,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: 'Something went wrong. Please try again.',
        type: 'error',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const listAgents = async () => {
    setLoading(true);
    
    setMessages((prev) => [...prev, {
      id: `u-${Date.now()}`,
      role: 'user',
      text: 'List my agents',
    }]);

    try {
      const agentsList = await loadAgents();
      
      if (agentsList.length === 0) {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: "You don't have any agents yet. Would you like to create one?",
          type: 'info',
          actions: [{ label: 'Create Agent', action: 'create_agent' }]
        }]);
      } else {
        const agentListText = agentsList.map((agent: Agent, i: number) =>
          `${i + 1}. **${agent.name}**\n   - Type: ${agent.type}\n   - Status: ${agent.isActive ? '✅ Active' : '⭕ Inactive'}\n   - Language: ${agent.language}`
        ).join('\n\n');
        
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📋 **Your Agents** (${agentsList.length})\n\n${agentListText}\n\nSelect an agent below to manage it:`,
          type: 'success',
          actions: [{ label: 'View All Agents', action: 'show_agents_list' }]
        }]);
        
        // Show agent selection buttons
        setShowAgentList(true);
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: 'Failed to load agents. Please try again.',
        type: 'error',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentAction = async (agent: Agent, action: string) => {
    const actionHandlers: Record<string, () => Promise<void>> = {
      'edit_agent': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `✏️ Editing agent: **${agent.name}**\n\nWhat would you like to change?\n- Name\n- Type\n- Language\n- Prompt\n- Voice`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'set_greeting': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📞 Set greeting for **${agent.name}**\n\nWhat should the agent say when answering calls?\n\nExample: "Hello, thank you for calling ${agent.name}. How may I help you today?"`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'set_hours': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📅 Configure business hours for **${agent.name}**\n\nPlease provide your operating hours (e.g., "Monday-Friday 9 AM to 6 PM, Saturday 10 AM to 2 PM")`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'test_voice': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `🔊 Testing voice for **${agent.name}**...\n\nVoice sample will play shortly.`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'set_availability': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📅 Set appointment availability for **${agent.name}**\n\nPlease provide available days and times for appointments.`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'set_slots': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `⏰ Configure appointment slots for **${agent.name}**\n\nHow long should each appointment be? (e.g., "30 minutes", "1 hour")`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'set_reminders': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📧 Setup appointment reminders for **${agent.name}**\n\nWhen should reminders be sent? (e.g., "1 day before", "1 hour before")`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'add_faq': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📚 Add FAQ to **${agent.name}**\n\nPlease provide:\n1. The question\n2. The answer\n\nExample: Q: What are your hours? A: We're open 9 AM to 6 PM Monday through Friday.`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'train_knowledge': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `🔍 Train **${agent.name}** with new knowledge\n\nWhat information would you like to add?`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
      'view_faqs': async () => {
        setMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: `📝 Fetching FAQs for **${agent.name}**...\n\n(This would show the existing FAQs from your knowledge base)`,
          type: 'info',
          agentId: agent.id,
        }]);
      },
    };

    const handler = actionHandlers[action];
    if (handler) {
      await handler();
    } else {
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: `How can I help you configure "${agent.name}"?`,
        type: 'info',
        agentId: agent.id,
      }]);
    }
  };

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentList(false);
    
    const actions = AGENT_ACTIONS[agent.type as keyof typeof AGENT_ACTIONS] || [
      { label: '✏️ Edit', action: 'edit_agent' },
      { label: '🔊 Test voice', action: 'test_voice' },
      { label: '📊 View stats', action: 'view_stats' },
    ];
    
    setMessages((prev) => [...prev, {
      id: `b-${Date.now()}`,
      role: 'bot',
      text: `✅ **${agent.name}** selected\n\nType: ${agent.type}\nStatus: ${agent.isActive ? 'Active' : 'Inactive'}\nLanguage: ${agent.language}\n\nWhat would you like to do?`,
      type: 'success',
      agentId: agent.id,
      actions: actions,
    }]);
  };

  const createAgentFromForm = async () => {
    if (!agentForm.name.trim()) return;
    setCreating(true);
    setShowAgentForm(false);

    setMessages((prev) => [...prev, {
      id: `u-${Date.now()}`,
      role: 'user',
      text: `Create agent "${agentForm.name}" (${agentForm.type})`,
    }]);

    try {
      const res = await agentService.create({
        name: agentForm.name.trim(),
        type: agentForm.type,
        prompt: agentForm.prompt.trim() || undefined,
        language: agentForm.language,
      });
      const agent = res.data.agent || res.data;
      
      await loadAgents();
      
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: `✅ Agent **${agent.name || agentForm.name}** created successfully!\n\n- Type: ${agent.type || agentForm.type}\n- Language: ${agentForm.language}\n- Status: Active\n\nWhat would you like to do next?`,
        type: 'success',
        agentId: agent.id,
        actions: [
          { label: 'Configure Agent', action: 'edit_agent' },
          { label: 'Test Voice', action: 'test_voice' },
          { label: 'List All Agents', action: 'list_agents' },
        ]
      }]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create agent. Please try again.';
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: 'bot', text: msg, type: 'error' }]);
    } finally {
      setCreating(false);
      setAgentForm({ name: '', type: 'receptionist', prompt: '', language: 'English' });
    }
  };

  const handleSuggestionClick = (suggestion: typeof SUGGESTED[0]) => {
    if (suggestion.action === 'form') {
      setShowAgentForm(true);
    } else if (suggestion.action === 'list') {
      listAgents();
    } else if (suggestion.cmd) {
      sendMessage(suggestion.cmd);
    }
  };

  const handleActionClick = (action: string, agentId?: string) => {
    switch (action) {
      case 'list_agents':
      case 'show_agents_list':
        listAgents();
        break;
      case 'create_agent':
        setShowAgentForm(true);
        break;
      default:
        if (selectedAgent) {
          handleAgentAction(selectedAgent, action);
        } else if (agentId) {
          const agent = agents.find(a => a.id === agentId);
          if (agent) {
            handleAgentAction(agent, action);
          }
        }
        break;
    }
  };

  const isOnlyWelcome = messages.length === 1;

  return (
    <>
      {/* ── FAB ── */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 rounded-2xl text-white flex items-center justify-center shadow-xl"
        style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #0077ff 0%, #00c8b4 100%)',
          boxShadow: '0 8px 32px rgba(0,119,255,0.35)',
        }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}
              className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}
              className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </motion.svg>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/50 sm:bg-black/30 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-[72px] sm:bottom-[86px] left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col overflow-hidden rounded-2xl animate-[fadeInUp_0.3s_cubic-bezier(.16,1,.3,1)]"
              style={{
                width: 'auto',
                maxWidth: 'min(420px, calc(100vw - 32px))',
                height: 'min(580px, calc(100vh - 100px))',
                background: 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--slate-border)',
                boxShadow: '0 24px 64px rgba(37,99,235,0.12), 0 0 0 1px rgba(37,99,235,0.02)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--slate-border)', background: 'rgba(241,245,249,0.3)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold tracking-tight shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0077ff, #00c8b4)' }}
                  >
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] leading-tight">Agent Assistant</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      <p className="text-[10px] text-[var(--text-secondary)] hidden sm:block">Online · Manage agents via chat</p>
                      <p className="text-[10px] text-[var(--text-secondary)] sm:hidden">Online</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-slate-100/85 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--slate-border) transparent' }}>
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const typeStyle = msg.type ? (TYPE_STYLES[msg.type] ?? TYPE_STYLES.default) : TYPE_STYLES.default;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        {msg.role === 'user' ? (
                          <div
                            className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed font-medium shadow-sm shadow-blue-500/10"
                            style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00a8e8)' }}
                          >
                            {msg.text}
                          </div>
                        ) : (
                          <>
                            <div
                              className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap border-l-2 shadow-sm"
                              style={{
                                borderLeftColor: typeStyle.border,
                                background: typeStyle.bg,
                              }}
                            >
                              {formatResponse(msg.text)}
                            </div>
                            
                            {msg.actions && msg.actions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-2">
                                {msg.actions.map((action) => (
                                  <button
                                    key={action.label}
                                    onClick={() => handleActionClick(action.action, msg.agentId)}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all active:scale-[0.98] cursor-pointer"
                                    style={{
                                      color: 'var(--primary-blue)',
                                      background: 'var(--primary-blue-soft)',
                                      borderColor: 'rgba(37,99,235,0.15)',
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Agent selection list */}
                <AnimatePresence>
                  {showAgentList && agents.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="space-y-1.5 mt-2"
                    >
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">Select an agent to manage:</p>
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => selectAgent(agent)}
                          className="w-full text-left p-2.5 rounded-xl border transition-all bg-white hover:bg-slate-50/50 cursor-pointer active:scale-[0.98]"
                          style={{
                            borderColor: 'var(--slate-border)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-[var(--text)]">{agent.name}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 capitalize">
                                {agent.type} • {agent.language}
                              </p>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              agent.isActive 
                                ? 'bg-[var(--primary-soft)] text-[#10b981]' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => setShowAgentList(false)}
                        className="w-full text-center p-2 text-[10px] text-[var(--text-secondary)]/70 hover:text-[var(--text)] font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading indicator for agents */}
                {loadingAgents && (
                  <div className="flex justify-center py-2">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-3 h-3 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">Loading agents...</span>
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                <AnimatePresence>
                  {loading && !loadingAgents && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div
                        className="px-4 py-3 rounded-2xl rounded-bl-sm border-l-2 flex items-center gap-1.5 shadow-sm"
                        style={{ borderLeftColor: 'var(--primary-blue)', background: 'rgba(37,99,235,0.04)' }}
                      >
                        {[0, 150, 300].map((delay, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-[var(--primary-blue)] animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suggested commands */}
                <AnimatePresence>
                  {isOnlyWelcome && !showAgentForm && !showAgentList && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex flex-wrap gap-1.5 pt-1"
                    >
                      {SUGGESTED.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => handleSuggestionClick(s)}
                          className="px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-lg border transition-all active:scale-[0.98] cursor-pointer"
                          style={{
                            color: 'var(--primary-blue)',
                            background: 'var(--primary-blue-soft)',
                            borderColor: 'rgba(37,99,235,0.15)',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inline agent creation form */}
                <AnimatePresence>
                  {showAgentForm && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 8, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border p-3.5 space-y-3 bg-slate-50/70"
                        style={{ borderColor: 'var(--slate-border)' }}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-[var(--text)]">Create New Agent</h4>
                          <button onClick={() => setShowAgentForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Agent Name *</label>
                          <input
                            type="text"
                            value={agentForm.name}
                            onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Front Desk"
                            className="w-full px-3 py-1.5 text-[11px] text-[var(--text)] bg-white rounded-lg outline-none border border-slate-200 focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all"
                            autoFocus
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Type</label>
                          <div className="flex gap-1.5">
                            {AGENT_TYPES.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => setAgentForm((f) => ({ ...f, type: t.value }))}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-center active:scale-[0.98] cursor-pointer ${
                                  agentForm.type === t.value
                                    ? 'bg-[var(--primary-blue-soft)] border-[var(--primary-blue)]/40 text-[var(--primary-blue)]'
                                    : 'bg-white border-slate-200 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-slate-50'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Language</label>
                          <Dropdown
                            value={agentForm.language}
                            options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                            onChange={(val) => setAgentForm((f) => ({ ...f, language: val }))}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Instructions (optional)</label>
                          <textarea
                            value={agentForm.prompt}
                            onChange={(e) => setAgentForm((f) => ({ ...f, prompt: e.target.value }))}
                            placeholder="What should this agent do?"
                            rows={2}
                            className="w-full px-3 py-1.5 text-[11px] text-[var(--text)] bg-white rounded-lg outline-none border border-slate-200 focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10 transition-all resize-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-0.5">
                          <button
                            onClick={() => setShowAgentForm(false)}
                            className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={createAgentFromForm}
                            disabled={!agentForm.name.trim() || creating}
                            className="flex-1 px-3 py-1.5 text-[10px] font-bold rounded-lg text-white transition-all disabled:opacity-40 active:scale-[0.98] cursor-pointer shadow-sm"
                            style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}
                          >
                            {creating ? 'Creating...' : 'Create Agent'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={endRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex-shrink-0 p-3 flex items-center gap-2 bg-slate-50/20"
                style={{ borderTop: '1px solid var(--slate-border)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Type a command or ask about agents..."
                  disabled={loading}
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl outline-none transition-all disabled:opacity-50 bg-white/95 border border-[var(--slate-border)] text-[var(--text)] focus:border-[var(--primary-blue)]/50 focus:ring-1 focus:ring-[var(--primary-blue)]/10"
                  style={{
                    caretColor: 'var(--primary-blue)',
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={loading || !input.trim()}
                  whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-35 transition-opacity active:scale-[0.96] cursor-pointer shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--primary-blue), #00c8b4)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}