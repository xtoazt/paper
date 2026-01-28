/**
 * Task Scheduler
 * Intelligent scheduling with priority queues, load balancing, and fault tolerance
 */

import type { ComputeTask, ComputeNode } from './types';

export interface SchedulerConfig {
  maxRetries: number;
  retryDelay: number;
  priorityLevels: number;
  geoAware: boolean;
}

export class TaskScheduler {
  private config: SchedulerConfig;
  private priorityQueues: Map<number, ComputeTask[]> = new Map();
  private scheduledTasks: Map<string, ComputeTask> = new Map();
  private failedTasks: Map<string, number> = new Map(); // taskId -> retry count
  
  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      priorityLevels: 10,
      geoAware: true,
      ...config
    };
    
    // Initialize priority queues
    for (let i = 0; i <= this.config.priorityLevels; i++) {
      this.priorityQueues.set(i, []);
    }
  }

  /**
   * Add task to scheduler
   */
  scheduleTask(task: ComputeTask): void {
    // Normalize priority
    const priority = Math.max(0, Math.min(this.config.priorityLevels, task.priority));
    
    // Add to appropriate priority queue
    const queue = this.priorityQueues.get(priority) || [];
    queue.push(task);
    this.priorityQueues.set(priority, queue);
    
    this.scheduledTasks.set(task.id, task);
    
    console.log('[Scheduler] Task scheduled:', task.id, 'priority:', priority);
  }

  /**
   * Get next task to execute
   */
  getNextTask(availableNodes: ComputeNode[]): ComputeTask | null {
    // Start from highest priority
    for (let priority = this.config.priorityLevels; priority >= 0; priority--) {
      const queue = this.priorityQueues.get(priority);
      if (!queue || queue.length === 0) continue;
      
      // Try to find a suitable task for available nodes
      for (let i = 0; i < queue.length; i++) {
        const task = queue[i];
        
        // Check if task can be executed on available nodes
        if (this.canExecuteOnNodes(task, availableNodes)) {
          // Remove from queue
          queue.splice(i, 1);
          return task;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if task can be executed on any of the available nodes
   */
  private canExecuteOnNodes(task: ComputeTask, nodes: ComputeNode[]): boolean {
    if (nodes.length === 0) return false;
    
    return nodes.some(node => this.canExecuteOnNode(task, node));
  }

  /**
   * Check if task can be executed on a specific node
   */
  private canExecuteOnNode(task: ComputeTask, node: ComputeNode): boolean {
    const req = task.requirements;
    const cap = node.capabilities;
    const res = node.resources;
    
    // Check CPU
    if (req.cpu && cap.cpu.cores < req.cpu) return false;
    if (res.cpuUsage > 0.9) return false; // Node too busy
    
    // Check memory
    if (req.memory && cap.memory.available < req.memory) return false;
    if (res.memoryUsage > 0.9) return false;
    
    // Check storage
    if (req.storage && cap.storage.available < req.storage) return false;
    
    // Check network
    if (req.network && cap.network.bandwidth < req.network * 1000000) return false;
    
    // Check features
    if (req.features && req.features.length > 0) {
      const hasAllFeatures = req.features.every(f => cap.features.includes(f));
      if (!hasAllFeatures) return false;
    }
    
    // Check geolocation if required
    if (this.config.geoAware && req.geolocation && node.geolocation) {
      // Prefer nodes in same region, but don't exclude others
      // This is just a preference, not a hard requirement
    }
    
    return true;
  }

  /**
   * Select best node for task using load balancing
   */
  selectNodeForTask(task: ComputeTask, nodes: ComputeNode[]): ComputeNode | null {
    // Filter nodes that can execute the task
    const suitableNodes = nodes.filter(node => this.canExecuteOnNode(task, node));
    
    if (suitableNodes.length === 0) return null;
    
    // Score nodes
    const scored = suitableNodes.map(node => ({
      node,
      score: this.scoreNode(node, task)
    }));
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].node;
  }

  /**
   * Score a node for a task
   */
  private scoreNode(node: ComputeNode, task: ComputeTask): number {
    let score = 1.0;
    
    // Factor in reputation
    score *= node.reputation;
    
    // Factor in current load (prefer less loaded)
    const loadFactor = (
      (1 - node.resources.cpuUsage) * 0.4 +
      (1 - node.resources.memoryUsage) * 0.3 +
      (1 - node.resources.networkUsage) * 0.2 +
      (1 - node.resources.storageUsage) * 0.1
    );
    score *= loadFactor;
    
    // Factor in geolocation if required
    if (this.config.geoAware && task.requirements.geolocation && node.geolocation) {
      if (node.geolocation.region === task.requirements.geolocation) {
        score *= 2.0; // Strong preference for same region
      } else if (node.geolocation.country === task.requirements.geolocation) {
        score *= 1.5; // Moderate preference for same country
      }
    }
    
    // Factor in network latency
    if (node.capabilities.network.latency < 50) {
      score *= 1.2; // Bonus for low latency
    } else if (node.capabilities.network.latency > 200) {
      score *= 0.8; // Penalty for high latency
    }
    
    return score;
  }

  /**
   * Report task failure
   */
  reportFailure(taskId: string): void {
    const retryCount = (this.failedTasks.get(taskId) || 0) + 1;
    this.failedTasks.set(taskId, retryCount);
    
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;
    
    console.log('[Scheduler] Task failed:', taskId, 'retry:', retryCount);
    
    // Check if should retry
    if (retryCount < this.config.maxRetries) {
      // Reschedule after delay
      setTimeout(() => {
        task.retries = retryCount;
        this.scheduleTask(task);
      }, this.config.retryDelay * retryCount); // Exponential backoff
    } else {
      console.error('[Scheduler] Task exceeded max retries:', taskId);
      this.failedTasks.delete(taskId);
      this.scheduledTasks.delete(taskId);
    }
  }

  /**
   * Report task success
   */
  reportSuccess(taskId: string): void {
    this.failedTasks.delete(taskId);
    this.scheduledTasks.delete(taskId);
  }

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: number): ComputeTask[] {
    return this.priorityQueues.get(priority) || [];
  }

  /**
   * Get pending task count
   */
  getPendingCount(): number {
    let count = 0;
    for (const queue of this.priorityQueues.values()) {
      count += queue.length;
    }
    return count;
  }

  /**
   * Get scheduler statistics
   */
  getStats(): any {
    const queueSizes: Record<number, number> = {};
    for (const [priority, queue] of this.priorityQueues) {
      queueSizes[priority] = queue.length;
    }
    
    return {
      pending: this.getPendingCount(),
      scheduled: this.scheduledTasks.size,
      failed: this.failedTasks.size,
      queueSizes
    };
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    for (const queue of this.priorityQueues.values()) {
      queue.length = 0;
    }
    this.scheduledTasks.clear();
    this.failedTasks.clear();
  }
}

// Singleton instance
let schedulerInstance: TaskScheduler | null = null;

export function getTaskScheduler(config?: Partial<SchedulerConfig>): TaskScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new TaskScheduler(config);
  }
  return schedulerInstance;
}
