// Ultra-Aggressive Navigation Interceptor
// Uses every possible browser API to catch .paper domains

export class NavigationInterceptor {
    private static instance: NavigationInterceptor;
    private swReady: boolean = false;

    static getInstance(): NavigationInterceptor {
        if (!NavigationInterceptor.instance) {
            NavigationInterceptor.instance = new NavigationInterceptor();
        }
        return NavigationInterceptor.instance;
    }

    async init() {
        // Strategy 1: Service Worker (primary) - Don't register here, App.tsx handles it
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.ready;
                this.swReady = true;
                console.log('[Interceptor] Service Worker Ready');
            } catch (e) {
                // SW might not be registered yet, that's OK
                console.log('[Interceptor] Service Worker not ready yet');
            }
        }

        // Strategy 2: Intercept beforeunload/navigation (Chrome/Edge)
        this.interceptNavigation();

        // Strategy 3: Proxy fetch API (fallback)
        this.proxyFetch();

        // Strategy 4: URL rewriting on page load
        this.rewriteURLs();

        // Strategy 5: Hidden iframe to prime Service Worker
        this.primeServiceWorker();
    }

    private interceptNavigation() {
        // Intercept link clicks
        document.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('a');
            if (target && target.href) {
                const url = new URL(target.href);
                if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                    e.preventDefault();
                    this.handlePaperNavigation(url);
                }
            }
        }, true);

        // Intercept form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target as HTMLFormElement;
            if (form.action) {
                try {
                    const url = new URL(form.action, window.location.href);
                    if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                        e.preventDefault();
                        this.handlePaperNavigation(url);
                    }
                } catch {}
            }
        }, true);
    }

    private proxyFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            let url: URL;
            if (typeof input === 'string') {
                url = new URL(input, window.location.href);
            } else if (input instanceof URL) {
                url = input;
            } else {
                url = new URL(input.url, window.location.href);
            }

            if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                // Rewrite to gateway
                const gatewayUrl = new URL(`/_gateway/${url.hostname}${url.pathname}${url.search}`, window.location.origin);
                return originalFetch(gatewayUrl, init);
            }

            return originalFetch(input, init);
        };
    }

    private rewriteURLs() {
        // Rewrite all .paper URLs in the page
        const observer = new MutationObserver(() => {
            document.querySelectorAll('a[href*=".paper"]').forEach((link) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('/_gateway/')) {
                    try {
                        const url = new URL(href, window.location.href);
                        if (url.hostname.endsWith('.paper') || url.hostname === 'paper') {
                            link.setAttribute('href', `/_gateway/${url.hostname}${url.pathname}${url.search}`);
                        }
                    } catch {}
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    private primeServiceWorker() {
        // Create hidden iframe with .paper URL to prime SW
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;';
        iframe.src = '/_gateway/blog.paper/';
        document.body.appendChild(iframe);
    }

    private handlePaperNavigation(url: URL) {
        // Rewrite to gateway and navigate
        const gatewayUrl = `/_gateway/${url.hostname}${url.pathname}${url.search}`;
        
        // Try to use Service Worker navigation
        if (this.swReady && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                // Use navigation API if available
                if ('navigation' in window) {
                    (window as any).navigation.navigate(gatewayUrl);
                } else {
                    window.location.href = gatewayUrl;
                }
            });
        } else {
            window.location.href = gatewayUrl;
        }
    }

    // Intercept address bar navigation (works via SW fetch handler)
    static interceptAddressBar(url: string): string | null {
        try {
            const parsed = new URL(url);
            if (parsed.hostname.endsWith('.paper') || parsed.hostname === 'paper') {
                return `/_gateway/${parsed.hostname}${parsed.pathname}${parsed.search}`;
            }
        } catch {}
        return null;
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    const interceptor = NavigationInterceptor.getInstance();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => interceptor.init());
    } else {
        interceptor.init();
    }
}

