import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * secureTasks — serverseitig gefilterte Task-Liste nach visibility.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const profiles = await base44.asServiceRole.entities.UserProfile.list().catch((e) => { throw new Error('profiles: ' + e.message); });
    const mine = profiles.find(p => p.user === user.id);
    const role = mine?.default_role || 'buero';
    const isPierre = role === 'administrator';

    if (action === 'debug') {
      let allCount = -1;
      let allErr = null;
      try {
        const all = await base44.asServiceRole.entities.Task.list();
        allCount = all.length;
      } catch (e) {
        allErr = e.message;
      }
      return Response.json({
        user_id: user.id,
        user_email: user.email,
        profiles_count: profiles.length,
        matched_profile: mine || null,
        role,
        isPierre,
        task_count_service_role: allCount,
        task_error: allErr,
      });
    }

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
      return Response.json({ tasks: visible, debug_all_count: all.length, debug_user: user.id });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}