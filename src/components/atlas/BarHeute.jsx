import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Beer, AlertTriangle, RefreshCw, ExternalLink, Activity } from 'lucide-react';
import { SEVERITY_ORDER, INTEGRATION_MODES } from '@/lib/constants';

const BAR_APP_URL = 'https://app.base44.com/apps/695532713e60f5ccfc3522b9/editor/preview';

const MODE_BADGE = {
  [INTEGRATION_MODES.READ_ONLY]: { label: 'LIVE', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  [INTEGRATION_MODES.STALE]: { label: 'VERALTET', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  [INTEGRATION_MODES.MOCK]: { label: 'TESTDATEN', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  [INTEGRATION_MODES.DISABLED]: { label: 'DEAKTIVIERT', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const SEVERITY_BADGE = {
  critical: { label: 'Kritisch', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { label: 'Hoch', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  medium: { label: 'Mittel', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  warning: { label: 'Warnung', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  info: { label: 'Info', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

export default function BarHeute() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('barAdapter', { action: 'getBarSnapshot' });
      setData(res.data || res);
    } catch (e) {
      setError(e?.message || 'Verbindung zur Bar-App fehlgeschlagen');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mode = data?.mode;
  const snapshot = data?.snapshot || {};
  const connection = data?.connection || {};
  const badge = MODE_BADGE[mode] || MODE_BADGE[INTEGRATION_MODES.MOCK];

  // Alle Insights zusammenführen und nach Severity sortieren
  const allInsights = [
    ...(snapshot.insights || []),
    ...((snapshot.staffing && snapshot.staffing.insights) || []),
    ...((snapshot.events && snapshot.events.insights) || []),
    ...((snapshot.reservations && snapshot.reservations.insights) || []),
  ].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Beer size={16} className="text-bar" /> Bar-Integration</h2>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
          <button onClick={load} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <RefreshCw size={13} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : error ? (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Bar-App nicht erreichbar</div>
            <div className="opacity-70 mt-0.5">{error}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Verbindung-Status */}
          <div className="p-3 bg-card border border-border rounded-2xl flex items-center gap-3">
            <Activity size={15} className="text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{connection.name || 'SAVO Bar-App'} · {connection.source_app || 'BAR'}</div>
              <div className="text-[11px] text-muted-foreground">Letzte Sync: {fmtTime(connection.last_sync_at || data.lastSync)}</div>
            </div>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">nur lesend</span>
          </div>

          {/* Stale-Warnung */}
          {mode === INTEGRATION_MODES.STALE && (
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[11px] text-yellow-400 flex items-center gap-2">
              <AlertTriangle size={13} className="flex-shrink-0" />
              Daten möglicherweise veraltet — letzte Aktualisierung: {fmtTime(connection.last_success_at || connection.last_sync_at)}
            </div>
          )}

          {/* Insights */}
          {allInsights.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Keine Insights aus der Bar-App.</p>
          ) : (
            <div className="space-y-2">
              {allInsights.slice(0, 8).map((ins, i) => {
                const sev = SEVERITY_BADGE[ins.severity] || SEVERITY_BADGE.info;
                return (
                  <div key={ins.externalId || i} className="p-3 bg-card border border-border rounded-2xl">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sev.cls}`}>{sev.label}</span>
                      {ins.type && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{ins.type}</span>}
                      <span className="text-[10px] text-bar bg-bar/10 px-1.5 py-0.5 rounded">BAR</span>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">SAVO</span>
                    </div>
                    <div className="text-sm font-medium">{ins.title}</div>
                    {ins.summary && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.summary}</div>}
                    {ins.effectiveDate && <div className="text-[11px] text-muted-foreground/70 mt-1">Gültig ab: {fmtTime(ins.effectiveDate)}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Deep Link */}
          <a href={BAR_APP_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline py-1">
            <ExternalLink size={13} /> SAVO Bar-App öffnen
          </a>
        </div>
      )}
    </section>
  );
}