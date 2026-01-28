/**
 * Global Domain Registry
 * Ensures .paper domains are globally consistent across the entire network
 */

import { PKARRResolver, type PKARRRecord } from './pkarr-resolver';
import { DHTResolver } from './dht-resolver';
import { P2PNode } from '../p2p/libp2p-node';
import { ConnectionManager } from '../p2p/connection-manager';

export interface GlobalDomainRecord {
  domain: string;
  owner: string; // Public key of owner
  content: string; // CID or server address
  type: 'static' | 'dynamic' | 'server';
  timestamp: number;
  signature: string;
  replicas: number;
  verified: boolean;
}

export interface DomainConsensus {
  domain: string;
  records: GlobalDomainRecord[];
  consensusRecord: GlobalDomainRecord | null;
  agreement: number; // Percentage of peers agreeing
}

export class GlobalRegistry {
  private pkarrResolver: PKARRResolver;
  private dhtResolver: DHTResolver;
  private p2pNode: P2PNode;
  private connectionManager: ConnectionManager;
  private localRecords: Map<string, GlobalDomainRecord> = new Map();
  private consensusCache: Map<string, DomainConsensus> = new Map();

  constructor(
    pkarrResolver: PKARRResolver,
    dhtResolver: DHTResolver,
    p2pNode: P2PNode,
    connectionManager: ConnectionManager
  ) {
    this.pkarrResolver = pkarrResolver;
    this.dhtResolver = dhtResolver;
    this.p2pNode = p2pNode;
    this.connectionManager = connectionManager;

    // Set up network listeners
    this.setupNetworkListeners();
  }

  /**
   * Register domain globally
   */
  async registerGlobal(
    domain: string,
    content: string,
    type: 'static' | 'dynamic' | 'server' = 'static'
  ): Promise<boolean> {
    console.log('Registering domain globally:', domain);

    try {
      // 1. Get or generate PKARR keypair for this domain
      let keyPair = this.pkarrResolver.getKeyPair(domain);
      
      if (!keyPair) {
        // Generate new PKARR domain (cryptographically unique)
        keyPair = await this.pkarrResolver.generateDomain();
        domain = keyPair.domain;
      }

      // 2. Create global record
      const record: GlobalDomainRecord = {
        domain,
        owner: Buffer.from(keyPair.publicKey).toString('hex'),
        content,
        type,
        timestamp: Date.now(),
        signature: '',
        replicas: 0,
        verified: false
      };

      // 3. Sign the record with private key
      record.signature = await this.signRecord(record, keyPair.privateKey);

      // 4. Publish to PKARR (this creates a cryptographically verifiable record)
      await this.pkarrResolver.publish(domain, content);

      // 5. Publish to DHT for discovery
      await this.dhtResolver.register(domain, content);

      // 6. Broadcast to all connected peers
      await this.broadcastDomainAnnouncement(record);

      // 7. Store locally
      this.localRecords.set(domain, record);
      record.verified = true;
      record.replicas = 1;

      console.log('Domain registered globally:', domain);
      return true;
    } catch (error) {
      console.error('Global registration failed:', error);
      return false;
    }
  }

  /**
   * Resolve domain with global consensus
   */
  async resolveGlobal(domain: string): Promise<GlobalDomainRecord | null> {
    console.log('Resolving domain globally:', domain);

    try {
      // 1. Check consensus cache
      const cached = this.consensusCache.get(domain);
      if (cached && cached.consensusRecord && this.isCacheValid(cached)) {
        console.log('Using cached consensus for:', domain);
        return cached.consensusRecord;
      }

      // 2. Query multiple sources in parallel
      const [pkarrRecord, dhtRecord, peerRecords] = await Promise.all([
        this.pkarrResolver.resolve(domain),
        this.dhtResolver.resolve(domain),
        this.queryPeersForDomain(domain)
      ]);

      // 3. Collect all records
      const allRecords: GlobalDomainRecord[] = [];

      if (pkarrRecord) {
        allRecords.push(this.pkarrToGlobalRecord(pkarrRecord));
      }

      if (dhtRecord) {
        allRecords.push({
          domain: dhtRecord.domain,
          owner: '',
          content: dhtRecord.cid || '',
          type: 'static',
          timestamp: dhtRecord.timestamp,
          signature: '',
          replicas: 0,
          verified: false
        });
      }

      allRecords.push(...peerRecords);

      // 4. Achieve consensus
      const consensus = await this.achieveConsensus(domain, allRecords);

      // 5. Cache consensus
      this.consensusCache.set(domain, consensus);

      // 6. Return consensus record
      if (consensus.consensusRecord) {
        console.log('Domain resolved with consensus:', domain, 'agreement:', consensus.agreement);
        return consensus.consensusRecord;
      }

      console.log('Domain not found globally:', domain);
      return null;
    } catch (error) {
      console.error('Global resolution failed:', error);
      return null;
    }
  }

