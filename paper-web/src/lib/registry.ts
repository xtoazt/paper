import { GitHubRepo } from './github';
import { runtime } from './runtime';

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
// APPS
// ----------------------------------------------------------------------

export const apps: VirtualApp[] = [
    {
        domain: 'blog.paper',
        name: 'Dev Blog',
        description: 'A minimal markdown-ish blog engine running in BrowserPod.',
        handler: async (path) => {
             // Delegate to Runtime
             return await runtime.handleRequest('blog.paper', path);
        }
    },
    {
        domain: 'shop.paper',
        name: 'Paper Store',
        description: 'An Apple-style e-commerce prototype running in BrowserPod.',
        handler: async (path) => {
             // Delegate to Runtime
             return await runtime.handleRequest('shop.paper', path);
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
    // 1. Mount to Runtime
    await runtime.mountRepo(repoUrl);
    
    // 2. Create App Definition that delegates to Runtime
    const domain = `${repoUrl.split('/')[1].toLowerCase()}.paper`;

    return {
        domain,
        name: repoUrl,
        description: `Live preview of ${repoUrl}`,
        handler: async (path) => {
            return await runtime.handleRequest(domain, path);
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
