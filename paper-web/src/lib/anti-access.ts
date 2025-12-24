// Anti-Access Protection (invisibrowse-inspired)
// Credits: invisibrowse (https://github.com/invisibrowse/invisibrowse.github.io)
// Prevents screenshots, extensions, and unauthorized access

export class AntiAccessProtection {
    private static instance: AntiAccessProtection;
    private protectionActive: boolean = false;

    static getInstance(): AntiAccessProtection {
        if (!AntiAccessProtection.instance) {
            AntiAccessProtection.instance = new AntiAccessProtection();
        }
        return AntiAccessProtection.instance;
    }

    enable() {
        if (this.protectionActive) return;
        this.protectionActive = true;

        // 1. Disable DevTools (invisibrowse technique)
        this.disableDevTools();

        // 2. Prevent Screenshots (invisibrowse technique)
        this.preventScreenshots();

        // 3. Block Extension Access
        this.blockExtensions();

        // 4. Detect DNS Manipulation
        this.detectDNSManipulation();

        // 5. Content Security
        this.enforceContentSecurity();

        console.log('[AntiAccess] Protection enabled (invisibrowse-inspired)');
    }

    private disableDevTools() {
        // Prevent F12, Ctrl+Shift+I, etc.
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I / Cmd+Option+I
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J / Cmd+Option+J
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        });

        // Detect DevTools open
        let devtools = { open: false };
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtools.open = true;
                return '';
            }
        });
        
        setInterval(() => {
            devtools.open = false;
            try {
                console.clear();
                console.log('%c', element);
            } catch (e) {
                // Ignore console errors
            }
            if (devtools.open) {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:monospace;"><h1>Access Denied</h1></div>';
            }
        }, 1000);
    }

    private preventScreenshots() {
        // Disable right-click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable text selection
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable drag
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });

        // CSS to prevent selection
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
        `;
        document.head.appendChild(style);

        // Detect Print Screen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                navigator.clipboard.writeText('');
                return false;
            }
        });
    }

    private blockExtensions() {
        // Detect common extension injection points
        const checkExtension = () => {
            // Check for extension-modified DOM
            const suspiciousElements = document.querySelectorAll('[data-extension], [id*="extension"], [class*="extension"]');
            if (suspiciousElements.length > 0) {
                console.warn('[AntiAccess] Extension detected, blocking access');
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff0000;font-family:monospace;"><h1>Extension Detected - Access Denied</h1></div>';
            }

            // Check for modified window properties
            if ((window as any).chrome && (window as any).chrome.runtime) {
                // Chrome extension detected
                const extId = ((window as any).chrome.runtime as any).id;
                if (extId && !extId.includes('paper')) {
                    console.warn('[AntiAccess] Unauthorized extension detected');
                }
            }
        };

        setInterval(checkExtension, 2000);
    }

    private detectDNSManipulation() {
        // Check if .paper domains resolve correctly
        const checkDNS = async () => {
            try {
                // Try to fetch a test endpoint
                const response = await fetch('/_gateway/test.paper/', { method: 'HEAD' });
                if (!response.ok && response.status !== 404) {
                    console.warn('[AntiAccess] DNS manipulation detected');
                }
            } catch (e) {
                // Expected for test domain
            }
        };

        // Check periodically
        setInterval(checkDNS, 5000);
    }

    private enforceContentSecurity() {
        // Add strict CSP meta tag if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';";
            document.head.appendChild(meta);
        }

        // Block iframe embedding
        if (window.self !== window.top) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:monospace;"><h1>Framing Not Allowed</h1></div>';
        }
    }

    isActive(): boolean {
        return this.protectionActive;
    }
}

export const antiAccess = AntiAccessProtection.getInstance();

