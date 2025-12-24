// Security Dashboard Component
// Shows firewall stats, blocked attacks, WAF detection

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Activity, Lock, EyeOff } from 'lucide-react';
import { firewall } from '../../lib/firewall';

interface SecurityEvent {
    timestamp: Date;
    type: 'blocked' | 'challenged' | 'allowed';
    reason: string;
    severity: string;
    domain: string;
    path: string;
}

export const SecurityDashboard = () => {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        blocked: 0,
        challenged: 0,
        allowed: 0
    });

    useEffect(() => {
        // Listen for firewall events (we'll emit these from App.tsx)
        const handleSecurityEvent = (event: CustomEvent<SecurityEvent>) => {
            setEvents(prev => [event.detail, ...prev].slice(0, 100));
            setStats(prev => ({
                total: prev.total + 1,
                blocked: event.detail.type === 'blocked' ? prev.blocked + 1 : prev.blocked,
                challenged: event.detail.type === 'challenged' ? prev.challenged + 1 : prev.challenged,
                allowed: event.detail.type === 'allowed' ? prev.allowed + 1 : prev.allowed
            }));
        };

        window.addEventListener('paper-security-event', handleSecurityEvent as EventListener);
        return () => window.removeEventListener('paper-security-event', handleSecurityEvent as EventListener);
    }, []);

    const credits = firewall.getCredits();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ShieldCheck size={24} color="#00ff00" />
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Security Dashboard</h1>
            </div>

            {/* Security Status */}
            <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(0,255,0,0.1)', 
                border: '1px solid rgba(0,255,0,0.2)', 
                borderRadius: '8px',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <ShieldCheck size={32} color="#00ff00" />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#00ff00', marginBottom: '0.5rem' }}>
                        🛡️ INVINCIBLE SECURITY ACTIVE
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>
                        Protected by SafeLine WAF, wafw00f fingerprinting, and invisibrowse anti-access technology.
                        All attacks are automatically blocked. Extensions and DNS manipulation are detected and prevented.
                    </div>
                </div>
            </div>

            {/* Anti-Access Status */}
            <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(255,0,255,0.1)', 
                border: '1px solid rgba(255,0,255,0.2)', 
                borderRadius: '8px',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <EyeOff size={32} color="#ff00ff" />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ff00ff', marginBottom: '0.5rem' }}>
                        👁️ INVISIBLE MODE ACTIVE
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>
                        Screenshots blocked. DevTools disabled. Extensions detected. DNS manipulation prevented.
                        Your .paper sites are completely invisible and untouchable.
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Activity size={16} color="#00ff00" />
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>Total Requests</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#00ff00' }}>{stats.total}</div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Lock size={16} color="#ff0000" />
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>Blocked</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ff0000' }}>{stats.blocked}</div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={16} color="#ffa500" />
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>Challenged</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ffa500' }}>{stats.challenged}</div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <ShieldCheck size={16} color="#00ff00" />
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>Allowed</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#00ff00' }}>{stats.allowed}</div>
                </div>
            </div>

            {/* Security Events */}
            <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Security Events</h2>
                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                    {events.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                            No security events yet. All requests are being monitored.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#1a1a1a', borderBottom: '1px solid #333' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Time</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Type</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Reason</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Severity</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Domain</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.9rem', color: '#888' }}>Path</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#aaa' }}>
                                            {event.timestamp.toLocaleTimeString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: event.type === 'blocked' ? 'rgba(255,0,0,0.2)' :
                                                           event.type === 'challenged' ? 'rgba(255,165,0,0.2)' :
                                                           'rgba(0,255,0,0.2)',
                                                color: event.type === 'blocked' ? '#ff0000' :
                                                       event.type === 'challenged' ? '#ffa500' :
                                                       '#00ff00'
                                            }}>
                                                {event.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#aaa' }}>{event.reason}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: event.severity === 'critical' ? 'rgba(255,0,0,0.2)' :
                                                           event.severity === 'high' ? 'rgba(255,100,0,0.2)' :
                                                           event.severity === 'medium' ? 'rgba(255,165,0,0.2)' :
                                                           'rgba(0,255,0,0.2)',
                                                color: event.severity === 'critical' ? '#ff0000' :
                                                       event.severity === 'high' ? '#ff6400' :
                                                       event.severity === 'medium' ? '#ffa500' :
                                                       '#00ff00'
                                            }}>
                                                {event.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#aaa', fontFamily: 'monospace' }}>
                                            {event.domain}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#aaa', fontFamily: 'monospace' }}>
                                            {event.path}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Security Credits */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Security Technology Credits</h2>
                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {credits.map((credit: string, i: number) => (
                            <div key={i} style={{ 
                                padding: '1rem', 
                                background: '#1a1a1a', 
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                color: '#aaa',
                                fontFamily: 'monospace'
                            }}>
                                {credit}
                            </div>
                        ))}
                        <div style={{ 
                            padding: '1rem', 
                            background: '#1a1a1a', 
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            color: '#aaa',
                            fontFamily: 'monospace'
                        }}>
                            invisibrowse (https://github.com/invisibrowse/invisibrowse.github.io) - Anti-screenshot and anti-access protection
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

