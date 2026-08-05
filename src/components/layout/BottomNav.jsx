import { NavLink } from 'react-router-dom';
import { Sun, Inbox, Compass, CheckSquare, LayoutGrid } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Heute', icon: Sun, end: true },
  { to: '/eingang', label: 'Eingang', icon: Inbox },
  { to: '/kompass', label: 'Kompass', icon: Compass },
  { to: '/aufgaben', label: 'Aufgaben', icon: CheckSquare },
  { to: '/mehr', label: 'Mehr', icon: LayoutGrid },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
        {ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
              <Icon size={21} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
