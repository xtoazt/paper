// Aggressive Service Worker - Intercepts ALL navigation to .paper domains
// This runs automatically when the site is visited

const CACHE_NAME = 'paper-auto-v1';
const GATEWAY_PREFIX = '/_gateway/';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Aggressive takeover
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control immediately
            caches.open(CACHE_NAME).then(cache => cache.addAll(['/']))
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Intercept ANY request that looks like a .paper domain
    // We'll rewrite it to our gateway
    if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
        event.respondWith(handlePaperDomain(event.request, url));
        return;
    }
    
    // Gateway requests
    if (url.pathname.startsWith(GATEWAY_PREFIX)) {
        event.respondWith(handleGatewayRequest(event.request));
        return;
    }
    
    // Cache everything else for offline
    event.respondWith(
        caches.match(event.request).then(response => 
            response || fetch(event.request)
        )
    );
});

async function handlePaperDomain(request, url) {
    // Extract domain and path
    const domain = url.hostname;
    const path = url.pathname + url.search;
    
    // Rewrite to gateway internally
    const gatewayUrl = new URL(`/_gateway/${domain}${path}`, self.location.origin);
    return fetch(gatewayUrl);
}

async function handleGatewayRequest(request) {
    const url = new URL(request.url);
    const rawPath = url.pathname.replace(GATEWAY_PREFIX, '');
    const parts = rawPath.split('/');
    const domain = parts[0];
    const path = '/' + parts.slice(1).join('/') + (url.search || '');

    let client = await self.clients.get(request.clientId);
    if (!client) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client = clients[0];
    }

    if (!client) {
        return new Response("Paper Runtime Starting...", { status: 503 });
    }

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
            const response = event.data;
            if (response.error) {
                resolve(new Response(response.error, { status: 500 }));
            } else {
                resolve(new Response(response.body, {
                    status: response.status || 200,
                    headers: new Headers(response.headers || {})
                }));
            }
        };

        client.postMessage({
            type: 'GATEWAY_REQUEST',
            domain,
            path
        }, [channel.port2]);
    });
}
