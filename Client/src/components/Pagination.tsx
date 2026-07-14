import { motion } from 'framer-motion';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { total, page, limit, totalPages, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-6 py-4.5 border-t border-[var(--slate-border)] bg-slate-50/10"
    >
      <p className="text-xs text-[var(--text-muted)] font-semibold">
        Showing <span className="text-[var(--text-secondary)] font-bold">{from}</span>–<span className="text-[var(--text-secondary)] font-bold">{to}</span> of <span className="text-[var(--text-secondary)] font-bold">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-slate-100 border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center bg-white shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-slate-400 px-1.5 font-bold select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center border active:scale-95 ${
                p === page
                  ? 'bg-[var(--primary-blue)] border-[var(--primary-blue)] text-white shadow-md shadow-blue-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-slate-50 border-slate-100 bg-white'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-slate-50 border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center bg-white shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
