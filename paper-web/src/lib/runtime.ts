import { GitHubRepo } from './github';

// This simulates the BrowserPod / CheerpX Runtime Interface
// In a full implementation, this would load the WASM blobs and boot Node.js
export class BrowserPodRuntime {
    private fs: Map<string, string> = new Map();
    public isReady: boolean = false;

    constructor() {
        this.boot();
    }

    private async boot() {
        console.log('[BrowserPod] Booting Linux Kernel (WASM)...');
        await new Promise(r => setTimeout(r, 800)); // Simulate boot
        console.log('[BrowserPod] Starting Node.js...');
        this.isReady = true;
    }

    // List files for Explorer
    listFiles(): string[] {
        return Array.from(this.fs.keys());
    }

    // Mount a GitHub repo into the virtual filesystem
    async mountRepo(url: string) {
        console.log(`[BrowserPod] Cloning ${url}...`);
        const repo = new GitHubRepo(url);
        await repo.initialize();
        
        // Flatten repo into FS
        for (const [path, item] of Object.entries(repo.tree)) {
            if (item.type === 'file') {
                const content = await repo.getFile(path);
                if (content) this.fs.set(path, content);
            }
        }
        console.log(`[BrowserPod] Mounted ${this.fs.size} files.`);
    }

    // Simulate handling a request via the internal Node.js server
    async handleRequest(domain: string, path: string): Promise<{ status: number, headers: any, body: string }> {
        if (!this.isReady) await this.boot();

        // 1. Check for specific "App" logic (Simulating a running Express server)
        if (domain === 'blog.paper') {
            return this.runBlogApp(path);
        }
        if (domain === 'shop.paper') {
            return this.runShopApp(path);
        }

        // 2. Fallback to Static File Serving from FS (for mounted repos)
        // Simulate: app.use(express.static('.'))
        
        // Try exact match
        let content = this.fs.get(path);
        let servedPath = path;

        // Try index.html
        if (!content && (path === '/' || path.endsWith('/'))) {
            content = this.fs.get(path + 'index.html');
            if (!content) content = this.fs.get('/index.html'); 
        }

        if (content) {
            return {
                status: 200,
                headers: { 'Content-Type': this.getMimeType(servedPath) },
                body: content
            };
        }

        return {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
            body: `<h1>404 Not Found</h1><p>BrowserPod: No route for ${path}</p>`
        };
    }

    private getMimeType(path: string) {
        if (path.endsWith('.html')) return 'text/html';
        if (path.endsWith('.js')) return 'application/javascript';
        if (path.endsWith('.css')) return 'text/css';
        if (path.endsWith('.json')) return 'application/json';
        return 'text/plain';
    }

    // --- Mock Apps Running in the Runtime ---

    private runBlogApp(path: string) {
        // Simulating: app.get('/post/:id', ...)
        let content = '';
        if (path === '/') {
             content = `
                <div class="meta">Latest Stories</div>
                <article>
                    <h2><a href="/post/1">Why Local-First is the Future</a></h2>
                    <p>We've spent the last decade moving everything to the cloud. It's time to bring it back home.</p>
                </article>
                <article>
                    <h2><a href="/post/2">The Magic of Loopback Interfaces</a></h2>
                    <p>How we abuse localhost for fun and profit. You don't always need a VPS.</p>
                </article>
            `;
        } else if (path.startsWith('/post/')) {
            content = `
                <a href="/" style="display:inline-block; margin-bottom:2rem; color:#3291ff; text-decoration:none">← Back to Home</a>
                <div class="meta">Blog Post</div>
                <h1>${path.replace('/post/', 'Story #')}</h1>
                <p>This content is generated dynamically by the Node.js process running in BrowserPod.</p>
            `;
        } else {
            return { status: 404, headers: {}, body: 'Not Found' };
        }

        return {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
            body: this.wrapTemplate('Blog', content)
        };
    }

    private runShopApp(_path: string) {
        const content = `
            <div style="text-align:center; padding: 4rem 0;">
                <h1 style="font-size:3rem; margin-bottom:0.5rem">Paper Supplies.</h1>
                <p style="font-size:1.5rem; color:#888">Pro-grade materials.</p>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:2rem;">
                ${['Graph Paper', 'Dot Grid', 'Blueprint', 'Vellum'].map(item => `
                    <div style="background:#fff; padding:2rem; border-radius:12px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.05); color: #000">
                        <h3 style="margin-top:0">${item}</h3>
                        <p style="color:#666">$5.00</p>
                        <button onclick="alert('Bought!')" style="background:#0071e3; color:#fff; border:none; padding:0.5rem 1rem; border-radius:20px; cursor:pointer">Buy</button>
                    </div>
                `).join('')}
            </div>
        `;
        return {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
            body: this.wrapTemplate('Store', content)
        };
    }

    private wrapTemplate(title: string, content: string) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: -apple-system, sans-serif; margin: 0; padding: 2rem; background: #f5f5f7; color: #1d1d1f; }
                    .meta { color: #86868b; text-transform: uppercase; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
                    a { color: inherit; text-decoration: none; }
                    h2 a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `;
    }
}

// Singleton Instance
export const runtime = new BrowserPodRuntime();
