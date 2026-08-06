import { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUPERAGENT_FN_URL = 'https://base44.app/api/apps/6a6dd4806b39408bc6ba693f/functions/getRemoteTasks';

const PRIORITY_LABELS = {
  'hoch': 'A', 'A': 'A',
  'mittel': 'B', 'B': 'B',
  'niedrig': 'C', 'C': 'C',
  'hoechste': 'A',
};

function getPriorityDot(priority) {
  const p = PRIORITY_LABELS[priority] || priority;
  if (p === 'A') return 'bg-red-400';
  if (p === 'B') return 'bg-amber-400';
  if (p === 'C') return 'bg-slate-300';
  return 'bg-slate-200';
}

function sourceBadge(source_system) {
  if (source_system === 'SAVO') return { label: 'Bar', classes: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/40' };
  if (source_system === 'SANDRA') return { label: 'Büro', classes: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40' };
  return null;
}

export default function Woche() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [tasks, setTasks] = useState([]);
  const [remoteTasks, setRemoteTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unplannedOpen, setUnplannedOpen] = useState(true);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [atlasRes, remoteRes] = await Promise.all([
        base44.functions.invoke('secureTasks', { action: 'list' }),
        fetch(SUPERAGENT_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).then(r => r.json()).catch(() => ({ tasks: [] })),
      ]);
      setTasks(atlasRes?.data?.tasks || []);
      setRemoteTasks(remoteRes?.tasks || []);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const allTasks = useMemo(() => {
    const atlas = tasks
      .filter(t => !t.isArchived && t.status !== 'Archiviert')
      .map(t => ({ ...t, _source: 'atlas', _id: t.id, _draggable: true }));
    const remote = remoteTasks
      .filter(t => !t.completed)
      .map(t => ({ ...t, _source: 'remote', _id: 'remote-' + t.id, _draggable: false, planned_date: t.due_date }));
    return [...atlas, ...remote];
  }, [tasks, remoteTasks]);

  const tasksByDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[format(d, 'yyyy-MM-dd')] = []; });
    const unplanned = [];
    
    allTasks.forEach(t => {
      const dateStr = t.planned_date || t.due_date;
      if (dateStr && map[dateStr]) {
        map[dateStr].push(t);
      } else {
        unplanned.push(t);
      }
    });
    
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => {
        const pa = PRIORITY_LABELS[a.manual_priority || a.priority] || 'C';
        const pb = PRIORITY_LABELS[b.manual_priority || b.priority] || 'C';
        return pa.localeCompare(pb);
      });
    });
    
    unplanned.sort((a, b) => {
      const pa = PRIORITY_LABELS[a.manual_priority || a.priority] || 'C';
      const pb = PRIORITY_LABELS[b.manual_priority || b.priority] || 'C';
      return pa.localeCompare(pb);
    });
    
    return { days: map, unplanned };
  }, [allTasks, days]);

  const onDragEnd = useCallback(async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const targetDate = result.destination.droppableId.replace('day-', '');
    
    const task = allTasks.find(t => t._id === taskId);
    if (!task || !task._draggable) return;
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, planned_date: targetDate } : t
    ));
    
    try {
      await base44.functions.invoke('secureTasks', {
        action: 'update',
        task_id: task.id,
        planned_date: targetDate,
      });
    } catch (e) {
      console.error('Update failed:', e);
      loadAll();
    }
  }, [allTasks, loadAll]);

  const copyToAtlas = useCallback(async (remoteTask, dateStr) => {
    try {
      await base44.entities.Task.create({
        title: remoteTask.title,
        source_type: (remoteTask.source_system || 'remote').toLowerCase(),
        source_reference: remoteTask.source_id,
        planned_date: dateStr || format(new Date(), 'yyyy-MM-dd'),
        status: 'Geplant',
        organization: remoteTask.organization || 'EXECUTIVE',
        visibility: 'Team',
        manual_priority: remoteTask.priority === 'A' ? 'hoch' : remoteTask.priority === 'B' ? 'mittel' : 'niedrig',
      });
      loadAll();
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [loadAll]);

  const weekNumber = useMemo(() => format(weekStart, 'w'), [weekStart]);

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-primary" />
          <h1 className="text-xl font-semibold">Woche</h1>
          <span className="text-sm text-muted-foreground ml-2">KW {weekNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(prev => addDays(prev, -7))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            Heute
          </button>
          <button
            onClick={() => setWeekStart(prev => addDays(prev, 7))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Lade Aufgaben…
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 gap-2 lg:gap-3 min-w-[800px] lg:min-w-0 overflow-x-auto lg:overflow-visible pb-2">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDay.days[dateStr] || [];
              const isCurrent = isToday(day);
              
              return (
                <div key={dateStr} className="flex flex-col min-w-[120px]">
                  <div className={'text-center pb-2 mb-2 border-b ' + (isCurrent ? 'border-primary/40' : 'border-border')}>
                    <div className={'text-xs font-medium uppercase tracking-wide ' + (isCurrent ? 'text-primary' : 'text-muted-foreground')}>
                      {format(day, 'EEEEEE', { locale: de })}
                    </div>
                    <div className={'text-lg font-semibold mt-0.5 ' + (isCurrent ? 'text-primary' : 'text-foreground')}>
                      {format(day, 'd.')}
                    </div>
                  </div>
                  
                  <Droppable droppableId={'day-' + dateStr}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={'flex-1 space-y-1.5 min-h-[200px] rounded-lg p-1.5 transition-colors ' + (snapshot.isDraggingOver ? 'bg-accent/50' : '')}
                      >
                        {dayTasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                            isDragDisabled={!task._draggable}
                          >
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={'rounded-lg border p-2 text-xs transition-all ' + (task._source === 'remote' ? 'bg-muted/50 border-border' : 'bg-card border-border hover:border-primary/30') + (snap.isDragging ? ' shadow-lg ring-2 ring-primary/20' : '')}
                              >
                                <div className="flex items-start gap-1.5">
                                  <div className={'mt-1 h-1.5 w-1.5 rounded-full shrink-0 ' + getPriorityDot(task.manual_priority || task.priority)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium leading-tight line-clamp-2">{task.title}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {task._source === 'remote' && sourceBadge(task.source_system) && (
                                        <span className={'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ' + sourceBadge(task.source_system).classes}>
                                          {sourceBadge(task.source_system).label}
                                        </span>
                                      )}
                                      {task.status && task.status !== 'Eingang' && task.status !== 'offen' && task.status !== 'erledigt' && (
                                        <span className="text-[10px] text-muted-foreground">{task.status}</span>
                                      )}
                                      {task._source === 'remote' && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); copyToAtlas(task, dateStr); }}
                                          className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                          title="In Atlas kopieren"
                                        >
                                          <Plus size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>

          {tasksByDay.unplanned.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setUnplannedOpen(o => !o)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronRight size={16} className={'transition-transform ' + (unplannedOpen ? 'rotate-90' : '')} />
                <span>Ungeplant</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{tasksByDay.unplanned.length}</span>
              </button>
              {unplannedOpen && (
                <Droppable droppableId="unplanned" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={'flex flex-wrap gap-2 p-2 rounded-lg border border-dashed border-border min-h-[60px] ' + (snapshot.isDraggingOver ? 'bg-accent/30' : '')}
                    >
                      {tasksByDay.unplanned.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                          isDragDisabled={!task._draggable}
                        >
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={'rounded-lg border p-2 text-xs w-[200px] transition-all ' + (task._source === 'remote' ? 'bg-muted/50 border-border' : 'bg-card border-border hover:border-primary/30') + (snap.isDragging ? ' shadow-lg ring-2 ring-primary/20' : '')}
                            >
                              <div className="flex items-start gap-1.5">
                                <div className={'mt-1 h-1.5 w-1.5 rounded-full shrink-0 ' + getPriorityDot(task.manual_priority || task.priority)} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium leading-tight line-clamp-2">{task.title}</div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    {task._source === 'remote' && sourceBadge(task.source_system) && (
                                      <span className={'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ' + sourceBadge(task.source_system).classes}>
                                        {sourceBadge(task.source_system).label}
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span className="text-[10px] text-muted-foreground">
                                        fällig {format(parseISO(task.due_date), 'd.MM.', { locale: de })}
                                      </span>
                                    )}
                                    {task._source === 'remote' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToAtlas(task, format(new Date(), 'yyyy-MM-dd')); }}
                                        className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                        title="In Atlas kopieren"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )}
        </DragDropContext>
      )}
    </div>
  );
}
