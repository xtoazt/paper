/**
 * Compute Orchestrator
 * Central coordinator for distributed compute across all nodes
 */

import type {
  ComputeNode,
  ComputeTask,
  TaskResult,
  Workload,
  LoadBalancerStrategy
} from './types';

export class ComputeOrchestrator {
  private nodes: Map<string, ComputeNode> = new Map();
  private tasks: Map<string, ComputeTask> = new Map();
  private results: Map<string, TaskResult> = new Map();
  private pendingTasks: ComputeTask[] = [];
  private runningTasks: Map<string, ComputeTask> = new Map();
  
  private loadBalancers: Map<string, LoadBalancerStrategy> = new Map();
  private healthCheckInterval: any = null;
  private redistributeInterval: any = null;
  
  constructor() {
    this.initializeLoadBalancers();
    this.startMonitoring();
  }

  /**
   * Initialize load balancing strategies
   */
  private initializeLoadBalancers(): void {
    // Least loaded strategy
    this.loadBalancers.set('least-loaded', {
      name: 'least-loaded',
      weight: (node: ComputeNode, task: ComputeTask) => {
        const resourceScore = (
          (1 - node.resources.cpuUsage) * 0.4 +
          (1 - node.resources.memoryUsage) * 0.3 +
          (1 - node.resources.networkUsage) * 0.2 +
          (1 - node.resources.storageUsage) * 0.1
        );
        return resourceScore * node.reputation;
      }
    });
    
    // Geo-aware strategy
    this.loadBalancers.set('geo-aware', {
      name: 'geo-aware',
      weight: (node: ComputeNode, task: ComputeTask) => {
        let score = 1.0;
        
        // Prefer nodes in same region if specified
        if (task.requirements.geolocation && node.geolocation) {
          if (node.geolocation.region === task.requirements.geolocation) {
            score *= 2.0;
          } else if (node.geolocation.country === task.requirements.geolocation) {
            score *= 1.5;
          }
        }
        
        // Factor in current load
        score *= (1 - node.resources.cpuUsage);
        score *= node.reputation;
        
        return score;
      }
    });
    
    // Random strategy (for testing/fallback)
    this.loadBalancers.set('random', {
      name: 'random',
      weight: () => Math.random()
    });
  }

