/**
 * Compute Worker
 * Executes tasks on individual nodes with resource monitoring and throttling
 */

import type { ComputeTask, TaskResult, NodeResources, NodeCapabilities } from './types';

export interface WorkerConfig {
  cpuLimit: number; // 0-1, percentage of CPU to use
  memoryLimit: number; // bytes
  silent: boolean; // no UI indicators
  idleOnly: boolean; // only use resources when user is idle
}

export class ComputeWorker {
  private config: WorkerConfig;
  private resources: NodeResources;
  private capabilities: NodeCapabilities;
  private activeTasks: Map<string, ComputeTask> = new Map();
  private worker: Worker | null = null;
  private resourceMonitorInterval: any = null;
  
  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      cpuLimit: 0.15, // 15% default
      memoryLimit: 200 * 1024 * 1024, // 200MB default
      silent: true,
      idleOnly: false,
      ...config
    };
    
    this.resources = {
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      networkUsage: 0,
      activeTasks: 0
    };
    
    this.capabilities = this.detectCapabilities();
    this.initializeWorker();
    this.startResourceMonitoring();
  }

  /**
   * Detect device capabilities
   */
  private detectCapabilities(): NodeCapabilities {
    const nav = navigator as any;
    
    return {
      cpu: {
        cores: nav.hardwareConcurrency || 4,
        speed: 2.0, // Approximate, can't detect in browser
        architecture: nav.platform || 'unknown'
      },
      memory: {
        total: (nav.deviceMemory || 4) * 1024 * 1024 * 1024, // GB to bytes
        available: (nav.deviceMemory || 4) * 1024 * 1024 * 1024 * 0.8
      },
      storage: {
        total: 0, // Would need Storage API
        available: 0
      },
      network: {
        bandwidth: (nav.connection?.downlink || 10) * 1000000, // Mbps to bps
        latency: nav.connection?.rtt || 50
      },
      features: [
        'webassembly',
        typeof WebAssembly !== 'undefined' && 'webassembly',
        typeof OffscreenCanvas !== 'undefined' && 'offscreen-canvas',
        typeof (nav as any).gpu !== 'undefined' && 'webgpu'
      ].filter(Boolean) as string[]
    };
  }

  /**
   * Initialize Web Worker for background execution
   */
  private initializeWorker(): void {
    const workerCode = `
      // Worker state
      self.config = {};
      self.tasks = [];
      self.isRunning = false;
      self.cpuThrottle = 1.0;
      
      // Message handler
      self.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch(type) {
          case 'init':
            self.config = data.config;
            self.isRunning = true;
            self.postMessage({ type: 'ready' });
            break;
            
          case 'update-config':
            self.config = { ...self.config, ...data.config };
            break;
            
          case 'update-throttle':
            self.cpuThrottle = data.throttle;
            break;
            
          case 'execute-task':
            executeTask(data.task);
            break;
            
          case 'cancel-task':
            cancelTask(data.taskId);
            break;
            
          case 'stop':
            self.isRunning = false;
            break;
        }
      });
      
      // Task execution
      function executeTask(task) {
        if (!self.isRunning) {
          self.postMessage({
            type: 'task-error',
            taskId: task.id,
            error: 'Worker not running'
          });
          return;
        }
        
        const startTime = Date.now();
        
        try {
          let result;
          
          switch(task.type) {
            case 'compute':
              result = executeCompute(task);
              break;
            case 'storage':
              result = executeStorage(task);
              break;
            case 'proxy':
              result = executeProxy(task);
              break;
            case 'database':
              result = executeDatabase(task);
              break;
            case 'cdn':
              result = executeCDN(task);
              break;
            default:
              throw new Error('Unknown task type: ' + task.type);
          }
          
          const executionTime = Date.now() - startTime;
          
          self.postMessage({
            type: 'task-complete',
            taskId: task.id,
            result,
            executionTime
          });
        } catch (error) {
          self.postMessage({
            type: 'task-error',
            taskId: task.id,
            error: error.message,
            executionTime: Date.now() - startTime
          });
        }
      }
      
      // Compute task: CPU-intensive operations
      function executeCompute(task) {
        const { operation, data } = task.payload;
        
        // Apply CPU throttle
        const workTime = 100 * self.cpuThrottle;
        const sleepTime = 100 * (1 - self.cpuThrottle);
        
        switch(operation) {
          case 'hash':
            return computeHash(data, workTime, sleepTime);
          case 'encode':
            return encodeData(data, workTime, sleepTime);
          case 'process':
            return processData(data, workTime, sleepTime);
          default:
            return { success: true };
        }
      }
      
      function computeHash(data, workTime, sleepTime) {
        // Simulated hash computation with throttling
        let iterations = 0;
        const maxIterations = 1000;
        
        while (iterations < maxIterations) {
          // Do work
          const start = Date.now();
          while (Date.now() - start < workTime) {
            iterations++;
          }
          
          // Sleep to throttle CPU
          const sleepStart = Date.now();
          while (Date.now() - sleepStart < sleepTime) {
            // Busy wait (sleep)
          }
        }
        
        return { hash: 'computed_hash_' + iterations };
      }
      
      function encodeData(data, workTime, sleepTime) {
        // Simulated encoding
        return { encoded: true, size: data.length || 0 };
      }
      
      function processData(data, workTime, sleepTime) {
        // Simulated data processing
        return { processed: true };
      }
      
      // Storage task: Store/retrieve data
      function executeStorage(task) {
        const { operation, key, value } = task.payload;
        
        switch(operation) {
          case 'store':
            // In real implementation, would use IndexedDB
            return { stored: true, key };
          case 'retrieve':
            return { value: null }; // Placeholder
          case 'delete':
            return { deleted: true };
          default:
            return { success: false };
        }
      }
      
      // Proxy task: Forward requests
      function executeProxy(task) {
        const { url, method, headers, body } = task.payload;
        
        // In real implementation, would forward request
        return { proxied: true, url };
      }
      
      // Database task: Execute queries
      function executeDatabase(task) {
        const { query, params } = task.payload;
        
        // In real implementation, would execute on distributed DB
        return { rows: [], affectedRows: 0 };
      }
      
      // CDN task: Serve cached content
      function executeCDN(task) {
        const { assetId } = task.payload;
        
        // In real implementation, would serve from cache
        return { served: true, assetId };
      }
      
      function cancelTask(taskId) {
        // Remove from queue if pending
        self.postMessage({ type: 'task-cancelled', taskId });
      }
    `;
    
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      
      this.worker.onmessage = (event) => this.handleWorkerMessage(event);
      this.worker.onerror = (error) => console.error('[Worker] Error:', error);
      
      // Initialize worker
      this.worker.postMessage({
        type: 'init',
        data: { config: this.config }
      });
      
      console.log('[Worker] Initialized successfully');
    } catch (error) {
      console.error('[Worker] Failed to initialize:', error);
    }
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { type, taskId, result, error, executionTime } = event.data;
    
    switch(type) {
      case 'ready':
        console.log('[Worker] Ready to accept tasks');
        break;
        
      case 'task-complete':
        this.handleTaskComplete(taskId, result, executionTime);
        break;
        
      case 'task-error':
        this.handleTaskError(taskId, error, executionTime);
        break;
        
      case 'task-cancelled':
        this.activeTasks.delete(taskId);
        break;
    }
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(taskId: string, result: any, executionTime: number): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    console.log('[Worker] Task completed:', taskId, 'in', executionTime, 'ms');
    
    this.activeTasks.delete(taskId);
    this.resources.activeTasks = this.activeTasks.size;
    
    // Emit completion event (would notify orchestrator)
    window.dispatchEvent(new CustomEvent('paper:task-complete', {
      detail: {
        taskId,
        success: true,
        result,
        executionTime
      }
    }));
  }

  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, error: string, executionTime: number): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    console.error('[Worker] Task failed:', taskId, error);
    
    this.activeTasks.delete(taskId);
    this.resources.activeTasks = this.activeTasks.size;
    
    // Emit error event
    window.dispatchEvent(new CustomEvent('paper:task-error', {
      detail: {
        taskId,
        success: false,
        error,
        executionTime
      }
    }));
  }

  /**
   * Execute a task
   */
  async executeTask(task: ComputeTask): Promise<TaskResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    
    console.log('[Worker] Executing task:', task.id, task.type);
    
    this.activeTasks.set(task.id, task);
    this.resources.activeTasks = this.activeTasks.size;
    
    // Send task to worker
    this.worker.postMessage({
      type: 'execute-task',
      data: { task }
    });
    
    // Wait for completion
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task timeout'));
      }, task.timeout);
      
      const completeHandler = (event: any) => {
        if (event.detail.taskId === task.id) {
          clearTimeout(timeout);
          window.removeEventListener('paper:task-complete', completeHandler);
          window.removeEventListener('paper:task-error', errorHandler);
          
          resolve({
            taskId: task.id,
            success: event.detail.success,
            result: event.detail.result,
            executionTime: event.detail.executionTime,
            nodeId: 'local'
          });
        }
      };
      
      const errorHandler = (event: any) => {
        if (event.detail.taskId === task.id) {
          clearTimeout(timeout);
          window.removeEventListener('paper:task-complete', completeHandler);
          window.removeEventListener('paper:task-error', errorHandler);
          
          reject(new Error(event.detail.error));
        }
      };
      
      window.addEventListener('paper:task-complete', completeHandler);
      window.addEventListener('paper:task-error', errorHandler);
    });
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = setInterval(() => {
      this.monitorResources();
      this.throttleIfNeeded();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Monitor current resource usage
   */
  private monitorResources(): void {
    // Estimate CPU usage based on active tasks
    const cpuEstimate = Math.min(1.0, this.activeTasks.size * 0.1);
    this.resources.cpuUsage = cpuEstimate;
    
    // Estimate memory usage
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.resources.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    } else {
      this.resources.memoryUsage = this.activeTasks.size * 0.05; // Estimate
    }
    
    // Network usage (placeholder)
    this.resources.networkUsage = 0.1;
    
    // Storage usage (placeholder)
    this.resources.storageUsage = 0.05;
  }

  /**
   * Throttle worker if exceeding limits
   */
  private throttleIfNeeded(): void {
    if (!this.worker) return;
    
    let throttle = 1.0;
    
    // Reduce throttle if CPU usage is high
    if (this.resources.cpuUsage > this.config.cpuLimit) {
      throttle = this.config.cpuLimit / this.resources.cpuUsage;
    }
    
    // Reduce throttle if memory usage is high
    if (this.resources.memoryUsage > 0.8) {
      throttle = Math.min(throttle, 0.5);
    }
    
    // Update worker throttle
    if (throttle < 1.0) {
      this.worker.postMessage({
        type: 'update-throttle',
        data: { throttle }
      });
    }
  }

  /**
   * Detect if user is idle
   */
  detectIdleTime(): boolean {
    // This would be called from resource manager
    return !document.hasFocus() || document.hidden || false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.worker) {
      this.worker.postMessage({
        type: 'update-config',
        data: { config: this.config }
      });
    }
  }

  /**
   * Get current resource stats
   */
  getResources(): NodeResources {
    return { ...this.resources };
  }

  /**
   * Get capabilities
   */
  getCapabilities(): NodeCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
    }
  }
}

// Singleton instance
let workerInstance: ComputeWorker | null = null;

export function getComputeWorker(config?: Partial<WorkerConfig>): ComputeWorker {
  if (!workerInstance) {
    workerInstance = new ComputeWorker(config);
  }
  return workerInstance;
}
