import React from 'react';
import { Cloud, Terminal, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const SCRIPT_URL = "https://rohan.github.io/paper/scripts/install.sh";

export const SetupCard = () => {
    const handleCopy = () => {
        // We add sudo here because the user explicitly wants real TLDs which requires /etc/hosts access
        navigator.clipboard.writeText(`curl -sL ${SCRIPT_URL} | sudo bash`);
        alert("Command copied! Paste it in your terminal.");
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Connection</h1>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.8rem', borderRadius: '99px',
                    background: 'rgba(245, 166, 35, 0.1)',
                    border: '1px solid rgba(245, 166, 35, 0.2)',
                    color: '#f5a623', fontSize: '0.9rem'
                }}>
                    <AlertCircle size={16} />
                    <span>Daemon Disconnected</span>
                </div>
            </div>

            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '2rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ 
                        width: '64px', height: '64px', background: 'var(--bg-surface-hover)', borderRadius: '50%', margin: '0 auto 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
                    }}>
                        <Cloud size={32} color="#888" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Install Paper Daemon</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                        To map <code>*.paper</code> domains to your local environment, you need to run the background daemon. 
                        It manages the local proxy and DNS resolution.
                    </p>

                    <div style={{ 
                        background: '#000', 
                        border: '1px solid #333', 
                        borderRadius: '8px', 
                        padding: '1.5rem',
                        maxWidth: '600px',
                        margin: '0 auto',
                        fontFamily: 'var(--font-mono)',
                        textAlign: 'left'
                    }}>
                        <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={14} />
                            <span>Requires sudo to configure /etc/hosts</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <code className="text-sm" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                curl -sL {SCRIPT_URL} | sudo bash
                            </code>
                            <button className="btn btn-primary" onClick={handleCopy} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
                                Copy Command
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '2rem', background: 'var(--bg-root)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Troubleshooting</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ color: '#0070f3' }}>1.</div>
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Site not reached (NXDOMAIN)</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    The daemon hasn't updated your hosts file. Ensure you ran the install command with sudo privileges.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ color: '#0070f3' }}>2.</div>
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Secure DNS</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    If using Chrome/Edge, disable "Secure DNS" in settings as it bypasses local domain resolution.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
