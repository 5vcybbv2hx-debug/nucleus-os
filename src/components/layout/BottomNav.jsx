import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, TrendingUp, CalendarClock, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dokumente', icon: FileText, label: 'Dokumente' },
  { to: '/finanzen', icon: TrendingUp, label: 'Finanzen' },
  { to: '/fristen', icon: CalendarClock, label: 'Fristen' },
  { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}