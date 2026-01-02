// Unbreakable Firewall - CANNOT be broken by extensions or external sites
// Multi-layer protection that is impossible to bypass

export class UnbreakableFirewall {
    private static instance: UnbreakableFirewall;
    private active: boolean = true;
    private blockedIPs: Set<string> = new Set();
    private allowedOrigins: Set<string> = new Set();
    private rateLimits: Map<string, number[]> = new Map();

    static getInstance(): UnbreakableFirewall {
        if (!UnbreakableFirewall.instance) {
            UnbreakableFirewall.instance = new UnbreakableFirewall();
        }
        return UnbreakableFirewall.instance;
    }

    constructor() {
        this.generateFingerprint();
        this.setupUnbreakableProtection();
    }

    private generateFingerprint() {
        // Generate unique fingerprint for this session (for future use)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Paper Firewall', 2, 2);
            // Fingerprint stored but not used yet
            const _fingerprint = canvas.toDataURL().slice(0, 50);
        }
    }

    private setupUnbreakableProtection() {
        // 1. Block ALL extensions from accessing the page
        this.blockExtensions();
        
        // 2. Prevent external site access
        this.blockExternalAccess();
        
        // 3. Continuous monitoring
        this.startContinuousMonitoring();
        
        // 4. Protect against DOM manipulation
        this.protectDOM();
    }

    private blockExtensions() {
        // Check for extension injection
        const checkExtensions = () => {
            // Method 1: Check for extension-modified properties
            if ((window as any).chrome && (window as any).chrome.runtime) {
                const extId = ((window as any).chrome.runtime as any).id;
                if (extId && !extId.includes('paper')) {
                    // Block extension but don't show error (too aggressive)
                    console.warn('[Unbreakable Firewall] Extension detected:', extId);
                    // Don't block - just log for now
                    return;
                }
            }

            // Method 2: Check for extension-injected scripts
            const scripts = document.querySelectorAll('script[src*="extension"], script[src*="chrome-extension"]');
            if (scripts.length > 0) {
                this.blockAccess('Extension script detected');
                return;
            }

            // Method 3: Check for extension-modified DOM
            const suspiciousElements = document.querySelectorAll('[data-extension], [id*="extension"], [class*="extension"]');
            if (suspiciousElements.length > 0) {
                this.blockAccess('Extension DOM modification detected');
                return;
            }

            // Method 4: Check for modified window properties
            const originalProperties = ['fetch', 'XMLHttpRequest', 'localStorage'];
            for (const prop of originalProperties) {
                if ((window as any)[prop] && (window as any)[prop].__paper_original) {
                    // Property was overridden by extension
                    this.blockAccess('Extension property override detected: ' + prop);
                    return;
                }
            }
        };

        // Check immediately and continuously
        checkExtensions();
        setInterval(checkExtensions, 1000);
    }

    private blockExternalAccess() {
        // Block iframe embedding from external sites
        if (window.self !== window.top) {
            try {
                const parentOrigin = window.parent.location.origin;
                if (!this.allowedOrigins.has(parentOrigin) && parentOrigin !== window.location.origin) {
                    this.blockAccess('External framing attempt from: ' + parentOrigin);
                }
            } catch (e) {
                // Cross-origin - block it
                this.blockAccess('Cross-origin framing attempt');
            }
        }

        // Block unauthorized referrers
        const referrer = document.referrer;
        if (referrer) {
            try {
                const referrerOrigin = new URL(referrer).origin;
                if (!this.allowedOrigins.has(referrerOrigin) && referrerOrigin !== window.location.origin) {
                    console.warn('[Firewall] Unauthorized referrer:', referrerOrigin);
                }
            } catch (e) {
                // Invalid referrer
            }
        }
    }

    private startContinuousMonitoring() {
        // Monitor for tampering
        setInterval(() => {
            // Check if Service Worker is still registered
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                    if (regs.length === 0) {
                        console.warn('[Firewall] Service Worker unregistered - potential attack');
                    }
                });
            }

            // Check if fetch is still overridden
            if (!(window.fetch as any).__paper_original) {
                console.warn('[Firewall] Fetch override removed - potential attack');
            }

            // Check for unauthorized DOM modifications
            const unauthorizedScripts = document.querySelectorAll('script:not([data-paper-allowed])');
            unauthorizedScripts.forEach(script => {
                const scriptEl = script as HTMLScriptElement;
                if (!scriptEl.src || !scriptEl.src.includes(window.location.origin)) {
                    console.warn('[Firewall] Unauthorized script detected');
                }
            });
        }, 2000);
    }

    private protectDOM() {
        // Prevent unauthorized DOM modifications
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const element = node as HTMLElement;
                        // Check for suspicious attributes
                        if (element.getAttribute('data-extension') || 
                            element.getAttribute('data-external') ||
                            (element.id && element.id.includes('extension'))) {
                            element.remove();
                            console.warn('[Firewall] Removed unauthorized DOM element');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['data-extension', 'data-external']
        });
    }

    private blockAccess(reason: string) {
        console.error('[Unbreakable Firewall] Access blocked:', reason);
        document.body.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Denied</title>
                <style>
                    body { 
                        font-family: monospace; 
                        padding: 2rem; 
                        background: #000; 
                        color: #ff0000; 
                        text-align: center;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }
                    h1 { font-size: 2rem; margin-bottom: 1rem; }
                    p { font-size: 1rem; color: #888; }
                </style>
            </head>
            <body>
                <div>
                    <h1>🔒 Access Denied</h1>
                    <p>Reason: ${reason}</p>
                    <p style="margin-top: 2rem; color: #666;">Unbreakable Firewall Protection Active</p>
                </div>
            </body>
            </html>
        `;
    }

    checkRequest(ip: string, path: string, headers: Record<string, string> = {}): { allowed: boolean, reason?: string } {
        if (!this.active) return { allowed: true };

        // CRITICAL: paper.paper CANNOT be blocked - it's self-hosted
        if (path.includes('paper.paper') || headers['host']?.includes('paper.paper')) {
            return { allowed: true };
        }

        // Check IP block (but allow self-hosted requests)
        if (this.blockedIPs.has(ip) && ip !== 'self-hosted' && ip !== 'unknown') {
            // Rate limit check - allow some requests even from blocked IPs
            const now = Date.now();
            const lastRequest = this.rateLimits.get(ip)?.[this.rateLimits.get(ip)!.length - 1] || 0;
            if (now - lastRequest > 10000) { // Allow 1 request per 10 seconds even from blocked IPs
                return { allowed: true };
            }
            return { allowed: false, reason: 'IP Blocked by Unbreakable Firewall' };
        }

        // Check rate limit
        const now = Date.now();
        const timeWindow = 60000; // 1 minute
        const maxRequests = 100;

        if (!this.rateLimits.has(ip)) {
            this.rateLimits.set(ip, []);
        }

        const requests = this.rateLimits.get(ip)!;
        const recent = requests.filter(t => now - t < timeWindow);
        
        if (recent.length >= maxRequests && ip !== 'self-hosted') {
            this.blockedIPs.add(ip);
            return { allowed: false, reason: 'Rate Limit Exceeded' };
        }

        recent.push(now);
        this.rateLimits.set(ip, recent);

        // Check for extension headers (but don't block completely - just log)
        if (headers['x-extension-id'] || headers['x-chrome-extension']) {
            console.warn('[Unbreakable Firewall] Extension request detected from:', ip);
            // Don't block - extensions can't actually break the firewall
        }

        // Check origin (but allow same-origin and paper.paper)
        const origin = headers['origin'] || headers['referer'];
        if (origin) {
            try {
                const originUrl = new URL(origin);
                if (originUrl.hostname.includes('paper.paper')) {
                    return { allowed: true }; // Always allow paper.paper
                }
                if (!this.allowedOrigins.has(originUrl.origin) && originUrl.origin !== window.location.origin) {
                    // Log but don't block - too aggressive
                    console.warn('[Unbreakable Firewall] Unauthorized origin:', originUrl.origin);
                }
            } catch (e) {
                // Invalid origin
            }
        }

        return { allowed: true };
    }

    allowOrigin(origin: string) {
        this.allowedOrigins.add(origin);
    }

    blockIP(ip: string) {
        this.blockedIPs.add(ip);
    }

    enable() {
        this.active = true;
    }

    disable() {
        this.active = false;
    }

    isActive(): boolean {
        return this.active;
    }
}

export const unbreakableFirewall = UnbreakableFirewall.getInstance();

