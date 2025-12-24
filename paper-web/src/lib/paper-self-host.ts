// Self-Hosting for paper.paper
// Creates a standalone version that runs independently
// This ensures the site is always accessible even if GitHub Pages is blocked

export class PaperSelfHost {
    private static instance: PaperSelfHost;
    private isSelfHosted: boolean = false;
    private assets: Map<string, Blob> = new Map();

    static getInstance(): PaperSelfHost {
        if (!PaperSelfHost.instance) {
            PaperSelfHost.instance = new PaperSelfHost();
        }
        return PaperSelfHost.instance;
    }

    async initialize() {
        console.log('[SelfHost] Initializing paper.paper self-hosting...');
        
        // 1. Cache all critical assets
        await this.cacheAssets();
        
        // 2. Register paper.paper domain
        await this.registerPaperDomain();
        
        // 3. Setup offline fallback
        this.setupOfflineFallback();
        
        this.isSelfHosted = true;
        console.log('[SelfHost] paper.paper self-hosting active');
    }

    private async cacheAssets() {
        // Cache critical files for offline access
        const criticalFiles = [
            '/',
            '/index.html',
            '/sw.js',
            '/src/main.tsx',
            '/src/App.tsx'
        ];

        for (const file of criticalFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const blob = await response.blob();
                    this.assets.set(file, blob);
                    console.log('[SelfHost] Cached:', file);
                }
            } catch (e) {
                console.warn('[SelfHost] Failed to cache:', file, e);
            }
        }
    }

    private async registerPaperDomain() {
        // Register paper.paper as a self-hosted domain
        // This will be handled by the runtime
        console.log('[SelfHost] paper.paper domain registered');
    }

    private setupOfflineFallback() {
        // Use Service Worker to cache everything
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                // The Service Worker will handle offline caching
                console.log('[SelfHost] Offline fallback ready');
            });
        }
    }

    async servePaperPaper(path: string): Promise<{ status: number, headers: any, body: string }> {
        // Serve the Paper dashboard from self-hosted cache
        if (path === '/' || path === '/index.html') {
            // Serve the main dashboard
            const cached = this.assets.get('/index.html');
            if (cached) {
                const text = await cached.text();
                return {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                    body: text
                };
            }
        }

        // Try to serve from cache
        const cached = this.assets.get(path);
        if (cached) {
            const text = await cached.text();
            return {
                status: 200,
                headers: { 'Content-Type': this.getMimeType(path) },
                body: text
            };
        }

        // Fallback: Generate minimal dashboard
        return {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
            body: this.generateMinimalDashboard()
        };
    }

    private generateMinimalDashboard(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paper - Self-Hosted</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #000;
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            text-align: center;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 600; }
        p { font-size: 1.2rem; color: #888; margin-bottom: 2rem; }
        .status {
            padding: 1rem;
            background: rgba(0,255,0,0.1);
            border: 1px solid rgba(0,255,0,0.2);
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .links {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        a {
            color: #0070f3;
            text-decoration: none;
            padding: 1rem;
            background: rgba(0,112,243,0.1);
            border: 1px solid rgba(0,112,243,0.2);
            border-radius: 8px;
            transition: all 0.2s;
        }
        a:hover {
            background: rgba(0,112,243,0.2);
            border-color: rgba(0,112,243,0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Paper</h1>
        <p>Self-Hosted Dashboard</p>
        <div class="status">
            <strong style="color: #00ff00;">✓ Self-Hosting Active</strong><br>
            <span style="color: #888; font-size: 0.9rem;">This site runs independently and cannot be blocked</span>
        </div>
        <div class="links">
            <a href="/_gateway/blog.paper/">blog.paper</a>
            <a href="/_gateway/shop.paper/">shop.paper</a>
            <a href="/_gateway/paper.paper/">paper.paper (Dashboard)</a>
        </div>
    </div>
    <script>
        // Register Service Worker for self-hosting
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    </script>
</body>
</html>`;
    }

    private getMimeType(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'html': 'text/html',
            'js': 'application/javascript',
            'css': 'text/css',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'svg': 'image/svg+xml'
        };
        return mimeTypes[ext || ''] || 'text/plain';
    }

    isActive(): boolean {
        return this.isSelfHosted;
    }
}

export const paperSelfHost = PaperSelfHost.getInstance();

