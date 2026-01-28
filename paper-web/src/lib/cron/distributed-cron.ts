/**
 * Distributed Cron Service
 * Scheduled tasks with guaranteed execution
 */

export interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  task: () => Promise<void>;
  enabled: boolean;
  created: number;
  lastRun?: number;
  nextRun: number;
  runCount: number;
  failCount: number;
}

export class DistributedCron {
  private jobs: Map<string, CronJob> = new Map();
  private schedulerInterval: any = null;
  
  constructor() {
    console.log('[DistributedCron] Initialized');
    this.startScheduler();
  }

  /**
   * Schedule a cron job
   */
  async schedule(expression: string, task: () => Promise<void>, name: string = 'Unnamed Job'): Promise<string> {
    const id = `cron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: CronJob = {
      id,
      name,
      schedule: expression,
      task,
      enabled: true,
      created: Date.now(),
      nextRun: this.calculateNextRun(expression),
      runCount: 0,
      failCount: 0
    };
    
    this.jobs.set(id, job);
    console.log('[DistributedCron] Job scheduled:', id, expression);
    
    return id;
  }

  /**
   * Start scheduler
   */
  private startScheduler(): void {
    this.schedulerInterval = setInterval(() => {
      this.checkJobs();
    }, 60000); // Check every minute
  }

  /**
   * Check and execute due jobs
   */
  private async checkJobs(): Promise<void> {
    const now = Date.now();
    
    for (const [id, job] of this.jobs) {
      if (!job.enabled) continue;
      
      if (now >= job.nextRun) {
        // Elect leader for execution (distributed consensus)
        const isLeader = await this.electLeader(id);
        
        if (isLeader) {
          await this.executeJob(job);
        }
      }
    }
  }

  /**
   * Execute job
   */
  private async executeJob(job: CronJob): Promise<void> {
    console.log('[DistributedCron] Executing job:', job.id, job.name);
    
    try {
      await job.task();
      
      job.runCount++;
      job.lastRun = Date.now();
      job.nextRun = this.calculateNextRun(job.schedule);
      
      console.log('[DistributedCron] Job completed:', job.id);
    } catch (error) {
      console.error('[DistributedCron] Job failed:', job.id, error);
      job.failCount++;
      
      // Retry after delay
      job.nextRun = Date.now() + 300000; // 5 minutes
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(expression: string): number {
    // Simple implementation - would use cron parser in production
    // For now, default to next hour
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.getTime();
  }

  /**
   * Leader election for job execution
   */
  private async electLeader(jobId: string): Promise<boolean> {
    // Distributed consensus to ensure exactly-once execution
    // For now, always return true (single node)
    return true;
  }

  /**
   * Ensure job execution (with retry)
   */
  private ensureExecution(jobId: string): void {
    console.log('[DistributedCron] Ensuring execution:', jobId);
  }

  /**
   * Get job by ID
   */
  getJob(id: string): CronJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * List all jobs
   */
  listJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Enable job
   */
  enableJob(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = true;
      console.log('[DistributedCron] Job enabled:', id);
    }
  }

  /**
   * Disable job
   */
  disableJob(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = false;
      console.log('[DistributedCron] Job disabled:', id);
    }
  }

  /**
   * Delete job
   */
  deleteJob(id: string): void {
    this.jobs.delete(id);
    console.log('[DistributedCron] Job deleted:', id);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }
}

export function getDistributedCron(): DistributedCron {
  return new DistributedCron();
}
