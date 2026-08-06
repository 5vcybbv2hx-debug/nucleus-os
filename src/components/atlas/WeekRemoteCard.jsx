import { getOrgMeta } from '@/lib/organizations';
import { Lock, Copy, Check } from 'lucide-react';

export default function WeekRemoteCard({ insight, onCopy, copying }) {
  const org = getOrgMeta(insight.organization);
  const sourceLabel = insight.source_system || org.short || 'REMOTE';
  const cleanTitle = insight.title.replace(/^(Sandra:|SAVO:)\s*/i, '');
  const cardId = insight.id || insight.external_reference;

  return (
    <div className="p-2 bg-secondary/40 border border-border/50 rounded-lg">
      <div className="flex items-center gap-1 mb-0.5">
        <Lock size={9} className="text-muted-foreground/60" />
        <span className={`text-[9px] font-medium ${org.text}`}>{sourceLabel}</span>
        {insight.severity === 'critical' && <span className="text-[9px] text-red-400 ml-auto">!</span>}
        {insight.severity === 'high' && <span className="text-[9px] text-amber-400 ml-auto">!</span>}
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{cleanTitle}</p>
      {insight.summary && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{insight.summary}</p>}
      <button
        onClick={() => onCopy(insight)}
        disabled={copying}
        className="mt-1 text-[10px] flex items-center gap-0.5 text-primary hover:underline disabled:opacity-50"
      >
        {copying ? <Check size={10} /> : <Copy size={10} />}
        {copying ? 'Kopiert' : 'In Atlas kopieren'}
      </button>
    </div>
  );
}