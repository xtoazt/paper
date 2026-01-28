/**
 * P2P Gateway
 * Routes requests through WebRTC tunnels, DHT, and IPFS
 */

import { DHTResolver } from './domains/dht-resolver';
import { TunnelManager } from './tunneling/tunnel-manager';
import { IPFSNode } from './storage/ipfs-node';
import { StorageManager } from './storage/storage-manager';
import { ContentDistribution } from './storage/content-distribution';

export interface GatewayRequest {
  domain: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: Uint8Array | string;
  fromCache: boolean;
}

export interface GatewayStats {
  totalRequests: number;
  cachedRequests: number;
  tunnelRequests: number;
  ipfsRequests: number;
  failedRequests: number;
  averageLatency: number;
}

export class P2PGateway {
  private dhtResolver: DHTResolver;
  private tunnelManager: TunnelManager | null;
  private ipfsNode: IPFSNode;
  private storageManager: StorageManager;
  private contentDistribution: ContentDistribution;
  private stats: GatewayStats;
  private latencies: number[] = [];

  constructor(
    dhtResolver: DHTResolver,
    ipfsNode: IPFSNode,
    storageManager: StorageManager,
    contentDistribution: ContentDistribution,
    tunnelManager: TunnelManager | null = null
  ) {
    this.dhtResolver = dhtResolver;
    this.tunnelManager = tunnelManager;
    this.ipfsNode = ipfsNode;
    this.storageManager = storageManager;
    this.contentDistribution = contentDistribution;
    this.stats = {
      totalRequests: 0,
      cachedRequests: 0,
      tunnelRequests: 0,
      ipfsRequests: 0,
      failedRequests: 0,
      averageLatency: 0
    };
  }

  /**
   * Handle gateway request
   */
  async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    console.log('P2P Gateway request:', request.domain, request.path);

    try {
      // 1. Resolve domain via DHT
      const domainRecord = await this.dhtResolver.resolve(request.domain);
      
      if (!domainRecord) {
        console.error('Domain not found:', request.domain);
        this.stats.failedRequests++;
        return this.createErrorResponse(404, 'Domain not found');
      }

      console.log('Domain resolved:', domainRecord);

      // 2. Try to get content from local storage/cache first
      const cacheKey = `${request.domain}${request.path}`;
      const cached = await this.storageManager.retrieve(cacheKey);

      if (cached) {
        console.log('Content found in cache');
        this.stats.cachedRequests++;
        this.recordLatency(Date.now() - startTime);

        return {
          status: 200,
          headers: { 'Content-Type': this.guessContentType(request.path) },
          body: cached,
          fromCache: true
        };
      }

      // 3. Fetch content from IPFS
      if (domainRecord.cid) {
        console.log('Fetching from IPFS:', domainRecord.cid);
        const content = await this.fetchFromIPFS(domainRecord.cid, request.path);

        if (content) {
          // Cache the content
          await this.storageManager.store(cacheKey, content);

          this.stats.ipfsRequests++;
          this.recordLatency(Date.now() - startTime);

          return {
            status: 200,
            headers: { 'Content-Type': this.guessContentType(request.path) },
            body: content,
            fromCache: false
          };
        }
      }

      // 4. Try routing through tunnels if available
      if (this.tunnelManager && domainRecord.addresses) {
        console.log('Routing through tunnel');
        const content = await this.fetchThroughTunnel(domainRecord, request);

        if (content) {
          // Cache the content
          await this.storageManager.store(cacheKey, content);

          this.stats.tunnelRequests++;
          this.recordLatency(Date.now() - startTime);

          return {
            status: 200,
            headers: { 'Content-Type': this.guessContentType(request.path) },
            body: content,
            fromCache: false
          };
        }
      }

      // 5. Content not found
      console.error('Content not found');
      this.stats.failedRequests++;
      return this.createErrorResponse(404, 'Content not found');

    } catch (error) {
      console.error('Gateway request failed:', error);
      this.stats.failedRequests++;
      return this.createErrorResponse(500, 'Internal gateway error');
    }
  }

  /**
   * Fetch content from IPFS
   */
  private async fetchFromIPFS(cid: string, path: string): Promise<Uint8Array | null> {
    try {
      // If path is provided, construct full IPFS path
      const ipfsPath = path && path !== '/' ? `${cid}${path}` : cid;
      
      const content = await this.ipfsNode.get(ipfsPath);
      console.log('Content fetched from IPFS:', ipfsPath);
      return content;
    } catch (error) {
      console.error('IPFS fetch failed:', error);
      return null;
    }
  }

  /**
   * Fetch content through tunnel
   */
  private async fetchThroughTunnel(domainRecord: any, request: GatewayRequest): Promise<Uint8Array | null> {
    if (!this.tunnelManager) {
      return null;
    }

    try {
      // Create tunnel request
      const tunnelRequest = {
        type: 'content_request',
        domain: request.domain,
        path: request.path,
        cid: domainRecord.cid
      };

      // Send through tunnel
      await this.tunnelManager.sendThroughTunnel(JSON.stringify(tunnelRequest));

      // In a real implementation, we would wait for response
      // For now, return null as tunnel response handling would be async
      return null;
    } catch (error) {
      console.error('Tunnel fetch failed:', error);
      return null;
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(status: number, message: string): GatewayResponse {
    return {
      status,
      headers: { 'Content-Type': 'text/plain' },
      body: message,
      fromCache: false
    };
  }

  /**
   * Guess content type from path
   */
  private guessContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();

    const types: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'wasm': 'application/wasm'
    };

    return types[ext || ''] || 'application/octet-stream';
  }

  /**
   * Record latency for stats
   */
  private recordLatency(latency: number): void {
    this.latencies.push(latency);
    
    // Keep only last 100 latencies
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }

    // Calculate average
    this.stats.averageLatency = 
      this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  /**
   * Get gateway statistics
   */
  getStats(): GatewayStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cachedRequests: 0,
      tunnelRequests: 0,
      ipfsRequests: 0,
      failedRequests: 0,
      averageLatency: 0
    };
    this.latencies = [];
  }

  /**
   * Prefetch content for domain
   */
  async prefetch(domain: string): Promise<boolean> {
    try {
      const domainRecord = await this.dhtResolver.resolve(domain);
      
      if (!domainRecord || !domainRecord.cid) {
        return false;
      }

      // Fetch and cache root content
      const content = await this.fetchFromIPFS(domainRecord.cid, '/');
      
      if (content) {
        await this.storageManager.store(`${domain}/`, content);
        console.log('Content prefetched for domain:', domain);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Prefetch failed:', error);
      return false;
    }
  }

  /**
   * Batch prefetch multiple domains
   */
  async prefetchBatch(domains: string[]): Promise<void> {
    console.log('Prefetching', domains.length, 'domains');

    await Promise.all(
      domains.map(domain => this.prefetch(domain))
    );

    console.log('Prefetch batch complete');
  }
}

// Singleton instance
let p2pGatewayInstance: P2PGateway | null = null;

/**
 * Get P2P gateway instance
 */
export function getP2PGateway(
  dhtResolver: DHTResolver,
  ipfsNode: IPFSNode,
  storageManager: StorageManager,
  contentDistribution: ContentDistribution,
  tunnelManager?: TunnelManager | null
): P2PGateway {
  if (!p2pGatewayInstance) {
    p2pGatewayInstance = new P2PGateway(
      dhtResolver,
      ipfsNode,
      storageManager,
      contentDistribution,
      tunnelManager || null
    );
  }
  return p2pGatewayInstance;
}
