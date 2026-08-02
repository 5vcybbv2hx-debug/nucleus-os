import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Sunrise, Battery, Zap as ZapIcon, ListChecks, AlertTriangle, Clock, HelpCircle,
  Wallet, Sparkles, TrendingUp, CalendarClock, CheckSquare, UserCheck, ClipboardCheck, CheckCircle,
} from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import BarHeute from '@/components/atlas/BarHeute';
import { DAY_MODES, calculatePriority, getOrgMeta, getDueDate } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';
import { Link } from 'react-router-dom';

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
  const [planItems, setPlanItems] = useState([]);
  const [financeInsights, setFinanceInsights] = useState([]);

  // Aufgaben über secure Backend (visibility serverseitig gefiltert)
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  }, []);

  // --- DailyPlan: ein Plan pro Benutzer pro Tag (nur für administrator/vertretung) ---
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
        user: user.id, date: today, day_mode: 'Normal',
        energy_level: 'mittel', available_time: 8, generated_at: new Date().toISOString(),
      });
      setDailyPlanId(plan.id);
    }
  }, [perms.user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    if (perms.user && perms.role !== 'buero') ensureDailyPlan();
  }, [perms.user, perms.role, ensureDailyPlan]);

  // DailyPlanItems für heutige Termine (nur administrator/vertretung)
  useEffect(() => {
    if (!dailyPlanId) { setPlanItems([]); return; }
    let alive = true;
    (async () => {
      try {
        const items = await base44.entities.DailyPlanItem.filter({ daily_plan: dailyPlanId });
        if (alive) setPlanItems(items.sort((a, b) => (a.suggested_start || '99:99').localeCompare(b.suggested_start || '99:99')));
      } catch { if (alive) setPlanItems([]); }
    })();
    return () => { alive = false; };
  }, [dailyPlanId]);

  // Finanz-Insights (nicht-BAR) via barAdapter (nur administrator)
  useEffect(() => {
    if (perms.role === 'vertretung') return;
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('barAdapter', { action: 'getBarSnapshot' });
        if (!alive) return;
        setFinanceInsights((res.data?.snapshot?.insights || res.snapshot?.insights || []).filter(i => i.organization && i.organization !== 'BAR'));
      } catch { if (alive) setFinanceInsights([]); }
    })();
    return () => { alive = false; };
  }, [perms.role]);

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

  // Sichtbare Aufgaben (zusätzlich clientseitig canViewTask, nicht archiviert)
  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isArchived && t.status !== 'Archiviert' && perms.canViewTask(t))
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }));
  }, [tasks, perms]);

  const taskById = useMemo(() => Object.fromEntries(tasks.map(t => [t.id, t])), [tasks]);
  const decisions = visibleTasks.filter(t => t.status === 'Zur Prüfung').slice(0, 4);

  const handleCheckDecision = async (task) => {
    const prev = { status: task.status };
    await base44.entities.Task.update(task.id, { status: 'In Bearbeitung' });
    await logAudit({ action: 'status_change', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: { status: 'In Bearbeitung' } });
    loadTasks();
  };

  const isBuero = perms.role === 'buero';

  if (isBuero) {
    return (
      <BueroView
        perms={perms}
        tasks={visibleTasks}
        loading={loading}
        greet={greet}
        GreetIcon={GreetIcon}
        onReload={loadTasks}
        completeTask={completeTask}
        setCompleteTask={setCompleteTask}
      />
    );
  }

  // --- administrator / vertretung: vollständiges Daily Briefing ---
  const activeTasks = visibleTasks
    .filter(t => t.status !== 'Erledigt' && t.status !== 'Nicht mehr notwendig')
    .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0))
    .slice(0, 8);

  const criticalDeadlines = visibleTasks
    .filter(t => { const d = getDueDate(t); return d && t.status !== 'Erledigt' && new Date(d) <= new Date(Date.now() + 14 * 86400000); })
    .sort((a, b) => new Date(getDueDate(a)) - new Date(getDueDate(b)))
    .slice(0, 4);

  const unclear = visibleTasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort').slice(0, 4);

  const today = todayStr();
  const plannedToday = visibleTasks.filter(t => t.planned_date === today);
  const doneToday = plannedToday.filter(t => t.status === 'Erledigt').length;
  const progress = plannedToday.length > 0 ? Math.round((doneToday / plannedToday.length) * 100) : 0;

  // Vertretung: keine vertraulichen Finanzinhalte
  const isVertretung = perms.role === 'vertretung';

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
              }`}>{mode}</button>
          ))}
        </div>
      </div>

      {/* Energy + Time */}
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
              onChange={e => updateTime(Number(e.target.value))} className="flex-1 accent-primary" />
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
        {plannedToday.length === 0 && <p className="text-[11px] text-muted-foreground/60 mt-2">Keine Aufgaben für heute geplant.</p>}
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
          <div>{activeTasks.map(t => <TaskCard key={t.id} task={t} onComplete={setCompleteTask} />)}</div>
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

      {perms.isPierre && <BarHeute />}

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
        {planItems.length === 0 ? (
          <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground/60 text-center">
            Keine Termine heute. <Link to="/plan" className="text-primary hover:underline">Gehe zur Planung</Link> um deinen Tag zu strukturieren.
          </div>
        ) : (
          <div className="space-y-2">
            {planItems.slice(0, 5).map(item => {
              const task = taskById[item.task];
              const org = task ? getOrgMeta(task.organization) : null;
              return (
                <div key={item.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                  <span className="text-xs font-semibold text-primary w-12 flex-shrink-0">{item.suggested_start || '—'}</span>
                  <span className="text-sm flex-1 truncate">{task?.title || 'Aufgabe'}</span>
                  {org && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] flex-shrink-0 ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Finanzhinweise: nur für administrator (keine vertraulichen Inhalte für Vertretung) */}
      {!isVertretung && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Wallet size={16} /> Finanzhinweise</h2>
          {financeInsights.length > 0 ? (
            <div className="space-y-2">
              {financeInsights.map((ins, i) => {
                const org = getOrgMeta(ins.organization);
                return (
                  <div key={ins.externalId || i} className="p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                    </div>
                    <div className="text-sm font-medium">{ins.title}</div>
                    {ins.summary && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.summary}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-card border border-border rounded-xl">
              <p className="text-xs text-muted-foreground">Detaillierte Finanzübersicht in der Finanz-Sektion.</p>
              <Link to="/finanzen" className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1">Finanzübersicht öffnen →</Link>
            </div>
          )}
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ListChecks size={16} /> Offene Entscheidungen</h2>
        {decisions.length === 0 ? (
          <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground/60 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> Keine offenen Entscheidungen — alles klar.
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <div key={t.id} className="p-3 bg-card border border-border rounded-xl flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] flex-shrink-0 ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  <button onClick={() => handleCheckDecision(t)} className="text-xs px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex-shrink-0">Prüfen</button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {completeTask && (
        <TaskCompleteModal task={completeTask} onClose={() => setCompleteTask(null)} onSuggest={loadTasks} />
      )}
    </div>
  );
}

// --- Vereinfachte Arbeitsansicht für Rolle "buero" ---
function BueroView({ perms, tasks, loading, greet, GreetIcon, onReload, completeTask, setCompleteTask }) {
  const user = perms.user;
  const mine = tasks.filter(t => t.assignee === user?.id && t.status !== 'Erledigt' && t.status !== 'Nicht mehr notwendig');
  const eingang = tasks.filter(t => t.status === 'Eingang');
  const unclear = tasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort');
  const zurPruefung = tasks.filter(t => t.status === 'Zur Prüfung');
  const delegiert = tasks.filter(t => t.status === 'Delegiert');

  const Section = ({ icon: Icon, title, items, emptyNote }) => (
    <section className="mb-6">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Icon size={16} /> {title} <span className="text-muted-foreground/60 font-normal">({items.length})</span></h2>
      {loading ? (
        <div className="space-y-2">{[...Array(2)].map((_,i) => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">{emptyNote}</p>
      ) : (
        <div>{items.map(t => <TaskCard key={t.id} task={t} onComplete={setCompleteTask} />)}</div>
      )}
    </section>
  );

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
          <h1 className="text-xl font-semibold mt-1 flex items-center gap-2">
            <GreetIcon size={20} className="text-primary" />
            {greet.label}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>
      </div>

      <Section icon={UserCheck} title="Mir zugewiesene Aufgaben" items={mine} emptyNote="Nichts dir direkt zugewiesen." />
      <Section icon={CheckSquare} title="Eingang" items={eingang} emptyNote="Nichts Neues im Eingang." />
      <Section icon={AlertTriangle} title="Ungeklärte Einträge" items={unclear} emptyNote="Nichts ungeklärt." />
      <Section icon={ClipboardCheck} title="Wartet auf Prüfung" items={zurPruefung} emptyNote="Nichts zur Prüfung." />
      <Section icon={HelpCircle} title="Delegierte Rückfragen" items={delegiert} emptyNote="Keine delegierten Rückfragen." />

      {completeTask && (
        <TaskCompleteModal task={completeTask} onClose={() => setCompleteTask(null)} onSuggest={onReload} />
      )}
    </div>
  );
}