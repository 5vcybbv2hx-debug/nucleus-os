import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Inbox, CheckSquare, Lightbulb, AlertTriangle, MoreVertical, Check, Archive } from 'lucide-react';
import { getOrgMeta } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';

export default function Eingang() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuFor, setMenuFor] = useState(null);

  const load = async () => {
    setLoading(true);
    const [t, i] = await Promise.all([
      base44.entities.Task.list(),
      base44.entities.Idea.list(),
    ]);
    setTasks(t);
    setIdeas(i);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Nur sichtbare + nicht archivierte Aufgaben (Permissions + visibility)
  const visibleTasks = tasks.filter(t => !t.isArchived && t.status !== 'Archiviert' && perms.canViewTask(t));
  const newTasks = visibleTasks.filter(t => t.status === 'Eingang');
  const unclear = visibleTasks.filter(t => t.status === 'Blockiert' || t.status === 'Wartet auf Antwort');
  const newIdeas = ideas.filter(i => i.status === 'Neu' && !i.isArchived);

  const handleTaskAction = async (task, action) => {
    setMenuFor(null);
    if (action === 'plan') {
      const prev = { status: task.status };
      await base44.entities.Task.update(task.id, { status: 'Geplant' });
      await logAudit({ action: 'status_change', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: { status: 'Geplant' } });
    }
    if (action === 'archive') {
      const prev = { status: task.status, isArchived: task.isArchived };
      const upd = { status: 'Archiviert', isArchived: true, archived_at: new Date().toISOString() };
      await base44.entities.Task.update(task.id, upd);
      await logAudit({ action: 'archive', entityType: 'Task', entityId: task.id, previousValue: prev, newValue: upd });
    }
    load();
  };

  const handleIdeaAction = async (idea, action) => {
    setMenuFor(null);
    if (action === 'task') {
      const payload = {
        title: idea.title,
        organization: idea.organization,
        source_type: 'idee',
        source_reference: idea.id,
        status: 'Eingang',
        visibility: 'Team',
      };
      const created = await base44.entities.Task.create(payload);
      await base44.entities.Idea.update(idea.id, { status: 'Als Aufgabe übernommen', converted_task: created.id });
      await logAudit({ action: 'create', entityType: 'Task', entityId: created.id, newValue: payload });
      await logAudit({ action: 'status_change', entityType: 'Idea', entityId: idea.id, previousValue: { status: 'Neu' }, newValue: { status: 'Als Aufgabe übernommen' } });
    }
    if (action === 'park') {
      const prev = { status: idea.status };
      await base44.entities.Idea.update(idea.id, { status: 'Geparkt' });
      await logAudit({ action: 'status_change', entityType: 'Idea', entityId: idea.id, previousValue: prev, newValue: { status: 'Geparkt' } });
    }
    if (action === 'discard') {
      const prev = { status: idea.status };
      await base44.entities.Idea.update(idea.id, { status: 'Verworfen' });
      await logAudit({ action: 'status_change', entityType: 'Idea', entityId: idea.id, previousValue: prev, newValue: { status: 'Verworfen' } });
    }
    load();
  };

  const renderMenu = (item, type) => {
    if (!menuFor || menuFor.id !== item.id) return null;
    const opts = type === 'idea'
      ? [{ k: 'task', label: 'Als Aufgabe übernehmen', icon: Check }, { k: 'park', label: 'Parken', icon: Archive }, { k: 'discard', label: 'Verwerfen', icon: Archive }]
      : [{ k: 'plan', label: 'Einplanen', icon: Check }, { k: 'archive', label: 'Archivieren', icon: Archive }];
    return (
      <div className="absolute right-2 top-10 z-20 bg-popover border border-border rounded-xl shadow-xl py-1 w-44">
        {opts.map(o => {
          const I = o.icon;
          return (
            <button key={o.k} onClick={() => type === 'idea' ? handleIdeaAction(item, o.k) : handleTaskAction(item, o.k)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-left">
              <I size={14} className="text-muted-foreground" /> {o.label}
            </button>
          );
        })}
      </div>
    );
  };

  const Card = ({ children, onMenu }) => (
    <div className="relative p-3.5 bg-card border border-border rounded-2xl mb-2">
      <button onClick={() => setMenuFor(onMenu)} className="absolute top-2.5 right-2.5 p-1.5 hover:bg-secondary rounded-lg">
        <MoreVertical size={16} className="text-muted-foreground" />
      </button>
      {children}
      {renderMenu(onMenu, onMenu.type)}
    </div>
  );

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <Inbox size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Eingang</h1>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><CheckSquare size={16} /> Neue Aufgaben <span className="text-muted-foreground/60 font-normal">({newTasks.length})</span></h2>
            {newTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Keine neuen Aufgaben.</p>
            ) : newTasks.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <Card key={t.id} onMenu={{ id: t.id, type: 'task' }}>
                  <div className="pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${org.chip}`}><span>{org.emoji}</span><span>{org.short}</span></span>
                    </div>
                    <div className="text-sm font-medium">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                  </div>
                </Card>
              );
            })}
          </section>

          <section className="mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Lightbulb size={16} /> Neue Ideen <span className="text-muted-foreground/60 font-normal">({newIdeas.length})</span></h2>
            {newIdeas.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Keine neuen Ideen.</p>
            ) : newIdeas.map(i => {
              const org = getOrgMeta(i.organization);
              return (
                <Card key={i.id} onMenu={{ id: i.id, type: 'idea' }}>
                  <div className="pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${org.chip}`}><span>{org.emoji}</span><span>{org.short}</span></span>
                    </div>
                    <div className="text-sm font-medium">{i.title}</div>
                    {i.raw_input && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.raw_input}</div>}
                  </div>
                </Card>
              );
            })}
          </section>

          <section className="mb-6">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><AlertTriangle size={16} /> Ungeklärte Einträge <span className="text-muted-foreground/60 font-normal">({unclear.length})</span></h2>
            {unclear.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Nichts ungeklärt.</p>
            ) : unclear.map(t => {
              const org = getOrgMeta(t.organization);
              return (
                <Card key={t.id} onMenu={{ id: t.id, type: 'task' }}>
                  <div className="pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={13} className="text-amber-400" />
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${org.chip}`}><span>{org.emoji}</span><span>{org.short}</span></span>
                      <span className="text-[11px] text-amber-400">{t.status}</span>
                    </div>
                    <div className="text-sm font-medium">{t.title}</div>
                  </div>
                </Card>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}