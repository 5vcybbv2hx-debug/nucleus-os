import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated users (manual trigger) and service role (scheduled)
    const body = await req.json().catch(() => ({}));

    // Get NAS config
    const configs = await base44.asServiceRole.entities.NasConfig.list();
    if (!configs || configs.length === 0) {
      return Response.json({ error: 'Keine NAS-Konfiguration gefunden' }, { status: 400 });
    }
    const config = configs[0];
    if (config.connectionStatus !== 'connected') {
      return Response.json({ error: 'NAS nicht verbunden' }, { status: 400 });
    }

    const basePath = config.basePath || '/Backoffice';
    const auth = btoa(`${config.nasUsername}:${config.nasPassword}`);

    // Recursively scan folders
    const scanFolder = async (path) => {
      const url = config.nasUrl.replace(/\/$/, '') + path;
      const res = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '1',
          'Content-Type': 'application/xml',
        },
        body: `<?xml version="1.0"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:resourcetype/><D:getlastmodified/></D:prop></D:propfind>`,
      });

      if (!res.ok) return [];

      const xml = await res.text();
      const items = [];
      const responseRegex = /<D:response>([\s\S]*?)<\/D:response>/g;
      let match;

      while ((match = responseRegex.exec(xml)) !== null) {
        const block = match[1];
        const hrefMatch = block.match(/<D:href>(.*?)<\/D:href>/);
        const isCollection = block.includes('<D:collection');
        if (!hrefMatch) continue;

        let href = decodeURIComponent(hrefMatch[1]);
        // Strip WebDAV prefix to get just the path
        try {
          const u = new URL(href, config.nasUrl);
          href = u.pathname;
        } catch {}

        const name = href.split('/').filter(Boolean).pop() || '';
        if (!name || href === path || href === path + '/') continue;

        if (isCollection) {
          // Recurse into subfolders
          const subItems = await scanFolder(href.endsWith('/') ? href : href + '/');
          items.push(...subItems);
        } else {
          // Only process PDFs and images
          const ext = name.split('.').pop()?.toLowerCase();
          if (['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
            items.push({ name, path: href });
          }
        }
      }
      return items;
    };

    const allFiles = await scanFolder(basePath.endsWith('/') ? basePath : basePath + '/');

    // Get existing documents to avoid duplicates
    const existing = await base44.asServiceRole.entities.Document.list();
    const existingPaths = new Set(existing.map(d => d.nasPath).filter(Boolean));

    // Filter new files only
    const newFiles = allFiles.filter(f => !existingPaths.has(f.path));

    // Create Document records for new files
    let created = 0;
    for (const file of newFiles) {
      // Guess bereich from path
      let bereich = 'BAR';
      const lp = file.path.toLowerCase();
      if (lp.includes('privat') || lp.includes('familie')) bereich = 'PRIVAT_FAMILIE';
      else if (lp.includes('neben') || lp.includes('gewerbe')) bereich = 'NEBENGEWERBE';

      // Guess doc type
      let documentType = 'Sonstiges';
      const ln = file.name.toLowerCase();
      if (ln.includes('rechnung') || ln.includes('invoice')) documentType = 'Eingangsrechnung';
      else if (ln.includes('vertrag') || ln.includes('contract')) documentType = 'Vertrag';
      else if (ln.includes('kontoauszug') || ln.includes('auszug')) documentType = 'Kontoauszug';
      else if (ln.includes('versicherung')) documentType = 'Versicherung';
      else if (ln.includes('lohn') || ln.includes('gehalt')) documentType = 'Personalunterlage';

      await base44.asServiceRole.entities.Document.create({
        title: file.name.replace(/\.[^.]+$/, ''),
        bereich,
        documentType,
        status: 'neu',
        nasPath: file.path,
        ocrProcessed: false,
        isArchived: false,
        tags: ['nas-sync'],
      });
      created++;
    }

    // Update last sync time
    await base44.asServiceRole.entities.NasConfig.update(config.id, {
      lastSync: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      scanned: allFiles.length,
      newDocuments: created,
      message: `${allFiles.length} Dateien gefunden, ${created} neue Dokumente importiert`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});