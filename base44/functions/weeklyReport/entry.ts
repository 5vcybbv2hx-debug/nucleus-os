// LEGACY — Wochenbericht basiert auf Legacy-Entitäten (Deadline, FinanceEntry, Vehicle, Task mit altem Status).
// Wird in einem späteren Paket auf das Atlas-Datenmodell migriert.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all data in parallel
    const [docs, finances, deadlines, vehicles, tasks, users] = await Promise.all([
      base44.asServiceRole.entities.Document.list('-created_date', 100),
      base44.asServiceRole.entities.FinanceEntry.list('-date', 200),
      base44.asServiceRole.entities.Deadline.list('-dueDate', 100),
      base44.asServiceRole.entities.Vehicle.list(),
      base44.asServiceRole.entities.Task.list('-created_date', 50),
      base44.asServiceRole.entities.User.list(),
    ]);

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // This month finance
    const monthFinance = finances.filter(f => f.date && new Date(f.date) >= monthStart);
    const totalIncome = monthFinance.filter(f => f.type === 'einnahme').reduce((s, f) => s + (f.amount || 0), 0);
    const totalExpenses = monthFinance.filter(f => f.type === 'ausgabe').reduce((s, f) => s + (f.amount || 0), 0);

    // Upcoming deadlines (next 7 days)
    const urgentDeadlines = deadlines.filter(d => {
      if (!d.dueDate || d.status === 'erledigt') return false;
      const due = new Date(d.dueDate);
      return due <= weekFromNow && due >= now;
    });

    // Overdue deadlines
    const overdueDeadlines = deadlines.filter(d => d.dueDate && d.status !== 'erledigt' && new Date(d.dueDate) < now);

    // Open invoices (docs with status 'offen')
    const openInvoices = docs.filter(d => d.status === 'offen');

    // Pending docs
    const pendingDocs = docs.filter(d => d.status === 'neu' || d.status === 'wartet_auf_pruefung');

    // Vehicle alerts
    const vehicleAlerts = vehicles.flatMap(v => {
      const alerts = [];
      if (v.huDatum) {
        const days = Math.ceil((new Date(v.huDatum) - now) / (1000 * 60 * 60 * 24));
        if (days <= 30 && days >= 0) alerts.push(`${v.name}: HU/TÜV in ${days} Tagen`);
        if (days < 0) alerts.push(`${v.name}: HU/TÜV ÜBERFÄLLIG (${Math.abs(days)} Tage)`);
      }
      if (v.versicherungAblauf) {
        const days = Math.ceil((new Date(v.versicherungAblauf) - now) / (1000 * 60 * 60 * 24));
        if (days <= 30 && days >= 0) alerts.push(`${v.name}: Versicherung in ${days} Tagen`);
      }
      return alerts;
    });

    const formatCurrency = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const monthName = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body { font-family: -apple-system, Arial, sans-serif; background: #0f1117; color: #e2e8f0; margin: 0; padding: 20px; }
.card { background: #1a1f2e; border: 1px solid #2a3045; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.subtitle { color: #64748b; font-size: 13px; }
.section-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; font-weight: 600; }
.stat { font-size: 24px; font-weight: 700; }
.green { color: #4ade80; } .red { color: #f87171; } .orange { color: #fb923c; } .blue { color: #60a5fa; }
.item { padding: 8px 0; border-bottom: 1px solid #2a3045; font-size: 13px; }
.item:last-child { border-bottom: none; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style></head>
<body>
<div class="title">📊 Projekt Atlas · Wochenbericht</div>
<div class="subtitle" style="margin-bottom:20px">${now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

<div class="grid2">
  <div class="card">
    <div class="section-title">Einnahmen ${monthName}</div>
    <div class="stat green">+${formatCurrency(totalIncome)} €</div>
  </div>
  <div class="card">
    <div class="section-title">Ausgaben ${monthName}</div>
    <div class="stat red">-${formatCurrency(totalExpenses)} €</div>
  </div>
</div>

<div class="card">
  <div class="section-title">Saldo ${monthName}</div>
  <div class="stat ${totalIncome - totalExpenses >= 0 ? 'green' : 'red'}">${totalIncome - totalExpenses >= 0 ? '+' : ''}${formatCurrency(totalIncome - totalExpenses)} €</div>
</div>

${urgentDeadlines.length > 0 || overdueDeadlines.length > 0 ? `
<div class="card">
  <div class="section-title">⚠️ Fristen (${urgentDeadlines.length + overdueDeadlines.length})</div>
  ${overdueDeadlines.slice(0, 5).map(d => `<div class="item"><span class="badge red">ÜBERFÄLLIG</span> ${d.title} — ${new Date(d.dueDate).toLocaleDateString('de-DE')}</div>`).join('')}
  ${urgentDeadlines.slice(0, 5).map(d => `<div class="item"><span class="badge orange">DIESE WOCHE</span> ${d.title} — ${new Date(d.dueDate).toLocaleDateString('de-DE')}</div>`).join('')}
</div>` : ''}

${vehicleAlerts.length > 0 ? `
<div class="card">
  <div class="section-title">🚗 Fahrzeug-Fristen</div>
  ${vehicleAlerts.map(a => `<div class="item orange">${a}</div>`).join('')}
</div>` : ''}

${openInvoices.length > 0 ? `
<div class="card">
  <div class="section-title">📄 Offene Rechnungen (${openInvoices.length})</div>
  ${openInvoices.slice(0, 5).map(d => `<div class="item">${d.title} ${d.ocrBetrag ? `— ${formatCurrency(d.ocrBetrag)} €` : ''} ${d.ocrAbsender ? `· ${d.ocrAbsender}` : ''}</div>`).join('')}
</div>` : ''}

${pendingDocs.length > 0 ? `
<div class="card">
  <div class="section-title">📥 Ausstehende Dokumente (${pendingDocs.length})</div>
  ${pendingDocs.slice(0, 5).map(d => `<div class="item">${d.title} — ${d.documentType}</div>`).join('')}
</div>` : ''}

<div style="text-align:center;padding-top:20px;font-size:11px;color:#374151">Projekt Atlas — Automatischer Wochenbericht</div>
</body></html>`;

    // Send to all admin users
    const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'SUPERADMIN');
    for (const u of adminUsers) {
      if (u.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: `📊 Projekt Atlas Wochenbericht — ${now.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          body: htmlBody,
        });
      }
    }

    return Response.json({ success: true, sent_to: adminUsers.length, report_date: now.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});