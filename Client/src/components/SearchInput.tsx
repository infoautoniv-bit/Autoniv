import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
  size = 'md',
  autoFocus = false,
  disabled = false,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounced = useDebounce(local, debounceMs);

  useEffect(() => {
    const handle = setTimeout(() => setLocal(value), 0);
    return () => clearTimeout(handle);
  }, [value]);

  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced);
    }
  }, [debounced, onChange, value]);

  const handleClear = useCallback(() => {
    setLocal('');
    onChange('');
  }, [onChange]);

  const sizeClasses = {
    sm: 'pl-8 pr-7 py-2 text-xs',
    md: 'pl-9 pr-8 py-2.5 text-sm',
    lg: 'pl-10 pr-9 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const clearSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Search Icon */}
      <svg 
        className={`absolute ml-3 top-1/2 -translate-y-1/2 ${iconSizes[size]} text-gray-400 pointer-events-none transition-colors ${
          isFocused ? 'text-blue-500' : 'text-gray-400'
        }`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>

      {/* Input */}
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full ${sizeClasses[size]} rounded-xl border transition-all duration-200 bg-[var(--surface)] text-gray-700 placeholder-gray-400 outline-none
          ${isFocused 
            ? 'border-blue-400 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]' 
            : 'border-gray-200 hover:border-gray-300'
          }
          ${disabled 
            ? 'bg-gray-50 cursor-not-allowed opacity-60' 
            : 'hover:border-gray-300'
          }
        `}
        style={{
          boxShadow: isFocused ? '0 0 0 3px rgba(37,99,235,0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
        }}
      />

      {/* Clear button */}
      <AnimatePresence>
        {local && !disabled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Clear search"
          >
            <svg className={clearSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
     
    </motion.div>
  );
}