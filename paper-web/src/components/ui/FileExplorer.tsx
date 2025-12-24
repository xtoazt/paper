import React from 'react';
import { Folder, File, Lock, HardDrive } from 'lucide-react';
import { runtime } from '../../lib/runtime';

export const FileExplorer = () => {
    // This is a simple view into the runtime's memory
    // In a real app, this would be recursive
    const [files, setFiles] = React.useState<string[]>([]);

    React.useEffect(() => {
        // Expose a method on runtime to list files
        setFiles(runtime.listFiles());
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Storage</h1>
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.8rem', borderRadius: '99px',
                    background: 'rgba(0, 255, 0, 0.1)',
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                    color: '#00ff00', fontSize: '0.9rem'
                }}>
                    <Lock size={14} />
                    <span>Encrypted (OPFS)</span>
                </div>
            </div>

            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1.5rem',
                minHeight: '400px'
            }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <HardDrive size={16} />
                    <span className="font-mono">/home/webvm/</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {files.length === 0 && (
                        <div style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                            Disk is empty. Import a repo to see files here.
                        </div>
                    )}
                    
                    {/* Mock Folders */}
                    <div style={{ 
                        padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', background: 'rgba(255,255,255,0.02)'
                    }}>
                        <Folder size={32} color="#0070f3" fill="rgba(0,112,243,0.2)" />
                        <span className="text-sm">apps</span>
                    </div>

                    {files.map(f => (
                        <div key={f} style={{ 
                            padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            cursor: 'pointer', background: 'rgba(255,255,255,0.02)'
                        }}>
                            <File size={32} color="#888" />
                            <span className="text-sm font-mono" style={{ wordBreak: 'break-all' }}>
                                {f.split('/').pop()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

