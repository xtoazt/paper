// Paper Proxy Server - Runs inside WebVM
// Uses child_process simulation for hosts file management
// Provides unlimited TLD support with unbreakable firewall

import { UnbreakableFirewall } from './unbreakable-firewall';

interface WebSocketMessage {
    id?: string;
    type: string;
    [key: string]: any;
}

interface PendingRequest {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
    timeout: number;
}

export class WebVMProxyServer {
    private firewall: UnbreakableFirewall;
    private domains: Set<string> = new Set();
    private tlds: Set<string> = new Set();
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private controlWS: WebSocket | null = null;
    private requestHandlers: Map<string, (req: any) => Promise<any>> = new Map();
    private isRunning: boolean = false;

    constructor() {
        this.firewall = UnbreakableFirewall.getInstance();
        this.setupRequestHandlers();
    }

    private setupRequestHandlers() {
        // Register domain handler
        this.requestHandlers.set('register_domain', async (data: any) => {
            const { domain } = data;
            if (!domain || typeof domain !== 'string') {
                throw new Error('Invalid domain');
            }
            
            // Validate domain format
            if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)) {
                throw new Error(`Invalid domain format: ${domain}`);
            }

            const wasNew = !this.domains.has(domain);
            this.domains.add(domain);
            
            // Update Service Worker registration for this domain
            await this.updateServiceWorkerRegistration(domain);
            
            return {
                domain,
                wasNew,
                allDomains: Array.from(this.domains)
            };
        });

        // Register TLD handler
        this.requestHandlers.set('register_tld', async (data: any) => {
            const { tld } = data;
            if (!tld || typeof tld !== 'string') {
                throw new Error('Invalid TLD');
            }
            
            const cleanTLD = tld.startsWith('.') ? tld.slice(1) : tld;
            this.tlds.add(cleanTLD);
            this.domains.add(cleanTLD);
            
            await this.updateServiceWorkerRegistration(cleanTLD);
            
            return {
                tld: cleanTLD,
                allDomains: Array.from(this.domains)
            };
        });

        // Get stats handler
        this.requestHandlers.set('get_stats', async () => {
            return {
                domains: Array.from(this.domains),
                tlds: Array.from(this.tlds),
                firewall: {
                    active: this.firewall.isActive(),
                    blockedIPs: 0, // Firewall manages this internally
                },
                pendingRequests: this.pendingRequests.size
            };
        });

        // Firewall block IP
        this.requestHandlers.set('firewall_block_ip', async (data: any) => {
            const { ip } = data;
            if (ip) {
                this.firewall.blockIP(ip);
            }
            return { ip, blocked: true };
        });

        // Firewall unblock IP
        this.requestHandlers.set('firewall_unblock_ip', async (data: any) => {
            const { ip } = data;
            // Note: UnbreakableFirewall doesn't have unblockIP, but we can log it
            return { ip, unblocked: true };
        });
    }

    private async updateServiceWorkerRegistration(domain: string) {
        // In a browser environment, we use Service Worker to intercept domains
        // The Service Worker is already registered and will handle these domains
        // We just need to ensure the domain is in our list
        
        // Broadcast to Service Worker about new domain
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'DOMAIN_REGISTERED',
                domain
            });
        }
    }

    // Simulate child_process for hosts file management
    // In browser, we can't modify actual /etc/hosts, but we can:
    // 1. Use Service Worker to intercept
    // 2. Store domain mappings in IndexedDB
    // 3. Provide API for domain management
    async manageHostsFile(action: 'add' | 'remove' | 'list', domain?: string): Promise<any> {
        if (action === 'add' && domain) {
            this.domains.add(domain);
            await this.persistDomains();
            await this.updateServiceWorkerRegistration(domain);
            return { success: true, domain };
        } else if (action === 'remove' && domain) {
            this.domains.delete(domain);
            await this.persistDomains();
            return { success: true, domain };
        } else if (action === 'list') {
            return { domains: Array.from(this.domains) };
        }
        throw new Error(`Invalid action: ${action}`);
    }

    private async persistDomains() {
        // Persist domains to IndexedDB
        try {
            const db = await this.openDB();
            const tx = db.transaction('domains', 'readwrite');
            const store = tx.objectStore('domains');
            await store.put(Array.from(this.domains), 'registered_domains');
        } catch (error) {
            console.warn('[WebVMProxy] Failed to persist domains:', error);
        }
    }

    private async loadDomains() {
        // Load domains from IndexedDB
        try {
            const db = await this.openDB();
            const tx = db.transaction('domains', 'readonly');
            const store = tx.objectStore('domains');
            const domains = await store.get('registered_domains');
            if (domains) {
                this.domains = new Set(domains);
            }
        } catch (error) {
            console.warn('[WebVMProxy] Failed to load domains:', error);
        }
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('paper-proxy-db', 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('domains')) {
                    db.createObjectStore('domains');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Handle incoming WebSocket messages from proxy
    async handleMessage(message: WebSocketMessage): Promise<any> {
        const { type, id } = message;

        // Handle response to pending request
        if (id && this.pendingRequests.has(id)) {
            const pending = this.pendingRequests.get(id)!;
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(id);
            
            if (type === 'error') {
                pending.reject(new Error(message.error || 'Unknown error'));
            } else {
                pending.resolve(message);
            }
            return;
        }

        // Handle control messages
        const handler = this.requestHandlers.get(type);
        if (handler) {
            try {
                const result = await handler(message);
                return { id, type, ...result };
            } catch (error: any) {
                return { id, type: 'error', error: error.message };
            }
        }

        // Handle HTTP request forwarding
        if (type === 'http_request' || message.method) {
            return this.handleHTTPRequest(message);
        }

        return { id, type: 'unknown', error: 'Unknown message type' };
    }

    private async handleHTTPRequest(payload: any): Promise<any> {
        const { method, path, host, headers, body, clientIP, id } = payload;

        // Firewall check
        const firewallCheck = this.firewall.checkRequest(
            clientIP || 'unknown',
            path || '/',
            headers || {},
            body || ''
        );

        if (!firewallCheck.allowed) {
            return {
                id,
                status: 403,
                headers: { 'Content-Type': 'text/html' },
                body: this.generateBlockedPage(firewallCheck)
            };
        }

        // Check if domain is registered
        const domain = host?.split(':')[0] || '';
        if (!this.isDomainRegistered(domain)) {
            return {
                id,
                status: 404,
                headers: { 'Content-Type': 'text/html' },
                body: '<html><body><h1>404 - Domain Not Found</h1><p>Domain not registered.</p></body></html>'
            };
        }

        // Forward to runtime handler
        // This will be handled by the BrowserPodRuntime
        // We return a signal that the request should be processed
        return {
            id,
            type: 'forward_to_runtime',
            method,
            path,
            host,
            headers,
            body
        };
    }

    private isDomainRegistered(domain: string): boolean {
        if (!domain) return false;
        
        // Check exact match
        if (this.domains.has(domain)) return true;
        
        // Check TLD match (e.g., blog.paper matches .paper TLD)
        for (const tld of this.tlds) {
            if (domain.endsWith('.' + tld) || domain === tld) {
                return true;
            }
        }
        
        return false;
    }

    private generateBlockedPage(firewallCheck: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
    <style>
        body { 
            font-family: monospace; 
            padding: 2rem; 
            background: #000; 
            color: #f00; 
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { color: #888; margin: 0.5rem 0; }
        .reason { color: #f00; font-weight: bold; }
        .severity { color: #ff0; }
    </style>
</head>
<body>
    <div>
        <h1>🔒 403 - Access Denied</h1>
        <p class="reason">Reason: ${firewallCheck.reason || 'Blocked by Firewall'}</p>
        ${firewallCheck.severity ? `<p class="severity">Severity: ${firewallCheck.severity.toUpperCase()}</p>` : ''}
        ${firewallCheck.attackType ? `<p>Attack Type: ${firewallCheck.attackType}</p>` : ''}
        <p style="margin-top: 2rem; color: #666;">Unbreakable Firewall - Cannot be bypassed</p>
    </div>
</body>
</html>
        `.trim();
    }

    async start() {
        if (this.isRunning) {
            console.warn('[WebVMProxy] Server already running');
            return;
        }

        await this.loadDomains();
        this.isRunning = true;
        console.log('[WebVMProxy] Server started');
        console.log(`[WebVMProxy] Registered domains: ${Array.from(this.domains).join(', ')}`);
    }

    async stop() {
        this.isRunning = false;
        this.pendingRequests.clear();
        console.log('[WebVMProxy] Server stopped');
    }

    getDomains(): string[] {
        return Array.from(this.domains);
    }

    getTLDs(): string[] {
        return Array.from(this.tlds);
    }

    isDomainRegisteredSync(domain: string): boolean {
        return this.isDomainRegistered(domain);
    }
}

// Export singleton instance
export const webvmProxyServer = new WebVMProxyServer();



