import { base44 } from '@/api/base44Client';

/**
 * AuditLog-Helper — schreibt einen Eintrag bei allen Statusänderungen,
 * Archivierungen, Deaktivierungen, Erstellungen und Konvertierungen.
 *
 * Schema-Felder (AuditLog-Entität):
 *   entityType, entityId, action, oldValue, newValue,
 *   performedBy, performedByName, timestamp, user, source
 */
export async function logAudit({ action, entityType, entityId, previousValue = null, newValue = null, source = 'manuell' }) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.AuditLog.create({
      action,
      entityType,
      entityId,
      oldValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      performedBy: user?.id || 'system',
      performedByName: user?.full_name || user?.email || 'System',
      user: user?.id || null,
      timestamp: new Date().toISOString(),
      source,
    });
  } catch (e) {
    // Audit darf niemals den Hauptfluss blockieren
    console.warn('AuditLog konnte nicht geschrieben werden:', e?.message || e);
  }
}