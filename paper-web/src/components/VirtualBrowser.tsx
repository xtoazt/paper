import React, { useState, useEffect } from 'react';
import { apps, defaultHandler } from '../lib/registry';

interface VirtualBrowserProps {
    domain: string;
    onClose: () => void;
}

export const VirtualBrowser: React.FC<VirtualBrowserProps> = ({ domain, onClose }) => {
    const [path, setPath] = useState('/');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        load(path);
    }, [domain]);

    const load = async (targetPath: string) => {
        setLoading(true);
        try {
            const app = apps.find(a => a.domain === domain);
            let res;
            if (app) {
                const handlerRes = app.handler(targetPath, { 'Host': domain });
                res = handlerRes instanceof Promise ? await handlerRes : handlerRes;
            } else {
                res = defaultHandler(domain);
            }
            setContent(res.body);
            setPath(targetPath);
        } catch (e) {
            setContent(`Error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    // Intercept clicks to keep them inside the virtual browser
    const handleFrameClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A') {
            const href = (target as HTMLAnchorElement).getAttribute('href');
            if (href && href.startsWith('/')) {
                e.preventDefault();
                load(href);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
                {/* Browser Toolbar */}
                <div style={{
                    background: '#f0f0f0',
                    borderBottom: '1px solid #ccc',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={onClose} style={{
                            width: '12px', height: '12px', borderRadius: '50%', border: 'none', background: '#ff5f56', cursor: 'pointer'
                        }} title="Close"></button>
                        <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e'}}></div>
                        <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f'}}></div>
                    </div>
                    
                    <div style={{
                        flex: 1,
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '0.3rem 0.8rem',
                        fontSize: '0.9rem',
                        color: '#333',
                        fontFamily: 'sans-serif',
                        textAlign: 'center'
                    }}>
                        🔒 {domain}{path}
                    </div>

                    <button onClick={() => load(path)} style={{border: 'none', background: 'transparent', cursor: 'pointer'}}>↻</button>
                </div>

                {/* Viewport */}
                <div 
                    onClick={handleFrameClick}
                    style={{
                        flex: 1,
                        background: '#fff',
                        overflow: 'auto',
                        position: 'relative'
                    }}
                >
                    {loading && <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'blue'}}></div>}
                    
                    {/* Render HTML safely-ish */}
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            </div>
        </div>
    );
};

