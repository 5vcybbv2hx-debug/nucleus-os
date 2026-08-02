import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Beer, AlertTriangle, RefreshCw, ExternalLink, Activity } from 'lucide-react';

const BAR_APP_URL = 'https://app.base44.com/apps/695532713e60f5ccfc3522b9/editor/preview';
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 Stunden

const MODE_BADGE = {
  read_only: { label: 'LIVE', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  stale: { label: 'VERALTET', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  mock: { label: 'TESTDATEN', cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  disabled: { label: 'DEAKTIVIERT', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const SEVERITY_BADGE = {
  critical: { label: 'Kritisch', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { label: 'Hoch', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  medium: { label: 'Mittel', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  warning: { label: 'Warnung', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  info: { label: 'Info', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const SEVERITY_ORDER = { critical: 0, high: 1, warning: 2, info: 3 };

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
      const insights = await base44.entities.ExternalInsight.filter({
        organization: 'BAR',
        status: 'active'
      });
      let connection = null;
      try {
        const conns = await base44.entities.IntegrationConnection.filter({
          source_app: '695532713e60f5ccfc3522b9'
        });
        connection = conns?.[0] || null;
      } catch (e) {}

      const validInsights = insights || [];
      const lastSync = connection?.last_success_at || connection?.last_sync_at;
      const isStale = validInsights.length === 0 || !lastSync ||
        (Date.now() - new Date(lastSync).getTime()) > 7200000;

      const mode = connection?.enabled === false ? 'disabled'
        : isStale ? 'stale' : 'read_only';

      const sortedInsights = validInsights
        .map(i => ({
          type: i.type || i.insight_type,
          title: i.title,
          summary: i.summary,
          severity: i.severity || 'info',
          effectiveDate: i.effective_date,
          externalId: i.external_reference,
        }))
        .sort((a, b) => {
          const order = { critical: 0, high: 1, warning: 2, info: 3 };
          return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
        });

      setData({
        mode,
        insights: sortedInsights,
        connection: connection || {},
        lastSync,
        isStale,
      });
    } catch (e) {
      setError(e?.message || 'Fehler beim Laden der Bar-Daten');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mode = data?.mode;
  const badge = MODE_BADGE[mode] || MODE_BADGE.mock;
  const allInsights = data?.insights || [];
  const connection = data?.connection || {};

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
              <div className="text-xs font-medium truncate">{connection.name || 'SAVO Bar-App'} · BAR</div>
              <div className="text-[11px] text-muted-foreground">Letzte Sync: {fmtTime(connection.last_sync_at || data?.lastSync)}</div>
            </div>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">nur lesend</span>
          </div>

          {/* Stale-Warnung */}
          {mode === 'stale' && (
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