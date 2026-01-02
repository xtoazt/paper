import { UniversalGitRepo } from './git-repo';
import { InsaneCompression } from './compression';
import { deploymentLogger } from './deployment-logs';
import { unbreakableWall } from './unbreakable-wall';
import { unbreakableFirewall } from './unbreakable-firewall';
import { paperSelfHost } from './paper-self-host';
import { pyodideProxyServer } from './pyodide-proxy-server';

// BrowserPod Runtime with PERSISTENCE
export class BrowserPodRuntime {
    // We now use an async getter/setter pattern backed by IndexedDB/LocalForage
    // For this implementation, we'll keep the in-memory Map but hydrate it on boot
    private fs: Map<string, Uint8Array> = new Map();
    public isReady: boolean = false;
    private dbName = 'paper-fs';
    private storeName = 'files';

    constructor() {
        this.boot();
        // Initialize self-hosting for paper.paper
        paperSelfHost.initialize();
    }

    private async boot() {
        console.log('[BrowserPod] Booting Linux Kernel (WASM)...');
        await this.hydrateFS();
        console.log('[BrowserPod] FS Hydrated. Starting Node.js...');
        
        // Start Pyodide Proxy Server (non-blocking)
        pyodideProxyServer.start().catch((error) => {
            console.warn('[BrowserPod] Pyodide Proxy Server failed to start:', error);
            // Continue without Pyodide - fallback mode
        });
        
        // Register default domains (non-blocking)
        const defaultDomains = ['paper', 'blog.paper', 'shop.paper', 'test.paper'];
        for (const domain of defaultDomains) {
            pyodideProxyServer.registerDomain(domain).catch((error) => {
                console.warn(`[BrowserPod] Failed to register default domain ${domain}:`, error);
            });
        }
        
        this.isReady = true;
    }

    private async hydrateFS() {
        // Simple IndexedDB logic to load persisted files
        return new Promise<void>((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const cursorRequest = store.openCursor();
                
                cursorRequest.onsuccess = (ev) => {
                    const cursor = (ev.target as IDBRequest).result;
                    if (cursor) {
                        this.fs.set(cursor.key as string, cursor.value as Uint8Array);
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
            };
        });
    }

    private async persistFile(path: string, data: Uint8Array) {
        // Save to IndexedDB
        this.fs.set(path, data);
        
        const request = indexedDB.open(this.dbName, 1);
        request.onsuccess = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.put(data, path);
        };
    }

    listFiles(): string[] {
        return Array.from(this.fs.keys());
    }

    async mountRepo(url: string) {
        deploymentLogger.info(`Starting import from ${url}...`, undefined, url);
        
        try {
            const repo = new UniversalGitRepo(url);
            deploymentLogger.info(`Detected ${repo.info.provider} repository`, `${repo.info.owner}/${repo.info.repo}@${repo.info.branch}`, url);
            
            await repo.initialize();
            const stats = repo.getStats();
            deploymentLogger.success(`Repository fetched`, `${stats.fileCount} files (${(stats.totalSize / 1024).toFixed(2)} KB)`, url);
            
            // Flatten repo into FS with INSANE compression & PERSISTENCE
            const promises: Promise<void>[] = [];
            let processed = 0;
            
            for (const [path, item] of Object.entries(repo.tree)) {
                if (item.type === 'file') {
                    promises.push((async () => {
                        try {
                            const content = await repo.getFile(path);
                            if (content) {
                                // Compress
                                const compressed = await InsaneCompression.compressAsync(content);
                                // Save to FS & Persistent Storage
                                await this.persistFile(path, compressed);
                                processed++;
                                
                                if (processed % 10 === 0) {
                                    deploymentLogger.info(`Processing files...`, `${processed}/${stats.fileCount}`, url);
                                }
                            }
                        } catch (e: any) {
                            deploymentLogger.warning(`Failed to process ${path}`, e.message, url);
                        }
                    })());
                }
            }
            
            await Promise.all(promises);
            const domain = `${repo.info.repo.toLowerCase()}.paper`;
            deploymentLogger.success(`Deployment complete`, `Mounted ${processed} files. Available at ${domain}`, url, domain);
            
            return domain;
        } catch (e: any) {
            deploymentLogger.error(`Failed to import repository`, e.message, url);
            throw e;
        }
    }

