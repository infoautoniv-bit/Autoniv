// components/Modal.tsx — Premium Dark Glass Modal
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={onClose}>
        {/* ── Backdrop ── */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-[0.97] translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-[0.97] translate-y-4"
            >
              <Dialog.Panel
                className={`modal-panel w-full ${sizes[size]} transform overflow-hidden rounded-2xl border transition-all relative`}
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'linear-gradient(170deg, #0c1222 0%, #060a14 40%, #080e18 100%)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03), 0 0 60px rgba(16,185,129,0.04)',
                }}
              >
                {/* ── Ambient glow orbs ── */}
                <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-40"
                  style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06), transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-20 -left-12 w-56 h-56 rounded-full opacity-40"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)' }} />

                {/* ── Header ── */}
                <div
                  className="flex items-center justify-between p-5 sm:p-6 relative z-10"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Dialog.Title className="text-base sm:text-lg font-semibold tracking-tight text-white/90">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="modal-close-btn p-1.5 rounded-lg transition-all duration-200
                               text-white/30 hover:text-white/80
                               bg-white/[0.03] hover:bg-white/[0.06]
                               border border-white/[0.06] hover:border-white/[0.12]
                               hover:scale-105 active:scale-95"
                  >
                    <XMarkIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* ── Body ── */}
                <div className="p-5 sm:p-6 max-h-[85vh] overflow-y-auto relative z-10 custom-scrollbar">
                  <div style={{ color: '#cbd5e1' }}>
                    {children}
                  </div>
                </div>

                {/* ── Footer ── */}
                {footer && (
                  <div
                    className="flex justify-end gap-2.5 p-5 sm:p-6 relative z-10"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(255,255,255,0.015)',
                    }}
                  >
                    {footer}
                  </div>
                )}
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 99px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.3);
                  }
                `}</style>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Styled Modal Buttons ─────────────────────────────────────────────────────
export function ModalButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: any;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold tracking-wide cursor-pointer transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none';

  const variants: Record<string, string> = {
    primary:
      'text-white border-0 hover:-translate-y-0.5',
    secondary:
      'text-white/60 hover:text-white/90 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.14]',
    danger:
      'text-rose-400 bg-rose-500/[0.08] hover:bg-rose-500/[0.14] border border-rose-500/20 hover:border-rose-500/30',
  };

  const primaryStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, #2563EB, #10B981)',
          boxShadow: '0 4px 20px rgba(16,185,129,0.20), inset 0 1px 0 rgba(255,255,255,0.12)',
        }
      : {};

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
      style={primaryStyle}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.30), inset 0 1px 0 rgba(255,255,255,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.20), inset 0 1px 0 rgba(255,255,255,0.12)';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}