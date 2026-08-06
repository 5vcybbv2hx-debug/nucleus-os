import { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { startOfWeek, addDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Lock, Copy } from 'lucide-react';
import WeekTaskCard from '@/components/atlas/WeekTaskCard';
import WeekRemoteCard from '@/components/atlas/WeekRemoteCard';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function Woche() {
  const [tasks, setTasks] = useState([]);
  const [remoteInsights, setRemoteInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [copying, setCopying] = useState(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch { setTasks([]); }
    setLoading(false);
  }, []);

  const loadRemote = useCallback(async () => {
    try {
      const [bar, sandra] = await Promise.all([
        base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' }).catch(() => []),
        base44.entities.ExternalInsight.filter({ organization: 'SANDRA', status: 'active' }).catch(() => []),
      ]);
      setRemoteInsights([...(bar || []), ...(sandra || [])]);
    } catch { setRemoteInsights([]); }
  }, []);

  useEffect(() => { loadTasks(); loadRemote(); }, [loadTasks, loadRemote]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const tasksByDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[format(d, 'yyyy-MM-dd')] = []; });
    tasks.forEach(t => {
      if (!t.isArchived && t.status !== 'Erledigt' && t.status !== 'Archiviert' && t.planned_date) {
        const key = t.planned_date.substring(0, 10);
        if (map[key]) map[key].push(t);
      }
    });
    return map;
  }, [tasks, days]);

  const unplannedTasks = useMemo(() => {
    return tasks.filter(t =>
      !t.planned_date && !t.isArchived &&
      t.status !== 'Erledigt' && t.status !== 'Archiviert' && t.status !== 'Nicht mehr notwendig'
    );
  }, [tasks]);

  const remoteByDay = useMemo(() => {
    const map = {};
    days.forEach(d => { map[format(d, 'yyyy-MM-dd')] = []; });
    remoteInsights.forEach(ins => {
      if (ins.effective_date) {
        const key = ins.effective_date.substring(0, 10);
        if (map[key]) map[key].push(ins);
      }
    });
    return map;
  }, [remoteInsights, days]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const newDate = destination.droppableId === 'unplanned' ? null : destination.droppableId;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, planned_date: newDate } : t));

    try {
      await base44.functions.invoke('secureTasks', { action: 'update', task_id: taskId, planned_date: newDate });
    } catch {
      loadTasks(); // reload on error
    }
  };

  const copyToAtlas = async (insight) => {
    setCopying(insight.id || insight.external_reference);
    try {
      await base44.entities.Task.create({
        title: insight.title.replace(/^(Sandra:|SAVO:)\s*/i, ''),
        description: insight.summary || '',
        organization: insight.organization || 'EXECUTIVE',
        status: 'Eingang',
        visibility: 'Team',
        source_type: 'manuell',
        planned_date: insight.effective_date || null,
        manual_priority: (insight.severity === 'critical' || insight.severity === 'high') ? 'hoch' : 'mittel',
      });
      loadTasks();
    } catch (e) {
      console.error('copy failed', e);
    }
    setCopying(null);
  };

  const weekLabel = `${format(weekStart, 'dd.MM.', { locale: de })} – ${format(addDays(weekStart, 6), 'dd.MM.yyyy', { locale: de })}`;

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={22} className="text-primary" />
          <h1 className="text-xl font-semibold">Woche</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-secondary">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-secondary">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="ml-1 text-xs px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground">Heute</button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-card rounded-2xl animate-pulse" />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Week grid */}
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="grid grid-cols-7 gap-1.5 min-w-[760px] lg:min-w-0">
              {days.map((day, idx) => {
                const key = format(day, 'yyyy-MM-dd');
                const isToday = key === todayKey;
                const dayTasks = tasksByDay[key] || [];
                const dayRemote = remoteByDay[key] || [];
                return (
                  <div key={key} className="flex flex-col">
                    <div className={`text-center pb-2 mb-1 border-b ${isToday ? 'border-primary' : 'border-border'}`}>
                      <div className="text-[10px] text-muted-foreground uppercase">{WEEKDAY_LABELS[idx]}</div>
                      <div className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
                    </div>
                    <Droppable droppableId={key}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 min-h-[120px] rounded-lg p-1 space-y-1.5 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/10' : ''
                          }`}>
                          {dayRemote.map((ins, i) => (
                            <WeekRemoteCard key={`r-${ins.id || i}`} insight={ins} onCopy={copyToAtlas} copying={copying === (ins.id || ins.external_reference)} />
                          ))}
                          {dayTasks.map((task, i) => (
                            <Draggable key={task.id} draggableId={task.id} index={i}>
                              {(prov, snap) => (
                                <WeekTaskCard task={task} innerRef={prov.innerRef}
                                  draggableProps={prov.draggableProps} dragHandleProps={prov.dragHandleProps}
                                  isDragging={snap.isDragging} />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {dayTasks.length === 0 && dayRemote.length === 0 && (
                            <div className="text-[10px] text-muted-foreground/30 text-center py-3">—</div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unplanned area */}
          <div className="mt-6">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
              Ungeplant ({unplannedTasks.length})
            </div>
            <Droppable droppableId="unplanned">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  className={`min-h-[80px] p-2 rounded-xl border-2 border-dashed transition-colors ${
                    snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                  {unplannedTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">
                      Alle Aufgaben eingeplant. Ziehe Tasks hierher, um das Datum zu entfernen.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {unplannedTasks.map((task, i) => (
                        <Draggable key={task.id} draggableId={task.id} index={i}>
                          {(prov, snap) => (
                            <WeekTaskCard task={task} innerRef={prov.innerRef}
                              draggableProps={prov.draggableProps} dragHandleProps={prov.dragHandleProps}
                              isDragging={snap.isDragging} />
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Lock size={11} /> Remote = schreibgeschützt</span>
        <span className="flex items-center gap-1"><Copy size={11} /> Kopieren → Atlas-Task</span>
      </div>
    </div>
  );
}