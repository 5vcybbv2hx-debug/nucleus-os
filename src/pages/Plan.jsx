import { CalendarClock, Sparkles } from 'lucide-react';

export default function Plan() {
  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <CalendarClock size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Planung</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Sparkles size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Tagesplanung folgt</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">Die intelligente Tagesplanung mit DailyPlan & DailyPlanItem wird im nächsten Paket aktiviert.</p>
      </div>
    </div>
  );
}