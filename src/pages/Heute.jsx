import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Sunrise, Battery, Zap as ZapIcon, Sparkles,
  AlertTriangle, CheckCircle, CalendarClock, Bell, FileText,
  Lightbulb, Scale, FolderKanban, Mic, Edit3,
  Users, Wallet, ChevronRight, Compass, ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import {
  COMPANY_STATUS, WORK_MODES, TOP_THREE, BUSINESS_EVENTS,
  DECISIONS, TEAM_STATUS, QUICK_ACTIONS,
} from '@/components/executive/mockData';
import IdeaCaptureModal from '@/components/atlas/IdeaCaptureModal';
import TaskCreateModal from '@/components/atlas/TaskCreateModal';
import DailyReflectionModal from '@/components/atlas/DailyReflectionModal';

// --- Helpers ---
const GREETINGS = [
  { h: [5, 6, 7, 8, 9, 10], label: 'Guten Morgen', icon: Sunrise },
  { h: [11, 12, 13, 14, 15, 16, 17], label: 'Guten Tag', icon: Battery },
  { h: [18, 19, 20, 21], label: 'Guten Abend', icon: ZapIcon },
  { h: [22, 23, 0, 1, 2, 3, 4], label: 'Gute Nacht', icon: Sparkles },
];

const ICON_MAP = {
  alert: AlertTriangle, check: CheckCircle, calendar: CalendarClock, bell: Bell, file: FileText,
  users: Users, wallet: Wallet,
  lightbulb: Lightbulb, scale: Scale, folder: FolderKanban, mic: Mic, edit: Edit3,
};

const STATUS_META = {
  stable: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Unternehmen stabil' },
  attention: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'Aufmerksamkeit erforderlich' },
  critical: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Kritisch — Handeln erforderlich' },
};

const TEAM_STATUS_META = {
  arbeitet: { dot: 'bg-emerald-500', label: 'Arbeitet', pulse: false },
  wartet: { dot: 'bg-amber-500', label: 'Wartet', pulse: false },
  braucht_entscheidung: { dot: 'bg-amber-500', label: 'Braucht Entscheidung', pulse: true },
  bereit: { dot: 'bg-emerald-500', label: 'Bereit', pulse: false },
  offline: { dot: 'bg-muted-foreground/40', label: 'Offline', pulse: false },
};

const PRIORITY_META = {
  hoch: 'bg-primary/10 text-primary',
  mittel: 'bg-secondary text-muted-foreground',
  niedrig: 'bg-secondary text-muted-foreground/60',
};

// --- Status Dot ---
function StatusDot({ level, size = 'w-2.5 h-2.5', pulse = false }) {
  const meta = STATUS_META[level] || STATUS_META.stable;
  return (
    <span className={`inline-block ${size} rounded-full ${meta.dot} ${pulse ? 'animate-pulse' : ''}`} />
  );
}

// --- Executive Greeting ---
function ExecutiveGreeting({ user }) {
  const hour = new Date().getHours();
  const greet = GREETINGS.find(g => g.h.includes(hour)) || GREETINGS[0];
  const GreetIcon = greet.icon;
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Pierre';
  const meta = STATUS_META[COMPANY_STATUS.level] || STATUS_META.stable;

  return (
    <header className="mb-8">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
      </p>
      <h1 className="text-2xl font-semibold mt-2 flex items-center gap-2.5">
        <GreetIcon size={22} className="text-primary" />
        {greet.label}, {firstName}
      </h1>
      <div className="flex items-center gap-2 mt-3">
        <StatusDot level={COMPANY_STATUS.level} />
        <span className={`text-sm font-medium ${meta.text}`}>{COMPANY_STATUS.label}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{COMPANY_STATUS.sublabel}</p>
    </header>
  );
}

