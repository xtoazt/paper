/**
 * DHT-based Domain Resolver
 * Resolves .paper domains using DHT and integrates with Pyodide DNS
 */

import { P2PNode } from '../p2p/libp2p-node';
import { PKARRResolver } from './pkarr-resolver';
import { PyodideDNSResolver } from '../pyodide-dns/dns-resolver';

export interface DomainRecord {
  domain: string;
  cid?: string;
  addresses?: string[];
  type: 'ipfs' | 'p2p' | 'pkarr';
  ttl: number;
  timestamp: number;
}

export class DHTResolver {
  private p2pNode: P2PNode;
  private pkarrResolver: PKARRResolver;
  private pyodideDNS: PyodideDNSResolver;
  private cache: Map<string, DomainRecord> = new Map();

  constructor(
    p2pNode: P2PNode,
    pkarrResolver: PKARRResolver,
    pyodideDNS: PyodideDNSResolver
  ) {
    this.p2pNode = p2pNode;
    this.pkarrResolver = pkarrResolver;
    this.pyodideDNS = pyodideDNS;
  }

  /**
   * Resolve domain to content address
   */
  async resolve(domain: string): Promise<DomainRecord | null> {
    console.log('Resolving domain via DHT:', domain);

    // Check cache first
    const cached = this.cache.get(domain);
    if (cached && !this.isExpired(cached)) {
      console.log('Domain found in cache:', domain);
      return cached;
    }

    // Try PKARR resolution first (for cryptographic domains)
    if (this.isPKARRDomain(domain)) {
      const pkarrRecord = await this.pkarrResolver.resolve(domain);
      if (pkarrRecord) {
        const record: DomainRecord = {
          domain,
          cid: pkarrRecord.content,
          type: 'pkarr',
          ttl: pkarrRecord.ttl,
          timestamp: pkarrRecord.timestamp
        };
        this.cache.set(domain, record);
        return record;
      }
    }

    // Try Pyodide DNS
    const dnsRecord = await this.pyodideDNS.resolve(domain);
    if (dnsRecord) {
      const record: DomainRecord = {
        domain: dnsRecord.domain,
        cid: dnsRecord.cid,
        type: 'ipfs',
        ttl: dnsRecord.ttl,
        timestamp: Date.now()
      };
      this.cache.set(domain, record);
      return record;
    }

    // Try DHT lookup
    if (this.p2pNode.isRunning()) {
      try {
        const key = new TextEncoder().encode(domain);
        const value = await this.p2pNode.getDHT(key);

        if (value) {
          const recordData = JSON.parse(new TextDecoder().decode(value));
          const record: DomainRecord = {
            ...recordData,
            timestamp: Date.now()
          };
          this.cache.set(domain, record);
          console.log('Domain resolved from DHT:', domain);
          return record;
        }
      } catch (error) {
        console.error('DHT lookup failed:', error);
      }
    }

    console.log('Domain not found:', domain);
    return null;
  }

  /**
   * Register domain in DHT
   */
  async register(domain: string, cid: string, ttl: number = 3600): Promise<boolean> {
    console.log('Registering domain in DHT:', domain, cid);

    const record: DomainRecord = {
      domain,
      cid,
      type: 'ipfs',
      ttl,
      timestamp: Date.now()
    };

    // Register in Pyodide DNS
    try {
      await this.pyodideDNS.register(domain, cid);
    } catch (error) {
      console.error('Failed to register in Pyodide DNS:', error);
    }

    // Store in DHT
    if (this.p2pNode.isRunning()) {
      try {
        const key = new TextEncoder().encode(domain);
        const value = new TextEncoder().encode(JSON.stringify(record));
        await this.p2pNode.putDHT(key, value);
        console.log('Domain registered in DHT:', domain);
      } catch (error) {
        console.error('Failed to register in DHT:', error);
        return false;
      }
    }

    // Cache locally
    this.cache.set(domain, record);

    return true;
  }

  /**
   * Update domain record
   */
  async update(domain: string, cid: string): Promise<boolean> {
    return await this.register(domain, cid);
  }

  /**
   * Delete domain record
   */
  async delete(domain: string): Promise<boolean> {
    this.cache.delete(domain);
    // DHT doesn't support deletion, so we just remove from cache
    console.log('Domain deleted from cache:', domain);
    return true;
  }

  /**
   * Search for domains by prefix
   */
  async search(prefix: string, limit: number = 10): Promise<DomainRecord[]> {
    const results: DomainRecord[] = [];

    // Search in cache
    for (const [domain, record] of this.cache) {
      if (domain.startsWith(prefix) && !this.isExpired(record)) {
        results.push(record);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get all cached domains
   */
  getCachedDomains(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('DHT resolver cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): any {
    return {
      cachedDomains: this.cache.size,
      domains: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if domain is a PKARR domain (cryptographic)
   */
  private isPKARRDomain(domain: string): boolean {
    // PKARR domains are base32-encoded public key hashes
    // They're typically longer and use specific character set
    const name = domain.replace('.paper', '');
    return name.length > 16 && /^[a-z2-7]+$/.test(name);
  }

  /**
   * Check if record is expired
   */
  private isExpired(record: DomainRecord): boolean {
    const age = Date.now() - record.timestamp;
    return age > record.ttl * 1000;
  }
}

// Singleton instance
let dhtResolverInstance: DHTResolver | null = null;

/**
 * Get DHT resolver instance
 */
export function getDHTResolver(
  p2pNode: P2PNode,
  pkarrResolver: PKARRResolver,
  pyodideDNS: PyodideDNSResolver
): DHTResolver {
  if (!dhtResolverInstance) {
    dhtResolverInstance = new DHTResolver(p2pNode, pkarrResolver, pyodideDNS);
  }
  return dhtResolverInstance;
}
