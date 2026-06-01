import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileUrl, nasUrl, nasUsername, nasPassword, nasTargetPath } = await req.json();

  if (!fileUrl || !nasUrl || !nasUsername || !nasPassword || !nasTargetPath) {
    return Response.json({ error: 'Fehlende Parameter' }, { status: 400 });
  }

  // Download file from temporary URL
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    return Response.json({ error: 'Datei konnte nicht geladen werden' }, { status: 400 });
  }
  const fileBuffer = await fileResponse.arrayBuffer();
  const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

  const credentials = btoa(`${nasUsername}:${nasPassword}`);
  const uploadUrl = `${nasUrl.replace(/\/$/, '')}${nasTargetPath}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': contentType
    },
    body: fileBuffer
  });

  if (uploadResponse.status === 201 || uploadResponse.status === 200 || uploadResponse.status === 204) {
    return Response.json({ success: true, nasPath: nasTargetPath });
  } else {
    return Response.json({ success: false, message: `Upload fehlgeschlagen: HTTP ${uploadResponse.status}` });
  }
});