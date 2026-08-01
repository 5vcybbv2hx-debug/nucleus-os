import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * usePermissions — zentraler Permission-Service für Projekt Atlas.
 *
 * Basierend auf:
 *   - UserProfile.default_role (administrator | vertretung | buero)
 *   - Permission-Entität (role × organization × module)
 *   - Task.visibility (Nur Pierre, Privat, Team, ...)
 *
 * Default-Berechtigungen (hartcodiert bis Permission-Datensätze existieren):
 *   administrator: alles true für alle Organisationen
 *   vertretung: canView für SANDRA, FAMILIE, BAR; canEdit für SANDRA, FAMILIE; keine confidential
 *   buero: canView für BAR, SANDRA; canEdit für BAR, SANDRA; keine confidential, kein approve
 *
 * Identifikation "Pierre": angemeldeter Benutzer mit E-Mail, die "pierre" enthält.
 */
const DEFAULTS = {
  administrator: { all: true },
  vertretung: { view: ['SANDRA', 'FAMILIE', 'BAR'], edit: ['SANDRA', 'FAMILIE'], approve: [], delegate: [], confidential: [] },
  buero: { view: ['BAR', 'SANDRA'], edit: ['BAR', 'SANDRA'], approve: [], delegate: [], confidential: [] },
};

export function usePermissions() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [perms, setPerms] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!alive) return;
        setUser(u);
        const [profiles, permissions, organizations] = await Promise.all([
          base44.entities.UserProfile.list().catch(() => []),
          base44.entities.Permission.list().catch(() => []),
          base44.entities.Organization.list().catch(() => []),
        ]);
        if (!alive) return;
        const mine = profiles.find(p => p.user === u?.id) || null;
        setProfile(mine);
        setPerms(permissions);
        setOrgs(organizations);
      } catch {
        /* nicht angemeldet */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const role = profile?.default_role || 'buero';
  const isPierre = !!(user?.email && user.email.toLowerCase().includes('pierre'));
  const admin = role === 'administrator' || user?.role === 'admin';

  // Permission-Datensatz suchen (role × organization × module)
  const findPerm = (organization, module) => {
    return perms.find(p =>
      p.role === role &&
      p.organization === organization &&
      (!p.module || p.module === module || p.module === '*' || p.module === 'alle')
    );
  };

  const check = (permKey, organization, module) => {
    if (admin) return true; // administrator: alles true
    const rec = findPerm(organization, module);
    if (rec && rec[permKey] != null) return !!rec[permKey];
    // Default-Berechtigungen
    const def = DEFAULTS[role] || DEFAULTS.buero;
    if (def.all) return true;
    if (permKey === 'can_view') return def.view.includes(organization);
    if (permKey === 'can_create' || permKey === 'can_edit') return def.edit.includes(organization);
    if (permKey === 'can_approve') return def.approve.includes(organization);
    if (permKey === 'can_delegate') return def.delegate.includes(organization);
    if (permKey === 'can_view_confidential') return def.confidential.includes(organization);
    return false;
  };

  const canView = (module, organization) => check('can_view', organization, module);
  const canCreate = (module, organization) => check('can_create', organization, module);
  const canEdit = (module, organization) => check('can_edit', organization, module);
  const canApprove = (module, organization) => check('can_approve', organization, module);
  const canDelegate = (module, organization) => check('can_delegate', organization, module);
  const canViewConfidential = (module, organization) => check('can_view_confidential', organization, module);
  const isAdmin = () => admin;

  const getAccessibleOrganizations = () => {
    if (admin) return orgs.filter(o => o.status === 'aktiv').map(o => o.short_name);
    const def = DEFAULTS[role] || DEFAULTS.buero;
    const allowed = def.all ? orgs.map(o => o.short_name) : def.view;
    return orgs.filter(o => o.status === 'aktiv' && allowed.includes(o.short_name)).map(o => o.short_name);
  };

  // Sichtbarkeits-Filter für einzelne Aufgabe (Task.visibility)
  const canViewTask = (task) => {
    if (!task) return false;
    const v = task.visibility || 'Team';
    if (v === 'Nur Pierre') return isPierre;
    if (v === 'Privat') return task.creator === user?.id || isPierre || admin;
    if (v === 'Vertraulich Finanzen') return canViewConfidential('finanzen', task.organization);
    if (v === 'Notfallzugriff') return admin || isPierre;
    if (v === 'Beteiligte') return task.creator === user?.id || task.assignee === user?.id || canView('aufgaben', task.organization);
    // Team
    return canView('aufgaben', task.organization);
  };

  return {
    user, role, loading, isPierre,
    canView, canCreate, canEdit, canApprove, canDelegate, canViewConfidential,
    isAdmin, getAccessibleOrganizations, canViewTask,
    organizations: orgs,
    activeOrgs: orgs.filter(o => o.status === 'aktiv').sort((a,b) => (a.display_order||0)-(b.display_order||0)).map(o => o.short_name),
  };
}