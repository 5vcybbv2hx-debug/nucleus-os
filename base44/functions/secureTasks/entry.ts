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
 * Nutzt asServiceRole für Task/UserProfile-Read, weil diese Funktion selbst die
 * komplette Sichtbarkeits-Filterung übernimmt — RLS auf Entity-Ebene würde hier
 * zusätzlich (unerwünscht) einschränken.
 *
 * Actions:
 *   list   — gefilterte Task-Liste
 *   update — Task aktualisieren (z.B. planned_date für Drag-and-Drop), mit Sichtbarkeits-Check
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const profiles = await base44.asServiceRole.entities.UserProfile.list().catch(() => []);
    const mine = profiles.find(p => p.user === user.id);
    const role = mine?.default_role || 'buero';
    const isPierre = role === 'administrator';

    function canSee(t) {
      const v = t.visibility || 'Team';
      if (v === 'Nur Pierre') return isPierre;
      if (v === 'Privat') return t.creator === user.id || isPierre;
      if (v === 'Vertraulich Finanzen') return isPierre;
      if (v === 'Notfallzugriff') return isPierre;
      return true;
    }

    if (action === 'list') {
      const all = await base44.asServiceRole.entities.Task.list();
      const visible = all.filter(canSee);
      return Response.json({ tasks: visible });
    }

    if (action === 'update') {
      const { task_id, planned_date } = body;
      if (!task_id) return Response.json({ error: 'task_id required' }, { status: 400 });

      const task = await base44.asServiceRole.entities.Task.get(task_id);
      if (!task) return Response.json({ error: 'task not found' }, { status: 404 });
      if (!canSee(task)) return Response.json({ error: 'forbidden' }, { status: 403 });

      const updates = {};
      if (planned_date !== undefined) updates.planned_date = planned_date;

      const updated = await base44.asServiceRole.entities.Task.update(task_id, updates);
      return Response.json({ task: updated });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}