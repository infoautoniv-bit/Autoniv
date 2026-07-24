import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks/useStore';
import { userChatService, chatHistoryService } from '../../services/api';
import { updateChatUsed } from '../../store/slices/authSlice';
import type { ChatSessionSummary, ChatMessage } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// AI backend now returns these 3 steps only
type ChatStep = 'idle' | 'collecting_lead' | 'collecting_appt';

interface ChatContext {
  step: ChatStep;
  data: Record<string, string>;
}

// History entry sent to the backend for AI context
interface HistoryEntry {
  role: 'user' | 'bot';
  text: string;
}

const WELCOME_TEXT = `Hello! I'm your **Assistant**. 👋\n\nI can help you with:\n\n• **Capture a lead** — Save a new customer's information\n• **Book an appointment** — Schedule a meeting or service\n• **FAQ** — Answer common questions\n• **List my records** — View your leads and appointments\n\nHow can I assist you today?`;

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'bot',
  text: WELCOME_TEXT,
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  { label: 'Capture Lead',     icon: '📋', cmd: 'I want to capture a lead' },
  { label: 'Book Appointment', icon: '📅', cmd: 'Book an appointment' },
  { label: 'FAQ',              icon: '❓', cmd: '' },
  { label: 'My Records',       icon: '📊', cmd: 'Show me all my leads and appointments' },
];

const FAQ_TOPICS = [
  { icon: '🤖', question: 'What is Autoniv?' },
  { icon: '🧩', question: 'What features does Autoniv offer?' },
  { icon: '👤', question: 'What agent types are available?' },
  { icon: '🏷️', question: 'Tell me about Autoniv pricing plans' },
  { icon: '📎', question: 'What add-ons are available?' },
  { icon: '🔗', question: 'What integrations do you support?' },
  { icon: '🏥', question: 'What are the use cases for Autoniv?' },
  { icon: '🌐', question: 'How many languages do you support?' },
  { icon: '🎙️', question: 'How many voices are available?' },
  { icon: '🛡️', question: 'What about security and compliance?' },
  { icon: '🕐', question: 'What are your business hours?' },
  { icon: '📞', question: 'How can I contact support?' },
  { icon: '📍', question: 'Where is Autoniv located?' },
  { icon: '📋', question: 'How do I capture a lead?' },
  { icon: '📅', question: 'How do I book an appointment?' },
  { icon: '🔄', question: 'How do I convert a lead to appointment?' },
  { icon: '▶️', question: 'How do I get started with Autoniv?' },
  { icon: '🎬', question: 'Can I try a demo?' },
  { icon: '📊', question: 'What analytics do you offer?' },
  { icon: '⚡', question: 'How fast is the response time?' },
  { icon: '⭐', question: 'What is included in the Growth plan?' },
  { icon: '🏪', question: 'Do you have a white-label option?' },
  { icon: '📱', question: 'What is WhatsApp follow-up?' },
  { icon: '↗️', question: 'How do I upgrade my plan?' },
  { icon: '🔐', question: 'What is the Assistant Agent?' },
  { icon: '🔔', question: 'How does appointment booking work?' },
];

// Placeholders driven by AI step (no granular sub-steps anymore)
const STEP_PLACEHOLDERS: Record<ChatStep, string> = {
  idle:             'Message your assistant...',
  collecting_lead:  'Enter lead details...',
  collecting_appt:  'Enter appointment details...',
};

const STEP_LABELS: Record<string, { label: string; color: string }> = {
  collecting_lead: { label: 'Capturing Lead',      color: '#6366f1' },
  collecting_appt: { label: 'Booking Appointment', color: '#0ea5e9' },
};

const STORAGE_KEY = 'autoniv:mychat:messages';

function loadMessages(): Message[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return null;
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* ignore */ }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatText(text: string): React.ReactNode[] {
  return text.split(/(\*\*.*?\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function renderList(items: { key: number; text: string }[], listType: 'ul' | 'ol', key: number) {
  if (!items.length) return null;
  const isOrdered = listType === 'ol';
  const listElements = items.map((item, idx) => (
    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 2 }}>
      {!isOrdered
        ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 7 }} />
        : <span style={{ color: 'var(--primary)', fontWeight: 500, fontSize: 11, flexShrink: 0, minWidth: 14, marginTop: 1 }}>{idx + 1}.</span>
      }
      <span>{formatText(item.text)}</span>
    </li>
  ));
  const Tag = isOrdered ? 'ol' : 'ul';
  return <Tag key={`list-${key}`} style={{ listStyle: 'none', padding: 0, margin: '6px 0' }}>{listElements}</Tag>;
}

