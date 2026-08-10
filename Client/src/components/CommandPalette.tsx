import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Create';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK = e.key?.toLowerCase() === 'k' || e.code === 'KeyK';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const handleCustomToggle = () => setOpen((prev) => !prev);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('toggle-command-palette', handleCustomToggle);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('toggle-command-palette', handleCustomToggle);
    };
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'nav-agents',
      title: 'Go to AI Voice Agents',
      category: 'Navigation',
      shortcut: '⌘1',
      icon: (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/ai-voice-agent');
        handleClose();
      },
    },
    {
      id: 'nav-chatbots',
      title: 'Go to AI Chatbots',
      category: 'Navigation',
      shortcut: '⌘2',
      icon: (
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/chatbots');
        handleClose();
      },
    },
    {
      id: 'nav-calls',
      title: 'Go to Call Logs & Analytics',
      category: 'Navigation',
      shortcut: '⌘3',
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/calls');
        handleClose();
      },
    },
    {
      id: 'nav-leads',
      title: 'Go to CRM Leads',
      category: 'Navigation',
      shortcut: '⌘4',
      icon: (
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/leads');
        handleClose();
      },
    },
    {
      id: 'nav-billing',
      title: 'Subscription & Plans',
      category: 'Navigation',
      shortcut: '⌘5',
      icon: (
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/billing');
        handleClose();
      },
    },
    {
      id: 'create-agent',
      title: 'Create Custom AI Voice Agent',
      category: 'Create',
      icon: (
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/ai-voice-agent/new-custom');
        handleClose();
      },
    },
    {
      id: 'create-chatbot',
      title: 'Build New AI Chatbot',
      category: 'Create',
      icon: (
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => {
        navigate('/dashboard/chatbots/new');
        handleClose();
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Glowing background ambient aura */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-purple-600/30 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={handleKeyDownModal}
            className="relative w-full max-w-xl bg-[#0F172A]/90 border border-slate-700/60 rounded-2xl shadow-2xl shadow-blue-900/30 backdrop-blur-2xl overflow-hidden z-10 ring-1 ring-white/10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-700/50 bg-slate-900/60">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mr-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, agents, chatbots, leads..."
                className="w-full text-sm text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none font-medium tracking-wide"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 rounded-md border border-slate-700/60 shrink-0">
                  ESC
                </kbd>
              )}
            </div>

            {/* Command Items List */}
            <div key={query} className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No matching commands found for <span className="text-blue-400 font-bold">"{query}"</span>
                </div>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-transparent border border-blue-500/40 text-white shadow-md shadow-blue-900/20 translate-x-0.5'
                          : 'text-slate-300 border border-transparent hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-inner'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
                        }`}>
                          {item.icon}
                        </div>
                        <span className="tracking-wide">{item.title}</span>
                      </div>

                      {item.shortcut && (
                        <kbd className={`px-2 py-1 text-[10px] font-mono font-extrabold rounded-md border transition-all ${
                          isSelected
                            ? 'bg-blue-500/30 text-blue-200 border-blue-400/50 shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                        }`}>
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Autoniv Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
