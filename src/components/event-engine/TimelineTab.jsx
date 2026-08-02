import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Archive as ArchiveIcon, Filter, RefreshCw } from 'lucide-react';

const SEVERITY_BADGE = {
  info: { label: 'Info', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  normal: { label: 'Normal', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  wichtig: { label: 'Wichtig', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  kritisch: { label: 'Kritisch', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const ORG_BADGE = {
  BAR: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  EXECUTIVE: 'bg-primary/15 text-primary border-primary/30',
  SANDRA: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

export default function TimelineTab() {
  const [events, setEvents] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [filterSev, setFilterSev] = useState('');
  const [filterSrc, setFilterSrc] = useState('');
  const [hideArchived, setHideArchived] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, ty] = await Promise.all([
        base44.entities.BusinessEvent.list('-occurred_at', 50),
        base44.entities.EventType.list('display_order', 100),
      ]);
      setEvents(ev || []);
      setTypes(ty || []);
    } catch { setEvents([]); setTypes([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const typeByKey = useMemo(() => Object.fromEntries((types || []).map(t => [t.key, t])), [types]);

  const cats = useMemo(() => [...new Set((types || []).map(t => t.category))].sort(), [types]);
  const srcs = useMemo(() => [...new Set((events || []).map(e => e.source_system))].sort(), [events]);

  const filtered = useMemo(() => {
    return (events || []).filter(e => {
      if (hideArchived && e.is_archived) return false;
      if (filterSev && e.severity !== filterSev) return false;
      if (filterSrc && e.source_system !== filterSrc) return false;
      if (filterCat) {
        const t = typeByKey[e.event_type_key];
        if (!t || t.category !== filterCat) return false;
      }
      return true;
    });
  }, [events, hideArchived, filterSev, filterSrc, filterCat, typeByKey]);

  const archive = async (id) => {
    await base44.entities.BusinessEvent.update(id, { is_archived: true, archived_at: new Date().toISOString() });
    load();
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter size={13} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="">Alle Kategorien</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
          className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="">Alle Schwere</option>
          <option value="info">Info</option>
          <option value="normal">Normal</option>
          <option value="wichtig">Wichtig</option>
          <option value="kritisch">Kritisch</option>
        </select>
        <select value={filterSrc} onChange={e => setFilterSrc(e.target.value)}
          className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground">
          <option value="">Alle Quellen</option>
          {srcs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setHideArchived(v => !v)}
          className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
            hideArchived ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'
          }`}>
          Archivierte {hideArchived ? 'ausblenden' : 'anzeigen'}
        </button>
        <button onClick={load} className="ml-auto p-1.5 hover:bg-secondary rounded-lg">
          <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground/60">
          <ArchiveIcon size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Keine Events für diesen Filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(e => {
            const t = typeByKey[e.event_type_key];
            const sev = SEVERITY_BADGE[e.severity] || SEVERITY_BADGE.normal;
            const orgCls = ORG_BADGE[e.organization] || 'bg-secondary text-muted-foreground border-border';
            const meta = e.metadata && typeof e.metadata === 'object' ? Object.entries(e.metadata) : [];
            return (
              <div key={e.id} className={`p-3.5 bg-card border border-border rounded-2xl ${e.is_archived ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                    {t?.icon || '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sev.cls}`}>{sev.label}</span>
                      {e.source_system && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{e.source_system}</span>}
                      {e.organization && <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${orgCls}`}>{e.organization}</span>}
                      {e.is_archived && <span className="text-[10px] bg-gray-500/15 text-gray-400 px-1.5 py-0.5 rounded border border-gray-500/30">archiviert</span>}
                    </div>
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.description && <div className="text-xs text-muted-foreground mt-0.5">{e.description}</div>}
                    {meta.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {meta.map(([k, v]) => (
                          <span key={k} className="text-[11px] text-muted-foreground">
                            <span className="text-muted-foreground/60">{k}:</span>{' '}
                            <span className="text-foreground/80">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground/70 mt-1.5">{fmtTime(e.occurred_at)}</div>
                  </div>
                  {!e.is_archived && (
                    <button onClick={() => archive(e.id)} title="Archivieren"
                      className="p-1.5 hover:bg-secondary rounded-lg flex-shrink-0">
                      <ArchiveIcon size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}