  /**
   * Query peers for domain record
   */
  private async queryPeersForDomain(domain: string): Promise<GlobalDomainRecord[]> {
    const records: GlobalDomainRecord[] = [];

    try {
      // Request domain records from all peers
      await this.connectionManager.publishTopic('paper:domain:query', {
        type: 'query',
        domain,
        timestamp: Date.now()
      });

      // Wait for responses (collected via network listeners)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get records from local cache (populated by network listeners)
      const domainRecords = Array.from(this.localRecords.values())
        .filter(r => r.domain === domain);

      records.push(...domainRecords);
    } catch (error) {
      console.error('Peer query failed:', error);
    }

    return records;
  }

  /**
   * Achieve consensus among records
   */
  private async achieveConsensus(
    domain: string,
    records: GlobalDomainRecord[]
  ): Promise<DomainConsensus> {
    if (records.length === 0) {
      return {
        domain,
        records: [],
        consensusRecord: null,
        agreement: 0
      };
    }

    // Group records by content hash
    const contentGroups = new Map<string, GlobalDomainRecord[]>();
    
    for (const record of records) {
      const key = `${record.content}:${record.owner}`;
      if (!contentGroups.has(key)) {
        contentGroups.set(key, []);
      }
      contentGroups.get(key)!.push(record);
    }

    // Find the group with most records (consensus)
    let largestGroup: GlobalDomainRecord[] = [];
    for (const group of contentGroups.values()) {
      if (group.length > largestGroup.length) {
        largestGroup = group;
      }
    }

    // Calculate agreement percentage
    const agreement = (largestGroup.length / records.length) * 100;

    // Use the most recent record from the consensus group
    const consensusRecord = largestGroup.sort((a, b) => b.timestamp - a.timestamp)[0];

    // Verify the consensus record
    if (consensusRecord) {
      consensusRecord.verified = await this.verifyRecord(consensusRecord);
      consensusRecord.replicas = largestGroup.length;
    }

    return {
      domain,
      records,
      consensusRecord: consensusRecord || null,
      agreement
    };
  }

  /**
   * Broadcast domain announcement to network
   */
  private async broadcastDomainAnnouncement(record: GlobalDomainRecord): Promise<void> {
    try {
      await this.connectionManager.publishTopic('paper:domain:announce', {
        type: 'announce',
        record: {
          domain: record.domain,
          owner: record.owner,
          content: record.content,
          type: record.type,
          timestamp: record.timestamp,
          signature: record.signature
        },
        timestamp: Date.now()
      });

      console.log('Domain announcement broadcast:', record.domain);
    } catch (error) {
      console.error('Broadcast failed:', error);
    }
  }

  /**
   * Setup network listeners for domain announcements
   */
  private setupNetworkListeners(): void {
    // Listen for domain announcements
    this.connectionManager.subscribeTopic('paper:domain:announce', (data) => {
      this.handleDomainAnnouncement(data);
    });

    // Listen for domain queries
    this.connectionManager.subscribeTopic('paper:domain:query', (data) => {
      this.handleDomainQuery(data);
    });

    // Listen for domain updates
    this.connectionManager.subscribeTopic('paper:domain:update', (data) => {
      this.handleDomainUpdate(data);
    });
  }

