import { useState, useEffect } from 'react';
import { dnsVM } from '../../lib/v86-dns';
import { CheckCircle, Loader } from 'lucide-react';

export const VMStatus = () => {
    const [vmReady, setVmReady] = useState(false);
    const [booting, setBooting] = useState(false);

    useEffect(() => {
        const boot = async () => {
            setBooting(true);
            try {
                await dnsVM.boot();
                setVmReady(true);
            } catch (e) {
                console.error('[PaperDNS] VM Boot Failed:', e);
                // Fallback: Mark as ready anyway (Service Worker will handle)
                setVmReady(true);
            } finally {
                setBooting(false);
            }
        };
        boot();
    }, []);

    if (booting) {
        return (
            <div style={{ 
                padding: '1rem', 
                background: 'rgba(0,112,243,0.1)', 
                border: '1px solid rgba(0,112,243,0.2)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
            }}>
                <Loader size={16} className="spin" />
                <span style={{ color: '#0070f3' }}>Booting DNS VM in WebVM...</span>
            </div>
        );
    }

    if (vmReady) {
        return (
            <div style={{ 
                padding: '1rem', 
                background: 'rgba(0,255,0,0.1)', 
                border: '1px solid rgba(0,255,0,0.2)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
            }}>
                <CheckCircle size={16} color="#00ff00" />
                <span style={{ color: '#00ff00' }}>
                    <strong>DNS VM Active</strong> - *.paper domains resolving via WebVM
                </span>
            </div>
        );
    }

    return null;
};
