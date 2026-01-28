/**
 * Metrics Collector
 * Real-time performance and usage metrics
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface RequestMetric extends Metric {
  method: string;
  path: string;
  status: number;
  duration: number;
  size?: number;
}

export interface ResourceMetric extends Metric {
  cpu: number;
  memory: number;
  bandwidth: number;
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private listeners: Set<(metric: Metric) => void> = new Set();

  /**
   * Record a metric
   */
  record(metric: Metric): void {
    this.metrics.push(metric);
    
    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metric));
  }

  /**
   * Record request metric
   */
  recordRequest(data: {
    method: string;
    path: string;
    status: number;
    duration: number;
    size?: number;
  }): void {
    const metric: RequestMetric = {
      name: 'http.request',
      value: data.duration,
      timestamp: Date.now(),
      method: data.method,
      path: data.path,
      status: data.status,
      duration: data.duration,
      size: data.size,
      tags: {
        method: data.method,
        status: data.status.toString()
      }
    };

    this.record(metric);
  }

  /**
   * Record resource usage
   */
  recordResourceUsage(): void {
    if (typeof performance === 'undefined') return;

    const memory = (performance as any).memory;
    
    const metric: ResourceMetric = {
      name: 'resource.usage',
      value: memory?.usedJSHeapSize || 0,
      timestamp: Date.now(),
      cpu: 0, // Browser doesn't expose CPU usage
      memory: memory?.usedJSHeapSize || 0,
      bandwidth: 0, // Would need network API
      tags: {
        type: 'memory'
      }
    };

    this.record(metric);
  }

  /**
   * Record custom metric
   */
  recordCustom(name: string, value: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags
    });
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, since?: number): Metric[] {
    return this.metrics.filter(m => 
      m.name === name && 
      (!since || m.timestamp >= since)
    );
  }

  /**
   * Get all metrics
   */
  getAllMetrics(since?: number): Metric[] {
    if (!since) return [...this.metrics];
    return this.metrics.filter(m => m.timestamp >= since);
  }

  /**
   * Get metrics summary
   */
  getSummary(name: string, since?: number): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const metrics = this.getMetrics(name, since);
    
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    };
  }

  /**
   * Subscribe to metrics
   */
  subscribe(listener: (metric: Metric) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Start automatic resource monitoring
   */
  startMonitoring(interval: number = 5000): () => void {
    const timer = setInterval(() => {
      this.recordResourceUsage();
    }, interval);

    return () => clearInterval(timer);
  }
}

// Singleton instance
let metricsCollectorInstance: MetricsCollector | null = null;

/**
 * Get singleton metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new MetricsCollector();
  }
  return metricsCollectorInstance;
}

/**
 * Start automatic metrics collection
 */
export function startMetricsCollection(interval?: number): () => void {
  const collector = getMetricsCollector();
  return collector.startMonitoring(interval);
}
