import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { FolderOpen, Plus, Search, Loader2 } from 'lucide-react';
import { STATUS_BADGE, PRIORITY_BADGE, orgBadge } from '@/lib/caseHelpers';

const STATUS_OPTIONS = ['Alle', 'Aktiv', 'Entwurf', 'Wartet', 'Blockiert', 'Abgeschlossen', 'Archiviert'];
const ORG_OPTIONS = ['Alle', 'BAR', 'FAMILIE', 'EXECUTIVE', 'IMMO', 'PRIVAT_FAMILIE', 'NEBENGEWERBE'];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [orgFilter, setOrgFilter] = useState('Alle');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [search, setSearch] = useState('');
  const [hideArchived, setHideArchived] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([
          base44.entities.Case.filter({}, '-created_date', 50),
          base44.entities.CaseType.filter({ active: true }, 'display_order', 50),
        ]);
        setCases(c || []);
        setCaseTypes(t || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const typeMap = useMemo(() => Object.fromEntries(caseTypes.map(t => [t.key, t])), [caseTypes]);

  const filtered = useMemo(() => {
    return cases.filter(c => {
      if (statusFilter !== 'Alle' && c.status !== statusFilter) return false;
      if (orgFilter !== 'Alle' && c.organization !== orgFilter) return false;
      if (typeFilter !== 'Alle' && c.case_type_key !== typeFilter) return false;
      if (hideArchived && c.is_archived) return false;
      if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cases, statusFilter, orgFilter, typeFilter, search, hideArchived]);

  return (
    <div className="px-4 pt-6 pb-28 lg:px-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FolderOpen size={22} className="text-primary" />
          <h1 className="text-xl font-semibold">Vorgänge</h1>
        </div>
        <button onClick={() => alert('Neuer Vorgang — folgt in Paket 3C')}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Neu
        </button>
      </div>

      {/* Filter */}
      <div className="space-y-2.5 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Titel suchen…"
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-card border border-border rounded-xl text-sm py-2.5 px-2">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'Alle' ? 'Status' : s}</option>)}
          </select>
          <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} className="bg-card border border-border rounded-xl text-sm py-2.5 px-2">
            {ORG_OPTIONS.map(o => <option key={o} value={o}>{o === 'Alle' ? 'Org' : o}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-card border border-border rounded-xl text-sm py-2.5 px-2">
            <option value="Alle">Typ</option>
            {caseTypes.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={hideArchived} onChange={e => setHideArchived(e.target.checked)} className="accent-primary" />
          Archivierte ausblenden
        </label>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 text-center py-10">Keine Vorgänge gefunden.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(c => {
            const type = typeMap[c.case_type_key];
            const st = STATUS_BADGE[c.status] || STATUS_BADGE.Entwurf;
            const pr = PRIORITY_BADGE[c.priority] || PRIORITY_BADGE.mittel;
            const org = orgBadge(c.organization);
            return (
              <Link key={c.id} to={`/cases/${c.id}`}
                className="block p-3.5 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl flex-shrink-0">{type?.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    {c.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.description}</div>}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pr.cls}`}>{pr.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${org.cls}`}>{org.label}</span>
                      {c.owner && <span className="text-[10px] text-muted-foreground">· {c.owner}</span>}
                    </div>
                    {c.business_value && <div className="text-[11px] text-muted-foreground/70 mt-1">💼 {c.business_value}</div>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}