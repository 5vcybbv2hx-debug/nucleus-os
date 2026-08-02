import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// barAdapter — Lesender Zugriff auf SAVO Bar-App Daten über ExternalInsights
// V2.4 — Fixed: uses .filter() instead of .list({ filter: ... })

const SAVO_APP_ID = '695532713e60f5ccfc3522b9';
const CONNECTION_ID = '6a6e7b2d469d2c9496225c8b';
const STALE_THRESHOLD_HOURS = 2;

const MOCK_INSIGHTS = [
  { type: 'staffing', title: 'Mock: 3 Mitarbeiter aktiv', summary: 'Testdaten — nicht live', severity: 'info', effectiveDate: new Date().toISOString().slice(0, 10), externalId: 'mock_staffing' },
  { type: 'task', title: 'Mock: 10 offene Aufgaben', summary: 'Testdaten — nicht live', severity: 'info', effectiveDate: new Date().toISOString().slice(0, 10), externalId: 'mock_tasks' },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'getBarSnapshot';

    if (action === 'getConnectionStatus') {
      return await getConnectionStatus(base44);
    } else if (action === 'toggleConnection') {
      return await toggleConnection(base44, body?.enabled, body?.mode);
    } else {
      return await getBarSnapshot(base44);
    }
  } catch (error) {
    console.error('[barAdapter] Error:', error);
    return Response.json({ 
      mode: 'mock', 
      snapshot: { source: 'SAVO', mode: 'mock', stale: true, insights: MOCK_INSIGHTS }, 
      error: error.message 
    });
  }
}

async function getConnectionStatus(base44) {
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);
  const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });

  return Response.json({
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
  });
}

async function getBarSnapshot(base44) {
  const conn = await base44.entities.IntegrationConnection.get(CONNECTION_ID);

  if (conn.enabled === false || conn.connection_mode === 'disabled') {
    return Response.json({ 
      mode: 'mock', 
      snapshot: { source: 'SAVO', mode: 'mock', stale: true, lastSync: null, insights: MOCK_INSIGHTS } 
    });
  }

  const allInsights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });
  const insights = (allInsights || []).sort((a, b) => 
    new Date(b.last_synced_at || 0).getTime() - new Date(a.last_synced_at || 0).getTime()
  ).slice(0, 50);

  const lastSync = conn.last_success_at || conn.last_sync_at;
  let isStale = false;
  if (lastSync) {
    const diffMs = Date.now() - new Date(lastSync).getTime();
    isStale = diffMs > STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  } else {
    isStale = true;
  }

  const mode = conn.connection_mode === 'mock' ? 'mock' : (isStale ? 'stale' : 'read_only');

  const formattedInsights = insights.map(ins => ({
    type: ins.type,
    title: ins.title,
    summary: ins.summary,
    severity: ins.severity || 'info',
    effectiveDate: ins.effective_date,
    externalId: ins.external_reference,
  }));

  return Response.json({
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
  });
}

async function toggleConnection(base44, enabled, mode) {
  await base44.entities.IntegrationConnection.update(CONNECTION_ID, {
    enabled: enabled !== false,
    connection_mode: enabled ? (mode || 'read_only') : 'disabled',
    status: enabled ? 'active' : 'inactive',
  });

  return Response.json({ success: true, enabled: enabled !== false });
}
