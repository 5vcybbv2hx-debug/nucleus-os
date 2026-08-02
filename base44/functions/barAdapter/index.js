import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const body = await req.json();
    const action = body?.action || 'getBarSnapshot';
    const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

    let connections = await base44.entities.IntegrationConnection.filter({
      source_app: '695532713e60f5ccfc3522b9',
      enabled: true
    });
    if (!connections || connections.length === 0) {
      connections = await base44.entities.IntegrationConnection.filter({
        source_system: 'SAVO'
      });
    }
    const connection = connections?.[0];

    if (!connection) {
      return new Response(JSON.stringify({ mode: 'disabled', snapshot: { insights: [] } }),
        { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'getConnectionStatus') {
      const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });
      return new Response(JSON.stringify({
        name: connection.name || 'Bar-App (SAVO)',
        source_app: connection.source_app,
        mode: connection.connection_mode || 'read_only',
        status: connection.status || 'active',
        enabled: connection.enabled !== false,
        last_sync_at: connection.last_sync_at,
        last_success_at: connection.last_success_at,
        insight_count: (insights || []).length,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });
    const validInsights = insights || [];

    const lastSuccessRaw = connection.last_success_at || connection.last_sync_at;
    const lastSuccess = lastSuccessRaw ? new Date(lastSuccessRaw) : null;
    const isStale = validInsights.length === 0 || !lastSuccess ||
      (Date.now() - lastSuccess.getTime()) > STALE_THRESHOLD_MS;

    const mode = connection.enabled === false ? 'disabled'
      : connection.connection_mode === 'mock' ? 'mock'
      : isStale ? 'stale'
      : 'read_only';

    const sevOrder = { critical: 0, high: 1, warning: 2, info: 3 };
    const formatted = validInsights.map(i => ({
      type: i.type || i.insight_type,
      title: i.title,
      summary: i.summary,
      severity: i.severity || 'info',
      effectiveDate: i.effective_date,
      externalId: i.external_reference,
    })).sort((a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));

    return new Response(JSON.stringify({
      mode,
      snapshot: { source: 'SAVO', mode, stale: isStale, lastSync: lastSuccessRaw, insights: formatted },
      connection: { name: connection.name, source_app: connection.source_app, last_sync_at: connection.last_sync_at, last_success_at: connection.last_success_at, enabled: connection.enabled !== false },
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[barAdapter V2.6] Error:', error?.message || error);
    return new Response(JSON.stringify({ mode: 'stale', snapshot: { stale: true, insights: [] }, error: error?.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});