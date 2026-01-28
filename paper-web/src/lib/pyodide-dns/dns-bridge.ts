/**
 * DNS Bridge
 * Bridge between JavaScript and Python DNS resolver
 */

import { PyodideDNSResolver, type DNSRecord } from './dns-resolver';

export interface DNSQuery {
  domain: string;
  type: string;
  timestamp: number;
}

export interface DNSResponse {
  query: DNSQuery;
  record: DNSRecord | null;
  cached: boolean;
  resolveTime: number;
}

export class DNSBridge {
  private resolver: PyodideDNSResolver;
  private queryCache: Map<string, DNSResponse> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor(resolver: PyodideDNSResolver) {
    this.resolver = resolver;
  }

  /**
   * Resolve domain with caching
   */
  async resolve(domain: string): Promise<DNSResponse> {
    const startTime = Date.now();

    // Check local cache first
    const cached = this.queryCache.get(domain);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      console.log('DNS bridge cache hit:', domain);
      return {
        ...cached,
        cached: true,
        resolveTime: Date.now() - startTime
      };
    }

    // Query DNS resolver
    const query: DNSQuery = {
      domain,
      type: 'A',
      timestamp: Date.now()
    };

    const record = await this.resolver.resolve(domain);

    const response: DNSResponse = {
      query,
      record,
      cached: false,
      resolveTime: Date.now() - startTime
    };

    // Cache the response
    if (record) {
      this.queryCache.set(domain, {
        ...response,
        timestamp: Date.now()
      });
    }

    return response;
  }

  /**
   * Register domain
   */
  async register(domain: string, cid: string, metadata?: any): Promise<boolean> {
    const success = await this.resolver.register(domain, cid, metadata);

    if (success) {
      // Invalidate cache for this domain
      this.queryCache.delete(domain);
    }

    return success;
  }

  /**
   * Batch resolve multiple domains
   */
  async resolveMultiple(domains: string[]): Promise<Map<string, DNSResponse>> {
    const results = new Map<string, DNSResponse>();

    // Resolve in parallel
    await Promise.all(
      domains.map(async (domain) => {
        const response = await this.resolve(domain);
        results.set(domain, response);
      })
    );

    return results;
  }

  /**
   * Prefetch domains
   */
  async prefetch(domains: string[]): Promise<void> {
    console.log('Prefetching domains:', domains);
    await this.resolveMultiple(domains);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    const resolverStats = await this.resolver.getCacheStats();
    
    return {
      resolver: resolverStats,
      bridge: {
        cachedQueries: this.queryCache.size,
        domains: Array.from(this.queryCache.keys())
      }
    };
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.queryCache.clear();
    await this.resolver.clearCache();
    console.log('DNS bridge cache cleared');
  }

  /**
   * Validate domain name
   */
  validateDomain(domain: string): boolean {
    // Check if domain ends with .paper
    if (!domain.endsWith('.paper')) {
      return false;
    }

    // Check for valid characters
    const validPattern = /^[a-z0-9-]+\.paper$/;
    return validPattern.test(domain.toLowerCase());
  }

  /**
   * Parse domain into parts
   */
  parseDomain(domain: string): { name: string; tld: string } {
    const parts = domain.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid domain format');
    }

    return {
      name: parts.slice(0, -1).join('.'),
      tld: parts[parts.length - 1]
    };
  }

  /**
   * Check if resolver is ready
   */
  isReady(): boolean {
    return this.resolver.isReady();
  }
}

// Singleton instance
let dnsBridgeInstance: DNSBridge | null = null;

/**
 * Get DNS bridge instance
 */
export function getDNSBridge(resolver: PyodideDNSResolver): DNSBridge {
  if (!dnsBridgeInstance) {
    dnsBridgeInstance = new DNSBridge(resolver);
  }
  return dnsBridgeInstance;
}

/**
 * Initialize DNS bridge
 */
export async function initDNSBridge(resolver: PyodideDNSResolver): Promise<DNSBridge> {
  const bridge = getDNSBridge(resolver);
  return bridge;
}
