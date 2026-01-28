# Paper Network Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the Paper Network to production with global .paper domain support.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Domain with HTTPS (for Service Worker)
- CDN account (optional, for PDF bootstrap)

## Step 1: Build for Production

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Output will be in dist/
```

## Step 2: Deploy Static Files

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Your site will be at: https://your-project.vercel.app
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Your site will be at: https://your-project.netlify.app
```

### Option C: GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Step 3: Configure Service Worker

Update `public/sw-enhanced.js` with your production domain:

```javascript
// Add your domain to bootstrap sources
const BOOTSTRAP_SOURCES = {
  domains: [
    'https://your-domain.com',
    'https://paper.is-a.software',  // Fallback
    // Add more fallbacks
  ],
  // ... rest of config
};
```

## Step 4: Generate PDF Bootstrap

```typescript
import { generateAndDownloadPDF } from './lib/bootstrap/pdf-generator';

// Generate PDF with your Service Worker URL
await generateAndDownloadPDF({
  serviceWorkerUrl: 'https://your-domain.com/sw-enhanced.js',
  fallbackUrls: [
    'https://paper.is-a.software/sw-enhanced.js'
  ],
  version: '1.0.0'
}, 'bootstrap.pdf');
```

Upload `bootstrap.pdf` to GitHub, then access via jsDelivr:

```
https://cdn.jsdelivr.net/gh/your-username/your-repo@main/bootstrap.pdf
```

## Step 5: Configure Bootstrap Sources

Update `src/lib/bootstrap/bootstrap-sources.ts`:

```typescript
export const BOOTSTRAP_SOURCES: BootstrapSourceConfig = {
  pdf: [
    // Your PDF bootstrap
    {
      id: 'jsdelivr-pdf',
      type: 'pdf',
      url: 'https://cdn.jsdelivr.net/gh/your-username/your-repo@main/bootstrap.pdf',
      priority: 1,
      timeout: 10000,
      enabled: true
    }
  ],
  
  domains: [
    // Your production domain
    {
      id: 'production',
      type: 'domain',
      url: 'https://your-domain.com',
      priority: 1,
      timeout: 5000,
      enabled: true
    }
  ],
  
  // ... rest of sources
};
```

## Step 6: Set Up IPFS Node

For production IPFS hosting:

### Option A: Use IPFS Pinning Service

```typescript
// src/lib/storage/ipfs-node.ts

import { create } from 'ipfs-http-client';

export async function createIpfsNode() {
  // Use Pinata, Web3.Storage, or Infura
  const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: 'Bearer YOUR_API_KEY'
    }
  });
  
  return ipfs;
}
```

### Option B: Run Your Own IPFS Node

```bash
# Install IPFS
wget https://dist.ipfs.io/go-ipfs/latest/go-ipfs_linux-amd64.tar.gz
tar -xvzf go-ipfs_linux-amd64.tar.gz
cd go-ipfs
./install.sh

# Initialize and run
ipfs init
ipfs daemon

# Enable CORS
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
```

## Step 7: Configure P2P Bootstrap Nodes

Set up dedicated bootstrap nodes:

```typescript
// src/lib/p2p/peer-discovery.ts

export const BOOTSTRAP_PEERS = [
  // Your bootstrap nodes
  '/dns4/bootstrap-1.your-domain.com/tcp/4001/p2p/QmYourPeerId1',
  '/dns4/bootstrap-2.your-domain.com/tcp/4001/p2p/QmYourPeerId2',
  
  // Public IPFS nodes as fallback
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  // ... more nodes
];
```

## Step 8: Security Hardening

### Enable HTTPS

Service Workers require HTTPS. Use Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Configure CSP Headers

Add Content Security Policy:

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
  content="
    default-src 'self';
    script-src 'self' 'unsafe-eval' cdn.jsdelivr.net unpkg.com;
    connect-src 'self' wss: ipfs.io *.infura.io;
    worker-src 'self' blob:;
  ">
