import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Sunrise, Battery, Zap, ListChecks, AlertTriangle, Clock, HelpCircle, Wallet, Sparkles, TrendingUp, CalendarClock } from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { DAY_MODES, calculatePriority, getOrgMeta } from '@/lib/organizations';

const GREETINGS = [
  { h: [5,6,7,8,9,10], label: 'Guten Morgen', icon: Sunrise },
  { h: [11,12,13,14,15,16,17], label: 'Guten Tag', icon: Battery },
  { h: [18,19,20,21], label: 'Guten Abend', icon: Zap },
  { h: [22,23,0,1,2,3,4], label: 'Gute Nacht', icon: Sparkles },
];

export default function Heute() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayMode, setDayMode] = useState('Normal');
  const [completeTask, setCompleteTask] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Task.list().then(list => {
      setTasks(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greet = GREETINGS.find(g => g.h.includes(hour)) || GREETINGS[0];
  const GreetIcon = greet.icon;

  const activeTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Erledigt' && t.status !== 'erledigt' && t.status !== 'Nicht mehr notwendig' && !t.isArchived)
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }))
      .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0))
      .slice(0, 8);
  }, [tasks]);

  const criticalDeadlines = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    const in14 = new Date(now); in14.setDate(in14.getDate() + 14);
    return tasks
      .filter(t => t.dueDate && t.status !== 'Erledigt' && t.status !== 'erledigt' && !t.isArchived)
      .filter(t => { const d = new Date(t.dueDate); return d <= in14; })
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);
  }, [tasks]);

  const unclear = useMemo(() => tasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort').slice(0, 4), [tasks]);

  const doneCount = tasks.filter(t => t.status === 'Erledigt' || t.status === 'erledigt').length;
  const plannedCount = activeTasks.length + (tasks.filter(t => t.status === 'Erledigt').length);
  const progress = plannedCount > 0 ? Math.round((doneCount / plannedCount) * 100) : 0;

  const reload = () => base44.entities.Task.list().then(setTasks);

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
          <h1 className="text-xl font-semibold mt-1 flex items-center gap-2">
            <GreetIcon size={20} className="text-primary" />
            {greet.label}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>
      </div>

      {/* Day Mode */}
      <div className="mb-5">
        <div className="text-xs text-muted-foreground font-medium mb-2">Tagesmodus</div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {DAY_MODES.map(mode => (
            <button key={mode} onClick={() => setDayMode(mode)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                dayMode === mode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5 p-4 bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><TrendingUp size={14} /> Tagesfortschritt</span>
          <span className="text-xs text-muted-foreground">{doneCount} / {plannedCount} erledigt</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Prioritized Tasks */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ListChecks size={16} /> Priorisierte Aufgaben</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>
        ) : activeTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Keine offenen Aufgaben — schöner Tag.</p>
          </div>
        ) : (
          <div>
            {activeTasks.map(t => <TaskCard key={t.id} task={t} onComplete={setCompleteTask} />)}
          </div>
        )}
      </section>

      {/* Critical Deadlines */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Clock size={16} /> Kritische Fristen</h2>
        {criticalDeadlines.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">Keine dringenden Fristen.</p>
        ) : (
          <div className="space-y-2">
            {criticalDeadlines.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <div key={t.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}>{org.emoji} {org.short}</span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-red-400">{format(new Date(t.dueDate), 'dd.MM.', { locale: de })}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Unclear / Blocked */}
      {unclear.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><HelpCircle size={16} /> Ungeklärte Einträge</h2>
          <div className="space-y-2">
            {unclear.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <div key={t.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
                  <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}>{org.emoji} {org.short}</span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  <span className="text-[11px] text-amber-400">{t.status}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Prepared placeholders */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><CalendarClock size={16} /> Heutige Termine</h2>
        <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Terminkalender folgt in einem nächsten Paket.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Wallet size={16} /> Finanzhinweise</h2>
        <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Kompakte Finanzübersicht folgt.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ListChecks size={16} /> Offene Entscheidungen</h2>
        <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Noch keine offenen Entscheidungen.</p>
      </section>

      {completeTask && (
        <TaskCompleteModal task={completeTask} onClose={() => setCompleteTask(null)} onSuggest={() => { reload(); }} />
      )}
    </div>
  );
}