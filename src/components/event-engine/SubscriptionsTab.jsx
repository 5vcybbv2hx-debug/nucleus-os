import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Info } from 'lucide-react';

const SEV_BADGE = {
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  normal: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  wichtig: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  kritisch: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function SubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.EventSubscription.filter({ active: true });
      setSubs(data || []);
    } catch { setSubs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
        <Info size={14} className="flex-shrink-0" />
        Benachrichtigungen werden in Paket 3C aktiviert. Diese Subscriptions definieren nur die Filter-Regeln.
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}</div>
      ) : subs.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 text-center py-8">Keine aktiven Subscriptions.</p>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="p-3.5 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={14} className="text-primary" />
                <span className="text-sm font-medium">{s.user_reference}</span>
                <span className="ml-auto text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">aktiv</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Typ: {s.event_type_key || '*'}</span>
                <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Org: {s.organization || '*'}</span>
                <span className={`px-1.5 py-0.5 rounded border ${SEV_BADGE[s.min_severity] || SEV_BADGE.info}`}>≥ {s.min_severity}</span>
                <span className="bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Kanal: {s.channel || 'in_app'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}