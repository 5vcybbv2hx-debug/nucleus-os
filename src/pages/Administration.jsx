import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Plus, Archive, RotateCcw, Building2, Users, KeyRound, Loader2 } from 'lucide-react';
import { getOrgMeta } from '@/lib/organizations';
import { usePermissions } from '@/lib/usePermissions';
import { logAudit } from '@/lib/audit';

const ORG_TYPES = ['betrieb', 'buero', 'privat', 'familie', 'executive', 'investment'];
const ORG_ICONS = ['bar', 'briefcase', 'user', 'home', 'crown', 'building'];

export default function Administration() {
  const perms = usePermissions();
  const [orgs, setOrgs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [tab, setTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', short_name: '', type: 'betrieb', icon: 'bar', status: 'aktiv' });
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    const [o, r, p] = await Promise.all([
      base44.entities.Organization.list(),
      base44.entities.Role.list(),
      base44.entities.Permission.list(),
    ]);
    setOrgs(o.sort((a,b)=>(a.display_order||0)-(b.display_order||0)));
    setRoles(r);
    setPermissions(p);
    setLoading(false);
  };

  useEffect(() => {
    if (!perms.user) return;
    if (!perms.isAdmin()) return;
    load();
  }, [perms.user, perms.isAdmin()]);

  if (perms.user && !perms.isAdmin()) {
    return (
      <div className="px-4 pt-10 text-center">
        <Shield size={32} className="mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Administration nur für Administratoren sichtbar.</p>
      </div>
    );
  }

  const addOrg = async () => {
    if (!newOrg.name) return;
    setAdding(true);
    const payload = { ...newOrg, display_order: orgs.length + 1 };
    const created = await base44.entities.Organization.create(payload);
    await logAudit({ action: 'create', entityType: 'Organization', entityId: created.id, newValue: payload });
    setNewOrg({ name: '', short_name: '', type: 'betrieb', icon: 'bar', status: 'aktiv' });
    setAdding(false);
    load();
  };

  const addRole = async () => {
    if (!newRole.name) return;
    setAdding(true);
    const payload = { ...newRole, active: true };
    const created = await base44.entities.Role.create(payload);
    await logAudit({ action: 'create', entityType: 'Role', entityId: created.id, newValue: payload });
    setNewRole({ name: '', description: '' });
    setAdding(false);
    load();
  };

  // Organisation: deaktivieren statt löschen
  const toggleOrg = async (o) => {
    const prev = { status: o.status };
    const newStatus = o.status === 'aktiv' ? 'inaktiv' : 'aktiv';
    await base44.entities.Organization.update(o.id, { status: newStatus });
    await logAudit({ action: newStatus === 'inaktiv' ? 'deactivate' : 'reactivate', entityType: 'Organization', entityId: o.id, previousValue: prev, newValue: { status: newStatus } });
    load();
  };

  // Rolle: deaktivieren statt löschen
  const toggleRole = async (r) => {
    const prev = { active: r.active };
    const newActive = !r.active;
    await base44.entities.Role.update(r.id, { active: newActive });
    await logAudit({ action: newActive ? 'reactivate' : 'deactivate', entityType: 'Role', entityId: r.id, previousValue: prev, newValue: { active: newActive } });
    load();
  };

  const activeOrgs = orgs.filter(o => o.status === 'aktiv');
  const inactiveOrgs = orgs.filter(o => o.status !== 'aktiv');

  return (
    <div className="px-4 pt-6 pb-4 lg:px-8">
      <div className="flex items-center gap-2 mb-5">
        <Shield size={22} className="text-primary" />
        <h1 className="text-xl font-semibold">Administration</h1>
      </div>

      <div className="flex gap-1 p-1 bg-secondary/40 rounded-xl mb-5">
        {[
          { k: 'orgs', label: 'Bereiche', icon: Building2 },
          { k: 'roles', label: 'Rollen', icon: Users },
          { k: 'perms', label: 'Berechtigungen', icon: KeyRound },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === t.k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : tab === 'orgs' ? (
        <div>
          <div className="space-y-2 mb-3">
            {activeOrgs.map(o => {
              const m = getOrgMeta(o.short_name);
              return (
                <div key={o.id} className="p-3.5 bg-card border border-border rounded-2xl flex items-center gap-3">
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{o.name}</div>
                    <div className="text-xs text-muted-foreground">{o.short_name} · {o.type} · {o.status}</div>
                  </div>
                  <button onClick={() => toggleOrg(o)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                    <Archive size={13} /> Deaktivieren
                  </button>
                </div>
              );
            })}
          </div>
          {inactiveOrgs.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground font-medium mb-2">Inaktiv</div>
              <div className="space-y-2">
                {inactiveOrgs.map(o => {
                  const m = getOrgMeta(o.short_name);
                  return (
                    <div key={o.id} className="p-3.5 bg-secondary/30 border border-border rounded-2xl flex items-center gap-3 opacity-60">
                      <span className="text-xl">{m.emoji}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{o.name}</div>
                        <div className="text-xs text-muted-foreground">{o.short_name} · {o.type} · {o.status}</div>
                      </div>
                      <button onClick={() => toggleOrg(o)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                        <RotateCcw size={13} /> Reaktivieren
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2"><Plus size={15} /> Neuer Bereich</div>
            <input value={newOrg.name} onChange={e=>setNewOrg(p=>({...p,name:e.target.value}))} placeholder="Name" className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input value={newOrg.short_name} onChange={e=>setNewOrg(p=>({...p,short_name:e.target.value}))} placeholder="Kürzel" className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm" />
              <select value={newOrg.type} onChange={e=>setNewOrg(p=>({...p,type:e.target.value}))} className="bg-input border border-border rounded-xl px-3 py-2.5 text-sm">
                {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={addOrg} disabled={adding || !newOrg.name} className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50">
              {adding ? '…' : 'Bereich anlegen'}
            </button>
          </div>
        </div>
      ) : tab === 'roles' ? (
        <div>
          <div className="space-y-2 mb-3">
            {roles.filter(r => r.active).map(r => (
              <div key={r.id} className="p-3.5 bg-card border border-border rounded-2xl flex items-center gap-3">
                <Users size={18} className="text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                </div>
                {r.system_role && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">System</span>}
                <button onClick={() => toggleRole(r)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                  <Archive size={13} /> Deaktivieren
                </button>
              </div>
            ))}
          </div>
          {roles.filter(r => !r.active).length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground font-medium mb-2">Inaktiv</div>
              <div className="space-y-2">
                {roles.filter(r => !r.active).map(r => (
                  <div key={r.id} className="p-3.5 bg-secondary/30 border border-border rounded-2xl flex items-center gap-3 opacity-60">
                    <Users size={18} className="text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                    </div>
                    <button onClick={() => toggleRole(r)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                      <RotateCcw size={13} /> Reaktivieren
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2"><Plus size={15} /> Neue Rolle</div>
            <input value={newRole.name} onChange={e=>setNewRole(p=>({...p,name:e.target.value}))} placeholder="Rollenname" className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm" />
            <input value={newRole.description} onChange={e=>setNewRole(p=>({...p,description:e.target.value}))} placeholder="Beschreibung" className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm" />
            <button onClick={addRole} disabled={adding || !newRole.name} className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50">
              {adding ? '…' : 'Rolle anlegen'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {permissions.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 p-3 border border-dashed border-border rounded-xl">Noch keine Berechtigungen vergeben. Default-Berechtigungen sind aktiv (administrator / vertretung / buero).</p>
          ) : (
            <div className="space-y-2">
              {permissions.map(p => (
                <div key={p.id} className="p-3.5 bg-card border border-border rounded-2xl">
                  <div className="text-sm font-medium">{p.role} → {p.organization}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.module || 'alle Module'}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.can_view && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">view</span>}
                    {p.can_create && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">create</span>}
                    {p.can_edit && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">edit</span>}
                    {p.can_delete && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">delete</span>}
                    {p.can_approve && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">approve</span>}
                    {p.can_view_confidential && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">confidential</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/50 mt-4">Detaillierte Berechtigungsverwaltung folgt im nächsten Paket.</p>
        </div>
      )}
    </div>
  );
}