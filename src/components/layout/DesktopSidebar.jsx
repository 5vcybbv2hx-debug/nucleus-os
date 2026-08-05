import { NavLink } from 'react-router-dom';
import { LayoutGrid, Sun, Inbox, CheckSquare, CalendarClock, FolderKanban, Wallet, FileText, BookOpen, Target, History, Building2, Shield } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Übersicht', icon: LayoutGrid, end: true },
  { to: '/', label: 'Heute', icon: Sun, end: true },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/aufgaben', label: 'Aufgaben', icon: CheckSquare },
  { to: '/plan', label: 'Planung', icon: CalendarClock },
  { to: '/vorgaenge', label: 'Vorgänge', icon: FolderKanban, placeholder: true },
  { to: '/wissen', label: 'Wissen', icon: BookOpen, placeholder: true },
  { to: '/ziele', label: 'Ziele', icon: Target, placeholder: true },
  { to: '/historie', label: 'Historie', icon: History, placeholder: true },
  { to: '/bereiche', label: 'Bereiche', icon: Building2, placeholder: true },
  { to: '/administration', label: 'Administration', icon: Shield },
];

export default function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-sidebar h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">A</div>
          <div>
            <div className="text-sm font-semibold leading-tight">Projekt Atlas</div>
            <div className="text-[11px] text-muted-foreground">v0.1</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          if (item.placeholder) {
            return (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground/40 cursor-not-allowed">
                <Icon size={17} />
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] bg-secondary px-1.5 py-0.5 rounded">bald</span>
              </div>
            );
          }
          return (
            <NavLink key={item.label} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              <Icon size={17} />
              <span>{item.label}</span>
              {item.legacy && <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Legacy</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}