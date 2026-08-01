import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Sunrise, Battery, Zap as ZapIcon, ListChecks, AlertTriangle, Clock, HelpCircle, Wallet, Sparkles, TrendingUp, CalendarClock } from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { DAY_MODES, calculatePriority, getOrgMeta, getDueDate } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';

const GREETINGS = [
  { h: [5,6,7,8,9,10], label: 'Guten Morgen', icon: Sunrise },
  { h: [11,12,13,14,15,16,17], label: 'Guten Tag', icon: Battery },
  { h: [18,19,20,21], label: 'Guten Abend', icon: ZapIcon },
  { h: [22,23,0,1,2,3,4], label: 'Gute Nacht', icon: Sparkles },
];

const todayStr = () => new Date().toISOString().substring(0, 10);

export default function Heute() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayMode, setDayMode] = useState('Normal');
  const [energyLevel, setEnergyLevel] = useState('mittel');
  const [availableTime, setAvailableTime] = useState(8);
  const [dailyPlanId, setDailyPlanId] = useState(null);
  const [completeTask, setCompleteTask] = useState(null);

  // --- DailyPlan: ein Plan pro Benutzer pro Tag ---
  const ensureDailyPlan = useCallback(async () => {
    const user = perms.user;
    if (!user) return;
    const today = todayStr();
    const existing = await base44.entities.DailyPlan.filter({ user: user.id, date: today });
    if (existing.length > 0) {
      const plan = existing[0];
      setDailyPlanId(plan.id);
      setDayMode(plan.day_mode || 'Normal');
      setEnergyLevel(plan.energy_level || 'mittel');
      setAvailableTime(plan.available_time ?? 8);
    } else {
      const plan = await base44.entities.DailyPlan.create({
        user: user.id,
        date: today,
        day_mode: 'Normal',
        energy_level: 'mittel',
        available_time: 8,
        generated_at: new Date().toISOString(),
      });
      setDailyPlanId(plan.id);
    }
  }, [perms.user]);

  useEffect(() => {
    base44.entities.Task.list().then(list => {
      setTasks(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (perms.user) ensureDailyPlan();
  }, [perms.user, ensureDailyPlan]);

  // day_mode sofort speichern
  const updateDayMode = async (mode) => {
    setDayMode(mode);
    if (!dailyPlanId) return;
    await base44.entities.DailyPlan.update(dailyPlanId, { day_mode: mode, manually_adjusted: true });
  };
  const updateEnergy = async (lvl) => {
    setEnergyLevel(lvl);
    if (!dailyPlanId) return;
    await base44.entities.DailyPlan.update(dailyPlanId, { energy_level: lvl, manually_adjusted: true });
  };
  const updateTime = async (val) => {
    setAvailableTime(val);
    if (!dailyPlanId) return;
    await base44.entities.DailyPlan.update(dailyPlanId, { available_time: val, manually_adjusted: true });
  };

  const hour = new Date().getHours();
  const greet = GREETINGS.find(g => g.h.includes(hour)) || GREETINGS[0];
  const GreetIcon = greet.icon;

  // Aktive + sichtbare Aufgaben (Permissions + visibility, nicht archiviert)
  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isArchived && t.status !== 'Archiviert' && perms.canViewTask(t))
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }));
  }, [tasks, perms]);

  const activeTasks = useMemo(() => {
    return visibleTasks
      .filter(t => t.status !== 'Erledigt' && t.status !== 'Nicht mehr notwendig')
      .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0))
      .slice(0, 8);
  }, [visibleTasks]);

  const criticalDeadlines = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0);
    const in14 = new Date(now); in14.setDate(in14.getDate() + 14);
    return visibleTasks
      .filter(t => { const d = getDueDate(t); return d && t.status !== 'Erledigt' && new Date(d) <= in14; })
      .sort((a,b) => new Date(getDueDate(a)) - new Date(getDueDate(b)))
      .slice(0, 4);
  }, [visibleTasks]);

  const unclear = useMemo(() => visibleTasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort').slice(0, 4), [visibleTasks]);

  // --- Tagesfortschritt: geplante Aufgaben für HEUTE ---
  const today = todayStr();
  const plannedToday = useMemo(() => {
    return visibleTasks.filter(t => t.planned_date === today);
  }, [visibleTasks, today]);
  const doneToday = plannedToday.filter(t => t.status === 'Erledigt').length;
  const progress = plannedToday.length > 0 ? Math.round((doneToday / plannedToday.length) * 100) : 0;

  const reload = () => base44.entities.Task.list().then(setTasks);

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
          <h1 className="text-xl font-semibold mt-1 flex items-center gap-2">
            <GreetIcon size={20} className="text-primary" />
            {greet.label}{perms.user?.full_name ? `, ${perms.user.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>
      </div>

      {/* Day Mode */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground font-medium mb-2">Tagesmodus</div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {DAY_MODES.map(mode => (
            <button key={mode} onClick={() => updateDayMode(mode)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                dayMode === mode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Energy + Time (DailyPlan) */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="p-3 bg-card border border-border rounded-2xl">
          <div className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5"><ZapIcon size={13} /> Energie</div>
          <div className="flex gap-1.5">
            {['niedrig','mittel','hoch'].map(l => (
              <button key={l} onClick={() => updateEnergy(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  energyLevel === l ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="p-3 bg-card border border-border rounded-2xl">
          <div className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5"><Clock size={13} /> Zeit (h)</div>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="16" step="1" value={availableTime}
              onChange={e => updateTime(Number(e.target.value))}
              className="flex-1 accent-primary" />
            <span className="text-sm font-semibold w-8 text-right">{availableTime}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5 p-4 bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><TrendingUp size={14} /> Tagesfortschritt</span>
          <span className="text-xs text-muted-foreground">{doneToday} / {plannedToday.length} erledigt</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {plannedToday.length === 0 && (
          <p className="text-[11px] text-muted-foreground/60 mt-2">Keine Aufgaben für heute geplant.</p>
        )}
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
              const d = getDueDate(t);
              return (
                <div key={t.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  {d && <span className="text-xs text-red-400">{format(new Date(d), 'dd.MM.', { locale: de })}</span>}
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  <span className="text-[11px] text-amber-400">{t.status}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

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