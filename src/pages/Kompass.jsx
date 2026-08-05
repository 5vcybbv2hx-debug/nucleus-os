import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { KOMPASS } from '@/components/executive/mockData';

const STATUS_META = {
  stable: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  attention: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  critical: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

export default function Kompass() {
  const statusMeta = STATUS_META[KOMPASS.status.level] || STATUS_META.stable;

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link to="/" className="lg:hidden -ml-1 p-1 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2.5">
          <Compass size={22} className="text-primary" />
          <h1 className="text-2xl font-semibold">Kompass</h1>
        </div>
      </div>

      {/* Unternehmensstatus */}
      <section className="mb-8 p-6 bg-card border border-border rounded-2xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Unternehmensstatus</p>
        <div className="flex items-center gap-2.5">
          <span className={`inline-block w-3 h-3 rounded-full ${statusMeta.dot}`} />
          <span className={`text-lg font-semibold ${statusMeta.text}`}>{KOMPASS.status.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-sm text-muted-foreground">{KOMPASS.status.trendLabel}</span>
        </div>
      </section>

      {/* Entwicklung */}
      <section className="mb-8 p-6 bg-card border border-border rounded-2xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Entwicklung</p>
        <p className="text-base leading-relaxed">{KOMPASS.development}</p>
      </section>

      {/* Heutiger Fokus */}
      <section className="mb-8 p-6 bg-card border border-border rounded-2xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Heutiger Fokus</p>
        <div className="space-y-3">
          {KOMPASS.focus.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-semibold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm leading-relaxed pt-0.5">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Zurück-Link (Desktop) */}
      <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft size={14} /> Zurück zum Workspace
      </Link>
    </div>
  );
}
