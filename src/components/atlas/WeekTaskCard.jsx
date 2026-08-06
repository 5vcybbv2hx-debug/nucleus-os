import { getOrgMeta } from '@/lib/organizations';
import { Clock } from 'lucide-react';

export default function WeekTaskCard({ task, innerRef, draggableProps, dragHandleProps, isDragging }) {
  const org = getOrgMeta(task.organization);
  return (
    <div ref={innerRef} {...draggableProps} {...dragHandleProps}
      className={`p-2 bg-card border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${
        isDragging ? 'border-primary shadow-lg opacity-90' : 'border-border'
      }`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[10px]">{org.emoji}</span>
        <span className={`text-[9px] font-medium ${org.text}`}>{org.short}</span>
        {task.status === 'Zur Prüfung' && <span className="text-[9px] text-amber-400 ml-auto">Prüfung</span>}
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{task.title}</p>
      {task.estimated_duration > 0 && (
        <div className="flex items-center gap-0.5 mt-1 text-[10px] text-muted-foreground">
          <Clock size={9} /> {task.estimated_duration}min
        </div>
      )}
    </div>
  );
}