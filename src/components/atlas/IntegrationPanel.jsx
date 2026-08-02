import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link2, RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

const fmtTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

export default function IntegrationPanel() {
  const perms = usePermissions();
  const isAdmin = perms.isAdmin();
  const [conn, setConn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('barAdapter', { action: 'getConnectionStatus' });
      setConn(res.data || res);
    } catch (e) {
      setError(e?.message || 'Status konnte nicht geladen werden');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async () => {
    setToggling(true);
    try {
      const newEnabled = conn?.enabled === false;
      await base44.functions.invoke('barAdapter', { action: 'toggleConnection', enabled: newEnabled, mode: conn?.mode || 'read_only' });
      await load();
    } catch (e) {
      setError(e?.message || 'Umschalten fehlgeschlagen');
    }
    setToggling(false);
  };

  const enabled = conn?.enabled !== false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-primary" />
          <h2 className="text-sm font-semibold">Bar-App Integration</h2>
        </div>
        <button onClick={load} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      ) : conn ? (
        <>
          {/* Status Card */}
          <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{conn.name || 'SAVO Bar-App'}</div>
                <div className="text-xs text-muted-foreground">{conn.source_app || 'BAR'} · nur lesend</div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${enabled ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                {enabled ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Clock size={12} className="flex-shrink-0" /> Letzte Sync: <span className="text-foreground">{fmtTime(conn.last_sync_at)}</span></div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle size={12} className="flex-shrink-0" /> Letzte Erfolg: <span className="text-foreground">{fmtTime(conn.last_success_at)}</span></div>
            </div>

            {conn.insight_count != null && (
              <div className="text-xs text-muted-foreground">Aktive Insights: <span className="text-foreground font-medium">{conn.insight_count}</span></div>
            )}

            {conn.last_error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {conn.last_error}
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <button onClick={toggle} disabled={toggling}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                enabled ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-primary text-primary-foreground'
              }`}>
              {toggling ? <Loader2 size={15} className="animate-spin" /> : enabled ? <EyeOff size={15} /> : <Eye size={15} />}
              {enabled ? 'Verbindung deaktivieren' : 'Verbindung aktivieren'}
            </button>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-secondary/40 border border-border rounded-xl text-[11px] text-muted-foreground flex items-start gap-2">
            <span className="text-base leading-none">🔒</span>
            <span>Nur-Lese-Modus: Keine Daten in die Bar-App geschrieben. Keine Zugangsdaten sichtbar.</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Keine Verbindungsdaten verfügbar.</p>
      )}
    </div>
  );
}