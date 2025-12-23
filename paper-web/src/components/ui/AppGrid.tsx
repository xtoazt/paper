import React from 'react';
import { VirtualApp } from '../../lib/registry';

interface AppGridProps {
    apps: VirtualApp[];
    onOpen: (domain: string) => void;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, onOpen }) => {
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem' 
        }}>
            {apps.map(app => (
                <div key={app.domain} 
                    onClick={() => onOpen(app.domain)}
                    style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div className="flex justify-between items-center">
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{app.name}</div>
                        <div style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: '#0070f3', boxShadow: '0 0 10px rgba(0,112,243,0.5)' 
                        }}></div>
                    </div>
                    
                    <p className="text-sm text-secondary" style={{ margin: 0, flex: 1 }}>
                        {app.description}
                    </p>

                    <div style={{ 
                        background: '#111', padding: '0.5rem', borderRadius: '4px',
                        fontSize: '0.8rem', fontFamily: 'monospace', color: '#888',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span>{app.domain}</span>
                        <span style={{ color: '#fff' }}>Open ↗</span>
                    </div>
                </div>
            ))}


            {/* Import Card */}
            <div style={{
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ fontSize: '1.5rem' }}>+</div>
                <span>New Project</span>
            </div>
        </div>
    );
};

