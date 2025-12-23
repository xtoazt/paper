export const Sidebar = () => {
    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)'
        }}>
            {/* Logo Area */}
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '32px', height: '32px', background: '#fff', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold'
                }}>
                    P
                </div>
                <span style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>Paper Cloud</span>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '0 1rem' }}>
                <div className="text-xs text-secondary" style={{ marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>PLATFORM</div>
                <NavItem icon="⚡" label="Overview" active />
                <NavItem icon="📦" label="Deployments" />
                <NavItem icon="🌐" label="Domains" />
                <NavItem icon="⚙️" label="Settings" />

                <div className="text-xs text-secondary" style={{ marginTop: '2rem', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>CONNECTIVITY</div>
                <NavItem icon="🔌" label="Ingress" />
                <NavItem icon="📝" label="Logs" />
            </nav>

            {/* User Profile */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, #333, #666)' }}></div>
                    <div className="text-sm">User</div>
                </div>
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) => (
    <div style={{
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        background: active ? 'var(--bg-surface-hover)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        marginBottom: '2px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.9rem',
        fontWeight: 500
    }}>
        <span>{icon}</span>
        <span>{label}</span>
    </div>
);

