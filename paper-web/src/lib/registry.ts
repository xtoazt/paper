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

const commonStyles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Merriweather:ital,wght@0,300;0,700;1,300&display=swap');
        
        :root { 
            --bg: #ffffff; 
            --fg: #1a1a1a; 
            --accent: #2c2c2c;
            --muted: #666;
            --border: #eaeaea;
        }
        @media (prefers-color-scheme: dark) { 
            :root { 
                --bg: #111111; 
                --fg: #eeeeee; 
                --accent: #888; 
                --muted: #999;
                --border: #333;
            } 
        }
        
        body { 
            font-family: 'Inter', sans-serif;
            background: var(--bg); 
            color: var(--fg); 
            padding: 0; 
            margin: 0;
            line-height: 1.6; 
        }

        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            padding: 4rem 0 2rem;
            border-bottom: 1px solid var(--border);
            margin-bottom: 3rem;
        }

        h1 { 
            font-family: 'Merriweather', serif;
            font-size: 2.5rem;
            font-weight: 700; 
            letter-spacing: -0.03em;
            margin: 0 0 1rem 0;
        }

        .meta {
            color: var(--muted);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
        }

        article {
            margin-bottom: 4rem;
        }

        article h2 {
            font-family: 'Merriweather', serif;
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }

        article p {
            font-size: 1.1rem;
            color: var(--fg);
            opacity: 0.9;
            margin-bottom: 1.5rem;
        }

        a { 
            color: var(--fg); 
            text-decoration: underline; 
            text-decoration-color: var(--accent); 
            text-underline-offset: 3px;
        }
        
        .nav { 
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 1rem;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            z-index: 100;
        }
        
        .nav-logo {
            font-weight: 700;
            text-decoration: none;
        }

        code { 
            background: var(--border); 
            color: var(--fg); 
            padding: 0.2rem 0.4rem; 
            border-radius: 3px; 
            font-family: 'SF Mono', monospace;
            font-size: 0.9em;
        }
    </style>
`;

// Mutable app registry
export const apps: VirtualApp[] = [
    {
        domain: 'blog.paper',
        name: 'Dev Blog',
        description: 'A minimal markdown-ish blog engine running in WebVM.',
        handler: (path) => {
            const content = path === '/' ? `
                <article>
                    <div class="meta">December 23, 2025</div>
                    <h2><a href="/post/1" style="text-decoration: none">Why Local-First Software is the Future</a></h2>
                    <p>We've spent the last decade moving everything to the cloud. It's time to bring it back home. Latency is zero when the server is 127.0.0.1.</p>
                </article>
                <article>
                    <div class="meta">December 22, 2025</div>
                    <h2><a href="/post/2" style="text-decoration: none">The Magic of Loopback Interfaces</a></h2>
                    <p>How we abuse localhost for fun and profit. You don't always need a VPS to host a website, sometimes you just need a clever proxy.</p>
                </article>
                <article>
                    <div class="meta">December 20, 2025</div>
                    <h2><a href="/post/3" style="text-decoration: none">Building Paper: A Post-Mortem</a></h2>
                    <p>Lessons learned from emulating a cloud environment entirely within a browser tab.</p>
                </article>
            ` : `
                <div class="meta">Article View</div>
                <h1>${path.replace('/post/', 'Post #')}</h1>
                <p>You are viewing a dynamically generated post at <code>${path}</code>.</p>
                <p>This content is served directly from the WebVM's memory. No database, no API calls, just pure JavaScript string manipulation.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <br>
                <a href="/">← Back to Home</a>
            `;

            return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Paper Blog</title>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        ${commonStyles}
                    </head>
                    <body>
                        <nav class="nav">
                            <a href="/" class="nav-logo">blog.paper</a>
                            <div>
                                <a href="/about" style="margin-left: 1rem">About</a>
                                <a href="https://paper.dev" style="margin-left: 1rem">Paper</a>
                            </div>
                        </nav>
                        <div class="container">
                            <header>
                                <h1>The Paper Blog</h1>
                                <p>Thoughts on local-first web development.</p>
                            </header>
                            ${content}
                        </div>
                    </body>
                </html>`
            };
        }
    },
    {
        domain: 'shop.paper',
        name: 'Paper Store',
        description: 'An e-commerce prototype showcasing dynamic routing.',
        handler: (path) => {
            return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: `
                <html>
                    <head><title>Shop</title>${commonStyles}</head>
                    <body>
                        <div class="container" style="padding-top: 4rem">
                            <h1>Paper Supply Co.</h1>
                            <p>Currently browsing: <b>${path}</b></p>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">
                                <div style="border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px;">
                                    <h3>Graph Paper</h3>
                                    <p>$5.00</p>
                                    <button onclick="alert('Added to cart (in memory)')" style="width:100%; padding: 0.5rem; background: var(--fg); color: var(--bg); border: none; cursor: pointer;">Add to Cart</button>
                                </div>
                                <div style="border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px;">
                                    <h3>Dot Grid</h3>
                                    <p>$6.50</p>
                                    <button onclick="alert('Added to cart (in memory)')" style="width:100%; padding: 0.5rem; background: var(--fg); color: var(--bg); border: none; cursor: pointer;">Add to Cart</button>
                                </div>
                                <div style="border: 1px solid var(--border); padding: 1.5rem; border-radius: 4px;">
                                    <h3>Plain White</h3>
                                    <p>$4.00</p>
                                    <button onclick="alert('Added to cart (in memory)')" style="width:100%; padding: 0.5rem; background: var(--fg); color: var(--bg); border: none; cursor: pointer;">Add to Cart</button>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>`
            };
        }
    }
];

export const registerApp = (app: VirtualApp) => {
    // Remove existing if any
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
            try {
                const content = await repo.getFile(path);
                if (content === null) {
                    return {
                        status: 404,
                        headers: { 'Content-Type': 'text/html' },
                        body: `<h1>404 Not Found</h1><p>File not found in repo: ${path}</p>`
                    };
                }

                // Naive content type detection
                const ext = path.split('.').pop();
                let contentType = 'text/plain';
                if (ext === 'html') contentType = 'text/html';
                if (ext === 'js') contentType = 'application/javascript';
                if (ext === 'css') contentType = 'text/css';
                if (ext === 'json') contentType = 'application/json';

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
        body: `
        <html>
            <head><title>404 Not Found</title>${commonStyles}</head>
            <body>
                <div class="container" style="padding-top: 4rem">
                    <h1>404 - Unknown Domain</h1>
                    <p>The domain <code>${host}</code> is not mapped to any active WebVM application.</p>
                    <p>Check the <a href="https://paper.dev">Paper Dashboard</a> to see active apps.</p>
                </div>
            </body>
        </html>`
    };
};
