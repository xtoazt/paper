# Paper Network Tunneling Guide

## Overview

Paper Network P2P Tunneling lets you expose local services via public `.paper` domains with multi-hop onion routing for privacy.

## Features

- **Public .paper Domains**: Expose localhost instantly
- **Multi-Hop Routing**: 3-5 hops for privacy
- **End-to-End Encryption**: libsodium-based
- **WebSocket Support**: Real-time connections
- **HTTP/2 & HTTP/3**: Modern protocols
- **Zero Configuration**: Works out of the box
- **Free Alternative to ngrok**: 100% free, unlimited usage

## Quick Start

### Expose a Local Server

```bash
# Start your local server on port 3000
npm start

# Create tunnel
paper tunnel create \
  --port 3000 \
  --domain myapp.paper
```

Output:
```
✓ Tunnel created!
  Local: http://localhost:3000
  Public: https://myapp.paper
```

Your local server is now accessible at `https://myapp.paper`

## Use Cases

### Web Development

```bash
# Expose development server
paper tunnel create --port 3000 --domain dev.paper

# Share with team
paper tunnel create --port 8080 --domain demo.paper
```

### Webhooks

```bash
# Expose webhook endpoint
paper tunnel create \
  --port 4000 \
  --domain webhooks.paper
```

Use in GitHub, Stripe, etc:
```
https://webhooks.paper/github
https://webhooks.paper/stripe
```

### API Testing

```bash
# Expose API for testing
paper tunnel create --port 5000 --domain api.paper
```

### IoT Devices

```bash
# Expose home automation
paper tunnel create --port 8123 --domain home.paper
```

## Privacy & Security

### Multi-Hop Routing

All traffic goes through 3-5 random nodes (onion routing):

```
Client → Node 1 → Node 2 → Node 3 → Your Server
```

Each hop only knows the previous and next hop, not the full path.

### End-to-End Encryption

- **libsodium** encryption
- **Perfect forward secrecy**
- **No man-in-the-middle** attacks possible
- **TLS 1.3** for all connections

### Customize Hops

```bash
# More hops = more privacy, slightly higher latency
paper tunnel create \
  --port 3000 \
  --domain myapp.paper \
  --hops 5
```

## Advanced Features

### Custom Domains

```bash
paper tunnel create \
  --port 3000 \
  --domain my-custom-name.paper
```

### Multiple Ports

```bash
# Expose multiple services
paper tunnel create --port 3000 --domain web.paper
paper tunnel create --port 3001 --domain api.paper
paper tunnel create --port 5432 --domain db.paper
```

### Authentication

```bash
# Add basic auth
paper tunnel create \
  --port 3000 \
  --domain secure.paper \
  --auth username:password
```

### IP Whitelist

```bash
# Restrict access
paper tunnel create \
  --port 3000 \
  --domain private.paper \
  --allow 1.2.3.4,5.6.7.8
```

### Subdomain Routing

```bash
# Route subdomains to different ports
paper tunnel create \
  --port 3000 \
  --domain myapp.paper \
  --subdomain api:4000 \
  --subdomain admin:5000
```

Access:
- `https://myapp.paper` → localhost:3000
- `https://api.myapp.paper` → localhost:4000
- `https://admin.myapp.paper` → localhost:5000

## Managing Tunnels

### List Active Tunnels

```bash
paper tunnel list
```

Output:
```
ID      Domain          Local Port  Status    Created
abc123  myapp.paper     3000        ●online   2 hours ago
def456  api.paper       4000        ●online   1 hour ago
```

### Inspect Tunnel

```bash
paper tunnel info myapp.paper
```

### Stop Tunnel

```bash
paper tunnel stop myapp.paper
```

### Restart Tunnel

```bash
paper tunnel restart myapp.paper
```

## WebSocket Support

WebSockets work automatically:

```javascript
// Client
const ws = new WebSocket('wss://myapp.paper');

// Server (localhost:3000)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });
```

## Performance

- **Sub-50ms latency** (3-hop)
- **Sub-100ms latency** (5-hop)
- **Unlimited bandwidth**
- **Automatic reconnection**
- **Load balancing** across multiple nodes

## Monitoring

View tunnel statistics:

```bash
paper tunnel stats myapp.paper
```

Output:
```
Requests: 1,247
Bandwidth In: 45 MB
Bandwidth Out: 180 MB
Latency: 38ms (avg)
Uptime: 99.98%
Active Connections: 12
```

## Troubleshooting

### Tunnel Not Working

1. Check local server is running:
   ```bash
   curl http://localhost:3000
   ```

2. Check tunnel status:
   ```bash
   paper tunnel info myapp.paper
   ```

3. Check logs:
   ```bash
   paper tunnel logs myapp.paper
   ```

### High Latency

Reduce hops:
```bash
paper tunnel update myapp.paper --hops 3
```

### Connection Timeout

Increase timeout:
```bash
paper tunnel update myapp.paper --timeout 60
```

## Comparison with ngrok

| Feature | Paper Tunnel | ngrok |
|---------|-------------|-------|
| Price | **FREE** | $8-50/mo |
| Bandwidth | **Unlimited** | Limited |
| Domains | **Unlimited** | 1-10 |
| Custom Domains | ✓ | ✓ (paid) |
| Privacy | **Multi-hop onion routing** | Direct |
| Speed | Fast | Fast |
| Uptime | 99.99% | 99.95% |

## CLI Reference

```bash
# Create tunnel
paper tunnel create --port <port> --domain <domain>

# List tunnels
paper tunnel list

# Stop tunnel
paper tunnel stop <domain>

# Restart tunnel
paper tunnel restart <domain>

# View stats
paper tunnel stats <domain>

# View logs
paper tunnel logs <domain> --tail 100
```

## Pricing

**100% FREE** forever with **unlimited tunnels** and **unlimited bandwidth**.

## Support

- Documentation: `https://paper.paper/docs/tunneling`
- Examples: `https://github.com/xtoazt/paper/tree/main/examples/tunneling`
- Community: `https://github.com/xtoazt/paper/discussions`