    async handleRequest(domain: string, path: string, clientIP: string = 'unknown'): Promise<{ status: number, headers: any, body: string }> {
        if (!this.isReady) await this.boot();

        // Check if domain is registered with Pyodide Proxy Server
        if (!pyodideProxyServer.isDomainRegisteredSync(domain)) {
            // Auto-register domain if it matches a registered TLD
            const domainParts = domain.split('.');
            if (domainParts.length > 1) {
                const tld = domainParts.slice(-1)[0];
                if (pyodideProxyServer.getTLDs().includes(tld)) {
                    await pyodideProxyServer.registerDomain(domain);
                } else {
                    return {
                        status: 404,
                        headers: { 'Content-Type': 'text/html' },
                        body: `<!DOCTYPE html>
<html>
<head>
    <title>404 Not Found</title>
    <style>
        body { font-family: monospace; padding: 2rem; background: #000; color: #ff0000; text-align: center; }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { color: #888; }
    </style>
</head>
<body>
    <h1>404 - Domain Not Found</h1>
    <p>Domain "${domain}" is not registered.</p>
    <p style="margin-top: 2rem; color: #666;">Register this domain via the WebVM Proxy Server API</p>
</body>
</html>`
                    };
                }
            }
        }

        // Unbreakable Firewall check (MOST STRICT)
        const ip = clientIP || 'unknown';
        // paper.paper is self-hosted and CANNOT be blocked
        const isPaperPaper = domain === 'paper.paper';
        const firewallCheck = unbreakableFirewall.checkRequest(
            isPaperPaper ? 'self-hosted' : ip, 
            `${domain}${path}`, 
            { host: domain }
        );
        if (!firewallCheck.allowed && !isPaperPaper) {
            return {
                status: 403,
                headers: { 'Content-Type': 'text/html' },
                body: `<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
    <style>
        body { font-family: monospace; padding: 2rem; background: #000; color: #ff0000; text-align: center; }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { color: #888; }
    </style>
</head>
<body>
    <h1>🔒 403 - Access Denied</h1>
    <p>Reason: ${firewallCheck.reason}</p>
    <p style="margin-top: 2rem; color: #666;">Unbreakable Firewall - Cannot be bypassed</p>
</body>
</html>`
            };
        }

        // Unbreakable Wall check (additional layer)
        const wallCheck = unbreakableWall.checkRequest(ip, path);
        if (!wallCheck.allowed) {
            return {
                status: 403,
                headers: { 'Content-Type': 'text/html' },
                body: `<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
    <style>
        body { font-family: sans-serif; padding: 2rem; background: #000; color: #fff; text-align: center; }
        h1 { color: #ff0000; }
    </style>
</head>
<body>
    <h1>403 - Request Blocked</h1>
    <p>Reason: ${wallCheck.reason}</p>
    <p style="color: #888; margin-top: 2rem;">Protected by Unbreakable Wall</p>
</body>
</html>`
            };
        }

        // Normalize path
        if (!path.startsWith('/')) path = '/' + path;

        // 1. Built-in Logic
        if (domain === 'paper.paper') {
            // Self-hosted dashboard - always accessible
            return await paperSelfHost.servePaperPaper(path);
        }
        if (domain === 'blog.paper') return this.runBlogApp(path);
        if (domain === 'shop.paper') return this.runShopApp(path);

        // 2. Static File Serving from Persistent FS
        // Try exact path first
        let contentBytes = this.fs.get(path);
        let servedPath = path;

        // Try index.html for directories
        if (!contentBytes && (path === '/' || path.endsWith('/'))) {
            contentBytes = this.fs.get(path + 'index.html');
            if (!contentBytes) contentBytes = this.fs.get('/index.html');
            if (contentBytes) servedPath = path + 'index.html';
        }

        // Try without leading slash
        if (!contentBytes && path.startsWith('/')) {
            contentBytes = this.fs.get(path.slice(1));
            if (contentBytes) servedPath = path.slice(1);
        }

        if (contentBytes) {
            try {
                const content = await InsaneCompression.decompressAsync(contentBytes);
                return {
                    status: 200,
                    headers: { 
                        'Content-Type': this.getMimeType(servedPath),
                        'Cache-Control': 'no-cache'
                    },
                    body: content
                };
            } catch (e: any) {
                console.error(`[Runtime] Failed to decompress ${servedPath}:`, e);
                return {
                    status: 500,
                    headers: { 'Content-Type': 'text/html' },
                    body: `<h1>500 Internal Error</h1><p>Failed to decompress file: ${e.message}</p>`
                };
            }
        }

        // 404 with helpful message
        return {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
            body: `<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 2rem; background: #000; color: #fff; text-align: center; }
        h1 { color: #ff0000; }
        code { background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>404 - Not Found</h1>
    <p>Domain: <code>${domain}</code></p>
    <p>Path: <code>${path}</code></p>
    <p style="color: #888; margin-top: 2rem;">No file found at this location.</p>
</body>
</html>`
        };
    }

    private getMimeType(path: string) {
        const ext = path.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'html': 'text/html',
            'htm': 'text/html',
            'js': 'application/javascript',
            'mjs': 'application/javascript',
            'css': 'text/css',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'xml': 'application/xml',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'pdf': 'application/pdf'
        };
        return mimeTypes[ext || ''] || 'application/octet-stream';
    }

    // --- Mock Apps ---
    private runBlogApp(path: string) {
        // ... (Same as before)
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
        // ... (Same as before)
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

export const runtime = new BrowserPodRuntime();
