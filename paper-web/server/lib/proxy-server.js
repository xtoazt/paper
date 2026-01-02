import http from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';
import { UnbreakableFirewall } from './firewall.js';
import { HostsManager } from './hosts-manager.js';

export class ProxyServer {
    constructor(options = {}) {
        this.host = options.host || '127.0.0.1';
        this.port = options.port || 8080;
        this.firewall = new UnbreakableFirewall();
        this.hostsManager = new HostsManager();
        this.controlWS = null;
        this.pendingRequests = new Map();
        this.server = null;
        this.wss = null;
    }

    async start() {
        // Install initial hosts
        try {
            await this.hostsManager.install();
        } catch (error) {
            console.warn(`[ProxyServer] Hosts installation failed: ${error.message}`);
            console.warn(`[ProxyServer] You may need to run with sudo (Unix) or as Administrator (Windows)`);
        }

        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        // Create WebSocket server for control channel
        this.wss = new WebSocketServer({ 
            server: this.server,
            path: '/_paper_control'
        });

        this.wss.on('connection', (ws, req) => {
            this.handleControlConnection(ws, req);
        });

        // Start listening
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, this.host, () => {
                console.log(`[ProxyServer] Listening on http://${this.host}:${this.port}`);
                console.log(`[ProxyServer] WebSocket control: ws://${this.host}:${this.port}/_paper_control`);
                resolve();
            });

            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`[ProxyServer] Port ${this.port} is already in use`);
                }
                reject(error);
            });
        });
    }

    handleControlConnection(ws, req) {
        const clientIP = req.socket.remoteAddress || 'unknown';
        console.log(`[ProxyServer] Control WebSocket connected from ${clientIP}`);
        
        this.controlWS = ws;

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleControlMessage(ws, message);
            } catch (error) {
                console.error(`[ProxyServer] Control message error: ${error.message}`);
                ws.send(JSON.stringify({ 
                    error: error.message,
                    type: 'error'
                }));
            }
        });

        ws.on('close', () => {
            console.log(`[ProxyServer] Control WebSocket disconnected`);
            this.controlWS = null;
            // Cancel all pending requests
            for (const [reqId, res] of this.pendingRequests.entries()) {
                if (!res.headersSent) {
                    res.writeHead(504, { 'Content-Type': 'text/plain' });
                    res.end('WebSocket disconnected');
                }
            }
            this.pendingRequests.clear();
        });

        ws.on('error', (error) => {
            console.error(`[ProxyServer] WebSocket error: ${error.message}`);
        });

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Paper Proxy Control Channel Ready',
            domains: this.hostsManager.getDomains()
        }));
    }

    async handleControlMessage(ws, message) {
        const { type, id } = message;

        switch (type) {
            case 'register_domain':
                const { domain } = message;
                if (!domain) {
                    ws.send(JSON.stringify({ 
                        id,
                        type: 'error',
                        error: 'Domain required'
                    }));
                    return;
                }

                try {
                    const wasNew = await this.hostsManager.addDomain(domain);
                    console.log(`[ProxyServer] Registered domain: ${domain} (new: ${wasNew})`);
                    
                    ws.send(JSON.stringify({
                        id,
                        type: 'domain_registered',
                        domain,
                        wasNew,
                        allDomains: this.hostsManager.getDomains()
                    }));
                } catch (error) {
                    ws.send(JSON.stringify({
                        id,
                        type: 'error',
                        error: error.message
                    }));
                }
                break;

            case 'register_tld':
                const { tld } = message;
                if (!tld) {
                    ws.send(JSON.stringify({
                        id,
                        type: 'error',
                        error: 'TLD required'
                    }));
                    return;
                }

                try {
                    await this.hostsManager.addTLD(tld);
                    console.log(`[ProxyServer] Registered TLD: ${tld}`);
                    
                    ws.send(JSON.stringify({
                        id,
                        type: 'tld_registered',
                        tld,
                        allDomains: this.hostsManager.getDomains()
                    }));
                } catch (error) {
                    ws.send(JSON.stringify({
                        id,
                        type: 'error',
                        error: error.message
                    }));
                }
                break;

            case 'response':
                // Handle response to a pending request
                const reqId = message.requestId;
                const response = this.pendingRequests.get(reqId);
                if (response && !response.headersSent) {
                    const { status, headers, body } = message;
                    response.writeHead(status || 200, headers || {});
                    response.end(body || '');
                    this.pendingRequests.delete(reqId);
                }
                break;

            case 'get_stats':
                ws.send(JSON.stringify({
                    id,
                    type: 'stats',
                    firewall: this.firewall.getStats(),
                    domains: this.hostsManager.getDomains(),
                    pendingRequests: this.pendingRequests.size
                }));
                break;

            case 'firewall_block_ip':
                const { ip: blockIP } = message;
                this.firewall.blockIP(blockIP);
                ws.send(JSON.stringify({
                    id,
                    type: 'ip_blocked',
                    ip: blockIP
                }));
                break;

            case 'firewall_unblock_ip':
                const { ip: unblockIP } = message;
                this.firewall.unblockIP(unblockIP);
                ws.send(JSON.stringify({
                    id,
                    type: 'ip_unblocked',
                    ip: unblockIP
                }));
                break;

            default:
                ws.send(JSON.stringify({
                    id,
                    type: 'error',
                    error: `Unknown message type: ${type}`
                }));
        }
    }

    handleRequest(req, res) {
        const clientIP = req.socket.remoteAddress || 
                        req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                        'unknown';
        
        const method = req.method;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const path = url.pathname;
        const host = req.headers.host || '';

        // Handle PAC file
        if (path === '/proxy.pac') {
            const pacContent = this.generatePAC();
            res.writeHead(200, { 'Content-Type': 'application/x-ns-proxy-autoconfig' });
            res.end(pacContent);
            return;
        }

        // Handle root path
        if (path === '/' && !host.endsWith('.paper') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Paper Proxy Server</title>
                    <style>
                        body { font-family: monospace; padding: 2rem; background: #000; color: #0f0; }
                        h1 { color: #0ff; }
                        .status { color: #0f0; }
                        .error { color: #f00; }
                    </style>
                </head>
                <body>
                    <h1>🚀 Paper Proxy Server</h1>
                    <p class="status">Status: Running</p>
                    <p>WebSocket Control: <code>ws://${this.host}:${this.port}/_paper_control</code></p>
                    <p>Registered Domains: ${this.hostsManager.getDomains().length}</p>
                    <p>Firewall: ${this.firewall.isActive() ? 'Active' : 'Inactive'}</p>
                </body>
                </html>
            `);
            return;
        }

        // Firewall check
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const headers = {};
            for (const [key, value] of Object.entries(req.headers)) {
                headers[key.toLowerCase()] = value;
            }

            const firewallCheck = this.firewall.checkRequest(
                clientIP,
                method,
                path,
                headers,
                body
            );

            if (!firewallCheck.allowed) {
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.end(this.generateBlockedPage(firewallCheck));
                return;
            }

            // If no WebSocket connection, return error
            if (!this.controlWS || this.controlWS.readyState !== 1) {
                res.writeHead(503, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>503 Service Unavailable</title>
                        <style>
                            body { font-family: monospace; padding: 2rem; background: #000; color: #f00; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <h1>503 - Service Unavailable</h1>
                        <p>WebVM not connected. Please connect to the control channel.</p>
                    </body>
                    </html>
                `);
                return;
            }

            // Forward request to WebVM via WebSocket
            const reqId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.pendingRequests.set(reqId, res);

            const payload = {
                id: reqId,
                method,
                url: req.url,
                path,
                host,
                headers,
                body,
                clientIP
            };

            try {
                this.controlWS.send(JSON.stringify(payload));

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (this.pendingRequests.has(reqId)) {
                        this.pendingRequests.delete(reqId);
                        if (!res.headersSent) {
                            res.writeHead(504, { 'Content-Type': 'text/plain' });
                            res.end('Request Timeout');
                        }
                    }
                }, 30000);
            } catch (error) {
                this.pendingRequests.delete(reqId);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Proxy Error: ${error.message}`);
                }
            }
        });
    }

    generatePAC() {
        const domains = this.hostsManager.getDomains();
        const domainList = domains.map(d => `"${d}"`).join(', ');
        
        return `
function FindProxyForURL(url, host) {
    const paperDomains = [${domainList}];
    
    // Check exact match
    if (paperDomains.includes(host)) {
        return "PROXY ${this.host}:${this.port}";
    }
    
    // Check TLD match (e.g., *.paper)
    for (const domain of paperDomains) {
        if (host.endsWith('.' + domain) || host === domain) {
            return "PROXY ${this.host}:${this.port}";
        }
    }
    
    return "DIRECT";
}
        `.trim();
    }

    generateBlockedPage(firewallCheck) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>403 Forbidden</title>
    <style>
        body { 
            font-family: monospace; 
            padding: 2rem; 
            background: #000; 
            color: #f00; 
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { color: #888; margin: 0.5rem 0; }
        .reason { color: #f00; font-weight: bold; }
        .severity { color: #ff0; }
    </style>
</head>
<body>
    <div>
        <h1>🔒 403 - Access Denied</h1>
        <p class="reason">Reason: ${firewallCheck.reason || 'Blocked by Firewall'}</p>
        ${firewallCheck.severity ? `<p class="severity">Severity: ${firewallCheck.severity.toUpperCase()}</p>` : ''}
        ${firewallCheck.attackType ? `<p>Attack Type: ${firewallCheck.attackType}</p>` : ''}
        <p style="margin-top: 2rem; color: #666;">Unbreakable Firewall - Cannot be bypassed</p>
    </div>
</body>
</html>
        `.trim();
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.wss) {
                this.wss.close(() => {
                    if (this.server) {
                        this.server.close(() => {
                            console.log('[ProxyServer] Stopped');
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            } else if (this.server) {
                this.server.close(() => {
                    console.log('[ProxyServer] Stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}



