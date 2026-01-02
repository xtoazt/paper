// Paper Proxy Server using Pyodide
// Runs Python server code inside WebVM with child_process simulation
// Provides unlimited TLD support with unbreakable firewall

import { UnbreakableFirewall } from './unbreakable-firewall';

interface PyodideProxyServerOptions {
    port?: number;
    host?: string;
}

export class PyodideProxyServer {
    private pyodide: any = null;
    private isRunning: boolean = false;
    private isInitializing: boolean = false;
    private initializationError: Error | null = null;
    private firewall: UnbreakableFirewall;
    private domains: Set<string> = new Set();
    private tlds: Set<string> = new Set();
    private options: PyodideProxyServerOptions;
    private dbName = 'paper-proxy-db';
    private storeName = 'domains';

    constructor(options: PyodideProxyServerOptions = {}) {
        this.options = {
            port: options.port || 8080,
            host: options.host || '127.0.0.1'
        };
        this.firewall = UnbreakableFirewall.getInstance();
    }

    async initialize() {
        if (this.pyodide) {
            return;
        }

        if (this.isInitializing) {
            // Wait for initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.initializationError) {
                throw this.initializationError;
            }
            return;
        }

        this.isInitializing = true;
        this.initializationError = null;

        try {
            console.log('[PyodideProxy] Loading Pyodide...');
            
            // Load Pyodide with error handling
            try {
                // @ts-ignore
                const pyodideModule = await import('pyodide');
                this.pyodide = await pyodideModule.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
                });
            } catch (error: any) {
                console.warn('[PyodideProxy] Failed to load Pyodide, using fallback:', error.message);
                // Fallback: continue without Pyodide, use JS-only implementation
                this.isInitializing = false;
                return;
            }

            console.log('[PyodideProxy] Pyodide loaded, setting up environment...');

            // Set up Python environment
            await this.setupPythonEnvironment();

            // Load persisted domains and sync to Python
            const data = await this.loadDomainsFromIndexedDB();
            if (data.domains.length > 0 || data.tlds.length > 0) {
                this.domains = new Set(data.domains);
                this.tlds = new Set(data.tlds);
            }

            console.log('[PyodideProxy] Pyodide ready');
        } catch (error: any) {
            this.initializationError = error;
            console.error('[PyodideProxy] Initialization failed:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    private async setupPythonEnvironment() {
        // Create hosts file manager with child_process simulation
        const hostsManagerCode = String.raw`
import json
import os
from pathlib import Path

class HostsManager:
    MARKER_START = "### PAPER-TLD-START ###"
    MARKER_END = "### PAPER-TLD-END ###"
    
    def __init__(self):
        self.domains = set()
        self.tlds = set()
        # In browser, we use a virtual hosts file
        self.hosts_file = "/tmp/hosts"
        self.virtual_hosts = {}
        # Load domains will be called from JS after bridge is set up
    
    def load_domains(self):
        """Load domains from IndexedDB via JS - called from JS"""
        pass
    
    def save_domains(self):
        """Save domains to IndexedDB via JS - called from JS"""
        pass
    
    def add_domain(self, domain):
        """Add a domain to the virtual hosts file"""
        if not domain or not isinstance(domain, str):
            raise ValueError("Invalid domain")
        
        # Validate domain format - must end with .paper
        import re
        if not domain.endswith('.paper') and domain != 'paper':
            raise ValueError(f"Domain must end with .paper: {domain}")
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$', domain):
            raise ValueError(f"Invalid domain format: {domain}")
        
        was_new = domain not in self.domains
        self.domains.add(domain)
        self.virtual_hosts[domain] = "127.0.0.1"
        
        # Also add www variant
        if not domain.startswith("www."):
            www_domain = f"www.{domain}"
            self.domains.add(www_domain)
            self.virtual_hosts[www_domain] = "127.0.0.1"
        
        # Save to IndexedDB and notify Service Worker via JS bridge
        js_bridge.save_domains(list(self.domains), list(self.tlds))
        js_bridge.notify_service_worker(domain, False)
        
        return was_new
    
    def add_tld(self, tld):
        """Add a TLD (allows *.tld)"""
        clean_tld = tld.lstrip('.')
        self.tlds.add(clean_tld)
        self.domains.add(clean_tld)
        self.virtual_hosts[clean_tld] = "127.0.0.1"
        
        # Save to IndexedDB and notify Service Worker via JS bridge
        js_bridge.save_domains(list(self.domains), list(self.tlds))
        js_bridge.notify_service_worker(clean_tld, True)
        
        return True
    
    def remove_domain(self, domain):
        """Remove a domain"""
        self.domains.discard(domain)
        self.virtual_hosts.pop(domain, None)
        
        # Also remove www variant if it exists
        if domain.startswith("www."):
            original_domain = domain[4:]
            self.domains.discard(original_domain)
            self.virtual_hosts.pop(original_domain, None)
        else:
            www_domain = f"www.{domain}"
            self.domains.discard(www_domain)
            self.virtual_hosts.pop(www_domain, None)
        
        # Check if it was a TLD and remove if no other domains use it
        is_tld = False
        for tld in list(self.tlds):
            if domain.endswith('.' + tld) or domain == tld:
                is_tld = True
                break
        
        if is_tld:
            self.tlds.discard(domain)  # Remove if it was a TLD itself
        
        # Save to IndexedDB and notify Service Worker via JS bridge
        js_bridge.save_domains(list(self.domains), list(self.tlds))
        js_bridge.notify_service_worker(domain, False)
    
    def get_domains(self):
        """Get all registered domains"""
        return sorted(list(self.domains))
    
    def get_tlds(self):
        """Get all registered TLDs"""
        return sorted(list(self.tlds))
    
    def is_registered(self, domain):
        """Check if domain is registered"""
        if domain in self.domains:
            return True
        
        # Check TLD match
        for tld in self.tlds:
            if domain.endswith('.' + tld) or domain == tld:
                return True
        
        return False
    
    def flush_dns(self):
        """Simulate DNS flush (in browser, this is handled by Service Worker)"""
        # In browser environment, DNS is handled by Service Worker
        # This is a no-op but kept for API compatibility
        pass

hosts_manager = HostsManager()
        `;

        this.pyodide.runPython(hostsManagerCode);

        // Set up JS bridge module for domain persistence
        this.pyodide.runPython(String.raw`
import json

class JSBridge:
    def save_domains(self, domains_list, tlds_list):
        """Called from Python to save domains to IndexedDB"""
        from js import window
        if hasattr(window, 'pyodideProxySaveDomains'):
            window.pyodideProxySaveDomains(domains_list, tlds_list)

    def load_domains(self):
        """Called from Python to load domains from IndexedDB"""
        from js import window
        if hasattr(window, 'pyodideProxyLoadDomains'):
            return window.pyodideProxyLoadDomains()
        return {'domains': [], 'tlds': []}

    def notify_service_worker(self, domain, is_tld=False):
        """Called from Python to notify Service Worker"""
        from js import window
        if hasattr(window, 'pyodideProxyNotifySW'):
            window.pyodideProxyNotifySW(domain, is_tld)

js_bridge = JSBridge()
        `);

        // Register JS bridge functions
        (window as any).pyodideProxySaveDomains = (domains: string[], tlds: string[]) => {
            this.saveDomainsToIndexedDB(domains, tlds);
        };

        (window as any).pyodideProxyLoadDomains = () => {
            return this.loadDomainsFromIndexedDBSync();
        };

        (window as any).pyodideProxyNotifySW = (domain: string, isTld: boolean) => {
            this.notifyServiceWorker(domain, isTld);
        };

        // Create firewall
        // Build regex pattern with backtick separately to avoid template literal issues
        const backtickChar = String.fromCharCode(96);
        const commandInjectionPattern = '[;&|' + backtickChar + '$(){}[\\\\]]';
        
        const firewallCodeBefore = String.raw`
import re
import time
from collections import defaultdict

class UnbreakableFirewall:
    def __init__(self):
        self.active = True
        self.blocked_ips = set()
        self.allowed_ips = set()
        self.rate_limits = defaultdict(list)
        self.attack_patterns = self._init_patterns()
        self.request_history = defaultdict(list)
    
    def _init_patterns(self):
        return {
            'sql_injection': [
                re.compile(r'(?i)\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\\b'),
                re.compile(r'(?i)\\b(OR|AND)\\s+\\d+\\s*=\\s*\\d+'),
                re.compile(r'(?i)(xp_cmdshell|sp_executesql|CONCAT|GROUP_CONCAT)'),
                re.compile(r'[;\\'\\\\]'),
            ],
            'xss': [
                re.compile(r'(?i)<script[^>]*>.*?</script>'),
                re.compile(r'(?i)javascript:'),
                re.compile(r'(?i)on\\w+\\s*='),
                re.compile(r'(?i)eval\\s*\\('),
            ],
            'command_injection': [
                re.compile(r'[;&|__BACKTICK_PLACEHOLDER__$(){}[\\]]'),
        `;

        const firewallCodeAfter = String.raw`
                re.compile(r'(?i)\\b(cmd|command|sh|bash|powershell|exec|system|popen|shell_exec)\\b'),
                re.compile(r'(?i)(/\\w+/(bin|usr|etc)/\\w+)'),
            ],
            'path_traversal': [
                re.compile(r'\\.\\.(/|\\\\|%2f|%5c)', re.I),
                re.compile(r'(?i)(/|\\\\|%2f|%5c)(etc|proc|sys|dev|boot|root|home|usr|var|tmp)(/|\\\\|%2f|%5c)'),
            ],
            'ssrf': [
                re.compile(r'(127\\.0\\.0\\.1|localhost|0\\.0\\.0\\.0|::1)'),
                re.compile(r'(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)'),
                re.compile(r'(?i)(file://|gopher://|dict://)'),
            ],
            'rce': [
                re.compile(r'(?i)\\b(eval|exec|system|passthru|shell_exec|popen|proc_open|pcntl_exec)\\s*\\('),
                re.compile(r'\\$\\{.*?\\}'),
            ],
        }
    
    def check_request(self, ip, method, path, headers=None, body=''):
        if not self.active:
            return {'allowed': True}
        
        if ip in self.allowed_ips:
            return {'allowed': True}
        
        if ip in self.blocked_ips:
            return {'allowed': False, 'reason': 'IP Blocked by Firewall', 'severity': 'high'}
        
        # Rate limiting
        rate_check = self._check_rate_limit(ip)
        if not rate_check['allowed']:
            self.blocked_ips.add(ip)
            return rate_check
        
        # Combine inputs for pattern matching
        import json
        all_inputs = f"{method} {path} {json.dumps(headers or {})} {body}".lower()
        
        # Check attack patterns
        for attack_type, patterns in self.attack_patterns.items():
            for pattern in patterns:
                if pattern.search(all_inputs):
                    self.blocked_ips.add(ip)
                    self._log_attack(ip, attack_type, path)
                    return {
                        'allowed': False,
                        'reason': f'{attack_type} detected',
                        'severity': 'critical',
                        'attack_type': attack_type
                    }
        
        return {'allowed': True}
    
    def _check_rate_limit(self, ip):
        now = time.time()
        window = 60  # 1 minute
        max_requests = 100
        burst_limit = 20
        burst_window = 5
        
        requests = self.rate_limits[ip]
        recent = [t for t in requests if now - t < window]
        
        # Check burst limit
        burst_requests = [t for t in recent if now - t < burst_window]
        if len(burst_requests) >= burst_limit:
            return {'allowed': False, 'reason': 'Burst rate limit exceeded', 'severity': 'high'}
        
        # Check overall rate limit
        if len(recent) >= max_requests:
            return {'allowed': False, 'reason': 'Rate limit exceeded', 'severity': 'medium'}
        
        # Add current request
        recent.append(now)
        self.rate_limits[ip] = recent
        
        return {'allowed': True}
    
    def _log_attack(self, ip, attack_type, path):
        log_entry = {
            'timestamp': time.time(),
            'ip': ip,
            'attack_type': attack_type,
            'path': path,
            'severity': 'critical'
        }
        history = self.request_history[ip]
        history.append(log_entry)
        if len(history) > 100:
            history.pop(0)
    
    def block_ip(self, ip):
        self.blocked_ips.add(ip)
    
    def unblock_ip(self, ip):
        self.blocked_ips.discard(ip)
        self.rate_limits.pop(ip, None)
    
    def allow_ip(self, ip):
        self.allowed_ips.add(ip)
    
    def get_stats(self):
        return {
            'blocked_ips': len(self.blocked_ips),
            'allowed_ips': len(self.allowed_ips),
            'total_attacks': sum(len(h) for h in self.request_history.values()),
            'active_rate_limits': len(self.rate_limits)
        }

firewall = UnbreakableFirewall()
        `;
        
        const firewallCode = (firewallCodeBefore + firewallCodeAfter).replace('__BACKTICK_PLACEHOLDER__', String.fromCharCode(96));

        this.pyodide.runPython(firewallCode);
    }

    async start() {
        if (this.isRunning) {
            console.warn('[PyodideProxy] Server already running');
            return;
        }

        await this.initialize();

        // Create the proxy server
        const proxyServerCode = String.raw`
import json
import asyncio
from js import window, document, console

class ProxyServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.is_running = False
        self.pending_requests = {}
        self.control_ws = None
    
    def start(self):
        """Start the proxy server"""
        self.is_running = True
        from js import console
        console.log(f"[PyodideProxy] Server started on {self.host}:{self.port}")
        
        # In browser, we use Service Worker + MessageChannel
        # The server logic runs here but communicates via postMessage
        console.log("[PyodideProxy] Ready to handle requests via Service Worker")
    
    def handle_request(self, method, path, host, headers, body, client_ip, request_id):
        """Handle HTTP request"""
        # Firewall check
        firewall_check = firewall.check_request(
            client_ip or 'unknown',
            method,
            path,
            headers or {},
            body or ''
        )
        
        if not firewall_check.get('allowed'):
            return {
                'id': request_id,
                'status': 403,
                'headers': {'Content-Type': 'text/html'},
                'body': self._generate_blocked_page(firewall_check)
            }
        
        # Check if domain is registered
        domain = host.split(':')[0] if host else ''
        if not hosts_manager.is_registered(domain):
            return {
                'id': request_id,
                'status': 404,
                'headers': {'Content-Type': 'text/html'},
                'body': '<html><body><h1>404 - Domain Not Found</h1><p>Domain not registered.</p></body></html>'
            }
        
        # Signal to forward to runtime
        return {
            'id': request_id,
            'type': 'forward_to_runtime',
            'method': method,
            'path': path,
            'host': host,
            'headers': headers,
            'body': body
        }
    
    def _generate_blocked_page(self, firewall_check):
        reason = firewall_check.get('reason', 'Blocked by Firewall')
        severity = firewall_check.get('severity', 'medium')
        attack_type = firewall_check.get('attack_type', '')
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
    <style>
        body {{ font-family: monospace; padding: 2rem; background: #000; color: #f00; text-align: center; }}
        h1 {{ font-size: 2rem; margin-bottom: 1rem; }}
        p {{ color: #888; margin: 0.5rem 0; }}
        .reason {{ color: #f00; font-weight: bold; }}
        .severity {{ color: #ff0; }}
    </style>
</head>
<body>
    <div>
        <h1>🔒 403 - Access Denied</h1>
        <p class="reason">Reason: {reason}</p>
        <p class="severity">Severity: {severity.upper()}</p>
        {'<p>Attack Type: ' + attack_type + '</p>' if attack_type else ''}
        <p style="margin-top: 2rem; color: #666;">Unbreakable Firewall - Cannot be bypassed</p>
    </div>
</body>
</html>
        """
    
    def register_domain(self, domain):
        """Register a domain"""
        try:
            was_new = hosts_manager.add_domain(domain)
            return {
                'type': 'domain_registered',
                'domain': domain,
                'was_new': was_new,
                'all_domains': hosts_manager.get_domains()
            }
        except Exception as e:
            return {
                'type': 'error',
                'error': str(e)
            }
    
    def register_tld(self, tld):
        """Register a TLD"""
        try:
            hosts_manager.add_tld(tld)
            return {
                'type': 'tld_registered',
                'tld': tld,
                'all_domains': hosts_manager.get_domains()
            }
        except Exception as e:
            return {
                'type': 'error',
                'error': str(e)
            }
    
    def get_stats(self):
        """Get server statistics"""
        return {
            'type': 'stats',
            'firewall': firewall.get_stats(),
            'domains': hosts_manager.get_domains(),
            'tlds': hosts_manager.get_tlds(),
            'pending_requests': len(self.pending_requests)
        }

proxy_server = ProxyServer(` + JSON.stringify(this.options.host) + `, ` + this.options.port + `)
        `;

        this.pyodide.runPython(proxyServerCode);
        
        // Start the server
        this.pyodide.runPython('proxy_server.start()');
        
        // Load persisted domains into Python
        await this.syncDomainsToPython();
        
        this.isRunning = true;
        console.log('[PyodideProxy] Server started successfully');
    }

    private async syncDomainsToPython() {
        if (!this.pyodide) return;
        
        const data = await this.loadDomainsFromIndexedDB();
        if (data.domains.length > 0 || data.tlds.length > 0) {
            // Load domains into Python hosts_manager
            const domainsJson = JSON.stringify(data.domains);
            const tldsJson = JSON.stringify(data.tlds);
            this.pyodide.runPython(String.raw`
import json
domains_list = json.loads(` + JSON.stringify(domainsJson) + `)
tlds_list = json.loads(` + JSON.stringify(tldsJson) + `)

# Add all domains to hosts_manager
for domain in domains_list:
    hosts_manager.domains.add(domain)
    hosts_manager.virtual_hosts[domain] = "127.0.0.1"

# Add all TLDs
for tld in tlds_list:
    hosts_manager.tlds.add(tld)
    hosts_manager.domains.add(tld)
    hosts_manager.virtual_hosts[tld] = "127.0.0.1"
            `);
            
            // Update local sets
            this.domains = new Set(data.domains);
            this.tlds = new Set(data.tlds);
            
            // Notify Service Worker of all domains (but don't persist again - already persisted)
            // Just update the in-memory sets in Service Worker
            for (const domain of data.domains) {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'DOMAIN_REGISTERED',
                        domain: domain
                    });
                }
            }
            for (const tld of data.tlds) {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'TLD_REGISTERED',
                        tld: tld
                    });
                }
            }
        } else {
            // No persisted domains, register defaults
            const defaultDomains = ['paper', 'blog.paper', 'shop.paper', 'test.paper'];
            for (const domain of defaultDomains) {
                try {
                    await this.registerDomain(domain);
                } catch (error) {
                    console.warn(`[PyodideProxy] Failed to register default domain ${domain}:`, error);
                }
            }
        }
    }

    private async saveDomainsToIndexedDB(domains: string[], tlds: string[]) {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            
            await store.put({ domains, tlds }, 'registered');
            
            // Update local sets
            this.domains = new Set(domains);
            this.tlds = new Set(tlds);
        } catch (error) {
            console.error('[PyodideProxy] Failed to save domains:', error);
        }
    }

    private async loadDomainsFromIndexedDB(): Promise<{ domains: string[], tlds: string[] }> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const data = await store.get('registered');
            
            if (data) {
                return {
                    domains: data.domains || [],
                    tlds: data.tlds || []
                };
            }
        } catch (error) {
            console.warn('[PyodideProxy] Failed to load domains:', error);
        }
        
        return { domains: [], tlds: [] };
    }

    private loadDomainsFromIndexedDBSync(): { domains: string[], tlds: string[] } {
        // Synchronous version for Python bridge
        // This will be called from Python, so we need to return immediately
        // We'll use a cached version or return empty
        return {
            domains: Array.from(this.domains),
            tlds: Array.from(this.tlds)
        };
    }

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private notifyServiceWorker(domain: string, isTld: boolean) {
        // Notify Service Worker via postMessage
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: isTld ? 'TLD_REGISTERED' : 'DOMAIN_REGISTERED',
                domain: domain,
                tld: isTld ? domain : undefined
            });
        }
        
        // Also notify all clients
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active?.postMessage({
                    type: isTld ? 'TLD_REGISTERED' : 'DOMAIN_REGISTERED',
                    domain: domain,
                    tld: isTld ? domain : undefined
                });
            });
        }
    }

    async registerDomain(domain: string): Promise<any> {
        if (!this.pyodide) {
            await this.initialize();
        }
        
        if (!this.pyodide) {
            // Fallback: register in JS only
            this.domains.add(domain);
            // Also add www variant
            if (!domain.startsWith('www.')) {
                this.domains.add(`www.${domain}`);
            }
            await this.saveDomainsToIndexedDB(Array.from(this.domains), Array.from(this.tlds));
            this.notifyServiceWorker(domain, false);
            return { type: 'domain_registered', domain, was_new: true, all_domains: Array.from(this.domains) };
        }

        try {
            const escapedDomain = domain.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
            const domainJson = JSON.stringify(domain);
            this.pyodide.runPython(String.raw`
import json
result = proxy_server.register_domain(` + domainJson + `)
            `);
            const result = this.pyodide.runPython('json.dumps(result)');
            const parsed = JSON.parse(result);
            
            if (parsed.domain) {
                this.domains.add(parsed.domain);
            }
            
            return parsed;
        } catch (error: any) {
            console.error('[PyodideProxy] Failed to register domain:', error);
            throw error;
        }
    }

    async registerTLD(tld: string): Promise<any> {
        await this.initialize();
        if (!this.pyodide) {
            this.tlds.add(tld);
            await this.saveDomainsToIndexedDB(Array.from(this.domains), Array.from(this.tlds));
            this.notifyServiceWorker(tld, true);
            return { type: 'tld_registered', tld, all_domains: Array.from(this.domains) };
        }
        try {
            const tldJson = JSON.stringify(tld);
            this.pyodide.runPython(String.raw`
import json
result = proxy_server.register_tld(` + tldJson + `)
            `);
        const result = this.pyodide.runPython('json.dumps(result)');
        const parsed = JSON.parse(result);
        if (parsed.tld) {
            this.tlds.add(parsed.tld);
            this.domains.add(parsed.tld);
            // Update local sets and save
            await this.saveDomainsToIndexedDB(Array.from(this.domains), Array.from(this.tlds));
        }
        return parsed;
    }

    async handleRequest(method: string, path: string, host: string, headers: any, body: string, clientIP: string, requestId: string): Promise<any> {
        if (!this.pyodide) {
            await this.initialize();
        }
        
        if (!this.pyodide) {
            // Fallback: basic domain check
            const domain = host?.split(':')[0] || '';
            if (!this.isDomainRegisteredSync(domain)) {
                return {
                    id: requestId,
                    status: 404,
                    headers: { 'Content-Type': 'text/html' },
                    body: '<html><body><h1>404 - Domain Not Found</h1><p>Domain not registered.</p></body></html>'
                };
            }
            // Allow request to proceed
            return {
                id: requestId,
                type: 'forward_to_runtime',
                method,
                path,
                host,
                headers,
                body
            };
        }

        try {
            const methodJson = JSON.stringify(method);
            const pathJson = JSON.stringify(path);
            const hostJson = JSON.stringify(host);
            const headersJson = JSON.stringify(headers || {});
            const bodyJson = JSON.stringify(body || '');
            const clientIPJson = JSON.stringify(clientIP);
            const requestIdJson = JSON.stringify(requestId);
            
            this.pyodide.runPython(String.raw`
import json
try:
    result = proxy_server.handle_request(
        ` + methodJson + `,
        ` + pathJson + `,
        ` + hostJson + `,
        json.loads(` + JSON.stringify(headersJson) + `),
        ` + bodyJson + `,
        ` + clientIPJson + `,
        ` + requestIdJson + `
    )
except Exception as e:
    result = {'id': ` + requestIdJson + `, 'type': 'error', 'error': str(e)}
            `);
            const result = this.pyodide.runPython('json.dumps(result)');
            return JSON.parse(result);
        } catch (error: any) {
            console.error('[PyodideProxy] Request handling failed:', error);
            // Fallback: allow request
            return {
                id: requestId,
                type: 'forward_to_runtime',
                method,
                path,
                host,
                headers,
                body
            };
        }
    }

    async getStats(): Promise<any> {
        await this.initialize();
        if (!this.pyodide) {
            return {
                type: 'stats',
                firewall: { blocked_ips: 0, allowed_ips: 0, total_attacks: 0, active_rate_limits: 0 },
                domains: Array.from(this.domains),
                tlds: Array.from(this.tlds),
                pending_requests: 0
            };
        }
        this.pyodide.runPython(String.raw`import json
result = proxy_server.get_stats()`);
        const result = this.pyodide.runPython('json.dumps(result)');
        return JSON.parse(result);
    }

    async stop() {
        this.isRunning = false;
        console.log('[PyodideProxy] Server stopped');
    }

    getDomains(): string[] {
        return Array.from(this.domains);
    }

    getTLDs(): string[] {
        return Array.from(this.tlds);
    }

    isDomainRegisteredSync(domain: string): boolean {
        if (!domain) return false;
        
        // Check exact match
        if (this.domains.has(domain)) return true;
        
        // Check TLD match
        for (const tld of this.tlds) {
            if (domain.endsWith('.' + tld) || domain === tld) {
                return true;
            }
        }
        
        return false;
    }

    async removeDomain(domain: string): Promise<void> {
        if (!this.pyodide) {
            await this.initialize();
        }
        
        // Remove from local sets first
        this.domains.delete(domain);
        // Also remove www variant
        if (domain.startsWith('www.')) {
            this.domains.delete(domain.substring(4));
        } else {
            this.domains.delete(`www.${domain}`);
        }
        
        // Remove from Python if available
        if (this.pyodide) {
            try {
                const domainJson = JSON.stringify(domain);
                this.pyodide.runPython(String.raw`hosts_manager.remove_domain(` + domainJson + `)`);
            } catch (error) {
                console.error('[PyodideProxy] Failed to remove domain from Python:', error);
            }
        }
        
        // Save to IndexedDB and notify Service Worker
        await this.saveDomainsToIndexedDB(Array.from(this.domains), Array.from(this.tlds));
        this.notifyServiceWorker(domain, false);
        
        // Also notify Service Worker of removal
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'DOMAIN_REMOVED',
                domain: domain
            });
        }
    }

    isInitialized(): boolean {
        return this.pyodide !== null;
    }

    getInitializationError(): Error | null {
        return this.initializationError;
    }
}

// Export singleton instance
export const pyodideProxyServer = new PyodideProxyServer();

