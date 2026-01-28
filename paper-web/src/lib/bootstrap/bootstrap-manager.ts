/**
 * Bootstrap Manager
 * Orchestrates bootstrap process with multiple redundant sources
 */

import { getBootstrapSources, getEnabledSources, type BootstrapSource } from './bootstrap-sources';
import { BootstrapLoader, type LoadResult } from './bootstrap-loader';

export interface BootstrapStats {
  totalAttempts: number;
  successfulSources: BootstrapSource[];
  failedSources: BootstrapSource[];
  averageLatency: number;
  totalTime: number;
}

export class BootstrapManager {
  private loader: BootstrapLoader;
  private stats: BootstrapStats;
  private isBootstrapping = false;
  private cachedSuccessfulSource: BootstrapSource | null = null;

  constructor() {
    this.loader = new BootstrapLoader();
    this.stats = {
      totalAttempts: 0,
      successfulSources: [],
      failedSources: [],
      averageLatency: 0,
      totalTime: 0
    };
  }

  /**
   * Bootstrap Service Worker from best available source
   */
  async bootstrap(): Promise<LoadResult> {
    if (this.isBootstrapping) {
      throw new Error('Bootstrap already in progress');
    }

    this.isBootstrapping = true;
    const startTime = Date.now();

    console.log('Starting bootstrap process...');

    try {
      // Check if already active
      const isActive = await this.loader.isActive();
      if (isActive) {
        console.log('Service Worker already active');
        this.isBootstrapping = false;
        return {
          success: true,
          source: this.cachedSuccessfulSource || getEnabledSources()[0],
          latency: 0
        };
      }

      // Try cached successful source first
      if (this.cachedSuccessfulSource) {
        console.log('Trying cached successful source:', this.cachedSuccessfulSource.id);
        const result = await this.loader.loadFromSource(this.cachedSuccessfulSource);
        
        if (result.success) {
          this.updateStats(result, Date.now() - startTime);
          this.isBootstrapping = false;
          return result;
        }
        
        // Cached source failed, remove from cache
        this.cachedSuccessfulSource = null;
      }

      // Try all enabled sources in priority order
      const sources = getEnabledSources();
      console.log('Trying', sources.length, 'bootstrap sources');

      for (const source of sources) {
        this.stats.totalAttempts++;

        console.log('Attempting bootstrap from:', source.id, 'priority:', source.priority);
        
        const result = await this.loader.loadFromSource(source);

        if (result.success) {
          console.log('Bootstrap successful from:', source.id);
          
          // Cache successful source
          this.cachedSuccessfulSource = source;
          
          // Update stats
          this.updateStats(result, Date.now() - startTime);
          
          this.isBootstrapping = false;
          return result;
        } else {
          console.warn('Bootstrap failed from:', source.id, result.error);
          this.stats.failedSources.push(source);
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // All sources failed
      console.error('Bootstrap failed from all sources');
      this.isBootstrapping = false;

      return {
        success: false,
        source: sources[0],
        error: 'All bootstrap sources failed',
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Bootstrap error:', error);
      this.isBootstrapping = false;

      throw error;
    }
  }

  /**
   * Bootstrap with parallel attempts
   */
  async bootstrapParallel(maxParallel: number = 3): Promise<LoadResult> {
    if (this.isBootstrapping) {
      throw new Error('Bootstrap already in progress');
    }

    this.isBootstrapping = true;
    const startTime = Date.now();

    console.log('Starting parallel bootstrap process...');

    try {
      // Check if already active
      const isActive = await this.loader.isActive();
      if (isActive) {
        console.log('Service Worker already active');
        this.isBootstrapping = false;
        return {
          success: true,
          source: this.cachedSuccessfulSource || getEnabledSources()[0],
          latency: 0
        };
      }

      const sources = getEnabledSources();
      console.log('Trying', sources.length, 'sources in parallel (max', maxParallel, 'concurrent)');

      // Try sources in batches
      for (let i = 0; i < sources.length; i += maxParallel) {
        const batch = sources.slice(i, i + maxParallel);
        
        console.log('Trying batch:', batch.map(s => s.id).join(', '));

        // Try batch in parallel
        const results = await Promise.allSettled(
          batch.map(source => this.loader.loadFromSource(source))
        );

        // Check if any succeeded
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          
          if (result.status === 'fulfilled' && result.value.success) {
            const loadResult = result.value;
            console.log('Bootstrap successful from:', loadResult.source.id);
            
            // Cache successful source
            this.cachedSuccessfulSource = loadResult.source;
            
            // Update stats
            this.updateStats(loadResult, Date.now() - startTime);
            
            this.isBootstrapping = false;
            return loadResult;
          }
        }

        // All in batch failed, try next batch
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // All sources failed
      console.error('Parallel bootstrap failed from all sources');
      this.isBootstrapping = false;

      return {
        success: false,
        source: sources[0],
        error: 'All bootstrap sources failed',
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Parallel bootstrap error:', error);
      this.isBootstrapping = false;
      throw error;
    }
  }

  /**
   * Update bootstrap statistics
   */
  private updateStats(result: LoadResult, totalTime: number): void {
    if (result.success) {
      this.stats.successfulSources.push(result.source);
    }

    this.stats.totalTime = totalTime;
    
    // Calculate average latency
    const latencies = [...this.stats.successfulSources.map(() => result.latency)];
    this.stats.averageLatency = 
      latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  /**
   * Get bootstrap statistics
   */
  getStats(): BootstrapStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulSources: [],
      failedSources: [],
      averageLatency: 0,
      totalTime: 0
    };
  }

  /**
   * Clear cached successful source
   */
  clearCache(): void {
    this.cachedSuccessfulSource = null;
  }

  /**
   * Check if Service Worker is active
   */
  async isActive(): Promise<boolean> {
    return await this.loader.isActive();
  }

  /**
   * Check if bootstrapping
   */
  isBootstrappingActive(): boolean {
    return this.isBootstrapping;
  }
}

// Singleton instance
let bootstrapManagerInstance: BootstrapManager | null = null;

/**
 * Get bootstrap manager instance
 */
export function getBootstrapManager(): BootstrapManager {
  if (!bootstrapManagerInstance) {
    bootstrapManagerInstance = new BootstrapManager();
  }
  return bootstrapManagerInstance;
}

/**
 * Bootstrap Service Worker
 */
export async function bootstrapServiceWorker(parallel: boolean = true): Promise<LoadResult> {
  const manager = getBootstrapManager();
  
  if (parallel) {
    return await manager.bootstrapParallel();
  } else {
    return await manager.bootstrap();
  }
}
