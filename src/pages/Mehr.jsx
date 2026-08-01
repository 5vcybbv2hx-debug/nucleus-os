import { Link } from 'react-router-dom';
import { BookOpen, Car, FileText, Wallet, Bot, Server, Shield, Sparkles, FolderKanban, BookOpen as Book, Target, History, Building2, ChevronRight } from 'lucide-react';

const LEGACY = [
  { to: '/kassenbuch', label: 'Kassenbuch', icon: BookOpen },
  { to: '/fahrzeuge', label: 'Fahrzeuge', icon: Car },
  { to: '/dokumente', label: 'Dokumente', icon: FileText },
  { to: '/finanzen', label: 'Finanzen', icon: Wallet },
  { to: '/assistent', label: 'KI-Assistent', icon: Bot },
  { to: '/einstellungen', label: 'NAS-Einstellungen', icon: Server },
];

const PLACEHOLDERS = [
  { label: 'Vorgänge', icon: FolderKanban },
  { label: 'Wissen', icon: Book },
  { label: 'Ziele', icon: Target },
  { label: 'Historie', icon: History },
  { label: 'Bereiche', icon: Building2 },
];

function LegacyBadge() {
  return <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">Legacy / noch zu prüfen</span>;
}

export default function Mehr() {
  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Mehr</h1>
      </div>

      {/* Administration */}
      <section className="mb-6">
        <Link to="/administration" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Administration</div>
            <div className="text-xs text-muted-foreground">Organisationseinheiten, Rollen & Berechtigungen</div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>
      </section>

      {/* Legacy */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Shield size={15} /> Legacy-Bereiche
        </h2>
        <div className="space-y-2">
          {LEGACY.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
                <LegacyBadge />
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Placeholder modules */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Bald verfügbar</h2>
        <div className="grid grid-cols-2 gap-3">
          {PLACEHOLDERS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="flex flex-col items-center gap-2 p-4 border border-dashed border-border rounded-2xl opacity-50">
                <Icon size={22} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{p.label}</span>
                <span className="text-[10px] text-muted-foreground/60">folgt</span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground/50 text-center mt-8">Projekt Atlas v0.1 — Datenstichtag 01.08.2026</p>
    </div>
  );
}