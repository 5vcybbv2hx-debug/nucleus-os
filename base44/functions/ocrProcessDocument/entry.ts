import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileUrl, documentType } = await req.json();

  if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

  const isKassenbericht = documentType === 'Kassenbericht' || documentType === 'Z-Abschlag';

  const prompt = isKassenbericht
    ? `Du bist ein OCR-System für Kassensysteme. Analysiere diesen Z-Abschlag / Kassenbericht und extrahiere folgende Felder.

WICHTIG zur Betragsermittlung:
Auf dem Z-Abschlag gibt es einen Abschnitt namens "Umsatz" (oder ähnlich: "Umsatzübersicht", "Zahlungsarten").
Innerhalb dieses Abschnitts sind die Zahlungsarten einzeln aufgelistet, z.B.:
  Umsatz
    Bar:        123,45 €
    EC:         456,78 €
    Gutschein:   12,00 €

Verwende für "einnahmen" und "betrag" NUR den Wert hinter "Bar" (oder "Bargeld", "Cash") innerhalb des Umsatz-Abschnitts.
NICHT den Gesamtumsatz, NICHT EC, NICHT Gutscheine, NICHT Kreditkarte.
Falls kein Bar-Betrag gefunden wird, setze null.

Extrahiere:
- datum: Datum des Abschlusses (Format: YYYY-MM-DD, oder null)
- betrag: NUR der Bar-Umsatz (Bargeld) als Zahl in EUR — NICHT Gesamtumsatz (oder null)
- einnahmen: NUR der Bar-Umsatz (Bargeld) als Zahl — NICHT EC, NICHT Gutscheine (oder null)
- ausgaben: Stornos / Retouren / Ausgaben als Zahl (oder null)
- anfangsbestand: Kassenbestand am Anfang als Zahl (oder null)
- endbestand: Kassenbestand am Ende / Kassenstand als Zahl (oder null)
- absender: Name des Unternehmens / der Kasse (oder null)
- rechnungsnummer: Z-Nummer / Abschlussnummer (oder null)
- kategorie: "Z-Abschlag"
- zahlungsart: "bar"
- kurzinhalt: Kurze Beschreibung inkl. Hinweis auf erkannte Zahlungsarten

Antworte NUR mit einem JSON-Objekt, keine weiteren Erklärungen.`
    : `Du bist ein OCR-System für Geschäftsdokumente. Analysiere dieses Dokument und extrahiere folgende Felder strukturiert.
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
        einnahmen: { type: "number" },
        ausgaben: { type: "number" },
        anfangsbestand: { type: "number" },
        endbestand: { type: "number" },
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