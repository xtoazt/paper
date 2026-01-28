/**
 * Structured Logging System
 * JSON logs with context and metadata
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private listeners: Set<(entry: LogEntry) => void> = new Set();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }, error?.stack);
  }

  /**
   * Core log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      stack,
      sessionId: this.sessionId
    };

    // Add to memory
    this.logs.push(entry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(entry));

    // Console output
    this.consoleOutput(entry);
  }

  /**
   * Output to console with formatting
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.context || '', entry.stack || '');
        break;
    }
  }

  /**
   * Get logs by level
   */
  getLogs(level?: LogLevel, since?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (since) {
      filtered = filtered.filter(log => log.timestamp >= since);
    }

    return [...filtered];
  }

  /**
   * Get all logs
   */
  getAllLogs(since?: number): LogEntry[] {
    if (!since) return [...this.logs];
    return this.logs.filter(log => log.timestamp >= since);
  }

  /**
   * Search logs
   */
  searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.context || {}).toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Subscribe to logs
   */
  subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Export logs as JSON
   */
  exportJSON(since?: number): string {
    const logs = this.getAllLogs(since);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportCSV(since?: number): string {
    const logs = this.getAllLogs(since);
    
    const header = 'Timestamp,Level,Message,Context\n';
    const rows = logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const context = JSON.stringify(log.context || {}).replace(/"/g, '""');
      const message = log.message.replace(/"/g, '""');
      return `"${timestamp}","${log.level}","${message}","${context}"`;
    }).join('\n');

    return header + rows;
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentErrors: number;
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    return {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
        [LogLevel.INFO]: this.logs.filter(l => l.level === LogLevel.INFO).length,
        [LogLevel.WARN]: this.logs.filter(l => l.level === LogLevel.WARN).length,
        [LogLevel.ERROR]: this.logs.filter(l => l.level === LogLevel.ERROR).length
      },
      recentErrors: this.logs.filter(l =>
        l.level === LogLevel.ERROR && l.timestamp >= oneHourAgo
      ).length
    };
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Get singleton logger instance
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

// Convenience exports
const logger = getLogger();
export const log = {
  debug: (msg: string, ctx?: Record<string, any>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, any>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, any>) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error, ctx?: Record<string, any>) => logger.error(msg, err, ctx)
};
