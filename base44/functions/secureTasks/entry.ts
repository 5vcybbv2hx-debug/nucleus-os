import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * secureTasks — serverseitig gefilterte Task-Liste nach visibility.
 *   "Nur Pierre"           → nur administrator
 *   "Privat"               → nur Ersteller + administrator
 *   "Vertraulich Finanzen"  → nur administrator
 *   "Notfallzugriff"        → nur administrator
 *   "Team" / "Beteiligte"   → alle
 * Rolle wird aus UserProfile.default_role bestimmt (NICHT user.role, NICHT E-Mail).
 *
 * WICHTIG: Nutzt asServiceRole für den Task/UserProfile-Read, weil diese Funktion
 * selbst die komplette Sichtbarkeits-Filterung übernimmt (siehe unten). Mit dem
 * user-scoped Client (base44.entities.Task.list()) greift zusätzlich RLS auf
 * Entity-Ebene, was dazu führt, dass Nicht-Ersteller 0 Tasks sehen — auch wenn sie
 * laut visibility-Feld eigentlich Zugriff haben sollten (z.B. "Team"). Die
 * Sichtbarkeitslogik hier ist die einzige Zugriffskontrolle, die wir brauchen;
 * asServiceRole umgeht die zusätzliche (hier unerwünschte) RLS-Einschränkung.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Rolle aus UserProfile bestimmen (asServiceRole, da UserProfile evtl. auch RLS hat)
    const profiles = await base44.asServiceRole.entities.UserProfile.list().catch(() => []);
    const mine = profiles.find(p => p.user === user.id);
    const role = mine?.default_role || 'buero';
    const isPierre = role === 'administrator';

    if (action === 'list') {
      const all = await base44.asServiceRole.entities.Task.list();
      const visible = all.filter(t => {
        const v = t.visibility || 'Team';
        if (v === 'Nur Pierre') return isPierre;
        if (v === 'Privat') return t.creator === user.id || isPierre;
        if (v === 'Vertraulich Finanzen') return isPierre;
        if (v === 'Notfallzugriff') return isPierre;
        return true; // Team, Beteiligte
      });
      return Response.json({ tasks: visible });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
