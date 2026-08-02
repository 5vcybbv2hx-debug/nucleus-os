import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Bar-Adapter V2.5 — Liest ExternalInsights, korrekte SDK-Signatur
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const action = body?.action || 'getBarSnapshot';
    
    const me = await base44.auth.me();
    if (!me) {
      return new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const CONNECTION_ID = '6a6e7b2d469d2c9496225c8b';
    const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

    const connection = await base44.entities.IntegrationConnection.get(CONNECTION_ID);
    
    if (!connection) {
      return new Response(JSON.stringify({ error: 'Keine Bar-App-Verbindung', mode: 'disabled' }), 
        { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'getConnectionStatus') {
      const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });
      return new Response(JSON.stringify({
        name: connection.name || 'Bar-App (SAVO)',
        source_app: connection.source_app || '695532713e60f5ccfc3522b9',
        mode: connection.connection_mode || 'read_only',
        status: connection.status || 'active',
        enabled: connection.enabled !== false,
        last_sync_at: connection.last_sync_at,
        last_success_at: connection.last_success_at,
        insight_count: (insights || []).length,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'toggleConnection') {
      const newEnabled = body?.enabled !== undefined ? body.enabled : !connection.enabled;
      await base44.entities.IntegrationConnection.update(CONNECTION_ID, {
        enabled: newEnabled,
        connection_mode: newEnabled ? 'read_only' : 'disabled',
        status: newEnabled ? 'active' : 'inactive',
      });
      return new Response(JSON.stringify({ success: true }), 
        { headers: { 'Content-Type': 'application/json' } });
    }

    // getBarSnapshot
    const now = new Date();
    const insights = await base44.entities.ExternalInsight.filter({ organization: 'BAR', status: 'active' });
    const validInsights = insights || [];

    const lastSuccessRaw = connection.last_success_at || connection.last_sync_at;
    const lastSuccess = lastSuccessRaw ? new Date(lastSuccessRaw) : null;
    const ageMs = lastSuccess ? (now.getTime() - lastSuccess.getTime()) : Infinity;
    const isStale = validInsights.length === 0 || ageMs > STALE_THRESHOLD_MS;

    const mode = connection.enabled === false ? 'disabled'
      : connection.connection_mode === 'mock' ? 'mock'
      : isStale ? 'stale'
      : 'read_only';

    const sevOrder = { critical: 0, high: 1, warning: 2, info: 3 };
    const formatted = validInsights.map(i => ({
      type: i.insight_type || i.type,
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
    console.error('[barAdapter V2.5] Error:', error?.message || error);
    return new Response(JSON.stringify({ mode: 'stale', snapshot: { source: 'SAVO', stale: true, insights: [] }, error: error?.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});
