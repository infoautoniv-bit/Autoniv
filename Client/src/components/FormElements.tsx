import { useState, useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${className}`}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderColor: error ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
          outlineColor: '#0077ff',
          color: 'white',
          caretColor: '#0077ff'
        }}
        {...props}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', value, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${className}`}
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderColor: error ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
            outlineColor: '#0077ff'
          }}
        >
          <span className="truncate">{selected?.label || 'Select...'}</span>
          <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8bb4e0' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full border rounded-xl shadow-2xl overflow-hidden custom-scrollbar"
               style={{
                 backgroundColor: '#0f1725',
                 borderColor: 'rgba(255, 255, 255, 0.1)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
               }}>
            <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const synthetic = { target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>;
                    onChange?.(synthetic);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors`}
                  style={{
                    backgroundColor: opt.value === value ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    color: opt.value === value ? '#22d3ee' : '#8bb4e0',
                    fontWeight: opt.value === value ? '500' : 'normal'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = opt.value === value ? 'rgba(6, 182, 212, 0.1)' : 'transparent';
                    e.currentTarget.style.color = opt.value === value ? '#22d3ee' : '#8bb4e0';
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${className}`}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderColor: error ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          caretColor: '#0077ff'
        }}
        {...props}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const getStyles = () => {
    switch(variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #0077ff, #005fe6)',
          color: '#ffffff',
          boxShadow: '0 8px 16px rgba(0, 119, 255, 0.25)',
          hoverBackground: 'linear-gradient(135deg, #3389ff, #0077ff)',
          border: 'none'
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          color: '#8bb4e0',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          hoverBackground: 'rgba(30, 41, 59, 1)',
          hoverColor: '#ecf9ff'
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          color: '#f43f5e',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          hoverBackground: '#f43f5e',
          hoverColor: '#ffffff'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#8bb4e0',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          hoverBackground: 'rgba(255, 255, 255, 0.05)',
          hoverColor: '#ecf9ff'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #0077ff, #005fe6)',
          color: '#ffffff',
          boxShadow: '0 8px 16px rgba(0, 119, 255, 0.25)',
          hoverBackground: 'linear-gradient(135deg, #3389ff, #0077ff)',
          border: 'none'
        };
    }
  };

  const styles = getStyles();

  return (
    <button
      className={`${variant === 'primary' ? 'btn-cta' : ''} px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: styles.background as string,
        backgroundColor: styles.backgroundColor as string,
        color: styles.color,
        border: styles.border,
        boxShadow: styles.boxShadow as string
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.background = styles.hoverBackground as string;
          e.currentTarget.style.transform = 'translateY(-1px)';
        } else if (variant === 'secondary' || variant === 'ghost') {
          if (styles.hoverBackground) {
            e.currentTarget.style.backgroundColor = styles.hoverBackground;
          }
          if (styles.hoverColor) {
            e.currentTarget.style.color = styles.hoverColor;
          }
          e.currentTarget.style.transform = 'translateY(-1px)';
        } else if (variant === 'danger') {
          if (styles.hoverBackground) {
            e.currentTarget.style.backgroundColor = styles.hoverBackground;
          }
          if (styles.hoverColor) {
            e.currentTarget.style.color = styles.hoverColor;
          }
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.background = styles.background as string;
          e.currentTarget.style.transform = 'translateY(0)';
        } else if (variant === 'secondary' || variant === 'ghost') {
          if (styles.backgroundColor) {
            e.currentTarget.style.backgroundColor = styles.backgroundColor;
          }
          e.currentTarget.style.color = styles.color;
          e.currentTarget.style.transform = 'translateY(0)';
        } else if (variant === 'danger') {
          if (styles.backgroundColor) {
            e.currentTarget.style.backgroundColor = styles.backgroundColor;
          }
          e.currentTarget.style.color = styles.color;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}