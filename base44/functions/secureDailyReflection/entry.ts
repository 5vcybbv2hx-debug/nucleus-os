import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * secureDailyReflection — serverseitig erzwungener Privat-Zugriff auf DailyReflection.
 * KEIN anderer Benutzer (auch kein Admin) erhält Zugriff auf fremde Reflexionen.
 * AuditLog speichert NUR Datum + Mood, niemals Reflexionstexte.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, id, reflection_date, mood, what_went_well, what_was_difficult, what_was_learned, change_for_tomorrow } = body;

    if (action === 'list') {
      const all = await base44.entities.DailyReflection.list();
      const mine = all.filter(r => r.user === user.id);
      return Response.json({ reflections: mine });
    }

    if (action === 'get') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const r = await base44.entities.DailyReflection.get(id);
      if (!r || r.user !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      return Response.json({ reflection: r });
    }

    if (action === 'create') {
      if (!reflection_date) return Response.json({ error: 'reflection_date required' }, { status: 400 });
      const payload = {
        user: user.id,
        reflection_date,
        mood,
        what_went_well,
        what_was_difficult,
        what_was_learned,
        change_for_tomorrow,
        private: true, // serverseitig erzwungen
      };
      const created = await base44.entities.DailyReflection.create(payload);
      // AuditLog: NUR Datum + Mood — niemals Reflexionstexte
      await base44.entities.AuditLog.create({
        action: 'create',
        entityType: 'DailyReflection',
        entityId: created.id,
        newValue: JSON.stringify({ reflection_date, mood }),
        performedBy: user.id,
        performedByName: user.full_name || user.email,
        user: user.id,
        timestamp: new Date().toISOString(),
        source: 'manuell',
      });
      return Response.json({ reflection: created });
    }

    if (action === 'update') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const existing = await base44.entities.DailyReflection.get(id);
      if (!existing || existing.user !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await base44.entities.DailyReflection.update(id, {
        mood, what_went_well, what_was_difficult, what_was_learned, change_for_tomorrow, private: true,
      });
      await base44.entities.AuditLog.create({
        action: 'update',
        entityType: 'DailyReflection',
        entityId: id,
        newValue: JSON.stringify({ reflection_date: existing.reflection_date, mood }),
        performedBy: user.id,
        performedByName: user.full_name || user.email,
        user: user.id,
        timestamp: new Date().toISOString(),
        source: 'manuell',
      });
      return Response.json({ reflection: updated });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}