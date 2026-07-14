import { AnimatePresence, motion } from 'framer-motion';
import type { Toast } from '../hooks/useToast';

const spring = { type: 'spring', stiffness: 380, damping: 30 } as const;

const TOAST_COLORS = {
  success: { bg: '#10B981', border: 'rgba(16,185,129,0.3)' },
  error: { bg: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  warning: { bg: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  info: { bg: '#2563eb', border: 'rgba(37,99,235,0.3)' },
};

interface ToastContainerProps {
  toasts: Toast[];
  remove: (id: number) => void;
}

export function ToastContainer({ toasts, remove }: ToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const colors = TOAST_COLORS[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.88 }}
              transition={spring}
              onClick={() => remove(t.id)}
              className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border cursor-pointer select-none shadow-md backdrop-blur-md bg-white/95"
              style={{
                borderColor: colors.border,
                boxShadow: `0 8px 32px rgba(37,99,235,0.06), 0 0 0 1px ${colors.border}`,
              }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.bg }} />
              <span className="text-xs font-semibold text-slate-700">{t.message}</span>
              {t.action && (
                <button
                  onClick={(e) => { e.stopPropagation(); t.action!.onClick(); remove(t.id); }}
                  className="ml-2 px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
