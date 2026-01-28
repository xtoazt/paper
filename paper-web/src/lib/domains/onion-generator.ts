/**
 * Onion Domain Generator
 * Generates cryptographically secure .paper domains similar to Tor .onion addresses
 */

import { PKARRResolver, type PKARRKeyPair } from './pkarr-resolver';

export interface OnionDomain {
  domain: string;
  keyPair: PKARRKeyPair;
  publicKey: string;
  checksum: string;
  version: number;
}

export class OnionGenerator {
  private pkarrResolver: PKARRResolver;

  constructor(pkarrResolver: PKARRResolver) {
    this.pkarrResolver = pkarrResolver;
  }

  /**
   * Generate new onion-like domain
   */
  async generate(): Promise<OnionDomain> {
    console.log('Generating onion domain...');

    // Generate PKARR keypair and domain
    const keyPair = await this.pkarrResolver.generateDomain();

    // Extract public key hex
    const publicKeyHex = Array.from(keyPair.publicKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculate checksum (first 4 bytes of hash)
    const checksum = publicKeyHex.substring(0, 8);

    const onionDomain: OnionDomain = {
      domain: keyPair.domain,
      keyPair,
      publicKey: publicKeyHex,
      checksum,
      version: 1
    };

    console.log('Onion domain generated:', onionDomain.domain);
    return onionDomain;
  }

  /**
   * Generate vanity domain (with specific prefix)
   */
  async generateVanity(prefix: string, maxAttempts: number = 1000): Promise<OnionDomain | null> {
    console.log('Generating vanity domain with prefix:', prefix);

    prefix = prefix.toLowerCase();

    for (let i = 0; i < maxAttempts; i++) {
      const domain = await this.generate();
      const name = domain.domain.replace('.paper', '');

      if (name.startsWith(prefix)) {
        console.log('Vanity domain found:', domain.domain, 'attempts:', i + 1);
        return domain;
      }

      if (i % 100 === 0) {
        console.log('Vanity search progress:', i, 'attempts');
      }
    }

    console.log('Vanity domain not found after', maxAttempts, 'attempts');
    return null;
  }

  /**
   * Validate onion domain format
   */
  validateDomain(domain: string): boolean {
    // Remove .paper TLD
    const name = domain.replace('.paper', '');

    // Check length (base32 encoded public key hash is typically 26-52 chars)
    if (name.length < 16 || name.length > 64) {
      return false;
    }

    // Check characters (base32 alphabet)
    const validChars = /^[a-z2-7]+$/;
    if (!validChars.test(name)) {
      return false;
    }

    return true;
  }

  /**
   * Get domain info
   */
  async getInfo(domain: string): Promise<any> {
    if (!this.validateDomain(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }

    // Try to resolve from PKARR
    const record = await this.pkarrResolver.resolve(domain);

    return {
      valid: true,
      domain,
      exists: record !== null,
      record: record || undefined
    };
  }

  /**
   * Generate multiple domains
   */
  async generateBatch(count: number): Promise<OnionDomain[]> {
    console.log('Generating batch of', count, 'domains');

    const domains: OnionDomain[] = [];

    for (let i = 0; i < count; i++) {
      const domain = await this.generate();
      domains.push(domain);
    }

    console.log('Batch generation complete:', count, 'domains');
    return domains;
  }

  /**
   * Export domain
   */
  exportDomain(domain: OnionDomain): string {
    return JSON.stringify({
      domain: domain.domain,
      publicKey: domain.publicKey,
      privateKey: Array.from(domain.keyPair.privateKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      checksum: domain.checksum,
      version: domain.version
    }, null, 2);
  }

  /**
   * Import domain
   */
  async importDomain(data: string): Promise<OnionDomain> {
    const parsed = JSON.parse(data);

    // Convert hex strings back to Uint8Array
    const publicKey = new Uint8Array(
      parsed.publicKey.match(/.{2}/g).map((byte: string) => parseInt(byte, 16))
    );

    const privateKey = new Uint8Array(
      parsed.privateKey.match(/.{2}/g).map((byte: string) => parseInt(byte, 16))
    );

    const keyPair: PKARRKeyPair = {
      publicKey,
      privateKey,
      domain: parsed.domain
    };

    // Import into PKARR resolver
    this.pkarrResolver.importKeyPair(keyPair);

    const onionDomain: OnionDomain = {
      domain: parsed.domain,
      keyPair,
      publicKey: parsed.publicKey,
      checksum: parsed.checksum,
      version: parsed.version
    };

    console.log('Domain imported:', onionDomain.domain);
    return onionDomain;
  }
}

// Singleton instance
let onionGeneratorInstance: OnionGenerator | null = null;

/**
 * Get onion generator instance
 */
export function getOnionGenerator(pkarrResolver: PKARRResolver): OnionGenerator {
  if (!onionGeneratorInstance) {
    onionGeneratorInstance = new OnionGenerator(pkarrResolver);
  }
  return onionGeneratorInstance;
}
