import { NavLink, Link } from 'react-router-dom';
import { Sun, Inbox, Compass, CheckSquare, CalendarClock, FolderKanban, ClipboardCheck, Shield, BookOpen, Target, History, Building2, LayoutGrid } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Workspace', icon: Sun, end: true },
  { to: '/kompass', label: 'Kompass', icon: Compass },
  { to: '/check-in', label: 'Check-In', icon: ClipboardCheck },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/aufgaben', label: 'Aufgaben', icon: CheckSquare },
  { to: '/plan', label: 'Planung', icon: CalendarClock },
  { to: '/cases', label: 'Vorgänge', icon: FolderKanban },
  { to: '/event-engine', label: 'Event Engine', icon: LayoutGrid },
  { to: '/administration', label: 'Administration', icon: Shield },
];

const PLACEHOLDERS = [
  { label: 'Wissen', icon: BookOpen },
  { label: 'Ziele', icon: Target },
  { label: 'Historie', icon: History },
  { label: 'Bereiche', icon: Building2 },
];

export default function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-sidebar h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">A</div>
          <div>
            <div className="text-sm font-semibold leading-tight">Projekt Atlas</div>
            <div className="text-[11px] text-muted-foreground">Executive Workspace</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.label} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/50">Geplant</span>
        </div>

        {PLACEHOLDERS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground/40 cursor-not-allowed">
              <Icon size={17} />
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] bg-secondary px-1.5 py-0.5 rounded">bald</span>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border/50">
        <Link to="/mehr" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Legacy-Bereiche →
        </Link>
      </div>
    </aside>
  );
}