```

### Rate Limiting

```typescript
// Implement rate limiting for API endpoints
const rateLimiter = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  
  // Remove old requests (> 1 minute)
  const recent = requests.filter((time: number) => now - time < 60000);
  
  if (recent.length >= 100) {
    return false; // Too many requests
  }
  
  recent.push(now);
  rateLimiter.set(ip, recent);
  return true;
}
```

## Step 9: Monitoring

### Set Up Analytics

```typescript
// src/lib/analytics.ts

export function trackEvent(event: string, data: any) {
  // Use privacy-respecting analytics
  if (typeof plausible !== 'undefined') {
    plausible(event, { props: data });
  }
}

// Track domain registrations
trackEvent('domain_registered', { domain: 'example.paper' });

// Track network stats
trackEvent('peer_connected', { peerCount: 42 });
```

### Health Checks

```typescript
// server/health.ts

export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      p2p: await checkP2PNode(),
      ipfs: await checkIPFS(),
      dht: await checkDHT(),
      bootstrap: await checkBootstrap()
    }
  };
}
```

## Step 10: Testing

### Test Service Worker

```bash
# Open DevTools > Application > Service Workers
# Verify registration

# Test domain interception
# Navigate to: http://test.paper
```

### Test P2P Network

```typescript
// Test peer connections
const nodeManager = getNodeManager();
await nodeManager.startNodes();

const libp2p = await nodeManager.getLibp2pNode();
console.log('Peers:', libp2p.getPeerCount());
```

### Test Domain Registration

```typescript
const registry = getGlobalRegistry(...);
const success = await registry.registerGlobal('test.paper', 'QmTest', 'static');

// Verify consensus
const record = await registry.resolveGlobal('test.paper');
console.log('Replicas:', record?.replicas);
```

## Production Checklist

- [ ] Build optimized production bundle
- [ ] Deploy to HTTPS-enabled domain
- [ ] Generate and upload PDF bootstrap
- [ ] Configure bootstrap sources
- [ ] Set up IPFS pinning service
- [ ] Deploy bootstrap P2P nodes
- [ ] Enable HTTPS with valid certificate
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable monitoring/analytics
- [ ] Test Service Worker registration
- [ ] Test domain registration
- [ ] Test P2P connectivity
- [ ] Test content upload/download
- [ ] Verify global domain consensus

## Maintenance

### Update Bootstrap Nodes

```bash
# Add new bootstrap node
git add bootstrap.pdf
git commit -m "Update bootstrap nodes"
git push

# jsDelivr will auto-update within 24h
# Force refresh: https://purge.jsdelivr.net/
```

### Monitor Network Health

```bash
# Check connected peers
curl https://your-domain.com/api/health

# Response:
{
  "status": "healthy",
  "services": {
    "p2p": { "peers": 1247, "status": "up" },
    "ipfs": { "size": "15.3 GB", "status": "up" },
    "dht": { "records": 8432, "status": "up" }
  }
}
```

### Scale Bootstrap Nodes

Deploy multiple bootstrap nodes globally:

```bash
# Deploy to multiple regions
vercel deploy --regions sfo1,iad1,fra1

# Or use Docker
docker run -d \
  --name paper-bootstrap \
  -p 4001:4001 \
  your-ipfs-image
```

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS is enabled
2. Verify Service Worker scope
3. Check browser console for errors
4. Test in incognito mode

### Peers Not Connecting

1. Check WebRTC is enabled
2. Verify bootstrap nodes are online
3. Check firewall/NAT settings
4. Enable STUN/TURN servers

### Domains Not Resolving

1. Wait 10 seconds for propagation
2. Check DHT connectivity
3. Verify PKARR records
4. Check consensus replicas

### Content Not Loading

1. Verify IPFS node is running
2. Check CID is valid
3. Test with public IPFS gateway
4. Check network connectivity

## Support

For issues:
- GitHub: https://github.com/xtoazt/paper/issues
- Docs: See README.md and GLOBAL_DOMAINS_GUIDE.md

---

**Production Ready**: All core features implemented and tested
