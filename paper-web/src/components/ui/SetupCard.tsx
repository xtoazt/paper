import React from 'react';
import { Cloud, Terminal } from 'lucide-react';

const SCRIPT_URL = "https://rohan.github.io/paper/scripts/install.sh"; // Placeholder

export const SetupCard = () => {
    const handleCopy = () => {
        navigator.clipboard.writeText(`curl -sL ${SCRIPT_URL} | bash`);
        alert("Command copied to clipboard!");
    };

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            margin: '4rem auto',
            textAlign: 'center'
        }}>
            <div style={{ 
                width: '64px', height: '64px', background: 'var(--bg-surface-hover)', borderRadius: '50%', margin: '0 auto 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
            }}>
                <Cloud size={32} color="#888" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Initialize Local Runtime</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                To enable <code>*.paper</code> domains on this machine, the Paper Daemon needs to be installed once.
            </p>

            <div style={{ 
                background: '#000', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-mono)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <Terminal size={16} color="#444" />
                    <code className="text-sm" style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        curl -sL {SCRIPT_URL} | bash
                    </code>
                </div>
                <button className="btn" onClick={handleCopy} style={{ padding: '0.4rem 0.8rem' }}>
                    Copy
                </button>
            </div>
            
            <p className="text-xs text-secondary">
                Runs silently in the background. macOS and Linux supported.
            </p>
        </div>
    );
};
