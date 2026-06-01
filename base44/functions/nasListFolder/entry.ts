import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { nasUrl, nasUsername, nasPassword, folderPath } = await req.json();

  if (!nasUrl || !nasUsername || !nasPassword) {
    return Response.json({ error: 'Fehlende NAS-Konfiguration' }, { status: 400 });
  }

  const credentials = btoa(`${nasUsername}:${nasPassword}`);
  const url = `${nasUrl.replace(/\/$/, '')}${folderPath || '/'}`;

  const response = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Depth': '1',
      'Content-Type': 'application/xml'
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getlastmodified/>
    <D:getcontentlength/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`
  });

  if (response.status !== 207) {
    return Response.json({ success: false, message: `Fehler: HTTP ${response.status}` });
  }

  const xmlText = await response.text();

  // Simple XML parsing to extract file/folder names
  const items = [];
  const hrefMatches = xmlText.match(/<D:href>([^<]+)<\/D:href>/g) || [];
  const displayMatches = xmlText.match(/<D:displayname>([^<]*)<\/D:displayname>/g) || [];

  hrefMatches.forEach((href, i) => {
    const path = href.replace(/<\/?D:href>/g, '').trim();
    const name = displayMatches[i] ? displayMatches[i].replace(/<\/?D:displayname>/g, '').trim() : path.split('/').pop();
    if (name && path !== folderPath) {
      const isCollection = xmlText.includes('<D:collection/>');
      items.push({ name, path, type: isCollection ? 'folder' : 'file' });
    }
  });

  return Response.json({ success: true, items });
});