// Decommissioned Game Service Worker — clears caches and unregisters itself
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* no-op */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Notify clients and clear caches again just in case
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach((client) => client.postMessage({ type: 'SW_DECOMMISSIONED' }));
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) { /* no-op */ }

      await self.clients.claim();

      // Unregister this SW and reload all controlled clients
      await self.registration.unregister();
      clientsList.forEach((client) => {
        try { client.navigate(client.url); } catch (e) { /* no-op */ }
      });
    } catch (e) { /* no-op */ }
  })());
});

// Intentionally no fetch handler — let the network handle everything
