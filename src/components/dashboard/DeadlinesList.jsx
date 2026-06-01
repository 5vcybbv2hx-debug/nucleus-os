import { useNavigate } from 'react-router-dom';
import { DEADLINE_CATEGORIES, PRIORITY_CONFIG } from '@/lib/constants';
import { differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';

export default function DeadlinesList({ deadlines }) {
  const navigate = useNavigate();

  if (!deadlines?.length) {
    return <div className="text-center py-6 text-muted-foreground text-sm">Keine kommenden Fristen</div>;
  }

  return (
    <div className="space-y-2">
      {deadlines.slice(0, 5).map(dl => {
        const daysLeft = differenceInDays(new Date(dl.dueDate), new Date());
        const isUrgent = daysLeft <= 7;
        const isOverdue = daysLeft < 0;
        const cat = DEADLINE_CATEGORIES[dl.category] || { label: dl.category, icon: '📌' };
        const prio = PRIORITY_CONFIG[dl.priority] || { dot: 'bg-gray-400' };

        return (
          <button
            key={dl.id}
            onClick={() => navigate('/fristen')}
            className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-secondary/30 transition-all text-left"
          >
            <div className="text-xl flex-shrink-0">{cat.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{dl.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {format(new Date(dl.dueDate), 'dd. MMM yyyy', { locale: de })}
              </div>
            </div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
              isOverdue ? 'bg-red-500/15 text-red-400' :
              isUrgent ? 'bg-orange-500/15 text-orange-400' :
              'bg-secondary text-muted-foreground'
            }`}>
              {isOverdue ? `${Math.abs(daysLeft)}d überfällig` : isUrgent ? `${daysLeft}d` : `${daysLeft}d`}
            </div>
            <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}