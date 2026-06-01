import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Funktioniert sowohl als manuelle als auch als geplante Ausführung
    const body = await req.json().catch(() => ({}));
    const manualFolderPath = body.folderPath || null; // optionaler Override

    const configs = await base44.asServiceRole.entities.NasConfig.list();
    if (!configs || configs.length === 0) {
      return Response.json({ error: 'Keine NAS-Konfiguration gefunden' }, { status: 400 });
    }
    const config = configs[0];
    if (config.connectionStatus !== 'connected') {
      return Response.json({ error: 'NAS nicht verbunden' }, { status: 400 });
    }

    // Zielordner: entweder manuell übergeben oder Standard aus NAS-Config
    const basePath = config.basePath || '/Backoffice';
    const scanPath = manualFolderPath || `/Backoffice OS/SAVO/01FINANZEN/Kassenberichte/`;

    const auth = btoa(`${config.nasUsername}:${config.nasPassword}`);

    // Ordner-Inhalt inkl. Unterordner abrufen
    const listFolder = async (path) => {
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
        try { const u = new URL(href, config.nasUrl); href = u.pathname; } catch {}
        const name = href.split('/').filter(Boolean).pop() || '';
        if (!name || href === path || href === path + '/') continue;
        if (isCollection) {
          const sub = await listFolder(href.endsWith('/') ? href : href + '/');
          items.push(...sub);
        } else {
          const ext = name.split('.').pop()?.toLowerCase();
          if (['pdf', 'jpg', 'jpeg', 'png', 'xml'].includes(ext)) {
            items.push({ name, path: href });
          }
        }
      }
      return items;
    };

    const allFiles = await listFolder(scanPath.endsWith('/') ? scanPath : scanPath + '/');

    // Bereits importierte Z-Abschlüsse anhand nasPath prüfen
    const existing = await base44.asServiceRole.entities.CashBook.list();
    const existingPaths = new Set(existing.map(e => e.nasPath).filter(Boolean));

    const newFiles = allFiles.filter(f => !existingPaths.has(f.path));

    let imported = 0;
    const results = [];

    for (const file of newFiles) {
      // Datei von NAS herunterladen und zu Base44 hochladen für OCR
      const fileRes = await fetch(config.nasUrl.replace(/\/$/, '') + file.path, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (!fileRes.ok) continue;

      const blob = await fileRes.blob();
      const formData = new FormData();
      formData.append('file', blob, file.name);

      // Zu Base44-Storage hochladen (UploadFile erwartet ein File/Blob)
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
      const fileUrl = uploaded.file_url;
      if (!fileUrl) continue;

      // OCR für Z-Abschlag
      let ocr = {};
      const ocrRes = await base44.asServiceRole.functions.invoke('ocrProcessDocument', {
        fileUrl,
        documentType: 'Kassenbericht'
      });
      ocr = ocrRes?.ocr || {};

      // Datum aus Dateiname raten falls OCR kein Datum liefert
      let date = ocr.datum || null;
      if (!date) {
        const dateMatch = file.name.match(/(\d{4})[.\-_]?(\d{2})[.\-_]?(\d{2})/);
        if (dateMatch) date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        else date = new Date().toISOString().substring(0, 10);
      }

      await base44.asServiceRole.entities.CashBook.create({
        date,
        bereich: 'BAR',
        openingBalance: ocr.anfangsbestand || 0,
        closingBalance: ocr.endbestand || 0,
        totalIncome: ocr.einnahmen || ocr.betrag || 0,
        totalExpenses: ocr.ausgaben || 0,
        notes: ocr.kurzinhalt || file.name,
        fileUrl,
        nasPath: file.path,
        isLocked: false,
      });

      imported++;
      results.push({ file: file.name, date, imported: true });
    }

    return Response.json({
      success: true,
      scanned: allFiles.length,
      imported,
      skipped: allFiles.length - newFiles.length,
      results,
      message: `${allFiles.length} Dateien gefunden, ${imported} neue Z-Abschlüsse importiert`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});