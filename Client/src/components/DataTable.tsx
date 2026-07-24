import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  card?: {
    label: string;
    render: (item: T) => React.ReactNode;
  };
  className?: string;
  headClassName?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  onRowClick?: (item: T) => void;
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  emptyState: {
    icon?: React.ReactNode;
    title: string;
    description: string;
  };
  pageSize?: number;
  keyExtractor: (item: T) => string;
  cardTitle?: (item: T) => string;
  cardBadge?: (item: T) => React.ReactNode;
  containerClass?: string;
  searchable?: boolean;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  exportable?: boolean;
  densityControls?: boolean;
  columnToggling?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

function SortIcon({ direction, active }: { direction: 'asc' | 'desc'; active: boolean }) {
  return (
    <span className="inline-flex flex-col ml-1.5 justify-center h-3 flex-shrink-0 gap-px">
      <svg className={`w-2.5 h-2.5 transition-all duration-150 ${active && direction === 'asc' ? 'text-[var(--primary-blue)]' : 'text-slate-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
      <svg className={`w-2.5 h-2.5 transition-all duration-150 ${active && direction === 'desc' ? 'text-[var(--primary-blue)]' : 'text-slate-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function Skeleton({ w = '60%', h = 'h-3.5', className = '' }: { w?: string; h?: string; className?: string }) {
  return (
    <div
      className={`${h} rounded-xl bg-gradient-to-r from-slate-200/60 via-slate-100/90 to-slate-200/60 animate-pulse ${className}`}
      style={{ width: w }}
    />
  );
}

function LoadingSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/40">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-4 text-left">
                <Skeleton w="72px" h="h-3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-slate-50/80 last:border-0 hover:bg-slate-50/30 transition-colors">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-5 py-4">
                  <Skeleton w={`${45 + Math.abs(Math.sin(c * 5 + r * 3)) * 40}%`} h="h-3.5" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4 bg-white/80 border border-slate-200/60 animate-pulse shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Skeleton w="45%" h="h-4.5" />
            <Skeleton w="25%" h="h-6" className="rounded-full" />
          </div>
          <Skeleton w="100%" h="h-3.5" />
          <Skeleton w="80%" h="h-3.5" />
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <Skeleton w="30%" h="h-3" />
            <Skeleton w="20%" h="h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col items-center justify-center py-24 text-center px-6"
    >
      <div className="relative group mb-6 flex-shrink-0">
        {/* Modern blur background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-15 group-hover:opacity-25 transition-all duration-300 scale-90 group-hover:scale-105" />
        
        {/* Core Icon Container */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 flex items-center justify-center shadow-md shadow-slate-100/50 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-300 group-hover:shadow-indigo-100/50">
          {icon ? (
            <div className="text-slate-500 transition-colors duration-200 group-hover:text-blue-600">
              {icon}
            </div>
          ) : (
            <svg className="w-8 h-8 text-slate-350 transition-colors duration-200 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Mobile card — shown instead of table rows on small screens
function MobileRow<T>({ item, columns, onRowClick, selectable, isSelected, onSelect }: {
  item: T;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const visible = columns.filter(c => c.key !== 'actions');
  const actions = columns.find(c => c.key === 'actions');
  const primary = visible[0];
  const rest = visible.slice(1);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${isSelected ? 'border-[var(--primary-blue)]/40 bg-blue-50/30 ring-1 ring-[var(--primary-blue)]/10' : 'border-slate-200/80 bg-white hover:border-slate-200 hover:shadow-md'}`}
    >
      {/* Row header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
        onClick={() => onRowClick ? onRowClick(item) : setOpen(o => !o)}
      >
        {selectable && (
          <div onClick={e => { e.stopPropagation(); onSelect(); }}>
            <input type="checkbox" checked={isSelected} onChange={onSelect}
              className="rounded border-slate-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20 cursor-pointer" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {primary && (
            <div className={`text-sm font-semibold text-slate-800 ${primary.className?.includes('whitespace-normal') ? 'whitespace-normal' : 'truncate'} ${primary.className || ''}`}>{primary.render(item)}</div>
          )}
          {rest[0] && (
            <div className={`text-xs text-slate-500 mt-0.5 ${rest[0].className?.includes('whitespace-normal') ? 'whitespace-normal' : 'truncate'} ${rest[0].className || ''}`}>{rest[0].render(item)}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions && <div onClick={e => e.stopPropagation()}>{actions.render(item)}</div>}
          {rest.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail rows */}
      <AnimatePresence>
        {open && rest.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-4 py-3 space-y-2.5 bg-slate-50/50">
              {rest.slice(1).map(col => (
                <div key={col.key} className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">{col.header}</span>
                  <div className="text-xs text-slate-600 font-medium text-right">{col.render(item)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  defaultSort,
  onRowClick,
  viewMode,
  onViewModeChange,
  emptyState,
  pageSize = 20,
  keyExtractor,
  cardTitle,
  cardBadge,
  containerClass,
  searchable = true,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search…',
  selectable = false,
  onSelectionChange,
  exportable = true,
  densityControls = true,
  columnToggling = true,
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.direction ?? 'asc');
  const [localSearch, setLocalSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key));
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [localPage, setLocalPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target as Node)) {
        setColumnsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setVisibleColumns(columns.map(c => c.key)); }, [columns]);

  const selectedItems = useMemo(() => data.filter(item => selectedKeys.has(keyExtractor(item))), [data, selectedKeys, keyExtractor]);
  useEffect(() => { onSelectionChange?.(selectedItems); }, [selectedItems, onSelectionChange]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    handlePageChange(1);
  };

  const filtered = useMemo(() => {
    const query = (searchTerm !== undefined ? searchTerm : localSearch).trim().toLowerCase();
    if (!query) return data;
    return data.filter(item => columns.some(col => {
      const val = item[col.key];
      return val != null && String(val).toLowerCase().includes(query);
    }));
  }, [data, searchTerm, localSearch, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const currentPage = pagination ? pagination.page : localPage;
  const currentLimit = pagination ? pagination.limit : pageSize;
  const totalItems = pagination ? pagination.total : sorted.length;
  const totalPages = pagination ? pagination.totalPages : Math.max(1, Math.ceil(totalItems / currentLimit));
  const hasPrev = pagination ? pagination.hasPrev : currentPage > 1;
  const hasNext = pagination ? pagination.hasNext : currentPage < totalPages;

  const pageData = useMemo(() => {
    if (pagination) return sorted;
    const start = (currentPage - 1) * currentLimit;
    return sorted.slice(start, start + currentLimit);
  }, [sorted, pagination, currentPage, currentLimit]);

  const handlePageChange = (p: number) => {
    if (pagination && onPageChange) onPageChange(p);
    else setLocalPage(p);
  };

  const handleSelectRow = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSelectAll = () => {
    const visibleKeys = pageData.map(keyExtractor);
    const allSelected = visibleKeys.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => {
      const next = new Set(prev);
      allSelected ? visibleKeys.forEach(k => next.delete(k)) : visibleKeys.forEach(k => next.add(k));
      return next;
    });
  };

  const handleExportCSV = (exportItems: T[] = sorted) => {
    const csvCols = columns.filter(col => col.key !== 'actions' && visibleColumns.includes(col.key));
    const headers = csvCols.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');
    const rows = exportItems.map(item =>
      csvCols.map(col => `"${String(item[col.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== -1) pages.push(-1);
    }
    return pages;
  };

  const paddingMap = { compact: 'py-2.5 px-5 text-xs', standard: 'py-4 px-5 text-sm', comfortable: 'py-5 px-5 text-base' };
  const isCardView = viewMode === 'cards';
  const renderedColumns = useMemo(() => columns.filter(col => visibleColumns.includes(col.key)), [columns, visibleColumns]);
  const hasData = data.length > 0;
  const hasResults = sorted.length > 0;
  const activeSearch = searchTerm !== undefined ? searchTerm : localSearch;

  return (
    <div className={`flex flex-col relative w-full ${containerClass || ''}`}>

      {/* Selection bulk banner */}
      <AnimatePresence>
        {selectedKeys.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--primary-blue)]/20 bg-blue-50/60 backdrop-blur-sm shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-blue)] text-white text-[10px] font-black flex items-center justify-center shadow-sm">{selectedKeys.size}</span>
              <span className="text-xs font-semibold text-slate-700">{selectedKeys.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExportCSV(selectedItems)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--primary-blue)] text-white hover:opacity-90 transition-opacity shadow-sm">
                Export ({selectedKeys.size})
              </button>
              <button onClick={() => setSelectedKeys(new Set())}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-white transition-colors">
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">

          {/* Row 1: Search + mobile filter toggle */}
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative flex-1 min-w-0">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={activeSearch}
                  onChange={e => { onSearchChange ? onSearchChange(e.target.value) : setLocalSearch(e.target.value); handlePageChange(1); }}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50/80 border border-slate-200/60 text-slate-700 placeholder-slate-400 outline-none focus:border-[var(--primary-blue)]/40 focus:ring-2 focus:ring-[var(--primary-blue)]/10 focus:bg-white transition-all duration-200"
                />
                {activeSearch && (
                  <button onClick={() => { onSearchChange ? onSearchChange('') : setLocalSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Mobile: filter toggle button */}
            {hasData && (
              <button
                onClick={() => setFiltersOpen(o => !o)}
                className={`sm:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${filtersOpen ? 'bg-[var(--primary-blue)] text-white border-transparent shadow-sm' : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Options
              </button>
            )}

            {/* Desktop toolbar controls */}
            {hasData && (
              <div className="hidden sm:flex items-center gap-2">
                <ToolbarControls
                  exportable={exportable}
                  densityControls={densityControls}
                  columnToggling={columnToggling}
                  isCardView={isCardView}
                  density={density}
                  setDensity={setDensity}
                  columnsMenuOpen={columnsMenuOpen}
                  setColumnsMenuOpen={setColumnsMenuOpen}
                  columnsMenuRef={columnsMenuRef}
                  columns={columns}
                  visibleColumns={visibleColumns}
                  setVisibleColumns={setVisibleColumns}
                  onViewModeChange={onViewModeChange}
                  handleExportCSV={handleExportCSV}
                />
              </div>
            )}
          </div>

          {/* Mobile expanded toolbar */}
          <AnimatePresence>
            {filtersOpen && hasData && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-2 pt-3 sm:hidden">
                  <ToolbarControls
                    exportable={exportable}
                    densityControls={densityControls}
                    columnToggling={columnToggling}
                    isCardView={isCardView}
                    density={density}
                    setDensity={setDensity}
                    columnsMenuOpen={columnsMenuOpen}
                    setColumnsMenuOpen={setColumnsMenuOpen}
                    columnsMenuRef={columnsMenuRef}
                    columns={columns}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                    onViewModeChange={onViewModeChange}
                    handleExportCSV={handleExportCSV}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading */}
        {loading && !hasData && (isCardView ? <CardSkeleton /> : <LoadingSkeleton columns={renderedColumns.length + (selectable ? 1 : 0)} />)}

        {/* Empty states */}
        {!loading && !hasData && <EmptyState {...emptyState} />}
        {!loading && hasData && !hasResults && (
          <EmptyState title="No results found" description={`No records match "${activeSearch}". Try a different search.`} />
        )}

        {/* ── Desktop Table view ── */}
        {!loading && hasData && hasResults && !isCardView && (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    {selectable && (
                      <th className="px-5 w-10 py-4 text-center">
                        <input type="checkbox"
                          checked={pageData.length > 0 && pageData.every(item => selectedKeys.has(keyExtractor(item)))}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20 cursor-pointer" />
                      </th>
                    )}
                    {renderedColumns.map(col => (
                      <th key={col.key}
                        className={`px-5 py-4 text-left ${col.sortable ? 'cursor-pointer hover:bg-slate-100/50 select-none transition-colors duration-150' : ''} ${col.headClassName || ''}`}
                        onClick={() => col.sortable && handleSort(col.key)}>
                        <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                          {col.header}
                          {col.sortable && <SortIcon direction={sortDir} active={sortKey === col.key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {pageData.map((item, i) => {
                      const itemKey = keyExtractor(item);
                      const isSelected = selectedKeys.has(itemKey);
                      return (
                        <motion.tr
                          key={itemKey}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.2, delay: i * 0.008, ease }}
                          onClick={() => onRowClick?.(item)}
                          className={`group border-b border-slate-50 last:border-0 transition-all duration-150 ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                        >
                          {selectable && (
                            <td className="px-5 text-center" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(itemKey)}
                                className="rounded border-slate-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20 cursor-pointer" />
                            </td>
                          )}
                          {renderedColumns.map(col => (
                            <td key={col.key} className={`${paddingMap[density]} whitespace-nowrap text-sm text-slate-600 font-medium ${col.className || ''}`}>
                              {col.render(item)}
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* ── Mobile list view ── */}
            <div className="sm:hidden p-3 space-y-2">
              <AnimatePresence>
                {pageData.map((item, i) => {
                  const itemKey = keyExtractor(item);
                  return (
                    <motion.div key={itemKey}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.01, ease }}>
                      <MobileRow
                        item={item}
                        columns={renderedColumns}
                        onRowClick={onRowClick}
                        selectable={selectable}
                        isSelected={selectedKeys.has(itemKey)}
                        onSelect={() => handleSelectRow(itemKey)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              currentLimit={currentLimit}
              hasPrev={hasPrev}
              hasNext={hasNext}
              getPageNumbers={getPageNumbers}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Card view */}
        {!loading && hasData && hasResults && isCardView && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              <AnimatePresence mode="popLayout">
                {pageData.map((item, i) => {
                  const itemKey = keyExtractor(item);
                  const isSelected = selectedKeys.has(itemKey);
                  return (
                    <motion.div
                      key={itemKey}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.25, delay: i * 0.01, ease }}
                      onClick={() => onRowClick?.(item)}
                      className={`relative rounded-2xl border p-5 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${isSelected ? 'border-[var(--primary-blue)]/40 bg-blue-50/30 ring-1 ring-[var(--primary-blue)]/10 shadow-sm' : 'border-slate-200/80 bg-white hover:border-slate-200'}`}
                    >
                      <div className="absolute left-0 top-5 bottom-5 w-0.5 rounded-r-full bg-slate-100 group-hover:bg-[var(--primary-blue)]/40 transition-colors duration-200" />
                      {selectable && (
                        <div className="absolute right-4 top-4 z-10" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleSelectRow(itemKey)}
                            className="rounded border-slate-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20 cursor-pointer" />
                        </div>
                      )}
                      {(cardTitle || cardBadge) && (
                        <div className="flex items-start justify-between mb-3 pl-2 pr-6">
                          {cardTitle && <h4 className="text-sm font-bold text-slate-800 group-hover:text-[var(--primary-blue)] transition-colors leading-snug">{cardTitle(item)}</h4>}
                          {cardBadge && !isSelected && <div className="shrink-0 ml-2">{cardBadge(item)}</div>}
                        </div>
                      )}
                      <div className="space-y-2.5 pl-2">
                        {columns.filter(c => c.card && visibleColumns.includes(c.key)).map(col => (
                          <div key={col.key} className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">{col.card!.label}</span>
                            <div className="text-xs text-slate-600 font-semibold leading-snug">{col.card!.render(item)}</div>
                          </div>
                        ))}
                        {!columns.some(c => c.card) && columns.filter(c => visibleColumns.includes(c.key)).map(col => (
                          <div key={col.key} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">{col.header}</span>
                            <span className="text-xs text-slate-600 font-semibold text-right truncate ml-2">{col.render(item)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              currentLimit={currentLimit}
              hasPrev={hasPrev}
              hasNext={hasNext}
              getPageNumbers={getPageNumbers}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, totalItems, currentLimit, hasPrev, hasNext, getPageNumbers, onPageChange }: {
  currentPage: number; totalPages: number; totalItems: number; currentLimit: number;
  hasPrev: boolean; hasNext: boolean; getPageNumbers: () => number[];
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = Math.min(totalItems, (currentPage - 1) * currentLimit + 1);
  const to = Math.min(currentPage * currentLimit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
      <p className="text-xs text-slate-400 font-medium order-2 sm:order-1">
        <span className="font-bold text-slate-600">{from}–{to}</span> of <span className="font-bold text-slate-600">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <PaginationBtn onClick={() => onPageChange(currentPage - 1)} disabled={!hasPrev}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </PaginationBtn>
        {getPageNumbers().map((p, idx) =>
          p === -1
            ? <span key={`e${idx}`} className="w-8 text-center text-slate-300 text-xs">…</span>
            : <PaginationBtn key={p} active={currentPage === p} onClick={() => onPageChange(p)}>{p}</PaginationBtn>
        )}
        <PaginationBtn onClick={() => onPageChange(currentPage + 1)} disabled={!hasNext}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </PaginationBtn>
      </div>
    </div>
  );
}

function PaginationBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[34px] h-8 px-2 rounded-lg text-xs font-bold flex items-center justify-center border transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
        active ? 'bg-[var(--primary-blue)] border-[var(--primary-blue)] text-white shadow-sm shadow-[var(--primary-blue)]/20'
               : 'bg-white border-slate-200/80 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-200'
      }`}>
      {children}
    </button>
  );
}

function ToolbarControls({ exportable, densityControls, columnToggling, isCardView, density, setDensity, columnsMenuOpen, setColumnsMenuOpen, columnsMenuRef, columns, visibleColumns, setVisibleColumns, onViewModeChange, handleExportCSV }: any) {
  return (
    <>
      {exportable && (
        <button onClick={() => handleExportCSV()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 bg-white rounded-xl text-xs font-semibold text-slate-600 transition-all duration-150 shadow-sm cursor-pointer whitespace-nowrap">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          CSV
        </button>
      )}
      {densityControls && !isCardView && (
        <div className="flex items-center bg-slate-100/70 rounded-xl p-0.5 border border-slate-200/60">
          {(['compact', 'standard', 'comfortable'] as const).map(mode => (
            <button key={mode} onClick={() => setDensity(mode)}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold capitalize transition-all duration-150 whitespace-nowrap ${density === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {mode === 'comfortable' ? 'Cozy' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      )}
      {columnToggling && (
        <div className="relative" ref={columnsMenuRef}>
          <button onClick={() => setColumnsMenuOpen((o: boolean) => !o)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border bg-white rounded-xl text-xs font-semibold text-slate-600 transition-all duration-150 shadow-sm cursor-pointer whitespace-nowrap ${columnsMenuOpen ? 'border-[var(--primary-blue)] text-[var(--primary-blue)]' : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Cols
          </button>
          <AnimatePresence>
            {columnsMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-slate-200 p-3 shadow-xl z-40 space-y-1 max-h-60 overflow-y-auto"
              >
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1.5">Columns</p>
                {columns.map((col: Column<any>) => {
                  const isVis = visibleColumns.includes(col.key);
                  return (
                    <label key={col.key} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isVis ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50/50'}`}>
                      <input type="checkbox" checked={isVis}
                        disabled={columns.filter((c: Column<any>) => visibleColumns.includes(c.key)).length === 1 && isVis}
                        onChange={() => setVisibleColumns((prev: string[]) => prev.includes(col.key) ? prev.filter((k: string) => k !== col.key) : [...prev, col.key])}
                        className="rounded border-slate-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]/20" />
                      {col.header || <span className="italic text-slate-400">Actions</span>}
                    </label>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {onViewModeChange && (
        <div className="flex items-center gap-0.5 bg-slate-100/70 rounded-xl p-0.5 border border-slate-200/60">
          {([
            { mode: 'table', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" /> },
            { mode: 'cards', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /> },
          ] as const).map(({ mode, icon }) => (
            <button key={mode} onClick={() => onViewModeChange(mode as 'table' | 'cards')}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${(mode === 'table') !== isCardView ? 'bg-[var(--primary-blue)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>{icon}</svg>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
