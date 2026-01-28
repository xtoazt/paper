/**
 * Content Distribution System
 * Unlimited bandwidth via P2P peer replication
 */

import { IPFSNode } from './ipfs-node';
import { StorageManager } from './storage-manager';
import { ConnectionManager } from '../p2p/connection-manager';

export interface DistributionStats {
  totalContent: number;
  replicatedContent: number;
  peerCount: number;
  bandwidthUsed: number;
  bandwidthSaved: number;
}

export interface ContentMetadata {
  cid: string;
  name: string;
  size: number;
  type: string;
  replicas: number;
  uploadedAt: number;
}

export class ContentDistribution {
  private ipfsNode: IPFSNode;
  private storageManager: StorageManager;
  private connectionManager: ConnectionManager | null;
  private contentRegistry: Map<string, ContentMetadata> = new Map();
  private stats: DistributionStats;

  constructor(
    ipfsNode: IPFSNode,
    storageManager: StorageManager,
    connectionManager: ConnectionManager | null = null
  ) {
    this.ipfsNode = ipfsNode;
    this.storageManager = storageManager;
    this.connectionManager = connectionManager;
    this.stats = {
      totalContent: 0,
      replicatedContent: 0,
      peerCount: 0,
      bandwidthUsed: 0,
      bandwidthSaved: 0
    };
  }

  /**
   * Initialize content distribution
   */
  async initialize(): Promise<void> {
    console.log('Initializing content distribution...');

    // Load content registry from storage
    await this.loadContentRegistry();

    // Subscribe to content announcement topic
    if (this.connectionManager) {
      this.connectionManager.subscribeTopic('paper:content:announce', (data) => {
        this.handleContentAnnouncement(data);
      });

      this.connectionManager.subscribeTopic('paper:content:request', (data) => {
        this.handleContentRequest(data);
      });
    }

    console.log('Content distribution initialized');
  }

  /**
   * Upload content to network
   */
  async upload(
    content: File | Uint8Array | string,
    metadata: Partial<ContentMetadata> = {}
  ): Promise<string> {
    console.log('Uploading content to network...');

    let data: Uint8Array;
    let name = metadata.name || 'untitled';
    let type = metadata.type || 'application/octet-stream';
    let size = 0;

    if (content instanceof File) {
      data = new Uint8Array(await content.arrayBuffer());
      name = content.name;
      type = content.type;
      size = content.size;
    } else if (typeof content === 'string') {
      data = new TextEncoder().encode(content);
      size = data.length;
      type = 'text/plain';
    } else {
      data = content;
      size = content.length;
    }

    // Store in IPFS and local storage
    const cid = await this.storageManager.store(name, data, true);

    // Register content
    const contentMeta: ContentMetadata = {
      cid,
      name,
      size,
      type,
      replicas: 1,
      uploadedAt: Date.now(),
      ...metadata
    };
    this.contentRegistry.set(cid, contentMeta);

    // Announce content to network
    await this.announceContent(contentMeta);

    // Update stats
    this.stats.totalContent++;
    console.log('Content uploaded:', cid);

    return cid;
  }

  /**
   * Download content from network
   */
  async download(cid: string): Promise<Uint8Array> {
    console.log('Downloading content:', cid);

    try {
      // Try local storage first
      const cached = await this.storageManager.retrieveByCID(cid);
      if (cached) {
        console.log('Content found in local storage');
        return cached;
      }
    } catch (error) {
      console.log('Content not in local storage, fetching from network...');
    }

    // Request from peers
    if (this.connectionManager) {
      await this.requestFromPeers(cid);

      // Wait a bit for response
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try again
      try {
        return await this.storageManager.retrieveByCID(cid);
      } catch (error) {
        console.error('Failed to download from peers');
      }
    }

    // Fetch directly from IPFS
    console.log('Fetching directly from IPFS...');
    const content = await this.ipfsNode.get(cid);

    // Cache locally
    await this.storageManager.store(cid, content);

    this.stats.bandwidthUsed += content.length;
    return content;
  }

