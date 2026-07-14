import type { Lead } from '../types';

interface LeadRowProps {
  lead: Lead;
  onEdit?: (lead: Lead) => void;
}

export function LeadRow({ lead, onEdit }: LeadRowProps) {
  return (
    <tr className="hover:bg-[var(--surface)] transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--indigo)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold text-sm">
            {(lead.name || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{lead.name || '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm text-[var(--slate-light)]">{lead.phone || '-'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--slate-light)]">{lead.email || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        {lead.purpose && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-light)] text-sm">
            {lead.purpose}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center gap-2 text-sm text-[var(--slate-gray)]">
          <span className="w-2 h-2 rounded-full bg-[#6366f1]"/>
          {lead.agentName || '-'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--slate-gray)]">
        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
      </td>
      {onEdit && (
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <button
            onClick={() => onEdit(lead)}
            className="text-sm text-[var(--indigo)] hover:text-[#818cf8] transition-colors font-medium"
          >
            Edit
          </button>
        </td>
      )}
    </tr>
  );
}