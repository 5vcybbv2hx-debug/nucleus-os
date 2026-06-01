import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { bereich, month, year } = await req.json();

  // Fetch finance data
  const query = { isArchived: false };
  if (bereich && bereich !== 'ALL') query.bereich = bereich;

  const allEntries = await base44.entities.FinanceEntry.filter(query);

  // Filter by month/year if provided
  const filtered = month && year
    ? allEntries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
    : allEntries;

  const einnahmen = filtered.filter(e => e.type === 'einnahme').reduce((s, e) => s + e.amount, 0);
  const ausgaben = filtered.filter(e => e.type === 'ausgabe').reduce((s, e) => s + e.amount, 0);
  const fixkosten = filtered.filter(e => e.isFixkost && e.type === 'ausgabe').reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const catBreakdown = {};
  filtered.filter(e => e.type === 'ausgabe').forEach(e => {
    catBreakdown[e.category || 'Sonstiges'] = (catBreakdown[e.category || 'Sonstiges'] || 0) + e.amount;
  });

  const prompt = `Du bist ein Finanzberater-KI für ein kleines Familienunternehmen (Bar, Privat, Nebengewerbe).
Analysiere folgende Finanzdaten für ${bereich || 'alle Bereiche'}, Zeitraum: ${month ? `${month}/${year}` : 'alle Zeit'}:

- Gesamteinnahmen: ${einnahmen.toFixed(2)}€
- Gesamtausgaben: ${ausgaben.toFixed(2)}€
- davon Fixkosten: ${fixkosten.toFixed(2)}€
- Nettoergebnis: ${(einnahmen - ausgaben).toFixed(2)}€
- Fixkostenquote: ${einnahmen > 0 ? ((fixkosten / einnahmen) * 100).toFixed(1) : 0}%

Ausgaben nach Kategorien:
${Object.entries(catBreakdown).map(([k, v]) => `  - ${k}: ${v.toFixed(2)}€`).join('\n')}

Gib eine kurze, praktische Analyse mit:
1. Liquiditätsstatus (kritisch/gut/sehr gut)
2. Top 2-3 Sparpotenziale
3. Warnung falls Fixkostenquote > 70%
4. Kurzer Trend-Kommentar
5. Ein konkreter Handlungsvorschlag

Antworte auf Deutsch, prägnant und handlungsorientiert.`;

  const analysis = await base44.integrations.Core.InvokeLLM({ prompt });

  return Response.json({
    success: true,
    summary: { einnahmen, ausgaben, fixkosten, netto: einnahmen - ausgaben, fixkostenQuote: einnahmen > 0 ? (fixkosten / einnahmen) * 100 : 0 },
    analysis,
    categoryBreakdown: catBreakdown
  });
});