// --- Work Mode Selector ---
function WorkModeSelector({ active, onSelect }) {
  return (
    <div className="mb-8">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {WORK_MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => onSelect(mode.key)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              active === mode.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Top Three ---
function TopThreeCards() {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Heute — Die drei wichtigsten Dinge</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {TOP_THREE.map((item, i) => {
          const Icon = ICON_MAP[item.icon] || FileText;
          const prioMeta = PRIORITY_META[item.priority] || PRIORITY_META.mittel;
          return (
            <button
              key={item.id}
              className="group text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${prioMeta}`}>
                  {item.priority}
                </span>
              </div>
              <h3 className="text-base font-semibold mb-2 leading-snug">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.reason}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{item.source}</span>
                <span className="text-xs text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">{item.duration}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// --- Business Events Preview ---
function BusinessEventsPreview() {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Business Events</h2>
        <Link to="/event-engine" className="text-xs text-primary hover:underline flex items-center gap-1">
          Alle anzeigen <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-2">
        {BUSINESS_EVENTS.slice(0, 5).map(event => {
          const Icon = ICON_MAP[event.icon] || Bell;
          const isWarning = event.severity === 'warning';
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl"
            >
              <Icon
                size={16}
                className={isWarning ? 'text-amber-500' : 'text-muted-foreground/60'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.category} · {event.source} · {event.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Decisions Preview ---
function DecisionsPreview({ onAction }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground">Entscheidungen</h2>
        <button
          onClick={() => onAction('decision')}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Neue <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {DECISIONS.map(decision => (
          <div
            key={decision.id}
            className="p-4 bg-card border border-border rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold leading-snug">{decision.title}</h3>
              <span className="text-[10px] text-amber-500 font-medium whitespace-nowrap mt-0.5">
                {decision.urgency}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{decision.context}</p>
            <div className="flex flex-wrap gap-2">
              {decision.options.map((opt, i) => (
                <button
                  key={i}
                  className={`text-xs px-3 py-2 rounded-xl border transition-all ${
                    i === 0
                      ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Team Status Grid ---
function TeamStatusGrid() {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Teams</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEAM_STATUS.map(member => {
          const meta = TEAM_STATUS_META[member.status] || TEAM_STATUS_META.offline;
          return (
            <div
              key={member.id}
              className="p-4 bg-card border border-border rounded-2xl"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {member.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1.5">{member.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Quick Actions Bar ---
function QuickActionsBar({ onAction }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Schnellaktionen</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
        {QUICK_ACTIONS.map(action => {
          const Icon = ICON_MAP[action.icon] || Edit3;
          return (
            <button
              key={action.key}
              onClick={() => onAction(action.key)}
              className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/50 hover:border-primary/20 transition-all"
            >
              <Icon size={22} className="text-primary" />
              <span className="text-xs text-center font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// --- Kompass + Check-In Links ---
function WorkspaceShortcuts() {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3">
      <Link
        to="/kompass"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
          <Compass size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Kompass</p>
          <p className="text-xs text-muted-foreground">Unternehmensstatus & Fokus</p>
        </div>
        <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </Link>
      <Link
        to="/check-in"
        className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-secondary/40 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
          <ClipboardCheck size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Check-In</p>
          <p className="text-xs text-muted-foreground">5–10 Minuten reflektieren</p>
        </div>
        <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </Link>
    </section>
  );
}

// --- Buero View (Johanna) ---
function BueroView({ user, onAction }) {
  const hour = new Date().getHours();
  const greet = GREETINGS.find(g => g.h.includes(hour)) || GREETINGS[0];
  const GreetIcon = greet.icon;
  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Johanna';

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      <header className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
        </p>
        <h1 className="text-2xl font-semibold mt-2 flex items-center gap-2.5">
          <GreetIcon size={22} className="text-primary" />
          {greet.label}, {firstName}
        </h1>
      </header>
      <div className="p-6 bg-card border border-border rounded-2xl text-center">
        <p className="text-sm text-muted-foreground">Deine Aufgaben findest du unter "Aufgaben".</p>
        <Link to="/aufgaben" className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline">
          Zu meinen Aufgaben <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// --- Main Executive Workspace ---
export default function Heute() {
  const [workMode, setWorkMode] = useState('executive');
  const [modal, setModal] = useState(null);

  const handleAction = (key) => {
    if (key === 'idea') setModal('idea');
    else if (key === 'task') setModal('task');
    else if (key === 'note') setModal('reflection');
    // decision, case, event, voice = placeholder (später)
  };

  // Für Buero-Rolle: vereinfachte Ansicht
  // (Placeholder — später über usePermissions real rollenbasiert)
  const isBuero = false; // Wird später über usePermissions gesetzt

  if (isBuero) {
    return <BueroView user={null} onAction={handleAction} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8">
      <ExecutiveGreeting user={null} />
      <WorkModeSelector active={workMode} onSelect={setWorkMode} />

      {/* Haupt-Grid: Desktop 2 Spalten, Mobile 1 Spalte */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Linke Spalte (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <TopThreeCards />
          <DecisionsPreview onAction={handleAction} />
        </div>

        {/* Rechte Spalte (1/3) */}
        <div className="space-y-6">
          <BusinessEventsPreview />
          <TeamStatusGrid />
        </div>
      </div>

      {/* Quick Actions + Shortcuts */}
      <QuickActionsBar onAction={handleAction} />
      <WorkspaceShortcuts />

      {/* Modals */}
      {modal === 'idea' && <IdeaCaptureModal onClose={() => setModal(null)} />}
      {modal === 'task' && <TaskCreateModal onClose={() => setModal(null)} />}
      {modal === 'reflection' && <DailyReflectionModal onClose={() => setModal(null)} />}
    </div>
  );
}
