// Deployment Logs View Component
// Vercel-style deployment logs

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { deploymentLogger, DeploymentLog } from '../../lib/deployment-logs';

export const DeploymentLogsView = () => {
    const [logs, setLogs] = useState<DeploymentLog[]>([]);
    const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load existing logs
        setLogs(deploymentLogger.getLogs());

        // Subscribe to new logs
        const unsubscribe = deploymentLogger.subscribe((log) => {
            setLogs(prev => [log, ...prev]);
            // Auto-scroll to bottom
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter);

    const getIcon = (level: DeploymentLog['level']) => {
        switch (level) {
            case 'success':
                return <CheckCircle size={16} color="#00ff00" />;
            case 'error':
                return <XCircle size={16} color="#ff0000" />;
            case 'warning':
                return <AlertCircle size={16} color="#ffa500" />;
            default:
                return <Info size={16} color="#0070f3" />;
        }
    };

    const getColor = (level: DeploymentLog['level']) => {
        switch (level) {
            case 'success':
                return 'rgba(0,255,0,0.1)';
            case 'error':
                return 'rgba(255,0,0,0.1)';
            case 'warning':
                return 'rgba(255,165,0,0.1)';
            default:
                return 'rgba(0,112,243,0.1)';
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0 }}>Deployment Logs</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['all', 'info', 'success', 'warning', 'error'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setFilter(level)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === level ? '#fff' : 'transparent',
                                color: filter === level ? '#000' : '#888',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                transition: 'all 0.15s'
                            }}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
            }}>
                {filteredLogs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                        No deployment logs yet. Import a repository to see logs.
                    </div>
                ) : (
                    <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem' }}>
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderLeft: `3px solid ${log.level === 'success' ? '#00ff00' : log.level === 'error' ? '#ff0000' : log.level === 'warning' ? '#ffa500' : '#0070f3'}`,
                                    background: getColor(log.level),
                                    marginBottom: '0.5rem',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div style={{ marginTop: '2px' }}>{getIcon(log.level)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#888', fontSize: '0.75rem' }}>
                                            {log.timestamp.toLocaleTimeString()}
                                        </span>
                                        {log.repo && (
                                            <span style={{ color: '#0070f3', fontSize: '0.75rem' }}>
                                                {log.repo}
                                            </span>
                                        )}
                                        {log.domain && (
                                            <span style={{ color: '#00ff00', fontSize: '0.75rem' }}>
                                                → {log.domain}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ color: '#fff', marginBottom: log.details ? '0.25rem' : 0 }}>
                                        {log.message}
                                    </div>
                                    {log.details && (
                                        <div style={{ color: '#888', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                            {log.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>
        </div>
    );
};

