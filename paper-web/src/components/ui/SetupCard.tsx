export const SetupCard = () => {
    const handleCopy = () => {
        const cmd = "curl -sL http://localhost:5173/scripts/install.sh | bash";
        // In prod, use the real domain
        navigator.clipboard.writeText(cmd);
        alert("Command copied to clipboard!");
    };

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            textAlign: 'center'
        }}>
            <div style={{ 
                width: '64px', height: '64px', background: '#222', borderRadius: '50%', margin: '0 auto 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
            }}>
                ☁️
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Initialize Paper Cloud</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                To enable <code>*.paper</code> domains on this machine, the Paper Daemon needs to be installed once.
                It runs silently in the background.
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
                marginBottom: '1rem'
            }}>
                <code className="text-sm font-mono" style={{ color: '#0070f3' }}>
                    curl -sL https://rohan.github.io/paper/scripts/install.sh | bash
                </code>
                <button className="btn" onClick={handleCopy} style={{ padding: '0.4rem 0.8rem' }}>
                    Copy
                </button>
            </div>
            
            <p className="text-xs text-secondary">
                Requires Python 3. macOS and Linux supported.
            </p>
        </div>
    );
};
