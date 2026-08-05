import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Sunrise, Battery, Zap as ZapIcon, Sparkles,
  ArrowRight, Circle, AlertTriangle, Clock,
  Beer, Wallet, Briefcase, Compass,
} from 'lucide-react';
import TaskCard from '@/components/atlas/TaskCard';
import TaskCompleteModal from '@/components/atlas/TaskCompleteModal';
import { calculatePriority, getOrgMeta } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';
import { Link } from 'react-router-dom';

const GREETINGS = [
  { h: [5,6,7,8,9,10], label: 'Guten Morgen', icon: Sunrise },
  { h: [11,12,13,14,15,16], label: 'Guten Tag', icon: Battery },
  { h: [17,18,19,20], label: 'Guten Abend', icon: ZapIcon },
  { h: [21,22,23,0,1,2,3,4], label: 'Gute Nacht', icon: Sparkles },
];

const todayStr = () => new Date().toISOString().substring(0, 10);

export default function Heute() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeTask, setCompleteTask] = useState(null);
  const [barInsights, setBarInsights] = useState([]);
  const [barMode, setBarMode] = useState('read_only');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch { setTasks([]); }
    setLoading(false);
  }, []);

  const loadBarData = useCallback(async () => {
    try {
      const insights = await base44.entities.ExternalInsight.filter({
        organization: 'BAR', status: 'active'
      });
      let connection = null;
      try {
        const conns = await base44.entities.IntegrationConnection.filter({
          source_app: '695532713e60f5ccfc3522b9'
        });
        connection = conns?.[0] || null;
      } catch {}
      const validInsights = insights || [];
      const lastSync = connection?.last_success_at || connection?.last_sync_at;
      const isStale = validInsights.length === 0 || !lastSync ||
        (Date.now() - new Date(lastSync).getTime()) > 7200000;
      const mode = connection?.enabled === false ? 'disabled'
        : isStale ? 'stale' : 'read_only';
      setBarInsights(validInsights);
      setBarMode(mode);
    } catch { setBarInsights([]); setBarMode('stale'); }
  }, []);

  useEffect(() => { loadTasks(); loadBarData(); }, [loadTasks, loadBarData]);

  const hour = new Date().getHours();
  const greet = GREETINGS.find(g => g.h.includes(hour)) || GREETINGS[0];
  const GreetIcon = greet.icon;
  const firstName = perms.user?.full_name?.split(' ')[0] || '';

  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isArchived && t.status !== 'Archiviert' && perms.canViewTask(t))
      .map(t => ({ ...t, calculated_priority: t.calculated_priority ?? calculatePriority(t) }));
  }, [tasks, perms]);

  const activeTasks = useMemo(() => {
    return visibleTasks
      .filter(t => t.status !== 'Erledigt' && t.status !== 'Nicht mehr notwendig')
      .sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));
  }, [visibleTasks]);

  const nowTask = activeTasks[0] || null;
  const nextTasks = activeTasks.slice(1, 4);
  const decisions = visibleTasks.filter(t => t.status === 'Zur Prüfung').slice(0, 3);
  const blocked = visibleTasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort').slice(0, 3);

  // --- LAGEBILD ---
  const lagebild = useMemo(() => {
    const parts = [`${greet.label}${firstName ? ', ' + firstName : ''}.`];
    if (barInsights.length > 0 && barMode === 'read_only') parts.push('Die Bar läuft stabil.');
    else if (barMode === 'stale') parts.push('Bar-Status zuletzt vor einiger Zeit aktualisiert.');
    else if (barMode === 'disabled') parts.push('Bar-Integration ist deaktiviert.');
    if (decisions.length > 0) parts.push(`${decisions.length} ${decisions.length === 1 ? 'Aufgabe wartet' : 'Aufgaben warten'} auf deine Freigabe.`);
    if (blocked.length > 0) parts.push(`${blocked.length} ${blocked.length === 1 ? 'Eintrag ist' : 'Einträge sind'} blockiert.`);
    if (activeTasks.length === 0 && decisions.length === 0 && blocked.length === 0) {
      parts.push('Alles ruhig. Genieß den Tag.');
    } else if (decisions.length === 0 && blocked.length === 0 && activeTasks.length > 0) {
      parts.push('Heute gibt es keine kritischen Probleme.');
    }
    return parts.join(' ');
  }, [greet, firstName, barInsights, barMode, decisions, blocked, activeTasks]);

  const handleStartNow = async (task) => {
    if (task.status === 'Eingang' || task.status === 'Geplant') {
      const prev = { status: task.status };
      await base44.entities.Task.update(task.id, { status: 'In Bearbeitung' });
      await logAudit({ action: 'status_change', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: { status: 'In Bearbeitung' } });
      loadTasks();
    }
    setCompleteTask(task);
  };

  const handleCheckDecision = async (task) => {
    const prev = { status: task.status };
    await base44.entities.Task.update(task.id, { status: 'In Bearbeitung' });
    await logAudit({ action: 'status_change', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: { status: 'In Bearbeitung' } });
    loadTasks();
  };

  if (perms.role === 'buero') {
    return (
      <BueroView perms={perms} tasks={visibleTasks} loading={loading} greet={greet} GreetIcon={GreetIcon}
        onReload={loadTasks} completeTask={completeTask} setCompleteTask={setCompleteTask} />
    );
  }

  const colorMap = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  const statusCards = [
    { label: 'Bar', icon: Beer, state: barMode === 'read_only' ? 'stabil' : barMode === 'stale' ? 'veraltet' : barMode === 'disabled' ? 'inaktiv' : '—', color: barMode === 'read_only' ? 'emerald' : barMode === 'stale' ? 'amber' : 'red', link: null, detail: barInsights.length > 0 ? `${barInsights.length} Insights` : null },
    { label: 'Finanzen', icon: Wallet, state: 'stabil', color: 'emerald', link: '/unternehmen' },
    { label: 'Sandra', icon: Briefcase, state: 'aktiv', color: 'emerald', link: '/team' },
    { label: 'Atlas', icon: Compass, state: activeTasks.length > 0 ? `${activeTasks.length} offen` : 'ruhig', color: activeTasks.length > 5 ? 'amber' : 'emerald', link: '/arbeit' },
  ];

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-3xl mx-auto">
      {/* === 1. Lagebild === */}
      <div className="mb-8">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
        </div>
        <div className="flex items-start gap-3">
          <GreetIcon size={22} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-base lg:text-lg leading-relaxed text-foreground">{lagebild}</p>
        </div>
      </div>

      {/* === 2. Jetzt === */}
      <div className="mb-8">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Jetzt</div>
        {loading ? (
          <div className="h-28 bg-card rounded-2xl animate-pulse" />
        ) : nowTask ? (
          <div className="p-5 bg-card border border-border rounded-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground leading-tight">{nowTask.title}</p>
                {nowTask.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{nowTask.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {nowTask.estimated_duration && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> ca. {nowTask.estimated_duration} Min
                    </span>
                  )}
                  {nowTask.organization && (() => {
                    const org = getOrgMeta(nowTask.organization);
                    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>;
                  })()}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleStartNow(nowTask)}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-h-[48px]"
            >
              Jetzt erledigen
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="p-6 bg-card border border-border rounded-2xl text-center">
            <Sparkles size={28} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nichts Dringendes offen.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Genieß die Ruhe.</p>
          </div>
        )}
      </div>

      {/* === 3. Danach === */}
      <div className="mb-8">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Danach</div>
        {nextTasks.length === 0 && decisions.length === 0 && blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 px-1">Keine weiteren Prioritäten.</p>
        ) : (
          <div className="space-y-2">
            {decisions.map(task => (
              <div key={task.id} className="p-3.5 bg-card border border-border rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-[11px] text-amber-400">Wartet auf Freigabe</p>
                </div>
                <button onClick={() => handleCheckDecision(task)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0">
                  Prüfen
                </button>
              </div>
            ))}
            {blocked.map(task => (
              <div key={task.id} className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
                <Circle size={16} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-[11px] text-amber-400">{task.status}</p>
                </div>
              </div>
            ))}
            {nextTasks.map(task => <TaskCard key={task.id} task={task} onComplete={setCompleteTask} />)}
          </div>
        )}
      </div>

      {/* === 4. Unternehmensstatus === */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Unternehmensstatus</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statusCards.map(card => {
            const Icon = card.icon;
            const dotColor = colorMap[card.color] || 'bg-muted-foreground';
            return (
              <Link key={card.label} to={card.link || '#'}
                className={`p-4 bg-card border border-border rounded-2xl transition-all ${card.link ? 'hover:border-primary/30 hover:bg-primary/5' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={15} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-sm font-semibold">{card.state}</span>
                </div>
                {card.detail && <p className="text-[11px] text-muted-foreground mt-1">{card.detail}</p>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bar-Details (nur Pierre, einklappbar) */}
      {perms.isPierre && barInsights.length > 0 && (
        <div className="mb-4">
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none flex items-center gap-1">
              <Beer size={13} /> Bar-Details ({barInsights.length})
            </summary>
            <div className="mt-2 space-y-1.5">
              {barInsights.slice(0, 5).map((ins, i) => (
                <div key={ins.external_reference || i} className="p-2.5 bg-card border border-border rounded-lg flex items-start gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    ins.severity === 'critical' ? 'bg-red-500' : ins.severity === 'high' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ins.title}</p>
                    {ins.summary && <p className="text-[11px] text-muted-foreground line-clamp-1">{ins.summary}</p>}
                  </div>
                </div>
              ))}
              <a href="https://app.base44.com/apps/695532713e60f5ccfc3522b9/editor/preview" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                SAVO öffnen <ArrowRight size={12} />
              </a>
            </div>
          </details>
        </div>
      )}

      {completeTask && <TaskCompleteModal task={completeTask} onClose={() => { setCompleteTask(null); loadTasks(); }} />}
    </div>
  );
}

// --- Büro-Ansicht (Johanna) ---
function BueroView({ perms, tasks, loading, greet, GreetIcon, onReload, completeTask, setCompleteTask }) {
  const firstName = perms.user?.full_name?.split(' ')[0] || '';
  const myTasks = tasks.filter(t => t.status !== 'Erledigt' && t.status !== 'Archiviert').slice(0, 5);
  const pendingApproval = tasks.filter(t => t.status === 'Zur Prüfung').slice(0, 3);

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
        </div>
        <div className="flex items-start gap-3">
          <GreetIcon size={22} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-base lg:text-lg leading-relaxed text-foreground">
            {greet.label}{firstName ? ', ' + firstName : ''}.{' '}
            {myTasks.length > 0 ? `Du hast ${myTasks.length} offene Aufgaben.` : 'Dein Tag ist frei.'}
            {pendingApproval.length > 0 && ` ${pendingApproval.length} warten auf Freigabe.`}
          </p>
        </div>
      </div>

      {myTasks[0] && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Jetzt</div>
          <div className="p-5 bg-card border border-border rounded-2xl">
            <p className="text-lg font-semibold mb-3">{myTasks[0].title}</p>
            <button onClick={() => setCompleteTask(myTasks[0])}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 min-h-[48px]">
              Jetzt erledigen <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {myTasks.length > 1 && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Danach</div>
          <div className="space-y-2">
            {myTasks.slice(1).map(t => <TaskCard key={t.id} task={t} onComplete={setCompleteTask} />)}
          </div>
        </div>
      )}

      {completeTask && <TaskCompleteModal task={completeTask} onClose={() => { setCompleteTask(null); onReload(); }} />}
    </div>
  );
}
