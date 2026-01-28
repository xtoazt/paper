/**
 * Bootstrap Discovery
 * Discovers new bootstrap sources via P2P and DNS
 */

import { addCustomSource, type BootstrapSource } from './bootstrap-sources';
import { ConnectionManager } from '../p2p/connection-manager';

export interface DiscoveredSource extends BootstrapSource {
  discoveredAt: number;
  discoveredFrom: string;
  verified: boolean;
}

export class BootstrapDiscovery {
  private connectionManager: ConnectionManager | null;
  private discoveredSources: Map<string, DiscoveredSource> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;
  private isDiscovering = false;

  constructor(connectionManager: ConnectionManager | null = null) {
    this.connectionManager = connectionManager;
  }

  /**
   * Start discovery process
   */
  start(intervalMs: number = 300000): void {
    if (this.isDiscovering) {
      console.log('Bootstrap discovery already running');
      return;
    }

    console.log('Starting bootstrap discovery...');
    this.isDiscovering = true;

    // Initial discovery
    this.discover();

    // Periodic discovery
    this.discoveryInterval = setInterval(() => {
      this.discover();
    }, intervalMs);
  }

  /**
   * Stop discovery process
   */
  stop(): void {
    if (!this.isDiscovering) {
      return;
    }

    console.log('Stopping bootstrap discovery...');
    
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    this.isDiscovering = false;
  }

  /**
   * Discover new bootstrap sources
   */
  private async discover(): Promise<void> {
    console.log('Discovering bootstrap sources...');

    try {
      // Discover via P2P
      if (this.connectionManager) {
        await this.discoverViaP2P();
      }

      // Discover via DNS TXT records
      await this.discoverViaDNS();

      // Share discovered sources with peers
      if (this.connectionManager) {
        await this.shareDiscoveredSources();
      }

      console.log('Bootstrap discovery complete. Found:', this.discoveredSources.size, 'sources');
    } catch (error) {
      console.error('Bootstrap discovery error:', error);
    }
  }

  /**
   * Discover bootstrap sources via P2P
   */
  private async discoverViaP2P(): Promise<void> {
    if (!this.connectionManager) {
      return;
    }

    console.log('Discovering via P2P...');

    try {
      // Subscribe to bootstrap announcement topic
      this.connectionManager.subscribeTopic('paper:bootstrap:announce', (data) => {
        this.handleBootstrapAnnouncement(data);
      });

      // Request bootstrap sources from peers
      await this.connectionManager.publishTopic('paper:bootstrap:request', {
        type: 'request',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('P2P discovery error:', error);
    }
  }

  /**
   * Discover bootstrap sources via DNS TXT records
   */
  private async discoverViaDNS(): Promise<void> {
    console.log('Discovering via DNS...');

    // DNS TXT record format: paper-bootstrap=https://paper.example.com:100
    // Priority is appended after colon

    const dnsRecords = [
      '_paper._tcp.paper.network',
      '_paper._tcp.paper.is-a.software'
    ];

    for (const record of dnsRecords) {
      try {
        // In a real implementation, we would query DNS TXT records
        // For now, we'll skip as browser APIs don't support DNS queries
        console.log('DNS discovery for:', record, '(not implemented in browser)');
      } catch (error) {
        console.error('DNS discovery error for', record, error);
      }
    }
  }

  /**
   * Handle bootstrap announcement from peer
   */
  private handleBootstrapAnnouncement(data: any): void {
    console.log('Received bootstrap announcement:', data);

    if (data.type !== 'announce' || !data.source) {
      return;
    }

    const source: BootstrapSource = data.source;

    // Validate source
    if (!this.validateSource(source)) {
      console.warn('Invalid bootstrap source:', source);
      return;
    }

    // Add to discovered sources
    const discovered: DiscoveredSource = {
      ...source,
      discoveredAt: Date.now(),
      discoveredFrom: data.peerId || 'unknown',
      verified: false
    };

    this.discoveredSources.set(source.id, discovered);

    // Verify source asynchronously
    this.verifySource(discovered);
  }

  /**
   * Validate bootstrap source
   */
  private validateSource(source: BootstrapSource): boolean {
    // Basic validation
    if (!source.id || !source.type || !source.url) {
      return false;
    }

    // Check URL format
    try {
      new URL(source.url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify bootstrap source by attempting to fetch from it
   */
  private async verifySource(source: DiscoveredSource): Promise<void> {
    console.log('Verifying bootstrap source:', source.id);

    try {
      // Try to fetch Service Worker from source
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const url = source.type === 'domain' 
        ? `${source.url}/sw.js`
        : source.url;

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'no-cors',
        cache: 'no-cache'
      });

      clearTimeout(timeout);

      // Mark as verified
      source.verified = true;

      // Add to global bootstrap sources if verified
      addCustomSource(source);

      console.log('Bootstrap source verified:', source.id);
    } catch (error) {
      console.error('Source verification failed:', source.id, error);
      source.verified = false;
    }
  }

  /**
   * Share discovered sources with peers
   */
  private async shareDiscoveredSources(): Promise<void> {
    if (!this.connectionManager) {
      return;
    }

    const verified = Array.from(this.discoveredSources.values())
      .filter(s => s.verified);

    if (verified.length === 0) {
      return;
    }

    console.log('Sharing', verified.length, 'verified bootstrap sources with peers');

    for (const source of verified) {
      await this.connectionManager.publishTopic('paper:bootstrap:announce', {
        type: 'announce',
        source: {
          id: source.id,
          type: source.type,
          url: source.url,
          priority: source.priority,
          timeout: source.timeout,
          enabled: source.enabled
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get discovered sources
   */
  getDiscoveredSources(): DiscoveredSource[] {
    return Array.from(this.discoveredSources.values());
  }

  /**
   * Get verified sources
   */
  getVerifiedSources(): DiscoveredSource[] {
    return Array.from(this.discoveredSources.values())
      .filter(s => s.verified);
  }

  /**
   * Get discovery stats
   */
  getStats(): any {
    const discovered = Array.from(this.discoveredSources.values());
    
    return {
      total: discovered.length,
      verified: discovered.filter(s => s.verified).length,
      unverified: discovered.filter(s => !s.verified).length,
      isDiscovering: this.isDiscovering
    };
  }

  /**
   * Clear discovered sources
   */
  clearDiscovered(): void {
    this.discoveredSources.clear();
    console.log('Discovered sources cleared');
  }
}

// Singleton instance
let bootstrapDiscoveryInstance: BootstrapDiscovery | null = null;

/**
 * Get bootstrap discovery instance
 */
export function getBootstrapDiscovery(
  connectionManager?: ConnectionManager | null
): BootstrapDiscovery {
  if (!bootstrapDiscoveryInstance) {
    bootstrapDiscoveryInstance = new BootstrapDiscovery(connectionManager || null);
  }
  return bootstrapDiscoveryInstance;
}
