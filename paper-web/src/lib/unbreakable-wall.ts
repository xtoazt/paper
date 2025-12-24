// Unbreakable Security Wall
// Ultimate protection for .paper domains

export class UnbreakableWall {
    private static instance: UnbreakableWall;
    private active: boolean = true;
    private allowedDomains: Set<string> = new Set();
    private blockedIPs: Set<string> = new Set();
    private rateLimits: Map<string, number[]> = new Map();

    static getInstance(): UnbreakableWall {
        if (!UnbreakableWall.instance) {
            UnbreakableWall.instance = new UnbreakableWall();
        }
        return UnbreakableWall.instance;
    }

    enable() {
        this.active = true;
        this.setupProtection();
    }

    disable() {
        this.active = false;
    }

    private setupProtection() {
        // 1. Block all unauthorized access
        this.blockUnauthorizedAccess();
        
        // 2. Rate limiting
        this.enforceRateLimits();
        
        // 3. IP blocking
        this.enforceIPBlocks();
        
        // 4. Content Security
        this.enforceContentSecurity();
    }

    private blockUnauthorizedAccess() {
        // Block iframe embedding
        if (window.self !== window.top) {
            // Check if parent is allowed
            try {
                const parentOrigin = window.parent.location.origin;
                if (!this.allowedDomains.has(parentOrigin)) {
                    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff0000;font-family:monospace;"><h1>Framing Not Allowed</h1></div>';
                }
            } catch (e) {
                // Cross-origin - block
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff0000;font-family:monospace;"><h1>Framing Not Allowed</h1></div>';
            }
        }

        // Block unauthorized referrers
        const referrer = document.referrer;
        if (referrer && !this.allowedDomains.has(new URL(referrer).origin)) {
            // Log but don't block (too aggressive)
            console.warn('[Wall] Unauthorized referrer:', referrer);
        }
    }

    private enforceRateLimits() {
        // Rate limiting is handled per-request
    }

    private enforceIPBlocks() {
        // IP blocking is handled per-request
    }

    private enforceContentSecurity() {
        // Add strict CSP if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';";
            document.head.appendChild(meta);
        }
    }

    checkRequest(ip: string, path: string): { allowed: boolean, reason?: string } {
        if (!this.active) return { allowed: true };

        // Check IP block
        if (this.blockedIPs.has(ip)) {
            return { allowed: false, reason: 'IP Blocked' };
        }

        // Check rate limit
        const now = Date.now();
        const window = 60000; // 1 minute
        const maxRequests = 100;

        if (!this.rateLimits.has(ip)) {
            this.rateLimits.set(ip, []);
        }

        const requests = this.rateLimits.get(ip)!;
        const recent = requests.filter(t => now - t < window);
        
        if (recent.length >= maxRequests) {
            this.blockedIPs.add(ip);
            return { allowed: false, reason: 'Rate Limit Exceeded' };
        }

        recent.push(now);
        this.rateLimits.set(ip, recent);

        return { allowed: true };
    }

    allowDomain(domain: string) {
        this.allowedDomains.add(domain);
    }

    blockIP(ip: string) {
        this.blockedIPs.add(ip);
    }

    isActive(): boolean {
        return this.active;
    }
}

export const unbreakableWall = UnbreakableWall.getInstance();