function BulletText({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: { key: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line   = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (listItems.length && listType) {
        elements.push(renderList(listItems, listType, i));
        listItems = [];
        listType = null;
      }
      elements.push(<div key={`sp-${i}`} style={{ height: 6 }} />);
      continue;
    }
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType && listType !== 'ul' && listItems.length) {
        elements.push(renderList(listItems, listType, i));
        listItems = [];
      }
      listType = 'ul';
      listItems.push({ key: i, text: trimmed.replace(/^[-*•]\s/, '') });
      continue;
    }
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType && listType !== 'ol' && listItems.length) {
        elements.push(renderList(listItems, listType, i));
        listItems = [];
      }
      listType = 'ol';
      listItems.push({ key: i, text: trimmed.replace(/^\d+[.)]\s/, '') });
      continue;
    }
    if (listItems.length && listType) {
      elements.push(renderList(listItems, listType, i));
      listItems = [];
      listType = null;
    }
    if (/^#{1,3}\s/.test(trimmed)) {
      elements.push(
        <p key={`h-${i}`} style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, margin: '4px 0 2px' }}>
          {formatText(trimmed.replace(/^#{1,3}\s/, ''))}
        </p>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-secondary)', margin: '1px 0' }}>
          {formatText(line)}
        </p>
      );
    }
  }

  if (listItems.length && listType) {
    elements.push(renderList(listItems, listType, lines.length));
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{elements}</div>;
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'block' }}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

const BotAvatar = () => (
  <div style={{
    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
    background: 'var(--gg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1, boxShadow: '0 2px 10px rgba(16,185,129,0.2)',
  }}>
    <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </div>
);

const UserAvatar = () => (
  <div style={{
    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  }}>
    <svg width="14" height="14" fill="none" stroke="rgba(0,0,0,0.4)" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </div>
);

