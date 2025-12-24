// Dashboard Settings Component
// Controls dev mode and screenshot blocking

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Code, Shield } from 'lucide-react';
import { BrowserExploit } from '../../lib/browser-exploit';
import { unbreakableWall } from '../../lib/unbreakable-wall';
import { unbreakableFirewall } from '../../lib/unbreakable-firewall';
import { antiAccess } from '../../lib/anti-access';

export const DashboardSettings = () => {
    const [devModeAllowed, setDevModeAllowed] = useState(false);
    const [screenshotsAllowed, setScreenshotsAllowed] = useState(false);
    const [wallActive, setWallActive] = useState(true);

    useEffect(() => {
        // Load saved settings
        const savedDevMode = localStorage.getItem('paper-dev-mode') === 'true';
        const savedScreenshots = localStorage.getItem('paper-screenshots') === 'true';
        const savedWall = localStorage.getItem('paper-wall') !== 'false';

        setDevModeAllowed(savedDevMode);
        setScreenshotsAllowed(savedScreenshots);
        setWallActive(savedWall);

        // Apply settings
        BrowserExploit.getInstance().allowDevMode(savedDevMode);
        BrowserExploit.getInstance().allowScreenshots(savedScreenshots);
        antiAccess.allowDevMode(savedDevMode);
        antiAccess.allowScreenshots(savedScreenshots);
        if (savedWall) {
            unbreakableFirewall.enable();
            unbreakableWall.enable();
        } else {
            unbreakableFirewall.disable();
            unbreakableWall.disable();
        }
    }, []);

    const toggleDevMode = (enabled: boolean) => {
        setDevModeAllowed(enabled);
        localStorage.setItem('paper-dev-mode', enabled.toString());
        BrowserExploit.getInstance().allowDevMode(enabled);
        antiAccess.allowDevMode(enabled);
    };

    const toggleScreenshots = (enabled: boolean) => {
        setScreenshotsAllowed(enabled);
        localStorage.setItem('paper-screenshots', enabled.toString());
        BrowserExploit.getInstance().allowScreenshots(enabled);
        antiAccess.allowScreenshots(enabled);
    };

    const toggleWall = (enabled: boolean) => {
        setWallActive(enabled);
        localStorage.setItem('paper-wall', enabled.toString());
        if (enabled) {
            unbreakableFirewall.enable();
            unbreakableWall.enable();
        } else {
            unbreakableFirewall.disable();
            unbreakableWall.disable();
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <Settings size={24} color="#fff" />
                <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Dev Mode Toggle */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Code size={24} color="#888" />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Developer Mode</div>
                            <div style={{ fontSize: '0.875rem', color: '#888' }}>
                                Allow DevTools, view source, and debugging
                            </div>
                        </div>
                    </div>
                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                    }}>
                        <input
                            type="checkbox"
                            checked={devModeAllowed}
                            onChange={(e) => toggleDevMode(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: devModeAllowed ? '#00ff00' : '#333',
                            borderRadius: '24px',
                            transition: '0.3s'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: devModeAllowed ? '26px' : '3px',
                                bottom: '3px',
                                background: '#fff',
                                borderRadius: '50%',
                                transition: '0.3s'
                            }}></span>
                        </span>
                    </label>
                </div>

                {/* Screenshots Toggle */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {screenshotsAllowed ? <Eye size={24} color="#888" /> : <EyeOff size={24} color="#888" />}
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Allow Screenshots</div>
                            <div style={{ fontSize: '0.875rem', color: '#888' }}>
                                Allow Print Screen, right-click, and text selection
                            </div>
                        </div>
                    </div>
                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                    }}>
                        <input
                            type="checkbox"
                            checked={screenshotsAllowed}
                            onChange={(e) => toggleScreenshots(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: screenshotsAllowed ? '#00ff00' : '#333',
                            borderRadius: '24px',
                            transition: '0.3s'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: screenshotsAllowed ? '26px' : '3px',
                                bottom: '3px',
                                background: '#fff',
                                borderRadius: '50%',
                                transition: '0.3s'
                            }}></span>
                        </span>
                    </label>
                </div>

                {/* Unbreakable Wall Toggle */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Shield size={24} color="#888" />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Unbreakable Wall</div>
                            <div style={{ fontSize: '0.875rem', color: '#888' }}>
                                Ultimate protection for .paper domains
                            </div>
                        </div>
                    </div>
                    <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '48px',
                        height: '24px'
                    }}>
                        <input
                            type="checkbox"
                            checked={wallActive}
                            onChange={(e) => toggleWall(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: wallActive ? '#00ff00' : '#333',
                            borderRadius: '24px',
                            transition: '0.3s'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: wallActive ? '26px' : '3px',
                                bottom: '3px',
                                background: '#fff',
                                borderRadius: '50%',
                                transition: '0.3s'
                            }}></span>
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

