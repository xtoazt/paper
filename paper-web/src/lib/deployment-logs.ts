// Deployment Logs System
// Tracks import, build, and deployment events

export interface DeploymentLog {
    id: string;
    timestamp: Date;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    details?: string;
    repo?: string;
    domain?: string;
}

class DeploymentLogger {
    private logs: DeploymentLog[] = [];
    private maxLogs = 500;
    private listeners: Set<(log: DeploymentLog) => void> = new Set();

    log(level: DeploymentLog['level'], message: string, details?: string, repo?: string, domain?: string) {
        const log: DeploymentLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            level,
            message,
            details,
            repo,
            domain
        };

        this.logs.unshift(log);
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Notify listeners
        this.listeners.forEach(listener => listener(log));
    }

    info(message: string, details?: string, repo?: string, domain?: string) {
        this.log('info', message, details, repo, domain);
    }

    success(message: string, details?: string, repo?: string, domain?: string) {
        this.log('success', message, details, repo, domain);
    }

    warning(message: string, details?: string, repo?: string, domain?: string) {
        this.log('warning', message, details, repo, domain);
    }

    error(message: string, details?: string, repo?: string, domain?: string) {
        this.log('error', message, details, repo, domain);
    }

    getLogs(): DeploymentLog[] {
        return [...this.logs];
    }

    getLogsByRepo(repo: string): DeploymentLog[] {
        return this.logs.filter(log => log.repo === repo);
    }

    clear() {
        this.logs = [];
    }

    subscribe(listener: (log: DeploymentLog) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export const deploymentLogger = new DeploymentLogger();




