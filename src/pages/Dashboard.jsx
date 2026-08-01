import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import InboxList from '@/components/dashboard/InboxList';
import DeadlinesList from '@/components/dashboard/DeadlinesList';
import {
  FileText, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Euro, Bell
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, addDays, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useCurrentUser();
  const [documents, setDocuments] = useState([]);
  const [finances, setFinances] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [docs, fins, dls, tsks] = await Promise.all([
        base44.entities.Document.filter({ isArchived: false }, '-created_date', 50),
        base44.entities.FinanceEntry.filter({ isArchived: false }, '-date', 100),
        base44.entities.Deadline.filter({ isArchived: false, status: 'offen' }, 'dueDate', 20),
        base44.entities.Task.filter({ isArchived: false, status: 'offen' }, '-created_date', 20),
      ]);
      setDocuments(docs);
      setFinances(fins);
      setDeadlines(dls);
      setTasks(tsks);
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthFinances = finances.filter(f => {
    const d = new Date(f.date);
    return d >= monthStart && d <= monthEnd;
  });

  const einnahmen = thisMonthFinances.filter(f => f.type === 'einnahme').reduce((s, f) => s + f.amount, 0);
  const ausgaben = thisMonthFinances.filter(f => f.type === 'ausgabe').reduce((s, f) => s + f.amount, 0);
  const fixkosten = finances.filter(f => f.isFixkost && f.type === 'ausgabe').reduce((s, f) => s + f.amount, 0);
  const offeneDocs = documents.filter(d => d.status === 'neu' || d.status === 'wartet_auf_pruefung');
  const urgentDeadlines = deadlines.filter(d => {
    const daysLeft = Math.ceil((new Date(d.dueDate) - now) / 86400000);
    return daysLeft <= 14 && daysLeft >= 0;
  });

  const firstName = user?.full_name?.split(' ')[0] || 'Hallo';
  const greeting = now.getHours() < 12 ? 'Guten Morgen' : now.getHours() < 18 ? 'Guten Tag' : 'Guten Abend';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-14 pb-4">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">
          {format(now, 'EEEE, dd. MMMM yyyy', { locale: de })}
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.role || 'Benutzer'} · Projekt Atlas
        </p>
      </div>

      {/* Alert Banner */}
      {(urgentDeadlines.length > 0 || offeneDocs.length > 0) && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-400 flex-shrink-0" />
          <div className="text-xs text-orange-300">
            {urgentDeadlines.length > 0 && <span>{urgentDeadlines.length} Frist{urgentDeadlines.length > 1 ? 'en' : ''} in 14 Tagen</span>}
            {urgentDeadlines.length > 0 && offeneDocs.length > 0 && <span> · </span>}
            {offeneDocs.length > 0 && <span>{offeneDocs.length} unbehandelte{offeneDocs.length > 1 ? 'e' : 'es'} Dokument{offeneDocs.length > 1 ? 'e' : ''}</span>}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Schnellzugriff</h2>
        <QuickActions />
      </div>

      {/* Finance Stats */}
      <div className="mb-6">
        <h2 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
          Finanzen · {format(now, 'MMMM yyyy', { locale: de })}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Einnahmen"
            value={`${einnahmen.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            icon={TrendingUp}
            color="text-green-400"
          />
          <StatCard
            title="Ausgaben"
            value={`${ausgaben.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            icon={TrendingDown}
            color="text-red-400"
          />
          <StatCard
            title="Netto"
            value={`${(einnahmen - ausgaben).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            icon={Euro}
            color={einnahmen - ausgaben >= 0 ? 'text-green-400' : 'text-red-400'}
          />
          <StatCard
            title="Fixkosten / Mo."
            value={`${fixkosten.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`}
            icon={TrendingDown}
            color="text-yellow-400"
          />
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Dokumente"
            value={documents.length.toString()}
            subtitle={`${offeneDocs.length} neu/offen`}
            icon={FileText}
            color="text-primary"
          />
          <StatCard
            title="Aufgaben"
            value={tasks.length.toString()}
            subtitle="offen"
            icon={CheckCircle2}
            color="text-purple-400"
          />
          <StatCard
            title="Fristen"
            value={urgentDeadlines.length.toString()}
            subtitle="≤ 14 Tage"
            icon={Bell}
            color={urgentDeadlines.length > 0 ? 'text-orange-400' : 'text-muted-foreground'}
          />
        </div>
      </div>

      {/* Inbox */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Neue Dokumente</h2>
          {offeneDocs.length > 0 && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
              {offeneDocs.length}
            </span>
          )}
        </div>
        <InboxList documents={offeneDocs.length ? offeneDocs : documents.slice(0, 5)} />
      </div>

      {/* Upcoming Deadlines */}
      <div className="mb-6">
        <h2 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Kommende Fristen</h2>
        <DeadlinesList deadlines={deadlines} />
      </div>
    </div>
  );
}