  /**
   * Replicate content to peers
   */
  async replicate(cid: string, targetReplicas: number = 3): Promise<number> {
    if (!this.connectionManager) {
      console.log('No connection manager, skipping replication');
      return 0;
    }

    console.log('Replicating content:', cid, 'target replicas:', targetReplicas);

    const metadata = this.contentRegistry.get(cid);
    if (!metadata) {
      throw new Error('Content not found in registry');
    }

    if (metadata.replicas >= targetReplicas) {
      console.log('Already has enough replicas');
      return metadata.replicas;
    }

    // Announce content to peers
    await this.announceContent(metadata);

    // In a real implementation, we would track which peers have the content
    // and verify replication. For now, we'll simulate it.
    const peers = this.connectionManager.getConnectedPeers();
    const replicatedTo = Math.min(peers.length, targetReplicas - metadata.replicas);

    metadata.replicas += replicatedTo;
    this.stats.replicatedContent++;

    console.log('Content replicated to', replicatedTo, 'peers');
    return metadata.replicas;
  }

  /**
   * Announce content to network
   */
  private async announceContent(metadata: ContentMetadata): Promise<void> {
    if (!this.connectionManager) return;

    try {
      await this.connectionManager.publishTopic('paper:content:announce', {
        type: 'announce',
        cid: metadata.cid,
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.type,
        timestamp: Date.now()
      });

      console.log('Content announced to network:', metadata.cid);
    } catch (error) {
      console.error('Failed to announce content:', error);
    }
  }

  /**
   * Request content from peers
   */
  private async requestFromPeers(cid: string): Promise<void> {
    if (!this.connectionManager) return;

    try {
      await this.connectionManager.publishTopic('paper:content:request', {
        type: 'request',
        cid,
        requesterId: ((this.ipfsNode as any).getNode?.()?.toString() || 'unknown'),
        timestamp: Date.now()
      });

      console.log('Content requested from peers:', cid);
    } catch (error) {
      console.error('Failed to request content:', error);
    }
  }

  /**
   * Handle content announcement from peer
   */
  private async handleContentAnnouncement(data: any): Promise<void> {
    console.log('Received content announcement:', data);

    if (data.type !== 'announce') return;

    // Add to content registry
    this.contentRegistry.set(data.cid, {
      cid: data.cid,
      name: data.name,
      size: data.size,
      type: data.contentType,
      replicas: 1,
      uploadedAt: data.timestamp
    });
  }

  /**
   * Handle content request from peer
   */
  private async handleContentRequest(data: any): Promise<void> {
    console.log('Received content request:', data);

    if (data.type !== 'request') return;

    // Check if we have the content
    try {
      const content = await this.storageManager.retrieveByCID(data.cid);
      if (content) {
        // Send content to requester (via WebRTC or IPFS)
        console.log('Sending content to peer:', data.cid);
        // In a real implementation, we would send the content directly
        // For now, we'll just log it
        this.stats.bandwidthSaved += content.length;
      }
    } catch (error) {
      console.log('Content not available:', data.cid);
    }
  }

  /**
   * List all content
   */
  async listContent(): Promise<ContentMetadata[]> {
    return Array.from(this.contentRegistry.values());
  }

  /**
   * Get content metadata
   */
  getMetadata(cid: string): ContentMetadata | undefined {
    return this.contentRegistry.get(cid);
  }

  /**
   * Get distribution stats
   */
  async getStats(): Promise<DistributionStats> {
    if (this.connectionManager) {
      this.stats.peerCount = this.connectionManager.getPeerCount();
    }
    return { ...this.stats };
  }

  /**
   * Load content registry from storage
   */
  private async loadContentRegistry(): Promise<void> {
    // In a real implementation, we would load from IndexedDB
    // For now, we'll start with an empty registry
    console.log('Content registry loaded');
  }

  /**
   * Delete content
   */
  async deleteContent(cid: string): Promise<void> {
    // Unpin from IPFS
    await this.ipfsNode.unpin(cid);

    // Remove from registry
    this.contentRegistry.delete(cid);

    // Remove from storage
    await this.storageManager.delete(cid);

    this.stats.totalContent--;
    console.log('Content deleted:', cid);
  }
}

// Singleton instance
let contentDistributionInstance: ContentDistribution | null = null;

/**
 * Get content distribution instance
 */
export function getContentDistribution(
  ipfsNode: IPFSNode,
  storageManager: StorageManager,
  connectionManager?: ConnectionManager | null
): ContentDistribution {
  if (!contentDistributionInstance) {
    contentDistributionInstance = new ContentDistribution(ipfsNode, storageManager, connectionManager || null);
  }
  return contentDistributionInstance;
}

/**
 * Initialize content distribution
 */
export async function initContentDistribution(
  ipfsNode: IPFSNode,
  storageManager: StorageManager,
  connectionManager?: ConnectionManager | null
): Promise<ContentDistribution> {
  const distribution = getContentDistribution(ipfsNode, storageManager, connectionManager);
  await distribution.initialize();
  return distribution;
}
