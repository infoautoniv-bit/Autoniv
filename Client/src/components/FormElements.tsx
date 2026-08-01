import { useState, useRef, useEffect } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const inputId = props.id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <input
        id={inputId}
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
      {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];
  const selectId = label ? label.toLowerCase().replace(/\s+/g, '-') : undefined;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick, { passive: true });
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(options.findIndex(o => o.value === value));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) {
          const synthetic = { target: { value: options[activeIndex].value } } as React.ChangeEvent<HTMLSelectElement>;
          onChange?.(synthetic);
          setOpen(false);
        }
        break;
      case 'Escape':
        setOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          ref={buttonRef}
          id={selectId}
          type="button"
          onClick={() => setOpen(!open)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label || 'Select option'}
          aria-invalid={!!error}
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
          <div ref={listRef} role="listbox" aria-label={label || 'Select option'} className="absolute z-50 mt-1 w-full border rounded-xl shadow-2xl overflow-hidden custom-scrollbar"
               style={{
                 backgroundColor: '#0f1725',
                 borderColor: 'rgba(255, 255, 255, 0.1)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
               }}>
            <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
              {options.map((opt, index) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => {
                    const synthetic = { target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>;
                    onChange?.(synthetic);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    index === activeIndex ? 'bg-white/10 text-white' : ''
                  }`}
                  style={{
                    backgroundColor: opt.value === value ? 'rgba(6, 182, 212, 0.1)' : index === activeIndex ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    color: opt.value === value ? '#22d3ee' : index === activeIndex ? 'white' : '#8bb4e0',
                    fontWeight: opt.value === value ? '500' : 'normal'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  const textareaId = props.id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${className}`}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          borderColor: error ? '#f43f5e' : 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          caretColor: '#0077ff'
        }}
        {...props}
      />
      {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
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

  const hoverClasses: Record<string, string> = {
    primary: 'hover:-translate-y-0.5 hover:shadow-lg',
    secondary: 'hover:-translate-y-0.5 hover:bg-slate-600 hover:text-white',
    danger: 'hover:-translate-y-0.5 hover:bg-rose-500 hover:text-white',
    ghost: 'hover:-translate-y-0.5 hover:bg-white/5 hover:text-white',
  };

  return (
    <button
      className={`${variant === 'primary' ? 'btn-cta' : ''} px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${hoverClasses[variant]} ${className}`}
      style={{
        background: styles.background as string,
        backgroundColor: styles.backgroundColor as string,
        color: styles.color,
        border: styles.border,
        boxShadow: styles.boxShadow as string
      }}
      {...props}
    >
      {children}
    </button>
  );
}