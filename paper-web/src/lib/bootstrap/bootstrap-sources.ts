/**
 * Bootstrap Sources
 * Defines all bootstrap sources for redundant network access
 */

export interface BootstrapSource {
  id: string;
  type: 'domain' | 'ipfs' | 'cdn' | 'p2p' | 'pdf';
  url: string;
  priority: number;
  timeout: number;
  enabled: boolean;
}

/**
 * Get all bootstrap sources
 */
export function getBootstrapSources(): BootstrapSource[] {
  return [
    // PDF Bootstrap (Primary - Unblockable via jsDelivr)
    {
      id: 'pdf-jsdelivr',
      type: 'pdf',
      url: 'https://cdn.jsdelivr.net/gh/xtoazt/paper@latest/bootstrap.pdf',
      priority: 100,
      timeout: 5000,
      enabled: true
    },

    // Current Deployment
    {
      id: 'paper-is-a-software',
      type: 'domain',
      url: 'https://paper.is-a.software',
      priority: 90,
      timeout: 5000,
      enabled: true
    },

    // Multiple Bootstrap Domains
    {
      id: 'paper-app',
      type: 'domain',
      url: 'https://paper.app',
      priority: 80,
      timeout: 5000,
      enabled: false // Not yet registered
    },
    {
      id: 'paper-io',
      type: 'domain',
      url: 'https://paper.io',
      priority: 79,
      timeout: 5000,
      enabled: false // Not yet registered
    },
    {
      id: 'paper-dev',
      type: 'domain',
      url: 'https://paper.dev',
      priority: 78,
      timeout: 5000,
      enabled: false // Not yet registered
    },
    {
      id: 'paper-net',
      type: 'domain',
      url: 'https://paper.net',
      priority: 77,
      timeout: 5000,
      enabled: false // Not yet registered
    },
    {
      id: 'paper-org',
      type: 'domain',
      url: 'https://paper.org',
      priority: 76,
      timeout: 5000,
      enabled: false // Not yet registered
    },

    // IPFS Gateways
    {
      id: 'ipfs-io',
      type: 'ipfs',
      url: 'https://ipfs.io/ipfs/QmPaperBootstrap',
      priority: 70,
      timeout: 10000,
      enabled: true
    },
    {
      id: 'cloudflare-ipfs',
      type: 'ipfs',
      url: 'https://cloudflare-ipfs.com/ipfs/QmPaperBootstrap',
      priority: 69,
      timeout: 10000,
      enabled: true
    },
    {
      id: 'dweb-link',
      type: 'ipfs',
      url: 'https://dweb.link/ipfs/QmPaperBootstrap',
      priority: 68,
      timeout: 10000,
      enabled: true
    },
    {
      id: 'pinata-gateway',
      type: 'ipfs',
      url: 'https://gateway.pinata.cloud/ipfs/QmPaperBootstrap',
      priority: 67,
      timeout: 10000,
      enabled: true
    },

    // CDN Endpoints
    {
      id: 'cloudflare-cdn',
      type: 'cdn',
      url: 'https://paper.cloudflare.com',
      priority: 60,
      timeout: 5000,
      enabled: false // Not yet configured
    },
    {
      id: 'vercel-cdn',
      type: 'cdn',
      url: 'https://paper.vercel.app',
      priority: 59,
      timeout: 5000,
      enabled: false // Not yet configured
    },
    {
      id: 'netlify-cdn',
      type: 'cdn',
      url: 'https://paper.netlify.app',
      priority: 58,
      timeout: 5000,
      enabled: false // Not yet configured
    }
  ];
}

/**
 * Get enabled bootstrap sources sorted by priority
 */
export function getEnabledSources(): BootstrapSource[] {
  return getBootstrapSources()
    .filter(source => source.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get sources by type
 */
export function getSourcesByType(type: BootstrapSource['type']): BootstrapSource[] {
  return getBootstrapSources()
    .filter(source => source.type === type && source.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Add custom bootstrap source
 */
export function addCustomSource(source: BootstrapSource): void {
  const sources = getBootstrapSources();
  sources.push(source);
  // In production, persist to IndexedDB
  console.log('Custom bootstrap source added:', source.id);
}

/**
 * Update bootstrap source
 */
export function updateSource(id: string, updates: Partial<BootstrapSource>): void {
  const sources = getBootstrapSources();
  const source = sources.find(s => s.id === id);
  
  if (source) {
    Object.assign(source, updates);
    // In production, persist to IndexedDB
    console.log('Bootstrap source updated:', id);
  }
}
