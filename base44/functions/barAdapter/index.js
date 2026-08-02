// barAdapter — Lesender Zugriff auf SAVO Bar-App Daten über ExternalInsights
// Paket 2B: Agent-getriebene Synchronisation (kein direkter Cross-App-Zugriff)
// V2.2 — Liest aus ExternalInsight, kein Cross-App-Zugriff nötig

const SAVO_APP_ID = '695532713e60f5ccfc3522b9';
const CONNECTION_ID = '6a6e7b2d469d2c9496225c8b';
const STALE_THRESHOLD_HOURS = 2;

const MOCK_INSIGHTS = [
  { type: 'staffing', title: 'Mock: 3 Mitarbeiter aktiv', summary: 'Testdaten — nicht live', severity: 'info', effectiveDate: new Date().toISOString().slice(0, 10), externalId: 'mock_staffing' },
  { type: 'task', title: 'Mock: 10 offene Aufgaben', summary: 'Testdaten — nicht live', severity: 'info', effectiveDate: new Date().toISOString().slice(0, 10), externalId: 'mock_tasks' },
];

export async function barAdapter(args) {
  const action = args?.action || 'getBarSnapshot';

  try {
    if (action === 'getConnectionStatus') {
      return await getConnectionStatus();
    } else if (action === 'toggleConnection') {
      return await toggleConnection(args?.enabled, args?.mode);
    } else {
      return await getBarSnapshot();
    }
  } catch (error) {
    console.error('[barAdapter] Error:', error);
    return { mode: 'mock', snapshot: { source: 'SAVO', mode: 'mock', stale: true, insights: MOCK_INSIGHTS }, error: error.message };
  }
}

async function getConnectionStatus() {
  const base44 = (await import('@base44/nodejs')).default;
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);

  const insights = await base44.entities.ExternalInsight.list({
    filter: { organization: 'BAR', status: 'active' },
    limit: 100,
  });

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

async function getBarSnapshot() {
  const base44 = (await import('@base44/nodejs')).default;

  // Verbindung prüfen
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);

  // Wenn deaktiviert → Mock
  if (conn.enabled === false || conn.connection_mode === 'disabled') {
    return { mode: 'mock', snapshot: { source: 'SAVO', mode: 'mock', stale: true, lastSync: null, insights: MOCK_INSIGHTS } };
  }

  // Aktive Insights lesen
  const insights = await base44.entities.ExternalInsight.list({
    filter: { organization: 'BAR', status: 'active' },
    limit: 50,
    sort: '-last_synced_at',
  });

  // Stale-Prüfung (2h Threshold)
  const lastSync = conn.last_success_at || conn.last_sync_at;
  let isStale = false;
  if (lastSync) {
    const diffMs = Date.now() - new Date(lastSync).getTime();
    isStale = diffMs > STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  } else {
    isStale = true;
  }

  const mode = conn.connection_mode === 'mock' ? 'mock' : (isStale ? 'stale' : 'read_only');

  // Insights formatieren
  const formattedInsights = (insights || []).map(ins => ({
    type: ins.type,
    title: ins.title,
    summary: ins.summary,
    severity: ins.severity || 'info',
    effectiveDate: ins.effective_date,
    externalId: ins.external_reference,
  }));

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

async function toggleConnection(enabled, mode) {
  const base44 = (await import('@base44/nodejs')).default;
  await base44.entities.IntegrationConnection.update(CONNECTION_ID, {
    enabled: enabled !== false,
    connection_mode: enabled ? (mode || 'read_only') : 'disabled',
    status: enabled ? 'active' : 'inactive',
  });

  return { success: true, enabled: enabled !== false };
}
