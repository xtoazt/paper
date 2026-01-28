/**
 * Real Helia IPFS Client
 * Browser-native IPFS implementation using Helia
 */

import { createHelia, Helia } from 'helia';
import { unixfs, UnixFS } from '@helia/unixfs';
import { strings } from '@helia/strings';
import { json } from '@helia/json';
import { CID } from 'multiformats/cid';
import type { Libp2p } from 'libp2p';

export interface HeliaClientConfig {
  enableGC?: boolean;
  gcInterval?: number;
  blockstore?: any;
  datastore?: any;
}

export class HeliaClient {
  private helia: Helia | null = null;
  private unixfs: UnixFS | null = null;
  private strings: any = null;
  private json: any = null;
  private initPromise: Promise<void> | null = null;
  private config: HeliaClientConfig;

  constructor(config: HeliaClientConfig = {}) {
    this.config = {
      enableGC: true,
      gcInterval: 60000, // 1 minute
      ...config
    };
  }

  /**
   * Initialize Helia node
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.helia) {
      return;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      console.log('[Helia] Initializing IPFS node...');

      // Create Helia instance
      this.helia = await createHelia({
        blockstore: this.config.blockstore,
        datastore: this.config.datastore,
        // libp2p will be configured separately
      });

      // Initialize filesystem interface
      this.unixfs = unixfs(this.helia);
      this.strings = strings(this.helia);
      this.json = json(this.helia);

      console.log('[Helia] IPFS node initialized successfully');
      console.log('[Helia] Peer ID:', this.helia.libp2p.peerId.toString());

      // Start garbage collection if enabled
      if (this.config.enableGC) {
        this.startGarbageCollection();
      }
    } catch (error) {
      console.error('[Helia] Failed to initialize:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Add file to IPFS
   */
  async addFile(content: Uint8Array | string): Promise<string> {
    await this.init();
    if (!this.unixfs) throw new Error('UnixFS not initialized');

    try {
      const data = typeof content === 'string' 
        ? new TextEncoder().encode(content)
        : content;

      const cid = await this.unixfs.addBytes(data);
      console.log('[Helia] File added:', cid.toString());
      return cid.toString();
    } catch (error) {
      console.error('[Helia] Failed to add file:', error);
      throw error;
    }
  }

  /**
   * Add directory to IPFS
   */
  async addDirectory(files: { path: string; content: Uint8Array }[]): Promise<string> {
    await this.init();
    if (!this.unixfs) throw new Error('UnixFS not initialized');

    try {
      // Create directory structure
      let rootCid: CID | null = null;

      for (const file of files) {
        const data = file.content;
        const cid = await this.unixfs.addBytes(data);
        
        // Store with path metadata
        // Note: Full directory support requires additional implementation
        rootCid = cid;
      }

      if (!rootCid) throw new Error('No files added');
      
      console.log('[Helia] Directory added:', rootCid.toString());
      return rootCid.toString();
    } catch (error) {
      console.error('[Helia] Failed to add directory:', error);
      throw error;
    }
  }

  /**
   * Get file from IPFS
   */
  async getFile(cidString: string): Promise<Uint8Array> {
    await this.init();
    if (!this.unixfs) throw new Error('UnixFS not initialized');

    try {
      const cid = CID.parse(cidString);
      const chunks: Uint8Array[] = [];

      for await (const chunk of this.unixfs.cat(cid)) {
        chunks.push(chunk);
      }

      // Concatenate chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('[Helia] File retrieved:', cidString);
      return result;
    } catch (error) {
      console.error('[Helia] Failed to get file:', error);
      throw error;
    }
  }

  /**
   * Get file as string
   */
  async getFileAsString(cidString: string): Promise<string> {
    const data = await this.getFile(cidString);
    return new TextDecoder().decode(data);
  }

  /**
   * Add string to IPFS
   */
  async addString(content: string): Promise<string> {
    await this.init();
    if (!this.strings) throw new Error('Strings interface not initialized');

    try {
      const cid = await this.strings.add(content);
      console.log('[Helia] String added:', cid.toString());
      return cid.toString();
    } catch (error) {
      console.error('[Helia] Failed to add string:', error);
      throw error;
    }
  }

  /**
   * Get string from IPFS
   */
  async getString(cidString: string): Promise<string> {
    await this.init();
    if (!this.strings) throw new Error('Strings interface not initialized');

    try {
      const cid = CID.parse(cidString);
      const content = await this.strings.get(cid);
      console.log('[Helia] String retrieved:', cidString);
      return content;
    } catch (error) {
      console.error('[Helia] Failed to get string:', error);
      throw error;
    }
  }

