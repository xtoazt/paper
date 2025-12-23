// Service Worker for Paper
// Handles "Virtual Mode" by intercepting /_gateway/ requests

const GATEWAY_PREFIX = '/_gateway/';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Intercept requests destined for our virtual gateway
    if (url.pathname.startsWith(GATEWAY_PREFIX)) {
        event.respondWith(handleGatewayRequest(event.request));
    }
});

async function handleGatewayRequest(request) {
    const url = new URL(request.url);
    // Parse: /_gateway/blog.paper/some/path -> domain: blog.paper, path: /some/path
    const rawPath = url.pathname.replace(GATEWAY_PREFIX, '');
    const parts = rawPath.split('/');
    const domain = parts[0];
    const path = '/' + parts.slice(1).join('/') + (url.search || '');

    // Get the client (window) that made the request to ask for the content
    const clientId = request.clientId;
    let client = await self.clients.get(clientId);
    
    // Fallback if clientId is not set (e.g. navigation)
    if (!client) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        client = clients[0];
    }

    if (!client) {
        return new Response("Paper Runtime Offline (No Client)", { status: 503 });
    }

    // Use MessageChannel to request content from the main thread (Runtime)
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
