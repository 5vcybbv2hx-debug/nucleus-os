import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, AlertCircle, Briefcase, User, ShieldAlert, Plus, Archive, Edit3 } from 'lucide-react';
import {
  STATUS_BADGE, PRIORITY_BADGE, RISK_BADGE, VISIBILITY_BADGE, PARTICIPANT_ROLE_BADGE,
  TIMELINE_ICONS, orgBadge, fmtDateTime,
} from '@/lib/caseHelpers';

const TABS = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'tasks', label: 'Aufgaben' },
  { key: 'events', label: 'Events' },
  { key: 'participants', label: 'Beteiligte' },
  { key: 'relations', label: 'Beziehungen' },
  { key: 'history', label: 'Historie' },
];

export default function CaseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('timeline');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [caseData, caseTypes] = await Promise.all([
          base44.entities.Case.get(id),
          base44.entities.CaseType.filter({}, 'display_order', 50),
        ]);
        const [participants, timeline, statusHistory, relations, subCases, tasks, events] = await Promise.all([
          base44.entities.CaseParticipant.filter({ case_id: id, active: true }),
          base44.entities.CaseTimeline.filter({ case_id: id }, '-created_date', 50),
          base44.entities.CaseStatusHistory.filter({ case_id: id }, '-created_date', 20),
          base44.entities.CaseRelation.filter({ case_id: id }),
          base44.entities.Case.filter({ parent_case: id }),
          base44.entities.Task.filter({ parent_case: id }),
          base44.entities.BusinessEvent.filter({ case_id: id }),
        ]);
        if (!alive) return;
        const typeMap = Object.fromEntries(caseTypes.map(t => [t.key, t]));
        // resolve related case titles
        const relIds = relations.map(r => r.related_case_id).filter(Boolean);
        let relatedCases = [];
        if (relIds.length) {
          relatedCases = await Promise.all(relIds.map(rid => base44.entities.Case.get(rid).catch(() => null)));
        }
        setData({
          caseData, type: typeMap[caseData.case_type_key], participants, timeline, statusHistory,
          relations, subCases: subCases || [], tasks: tasks || [], events: events || [],
          relatedCases: relatedCases.filter(Boolean),
        });
      } catch (e) { if (alive) setError(e?.message || 'Fehler beim Laden'); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>;
  }
  if (error || !data) {
    return (
      <div className="px-4 pt-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>{error || 'Vorgang nicht gefunden.'}</div>
        </div>
        <Link to="/cases" className="inline-flex items-center gap-1 text-sm text-primary mt-4"><ArrowLeft size={15} /> Zurück</Link>
      </div>
    );
  }

  const { caseData: c, type, participants, timeline, statusHistory, relations, subCases, tasks, events, relatedCases } = data;
  const st = STATUS_BADGE[c.status] || STATUS_BADGE.Entwurf;
  const pr = PRIORITY_BADGE[c.priority] || PRIORITY_BADGE.mittel;
  const rk = RISK_BADGE[c.risk_level] || RISK_BADGE.niedrig;
  const org = orgBadge(c.organization);
  const visCls = VISIBILITY_BADGE[c.visibility] || 'bg-secondary text-muted-foreground border-border';
  const relatedMap = Object.fromEntries(relatedCases.map(r => [r.id, r]));

  return (
    <div className="px-4 pt-6 pb-28 lg:px-8">
      <Link to="/cases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
        <ArrowLeft size={14} /> Vorgänge
      </Link>

      {/* Header */}
      <div className="p-4 bg-card border border-border rounded-2xl mb-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">{type?.icon || '📁'}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold leading-tight">{c.title}</h1>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pr.cls}`}>{pr.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${org.cls}`}>{org.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${visCls}`}>{c.visibility}</span>
            </div>
          </div>
        </div>
        {c.description && <p className="text-sm text-muted-foreground mt-3">{c.description}</p>}
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground"><User size={13} /> {c.owner || '—'}</div>
          {c.business_value && <div className="flex items-center gap-1.5 text-muted-foreground"><Briefcase size={13} /> {c.business_value}</div>}
          <div className="flex items-center gap-1.5"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${rk.cls}`}>{rk.label}</span></div>
          <div className="text-muted-foreground/70">Typ: {type?.name || c.case_type_key}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Tab Inhalt */}
      {tab === 'timeline' && (
        <div className="space-y-2">
          {timeline.length === 0 ? (
            <Empty text="Keine Timeline-Einträge." />
          ) : timeline.map(e => (
            <div key={e.id} className="p-3 bg-card border border-border rounded-2xl flex items-start gap-2.5">
              <span className="text-lg flex-shrink-0">{TIMELINE_ICONS[e.entry_type] || '•'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{e.title}</div>
                {e.description && <div className="text-xs text-muted-foreground mt-0.5">{e.description}</div>}
                <div className="text-[10px] text-muted-foreground/60 mt-1">{fmtDateTime(e.created_date)} · {e.source_system || 'MANUAL'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        tasks.length === 0
          ? <Empty text="Noch keine Aufgaben zugeordnet — kommt in Paket 3C" />
          : <div className="space-y-2">{tasks.map(t => (
              <div key={t.id} className="p-3 bg-card border border-border rounded-2xl">
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.status} · {t.priority}</div>
              </div>
            ))}</div>
      )}

      {tab === 'events' && (
        events.length === 0
          ? <Empty text="Noch keine Events verknüpft" />
          : <div className="space-y-2">{events.map(ev => (
              <div key={ev.id} className="p-3 bg-card border border-border rounded-2xl">
                <div className="text-sm font-medium">{ev.title}</div>
                {ev.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</div>}
                <div className="text-[10px] text-muted-foreground/60 mt-1">{ev.severity} · {ev.source_system} · {fmtDateTime(ev.occurred_at)}</div>
              </div>
            ))}</div>
      )}

      {tab === 'participants' && (
        participants.length === 0
          ? <Empty text="Keine Beteiligten." />
          : <div className="space-y-2">{participants.map(p => {
              const role = PARTICIPANT_ROLE_BADGE[p.role] || PARTICIPANT_ROLE_BADGE.contributor;
              return (
                <div key={p.id} className="p-3 bg-card border border-border rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {p.user_reference?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{p.user_reference}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${role.cls}`}>{role.label}</span>
                </div>
              );
            })}</div>
      )}

      {tab === 'relations' && (
        <div className="space-y-3">
          {relations.length === 0 && subCases.length === 0 ? <Empty text="Keine Beziehungen." /> : (
            <>
              {relations.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2">Verknüpfte Vorgänge</div>
                  <div className="space-y-2">
                    {relations.map(r => {
                      const rc = relatedMap[r.related_case_id];
                      return (
                        <Link key={r.id} to={`/cases/${r.related_case_id}`} className="block p-3 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Dieser</span>
                            <span className="text-primary font-medium">{r.relation_type}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium flex-1 truncate">{rc?.title || r.related_case_id}</span>
                          </div>
                          {r.description && <div className="text-[11px] text-muted-foreground/70 mt-1">{r.description}</div>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {subCases.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-2">Untergeordnete Vorgänge</div>
                  <div className="space-y-2">
                    {subCases.map(sc => {
                      const sst = STATUS_BADGE[sc.status] || STATUS_BADGE.Entwurf;
                      return (
                        <Link key={sc.id} to={`/cases/${sc.id}`} className="block p-3 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">{sc.title}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sst.cls}`}>{sst.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        statusHistory.length === 0
          ? <Empty text="Keine Status-Historie." />
          : <div className="space-y-2">{statusHistory.map(h => (
              <div key={h.id} className="p-3 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{h.from_status || '—'}</span>
                  <span className="text-primary">→</span>
                  <span className="font-medium">{h.to_status}</span>
                </div>
                {h.reason && <div className="text-xs text-muted-foreground mt-1">{h.reason}</div>}
                <div className="text-[10px] text-muted-foreground/60 mt-1">{h.changed_by || '—'} · {fmtDateTime(h.created_date)}</div>
              </div>
            ))}</div>
      )}

      {/* Aktionen */}
      <div className="fixed bottom-[72px] left-0 right-0 px-4 lg:left-[280px] z-30">
        <div className="max-w-lg mx-auto flex gap-2">
          <ActionBtn icon={Edit3} label="Status ändern" onClick={() => alert('Status ändern — folgt in 3C')} />
          <ActionBtn icon={Plus} label="Notiz" onClick={() => alert('Notiz hinzufügen — folgt in 3C')} />
          {!c.is_archived && <ActionBtn icon={Archive} label="Archivieren" danger onClick={() => alert('Archivieren — folgt in 3C')} />}
        </div>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-4 border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground/60">{text}</div>;
}

function ActionBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
        danger ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
               : 'bg-card text-foreground border-border hover:bg-secondary'
      }`}>
      <Icon size={14} /> {label}
    </button>
  );
}