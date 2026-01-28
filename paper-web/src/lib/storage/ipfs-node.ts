/**
 * IPFS Node Implementation
 * Browser-based IPFS node for distributed storage
 */

import * as IPFS from 'ipfs-core';
import type { IPFS as IPFSType } from 'ipfs-core';
import { CID } from 'multiformats/cid';

export interface IPFSConfig {
  enableGateway?: boolean;
  enableAPI?: boolean;
  repo?: string;
}

export class IPFSNode {
  private node: IPFSType | null = null;
  private config: IPFSConfig;
  private isStarted = false;

  constructor(config: IPFSConfig = {}) {
    this.config = {
      enableGateway: false,
      enableAPI: false,
      repo: 'paper-ipfs',
      ...config
    };
  }

  /**
   * Start the IPFS node
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.log('IPFS node already started');
      return;
    }

    console.log('Starting IPFS node...');

    try {
      this.node = await IPFS.create({
        repo: this.config.repo,
        config: {
          Addresses: {
            Swarm: [
              '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
              '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
            ],
            API: '',
            Gateway: ''
          },
          Bootstrap: [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
          ]
        },
        libp2p: {
          config: {
            dht: {
              enabled: true
            }
          }
        }
      });

      this.isStarted = true;
      console.log('IPFS node started successfully');

      const id = await this.node.id();
      console.log('IPFS Peer ID:', id.id.toString());
    } catch (error) {
      console.error('Failed to start IPFS node:', error);
      throw error;
    }
  }

  /**
   * Stop the IPFS node
   */
  async stop(): Promise<void> {
    if (!this.node || !this.isStarted) {
      return;
    }

    console.log('Stopping IPFS node...');
    await this.node.stop();
    this.isStarted = false;
    this.node = null;
    console.log('IPFS node stopped');
  }

  /**
   * Add content to IPFS
   */
  async add(content: string | Uint8Array): Promise<string> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const result = await this.node.add(content);
      const cid = result.cid.toString();
      console.log('Content added to IPFS:', cid);
      return cid;
    } catch (error) {
      console.error('Failed to add content to IPFS:', error);
      throw error;
    }
  }

  /**
   * Add file to IPFS
   */
  async addFile(file: File): Promise<string> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      const result = await this.node.add({
        path: file.name,
        content
      });
      const cid = result.cid.toString();
      console.log('File added to IPFS:', file.name, cid);
      return cid;
    } catch (error) {
      console.error('Failed to add file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get content from IPFS
   */
  async get(cid: string): Promise<Uint8Array> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.node.cat(cid)) {
        chunks.push(chunk);
      }

      // Concatenate all chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('Content retrieved from IPFS:', cid);
      return result;
    } catch (error) {
      console.error('Failed to get content from IPFS:', error);
      throw error;
    }
  }

  /**
   * Pin content to keep it available
   */
  async pin(cid: string): Promise<void> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      await this.node.pin.add(CID.parse(cid));
      console.log('Content pinned:', cid);
    } catch (error) {
      console.error('Failed to pin content:', error);
      throw error;
    }
  }

  /**
   * Unpin content
   */
  async unpin(cid: string): Promise<void> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      await this.node.pin.rm(CID.parse(cid));
      console.log('Content unpinned:', cid);
    } catch (error) {
      console.error('Failed to unpin content:', error);
      throw error;
    }
  }

  /**
   * List all pinned content
   */
  async listPins(): Promise<string[]> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const pins: string[] = [];
      for await (const { cid } of this.node.pin.ls()) {
        pins.push(cid.toString());
      }
      return pins;
    } catch (error) {
      console.error('Failed to list pins:', error);
      throw error;
    }
  }

  /**
   * Get IPFS node stats
   */
  async getStats(): Promise<any> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const [id, version, repo] = await Promise.all([
        this.node.id(),
        this.node.version(),
        this.node.repo.stat()
      ]);

      return {
        peerId: id.id.toString(),
        version: version.version,
        repoSize: repo.repoSize,
        storageMax: repo.storageMax,
        numObjects: repo.numObjects
      };
    } catch (error) {
      console.error('Failed to get IPFS stats:', error);
      throw error;
    }
  }

  /**
   * Get connected peers
   */
  async getPeers(): Promise<string[]> {
    if (!this.node) {
      throw new Error('IPFS node not started');
    }

    try {
      const peers = await this.node.swarm.peers();
      return peers.map(peer => peer.peer.toString());
    } catch (error) {
      console.error('Failed to get peers:', error);
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
    return this.isStarted && this.node !== null;
  }

  /**
   * Get the IPFS node instance
   */
  getNode(): IPFSType | null {
    return this.node;
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
