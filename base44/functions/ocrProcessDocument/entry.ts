import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileUrl, documentType } = await req.json();

  if (!fileUrl) return Response.json({ error: 'fileUrl required' }, { status: 400 });

  const isKassenbericht = documentType === 'Kassenbericht' || documentType === 'Z-Abschlag';

  const prompt = isKassenbericht
    ? `Du bist ein OCR-System für Kassensysteme (Gastware/Kassensoftware). Analysiere diesen Z-Abschlag und extrahiere die folgenden Felder exakt.

DATUM:
Das Datum steht im Titel des Dokuments, z.B. "Z-Abschlag Nr. 1784 vom 02.01.2026".
Verwende dieses Datum (Format: YYYY-MM-DD). NICHT das Druckdatum ("Druckzeit").

BARUMSATZ (betrag / einnahmen):
Im Abschnitt "Umsatz" gibt es eine Tabelle mit Spalten: Finanzart / Mwst Satz / Netto / Mwst / Brutto.
Die Tabelle hat Unterabschnitte für jede Zahlungsart, z.B. "EC-Cash" und "Bar".
Suche die Zeile "Summe Bar:" — der Wert in der letzten Spalte (Brutto) ist der Bar-Bruttoumsatz.
Beispiel: "Summe Bar: 831,42 € 157,98 € 989,40 €" → betrag = 989.40

Verwende NUR den Brutto-Wert der Zeile "Summe Bar:".
NICHT "Summe EC-Cash", NICHT "Umsatz total", NICHT den Netto-Wert.

STORNOS (ausgaben):
Suche nach "Summe stornierte Rechnungen:" und nimm den Brutto-Wert (letzte Spalte).

Extrahiere:
- datum: Datum aus dem Dokumenttitel "Z-Abschlag Nr. XXX vom DD.MM.YYYY" → YYYY-MM-DD
- betrag: Brutto-Wert aus Zeile "Summe Bar:" als Zahl (z.B. 989.40)
- einnahmen: identisch mit betrag (Brutto-Wert "Summe Bar:")
- ausgaben: Brutto-Wert aus "Summe stornierte Rechnungen:" als Zahl (oder 0)
- anfangsbestand: null (nicht vorhanden)
- endbestand: null (nicht vorhanden)
- absender: Firmenname oben im Dokument (z.B. "SAVO Lounge - Club")
- rechnungsnummer: Z-Abschlag-Nummer (z.B. "1784")
- kategorie: "Z-Abschlag"
- zahlungsart: "bar"
- kurzinhalt: Kurze Zusammenfassung mit Bar-Umsatz, EC-Umsatz und Gesamtumsatz

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
    model: "claude_sonnet_4_6",
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