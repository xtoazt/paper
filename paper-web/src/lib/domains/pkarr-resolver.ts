/**
 * PKARR Resolver
 * Public Key Addressable Resource Records for sovereign TLD resolution
 */

import { EncryptionLayer } from '../tunneling/encryption';
import { P2PNode } from '../p2p/libp2p-node';

export interface PKARRRecord {
  publicKey: string;
  domain: string;
  content: string;
  signature: string;
  timestamp: number;
  ttl: number;
}

export interface PKARRKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  domain: string;
}

export class PKARRResolver {
  private encryption: EncryptionLayer;
  private p2pNode: P2PNode;
  private keyPairs: Map<string, PKARRKeyPair> = new Map();
  private records: Map<string, PKARRRecord> = new Map();

  constructor(encryption: EncryptionLayer, p2pNode: P2PNode) {
    this.encryption = encryption;
    this.p2pNode = p2pNode;
  }

  /**
   * Generate keypair and domain
   */
  async generateDomain(): Promise<PKARRKeyPair> {
    // Generate Ed25519 keypair
    const keyPair = await this.encryption.generateKeyPair();

    // Generate domain from public key hash
    const domain = await this.publicKeyToDomain(keyPair.publicKey);

    const pkarrKeyPair: PKARRKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      domain
    };

    // Store keypair
    this.keyPairs.set(domain, pkarrKeyPair);

    console.log('PKARR domain generated:', domain);
    return pkarrKeyPair;
  }

  /**
   * Publish record to DHT
   */
  async publish(domain: string, content: string, ttl: number = 3600): Promise<boolean> {
    const keyPair = this.keyPairs.get(domain);
    if (!keyPair) {
      throw new Error('Keypair not found for domain');
    }

    // Create record
    const record: PKARRRecord = {
      publicKey: this.encryption.toHex(keyPair.publicKey),
      domain,
      content,
      signature: '',
      timestamp: Date.now(),
      ttl
    };

    // Sign record
    const signature = await this.signRecord(record, keyPair.privateKey);
    record.signature = signature;

    // Store locally
    this.records.set(domain, record);

    // Publish to DHT
    if (this.p2pNode.isRunning()) {
      try {
        const key = await this.domainToKey(domain);
        const value = new TextEncoder().encode(JSON.stringify(record));
        await this.p2pNode.putDHT(key, value);
        console.log('PKARR record published to DHT:', domain);
      } catch (error) {
        console.error('Failed to publish to DHT:', error);
        return false;
      }
    }

    console.log('PKARR record published:', domain);
    return true;
  }

  /**
   * Resolve domain from DHT
   */
  async resolve(domain: string): Promise<PKARRRecord | null> {
    // Check local cache first
    const cached = this.records.get(domain);
    if (cached && !this.isExpired(cached)) {
      console.log('PKARR record found in cache:', domain);
      return cached;
    }

    // Query DHT
    if (this.p2pNode.isRunning()) {
      try {
        const key = await this.domainToKey(domain);
        const value = await this.p2pNode.getDHT(key);

        if (value) {
          const recordData = JSON.parse(new TextDecoder().decode(value));
          const record: PKARRRecord = recordData;

          // Verify signature
          const isValid = await this.verifyRecord(record);
          if (!isValid) {
            console.error('Invalid PKARR record signature:', domain);
            return null;
          }

          // Cache record
          this.records.set(domain, record);

          console.log('PKARR record resolved from DHT:', domain);
          return record;
        }
      } catch (error) {
        console.error('Failed to resolve from DHT:', error);
      }
    }

    console.log('PKARR record not found:', domain);
    return null;
  }

  /**
   * Update record
   */
  async update(domain: string, content: string): Promise<boolean> {
    return await this.publish(domain, content);
  }

  /**
   * Delete record
   */
  async delete(domain: string): Promise<boolean> {
    this.records.delete(domain);
    this.keyPairs.delete(domain);

    // In a real implementation, we would remove from DHT
    // DHT doesn't support deletion, so we would publish an empty record

    console.log('PKARR record deleted:', domain);
    return true;
  }

  /**
   * Get all owned domains
   */
  getOwnedDomains(): string[] {
    return Array.from(this.keyPairs.keys());
  }

  /**
   * Get keypair for domain
   */
  getKeyPair(domain: string): PKARRKeyPair | undefined {
    return this.keyPairs.get(domain);
  }

  /**
   * Import keypair
   */
  importKeyPair(keyPair: PKARRKeyPair): void {
    this.keyPairs.set(keyPair.domain, keyPair);
    console.log('PKARR keypair imported:', keyPair.domain);
  }

  /**
   * Export keypair
   */
  exportKeyPair(domain: string): PKARRKeyPair | null {
    const keyPair = this.keyPairs.get(domain);
    return keyPair || null;
  }

  /**
   * Convert public key to domain
   */
  private async publicKeyToDomain(publicKey: Uint8Array): Promise<string> {
    // Hash public key
    const hash = await this.encryption.hash(publicKey);

    // Take first 16 bytes and encode as base32
    const base32 = this.base32Encode(hash.slice(0, 16));

    return `${base32}.paper`;
  }

  /**
   * Convert domain to DHT key
   */
  private async domainToKey(domain: string): Promise<Uint8Array> {
    const hash = await this.encryption.hash(domain);
    return hash;
  }

  /**
   * Sign record
   */
  private async signRecord(record: PKARRRecord, privateKey: Uint8Array): Promise<string> {
    // Create signing data
    const signingData = JSON.stringify({
      publicKey: record.publicKey,
      domain: record.domain,
      content: record.content,
      timestamp: record.timestamp,
      ttl: record.ttl
    });

    // Hash and sign (simplified - in production use proper signing)
    const hash = await this.encryption.hash(signingData);
    return this.encryption.toHex(hash);
  }

  /**
   * Verify record signature
   */
  private async verifyRecord(record: PKARRRecord): Promise<boolean> {
    // Recreate signing data
    const signingData = JSON.stringify({
      publicKey: record.publicKey,
      domain: record.domain,
      content: record.content,
      timestamp: record.timestamp,
      ttl: record.ttl
    });

    // Hash and verify (simplified - in production use proper verification)
    const hash = await this.encryption.hash(signingData);
    const expectedSignature = this.encryption.toHex(hash);

    return record.signature === expectedSignature;
  }

  /**
   * Check if record is expired
   */
  private isExpired(record: PKARRRecord): boolean {
    const age = Date.now() - record.timestamp;
    return age > record.ttl * 1000;
  }

  /**
   * Base32 encode (simplified)
   */
  private base32Encode(data: Uint8Array): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
    let bits = '';
    
    // Convert bytes to bits
    for (const byte of data) {
      bits += byte.toString(2).padStart(8, '0');
    }

    // Encode 5 bits at a time
    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.slice(i, i + 5).padEnd(5, '0');
      const index = parseInt(chunk, 2);
      result += alphabet[index];
    }

    return result.toLowerCase();
  }
}

// Singleton instance
let pkarrResolverInstance: PKARRResolver | null = null;

/**
 * Get PKARR resolver instance
 */
export function getPKARRResolver(
  encryption: EncryptionLayer,
  p2pNode: P2PNode
): PKARRResolver {
  if (!pkarrResolverInstance) {
    pkarrResolverInstance = new PKARRResolver(encryption, p2pNode);
  }
  return pkarrResolverInstance;
}
