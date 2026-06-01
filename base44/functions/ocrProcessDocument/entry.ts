import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileUrl, documentType } = await req.json();

  if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

  const prompt = `Du bist ein OCR-System für Geschäftsdokumente. Analysiere dieses Dokument und extrahiere folgende Felder strukturiert.
Dokumenttyp-Hinweis: ${documentType || 'unbekannt'}

Extrahiere:
- datum: Rechnungsdatum / Dokumentdatum (Format: YYYY-MM-DD, oder null)
- betrag: Gesamtbetrag in EUR als Zahl (nur Zahl, kein €-Symbol, oder null)
- absender: Name des Absenders / Lieferanten / Unternehmens (oder null)
- rechnungsnummer: Rechnungsnummer oder Belegnummer (oder null)
- kategorie: Kategorie des Dokuments (z.B. "Miete", "Strom", "Personal", "Waren", "Dienstleistung", "Versicherung", etc.)
- zahlungsart: Zahlungsart wenn erkennbar (bar, ec, überweisung, lastschrift, kreditkarte, oder null)
- kurzinhalt: Kurze Beschreibung des Dokuments in 1-2 Sätzen

Antworte NUR mit einem JSON-Objekt, keine weiteren Erklärungen.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [fileUrl],
    response_json_schema: {
      type: "object",
      properties: {
        datum: { type: "string" },
        betrag: { type: "number" },
        absender: { type: "string" },
        rechnungsnummer: { type: "string" },
        kategorie: { type: "string" },
        zahlungsart: { type: "string" },
        kurzinhalt: { type: "string" }
      }
    }
  });

  return Response.json({ success: true, ocr: result });
});