import { NavLink } from 'react-router-dom';
import { Sun, Inbox, Layers, Users, Building2, LayoutGrid, CalendarDays } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Heute', icon: Sun, end: true },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/arbeit', label: 'Arbeit', icon: Layers },
  { to: '/woche', label: 'Woche', icon: CalendarDays },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/mehr', label: 'Mehr', icon: LayoutGrid },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-6 px-0.5 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
        {ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
              <Icon size={19} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
