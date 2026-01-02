// Public API for WebVM Proxy Server
// Allows registering unlimited domains and TLDs

import { webvmProxyServer } from './webvm-proxy-server';

export class WebVMProxyAPI {
    /**
     * Register a domain (e.g., 'blog.paper')
     */
    static async registerDomain(domain: string): Promise<{ success: boolean; domain: string; wasNew: boolean }> {
        try {
            await webvmProxyServer.manageHostsFile('add', domain);
            
            // Notify Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'DOMAIN_REGISTERED',
                    domain
                });
            }
            
            return { success: true, domain, wasNew: true };
        } catch (error: any) {
            console.error(`[WebVMProxyAPI] Failed to register domain ${domain}:`, error);
            throw error;
        }
    }

    /**
     * Register a TLD (e.g., 'paper' allows *.paper)
     */
    static async registerTLD(tld: string): Promise<{ success: boolean; tld: string }> {
        try {
            const cleanTLD = tld.startsWith('.') ? tld.slice(1) : tld;
            
            // Register base domain
            await webvmProxyServer.manageHostsFile('add', cleanTLD);
            
            // Register as TLD
            const handler = (webvmProxyServer as any).requestHandlers?.get('register_tld');
            if (handler) {
                await handler({ tld: cleanTLD });
            }
            
            // Notify Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'TLD_REGISTERED',
                    tld: cleanTLD
                });
            }
            
            return { success: true, tld: cleanTLD };
        } catch (error: any) {
            console.error(`[WebVMProxyAPI] Failed to register TLD ${tld}:`, error);
            throw error;
        }
    }

    /**
     * Get all registered domains
     */
    static getDomains(): string[] {
        return webvmProxyServer.getDomains();
    }

    /**
     * Get all registered TLDs
     */
    static getTLDs(): string[] {
        return webvmProxyServer.getTLDs();
    }

    /**
     * Check if a domain is registered
     */
    static isDomainRegistered(domain: string): boolean {
        return webvmProxyServer.isDomainRegisteredSync(domain);
    }

    /**
     * Get server stats
     */
    static async getStats(): Promise<any> {
        const handler = (webvmProxyServer as any).requestHandlers?.get('get_stats');
        if (handler) {
            return await handler({});
        }
        return {
            domains: this.getDomains(),
            tlds: this.getTLDs()
        };
    }
}

// Expose to window for easy access
if (typeof window !== 'undefined') {
    (window as any).PaperProxy = WebVMProxyAPI;
}

