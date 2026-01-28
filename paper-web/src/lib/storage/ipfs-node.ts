/**
 * IPFS Node Implementation
 * Browser-based IPFS node for distributed storage
 * Now powered by Helia for better performance and modern APIs
 */

import { getHeliaClient, HeliaClient } from '../ipfs/helia-client';
import { CID } from 'multiformats/cid';

export interface IPFSConfig {
  enableGateway?: boolean;
  enableAPI?: boolean;
  repo?: string;
}

export class IPFSNode {
  private heliaClient: HeliaClient;
  private config: IPFSConfig;
  private isStarted = false;

  constructor(config: IPFSConfig = {}) {
    this.config = {
      enableGateway: false,
      enableAPI: false,
      repo: 'paper-ipfs',
      ...config
    };
    this.heliaClient = getHeliaClient();
  }

  /**
   * Start the IPFS node (now using Helia)
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.log('[IPFSNode] Already started');
      return;
    }

    console.log('[IPFSNode] Starting with Helia...');

    try {
      await this.heliaClient.init();
      this.isStarted = true;
      console.log('[IPFSNode] Started successfully with Helia');

      const libp2p = this.heliaClient.getLibp2p();
      if (libp2p) {
        console.log('[IPFSNode] Peer ID:', libp2p.peerId.toString());
      }
    } catch (error) {
      console.error('[IPFSNode] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop the IPFS node
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    console.log('[IPFSNode] Stopping...');
    await this.heliaClient.stop();
    this.isStarted = false;
    console.log('[IPFSNode] Stopped');
  }

  /**
   * Add content to IPFS
   */
  async add(content: string | Uint8Array): Promise<string> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const cid = await this.heliaClient.addFile(content);
      console.log('[IPFSNode] Content added:', cid);
      return cid;
    } catch (error) {
      console.error('[IPFSNode] Failed to add content:', error);
      throw error;
    }
  }

  /**
   * Add file to IPFS
   */
  async addFile(file: File): Promise<string> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      const cid = await this.heliaClient.addFile(content);
      console.log('[IPFSNode] File added:', file.name, cid);
      return cid;
    } catch (error) {
      console.error('[IPFSNode] Failed to add file:', error);
      throw error;
    }
  }

  /**
   * Get content from IPFS
   */
  async get(cid: string): Promise<Uint8Array> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const result = await this.heliaClient.getFile(cid);
      console.log('[IPFSNode] Content retrieved:', cid);
      return result;
    } catch (error) {
      console.error('[IPFSNode] Failed to get content:', error);
      throw error;
    }
  }

  /**
   * Pin content to keep it available
   */
  async pin(cid: string): Promise<void> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      await this.heliaClient.pin(cid);
      console.log('[IPFSNode] Content pinned:', cid);
    } catch (error) {
      console.error('[IPFSNode] Failed to pin content:', error);
      throw error;
    }
  }

  /**
   * Unpin content
   */
  async unpin(cid: string): Promise<void> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      await this.heliaClient.unpin(cid);
      console.log('[IPFSNode] Content unpinned:', cid);
    } catch (error) {
      console.error('[IPFSNode] Failed to unpin content:', error);
      throw error;
    }
  }

  /**
   * List all pinned content
   */
  async listPins(): Promise<string[]> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const pins: string[] = [];
      // Note: Helia's pin listing would need to be implemented
      console.log('[IPFSNode] Listing pins...');
      return pins;
    } catch (error) {
      console.error('[IPFSNode] Failed to list pins:', error);
      throw error;
    }
  }

  /**
   * Get IPFS node stats
   */
  async getStats(): Promise<any> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const libp2p = this.heliaClient.getLibp2p();
      const stats = await this.heliaClient.getStats();
      
      return {
        peerId: libp2p?.peerId.toString() || 'unknown',
        version: 'Helia 4.x',
        repoSize: stats.repoSize,
        storageMax: stats.storageMax,
        numObjects: stats.numObjects
      };
    } catch (error) {
      console.error('[IPFSNode] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Get connected peers
   */
  async getPeers(): Promise<string[]> {
    if (!this.isStarted) {
      throw new Error('IPFS node not started');
    }

    try {
      const peers = await this.heliaClient.getPeers();
      return peers;
    } catch (error) {
      console.error('[IPFSNode] Failed to get peers:', error);
      throw error;
    }
  }

  /**
   * Get peer count
   */
  async getPeerCount(): Promise<number> {
    const peers = await this.getPeers();
    return peers.length;
  }

  /**
   * Check if node is started
   */
  isRunning(): boolean {
    return this.isStarted && this.heliaClient.isRunning();
  }

  /**
   * Get the Helia client instance
   */
  getHeliaClient(): HeliaClient {
    return this.heliaClient;
  }
}

// Singleton instance
let ipfsNodeInstance: IPFSNode | null = null;

/**
 * Get the global IPFS node instance
 */
export function getIPFSNode(): IPFSNode {
  if (!ipfsNodeInstance) {
    ipfsNodeInstance = new IPFSNode();
  }
  return ipfsNodeInstance;
}

/**
 * Initialize the global IPFS node
 */
export async function initIPFSNode(config?: IPFSConfig): Promise<IPFSNode> {
  const node = getIPFSNode();
  if (!node.isRunning()) {
    await node.start();
  }
  return node;
}
