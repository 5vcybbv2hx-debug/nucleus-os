import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, AlertTriangle, Calendar, Database } from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="p-3.5 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={accent} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function StatsTab() {
  const [events, setEvents] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [ev, ty] = await Promise.all([
        base44.entities.BusinessEvent.list('-occurred_at', 500),
        base44.entities.EventType.list('display_order', 100),
      ]);
      setEvents(ev || []);
      setTypes(ty || []);
    } catch { setEvents([]); setTypes([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const typeByKey = useMemo(() => Object.fromEntries((types || []).map(t => [t.key, t])), [types]);

  const stats = useMemo(() => {
    const all = events || [];
    const total = all.length;
    const critical = all.filter(e => e.severity === 'kritisch').length;
    const today = new Date().toISOString().substring(0, 10);
    const todayCount = all.filter(e => (e.occurred_at || '').substring(0, 10) === today).length;

    const byCategory = {};
    const bySource = {};
    all.forEach(e => {
      const t = typeByKey[e.event_type_key];
      const cat = t?.category || 'Unbekannt';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      bySource[e.source_system || '—'] = (bySource[e.source_system || '—'] || 0) + 1;
    });

    return { total, critical, todayCount, byCategory, bySource };
  }, [events, typeByKey]);

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Activity} label="Gesamt Events" value={stats.total} accent="text-primary" />
        <StatCard icon={AlertTriangle} label="Kritische Events" value={stats.critical} accent="text-red-400" />
        <StatCard icon={Calendar} label="Events heute" value={stats.todayCount} accent="text-yellow-400" />
        <StatCard icon={Database} label="Eventtypen" value={(types || []).length} accent="text-emerald-400" />
      </div>

      {/* By Category */}
      <div className="p-3.5 bg-card border border-border rounded-2xl">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Events pro Kategorie</h3>
        {Object.keys(stats.byCategory).length === 0 ? (
          <p className="text-xs text-muted-foreground/60">Keine Daten.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground/80">{cat}</span>
                  <span className="text-muted-foreground">{n}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(n / stats.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Source */}
      <div className="p-3.5 bg-card border border-border rounded-2xl">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Events pro Quelle</h3>
        {Object.keys(stats.bySource).length === 0 ? (
          <p className="text-xs text-muted-foreground/60">Keine Daten.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]).map(([src, n]) => (
              <span key={src} className="text-xs bg-secondary px-2 py-1 rounded-lg">
                {src} <span className="text-primary font-semibold ml-1">{n}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}