/**
 * Log Aggregator
 * Collect, aggregate, and stream logs
 */

import { getLogger, LogEntry, LogLevel } from './logger';

export interface LogAggregation {
  startTime: number;
  endTime: number;
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  topMessages: Array<{ message: string; count: number }>;
  errorRate: number;
}

export class LogAggregator {
  private logger = getLogger();
  private aggregationInterval = 60000; // 1 minute
  private aggregations: LogAggregation[] = [];
  private maxAggregations = 1440; // 24 hours worth

  /**
   * Start log aggregation
   */
  start(): () => void {
    const timer = setInterval(() => {
      this.aggregate();
    }, this.aggregationInterval);

    return () => clearInterval(timer);
  }

  /**
   * Aggregate logs for the current period
   */
  private aggregate(): void {
    const endTime = Date.now();
    const startTime = endTime - this.aggregationInterval;
    
    const logs = this.logger.getAllLogs(startTime);
    
    if (logs.length === 0) return;

    // Count by level
    const byLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0
    };

    // Count messages
    const messageCounts = new Map<string, number>();

    logs.forEach(log => {
      byLevel[log.level]++;
      
      const count = messageCounts.get(log.message) || 0;
      messageCounts.set(log.message, count + 1);
    });

    // Get top messages
    const topMessages = Array.from(messageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error rate
    const errorRate = logs.length > 0 
      ? byLevel[LogLevel.ERROR] / logs.length 
      : 0;

    const aggregation: LogAggregation = {
      startTime,
      endTime,
      totalLogs: logs.length,
      byLevel,
      topMessages,
      errorRate
    };

    this.aggregations.push(aggregation);

    // Trim old aggregations
    if (this.aggregations.length > this.maxAggregations) {
      this.aggregations = this.aggregations.slice(-this.maxAggregations);
    }

    console.log('[LogAggregator] Aggregated', logs.length, 'logs');
  }

  /**
   * Get aggregations for a time range
   */
  getAggregations(since?: number): LogAggregation[] {
    if (!since) return [...this.aggregations];
    return this.aggregations.filter(agg => agg.endTime >= since);
  }

  /**
   * Get summary statistics
   */
  getSummary(hours: number = 1): {
    totalLogs: number;
    avgLogsPerMinute: number;
    errorRate: number;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    const aggs = this.getAggregations(since);

    if (aggs.length === 0) {
      return {
        totalLogs: 0,
        avgLogsPerMinute: 0,
        errorRate: 0,
        topErrors: []
      };
    }

    const totalLogs = aggs.reduce((sum, agg) => sum + agg.totalLogs, 0);
    const totalErrors = aggs.reduce((sum, agg) => sum + agg.byLevel[LogLevel.ERROR], 0);
    const minutes = (aggs[aggs.length - 1].endTime - aggs[0].startTime) / 60000;

    // Aggregate top messages across periods
    const messageCounts = new Map<string, number>();
    aggs.forEach(agg => {
      agg.topMessages.forEach(({ message, count }) => {
        const current = messageCounts.get(message) || 0;
        messageCounts.set(message, current + count);
      });
    });

    const topErrors = Array.from(messageCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLogs,
      avgLogsPerMinute: minutes > 0 ? totalLogs / minutes : 0,
      errorRate: totalLogs > 0 ? totalErrors / totalLogs : 0,
      topErrors
    };
  }

  /**
   * Clear aggregations
   */
  clear(): void {
    this.aggregations = [];
  }
}

// Singleton instance
let aggregatorInstance: LogAggregator | null = null;

/**
 * Get singleton log aggregator
 */
export function getLogAggregator(): LogAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new LogAggregator();
  }
  return aggregatorInstance;
}

/**
 * Start log aggregation
 */
export function startLogAggregation(): () => void {
  const aggregator = getLogAggregator();
  return aggregator.start();
}
