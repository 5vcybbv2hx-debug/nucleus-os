import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckSquare } from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { calculatePriority } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';

export default function Aufgaben() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeTask, setCompleteTask] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = tasks
    .filter(t => !t.isArchived && t.status !== 'Archiviert' && t.status !== 'Erledigt' && perms.canViewTask(t))
    .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }))
    .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <CheckSquare size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Aufgaben</h1>
        <span className="text-xs text-muted-foreground ml-1">({visible.length})</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Keine offenen Aufgaben.</p>
        </div>
      ) : (
        <div>{visible.map(t => <TaskCard key={t.id} task={t} onComplete={setCompleteTask} />)}</div>
      )}

      {completeTask && (
        <TaskCompleteModal task={completeTask} onClose={() => setCompleteTask(null)} onSuggest={load} />
      )}
    </div>
  );
}