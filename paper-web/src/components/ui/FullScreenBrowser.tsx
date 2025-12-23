import React, { useState, useEffect } from 'react';
import { runtime } from '../../lib/runtime';

interface FullScreenBrowserProps {
    domain: string;
    onClose: () => void;
}

export const FullScreenBrowser: React.FC<FullScreenBrowserProps> = ({ domain, onClose }) => {
    const [path, setPath] = useState('/');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        load(path);
    }, [domain]);

    const load = async (targetPath: string) => {
        setLoading(true);
        try {
            const res = await runtime.handleRequest(domain, targetPath);
            setContent(res.body);
            setPath(targetPath);
            
            // Update URL bar to fake it (cosmetic only)
            window.history.pushState({}, '', `/app/${domain}${targetPath}`);
        } catch (e) {
            setContent(`Error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFrameClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href) {
                e.preventDefault();
                if (href.startsWith('/') || href.startsWith('http')) {
                    load(href);
                } else if (href === '#back') {
                    onClose();
                }
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#fff',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Native-looking URL bar */}
            <div style={{
                background: '#f1f3f4',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid #dadce0'
            }}>
                <button onClick={onClose} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', padding: '4px'
                }}>✕</button>
                
                <button onClick={() => load(path)} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px'
                }}>↻</button>

                <div style={{
                    flex: 1,
                    background: '#fff',
                    border: '1px solid #f1f3f4', // Invisible border
                    borderRadius: '16px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    color: '#202124',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{color: '#5f6368', marginRight: '4px'}}>https://</span>
                    <span>{domain}</span>
                    <span style={{color: '#80868b'}}>{path === '/' ? '' : path}</span>
                </div>
            </div>

            {/* Viewport */}
            <div 
                onClick={handleFrameClick}
                style={{ flex: 1, overflow: 'auto', position: 'relative' }}
            >
                {loading && <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#1a73e8'}}></div>}
                <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
};