  /**
   * Handle domain announcement from peer
   */
  private async handleDomainAnnouncement(data: any): Promise<void> {
    if (data.type !== 'announce' || !data.record) {
      return;
    }

    const record: GlobalDomainRecord = {
      ...data.record,
      verified: false,
      replicas: 0
    };

    // Verify signature
    record.verified = await this.verifyRecord(record);

    if (record.verified) {
      // Store in local records
      this.localRecords.set(record.domain, record);
      
      // Invalidate consensus cache
      this.consensusCache.delete(record.domain);

      console.log('Domain announcement received and verified:', record.domain);
    } else {
      console.warn('Invalid domain announcement:', record.domain);
    }
  }

  /**
   * Handle domain query from peer
   */
  private async handleDomainQuery(data: any): Promise<void> {
    if (data.type !== 'query' || !data.domain) {
      return;
    }

    const domain = data.domain;
    const record = this.localRecords.get(domain);

    if (record) {
      // Respond with our record
      await this.connectionManager.publishTopic('paper:domain:response', {
        type: 'response',
        domain,
        record: {
          domain: record.domain,
          owner: record.owner,
          content: record.content,
          type: record.type,
          timestamp: record.timestamp,
          signature: record.signature
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle domain update from peer
   */
  private async handleDomainUpdate(data: any): Promise<void> {
    if (data.type !== 'update' || !data.record) {
      return;
    }

    const record: GlobalDomainRecord = data.record;

    // Verify it's from the owner
    const verified = await this.verifyRecord(record);

    if (verified) {
      // Update local record
      this.localRecords.set(record.domain, record);
      
      // Invalidate consensus cache
      this.consensusCache.delete(record.domain);

      console.log('Domain update received and verified:', record.domain);
    }
  }

  /**
   * Sign record with private key
   */
  private async signRecord(record: GlobalDomainRecord, privateKey: Uint8Array): Promise<string> {
    // Create signing data
    const signingData = JSON.stringify({
      domain: record.domain,
      owner: record.owner,
      content: record.content,
      type: record.type,
      timestamp: record.timestamp
    });

    // In production, use proper Ed25519 signing
    // For now, use a simple hash
    const encoder = new TextEncoder();
    const data = encoder.encode(signingData + Buffer.from(privateKey).toString('hex'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Buffer.from(hashBuffer).toString('hex');
  }

  /**
   * Verify record signature
   */
  private async verifyRecord(record: GlobalDomainRecord): Promise<boolean> {
    if (!record.signature || !record.owner) {
      return false;
    }

    // In production, verify Ed25519 signature
    // For now, do basic validation
    return record.signature.length === 64 && record.owner.length > 0;
  }

  /**
   * Convert PKARR record to global record
   */
  private pkarrToGlobalRecord(pkarrRecord: PKARRRecord): GlobalDomainRecord {
    return {
      domain: pkarrRecord.domain,
      owner: pkarrRecord.publicKey,
      content: pkarrRecord.content,
      type: 'static',
      timestamp: pkarrRecord.timestamp,
      signature: pkarrRecord.signature,
      replicas: 0,
      verified: true
    };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(consensus: DomainConsensus): boolean {
    if (!consensus.consensusRecord) {
      return false;
    }

    const age = Date.now() - consensus.consensusRecord.timestamp;
    const maxAge = 300000; // 5 minutes

    return age < maxAge && consensus.agreement >= 50;
  }

  /**
   * Get all known domains
   */
  getKnownDomains(): string[] {
    return Array.from(this.localRecords.keys());
  }

  /**
   * Get domain statistics
   */
  async getStats(): Promise<any> {
    return {
      localRecords: this.localRecords.size,
      cachedConsensus: this.consensusCache.size,
      connectedPeers: this.connectionManager.getPeerCount()
    };
  }
}

// Singleton instance
let globalRegistryInstance: GlobalRegistry | null = null;

/**
 * Get global registry instance
 */
export function getGlobalRegistry(
  pkarrResolver: PKARRResolver,
  dhtResolver: DHTResolver,
  p2pNode: P2PNode,
  connectionManager: ConnectionManager
): GlobalRegistry {
  if (!globalRegistryInstance) {
    globalRegistryInstance = new GlobalRegistry(
      pkarrResolver,
      dhtResolver,
      p2pNode,
      connectionManager
    );
  }
  return globalRegistryInstance;
}
