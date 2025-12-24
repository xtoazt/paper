import React from 'react';
import { VirtualApp } from '../../lib/registry';
import { ExternalLink, Layers, Plus } from 'lucide-react';

interface AppGridProps {
    apps: VirtualApp[];
    onOpen: (domain: string) => void;
    onImport?: () => void;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, onOpen, onImport }) => {
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginTop: '2rem' 
        }}>
            {apps.map(app => (
                <div key={app.domain} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div className="flex justify-between items-center">
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layers size={20} color="#666" />
                            {app.name}
                        </div>
                        <div style={{ 
                            width: '8px', height: '8px', borderRadius: '50%', 
                            background: '#0070f3', boxShadow: '0 0 10px rgba(0,112,243,0.5)' 
                        }}></div>
                    </div>
                    
                    <p className="text-sm text-secondary" style={{ margin: 0, flex: 1, lineHeight: '1.5' }}>
                        {app.description}
                    </p>

                    <button
                        onClick={() => onOpen(app.domain)}
                        className="btn"
                        style={{ justifyContent: 'center', width: '100%' }}
                    >
                        <span>Open App</span>
                        <ExternalLink size={14} />
                    </button>
                </div>
            ))}

            {/* Import Card */}
            <div 
                onClick={onImport}
                style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'var(--bg-surface)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface-hover)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                }}
            >
                <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Plus size={20} />
                </div>
                <span style={{ fontWeight: 500 }}>Import Repository</span>
            </div>
        </div>
    );
};
