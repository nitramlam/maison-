// Service worker de l'app : reçoit les notifications et met la pastille sur l'icône.
const BADGE_KEY = '/__badge';
async function getBadge() { try { const r = await (await caches.open('maison-badge')).match(BADGE_KEY); return r ? Number(await r.text()) || 0 : 0; } catch (_) { return 0; } }
async function setBadge(n) {
  n = Math.max(0, Math.min(99, n | 0));
  try { await (await caches.open('maison-badge')).put(BADGE_KEY, new Response(String(n))); } catch (_) {}
  try { if (self.navigator.setAppBadge) { n ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge(); } } catch (_) {}
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', e => { if (e.data && e.data.type === 'badge') e.waitUntil(setBadge(e.data.n)); });
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    await self.registration.showNotification(d.title || 'Maison', {
      body: d.body || '', icon: 'icon-192.png?v=2', badge: 'icon-192.png?v=2', tag: d.tag || undefined, data: { url: d.url || './' }
    });
    await setBadge((await getBadge()) + 1);
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.postMessage({ type: 'open', url }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
