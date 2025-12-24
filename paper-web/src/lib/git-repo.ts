// Universal Git Repository Importer
// Supports GitHub, GitLab, Bitbucket, and raw Git URLs

interface GitFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    content?: string;
    download_url?: string;
    size?: number;
}

export interface GitRepoInfo {
    provider: 'github' | 'gitlab' | 'bitbucket' | 'raw';
    owner: string;
    repo: string;
    branch: string;
    url: string;
}

export class UniversalGitRepo {
    info: GitRepoInfo;
    tree: Record<string, GitFile> = {};

    constructor(repoUrl: string) {
        this.info = this.parseRepoUrl(repoUrl);
    }

    private parseRepoUrl(url: string): GitRepoInfo {
        // Clean the URL
        url = url.trim().replace(/\/$/, '');
        
        // GitHub
        if (url.includes('github.com')) {
            const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
            if (match) {
                return {
                    provider: 'github',
                    owner: match[1],
                    repo: match[2].replace('.git', ''),
                    branch: match[3] || 'main',
                    url: `https://github.com/${match[1]}/${match[2]}`
                };
            }
        }
        
        // GitLab
        if (url.includes('gitlab.com')) {
            const match = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)(?:\/-\/tree\/([^\/]+))?/);
            if (match) {
                return {
                    provider: 'gitlab',
                    owner: match[1],
                    repo: match[2].replace('.git', ''),
                    branch: match[3] || 'main',
                    url: `https://gitlab.com/${match[1]}/${match[2]}`
                };
            }
        }
        
        // Bitbucket
        if (url.includes('bitbucket.org')) {
            const match = url.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)(?:\/src\/([^\/]+))?/);
            if (match) {
                return {
                    provider: 'bitbucket',
                    owner: match[1],
                    repo: match[2].replace('.git', ''),
                    branch: match[3] || 'main',
                    url: `https://bitbucket.org/${match[1]}/${match[2]}`
                };
            }
        }
        
        // Raw format: user/repo or owner/repo
        const parts = url.split('/').filter(Boolean);
        if (parts.length >= 2 && !url.includes('http')) {
            return {
                provider: 'github', // Default to GitHub for user/repo format
                owner: parts[0],
                repo: parts[1].replace('.git', ''),
                branch: parts[2] || 'main',
                url: `https://github.com/${parts[0]}/${parts[1]}`
            };
        }
        
        throw new Error(`Unsupported repository URL: ${url}`);
    }

    async initialize(): Promise<void> {
        switch (this.info.provider) {
            case 'github':
                await this.fetchGitHub();
                break;
            case 'gitlab':
                await this.fetchGitLab();
                break;
            case 'bitbucket':
                await this.fetchBitbucket();
                break;
            default:
                throw new Error(`Unsupported provider: ${this.info.provider}`);
        }
    }

    private async fetchGitHub(): Promise<void> {
        // Use GitHub API with recursive tree API for better performance
        try {
            // Get default branch first
            const repoInfo = await fetch(`https://api.github.com/repos/${this.info.owner}/${this.info.repo}`);
            if (!repoInfo.ok) throw new Error(`GitHub API error: ${repoInfo.statusText}`);
            const repoData = await repoInfo.json();
            if (!this.info.branch || this.info.branch === 'main') {
                this.info.branch = repoData.default_branch || 'main';
            }

            // Fetch tree recursively
            const treeUrl = `https://api.github.com/repos/${this.info.owner}/${this.info.repo}/git/trees/${this.info.branch}?recursive=1`;
            const treeRes = await fetch(treeUrl);
            
            if (treeRes.ok) {
                const treeData = await treeRes.json();
                for (const item of treeData.tree || []) {
                    if (item.type === 'blob') {
                        this.tree[`/${item.path}`] = {
                            name: item.path.split('/').pop() || item.path,
                            path: `/${item.path}`,
                            type: 'file',
                            download_url: `https://raw.githubusercontent.com/${this.info.owner}/${this.info.repo}/${this.info.branch}/${item.path}`,
                            size: item.size
                        };
                    }
                }
            } else {
                // Fallback to contents API
                await this.fetchDirGitHub('');
            }
        } catch (e) {
            // Fallback to contents API
            await this.fetchDirGitHub('');
        }
    }

    private async fetchDirGitHub(path: string): Promise<void> {
        const url = `https://api.github.com/repos/${this.info.owner}/${this.info.repo}/contents/${path}?ref=${this.info.branch}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch GitHub repo: ${res.statusText}`);
        
        const data = await res.json();
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
            const storePath = '/' + item.path;
            if (item.type === 'file') {
                this.tree[storePath] = {
                    name: item.name,
                    path: storePath,
                    type: 'file',
                    download_url: item.download_url,
                    size: item.size
                };
            } else if (item.type === 'dir') {
                await this.fetchDirGitHub(item.path);
            }
        }
    }

    private async fetchGitLab(): Promise<void> {
        const url = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${this.info.owner}/${this.info.repo}`)}/repository/tree?ref=${this.info.branch}&recursive=true&per_page=100`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch GitLab repo: ${res.statusText}`);
        
        const data = await res.json();
        for (const item of data) {
            if (item.type === 'blob') {
                this.tree[`/${item.path}`] = {
                    name: item.name,
                    path: `/${item.path}`,
                    type: 'file',
                    download_url: `https://gitlab.com/${this.info.owner}/${this.info.repo}/-/raw/${this.info.branch}/${item.path}`,
                    size: item.size
                };
            }
        }
    }

    private async fetchBitbucket(): Promise<void> {
        // Bitbucket API v2
        const url = `https://api.bitbucket.org/2.0/repositories/${this.info.owner}/${this.info.repo}/src/${this.info.branch}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch Bitbucket repo: ${res.statusText}`);
        
        const data = await res.json();
        for (const item of data.values || []) {
            if (item.type === 'commit_file') {
                this.tree[`/${item.path}`] = {
                    name: item.path.split('/').pop() || item.path,
                    path: `/${item.path}`,
                    type: 'file',
                    download_url: `https://bitbucket.org/${this.info.owner}/${this.info.repo}/raw/${this.info.branch}/${item.path}`,
                    size: item.size
                };
            }
        }
    }

    async getFile(path: string): Promise<string | null> {
        const item = this.tree[path];
        if (!item || item.type !== 'file' || !item.download_url) {
            // Try index.html fallback
            const indexPath = path === '/' ? '/index.html' : `${path}/index.html`;
            const indexItem = this.tree[indexPath];
            if (indexItem && indexItem.download_url) {
                const res = await fetch(indexItem.download_url);
                return res.ok ? await res.text() : null;
            }
            return null;
        }

        const res = await fetch(item.download_url);
        return res.ok ? await res.text() : null;
    }

    getStats() {
        const files = Object.values(this.tree).filter(f => f.type === 'file');
        const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
        return {
            fileCount: files.length,
            totalSize,
            provider: this.info.provider,
            branch: this.info.branch
        };
    }
}

