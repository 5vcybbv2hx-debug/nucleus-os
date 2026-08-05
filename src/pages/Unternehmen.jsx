import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Wallet, TrendingUp, TrendingDown, ArrowRight, Circle } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

export default function Unternehmen() {
  const perms = usePermissions();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sandraInsights, setSandraInsights] = useState([]);

  const loadSandra = useCallback(async () => {
    try {
      const insights = await base44.entities.ExternalInsight.filter({
        organization: 'SANDRA', status: 'active'
      });
      setSandraInsights(insights || []);
    } catch { setSandraInsights([]); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ExternalInsight.filter({ status: 'active' });
      setInsights(all || []);
    } catch { setInsights([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); loadSandra(); }, [load, loadSandra]);

  // Vertretung: keine vertraulichen Finanzinhalte
  if (perms.role === 'vertretung') {
    return (
      <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={22} className="text-primary" />
          <h1 className="text-xl font-semibold">Unternehmen</h1>
        </div>
        <p className="text-sm text-muted-foreground">Finanzübersicht ist für Deine Rolle nicht freigegeben.</p>
      </div>
    );
  }

  const financeInsights = insights.filter(i => i.organization && i.organization !== 'BAR');
  const barInsights = insights.filter(i => i.organization === 'BAR');

  // Status cards
  const cards = [
    { label: 'Liquidität', icon: Wallet, state: 'stabil', color: 'bg-emerald-500', detail: 'Keine Engpässe gemeldet' },
    { label: 'Schulden', icon: TrendingDown, state: 'keine', color: 'bg-emerald-500', detail: null },
    { label: 'Vermögen', icon: TrendingUp, state: '—', color: 'bg-muted-foreground', detail: 'In Vorbereitung' },
    { label: 'Kennzahlen', icon: Building2, state: '—', color: 'bg-muted-foreground', detail: 'In Vorbereitung' },
  ];

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Unternehmen</h1>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        Langfristige Übersicht. Nicht für die tägliche Arbeit, sondern für strategische Entscheidungen.
      </p>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={15} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${card.color}`} />
                <span className="text-sm font-semibold">{card.state}</span>
              </div>
              {card.detail && <p className="text-[11px] text-muted-foreground mt-1">{card.detail}</p>}
            </div>
          );
        })}
      </div>

      {/* Finance Insights */}
      {financeInsights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Finanzhinweise</h2>
          <div className="space-y-2">
            {financeInsights.map((ins, i) => (
              <div key={ins.external_reference || i} className="p-3.5 bg-card border border-border rounded-xl">
                <p className="text-sm font-medium">{ins.title}</p>
                {ins.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ins.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Finance Link */}
      <div className="mb-6">
        <a href="/finanzen" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Detaillierte Finanzübersicht <ArrowRight size={14} />
        </a>
      </div>

      {/* Sandra Büro — Management-Übersicht */}
      {sandraInsights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Sandra Büro</h2>
          <div className="space-y-1.5">
            {sandraInsights.map((ins, i) => (
              <div key={ins.external_reference || i} className="p-3 bg-card border border-border rounded-xl flex items-start gap-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  ins.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ins.title.replace('Sandra: ', '')}</p>
                  {ins.summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.summary}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar Financial Brief */}
      {barInsights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3">Bar — Kurzinfo</h2>
          <div className="space-y-1.5">
            {barInsights.filter(i => i.severity === 'critical' || i.severity === 'high').map((ins, i) => (
              <div key={ins.external_reference || i} className="p-3 bg-card border border-border rounded-lg flex items-start gap-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  ins.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ins.title}</p>
                  {ins.summary && <p className="text-[11px] text-muted-foreground line-clamp-1">{ins.summary}</p>}
                </div>
              </div>
            ))}
            {barInsights.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0 && (
              <p className="text-xs text-muted-foreground/60">Keine kritischen Finanzhinweise der Bar.</p>
            )}
          </div>
        </div>
      )}

      {/* Coming soon */}
      <div className="space-y-2">
        {['Immobilien', 'Ziele', 'Historie'].map(item => (
          <div key={item} className="p-3 bg-secondary/30 border border-border/50 rounded-xl flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item}</span>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">bald</span>
          </div>
        ))}
      </div>
    </div>
  );
}
