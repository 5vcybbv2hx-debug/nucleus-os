import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This function is called by the scheduled automation every 5 minutes.
// It checks the configured syncInterval in NasConfig and only runs the actual
// sync if enough time has passed since the last sync.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const configs = await base44.asServiceRole.entities.NasConfig.list();
    if (!configs || configs.length === 0) {
      return Response.json({ skipped: true, reason: 'Keine NAS-Konfiguration' });
    }

    const config = configs[0];

    if (!config.syncEnabled) {
      return Response.json({ skipped: true, reason: 'Sync deaktiviert' });
    }

    if (config.connectionStatus !== 'connected') {
      return Response.json({ skipped: true, reason: 'NAS nicht verbunden' });
    }

    // Check if enough time has passed
    const intervalMinutes = parseInt(config.syncInterval || '60', 10);
    if (config.lastSync) {
      const lastSync = new Date(config.lastSync);
      const minutesSince = (Date.now() - lastSync.getTime()) / 1000 / 60;
      if (minutesSince < intervalMinutes) {
        return Response.json({
          skipped: true,
          reason: `Nächster Sync in ${Math.ceil(intervalMinutes - minutesSince)} Minuten`,
        });
      }
    }

    // Delegate to the main scan function
    const result = await base44.asServiceRole.functions.invoke('nasSyncScan', {});
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});