  /**
   * Start monitoring and maintenance tasks
   */
  private startMonitoring(): void {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.monitorNodes();
    }, 30000);
    
    // Redistribute failed tasks every 10 seconds
    this.redistributeInterval = setInterval(() => {
      this.redistributeFailedTasks();
    }, 10000);
  }

  /**
   * Register a compute node
   */
  registerNode(node: ComputeNode): void {
    console.log('[Orchestrator] Registering node:', node.id);
    
    // Initialize reputation for new nodes
    if (!node.reputation) {
      node.reputation = 0.5; // Start at neutral
    }
    
    this.nodes.set(node.id, node);
    
    // Try to assign pending tasks to this new node
    this.assignPendingTasks();
  }

  /**
   * Unregister a compute node
   */
  unregisterNode(nodeId: string): void {
    console.log('[Orchestrator] Unregistering node:', nodeId);
    
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // Mark all running tasks on this node for redistribution
    for (const [taskId, task] of this.runningTasks) {
      if (task.assigned === nodeId) {
        console.log('[Orchestrator] Rescheduling task:', taskId);
        task.assigned = undefined;
        task.retries++;
        this.pendingTasks.push(task);
      }
    }
    
    this.nodes.delete(nodeId);
  }

  /**
   * Update node status and resources
   */
  updateNode(nodeId: string, updates: Partial<ComputeNode>): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    Object.assign(node, updates);
    node.lastSeen = Date.now();
  }

  /**
   * Schedule a compute task
   */
  async scheduleTask(task: ComputeTask): Promise<TaskResult> {
    console.log('[Orchestrator] Scheduling task:', task.id);
    
    this.tasks.set(task.id, task);
    this.pendingTasks.push(task);
    
    // Try to assign immediately
    this.assignPendingTasks();
    
    // Wait for result
    return this.waitForResult(task.id, task.timeout);
  }

  /**
   * Distribute workload across nodes
   */
  async distributeLoad(workload: Workload): Promise<TaskResult[]> {
    console.log('[Orchestrator] Distributing workload:', workload.id);
    
    const results: Promise<TaskResult>[] = [];
    
    // Add all tasks to queue
    for (const task of workload.tasks) {
      results.push(this.scheduleTask(task));
    }
    
    // Wait for all tasks to complete
    return Promise.all(results);
  }

  /**
   * Assign pending tasks to available nodes
   */
  private assignPendingTasks(): void {
    if (this.pendingTasks.length === 0) return;
    
    const availableNodes = Array.from(this.nodes.values())
      .filter(node => node.status === 'active' || node.status === 'idle');
    
    if (availableNodes.length === 0) return;
    
    // Process pending tasks
    const tasksToAssign = [...this.pendingTasks];
    this.pendingTasks = [];
    
    for (const task of tasksToAssign) {
      // Check if task exceeded retries
      if (task.retries > 3) {
        console.error('[Orchestrator] Task exceeded retries:', task.id);
        this.results.set(task.id, {
          taskId: task.id,
          success: false,
          error: 'Maximum retries exceeded',
          executionTime: 0,
          nodeId: 'none'
        });
        continue;
      }
      
      // Find best node for this task
      const selectedNode = this.selectNode(task, availableNodes);
      
      if (selectedNode) {
        task.assigned = selectedNode.id;
        this.runningTasks.set(task.id, task);
        
        // Send task to node (would use P2P messaging in real implementation)
        console.log('[Orchestrator] Assigning task', task.id, 'to node', selectedNode.id);
        
        // Update node status
        selectedNode.resources.activeTasks++;
        if (selectedNode.resources.activeTasks > 0) {
          selectedNode.status = 'busy';
        }
      } else {
        // No suitable node, keep in pending
        this.pendingTasks.push(task);
      }
    }
  }

  /**
   * Select best node for a task using load balancing strategy
   */
  private selectNode(task: ComputeTask, availableNodes: ComputeNode[]): ComputeNode | null {
    if (availableNodes.length === 0) return null;
    
    // Get strategy from workload or use default
    const strategyName = 'least-loaded'; // Could be configured per task
    const strategy = this.loadBalancers.get(strategyName);
    
    if (!strategy) return availableNodes[0];
    
    // Score all nodes
    const scored = availableNodes.map(node => ({
      node,
      score: strategy.weight(node, task)
    }));
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    // Return best node
    return scored[0].node;
  }

  /**
   * Monitor node health and update statuses
   */
  private monitorNodes(): void {
    const now = Date.now();
    const timeout = 60000; // 60 seconds
    
    for (const [nodeId, node] of this.nodes) {
      // Check if node hasn't reported in a while
      if (now - node.lastSeen > timeout) {
        console.warn('[Orchestrator] Node appears offline:', nodeId);
        node.status = 'offline';
        
        // Will be cleaned up by redistributeFailedTasks
      }
    }
  }

  /**
   * Redistribute tasks from failed or offline nodes
   */
  private redistributeFailedTasks(): void {
    for (const [taskId, task] of this.runningTasks) {
      if (!task.assigned) continue;
      
      const node = this.nodes.get(task.assigned);
      
      // Check if node is offline or task timed out
      const taskAge = Date.now() - task.created;
      const isTimedOut = taskAge > task.timeout;
      const isNodeOffline = !node || node.status === 'offline';
      
      if (isTimedOut || isNodeOffline) {
        console.log('[Orchestrator] Redistributing task:', taskId);
        
        // Remove from running tasks
        this.runningTasks.delete(taskId);
        
        // Reset assignment and retry
        task.assigned = undefined;
        task.retries++;
        
        // Add back to pending
        this.pendingTasks.push(task);
        
        // Decrease node reputation if it failed
        if (node) {
          node.reputation = Math.max(0.1, node.reputation - 0.1);
          if (node.resources.activeTasks > 0) {
            node.resources.activeTasks--;
          }
        }
      }
    }
    
    // Try to assign pending tasks
    this.assignPendingTasks();
  }

  /**
   * Report task completion
   */
  reportTaskComplete(taskId: string, result: TaskResult): void {
    console.log('[Orchestrator] Task complete:', taskId);
    
    const task = this.runningTasks.get(taskId);
    if (!task) return;
    
    // Store result
    this.results.set(taskId, result);
    
    // Remove from running tasks
    this.runningTasks.delete(taskId);
    
    // Update node stats
    if (task.assigned) {
      const node = this.nodes.get(task.assigned);
      if (node) {
        node.resources.activeTasks--;
        if (node.resources.activeTasks === 0) {
          node.status = 'idle';
        }
        
        // Increase reputation for successful completion
        if (result.success) {
          node.reputation = Math.min(1.0, node.reputation + 0.01);
        } else {
          node.reputation = Math.max(0.1, node.reputation - 0.05);
        }
      }
    }
  }

  /**
   * Wait for task result
   */
  private async waitForResult(taskId: string, timeout: number): Promise<TaskResult> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const result = this.results.get(taskId);
        
        if (result) {
          clearInterval(checkInterval);
          resolve(result);
          return;
        }
        
        // Check timeout
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Task timeout'));
        }
      }, 100);
    });
  }

  /**
   * Auto-scale resources based on demand
   */
  private scaleResources(): void {
    const queueLength = this.pendingTasks.length;
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'active' || n.status === 'busy');
    
    console.log('[Orchestrator] Auto-scaling check:', {
      pending: queueLength,
      active: activeNodes.length,
      total: this.nodes.size
    });
    
    // If queue is building up and we have idle nodes, wake them
    if (queueLength > 10 && activeNodes.length < this.nodes.size) {
      console.log('[Orchestrator] High demand detected - requesting more nodes');
      // In real implementation, would send wake signal to idle nodes
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): any {
    return {
      nodes: {
        total: this.nodes.size,
        active: Array.from(this.nodes.values()).filter(n => n.status === 'active').length,
        idle: Array.from(this.nodes.values()).filter(n => n.status === 'idle').length,
        busy: Array.from(this.nodes.values()).filter(n => n.status === 'busy').length,
        offline: Array.from(this.nodes.values()).filter(n => n.status === 'offline').length,
      },
      tasks: {
        pending: this.pendingTasks.length,
        running: this.runningTasks.size,
        completed: this.results.size
      },
      resources: {
        totalCPU: Array.from(this.nodes.values()).reduce((sum, n) => sum + n.capabilities.cpu.cores, 0),
        totalMemory: Array.from(this.nodes.values()).reduce((sum, n) => sum + n.capabilities.memory.total, 0),
        totalStorage: Array.from(this.nodes.values()).reduce((sum, n) => sum + n.capabilities.storage.total, 0)
      }
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.redistributeInterval) clearInterval(this.redistributeInterval);
  }
}

// Singleton instance
let orchestratorInstance: ComputeOrchestrator | null = null;

export function getOrchestrator(): ComputeOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ComputeOrchestrator();
  }
  return orchestratorInstance;
}
