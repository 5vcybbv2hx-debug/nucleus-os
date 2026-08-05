import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Layers, Filter, CheckCircle2, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { calculatePriority, getOrgMeta, getDueDate, ACTIVE_STATUSES } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';

export default function Arbeit() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeTask, setCompleteTask] = useState(null);
  const [filter, setFilter] = useState('aktiv'); // aktiv | wartend | erledigt | alle

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch { setTasks([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isArchived && t.status !== 'Archiviert' && perms.canViewTask(t))
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }));
  }, [tasks, perms]);

  const filteredTasks = useMemo(() => {
    let result = visibleTasks;
    if (filter === 'aktiv') {
      result = result.filter(t => !['Erledigt', 'Nicht mehr notwendig'].includes(t.status));
    } else if (filter === 'wartend') {
      result = result.filter(t => ['Blockiert', 'Wartet auf Antwort', 'Zur Prüfung', 'Delegiert'].includes(t.status));
    } else if (filter === 'erledigt') {
      result = result.filter(t => ['Erledigt', 'Nicht mehr notwendig'].includes(t.status));
    }
    return result.sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));
  }, [visibleTasks, filter]);

  const counts = useMemo(() => ({
    aktiv: visibleTasks.filter(t => !['Erledigt', 'Nicht mehr notwendig'].includes(t.status)).length,
    wartend: visibleTasks.filter(t => ['Blockiert', 'Wartet auf Antwort', 'Zur Prüfung', 'Delegiert'].includes(t.status)).length,
    erledigt: visibleTasks.filter(t => ['Erledigt', 'Nicht mehr notwendig'].includes(t.status)).length,
    alle: visibleTasks.length,
  }), [visibleTasks]);

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Layers size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Arbeit</h1>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {[
          { key: 'aktiv', label: 'Aktiv' },
          { key: 'wartend', label: 'Wartend' },
          { key: 'erledigt', label: 'Erledigt' },
          { key: 'alle', label: 'Alle' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary'
            }`}>
            {f.label} <span className="opacity-60">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">{filter === 'aktiv' ? 'Keine aktiven Aufgaben.' : filter === 'erledigt' ? 'Noch nichts erledigt.' : 'Keine Aufgaben.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const org = getOrgMeta(task.organization);
            const due = getDueDate(task);
            const isOverdue = due && new Date(due) < new Date() && !['Erledigt', 'Nicht mehr notwendig'].includes(task.status);
            return (
              <div key={task.id} className={isOverdue ? 'ring-1 ring-red-500/20 rounded-2xl' : ''}>
                <TaskCard task={task} onComplete={setCompleteTask} />
              </div>
            );
          })}
        </div>
      )}

      {completeTask && <TaskCompleteModal task={completeTask} onClose={() => { setCompleteTask(null); loadTasks(); }} />}
    </div>
  );
}
