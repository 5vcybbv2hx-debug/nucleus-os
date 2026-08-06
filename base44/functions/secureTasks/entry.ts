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
 * Actions:
 *   - list:   Gibt alle sichtbaren Tasks zurück
 *   - update: Aktualisiert ein Task-Feld (z.B. planned_date für Kalender-Drag-and-Drop)
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

    if (action === 'list') {
      const all = await base44.asServiceRole.entities.Task.list();
      const visible = all.filter(t => {
        const v = t.visibility || 'Team';
        if (v === 'Nur Pierre') return isPierre;
        if (v === 'Privat') return t.creator === user.id || isPierre;
        if (v === 'Vertraulich Finanzen') return isPierre;
        if (v === 'Notfallzugriff') return isPierre;
        return true;
      });
      return Response.json({ tasks: visible });
    }

    if (action === 'update') {
      const { task_id, planned_date } = body;
      if (!task_id) return Response.json({ error: 'task_id required' }, { status: 400 });
      
      // Verify the user can see this task (visibility check)
      const task = await base44.asServiceRole.entities.Task.get(task_id);
      if (!task) return Response.json({ error: 'not found' }, { status: 404 });
      
      const v = task.visibility || 'Team';
      if (v === 'Nur Pierre' && !isPierre) return Response.json({ error: 'forbidden' }, { status: 403 });
      if (v === 'Privat' && task.creator !== user.id && !isPierre) return Response.json({ error: 'forbidden' }, { status: 403 });
      if ((v === 'Vertraulich Finanzen' || v === 'Notfallzugriff') && !isPierre) return Response.json({ error: 'forbidden' }, { status: 403 });
      
      // Update the task
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
