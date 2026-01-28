/**
 * Resource Manager
 * Monitors device resources and adjusts usage based on user activity
 */

export interface ResourceLimits {
  cpuIdle: number; // CPU usage when user is idle (0-1)
  cpuActive: number; // CPU usage when user is active (0-1)
  memory: number; // Maximum memory in bytes
  storage: number; // Maximum storage in bytes
  network: number; // Maximum network bandwidth in bps
}

export interface ActivityDetectionConfig {
  idleThreshold: number; // ms of inactivity to consider idle
  checkInterval: number; // ms between activity checks
  events: string[]; // events to track for activity
}

export class ResourceManager {
  private cpuUsage: number = 0;
  private memoryUsage: number = 0;
  private networkBandwidth: number = 0;
  private isUserActive: boolean = false;
  private lastActivity: number = Date.now();
  
  private limits: ResourceLimits;
  private activityConfig: ActivityDetectionConfig;
  private activityCheckInterval: any = null;
  private performanceMonitorInterval: any = null;
  
  private activityListeners: Array<() => void> = [];
  
  constructor(
    limits: Partial<ResourceLimits> = {},
    activityConfig: Partial<ActivityDetectionConfig> = {}
  ) {
    this.limits = {
      cpuIdle: 0.15, // 15% when idle
      cpuActive: 0.05, // 5% when active
      memory: 200 * 1024 * 1024, // 200MB
      storage: 1024 * 1024 * 1024, // 1GB
      network: 10 * 1000000, // 10 Mbps
      ...limits
    };
    
    this.activityConfig = {
      idleThreshold: 60000, // 60 seconds
      checkInterval: 5000, // 5 seconds
      events: [
        'mousedown',
        'mousemove',
        'keypress',
        'keydown',
        'scroll',
        'touchstart',
        'click',
        'wheel'
      ],
      ...activityConfig
    };
    
    this.setupActivityDetection();
    this.startPerformanceMonitoring();
  }

