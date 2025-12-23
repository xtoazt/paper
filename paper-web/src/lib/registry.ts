export interface VirtualApp {
    domain: string;
    name: string;
    description: string;
    handler: (path: string, headers: Record<string, string>) => ResponseData;
}

export interface ResponseData {
    status: number;
    headers: Record<string, string>;
    body: string;
}

const commonStyles = `
    <style>
        :root { --bg: #ffffff; --fg: #111111; --accent: #333; }
        @media (prefers-color-scheme: dark) { :root { --bg: #111111; --fg: #eeeeee; --accent: #888; } }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
               background: var(--bg); color: var(--fg); padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        h1 { border-bottom: 2px solid var(--accent); padding-bottom: 0.5rem; }
        a { color: var(--fg); text-decoration: underline; text-decoration-color: var(--accent); }
        .card { border: 1px solid var(--accent); padding: 1.5rem; margin-bottom: 1rem; border-radius: 4px; }
        .nav { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
        code { background: #333; color: #fff; padding: 0.2rem 0.4rem; border-radius: 3px; }
    </style>
`;

export const apps: VirtualApp[] = [
    {
        domain: 'blog.paper',
        name: 'Dev Blog',
        description: 'A minimal markdown-ish blog engine running in WebVM.',
        handler: (path) => {
            const content = path === '/' ? `
                <h1>The Paper Blog</h1>
                <p>Welcome to the decentralized local blog.</p>
                <div class="card">
                    <h3><a href="/post/1">Why Local First?</a></h3>
                    <p>Building software that runs on the user's machine is the future...</p>
                    <small>Dec 23, 2025</small>
                </div>
                <div class="card">
                    <h3><a href="/post/2">The Magic of 127.0.0.1</a></h3>
                    <p>How we abuse loopback interfaces for fun and profit.</p>
                    <small>Dec 22, 2025</small>
                </div>
            ` : `
                <h1>Post Content</h1>
                <p>You are viewing: <code>${path}</code></p>
                <p>This content is generated dynamically by the WebVM running in the other tab.</p>
                <p><a href="/">← Back to Home</a></p>
            `;

            return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: `<html><head><title>Blog</title>${commonStyles}</head><body><div class="nav"><a href="/">Home</a><a href="/about">About</a></div>${content}</body></html>`
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
                        <h1>Paper Supply Co.</h1>
                        <p>Currently browsing: <b>${path}</b></p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">
                            <div class="card">
                                <h3>Graph Paper</h3>
                                <p>$5.00</p>
                                <button onclick="alert('Added to cart (in memory)')">Add to Cart</button>
                            </div>
                            <div class="card">
                                <h3>Dot Grid</h3>
                                <p>$6.50</p>
                                <button onclick="alert('Added to cart (in memory)')">Add to Cart</button>
                            </div>
                            <div class="card">
                                <h3>Plain White</h3>
                                <p>$4.00</p>
                                <button onclick="alert('Added to cart (in memory)')">Add to Cart</button>
                            </div>
                        </div>
                    </body>
                </html>`
            };
        }
    }
];

export const defaultHandler = (host: string): ResponseData => {
    return {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
        body: `
        <html>
            <head><title>404 Not Found</title>${commonStyles}</head>
            <body>
                <h1>404 - Unknown Domain</h1>
                <p>The domain <code>${host}</code> is not mapped to any active WebVM application.</p>
                <p>Check the <a href="https://paper.dev">Paper Dashboard</a> to see active apps.</p>
            </body>
        </html>`
    };
};