  /**
   * Add JSON to IPFS
   */
  async addJSON(data: any): Promise<string> {
    await this.init();
    if (!this.json) throw new Error('JSON interface not initialized');

    try {
      const cid = await this.json.add(data);
      console.log('[Helia] JSON added:', cid.toString());
      return cid.toString();
    } catch (error) {
      console.error('[Helia] Failed to add JSON:', error);
      throw error;
    }
  }

  /**
   * Get JSON from IPFS
   */
  async getJSON(cidString: string): Promise<any> {
    await this.init();
    if (!this.json) throw new Error('JSON interface not initialized');

    try {
      const cid = CID.parse(cidString);
      const data = await this.json.get(cid);
      console.log('[Helia] JSON retrieved:', cidString);
      return data;
    } catch (error) {
      console.error('[Helia] Failed to get JSON:', error);
      throw error;
    }
  }

  /**
   * Pin content to prevent garbage collection
   */
  async pin(cidString: string): Promise<void> {
    await this.init();
    if (!this.helia) throw new Error('Helia not initialized');

    try {
      const cid = CID.parse(cidString);
      await this.helia.pins.add(cid);
      console.log('[Helia] Content pinned:', cidString);
    } catch (error) {
      console.error('[Helia] Failed to pin:', error);
      throw error;
    }
  }

  /**
   * Unpin content
   */
  async unpin(cidString: string): Promise<void> {
    await this.init();
    if (!this.helia) throw new Error('Helia not initialized');

    try {
      const cid = CID.parse(cidString);
      await this.helia.pins.rm(cid);
      console.log('[Helia] Content unpinned:', cidString);
    } catch (error) {
      console.error('[Helia] Failed to unpin:', error);
      throw error;
    }
  }

  /**
   * Check if content is pinned
   */
  async isPinned(cidString: string): Promise<boolean> {
    await this.init();
    if (!this.helia) throw new Error('Helia not initialized');

    try {
      const cid = CID.parse(cidString);
      for await (const pinnedCid of this.helia.pins.ls()) {
        if (pinnedCid.equals(cid)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[Helia] Failed to check pin status:', error);
      return false;
    }
  }

  /**
   * Get repository stats
   */
  async getStats(): Promise<{
    repoSize: number;
    storageMax: number;
    numObjects: number;
  }> {
    await this.init();
    if (!this.helia) throw new Error('Helia not initialized');

    try {
      // Note: Helia doesn't have direct stats API like js-ipfs
      // This is a simplified version
      let numObjects = 0;
      for await (const _ of this.helia.pins.ls()) {
        numObjects++;
      }

      return {
        repoSize: 0, // Would need to calculate from blockstore
        storageMax: 10 * 1024 * 1024 * 1024, // 10GB default
        numObjects
      };
    } catch (error) {
      console.error('[Helia] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Get connected peers
   */
  async getPeers(): Promise<string[]> {
    await this.init();
    if (!this.helia) throw new Error('Helia not initialized');

    try {
      const peers = this.helia.libp2p.getPeers();
      return peers.map(peer => peer.toString());
    } catch (error) {
      console.error('[Helia] Failed to get peers:', error);
      return [];
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
   * Start garbage collection
   */
  private startGarbageCollection(): void {
    if (!this.config.enableGC || !this.config.gcInterval) return;

    setInterval(async () => {
      try {
        if (!this.helia) return;
        
        console.log('[Helia] Running garbage collection...');
        await this.helia.gc();
        console.log('[Helia] Garbage collection completed');
      } catch (error) {
        console.error('[Helia] Garbage collection failed:', error);
      }
    }, this.config.gcInterval);
  }

  /**
   * Stop Helia node
   */
  async stop(): Promise<void> {
    if (!this.helia) return;

    try {
      console.log('[Helia] Stopping IPFS node...');
      await this.helia.stop();
      this.helia = null;
      this.unixfs = null;
      this.strings = null;
      this.json = null;
      this.initPromise = null;
      console.log('[Helia] IPFS node stopped');
    } catch (error) {
      console.error('[Helia] Failed to stop:', error);
      throw error;
    }
  }

  /**
   * Get libp2p instance
   */
  getLibp2p(): Libp2p | null {
    return this.helia?.libp2p || null;
  }

  /**
   * Check if node is running
   */
  isRunning(): boolean {
    return this.helia !== null;
  }
}

// Singleton instance
let heliaClientInstance: HeliaClient | null = null;

/**
 * Get singleton Helia client instance
 */
export function getHeliaClient(): HeliaClient {
  if (!heliaClientInstance) {
    heliaClientInstance = new HeliaClient();
  }
  return heliaClientInstance;
}

/**
 * Initialize Helia client
 */
export async function initHeliaClient(config?: HeliaClientConfig): Promise<HeliaClient> {
  if (!heliaClientInstance) {
    heliaClientInstance = new HeliaClient(config);
  }
  await heliaClientInstance.init();
  return heliaClientInstance;
}
