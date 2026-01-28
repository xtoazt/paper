/**
 * Build Cache Manager
 * Intelligent caching for instant rebuilds
 */

import { getHeliaClient } from '../ipfs/helia-client';

export interface CacheEntry {
  key: string;
  value: string; // CID or serialized data
  timestamp: number;
  dependencies?: string[];
  size?: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 500 * 1024 * 1024; // 500MB
  private currentCacheSize = 0;

  /**
   * Get cached value
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log('[Cache] Miss:', key);
      return null;
    }

    // Check if cache is still valid
    if (this.isExpired(entry)) {
      console.log('[Cache] Expired:', key);
      this.cache.delete(key);
      return null;
    }

    console.log('[Cache] Hit:', key);
    return entry.value;
  }

  /**
   * Set cached value
   */
  async set(key: string, value: string, dependencies?: string[]): Promise<void> {
    const size = new Blob([value]).size;

    // Check if we need to evict
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      dependencies,
      size
    };

    this.cache.set(key, entry);
    this.currentCacheSize += size;

    console.log('[Cache] Set:', key, `(${(size / 1024).toFixed(2)}KB)`);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - entry.timestamp > maxAge;
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldest(): void {
    let oldest: [string, CacheEntry] | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    }

    if (oldest) {
      const [key, entry] = oldest;
      this.cache.delete(key);
      this.currentCacheSize -= entry.size || 0;
      console.log('[Cache] Evicted:', key);
    }
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentCacheSize -= entry.size || 0;
      console.log('[Cache] Invalidated:', key);
    }
  }

  /**
   * Invalidate caches with dependency
   */
  invalidateByDependency(dependency: string): void {
    const toInvalidate: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies?.includes(dependency)) {
        toInvalidate.push(key);
      }
    }

    toInvalidate.forEach(key => this.invalidate(key));
    
    if (toInvalidate.length > 0) {
      console.log('[Cache] Invalidated by dependency:', dependency, toInvalidate.length, 'entries');
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    console.log('[Cache] Cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    size: number;
    hitRate: number;
  } {
    return {
      entries: this.cache.size,
      size: this.currentCacheSize,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * Export cache to IPFS for P2P sharing
   */
  async exportToIPFS(): Promise<string> {
    const heliaClient = getHeliaClient();
    
    const cacheData = {
      version: 1,
      timestamp: Date.now(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        value: entry.value,
        dependencies: entry.dependencies,
        timestamp: entry.timestamp
      }))
    };

    const cid = await heliaClient.addJSON(cacheData);
    console.log('[Cache] Exported to IPFS:', cid);
    return cid;
  }

  /**
   * Import cache from IPFS
   */
  async importFromIPFS(cid: string): Promise<void> {
    try {
      const heliaClient = getHeliaClient();
      const cacheData: any = await heliaClient.getJSON(cid);

      for (const entry of cacheData.entries) {
        await this.set(entry.key, entry.value, entry.dependencies);
      }

      console.log('[Cache] Imported from IPFS:', cacheData.entries.length, 'entries');
    } catch (error) {
      console.error('[Cache] Failed to import from IPFS:', error);
    }
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

/**
 * Get singleton cache manager
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}
