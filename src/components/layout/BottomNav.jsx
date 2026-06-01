import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, TrendingUp, CalendarClock, MoreHorizontal, Car, BookOpen, Sparkles, Settings, X } from 'lucide-react';
import { useState } from 'react';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dokumente', icon: FileText, label: 'Dokumente' },
  { to: '/finanzen', icon: TrendingUp, label: 'Finanzen' },
  { to: '/fristen', icon: CalendarClock, label: 'Fristen' },
];

const moreNav = [
  { to: '/fahrzeuge', icon: Car, label: 'Fahrzeuge' },
  { to: '/kassenbuch', icon: BookOpen, label: 'Kassenbuch' },
  { to: '/assistent', icon: Sparkles, label: 'KI-Assistent' },
  { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNav.some(n => location.pathname.startsWith(n.to));

  const handleMoreNav = (to) => {
    setShowMore(false);
    navigate(to);
  };

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-20 left-0 right-0 mx-4 bg-card border border-border rounded-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-4 gap-2">
              {moreNav.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <button
                    key={to}
                    onClick={() => handleMoreNav(to)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {mainNav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(p => !p)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${
              isMoreActive || showMore ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {showMore ? <X size={22} strokeWidth={2} /> : <MoreHorizontal size={22} strokeWidth={1.8} />}
            <span className={`text-[10px] font-medium ${isMoreActive || showMore ? 'text-primary' : ''}`}>Mehr</span>
            {(isMoreActive || showMore) && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
          </button>
        </div>
      </nav>
    </>
  );
}