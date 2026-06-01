import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, Clock, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SYNC_INTERVALS = [
  { value: '5', label: '5 Minuten', hint: 'Intensiv (viel Büroarbeit)' },
  { value: '15', label: '15 Minuten', hint: 'Aktiv' },
  { value: '30', label: '30 Minuten', hint: 'Normal' },
  { value: '60', label: '1 Stunde', hint: 'Standard (empfohlen)' },
  { value: '180', label: '3 Stunden', hint: 'Sparsam' },
];

export default function NasSyncSettings({ savedConfig, onConfigUpdated }) {
  const [interval, setInterval] = useState(savedConfig?.syncInterval || '60');
  const [enabled, setEnabled] = useState(savedConfig?.syncEnabled !== false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    setInterval(savedConfig?.syncInterval || '60');
    setEnabled(savedConfig?.syncEnabled !== false);
  }, [savedConfig]);

  const handleSave = async () => {
    if (!savedConfig) return;
    setSaving(true);
    await base44.entities.NasConfig.update(savedConfig.id, {
      syncInterval: interval,
      syncEnabled: enabled,
    });
    onConfigUpdated?.();
    setSaving(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke('nasSyncScan', {});
    setSyncResult(res.data);
    setSyncing(false);
    onConfigUpdated?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Auto-Sync</div>
          <div className="text-xs text-muted-foreground">NAS automatisch nach neuen Dateien scannen</div>
        </div>
        <button onClick={() => setEnabled(p => !p)} className="text-primary">
          {enabled
            ? <ToggleRight size={28} className="text-primary" />
            : <ToggleLeft size={28} className="text-muted-foreground" />
          }
        </button>
      </div>

      {enabled && (
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-2 block">Sync-Intervall</label>
          <div className="space-y-1.5">
            {SYNC_INTERVALS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  interval === opt.value
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:bg-secondary/30'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className={`text-xs ${interval === opt.value ? 'text-primary/70' : 'text-muted-foreground'}`}>
                  {opt.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {savedConfig?.lastSync && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} />
          Letzter Sync: {format(new Date(savedConfig.lastSync), 'dd. MMM, HH:mm', { locale: de })} Uhr
        </div>
      )}

      {syncResult && (
        <div className={`p-3 rounded-xl text-xs border ${syncResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {syncResult.success ? '✓ ' : '✗ '}{syncResult.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleManualSync}
          disabled={syncing || !savedConfig}
          className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Jetzt synchronisieren
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !savedConfig}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Speichern
        </button>
      </div>
    </div>
  );
}