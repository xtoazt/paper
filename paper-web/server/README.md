# Paper Proxy Server

A powerful Node.js proxy server that enables **unlimited local TLDs** with an **unbreakable firewall**. Uses `child_process` to manage the hosts file dynamically.

## Features

- ✅ **Unlimited TLD Support**: Register any TLD (`.paper`, `.local`, `.dev`, etc.)
- ✅ **Dynamic Domain Registration**: Add domains on-the-fly via WebSocket
- ✅ **Unbreakable Firewall**: Multi-layer security with attack pattern detection
- ✅ **Zero Configuration**: Works out of the box
- ✅ **Cross-Platform**: Works on macOS, Linux, and Windows

## Installation

```bash
cd paper-web
npm install
```

## Usage

### Start the Server

```bash
# Default (port 8080)
npm run server

# Custom port
node server/index.js --port 80

# Custom host and port
node server/index.js --host 0.0.0.0 --port 8080
```

**Note**: On Unix systems (macOS/Linux), you may need to run with `sudo` to modify `/etc/hosts`:
```bash
sudo node server/index.js --port 80
```

On Windows, you may need to run as Administrator.

### Register Domains

The server exposes a WebSocket control channel at `ws://127.0.0.1:8080/_paper_control` (or your configured port).

You can register domains programmatically:

```typescript
import { PaperProxyClient } from './src/lib/proxy-client';

const client = new PaperProxyClient('ws://127.0.0.1:8080/_paper_control');
await client.connect();

// Register a single domain
await client.registerDomain('blog.paper');

// Register a TLD (allows *.paper)
await client.registerTLD('paper');

// Get server stats
const stats = await client.getStats();
console.log(stats);
```

## Architecture

### Components

1. **HostsManager** (`lib/hosts-manager.js`)
   - Manages `/etc/hosts` file using `child_process`
   - Supports unlimited domains and TLDs
   - Automatic DNS cache flushing

2. **UnbreakableFirewall** (`lib/firewall.js`)
   - Multi-layer attack detection
   - Rate limiting
   - IP blocking
   - Attack pattern matching (SQL injection, XSS, command injection, etc.)

3. **ProxyServer** (`lib/proxy-server.js`)
   - HTTP proxy server
   - WebSocket control channel
   - Request forwarding to WebVM

### Security Features

The firewall detects and blocks:

- **SQL Injection**: `SELECT`, `UNION`, `DROP`, `xp_cmdshell`, etc.
- **XSS**: `<script>`, `javascript:`, event handlers, `eval()`
- **Command Injection**: `;`, `|`, `&&`, backticks, shell commands
- **Path Traversal**: `../`, encoded variants
- **SSRF**: Internal IPs, `file://`, `gopher://`
- **RCE**: `eval()`, `exec()`, `system()`, etc.
- **Malicious Bots**: SQLMap, Nikto, Nmap, etc.

Rate limiting:
- 100 requests per minute per IP
- 20 requests per 5 seconds (burst limit)

## WebSocket API

### Register Domain
```json
{
  "type": "register_domain",
  "domain": "blog.paper"
}
```

### Register TLD
```json
{
  "type": "register_tld",
  "tld": "paper"
}
```

### Get Stats
```json
{
  "type": "get_stats"
}
```

### Block IP
```json
{
  "type": "firewall_block_ip",
  "ip": "192.168.1.100"
}
```

### Unblock IP
```json
{
  "type": "firewall_unblock_ip",
  "ip": "192.168.1.100"
}
```

## How It Works

1. Server starts and modifies `/etc/hosts` to point domains to `127.0.0.1`
2. HTTP requests to registered domains are intercepted by the proxy
3. Firewall checks each request for attacks
4. Valid requests are forwarded to WebVM via WebSocket
5. WebVM processes the request and returns the response
6. Proxy returns the response to the client

## Troubleshooting

### Permission Denied

**Unix/macOS:**
```bash
sudo node server/index.js --port 80
```

**Windows:**
Run Command Prompt or PowerShell as Administrator.

### Port Already in Use

Change the port:
```bash
node server/index.js --port 8081
```

### DNS Not Resolving

1. Make sure you ran with `sudo` (Unix) or as Administrator (Windows)
2. Check that domains are in `/etc/hosts`:
   ```bash
   cat /etc/hosts | grep PAPER
   ```
3. Flush DNS cache:
   - macOS: `sudo killall -HUP mDNSResponder`
   - Linux: `sudo systemctl restart NetworkManager`
   - Windows: `ipconfig /flushdns`

### Browser Still Can't Resolve

1. Disable "Use Secure DNS" in browser settings
2. Clear browser DNS cache
3. Restart browser

## License

MIT



