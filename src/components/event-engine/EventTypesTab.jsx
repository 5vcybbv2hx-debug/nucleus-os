import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';

const SEV_DOT = {
  info: 'bg-blue-400',
  normal: 'bg-gray-400',
  wichtig: 'bg-yellow-400',
  kritisch: 'bg-red-400',
};

export default function EventTypesTab() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const data = await base44.entities.EventType.list('display_order', 100);
      setTypes(data || []);
    } catch { setTypes([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return types;
    return types.filter(t =>
      t.name?.toLowerCase().includes(term) ||
      t.key?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term)
    );
  }, [types, q]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const c = t.category || 'Sonstige';
      if (!map[c]) map[c] = [];
      map[c].push(t);
    });
    return map;
  }, [filtered]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Eventtyp suchen…"
          className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat} <span className="font-normal">({items.length})</span></h3>
              <div className="space-y-1.5">
                {items.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base flex-shrink-0">{t.icon || '⚡'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">{t.key}</div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${SEV_DOT[t.severity] || 'bg-gray-400'}`} title={t.severity} />
                    {t.source_system && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground hidden sm:inline">{t.source_system}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.active !== false ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                      {t.active !== false ? 'aktiv' : 'inaktiv'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-8">Keine Eventtypen gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
}