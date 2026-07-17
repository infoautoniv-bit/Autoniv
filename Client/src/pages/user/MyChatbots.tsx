import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { chatbotService } from '../../services/api';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

interface Chatbot {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  conversationCount: number;
  channels: {
    whatsapp: { enabled: boolean; phoneNumberId: string | null };
    widget: { enabled: boolean };
  };
  createdAt: string;
}

export function MyChatbots() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChatbots();
  }, []);

  async function loadChatbots() {
    try {
      const { data } = await chatbotService.list();
      setChatbots(data.chatbots || []);
    } catch (err: any) {
      setError('Failed to load chatbots');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await chatbotService.delete(id);
      setChatbots(prev => prev.filter(c => c._id !== id));
    } catch {
      alert('Failed to delete chatbot');
    }
  }

  async function handleToggle(id: string, current: boolean) {
    try {
      await chatbotService.update(id, { isActive: !current });
      setChatbots(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c));
    } catch {
      alert('Failed to update chatbot');
    }
  }

  function copyEmbedCode(id: string) {
    const code = `<script src="${window.location.origin}/api/chatbot-widget/widget.js" data-chatbot-id="${id}"></script>`;
    navigator.clipboard.writeText(code).then(() => alert('Embed code copied!'));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">My Chatbots</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create and manage AI chatbots for WhatsApp and your website.</p>
        </div>
        <Link
          to="/dashboard/chatbots/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          + New Chatbot
        </Link>
      </motion.div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {chatbots.length === 0 ? (
        <motion.div {...fadeUp} className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-lg font-bold text-[var(--text)] mb-2">No chatbots yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Create your first chatbot to start engaging customers on WhatsApp and your website.</p>
          <Link
            to="/dashboard/chatbots/new"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            Create Chatbot
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map((chatbot, i) => (
            <motion.div
              key={chatbot._id}
              {...fadeUp}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[var(--text)] truncate">{chatbot.name}</h3>
                  {chatbot.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{chatbot.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(chatbot._id, chatbot.isActive)}
                  className={`ml-2 w-9 h-5 rounded-full transition-colors flex-shrink-0 ${chatbot.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  title={chatbot.isActive ? 'Deactivate' : 'Activate'}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${chatbot.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex-1 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className={`w-2 h-2 rounded-full ${chatbot.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {chatbot.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span title="WhatsApp">
                    {chatbot.channels?.whatsapp?.enabled ? '📱 WhatsApp ON' : '📱 WhatsApp OFF'}
                  </span>
                  <span title="Widget">
                    {chatbot.channels?.widget?.enabled ? '🌐 Widget ON' : '🌐 Widget OFF'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {chatbot.conversationCount} conversations
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/dashboard/chatbots/${chatbot._id}`}
                  className="flex-1 text-center py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--s1)] transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => copyEmbedCode(chatbot._id)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--s1)] transition-colors"
                  title="Copy embed code"
                >
                  Embed
                </button>
                <button
                  onClick={() => handleDelete(chatbot._id, chatbot.name)}
                  className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
