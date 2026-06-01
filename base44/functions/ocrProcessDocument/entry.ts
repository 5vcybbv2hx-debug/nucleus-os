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

WICHTIG: Der Gesamtumsatz auf einem Z-Abschlag enthält oft mehrere Zahlungsarten (Bar, EC, Gutscheine, Kreditkarte usw.).
Für "einnahmen" und "betrag" soll NUR der BAR-Umsatz (Bargeld) verwendet werden — NICHT der Gesamtumsatz.
Suche explizit nach einer Zeile wie "Bar", "Bargeld", "Bar-Umsatz", "Cash" und verwende diesen Wert.
Falls kein separater Bar-Betrag ausgewiesen ist, setze null.

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