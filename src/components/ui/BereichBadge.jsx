import { BEREICHE } from '@/lib/constants';

export default function BereichBadge({ bereich, small = false }) {
  const config = BEREICHE[bereich] || { label: bereich, color: 'text-gray-400', bg: 'bg-gray-400/10' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.color} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <span className={`rounded-full ${config.dot} ${small ? 'w-1 h-1' : 'w-1.5 h-1.5'}`} />
      {config.label}
    </span>
  );
}