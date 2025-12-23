import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export interface LogEntry {
    id: string;
    timestamp: Date;
    method: string;
    domain: string;
    path: string;
    status: number;
    duration: number;
}

interface LogsViewProps {
    logs: LogEntry[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Traffic Logs</h1>
                <div className="text-sm text-secondary">
                    Live ingress traffic via Daemon
                </div>
            </div>

            <div style={{
                background: '#000',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 80px 180px 1fr 80px 80px',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    fontWeight: 500
                }}>
                    <div>TIME</div>
                    <div>METHOD</div>
                    <div>DOMAIN</div>
                    <div>PATH</div>
                    <div>STATUS</div>
                    <div>LATENCY</div>
                </div>

                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {logs.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#444' }}>
                            No traffic recorded yet. Open an app to generate logs.
                        </div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '100px 80px 180px 1fr 80px 80px',
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #222',
                            color: 'var(--text-primary)',
                            alignItems: 'center'
                        }}>
                            <div style={{ color: '#666' }}>
                                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                            </div>
                            <div style={{ 
                                color: log.method === 'GET' ? '#0070f3' : '#f5a623',
                                fontWeight: 600
                            }}>
                                {log.method}
                            </div>
                            <div style={{ color: '#fff' }}>{log.domain}</div>
                            <div style={{ color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {log.path}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {log.status >= 200 && log.status < 300 ? (
                                    <CheckCircle size={14} color="#0070f3" />
                                ) : (
                                    <XCircle size={14} color="#ff0000" />
                                )}
                                <span style={{ color: log.status >= 200 && log.status < 300 ? '#0070f3' : '#ff0000' }}>
                                    {log.status}
                                </span>
                            </div>
                            <div style={{ color: '#666' }}>{log.duration}ms</div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>
            </div>
        </div>
    );
};