  /**
   * Setup user activity detection
   */
  private setupActivityDetection(): void {
    // Create activity update handler
    const updateActivity = () => {
      const wasActive = this.isUserActive;
      this.isUserActive = true;
      this.lastActivity = Date.now();
      
      // Emit event if state changed
      if (!wasActive) {
        this.emitActivityChange(true);
      }
    };
    
    // Attach event listeners
    this.activityConfig.events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true, capture: true });
      this.activityListeners.push(() => {
        document.removeEventListener(event, updateActivity);
      });
    });
    
    // Check for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tabs, consider idle
        this.isUserActive = false;
        this.emitActivityChange(false);
      } else {
        updateActivity();
      }
    });
    
    // Check for focus changes
    window.addEventListener('blur', () => {
      this.isUserActive = false;
      this.emitActivityChange(false);
    });
    
    window.addEventListener('focus', updateActivity);
    
    // Periodically check for idle timeout
    this.activityCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;
      
      if (timeSinceActivity > this.activityConfig.idleThreshold) {
        if (this.isUserActive) {
          this.isUserActive = false;
          this.emitActivityChange(false);
        }
      }
    }, this.activityConfig.checkInterval);
  }

  /**
   * Emit activity change event
   */
  private emitActivityChange(active: boolean): void {
    console.log('[ResourceManager] User activity changed:', active ? 'active' : 'idle');
    
    window.dispatchEvent(new CustomEvent('paper:activity-change', {
      detail: { active, limits: this.getCurrentLimits() }
    }));
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitorInterval = setInterval(() => {
      this.updateResourceUsage();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update current resource usage
   */
  private updateResourceUsage(): void {
    // Monitor memory
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize;
    }
    
    // Monitor CPU (estimated based on task count and frame rate)
    this.cpuUsage = this.estimateCPUUsage();
    
    // Monitor network (via Resource Timing API)
    this.networkBandwidth = this.estimateNetworkUsage();
    
    // Emit stats
    this.emitResourceStats();
  }

  /**
   * Estimate CPU usage
   */
  private estimateCPUUsage(): number {
    // Use frame timing to estimate CPU load
    if ('now' in performance) {
      const frameTime = performance.now();
      const idealFrameTime = 16.67; // 60fps
      const actualFrameTime = frameTime % 1000;
      
      // If frames are taking longer, CPU is busier
      const cpuEstimate = Math.min(1.0, actualFrameTime / idealFrameTime / 10);
      return cpuEstimate;
    }
    
    return 0.1; // Default estimate
  }

  /**
   * Estimate network usage
   */
  private estimateNetworkUsage(): number {
    try {
      const resources = performance.getEntriesByType('resource');
      if (resources.length > 0) {
        // Calculate bytes transferred in last interval
        const recentResources = resources.slice(-10); // Last 10 resources
        const totalBytes = recentResources.reduce((sum, r: any) => {
          return sum + (r.transferSize || 0);
        }, 0);
        
        return totalBytes * 8; // bytes to bits
      }
    } catch (e) {
      // API not available
    }
    
    return 0;
  }

  /**
   * Emit resource statistics
   */
  private emitResourceStats(): void {
    window.dispatchEvent(new CustomEvent('paper:resource-stats', {
      detail: {
        cpu: this.cpuUsage,
        memory: this.memoryUsage,
        network: this.networkBandwidth,
        limits: this.getCurrentLimits()
      }
    }));
  }

  /**
   * Get current resource limits based on user activity
   */
  getCurrentLimits(): ResourceLimits {
    return {
      ...this.limits,
      cpuIdle: this.limits.cpuIdle,
      cpuActive: this.limits.cpuActive
    };
  }

  /**
   * Get current CPU limit
   */
  getCurrentCPULimit(): number {
    return this.isUserActive ? this.limits.cpuActive : this.limits.cpuIdle;
  }

  /**
   * Check if user is currently active
   */
  isActive(): boolean {
    return this.isUserActive;
  }

  /**
   * Throttle if resources are being overused
   */
  shouldThrottle(): boolean {
    // Throttle if user is active and using too much CPU
    if (this.isUserActive && this.cpuUsage > this.limits.cpuActive) {
      return true;
    }
    
    // Throttle if using too much memory
    if (this.memoryUsage > this.limits.memory) {
      return true;
    }
    
    // Throttle if using too much network
    if (this.networkBandwidth > this.limits.network) {
      return true;
    }
    
    return false;
  }

  /**
   * Get throttle factor (0-1)
   */
  getThrottleFactor(): number {
    if (!this.shouldThrottle()) return 1.0;
    
    const currentLimit = this.getCurrentCPULimit();
    const throttle = Math.min(1.0, currentLimit / this.cpuUsage);
    
    return Math.max(0.1, throttle); // Never throttle below 10%
  }

  /**
   * Adjust usage based on activity
   */
  adjustUsage(): void {
    if (this.detectUserActivity()) {
      this.throttleToMinimum();
    } else {
      this.useTargetResources();
    }
  }

  /**
   * Detect user activity
   */
  detectUserActivity(): boolean {
    // Check if user is active (keyboard, mouse, tab focus)
    return this.isUserActive || !document.hidden || document.hasFocus();
  }

  /**
   * Throttle to minimum usage
   */
  private throttleToMinimum(): void {
    window.dispatchEvent(new CustomEvent('paper:throttle', {
      detail: { factor: this.limits.cpuActive }
    }));
  }

  /**
   * Use target resources
   */
  private useTargetResources(): void {
    window.dispatchEvent(new CustomEvent('paper:throttle', {
      detail: { factor: this.limits.cpuIdle }
    }));
  }

  /**
   * Get current resource statistics
   */
  getStats(): any {
    return {
      usage: {
        cpu: this.cpuUsage,
        cpuPercent: (this.cpuUsage * 100).toFixed(1) + '%',
        memory: this.memoryUsage,
        memoryMB: (this.memoryUsage / 1024 / 1024).toFixed(1) + ' MB',
        network: this.networkBandwidth,
        networkMbps: (this.networkBandwidth / 1000000).toFixed(1) + ' Mbps'
      },
      limits: {
        cpuCurrent: this.getCurrentCPULimit(),
        cpuCurrentPercent: (this.getCurrentCPULimit() * 100).toFixed(1) + '%',
        memory: this.limits.memory,
        memoryMB: (this.limits.memory / 1024 / 1024).toFixed(0) + ' MB',
        network: this.limits.network,
        networkMbps: (this.limits.network / 1000000).toFixed(0) + ' Mbps'
      },
      activity: {
        isActive: this.isUserActive,
        lastActivity: new Date(this.lastActivity).toISOString(),
        idleTime: Date.now() - this.lastActivity
      },
      throttle: {
        shouldThrottle: this.shouldThrottle(),
        factor: this.getThrottleFactor()
      }
    };
  }

  /**
   * Update resource limits
   */
  updateLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
    console.log('[ResourceManager] Limits updated:', this.limits);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove activity listeners
    this.activityListeners.forEach(cleanup => cleanup());
    this.activityListeners = [];
    
    // Clear intervals
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
    
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
    }
  }
}

// Singleton instance
let resourceManagerInstance: ResourceManager | null = null;

export function getResourceManager(
  limits?: Partial<ResourceLimits>,
  activityConfig?: Partial<ActivityDetectionConfig>
): ResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = new ResourceManager(limits, activityConfig);
  }
  return resourceManagerInstance;
}
