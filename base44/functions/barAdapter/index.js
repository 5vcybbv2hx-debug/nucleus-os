// barAdapter — V2.4 — Lesender Zugriff auf SAVO Bar-App Daten über ExternalInsights
// Architektur: Agent-getriebene Sync → ExternalInsights in Atlas → barAdapter liest lokal
// V2.4: Korrekte SDK-Pattern (createClientFromRequest), .filter() statt .list({ filter })

import { createClient } from '@base44/nodejs';

const SAVO_APP_ID = '695532713e60f5ccfc3522b9';
const CONNECTION_ID = '6a6e7b2d469d2c9496225c8b';
const STALE_THRESHOLD_HOURS = 2;

// Mock nur als letzter Fallback (should never show in production)
const MOCK_INSIGHTS = [
  { type: 'staffing', title: 'Verbindung wird aufgebaut…', summary: 'Daten werden geladen', severity: 'info', effectiveDate: new Date().toISOString().slice(0, 10), externalId: 'mock_loading' },
];

export async function barAdapter(req, res) {
  const args = req?.body || req || {};
  const action = args?.action || 'getBarSnapshot';

  const base44 = createClient(req);

  try {
    if (action === 'getConnectionStatus') {
      return res.json(await getConnectionStatus(base44));
    } else if (action === 'toggleConnection') {
      return res.json(await toggleConnection(base44, args?.enabled, args?.mode));
    } else {
      return res.json(await getBarSnapshot(base44));
    }
  } catch (error) {
    console.error('[barAdapter V2.4] Error:', error?.message || error);
    return res.json({
      mode: 'stale',
      snapshot: { source: 'SAVO', mode: 'stale', stale: true, insights: MOCK_INSIGHTS },
      error: error?.message || 'Unbekannter Fehler',
    });
  }
}

async function getConnectionStatus(base44) {
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);
  const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });

  return {
    name: conn.name || 'Bar-App (SAVO)',
    source_app: conn.source_app || SAVO_APP_ID,
    mode: conn.connection_mode || 'read_only',
    status: conn.status || 'active',
    enabled: conn.enabled !== false,
    last_sync_at: conn.last_sync_at,
    last_success_at: conn.last_success_at,
    last_error: conn.last_error || '',
    data_scope: conn.data_scope || [],
    write_scope: conn.write_scope || [],
    insight_count: insights?.length || 0,
  };
}

async function getBarSnapshot(base44) {
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);

  if (conn.enabled === false || conn.connection_mode === 'disabled') {
    return { mode: 'mock', snapshot: { source: 'SAVO', mode: 'mock', stale: true, lastSync: null, insights: MOCK_INSIGHTS } };
  }

  // Aktive Insights lesen — .filter() statt .list({ filter })
  const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });

  // Stale-Prüfung (2h Threshold)
  const lastSync = conn.last_success_at || conn.last_sync_at;
  let isStale = !lastSync;
  if (lastSync) {
    const diffMs = Date.now() - new Date(lastSync).getTime();
    isStale = diffMs > STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  }

  const mode = conn.connection_mode === 'mock' ? 'mock' : (isStale ? 'stale' : 'read_only');

  const formattedInsights = (insights || []).map(ins => ({
    type: ins.insight_type || ins.type,
    title: ins.title,
    summary: ins.summary,
    severity: ins.severity || 'info',
    effectiveDate: ins.effective_date,
    externalId: ins.external_reference,
    organization: ins.organization,
  })).sort((a, b) => {
    const order = { critical: 0, high: 1, warning: 2, info: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  return {
    mode,
    snapshot: {
      source: 'SAVO',
      mode,
      stale: isStale,
      lastSync,
      insights: formattedInsights,
    },
    connection: {
      name: conn.name,
      source_app: conn.source_app,
      last_sync_at: conn.last_sync_at,
      last_success_at: conn.last_success_at,
      status: conn.status,
      enabled: conn.enabled !== false,
    },
  };
}

async function toggleConnection(base44, enabled, mode) {
  await base44.entities.IntegrationConnection.update(CONNECTION_ID, {
    enabled: enabled !== false,
    connection_mode: enabled ? (mode || 'read_only') : 'disabled',
    status: enabled ? 'active' : 'inactive',
  });
  return { success: true, enabled: enabled !== false };
}
