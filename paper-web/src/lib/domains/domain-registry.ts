/**
 * Domain Registry
 * Manages domain registration, ownership, and transfers
 */

import { DHTResolver } from './dht-resolver';
import { PKARRResolver } from './pkarr-resolver';
import { OnionGenerator } from './onion-generator';

export interface RegisteredDomain {
  domain: string;
  cid: string;
  owner: string;
  registeredAt: number;
  expiresAt: number;
  renewable: boolean;
}

export interface DomainTransfer {
  domain: string;
  from: string;
  to: string;
  timestamp: number;
  signature: string;
}

export class DomainRegistry {
  private dhtResolver: DHTResolver;
  private pkarrResolver: PKARRResolver;
  private onionGenerator: OnionGenerator;
  private ownedDomains: Map<string, RegisteredDomain> = new Map();

  constructor(
    dhtResolver: DHTResolver,
    pkarrResolver: PKARRResolver,
    onionGenerator: OnionGenerator
  ) {
    this.dhtResolver = dhtResolver;
    this.pkarrResolver = pkarrResolver;
    this.onionGenerator = onionGenerator;
  }

  /**
   * Register new domain
   */
  async register(domain: string, cid: string, ttl: number = 31536000): Promise<boolean> {
    console.log('Registering domain:', domain);

    // Check if domain is available
    const existing = await this.dhtResolver.resolve(domain);
    if (existing) {
      console.error('Domain already registered:', domain);
      return false;
    }

    // Register in DHT
    const success = await this.dhtResolver.register(domain, cid, ttl);
    if (!success) {
      console.error('Failed to register domain in DHT');
      return false;
    }

    // Add to owned domains
    const registered: RegisteredDomain = {
      domain,
      cid,
      owner: 'local', // In production, use actual owner ID
      registeredAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      renewable: true
    };

    this.ownedDomains.set(domain, registered);

    console.log('Domain registered successfully:', domain);
    return true;
  }

  /**
   * Register onion domain (PKARR-based)
   */
  async registerOnion(cid: string): Promise<string> {
    console.log('Registering onion domain...');

    // Generate onion domain
    const onion = await this.onionGenerator.generate();

    // Publish to PKARR/DHT
    await this.pkarrResolver.publish(onion.domain, cid);

    // Add to owned domains
    const registered: RegisteredDomain = {
      domain: onion.domain,
      cid,
      owner: onion.publicKey,
      registeredAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      renewable: true
    };

    this.ownedDomains.set(onion.domain, registered);

    console.log('Onion domain registered:', onion.domain);
    return onion.domain;
  }

  /**
   * Update domain content
   */
  async update(domain: string, newCid: string): Promise<boolean> {
    const owned = this.ownedDomains.get(domain);
    if (!owned) {
      console.error('Domain not owned:', domain);
      return false;
    }

    // Update in DHT
    const success = await this.dhtResolver.update(domain, newCid);
    if (!success) {
      return false;
    }

    // Update local record
    owned.cid = newCid;

    console.log('Domain updated:', domain);
    return true;
  }

  /**
   * Renew domain registration
   */
  async renew(domain: string, additionalTtl: number = 31536000): Promise<boolean> {
    const owned = this.ownedDomains.get(domain);
    if (!owned || !owned.renewable) {
      console.error('Domain not renewable:', domain);
      return false;
    }

    // Extend expiration
    owned.expiresAt += additionalTtl * 1000;

    // Re-register in DHT
    await this.dhtResolver.register(domain, owned.cid, additionalTtl);

    console.log('Domain renewed:', domain);
    return true;
  }

  /**
   * Transfer domain ownership
   */
  async transfer(domain: string, toOwner: string): Promise<boolean> {
    const owned = this.ownedDomains.get(domain);
    if (!owned) {
      console.error('Domain not owned:', domain);
      return false;
    }

    const transfer: DomainTransfer = {
      domain,
      from: owned.owner,
      to: toOwner,
      timestamp: Date.now(),
      signature: '' // In production, sign with private key
    };

    // Update owner
    owned.owner = toOwner;

    console.log('Domain transferred:', domain, 'to:', toOwner);
    return true;
  }

  /**
   * Release domain
   */
  async release(domain: string): Promise<boolean> {
    const owned = this.ownedDomains.get(domain);
    if (!owned) {
      console.error('Domain not owned:', domain);
      return false;
    }

    // Remove from owned domains
    this.ownedDomains.delete(domain);

    // Delete from DHT (will just remove from cache)
    await this.dhtResolver.delete(domain);

    console.log('Domain released:', domain);
    return true;
  }

  /**
   * Get owned domains
   */
  getOwnedDomains(): RegisteredDomain[] {
    return Array.from(this.ownedDomains.values());
  }

  /**
   * Get domain info
   */
  async getDomainInfo(domain: string): Promise<any> {
    const owned = this.ownedDomains.get(domain);
    const resolved = await this.dhtResolver.resolve(domain);

    return {
      domain,
      owned: owned !== undefined,
      exists: resolved !== null,
      registration: owned,
      resolution: resolved
    };
  }

  /**
   * Search for available domains
   */
  async searchAvailable(prefix: string, limit: number = 10): Promise<string[]> {
    const available: string[] = [];

    // Generate potential domain names
    for (let i = 0; i < limit * 2; i++) {
      const candidate = `${prefix}${i}.paper`;
      const exists = await this.dhtResolver.resolve(candidate);

      if (!exists) {
        available.push(candidate);
        if (available.length >= limit) break;
      }
    }

    return available;
  }

  /**
   * Get registry stats
   */
  getStats(): any {
    const owned = Array.from(this.ownedDomains.values());
    const now = Date.now();

    return {
      totalDomains: owned.length,
      expiringSoon: owned.filter(d => d.expiresAt - now < 30 * 24 * 60 * 60 * 1000).length,
      renewable: owned.filter(d => d.renewable).length
    };
  }
}

// Singleton instance
let domainRegistryInstance: DomainRegistry | null = null;

/**
 * Get domain registry instance
 */
export function getDomainRegistry(
  dhtResolver: DHTResolver,
  pkarrResolver: PKARRResolver,
  onionGenerator: OnionGenerator
): DomainRegistry {
  if (!domainRegistryInstance) {
    domainRegistryInstance = new DomainRegistry(dhtResolver, pkarrResolver, onionGenerator);
  }
  return domainRegistryInstance;
}
