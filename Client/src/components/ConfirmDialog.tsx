import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const variants = {
  danger: {
    icon: 'text-[var(--red)]500',
    bg: 'bg-[var(--red)]/10',
    border: 'border-rose-500/20',
    button: 'bg-[var(--red)] hover:bg-rose-600 text-white',
  },
  warning: {
    icon: 'text-[var(--amber)]500',
    bg: 'bg-[var(--amber)]/10',
    border: 'border-amber-500/20',
    button: 'bg-[var(--amber)] hover:bg-amber-600 text-white',
  },
  info: {
    icon: 'text-[var(--cyan)]500',
    bg: 'bg-[var(--cyan)]/10',
    border: 'border-[var(--border)]',
    button: 'bg-[var(--cyan)] hover-bg-[var(--primary)] text-white',
  },
};

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  const v = variants[variant];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border shadow-xl transition-all"
                style={{
                  backgroundColor: 'var(--s1)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}>
                <div className="flex items-center justify-between p-4 sm:p-5" style={{
                  borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                  borderBottomWidth: '1px'
                }}>
                  <Dialog.Title className="text-base sm:text-lg font-semibold text-white">
                    {title}
                  </Dialog.Title>
                  <button onClick={onClose} disabled={loading}
                    className="p-1 rounded-lg transition-colors disabled:opacity-40"
                    style={{ color: 'var(--slate-gray)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--slate-gray)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0`}
                         style={{
                           backgroundColor: v.bg.includes('rose') ? 'rgba(244, 63, 94, 0.1)' :
                                           v.bg.includes('amber') ? 'rgba(255, 228, 132, 0.1)' :
                                           'rgba(6, 182, 212, 0.1)',
                           borderColor: v.border.includes('rose') ? 'rgba(244, 63, 94, 0.2)' :
                                       v.border.includes('amber') ? 'rgba(255, 228, 132, 0.2)' :
                                       'rgba(6, 182, 212, 0.2)'
                         }}>
                      <ExclamationTriangleIcon className={`w-5 h-5 ${v.icon}`} />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-4 sm:p-5" style={{
                  borderTopColor: 'rgba(255, 255, 255, 0.1)',
                  borderTopWidth: '1px',
                  backgroundColor: 'var(--bg)'
                }}>
                  <button onClick={onClose} disabled={loading}
                    className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ color: 'var(--slate-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--slate-light)'}>
                    {cancelLabel}
                  </button>
                  <button onClick={onConfirm} disabled={loading}
                    className={`px-5 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${v.button} ${variant === 'info' ? 'btn-cta' : ''}`}>
                    {loading && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
