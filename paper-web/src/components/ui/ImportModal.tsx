// Vercel-style UI Components
// Modern, clean, professional design

import { useState } from 'react';
import { Plus, X, Loader } from 'lucide-react';
import { createRepoApp, registerApp } from '../../lib/registry';
import { deploymentLogger } from '../../lib/deployment-logs';

interface ImportModalProps {
    onClose: () => void;
    onImport: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        if (!repoUrl.trim()) {
            setError('Please enter a repository URL');
            return;
        }

        setImporting(true);
        setError(null);

        try {
            deploymentLogger.info(`Starting import...`, repoUrl);
            const app = await createRepoApp(repoUrl.trim());
            registerApp(app);
            deploymentLogger.success(`Import complete`, `Available at ${app.domain}`, repoUrl, app.domain);
            onImport();
            onClose();
        } catch (e: any) {
            setError(e.message || 'Failed to import repository');
            deploymentLogger.error(`Import failed`, e.message, repoUrl);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }} onClick={onClose}>
            <div style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Import Repository</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
                        Repository URL
                    </label>
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="github.com/user/repo or user/repo or gitlab.com/user/repo"
                        disabled={importing}
                        onKeyDown={(e) => e.key === 'Enter' && !importing && handleImport()}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#000',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.875rem',
                            outline: 'none',
                            transition: 'border-color 0.15s'
                        }}
                    />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                        Supports GitHub, GitLab, Bitbucket, and raw Git URLs
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(255,0,0,0.1)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderRadius: '6px',
                        color: '#ff0000',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={importing}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'transparent',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#fff',
                            cursor: importing ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing || !repoUrl.trim()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: importing ? '#333' : '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            color: importing ? '#888' : '#000',
                            cursor: importing || !repoUrl.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {importing ? (
                            <>
                                <Loader size={16} className="spin" />
                                Importing...
                            </>
                        ) : (
                            'Import'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

