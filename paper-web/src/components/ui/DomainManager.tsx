import { useState, useEffect } from 'react';
import { Globe, Plus, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { pyodideProxyServer } from '../../lib/pyodide-proxy-server';

export const DomainManager = () => {
    const [domains, setDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        loadDomains();
        checkInitialization();
    }, []);

    const checkInitialization = async () => {
        try {
            if (!pyodideProxyServer.isInitialized()) {
                setIsInitializing(true);
                try {
                    await pyodideProxyServer.initialize();
                } catch (error: any) {
                    const initError = pyodideProxyServer.getInitializationError();
                    if (initError) {
                        console.warn('[DomainManager] Pyodide initialization failed, using fallback:', initError.message);
                    }
                }
            }
        } catch (error: any) {
            console.warn('[DomainManager] Initialization check failed:', error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    const loadDomains = async () => {
        try {
            // Ensure server is initialized
            if (!pyodideProxyServer.isInitialized()) {
                await pyodideProxyServer.initialize();
            }
            const loadedDomains = pyodideProxyServer.getDomains();
            // Filter to show only .paper domains, excluding www variants for cleaner UI
            const filtered = loadedDomains.filter(d => 
                (d.endsWith('.paper') || d === 'paper') && !d.startsWith('www.')
            );
            setDomains(filtered);
        } catch (error: any) {
            console.error('[DomainManager] Failed to load domains:', error);
        }
    };

    const validateDomain = (domain: string): string | null => {
        if (!domain || domain.trim().length === 0) {
            return 'Domain cannot be empty';
        }

        const trimmed = domain.trim().toLowerCase();

        // Must end with .paper or be exactly 'paper'
        if (!trimmed.endsWith('.paper') && trimmed !== 'paper') {
            return 'Domain must end with .paper';
        }

        // Validate format
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        const domainPart = trimmed === 'paper' ? 'paper' : trimmed.replace('.paper', '');
        
        if (!domainRegex.test(domainPart)) {
            return 'Invalid domain format';
        }

        // Check if already exists
        if (domains.includes(trimmed)) {
            return 'Domain already registered';
        }

        return null;
    };

    const handleAddDomain = async () => {
        setError(null);
        setSuccess(null);

        const validationError = validateDomain(newDomain);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        try {
            const trimmed = newDomain.trim().toLowerCase();
            const result = await pyodideProxyServer.registerDomain(trimmed);
            
            if (result.type === 'error') {
                setError(result.error || 'Failed to register domain');
            } else {
                setSuccess(`Domain ${trimmed} registered successfully!`);
                setNewDomain('');
                loadDomains();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to register domain');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveDomain = async (domain: string) => {
        if (domain === 'paper' || domain === 'blog.paper' || domain === 'shop.paper' || domain === 'test.paper') {
            setError('Cannot remove default domains');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsLoading(true);
        try {
            await pyodideProxyServer.removeDomain(domain);
            loadDomains();
            setSuccess(`Domain ${domain} removed`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to remove domain');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleAddDomain();
        }
    };

    if (isInitializing) {
        return (
            <div style={{
                padding: '2rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
            }}>
                <Loader size={24} className="spin" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                <div style={{ color: '#888' }}>Initializing domain manager...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <Globe size={24} color="#fff" />
                <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Domain Manager</h1>
            </div>

            {/* Add Domain Form */}
            <div style={{
                padding: '1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Add New Domain</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => {
                            setNewDomain(e.target.value);
                            setError(null);
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="example.paper"
                        disabled={isLoading}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: '#111',
                            border: '1px solid #333',
                            borderRadius: 'var(--radius-sm)',
                            color: '#fff',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleAddDomain}
                        disabled={isLoading || !newDomain.trim()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: isLoading ? '#333' : '#0070f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader size={16} className="spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Add Domain
                            </>
                        )}
                    </button>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.5rem' }}>
                    Enter a domain ending with <code style={{ background: '#222', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>.paper</code>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ff4444'
                }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 255, 0, 0.1)',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#00ff00'
                }}>
                    <CheckCircle size={20} />
                    <span>{success}</span>
                </div>
            )}

            {/* Domain List */}
            <div style={{
                padding: '1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
            }}>
                <div style={{ marginBottom: '1rem', fontWeight: 600 }}>
                    Registered Domains ({domains.length})
                </div>
                {domains.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                        No domains registered yet. Add your first domain above.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {domains.map((domain) => {
                            const isDefault = ['paper', 'blog.paper', 'shop.paper', 'test.paper'].includes(domain);
                            return (
                                <div
                                    key={domain}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: '#111',
                                        border: '1px solid #333',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Globe size={16} color="#888" />
                                        <code style={{ color: '#fff', fontSize: '0.9rem' }}>{domain}</code>
                                        {isDefault && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                background: '#333',
                                                borderRadius: '4px',
                                                color: '#888'
                                            }}>
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {!isDefault && (
                                        <button
                                            onClick={() => handleRemoveDomain(domain)}
                                            disabled={isLoading}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ff4444',
                                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                opacity: isLoading ? 0.5 : 1
                                            }}
                                            title="Remove domain"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

