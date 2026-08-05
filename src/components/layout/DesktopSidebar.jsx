import { NavLink } from 'react-router-dom';
import { Sun, Inbox, Layers, Users, Building2, LayoutGrid, FolderKanban, Shield } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Heute', icon: Sun, end: true },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/arbeit', label: 'Arbeit', icon: Layers },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/unternehmen', label: 'Unternehmen', icon: Building2 },
  { to: '/mehr', label: 'Mehr', icon: LayoutGrid },
];

const ADMIN_NAV = [
  { to: '/vorgaenge', label: 'Vorgänge', icon: FolderKanban },
  { to: '/administration', label: 'Administration', icon: Shield },
];

export default function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-sidebar h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">A</div>
          <div>
            <div className="text-sm font-semibold leading-tight">Projekt Atlas</div>
            <div className="text-[11px] text-muted-foreground">Flow</div>
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
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wide">Verwaltung</span>
        </div>
        {ADMIN_NAV.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.label} to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground/60 hover:bg-secondary hover:text-foreground'
              }`}>
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
