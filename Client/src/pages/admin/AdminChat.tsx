import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { chatService } from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  type?: 'success' | 'error' | 'info';
  timestamp: Date;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

const suggestedPrompts = [
  'help',
  'list users',
  'list agents',
  'create user name "Jane Doe" email jane@test.com password pass123 company "Acme"',
  'create agent name "SalesBot" type receptionist',
];

function getTypeStyles(type?: string) {
  switch (type) {
    case 'success': return 'border-l-emerald-500 bg-emerald-50/50';
    case 'error': return 'border-l-rose-500 bg-rose-50/50';
    case 'info': return 'border-l-[var(--primary-blue)] bg-blue-50/50';
    default: return 'border-l-gray-300 bg-gray-50/50';
  }
}

function formatResponse(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-[var(--text)] font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: `🤖 Hello! I'm your admin assistant. I can help you manage users and agents.\n\nType \`help\` to see what I can do, or try one of the suggestions below.`,
      type: 'info',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const now = Date.now();
    const userMsg: ChatMessage = {
      id: `user-${now}`,
      role: 'user',
      text: msg,
      timestamp: new Date(now),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.send(msg);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: res.data.response,
        type: res.data.type,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: 'Sorry, something went wrong. Please try again.',
        type: 'error',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="h-full flex flex-col pb-2">
      <motion.div variants={fadeUp} initial="initial" animate="animate" className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5 mb-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text)]/50 mb-1">Chat</p>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[var(--text)] leading-none">Admin Assistant</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--text)]/50">Manage users and agents via natural language</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--slate-border)] rounded-2xl overflow-hidden shadow-sm shadow-indigo-100/10">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-blue-dark)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm shadow-[var(--primary-blue)]/20'
                      : `border-l-2 ${getTypeStyles(msg.type)} rounded-2xl px-4 py-2.5`
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="text-sm text-[var(--text)]/80 leading-relaxed whitespace-pre-wrap">
                      {formatResponse(msg.text)}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="border-l-2 border-l-gray-300 bg-gray-50/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-2 text-xs font-medium text-[var(--primary)] bg-[var(--primary-soft)]/10 border border-[var(--border)] rounded-lg hover:bg-[var(--primary-soft)]/20 transition-colors min-h-[36px]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 sm:p-4 border-t border-[var(--slate-border)] bg-gray-50/20">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command... (Enter to send)"
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-[var(--text)] placeholder-gray-400 focus:outline-none focus:border-[var(--primary-blue)] focus:ring-1 focus:ring-[var(--primary-blue)]/20 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-cta p-2.5 text-white rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}