import { motion } from 'framer-motion';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { getOrgMeta, TASK_STATUS_LABELS, getDueDate } from '@/lib/organizations';

export default function TaskCard({ task, onComplete, compact }) {
  const org = getOrgMeta(task.organization);
  const due = getDueDate(task);
  let dueLabel = null, dueUrgent = false;
  if (due) {
    const d = parseISO(due);
    const days = differenceInCalendarDays(d, new Date());
    dueLabel = days === 0 ? 'Heute' : days === 1 ? 'Morgen' : days < 0 ? `${Math.abs(days)} Tage überfällig` : `in ${days} Tagen`;
    dueUrgent = days <= 2;
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative p-3.5 bg-card border border-border rounded-2xl ${compact ? '' : 'mb-2'}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete?.(task)}
          className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-border hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center justify-center"
          aria-label="Erledigen"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${org.chip}`}>
              <span>{org.emoji}</span>
              <span>{org.short}</span>
            </span>
            {task.work_type && (
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{task.work_type}</span>
            )}
            {dueLabel && (
              <span className={`text-[11px] inline-flex items-center gap-0.5 ${dueUrgent ? 'text-red-400' : 'text-muted-foreground'}`}>
                <Clock size={11} /> {dueLabel}
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-foreground leading-snug">{task.title}</div>
          {task.description && !compact && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-muted-foreground">{TASK_STATUS_LABELS[task.status] || task.status}</span>
            {task.energy_required === 'hoch' && (
              <span className="text-[11px] text-orange-400 inline-flex items-center gap-0.5"><AlertTriangle size={11} /> hohe Energie</span>
            )}
            {task.calculated_priority != null && (
              <span className="ml-auto text-[11px] text-muted-foreground/70">Prio {Math.round(task.calculated_priority)}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}