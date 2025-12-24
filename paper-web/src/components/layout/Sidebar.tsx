import { Home, Activity, FileText, HardDrive, ShieldCheck, GitBranch, Settings } from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
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
                <NavItem 
                    icon={<Home size={18} />} 
                    label="Overview" 
                    active={currentView === 'overview'} 
                    onClick={() => onNavigate('overview')}
                />
                <NavItem 
                    icon={<HardDrive size={18} />} 
                    label="Storage" 
                    active={currentView === 'files'} 
                    onClick={() => onNavigate('files')}
                />

                <div className="text-xs text-secondary" style={{ marginTop: '2rem', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>SYSTEM</div>
                <NavItem 
                    icon={<Activity size={18} />} 
                    label="Connection" 
                    active={currentView === 'connect'}
                    onClick={() => onNavigate('connect')}
                />
                <NavItem 
                    icon={<FileText size={18} />} 
                    label="Traffic Logs" 
                    active={currentView === 'logs'}
                    onClick={() => onNavigate('logs')}
                />
                <NavItem 
                    icon={<GitBranch size={18} />} 
                    label="Deployments" 
                    active={currentView === 'deployments'}
                    onClick={() => onNavigate('deployments')}
                />
                <NavItem 
                    icon={<ShieldCheck size={18} />} 
                    label="Security" 
                    active={currentView === 'security'}
                    onClick={() => onNavigate('security')}
                />
                <NavItem 
                    icon={<Settings size={18} />} 
                    label="Settings" 
                    active={currentView === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
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

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        style={{
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
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span>{label}</span>
    </div>
);
