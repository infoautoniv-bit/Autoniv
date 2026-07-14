interface ShortcutHintProps {
  keys: string[];
  className?: string;
}

export function ShortcutHint({ keys, className = '' }: ShortcutHintProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.map((k, i) => (
        <span key={i} className="px-1 py-0.5 text-[9px] font-medium rounded border leading-none"
          style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--slate-gray)' }}>
          {k}
        </span>
      ))}
    </span>
  );
}
