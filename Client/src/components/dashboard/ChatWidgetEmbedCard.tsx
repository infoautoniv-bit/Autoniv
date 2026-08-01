import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChatWidgetEmbedCardProps {
  fadeUp?: any;
  apiKeyLoading: boolean;
  hasApiKey: boolean;
  widgetApiKey: string | null;
  apiBaseUrl: string;
  onGenerateKey: () => void;
  onOpenRegenerateConfirm: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ChatWidgetEmbedCard: React.FC<ChatWidgetEmbedCardProps> = ({
  fadeUp,
  apiKeyLoading,
  hasApiKey,
  widgetApiKey,
  apiBaseUrl,
  onGenerateKey,
  onOpenRegenerateConfirm,
  addToast,
}) => {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-md"
      style={{ borderColor: 'var(--slate-border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CHAT WIDGET</p>
          <h2 className="text-sm font-extrabold text-slate-800 mt-0.5">Embed Chat on Your Website</h2>
        </div>
        <Link
          to="/dashboard/ai-chatbot"
          className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-blue)] hover:text-[var(--primary-blue-dark)] transition-colors"
        >
          Open Chat →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Embed Code</p>

        {apiKeyLoading ? (
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-500 overflow-x-auto">
            Loading API key...
          </div>
        ) : !hasApiKey && !widgetApiKey ? (
          <div className="space-y-3">
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-slate-500 overflow-x-auto">
              No API key generated yet.
            </div>
            <button
              onClick={onGenerateKey}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none shadow-sm"
            >
              Generate API Key
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {widgetApiKey && !widgetApiKey.startsWith('ak_••••') && (
              <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-3.5 text-xs font-bold text-amber-950 flex items-center gap-2.5 shadow-sm">
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
                  Important
                </span>
                <span className="text-amber-950 font-black">
                  Save this key now. It won't be shown again after you leave this page.
                </span>
              </div>
            )}
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto">
              <code>{`<script src="${apiBaseUrl}/widget/widget.js"\n  data-api-key="${widgetApiKey}"\n  data-position="bottom-right">\n</script>`}</code>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const scriptUrl = `${apiBaseUrl}/widget/widget.js`;
                  navigator.clipboard.writeText(
                    `<script src="${scriptUrl}" data-api-key="${widgetApiKey}" data-position="bottom-right"></script>`
                  );
                  addToast('Embed code copied to clipboard', 'success');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-all cursor-pointer border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Copy Code
              </button>
              {widgetApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(widgetApiKey);
                    addToast('API key copied to clipboard', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer border border-slate-300/60 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Copy Key
                </button>
              )}
              <button
                type="button"
                onClick={onOpenRegenerateConfirm}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Regenerate Key
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Add this to your website's &lt;head&gt; tag
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
