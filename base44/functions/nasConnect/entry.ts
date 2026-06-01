import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'SUPERADMIN' && user.role !== 'admin') {
    return Response.json({ error: 'Nur SUPERADMIN kann NAS konfigurieren' }, { status: 403 });
  }

  const { nasUrl, nasUsername, nasPassword, basePath } = await req.json();

  const testUrl = `${nasUrl.replace(/\/$/, '')}${basePath || '/'}`;

  const credentials = btoa(`${nasUsername}:${nasPassword}`);

  const response = await fetch(testUrl, {
    method: 'PROPFIND',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Depth': '0',
      'Content-Type': 'application/xml'
    },
    body: '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/></D:prop></D:propfind>'
  });

  if (response.status === 207 || response.status === 200) {
    return Response.json({ success: true, message: 'Verbindung erfolgreich' });
  } else {
    return Response.json({ success: false, message: `Verbindungsfehler: HTTP ${response.status}` });
  }
});