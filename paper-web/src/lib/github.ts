interface GitHubFile {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: 'file' | 'dir';
    _links: {
        self: string;
        git: string;
        html: string;
    };
}

export class GitHubRepo {
    owner: string;
    repo: string;
    branch: string;
    tree: Record<string, GitHubFile> = {};

    constructor(repoUrl: string) {
        // Handle https://github.com/user/repo or user/repo
        const clean = repoUrl.replace('https://github.com/', '').split('/');
        this.owner = clean[0];
        this.repo = clean[1];
        this.branch = 'main'; // Default, should detect
    }

    async initialize() {
        // Simple recursive fetch for root (shallow for now to save API limits)
        // For a real production app, we'd use the git tree API for deep recursive listing
        await this.fetchDir('');
    }

    async fetchDir(path: string) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch repo: ${res.statusText}`);
        
        const data = await res.json() as GitHubFile[];
        
        for (const item of data) {
            // Store with leading slash
            const storePath = '/' + item.path;
            this.tree[storePath] = item;
        }
    }

    async getFile(path: string): Promise<string | null> {
        // Exact match
        let item = this.tree[path];
        
        // Try index.html if it's a directory or root
        if (!item && (path === '/' || this.tree[path]?.type === 'dir')) {
            const indexPath = path === '/' ? '/index.html' : `${path}/index.html`;
            item = this.tree[indexPath];
        }

        if (!item || item.type !== 'file') return null;

        // Fetch content
        const res = await fetch(item.download_url);
        return await res.text();
    }
}

