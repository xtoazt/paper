/**
 * Incremental Builder
 * Only rebuild changed files for faster builds
 */

import { getCacheManager } from './cache-manager';
import { createHash } from 'crypto';

export interface BuildArtifact {
  path: string;
  content: string;
  hash: string;
  dependencies: string[];
}

export class IncrementalBuilder {
  private cacheManager = getCacheManager();
  private fileHashes = new Map<string, string>();

  /**
   * Compute file hash
   */
  private computeHash(content: string): string {
    // In browser, use SubtleCrypto or simple hash
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Use Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      // For simplicity, return a simple hash
      return btoa(content).substring(0, 40);
    }
    // Fallback
    return btoa(content).substring(0, 40);
  }

  /**
   * Check if file has changed
   */
  hasChanged(path: string, content: string): boolean {
    const newHash = this.computeHash(content);
    const oldHash = this.fileHashes.get(path);

    if (!oldHash || oldHash !== newHash) {
      this.fileHashes.set(path, newHash);
      return true;
    }

    return false;
  }

  /**
   * Build only changed files
   */
  async buildIncremental(
    files: Array<{ path: string; content: string; dependencies?: string[] }>,
    buildFn: (file: { path: string; content: string }) => Promise<string>
  ): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];
    const changedFiles: string[] = [];

    // Identify changed files
    for (const file of files) {
      if (this.hasChanged(file.path, file.content)) {
        changedFiles.push(file.path);
      }
    }

    if (changedFiles.length === 0) {
      console.log('[IncrementalBuilder] No changes detected');
      
      // Return cached artifacts
      for (const file of files) {
        const cacheKey = `build:${file.path}`;
        const cached = await this.cacheManager.get(cacheKey);
        
        if (cached) {
          artifacts.push({
            path: file.path,
            content: cached,
            hash: this.fileHashes.get(file.path)!,
            dependencies: file.dependencies || []
          });
        }
      }
      
      return artifacts;
    }

    console.log('[IncrementalBuilder] Changed files:', changedFiles.length);

    // Build changed files and their dependents
    const toBuild = new Set<string>(changedFiles);

    // Add files that depend on changed files
    for (const file of files) {
      if (file.dependencies) {
        for (const dep of file.dependencies) {
          if (changedFiles.includes(dep)) {
            toBuild.add(file.path);
          }
        }
      }
    }

    console.log('[IncrementalBuilder] Building:', toBuild.size, 'files');

    // Build files
    for (const file of files) {
      let content: string;

      if (toBuild.has(file.path)) {
        // Build this file
        content = await buildFn(file);
        
        // Cache the result
        const cacheKey = `build:${file.path}`;
        await this.cacheManager.set(cacheKey, content, file.dependencies);
      } else {
        // Use cached version
        const cacheKey = `build:${file.path}`;
        const cached = await this.cacheManager.get(cacheKey);
        content = cached || await buildFn(file);
      }

      artifacts.push({
        path: file.path,
        content,
        hash: this.fileHashes.get(file.path)!,
        dependencies: file.dependencies || []
      });
    }

    return artifacts;
  }

  /**
   * Clear build cache
   */
  clearCache(): void {
    this.fileHashes.clear();
    this.cacheManager.clear();
    console.log('[IncrementalBuilder] Cache cleared');
  }

  /**
   * Get build statistics
   */
  getStats(): {
    trackedFiles: number;
    cacheSize: number;
  } {
    const cacheStats = this.cacheManager.getStats();
    
    return {
      trackedFiles: this.fileHashes.size,
      cacheSize: cacheStats.size
    };
  }
}

// Singleton instance
let incrementalBuilderInstance: IncrementalBuilder | null = null;

/**
 * Get singleton incremental builder
 */
export function getIncrementalBuilder(): IncrementalBuilder {
  if (!incrementalBuilderInstance) {
    incrementalBuilderInstance = new IncrementalBuilder();
  }
  return incrementalBuilderInstance;
}
