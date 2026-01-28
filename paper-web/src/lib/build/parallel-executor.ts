/**
 * Parallel Build Executor
 * Build multiple projects simultaneously
 */

import { getCacheManager } from './cache-manager';
import { log } from '../logging/logger';

export interface BuildJob {
  id: string;
  name: string;
  files: Array<{ path: string; content: string }>;
  config?: {
    buildCommand?: string;
    outputDir?: string;
    envVars?: Record<string, string>;
  };
}

export interface BuildResult {
  id: string;
  success: boolean;
  artifacts?: Array<{ path: string; content: string }>;
  error?: string;
  duration: number;
  cacheHit: boolean;
}

export class ParallelExecutor {
  private cacheManager = getCacheManager();
  private maxConcurrent = 5;
  private activeBuilds = 0;
  private queue: Array<() => Promise<void>> = [];

  /**
   * Build multiple projects in parallel
   */
  async buildParallel(jobs: BuildJob[]): Promise<BuildResult[]> {
    log.info(`[ParallelExecutor] Starting parallel build of ${jobs.length} jobs`);

    const startTime = Date.now();
    const results: BuildResult[] = [];

    // Execute builds with concurrency limit
    await Promise.all(
      jobs.map(job => this.executeBuild(job).then(result => {
        results.push(result);
      }))
    );

    const totalDuration = Date.now() - startTime;
    log.info(`[ParallelExecutor] Completed ${jobs.length} builds in ${totalDuration}ms`);

    return results;
  }

  /**
   * Execute a single build with concurrency control
   */
  private async executeBuild(job: BuildJob): Promise<BuildResult> {
    // Wait if we're at max concurrency
    while (this.activeBuilds >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeBuilds++;

    try {
      return await this.runBuild(job);
    } finally {
      this.activeBuilds--;
    }
  }

  /**
   * Run a single build
   */
  private async runBuild(job: BuildJob): Promise<BuildResult> {
    const startTime = Date.now();
    log.info(`[ParallelExecutor] Building ${job.name}...`);

    try {
      // Check cache first
      const cacheKey = `build:${job.id}:${this.hashJob(job)}`;
      const cached = await this.cacheManager.get(cacheKey);

      if (cached) {
        log.info(`[ParallelExecutor] Cache hit for ${job.name}`);
        
        return {
          id: job.id,
          success: true,
          artifacts: JSON.parse(cached),
          duration: Date.now() - startTime,
          cacheHit: true
        };
      }

      // Simulate build process
      const artifacts = await this.buildFiles(job);

      // Cache the result
      await this.cacheManager.set(cacheKey, JSON.stringify(artifacts));

      const duration = Date.now() - startTime;
      log.info(`[ParallelExecutor] Built ${job.name} in ${duration}ms`);

      return {
        id: job.id,
        success: true,
        artifacts,
        duration,
        cacheHit: false
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`[ParallelExecutor] Build failed for ${job.name}`, error as Error);

      return {
        id: job.id,
        success: false,
        error: (error as Error).message,
        duration,
        cacheHit: false
      };
    }
  }

  /**
   * Build files (simplified for now)
   */
  private async buildFiles(job: BuildJob): Promise<Array<{ path: string; content: string }>> {
    // Simulate build time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    return job.files.map(file => ({
      path: file.path.replace(/\.ts$/, '.js').replace(/\.tsx$/, '.jsx'),
      content: `// Built: ${file.path}\n${file.content}`
    }));
  }

  /**
   * Hash job for cache key
   */
  private hashJob(job: BuildJob): string {
    const content = JSON.stringify({
      files: job.files.map(f => ({ path: f.path, size: f.content.length })),
      config: job.config
    });
    return btoa(content).substring(0, 20);
  }

  /**
   * Get build statistics
   */
  getStats(): {
    activeBuilds: number;
    queuedBuilds: number;
    maxConcurrent: number;
  } {
    return {
      activeBuilds: this.activeBuilds,
      queuedBuilds: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Set max concurrent builds
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, max);
  }
}

// Singleton instance
let parallelExecutorInstance: ParallelExecutor | null = null;

/**
 * Get singleton parallel executor
 */
export function getParallelExecutor(): ParallelExecutor {
  if (!parallelExecutorInstance) {
    parallelExecutorInstance = new ParallelExecutor();
  }
  return parallelExecutorInstance;
}
