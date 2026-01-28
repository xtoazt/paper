/**
 * Storage Manager
 * Manages hybrid storage (IPFS + IndexedDB) with caching
 */

import { IPFSNode } from './ipfs-node';

export interface StorageEntry {
  cid: string;
  key: string;
  size: number;
  timestamp: number;
  pinned: boolean;
}

export interface CacheConfig {
  maxSize?: number; // Maximum cache size in bytes
  maxAge?: number; // Maximum age in milliseconds
  enableAutoCleanup?: boolean;
}

export class StorageManager {
  private ipfsNode: IPFSNode;
  private dbName = 'paper-storage';
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private cacheSize = 0;

  constructor(ipfsNode: IPFSNode, config: CacheConfig = {}) {
    this.ipfsNode = ipfsNode;
    this.config = {
      maxSize: 500 * 1024 * 1024, // 500MB default
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
      enableAutoCleanup: true,
      ...config
    };
  }

  /**
   * Initialize storage manager
   */
  async initialize(): Promise<void> {
    console.log('Initializing storage manager...');

    // Open IndexedDB
    await this.openDatabase();

    // Start IPFS node if not running
    if (!this.ipfsNode.isRunning()) {
      await this.ipfsNode.start();
    }

    // Calculate current cache size
    await this.calculateCacheSize();

    // Start auto cleanup if enabled
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    console.log('Storage manager initialized');
  }

  /**
   * Open IndexedDB database
   */
  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('content')) {
          const contentStore = db.createObjectStore('content', { keyPath: 'key' });
          contentStore.createIndex('cid', 'cid', { unique: false });
          contentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store content (IPFS + local cache)
   */
  async store(key: string, content: string | Uint8Array, pin: boolean = false): Promise<string> {
    if (!this.db) {
      throw new Error('Storage manager not initialized');
    }

    // Add to IPFS
    const cid = await this.ipfsNode.add(content);

    // Pin if requested
    if (pin) {
      await this.ipfsNode.pin(cid);
    }

    // Store in local cache
    const data = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    await this.cacheStore(key, cid, data, pin);

    console.log('Content stored:', key, cid);
    return cid;
  }

  /**
   * Retrieve content (cache first, then IPFS)
   */
  async retrieve(key: string): Promise<Uint8Array | null> {
    if (!this.db) {
      throw new Error('Storage manager not initialized');
    }

    // Try cache first
    const cached = await this.cacheGet(key);
    if (cached) {
      console.log('Content retrieved from cache:', key);
      return cached.content;
    }

    // Get CID from metadata
    const metadata = await this.getMetadata(key);
    if (!metadata) {
      console.log('Content not found:', key);
      return null;
    }

    // Fetch from IPFS
    console.log('Content not in cache, fetching from IPFS:', key);
    const content = await this.ipfsNode.get(metadata.cid);

    // Cache the result
    await this.cacheStore(key, metadata.cid, content, metadata.pinned);

    return content;
  }

  /**
   * Retrieve by CID
   */
  async retrieveByCID(cid: string): Promise<Uint8Array> {
    return await this.ipfsNode.get(cid);
  }

  /**
   * Delete content
   */
  async delete(key: string): Promise<void> {
    if (!this.db) {
      throw new Error('Storage manager not initialized');
    }

    const metadata = await this.getMetadata(key);
    if (metadata && metadata.pinned) {
      await this.ipfsNode.unpin(metadata.cid);
    }

    await this.cacheDelete(key);
    console.log('Content deleted:', key);
  }

  /**
   * List all stored content
   */
  async list(): Promise<StorageEntry[]> {
    if (!this.db) {
      throw new Error('Storage manager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage stats
   */
  async getStats(): Promise<any> {
    const ipfsStats = await this.ipfsNode.getStats();
    const entries = await this.list();

    return {
      ipfs: ipfsStats,
      cache: {
        size: this.cacheSize,
        maxSize: this.config.maxSize,
        entries: entries.length
      }
    };
  }

  /**
   * Cache store
   */
  private async cacheStore(key: string, cid: string, content: Uint8Array, pinned: boolean): Promise<void> {
    if (!this.db) return;

    const entry: StorageEntry = {
      key,
      cid,
      size: content.length,
      timestamp: Date.now(),
      pinned
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['content', 'metadata'], 'readwrite');

      // Store content
      const contentStore = transaction.objectStore('content');
      contentStore.put({ key, content });

      // Store metadata
      const metadataStore = transaction.objectStore('metadata');
      metadataStore.put(entry);

      transaction.oncomplete = () => {
        this.cacheSize += content.length;
        this.checkCacheSize();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Cache get
   */
  private async cacheGet(key: string): Promise<{ content: Uint8Array; metadata: StorageEntry } | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['content', 'metadata'], 'readonly');

      const contentStore = transaction.objectStore('content');
      const metadataStore = transaction.objectStore('metadata');

      const contentRequest = contentStore.get(key);
      const metadataRequest = metadataStore.get(key);

      transaction.oncomplete = () => {
        if (contentRequest.result && metadataRequest.result) {
          resolve({
            content: contentRequest.result.content,
            metadata: metadataRequest.result
          });
        } else {
          resolve(null);
        }
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Cache delete
   */
  private async cacheDelete(key: string): Promise<void> {
    if (!this.db) return;

    const cached = await this.cacheGet(key);
    if (cached) {
      this.cacheSize -= cached.metadata.size;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['content', 'metadata'], 'readwrite');

      transaction.objectStore('content').delete(key);
      transaction.objectStore('metadata').delete(key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get metadata
   */
  private async getMetadata(key: string): Promise<StorageEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate cache size
   */
  private async calculateCacheSize(): Promise<void> {
    const entries = await this.list();
    this.cacheSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    console.log('Cache size:', this.cacheSize, 'bytes');
  }

  /**
   * Check and cleanup cache if needed
   */
  private async checkCacheSize(): Promise<void> {
    if (this.cacheSize > this.config.maxSize!) {
      console.log('Cache size exceeded, cleaning up...');
      await this.cleanupCache();
    }
  }

  /**
   * Cleanup old cache entries
   */
  private async cleanupCache(): Promise<void> {
    const entries = await this.list();
    const now = Date.now();

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    for (const entry of entries) {
      if (entry.pinned) continue; // Don't delete pinned content

      const age = now - entry.timestamp;
      if (age > this.config.maxAge! || this.cacheSize > this.config.maxSize!) {
        await this.cacheDelete(entry.key);
        console.log('Cleaned up cache entry:', entry.key);

        if (this.cacheSize <= this.config.maxSize!) {
          break;
        }
      }
    }
  }

  /**
   * Start auto cleanup timer
   */
  private startAutoCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000); // Every hour
  }
}

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

/**
 * Get the global storage manager instance
 */
export function getStorageManager(ipfsNode: IPFSNode): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager(ipfsNode);
  }
  return storageManagerInstance;
}

/**
 * Initialize storage manager
 */
export async function initStorageManager(ipfsNode: IPFSNode, config?: CacheConfig): Promise<StorageManager> {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager(ipfsNode, config);
    await storageManagerInstance.initialize();
  }
  return storageManagerInstance;
}
