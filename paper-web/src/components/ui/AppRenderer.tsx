import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface AppRendererProps {
    domain: string;
    onClose: () => void;
}

export const AppRenderer: React.FC<AppRendererProps> = ({ domain, onClose }) => {
    // We use the Gateway URL pattern which the Service Worker intercepts
    // The trailing slash is crucial for relative link resolution
    const startUrl = `/_gateway/${domain}/`;

    useEffect(() => {
        // URL Illusion: Update the browser's URL bar without navigating
        window.history.pushState({ app: domain }, '', `/app/${domain}`);
        
        const handlePopState = () => {
             onClose();
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Cleanup URL on exit
            window.history.pushState({}, '', '/');
        };
    }, [domain, onClose]);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#fff',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Minimalist Floating Close Button (Mac-style) */}
            <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 2001,
                display: 'flex',
                gap: '8px',
                opacity: 0.1, // Fade out when not hovering
                transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.1'}
            >
                <button 
                    onClick={onClose}
                    style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    title="Close App"
                >
                    <X size={16} />
                </button>
            </div>

            {/* The "Sandbox" - A full-screen iframe that thinks it's the app */}
            <iframe 
                src={startUrl}
                style={{ 
                    flex: 1, 
                    border: 'none', 
                    width: '100%', 
                    height: '100%',
                    background: '#fff' // Prevent flash
                }}
                title={domain}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
        </div>
    );
};

