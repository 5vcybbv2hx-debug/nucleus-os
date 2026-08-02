import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Info } from 'lucide-react';

const ACTION_LABEL = {
  create_task: 'Aufgabe erstellen',
  notify: 'Benachrichtigung',
  change_priority: 'Priorität ändern',
  start_document_process: 'Dokument-Prozess starten',
  start_finance_process: 'Finanz-Prozess starten',
};

export default function RulesTab() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.EventRule.list('priority', 50);
      setRules(data || []);
    } catch { setRules([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const condText = (cond) => {
    if (!cond || Object.keys(cond).length === 0) return 'keine Bedingung (immer)';
    return Object.entries(cond).map(([k, v]) => `${k} = ${v}`).join(', ');
  };
  const cfgText = (cfg) => {
    if (!cfg || Object.keys(cfg).length === 0) return '—';
    return Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join(', ');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
        <Info size={14} className="flex-shrink-0" />
        Keine Regeln aktiv — Paket 3A ist reines Datenmodell. Automatisierung folgt in 3C.
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 text-center py-8">Keine Regeln vorhanden.</p>
      ) : (
        <div className="space-y-2.5">
          {rules.map(r => (
            <div key={r.id} className="p-3.5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">INAKTIV</span>
                {r.priority != null && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Prio {r.priority}</span>}
                {r.organization && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{r.organization}</span>}
              </div>
              <div className="text-sm font-medium mb-2">{r.name}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-muted-foreground/60 flex-shrink-0 w-12">Wenn</span>
                  <span className="text-foreground/80">
                    <span className="font-mono text-primary/80">{r.event_type_key}</span>
                    <span className="text-muted-foreground"> · {condText(r.condition)}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground/60 flex-shrink-0 w-12">Dann</span>
                  <span className="text-foreground/80">
                    <span className="text-primary/80">{ACTION_LABEL[r.action_type] || r.action_type}</span>
                    <span className="text-muted-foreground"> · {cfgText(r.action_config)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}