import { GitHubRepo } from './github';

export interface VirtualApp {
    domain: string;
    name: string;
    description: string;
    handler: (path: string, headers: Record<string, string>) => Promise<ResponseData> | ResponseData;
}

export interface ResponseData {
    status: number;
    headers: Record<string, string>;
    body: string;
}

// ----------------------------------------------------------------------
// TEMPLATES
// ----------------------------------------------------------------------

const BLOG_TEMPLATE = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paper Blog</title>
    <style>
        :root { --bg: #fff; --text: #111; --accent: #3291ff; --sub: #666; --border: #eaeaea; }
        @media (prefers-color-scheme: dark) { :root { --bg: #000; --text: #fff; --sub: #888; --border: #333; } }
        
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
               background: var(--bg); color: var(--text); margin: 0; line-height: 1.6; }
        
        nav { border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
        nav a { color: var(--text); text-decoration: none; font-weight: 500; font-size: 0.9rem; }
        nav .brand { font-weight: 700; letter-spacing: -0.5px; font-size: 1.1rem; }
        
        main { max-width: 680px; margin: 4rem auto; padding: 0 1.5rem; }
        
        h1 { font-size: 2.5rem; letter-spacing: -1px; margin-bottom: 0.5rem; }
        .meta { color: var(--sub); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2rem; }
        
        article { margin-bottom: 4rem; }
        article h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
        article h2 a { color: var(--text); text-decoration: none; }
        article h2 a:hover { text-decoration: underline; }
        article p { color: var(--sub); font-size: 1.1rem; margin-top: 0.5rem; }
        
        footer { border-top: 1px solid var(--border); padding: 2rem; text-align: center; color: var(--sub); font-size: 0.8rem; margin-top: 4rem; }
    </style>
</head>
<body>
    <nav>
        <span class="brand">blog.paper</span>
        <div><a href="/">Home</a><span style="margin:0 1rem;color:var(--border)">|</span><a href="https://github.com/rohan/paper">Source</a></div>
    </nav>
    <main>
        ${content}
    </main>
    <footer>
        Served from memory by Paper WebVM
    </footer>
</body>
</html>
`;

const SHOP_TEMPLATE = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paper Store</title>
    <style>
        :root { --bg: #f5f5f7; --card: #fff; --text: #1d1d1f; --btn: #0071e3; --btn-text: #fff; }
        @media (prefers-color-scheme: dark) { :root { --bg: #000; --card: #1c1c1e; --text: #f5f5f7; } }
        
        body { font-family: "SF Pro Text", -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        
        header { background: rgba(255,255,255,0.8); backdrop-filter: saturate(180%) blur(20px); position: sticky; top: 0; padding: 1rem 0; z-index: 10; border-bottom: 1px solid rgba(0,0,0,0.1); }
        @media (prefers-color-scheme: dark) { header { background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); } }
        
        .container { max-width: 980px; margin: 0 auto; padding: 0 1.5rem; }
        .hero { text-align: center; padding: 4rem 0; }
        .hero h1 { font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem; }
        .hero p { font-size: 1.5rem; color: #86868b; font-weight: 400; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; padding: 2rem 0; }
        
        .product { background: var(--card); border-radius: 18px; padding: 2rem; text-align: center; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .product:hover { transform: scale(1.02); }
        .product h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .product .price { font-size: 1.1rem; color: #86868b; margin-bottom: 1.5rem; }
        
        button { background: var(--btn); color: var(--btn-text); border: none; padding: 0.8rem 1.5rem; border-radius: 99px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        button:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <header>
        <div class="container" style="display:flex; justify-content:space-between; align-items:center;">
            <b>Store.paper</b>
            <span>🛒 0</span>
        </div>
    </header>
    ${content}
</body>
</html>
`;

// ----------------------------------------------------------------------
// APPS
// ----------------------------------------------------------------------

export const apps: VirtualApp[] = [
    {
        domain: 'blog.paper',
        name: 'Dev Blog',
        description: 'A minimal markdown-ish blog engine.',
        handler: (path) => {
            let bodyContent = '';
            
            if (path === '/' || path === '/index.html') {
                bodyContent = `
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
                bodyContent = `
                     <a href="/" style="display:inline-block; margin-bottom:2rem; color:var(--accent); text-decoration:none">← Back to Home</a>
                     <div class="meta">Blog Post</div>
                     <h1>${path.replace('/post/', 'Story #')}</h1>
                     <p>This content is generated dynamically by the WebVM running in your browser tab.</p>
                     <p>It demonstrates that we can serve rich HTML content without a backend server.</p>
                `;
            } else {
                 return defaultHandler(path);
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: BLOG_TEMPLATE(bodyContent)
            };
        }
    },
    {
        domain: 'shop.paper',
        name: 'Paper Store',
        description: 'An Apple-style e-commerce prototype.',
        handler: (_path) => {
             const content = `
                <div class="hero">
                    <h1>Paper Supplies.</h1>
                    <p>Pro-grade materials for your next idea.</p>
                </div>
                <div class="container">
                    <div class="grid">
                        <div class="product">
                            <h3>Graph Paper</h3>
                            <div class="price">$5.00 / pad</div>
                            <button onclick="alert('Added to cart')">Buy</button>
                        </div>
                        <div class="product">
                            <h3>Dot Grid</h3>
                            <div class="price">$6.50 / pad</div>
                            <button onclick="alert('Added to cart')">Buy</button>
                        </div>
                        <div class="product">
                            <h3>Plain White</h3>
                            <div class="price">$4.00 / pad</div>
                            <button onclick="alert('Added to cart')">Buy</button>
                        </div>
                         <div class="product">
                            <h3>Blueprint</h3>
                            <div class="price">$12.00 / roll</div>
                            <button onclick="alert('Added to cart')">Buy</button>
                        </div>
                    </div>
                </div>
             `;
             
             return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: SHOP_TEMPLATE(content)
            };
        }
    }
];

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

export const registerApp = (app: VirtualApp) => {
    const idx = apps.findIndex(a => a.domain === app.domain);
    if (idx !== -1) apps.splice(idx, 1);
    apps.push(app);
};

export const createRepoApp = async (repoUrl: string): Promise<VirtualApp> => {
    const repo = new GitHubRepo(repoUrl);
    await repo.initialize();
    
    // Determine domain from repo name
    const domain = `${repo.repo.toLowerCase()}.paper`;

    return {
        domain,
        name: `${repo.owner}/${repo.repo}`,
        description: `Live preview of ${repoUrl}`,
        handler: async (path) => {
            // Enhanced "Smart Serve" logic
            try {
                // 1. Try exact match
                let content = await repo.getFile(path);
                let servedPath = path;

                // 2. Try index.html for directories
                if (content === null) {
                    if (path === '/' || path.endsWith('/')) {
                        content = await repo.getFile(path + 'index.html');
                        servedPath = path + 'index.html';
                    }
                }
                
                // 3. Try "dist/index.html" or "public/index.html" for root
                if (content === null && path === '/') {
                     content = await repo.getFile('/dist/index.html');
                     if (!content) content = await repo.getFile('/public/index.html');
                     if (content) servedPath = '/index.html';
                }

                if (content === null) {
                    return {
                        status: 404,
                        headers: { 'Content-Type': 'text/html' },
                        body: `
                        <html>
                            <head><title>404</title><style>body{font-family:sans-serif;padding:2rem}</style></head>
                            <body>
                                <h1>404 Not Found</h1>
                                <p>File not found: <code>${path}</code></p>
                                <hr>
                                <p>Repo: ${repo.owner}/${repo.repo}</p>
                            </body>
                        </html>`
                    };
                }

                const ext = servedPath.split('.').pop();
                let contentType = 'text/plain';
                if (ext === 'html') contentType = 'text/html';
                if (ext === 'js') contentType = 'application/javascript';
                if (ext === 'css') contentType = 'text/css';
                if (ext === 'json') contentType = 'application/json';
                if (ext === 'png') contentType = 'image/png';
                if (ext === 'svg') contentType = 'image/svg+xml';

                // Basic injection to make relative links work in Virtual Mode if we were rewriting
                // But for now, we just serve raw.
                
                return {
                    status: 200,
                    headers: { 'Content-Type': contentType },
                    body: content
                };
            } catch (e: any) {
                return {
                    status: 500,
                    headers: { 'Content-Type': 'text/html' },
                    body: `<h1>500 Error</h1><p>${e.message}</p>`
                };
            }
        }
    };
};

export const defaultHandler = (host: string): ResponseData => {
    return {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
        body: `<h1>404 Not Found</h1><p>Domain ${host} not found.</p>`
    };
};
