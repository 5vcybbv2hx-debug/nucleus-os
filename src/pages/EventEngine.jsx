import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, History, ListTree, GitBranch, Bell, BarChart3, Archive } from 'lucide-react';
import TimelineTab from '@/components/event-engine/TimelineTab';
import EventTypesTab from '@/components/event-engine/EventTypesTab';
import RulesTab from '@/components/event-engine/RulesTab';
import SubscriptionsTab from '@/components/event-engine/SubscriptionsTab';
import StatsTab from '@/components/event-engine/StatsTab';

const TABS = [
  { key: 'timeline', label: 'Timeline', icon: History },
  { key: 'types', label: 'Eventtypen', icon: ListTree },
  { key: 'rules', label: 'Regeln', icon: GitBranch },
  { key: 'subscriptions', label: 'Subscriptions', icon: Bell },
  { key: 'stats', label: 'Statistiken', icon: BarChart3 },
];

export default function EventEngine() {
  const [tab, setTab] = useState('timeline');

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Business Event Engine</h1>
          <p className="text-xs text-muted-foreground">Zentrales Ereignis-Protokoll · Paket 3A (Datenmodell)</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 mb-5 sticky top-0 z-10 glass rounded-b-xl pb-2 pt-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              }`}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'timeline' && <TimelineTab />}
      {tab === 'types' && <EventTypesTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'subscriptions' && <SubscriptionsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}