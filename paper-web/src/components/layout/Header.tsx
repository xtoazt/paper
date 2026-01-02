import React from 'react';

interface RuntimeStatusProps {
    connected: boolean;
}

export const Header: React.FC<RuntimeStatusProps> = ({ connected }) => {
    return (
        <header style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            background: 'var(--bg-root)' // Transparent/Root
        }}>
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>rohan</span>
                <span>/</span>
                <span style={{ color: 'var(--text-primary)' }}>paper-demo</span>
            </div>

            {/* Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.8rem', borderRadius: '99px',
                    background: connected ? 'rgba(0, 112, 243, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${connected ? 'rgba(0, 112, 243, 0.2)' : 'var(--border)'}`
                }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: connected ? '#0070f3' : '#666',
                        boxShadow: connected ? '0 0 8px #0070f3' : 'none'
                    }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: connected ? '#0070f3' : '#888' }}>
                        {connected ? 'Runtime Active' : 'Runtime Offline'}
                    </span>
                </div>
            </div>
        </header>
    );
};




