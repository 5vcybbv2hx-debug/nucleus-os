import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Inbox, CheckSquare, Lightbulb, AlertTriangle, MoreVertical, User, Check, Archive, Trash2 } from 'lucide-react';
import { getOrgMeta } from '@/lib/organizations';

export default function Eingang() {
  const [tasks, setTasks] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuFor, setMenuFor] = useState(null); // { type, id }

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

  const newTasks = tasks.filter(t => t.status === 'Eingang' && !t.isArchived);
  const unclear = tasks.filter(t => (t.status === 'Blockiert' || t.status === 'Wartet auf Antwort') && !t.isArchived);
  const newIdeas = ideas.filter(i => i.status === 'Neu');

  const handleTaskAction = async (task, action) => {
    setMenuFor(null);
    if (action === 'plan') await base44.entities.Task.update(task.id, { status: 'Geplant' });
    if (action === 'archive') await base44.entities.Task.update(task.id, { isArchived: true });
    if (action === 'delete') await base44.entities.Task.delete(task.id);
    load();
  };

  const handleIdeaAction = async (idea, action) => {
    setMenuFor(null);
    if (action === 'task') {
      await base44.entities.Task.create({
        title: idea.title,
        organization: idea.organization,
        source_type: 'idee',
        source_reference: idea.id,
        status: 'Eingang',
        visibility: 'Team',
      });
      await base44.entities.Idea.update(idea.id, { status: 'Als Aufgabe übernommen' });
    }
    if (action === 'park') await base44.entities.Idea.update(idea.id, { status: 'Geparkt' });
    if (action === 'discard') await base44.entities.Idea.update(idea.id, { status: 'Verworfen' });
    load();
  };

  const renderMenu = (item, type) => {
    if (!menuFor || menuFor.id !== item.id) return null;
    const opts = type === 'idea'
      ? [{ k: 'task', label: 'Als Aufgabe übernehmen', icon: Check }, { k: 'park', label: 'Parken', icon: Archive }, { k: 'discard', label: 'Verwerfen', icon: Trash2 }]
      : [{ k: 'plan', label: 'Einplanen', icon: Check }, { k: 'archive', label: 'Archivieren', icon: Archive }, { k: 'delete', label: 'Löschen', icon: Trash2 }];
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
          {/* New Tasks */}
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
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}>{org.emoji} {org.short}</span>
                    </div>
                    <div className="text-sm font-medium">{t.title}</div>
                    {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                  </div>
                </Card>
              );
            })}
          </section>

          {/* New Ideas */}
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
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}>{org.emoji} {org.short}</span>
                    </div>
                    <div className="text-sm font-medium">{i.title}</div>
                    {i.raw_input && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.raw_input}</div>}
                  </div>
                </Card>
              );
            })}
          </section>

          {/* Unclear */}
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
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] ${org.chip}`}>{org.emoji} {org.short}</span>
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