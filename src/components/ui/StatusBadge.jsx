import { DOC_STATUS, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';

export function DocStatusBadge({ status }) {
  const config = DOC_STATUS[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-400/10' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

export function TaskStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-400/10' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || { label: priority, color: 'text-gray-400', bg: 'bg-gray-400/10', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${config.bg} ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}