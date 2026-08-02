import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Settings2, Loader2, Plus, Archive } from 'lucide-react';
import { STATUS_BADGE, PRIORITY_BADGE, orgBadge, fmtDateTime } from '@/lib/caseHelpers';

const TABS = [
  { key: 'overview', label: 'Übersicht' },
  { key: 'types', label: 'Typen' },
  { key: 'relations', label: 'Beziehungen' },
  { key: 'stats', label: 'Statistik' },
  { key: 'archive', label: 'Archiv' },
];

export default function CaseEngine() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="px-4 pt-6 pb-28 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <Settings2 size={22} className="text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Case Engine</h1>
          <div className="text-xs text-muted-foreground">Verwaltung der Vorgangs-Engine</div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'types' && <TypesTab />}
      {tab === 'relations' && <RelationsTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'archive' && <ArchiveTab />}
    </div>
  );
}

function OverviewTab() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { setCases(await base44.entities.Case.filter({}, '-created_date', 50)); } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <Loader />;
  return (
    <div>
      <button onClick={() => alert('Neuer Vorgang — folgt in 3C')}
        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium mb-3">
        <Plus size={16} /> Neuer Vorgang
      </button>
      <div className="space-y-2">
        {cases.map(c => {
          const st = STATUS_BADGE[c.status] || STATUS_BADGE.Entwurf;
          const org = orgBadge(c.organization);
          return (
            <Link key={c.id} to={`/cases/${c.id}`} className="block p-3 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{c.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${org.cls}`}>{org.label}</span>
                <span className="text-[10px] text-muted-foreground">{c.owner || '—'}</span>
                <span className="text-[10px] text-muted-foreground/60">· {fmtDateTime(c.created_date)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TypesTab() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { setTypes(await base44.entities.CaseType.filter({}, 'display_order', 50)); } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <Loader />;
  return (
    <div className="space-y-1.5">
      {types.map(t => (
        <div key={t.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
          <span className="text-xl">{t.icon || '📁'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{t.name}</div>
            <div className="text-[11px] text-muted-foreground">{t.key}</div>
          </div>
          <span className="text-[10px] text-muted-foreground">Std: {t.default_status || '—'}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
            {t.active ? 'aktiv' : 'inaktiv'}
          </span>
        </div>
      ))}
    </div>
  );
}

function RelationsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const rels = await base44.entities.CaseRelation.filter({});
        const all = await base44.entities.Case.filter({}, '-created_date', 500);
        const map = Object.fromEntries(all.map(c => [c.id, c]));
        setRows(rels.map(r => ({ ...r, a: map[r.case_id], b: map[r.related_case_id] })));
      } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <Loader />;
  if (rows.length === 0) return <div className="p-4 border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground/60">Keine Beziehungen.</div>;
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.id} className="p-3 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-medium truncate">{r.a?.title || r.case_id}</span>
            <span className="text-primary">{r.relation_type}</span>
            <span className="text-muted-foreground">→</span>
            <Link to={`/cases/${r.related_case_id}`} className="font-medium truncate text-primary hover:underline">{r.b?.title || r.related_case_id}</Link>
          </div>
          {r.description && <div className="text-[11px] text-muted-foreground/70 mt-1">{r.description}</div>}
        </div>
      ))}
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const cases = await base44.entities.Case.filter({}, '-created_date', 500);
        const types = await base44.entities.CaseType.filter({}, 'display_order', 50);
        const byType = {}, byOrg = {}, byStatus = {};
        cases.forEach(c => {
          byType[c.case_type_key] = (byType[c.case_type_key] || 0) + 1;
          byOrg[c.organization] = (byOrg[c.organization] || 0) + 1;
          byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        });
        setStats({ total: cases.length, active: cases.filter(c => c.status === 'Aktiv').length, blocked: cases.filter(c => c.status === 'Blockiert').length, byType, byOrg, byStatus, typeMap: Object.fromEntries(types.map(t => [t.key, t])) });
      } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <Loader />;
  if (!stats) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Gesamt" value={stats.total} />
        <Stat label="Aktiv" value={stats.active} cls="text-green-400" />
        <Stat label="Blockiert" value={stats.blocked} cls="text-red-400" />
      </div>
      <Group title="Pro CaseType" data={stats.byType} labelMap={(k) => stats.typeMap[k]?.name || k} />
      <Group title="Pro Organization" data={stats.byOrg} />
      <Group title="Pro Status" data={stats.byStatus} />
    </div>
  );
}

function ArchiveTab() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { setCases(await base44.entities.Case.filter({ is_archived: true })); } catch {}
      setLoading(false);
    })();
  }, []);
  if (loading) return <Loader />;
  if (cases.length === 0) return <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/60"><Archive size={28} /><span className="text-sm">Keine archivierten Vorgänge.</span></div>;
  return (
    <div className="space-y-2">
      {cases.map(c => {
        const org = orgBadge(c.organization);
        return (
          <Link key={c.id} to={`/cases/${c.id}`} className="block p-3 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors opacity-70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{c.title}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${org.cls}`}>{org.label}</span>
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">Archiviert: {fmtDateTime(c.archived_at)}</div>
          </Link>
        );
      })}
    </div>
  );
}

function Stat({ label, value, cls }) {
  return (
    <div className="p-3 bg-card border border-border rounded-2xl text-center">
      <div className={`text-2xl font-bold ${cls || ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Group({ title, data, labelMap }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground font-medium mb-2">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-xl">
            <span className="text-xs">{labelMap ? labelMap(k) : k}</span>
            <span className="text-sm font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
}