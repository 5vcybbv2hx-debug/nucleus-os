import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, Crown, Settings, Wallet, Briefcase, ArrowRight } from 'lucide-react';
import { getOrgMeta } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { base44 } from '@/api/base44Client';

const TEAM_MEMBERS = [
  { name: 'Pierre', role: 'Executive', icon: Crown, desc: 'Strategische Übersicht, Entscheidungen' },
  { name: 'Johanna', role: 'Operations', icon: Settings, desc: 'Buchhaltungsvorbereitung, Administration' },
  { name: 'Bettina', role: 'Finance', icon: Wallet, desc: 'Finanzen, Belege, Steuerunterlagen' },
  { name: 'Sandra', role: 'Projects', icon: Briefcase, desc: 'Projekte, Angebote, Bauzeichnungen' },
];

export default function Team() {
  const perms = usePermissions();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sandraInsights, setSandraInsights] = useState([]);

  const loadSandraData = useCallback(async () => {
    try {
      const insights = await base44.entities.ExternalInsight.filter({
        organization: 'SANDRA', status: 'active'
      });
      setSandraInsights(insights || []);
    } catch { setSandraInsights([]); }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('secureTasks', { action: 'list' });
      setTasks(res.data?.tasks || []);
    } catch { setTasks([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); loadSandraData(); }, [loadTasks, loadSandraData]);

  // Tasks grouped by assignee
  const tasksByAssignee = tasks.reduce((acc, t) => {
    const name = t.assignee || 'Ohne Zuordnung';
    if (!acc[name]) acc[name] = [];
    acc[name].push(t);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6 pb-24 lg:pb-8 lg:px-8 lg:pt-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Users size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Team</h1>
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {TEAM_MEMBERS.map(member => {
          const Icon = member.icon;
          const memberTasks = tasksByAssignee[member.name] || [];
          const activeCount = memberTasks.filter(t => !['Erledigt', 'Nicht mehr notwendig', 'Archiviert'].includes(t.status)).length;
          const isMe = perms.user?.full_name?.includes(member.name);

          return (
            <div key={member.name} className="p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                  <Icon size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    {isMe && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Du</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{member.role}</p>
                </div>
                {activeCount > 0 && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">{activeCount}</span>
                )}
                {member.name === 'Sandra' && sandraInsights.length > 0 && (() => {
                  const overdue = sandraInsights.find(i => i.external_reference === 'sandra_overdue_tasks');
                  if (overdue && overdue.severity === 'warning') return (
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">überfällig</span>
                  );
                  return null;
                })()}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{member.desc}</p>
              {member.name === 'Sandra' && sandraInsights.length > 0 && (
                <div className="space-y-1 mb-2">
                  {sandraInsights.slice(0, 4).map((ins, i) => (
                    <div key={ins.external_reference || i} className="flex items-center gap-2 text-xs">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        ins.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="flex-1 truncate text-foreground">{ins.title.replace('Sandra: ', '')}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeCount > 0 && (
                <div className="space-y-1">
                  {memberTasks
                    .filter(t => !['Erledigt', 'Nicht mehr notwendig', 'Archiviert'].includes(t.status))
                    .slice(0, 3)
                    .map(t => {
                      const org = getOrgMeta(t.organization);
                      return (
                        <div key={t.id} className="flex items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] ${org.chip}`}><span>{org.emoji}</span>{org.short}</span>
                          <span className="flex-1 truncate text-foreground">{t.title}</span>
                          <span className="text-muted-foreground">{t.status}</span>
                        </div>
                      );
                    })
                  }
                </div>
              )}
              {activeCount === 0 && (
                <p className="text-xs text-muted-foreground/50">Keine offenen Aufgaben.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