export function MyChat() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const chatLimit = user?.chatLimit || 100;

  const [messages, setMessages]   = useState<Message[]>(() => loadMessages() ?? [WELCOME_MESSAGE]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [context, setContext]     = useState<ChatContext>({ step: 'idle', data: {} });
  const [focused, setFocused]     = useState(false);
  const [showFaqTopics, setShowFaqTopics] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Chat history state
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [sessions, setSessions]           = useState<ChatSessionSummary[]>([]);
  const [showHistory, setShowHistory]     = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // history kept in sync for backend AI context — excludes the static welcome message
  const historyRef = useRef<HistoryEntry[]>([]);

  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Fetch chat sessions from backend
  const fetchSessions = useCallback(async () => {
    try {
      const res = await chatHistoryService.list();
      setSessions(res.data.sessions);
      if (res.data.chatUsed !== undefined) {
        dispatch(updateChatUsed({ chatUsed: res.data.chatUsed, chatLimit }));
      }
    } catch { /* ignore */ }
  }, [dispatch, chatLimit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSessions]);

  // Save current messages to backend session
  const saveToBackend = useCallback(async (msgs: Message[]) => {
    try {
      const backendMsgs: ChatMessage[] = msgs
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp.toISOString() }));

      if (backendMsgs.length === 0) return;

      // Auto-generate title from first user message
      const firstUserMsg = msgs.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 50) : 'New Chat';

      if (sessionId) {
        await chatHistoryService.update(sessionId, { title, messages: backendMsgs });
      } else {
        const res = await chatHistoryService.create({ title, messages: backendMsgs });
        setSessionId(res.data.id);
        if (res.data.chatUsed !== undefined) {
          dispatch(updateChatUsed({ chatUsed: res.data.chatUsed, chatLimit }));
        }
      }
      fetchSessions();
    } catch { /* ignore */ }
  }, [sessionId, fetchSessions, dispatch, chatLimit]);

  // Delete a session
  const deleteSession = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await chatHistoryService.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (res.data?.chatUsed !== undefined) {
        dispatch(updateChatUsed({ chatUsed: res.data.chatUsed, chatLimit }));
      }
      if (sessionId === id) {
        const welcome = { ...WELCOME_MESSAGE, id: `welcome-${Date.now()}`, timestamp: new Date() };
        setMessages([welcome]);
        setSessionId(null);
        setContext({ step: 'idle', data: {} });
        historyRef.current = [];
        setShowFaqTopics(false);
        setInput('');
      }
    } catch { /* ignore */ }
  }, [sessionId, dispatch, chatLimit]);

  // Load a session from backend
  const loadSession = useCallback(async (id: string) => {
    try {
      setHistoryLoading(true);
      const res = await chatHistoryService.get(id);
      const data = res.data;
      setSessionId(data.id);
      const loadedMessages: Message[] = data.messages.map((m, i) => ({
        id: `${m.role}-${i}-${Date.now()}`,
        role: m.role,
        text: m.text,
        timestamp: new Date(m.timestamp),
      }));
      // Rebuild historyRef for AI context
      historyRef.current = data.messages.map(m => ({ role: m.role, text: m.text }));
      setMessages(loadedMessages.length > 0 ? loadedMessages : [WELCOME_MESSAGE]);
      setContext({ step: 'idle', data: {} });
      setShowHistory(false);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, []);

  const addMessage = useCallback((role: 'user' | 'bot', text: string): Message => {
    const msg: Message = { id: `${role}-${Date.now()}-${Math.random()}`, role, text, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    historyRef.current = [...historyRef.current, { role, text }];
    return msg;
  }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setShowFaqTopics(false);
    addMessage('user', msg);
    setLoading(true);

    try {
      const res = await userChatService.send(msg, context, historyRef.current);
      const data = res.data;
      const botText = data.response || "Sorry, I couldn't process that.";
      addMessage('bot', botText);
      setContext({ step: (data.step as ChatStep) || 'idle', data: data.data || {} });

      // Update chatUsed from response instead of calling checkAuth (which could log user out)
      if (data.chatUsed !== undefined) {
        dispatch(updateChatUsed({ chatUsed: data.chatUsed, chatLimit: data.chatLimit }));
      }

      // Save to backend after bot reply
      setTimeout(() => {
        setMessages(prev => {
          saveToBackend(prev);
          return prev;
        });
      }, 100);
    } catch {
      addMessage('bot', 'Sorry, something went wrong. Please try again.');
      setContext({ step: 'idle', data: {} });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, context, addMessage, saveToBackend, dispatch]);

  const handleReset = useCallback(() => {
    const welcome = { ...WELCOME_MESSAGE, id: `welcome-${Date.now()}`, timestamp: new Date() };
    setMessages([welcome]);
    saveMessages([welcome]);
    setSessionId(null);
    setContext({ step: 'idle', data: {} });
    historyRef.current = [];
    setShowFaqTopics(false);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const showQuickActions = context.step === 'idle' && !loading;
  const stepInfo         = STEP_LABELS[context.step];
  const placeholder      = STEP_PLACEHOLDERS[context.step] ?? 'Message your assistant...';

  return (
    <div style={{ height: isMobile ? 'calc(100vh - 4rem)' : 'calc(100vh - 7rem)', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-start', justifyContent: 'space-between', paddingBottom: isMobile ? 8 : 20, flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
         
          <div>
            <p className="text-[9px] font-extrabold tracking-[0.25em] uppercase gradient-text mb-1.5">◈Support</p>
             <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-800 leading-none">My Chat</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => { setShowHistory(prev => !prev); fetchSessions(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
              padding: isMobile ? '5px 10px' : '8px 14px', borderRadius: 10, fontSize: isMobile ? 11 : 12, fontWeight: 500,
              background: showHistory ? 'var(--primary-soft)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${showHistory ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`,
              color: showHistory ? 'var(--primary-dark)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isMobile ? 'History' : 'History'}
          </button>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
              padding: isMobile ? '5px 10px' : '8px 14px', borderRadius: 10, fontSize: isMobile ? 11 : 12, fontWeight: 500,
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
              color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(0,0,0,0.08)'; b.style.color = 'var(--text)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'rgba(0,0,0,0.04)'; b.style.color = 'var(--text-secondary)'; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isMobile ? 'New' : 'New chat'}
          </button>
        </div>
      </motion.div>

      {/* ── Chat usage bar ── */}
      {(() => {
        const used = user?.chatUsed ?? 0;
        const limit = user?.chatLimit ?? 0;
        const isUnlimited = limit === -1;
        const over = !isUnlimited && used >= limit;
        const pct = isUnlimited ? 0 : Math.min((used / (limit || 1)) * 100, 100);
        return (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 10, marginBottom: 12,
              background: over ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.04)',
              border: `1px solid ${over ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)'}`,
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" fill="none" stroke={over ? '#ef4444' : 'var(--primary)'} viewBox="0 0 24 24" strokeWidth={2} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {used}<span style={{ color: 'var(--text-muted)' }}>/{isUnlimited ? '∞' : limit}</span>
            </span>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${isUnlimited ? 100 : pct}%`, height: '100%', borderRadius: 2, background: over ? '#ef4444' : 'var(--primary)', transition: 'width 0.4s', opacity: isUnlimited ? 0.35 : 1 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: over ? '#ef4444' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {isUnlimited ? 'Unlimited' : over ? 'Limit reached' : `${Math.round(pct)}% used`}
            </span>
            {over && (
              <button type="button" onClick={() => window.location.href = '/dashboard/billing'} style={{ fontSize: 10, fontWeight: 600, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                Upgrade
              </button>
            )}
          </motion.div>
        );
      })()}

      {/* ── History sidebar ── */}
      <AnimatePresence>
        {showHistory && isMobile && (
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 35,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="history-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: isMobile ? '85%' : 300,
              background: 'var(--surface)', borderRight: '1px solid var(--slate-border)',
              zIndex: 40, display: 'flex', flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--slate-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
              {historyLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(79,70,229,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No chat history yet</p>
                </div>
              ) : (
                sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                      background: sessionId === s.id ? 'var(--primary-soft)' : 'transparent',
                      border: sessionId === s.id ? '1px solid var(--border)' : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4,
                    }}
                    onMouseEnter={e => { if (sessionId !== s.id) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { if (sessionId !== s.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {s.title}
                      </p>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                          padding: 2, flexShrink: 0, borderRadius: 4, transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.messageCount} messages · {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat window ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderRadius: isMobile ? 12 : 20, border: '1px solid var(--slate-border)',
          background: 'var(--surface)', overflow: 'hidden', minHeight: 0,
          boxShadow: '0 8px 32px rgba(37,99,235,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {/* Status bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderBottom: '1px solid var(--slate-border)',
          background: 'rgba(0,0,0,0.01)', flexShrink: 0,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'block', boxShadow: '0 0 7px #34d399' }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Online</span>
          <span style={{ color: 'rgba(0,0,0,0.1)' }}>·</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>AI Assistant</span>

          <AnimatePresence>
            {stepInfo && (
              <motion.span
                key={context.step}
                initial={{ opacity: 0, scale: 0.85, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                style={{
                  marginLeft: 'auto',
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: 10.5, fontWeight: 600,
                  background: `${stepInfo.color}15`,
                  color: stepInfo.color,
                  border: `1px solid ${stepInfo.color}28`,
                  letterSpacing: '0.02em',
                }}
              >
                ● {stepInfo.label}
              </motion.span>
            )}
          </AnimatePresence>

          <div style={{ marginLeft: stepInfo ? 0 : 'auto', display: 'flex', gap: 5 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.45 }} />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1, overflowY: 'auto', padding: isMobile ? '12px 10px' : '18px 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--primary-soft) transparent',
          }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isUser  = msg.role === 'user';
              const prev    = messages[idx - 1];
              const showTime = idx === 0 || (msg.timestamp.getTime() - prev.timestamp.getTime()) > 60000;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {showTime && (
                    <p style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-muted)', margin: '10px 0 12px', letterSpacing: '0.04em' }}>
                      {formatTime(msg.timestamp)}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8, alignItems: 'flex-start', gap: 10 }}>
                    {!isUser && <BotAvatar />}

                    <div style={{
                      maxWidth: isUser ? (isMobile ? '82%' : '70%') : (isMobile ? '88%' : '80%'),
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background: isUser
                        ? 'var(--gg)'
                        : '#f1f5f9',
                      border: isUser ? 'none' : '1px solid var(--slate-border)',
                      boxShadow: isUser ? '0 4px 14px rgba(37,99,235,0.2)' : 'none',
                    }}>
                      {isUser
                        ? <p style={{ fontSize: 13, color: '#ffffff', margin: 0, lineHeight: 1.55 }}>{msg.text}</p>
                        : <BulletText text={msg.text} />
                      }
                    </div>

                    {isUser && <UserAvatar />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}
              >
                <BotAvatar />
                <div style={{
                  padding: '2px 14px 4px',
                  borderRadius: '4px 16px 16px 16px',
                  background: '#f1f5f9',
                  border: '1px solid var(--slate-border)',
                }}>
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FAQ Topics */}
          <AnimatePresence>
            {showFaqTopics && !loading && (
              <motion.div
                key="faqtopics"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ paddingTop: 10 }}
              >
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  ❓ FAQ — select a topic
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {FAQ_TOPICS.map(topic => (
                    <button
                      key={topic.question}
                      onClick={() => { setShowFaqTopics(false); sendMessage(topic.question); }}
                      disabled={loading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: isMobile ? '7px 12px' : '5px 11px', borderRadius: 8,
                        fontSize: isMobile ? 12.5 : 11.5, fontWeight: 500,
                        background: 'var(--primary-soft)',
                        border: '1px solid var(--primary-soft)',
                        color: 'var(--primary-dark)', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(80, 200, 120, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(80, 200, 120, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--primary-soft)';
                        e.currentTarget.style.borderColor = 'var(--primary-soft)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{topic.icon}</span>
                      {topic.question}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowFaqTopics(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: isMobile ? '7px 12px' : '5px 11px', borderRadius: 8,
                      fontSize: isMobile ? 12.5 : 11.5, fontWeight: 500,
                      background: 'rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.08)';
                      e.currentTarget.style.color = 'var(--text)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions */}
          <AnimatePresence>
            {showQuickActions && !showFaqTopics && (
              <motion.div
                key="quickactions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                style={{ paddingTop: 6 }}
              >
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Quick actions
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {QUICK_ACTIONS.map(action => {
                    const isFaq = action.label === 'FAQ';
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          if (loading) return;
                          if (isFaq) { setShowFaqTopics(prev => !prev); return; }
                          sendMessage(action.cmd);
                        }}
                        disabled={loading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: isMobile ? '8px 14px' : '6px 13px', borderRadius: 10,
                          fontSize: isMobile ? 13 : 12, fontWeight: 500,
                          background: isFaq && showFaqTopics ? 'var(--primary-blue-soft)' : 'var(--primary-soft)',
                          border: isFaq && showFaqTopics ? '1px solid var(--primary-blue)' : '1px solid var(--border)',
                          color: isFaq && showFaqTopics ? 'var(--primary-blue)' : 'var(--primary-dark)', cursor: 'pointer',
                          transition: 'all 0.15s', opacity: loading ? 0.4 : 1,
                        }}
                        onMouseEnter={e => {
                          const b = e.currentTarget;
                          b.style.background = 'rgba(80, 200, 120, 0.18)';
                          b.style.borderColor = 'rgba(80, 200, 120, 0.4)';
                          b.style.transform = 'translateY(-1px)';
                          b.style.boxShadow = '0 4px 12px rgba(80, 200, 120, 0.2)';
                        }}
                        onMouseLeave={e => {
                          const b = e.currentTarget;
                          if (!(isFaq && showFaqTopics)) {
                            b.style.background = 'var(--primary-soft)';
                            b.style.borderColor = 'var(--border)';
                          } else {
                            b.style.background = 'var(--primary-blue-soft)';
                            b.style.borderColor = 'var(--primary-blue)';
                          }
                          b.style.transform = 'translateY(0)';
                          b.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{action.icon}</span>
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={{
          flexShrink: 0, padding: isMobile ? '8px 10px 10px' : '12px 14px 14px',
          borderTop: '1px solid var(--slate-border)',
          background: 'rgba(0,0,0,0.01)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: focused ? '#ffffff' : '#f8fafc',
            border: `1px solid ${focused ? 'var(--primary)' : 'var(--slate-border)'}`,
            borderRadius: isMobile ? 12 : 14, padding: isMobile ? '4px 4px 4px 12px' : '4px 4px 4px 14px',
            transition: 'all 0.2s',
            boxShadow: focused ? '0 0 0 3px var(--primary-soft)' : 'none',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              disabled={loading}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: isMobile ? 15 : 13, color: 'var(--text)', caretColor: 'var(--primary)',
                lineHeight: 1.5, padding: isMobile ? '10px 0' : '7px 0',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: isMobile ? 40 : 36, height: isMobile ? 40 : 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: input.trim() && !loading
                  ? 'var(--gg)'
                  : 'rgba(0,0,0,0.05)',
                border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 0.18s',
                opacity: !input.trim() || loading ? 0.35 : 1,
                boxShadow: input.trim() && !loading ? '0 2px 12px rgba(16,185,129,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!user?.whiteLabelSettings?.hidePoweredBy && (
            <p style={{ fontSize: isMobile ? 9 : 10.5, textAlign: 'center', color: 'var(--text-muted)', margin: isMobile ? '5px 0 0' : '8px 0 0', letterSpacing: '0.025em' }}>
              Powered by {user?.whiteLabelSettings?.companyName || 'Autoniv AI'} · End-to-end encrypted
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}