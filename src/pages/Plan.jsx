import { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarClock, Plus, Lock, Unlock, Check, Clock, Sparkles, Loader2 } from 'lucide-react';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { calculatePriority, getOrgMeta } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';

const todayStr = () => new Date().toISOString().substring(0, 10);

const fmtDuration = (min) => {
  if (!min) return '—';
  const h = min / 60;
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
};

export default function Plan() {
  const perms = usePermissions();
  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskMap, setTaskMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [completeTask, setCompleteTask] = useState(null);
  const [completingItem, setCompletingItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // --- DailyPlan sicherstellen (wie Heute-Seite) ---
  const ensurePlan = useCallback(async () => {
    const user = perms.user;
    if (!user) return null;
    const today = todayStr();
    const existing = await base44.entities.DailyPlan.filter({ user: user.id, date: today });
    let p;
    if (existing.length > 0) {
      p = existing[0];
    } else {
      p = await base44.entities.DailyPlan.create({
        user: user.id, date: today, day_mode: 'Normal',
        energy_level: 'mittel', available_time: 8, generated_at: new Date().toISOString(),
      });
    }
    setPlan(p);
    return p;
  }, [perms.user]);

  const loadItems = useCallback(async (planId) => {
    if (!planId) { setItems([]); return; }
    const list = await base44.entities.DailyPlanItem.filter({ daily_plan: planId });
    setItems(list.sort((a, b) => {
      const sa = a.suggested_start || '99:99';
      const sb = b.suggested_start || '99:99';
      if (sa !== sb) return sa.localeCompare(sb);
      return (a.sequence || 0) - (b.sequence || 0);
    }));
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      const list = res.data?.tasks || res.tasks || [];
      setTasks(list);
      const map = {};
      list.forEach(t => { map[t.id] = t; });
      setTaskMap(map);
    } catch {
      setTasks([]);
      setTaskMap({});
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const p = await ensurePlan();
    await Promise.all([loadItems(p?.id), loadTasks()]);
    setLoading(false);
  }, [ensurePlan, loadItems, loadTasks]);

  useEffect(() => { if (perms.user) loadAll(); }, [perms.user, loadAll]);

  // Geplante Task-IDs
  const plannedTaskIds = useMemo(() => new Set(items.map(i => i.task)), [items]);

  // Verfügbare Aufgaben: Geplant/Eingang, nicht im Plan, sichtbar
  const availableTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (t.isArchived || t.status === 'Archiviert') return false;
        if (plannedTaskIds.has(t.id)) return false;
        if (t.status !== 'Eingang' && t.status !== 'Geplant') return false;
        if (!perms.canViewTask(t)) return false;
        return true;
      })
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }))
      .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));
  }, [tasks, plannedTaskIds, perms]);

  const plannedMinutes = useMemo(() => items.reduce((s, i) => s + (i.duration || 0), 0), [items]);
  const availableTime = plan?.available_time ?? 8;
  const budgetMinutes = availableTime * 60;
  const budgetPct = budgetMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / budgetMinutes) * 100)) : 0;
  const overBudget = plannedMinutes > budgetMinutes;

  const nextSequence = () => (items.reduce((m, i) => Math.max(m, i.sequence || 0), 0) + 1);

  const addToPlan = async (task) => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        daily_plan: plan.id,
        task: task.id,
        sequence: nextSequence(),
        suggested_start: null,
        duration: task.estimated_duration || 30,
        locked: false,
        completed: false,
      };
      const created = await base44.entities.DailyPlanItem.create(payload);
      await logAudit({ action: 'create', entityType: 'DailyPlanItem', entityId: created.id, newValue: payload });
      if (task.status === 'Eingang') {
        const prev = { status: task.status };
        await base44.entities.Task.update(task.id, { status: 'Geplant' });
        await logAudit({ action: 'status_change', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: { status: 'Geplant' } });
      }
      await loadItems(plan.id);
      await loadTasks();
    } finally { setBusy(false); }
  };

  const toggleLock = async (item) => {
    const prev = { locked: item.locked };
    const newVal = !item.locked;
    await base44.entities.DailyPlanItem.update(item.id, { locked: newVal });
    await logAudit({ action: 'update', entityType: 'DailyPlanItem', entityId: item.id, previousValue: prev, newValue: { locked: newVal } });
    loadItems(plan.id);
  };

  const onComplete = async () => {
    // Called by TaskCompleteModal after task set to Erledigt
    if (completingItem) {
      const prev = { completed: completingItem.completed };
      await base44.entities.DailyPlanItem.update(completingItem.id, { completed: true });
      await logAudit({ action: 'complete', entityType: 'DailyPlanItem', entityId: completingItem.id, previousValue: prev, newValue: { completed: true } });
    }
    setCompletingItem(null);
    setCompleteTask(null);
    if (plan) await loadItems(plan.id);
    await loadTasks();
  };

  const startComplete = (item, task) => {
    setCompletingItem(item);
    setCompleteTask(task);
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-4 lg:px-8">
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock size={22} className="text-primary" />
          <h1 className="text-xl font-semibold">Tagesplanung</h1>
        </div>
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <CalendarClock size={22} className="text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Tagesplanung</h1>
          <div className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
        </div>
      </div>

      {/* Tagesmodus (read-only) */}
      <div className="mb-4 p-3 bg-card border border-border rounded-2xl flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Tagesmodus</span>
        <span className="text-sm font-medium">{plan?.day_mode || 'Normal'}</span>
      </div>

      {/* Zeit-Budget */}
      <div className="mb-5 p-4 bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Clock size={14} /> Zeit-Budget</span>
          <span className={`text-xs ${overBudget ? 'text-red-400' : 'text-muted-foreground'}`}>
            {fmtDuration(plannedMinutes)} / {availableTime}h
          </span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${budgetPct}%` }} />
        </div>
        {overBudget && <p className="text-[11px] text-red-400 mt-2">Zeit-Budget überschritten.</p>}
      </div>

      {/* Geplante Blöcke */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><CalendarClock size={16} /> Geplante Blöcke <span className="text-muted-foreground/60 font-normal">({items.length})</span></h2>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Noch nichts geplant.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Füge Aufgaben aus der Liste unten hinzu.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const task = taskMap[item.task];
              const org = task ? getOrgMeta(task.organization) : null;
              const completed = item.completed || task?.status === 'Erledigt';
              return (
                <div key={item.id} className={`p-3.5 bg-card border rounded-2xl ${completed ? 'border-green-500/30 opacity-70' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                      <span className="text-xs font-semibold text-primary">{item.suggested_start || '—'}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtDuration(item.duration)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {org && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>}
                        {completed && <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded">Erledigt</span>}
                      </div>
                      <div className={`text-sm font-medium ${completed ? 'line-through' : ''}`}>{task?.title || 'Aufgabe nicht gefunden'}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleLock(item)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors" title={item.locked ? 'Sperren aufheben' : 'Block sperren'}>
                        {item.locked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-muted-foreground" />}
                      </button>
                      <button onClick={() => !completed && task && startComplete(item, task)} disabled={completed || !task}
                        className={`p-1.5 rounded-lg transition-colors ${completed ? 'text-green-400' : 'hover:bg-secondary text-muted-foreground'} disabled:opacity-50`}
                        title={completed ? 'Erledigt' : 'Abschließen'}>
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Verfügbare Aufgaben */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Plus size={16} /> Verfügbare Aufgaben <span className="text-muted-foreground/60 font-normal">({availableTasks.length})</span></h2>
        {availableTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Keine offenen Aufgaben verfügbar.</p>
        ) : (
          <div className="space-y-2">
            {availableTasks.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <div key={t.id} className="p-3 bg-card border border-border rounded-2xl flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium flex-shrink-0 ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground">{t.status} · Prio {t.calculated_priority}</div>
                  </div>
                  <button onClick={() => addToPlan(t)} disabled={busy}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0" title="Zum Plan hinzufügen">
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {completeTask && (
        <TaskCompleteModal task={completeTask} onClose={() => { setCompleteTask(null); setCompletingItem(null); }} onSuggest={onComplete} />
      )}
    </div>
  );
}