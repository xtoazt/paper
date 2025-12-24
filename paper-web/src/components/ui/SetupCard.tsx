import React from 'react';
import { Shield, Lock, HardDrive } from 'lucide-react';

export const SetupCard = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
            <div style={{ 
                width: '80px', height: '80px', background: 'rgba(0,255,0,0.1)', borderRadius: '50%', margin: '0 auto 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #00ff00'
            }}>
                <Lock size={40} color="#00ff00" />
            </div>
            
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>System Auto-Initialized</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Paper is running entirely in your browser. The Service Worker has been registered automatically.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                <Feature icon={<Shield size={20} />} title="Zero Trust" desc="No external servers. Everything runs locally." />
                <Feature icon={<HardDrive size={20} />} title="Persistent" desc="Data stored in IndexedDB on your device." />
                <Feature icon={<Lock size={20} />} title="Private" desc="No telemetry. No tracking. No data collection." />
            </div>
        </div>
    );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'left' }}>
        <div style={{ marginBottom: '0.5rem', color: '#fff' }}>{icon}</div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#fff' }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: '#888' }}>{desc}</div>
    </div>
);
