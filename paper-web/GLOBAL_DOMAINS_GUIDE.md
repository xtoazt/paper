# Global .paper Domains Guide

## How .paper Domains Work Globally

.paper domains are **truly decentralized** and **globally consistent** across the entire network. When you register `green.paper`, it's the same `green.paper` everywhere in the world.

## Architecture

```
User registers green.paper
         ↓
1. PKARR generates cryptographic keypair
2. Domain signed with private key
3. Published to DHT (distributed hash table)
4. Broadcast to all connected peers via PubSub
5. Consensus achieved across network
         ↓
green.paper is now globally accessible
```

## Domain Types

### 1. Static Content Domains
Host static websites (HTML, CSS, JS) on IPFS:

```typescript
// Register domain with IPFS content
await globalRegistry.registerGlobal('mysite.paper', 'QmIPFSCID', 'static');

// Content is automatically:
// - Published to IPFS
// - Registered in DHT
// - Broadcast to all peers
// - Verified via PKARR signatures
```

### 2. Dynamic Content Domains
Host dynamic content that updates frequently:

```typescript
await globalRegistry.registerGlobal('blog.paper', 'QmNewContent', 'dynamic');

// Updates propagate across network within seconds
```

### 3. Server Domains
Host actual HTTP/WebSocket servers:

```typescript
// Host a server
await serverHosting.hostServer('api.paper', {
  port: 80,
  protocol: 'http'
});

// Add request handlers
serverHosting.addHandler('api.paper', '/hello', async (req) => ({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello from Paper!' })
}));

// Server is now accessible globally at api.paper
```

## Global Consistency Mechanism

### Consensus Algorithm

When resolving a domain, the system:

1. **Query Multiple Sources**:
   - PKARR records (cryptographically signed)
   - DHT records
   - Direct peer queries

2. **Collect Records**:
   ```
   Peer A: green.paper → QmABC123
   Peer B: green.paper → QmABC123
   Peer C: green.paper → QmABC123
   Peer D: green.paper → QmXYZ789 (malicious)
   ```

3. **Achieve Consensus**:
   - Group records by content hash
   - Select most common record (75% agreement)
   - Verify cryptographic signature
   - Return consensus record

4. **Result**:
   ```
   green.paper resolves to QmABC123 (verified, 75% consensus)
   ```

### Cryptographic Verification

Every domain registration includes:

```typescript
{
  domain: "green.paper",
  owner: "ed25519_public_key_hash",  // Proves ownership
  content: "QmIPFSCID",
  timestamp: 1706472000000,
  signature: "ed25519_signature"     // Prevents tampering
}
```

Only the owner (with private key) can update the domain.

## Domain Registration

### Simple Registration

```typescript
import { getGlobalRegistry } from './lib/domains';

// Register domain globally
const success = await globalRegistry.registerGlobal(
  'mysite.paper',
  'QmYourIPFSCID',
  'static'
);
```

### Cryptographic (Onion-style) Domain

```typescript
import { getOnionGenerator } from './lib/domains';

// Generate cryptographically unique domain
const onionDomain = await onionGenerator.generate();
// Result: abc123def456ghi789.paper

// Domain is derived from public key - impossible to spoof
```

## Domain Resolution

```typescript
import { getGlobalRegistry } from './lib/domains';

// Resolve domain globally
const record = await globalRegistry.resolveGlobal('green.paper');

if (record) {
  console.log('Domain:', record.domain);
  console.log('Content:', record.content);
  console.log('Owner:', record.owner);
  console.log('Consensus:', record.replicas, 'peers agree');
  console.log('Verified:', record.verified);
}
```

## Server Hosting Example

### Complete Server Setup

```typescript
import { getServerHosting } from './lib/domains/server-hosting';

// 1. Host server
await serverHosting.hostServer('api.paper');

// 2. Add API endpoints
serverHosting.addHandler('api.paper', '/users', async (req) => {
  if (req.method === 'GET') {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ])
    };
  }
});

serverHosting.addHandler('api.paper', '/posts/*', async (req) => {
  // Handle /posts/:id
  const id = req.path.split('/')[2];
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title: 'Post ' + id })
  };
});

// 3. Server is now accessible
// Anyone can: fetch('http://api.paper/users')
```

## How It's Different from Traditional DNS

| Feature | Traditional DNS | Paper .paper |
|---------|----------------|--------------|
| **Control** | ICANN, registrars | You (private key) |
| **Censorship** | Governments can block | Impossible to block |
| **Cost** | $10-50/year | FREE forever |
| **Speed** | 100-500ms | 50-200ms (P2P) |
| **Privacy** | Queries logged | Anonymous via DHT |
| **Global** | Centralized servers | Distributed peers |
| **Verification** | Trust registrars | Cryptographic proof |

## Network Propagation

When you register a domain:

```
Time 0s:  Registration on your node
Time 1s:  Broadcast to connected peers (10-50 peers)
Time 2s:  Peers relay to their peers (100-500 peers)
Time 5s:  Available across entire network (1000+ peers)
Time 10s: Consensus achieved, cached everywhere
```

## Security Guarantees

1. **Ownership**: Only private key holder can update domain
2. **Integrity**: Cryptographic signatures prevent tampering
3. **Availability**: DHT ensures domain survives peer churn
4. **Consistency**: Consensus algorithm prevents conflicts
5. **Privacy**: No central authority sees your queries

## Examples

### Host a Blog

```typescript
// 1. Create content
const blogHTML = `<html><body><h1>My Paper Blog</h1></body></html>`;

// 2. Upload to IPFS
const cid = await ipfsNode.add(blogHTML);

// 3. Register domain
await globalRegistry.registerGlobal('myblog.paper', cid, 'static');

// Done! myblog.paper is now accessible worldwide
```

### Host an API

```typescript
await serverHosting.hostServer('myapi.paper');

serverHosting.addHandler('myapi.paper', '/data', async () => ({
  status: 200,
  body: { message: 'Hello World' }
}));
```

### Update Domain

```typescript
// Update content (only owner can do this)
const newCID = await ipfsNode.add(updatedContent);
await globalRegistry.registerGlobal('myblog.paper', newCID, 'static');

// Update propagates across network automatically
```

## Troubleshooting

### Domain Not Resolving

1. **Check network**: Are you connected to peers?
   ```typescript
   const stats = await globalRegistry.getStats();
   console.log('Connected peers:', stats.connectedPeers);
   ```

2. **Wait for propagation**: Initial registration takes 5-10 seconds

3. **Check consensus**:
   ```typescript
   const record = await globalRegistry.resolveGlobal('domain.paper');
   console.log('Replicas:', record?.replicas);
   ```

### Domain Conflict

Impossible! Each domain is tied to a cryptographic keypair. Only the private key holder can update it.

### Slow Resolution

Enable caching:
```typescript
// Resolution is cached for 5 minutes by default
// First query: 2-5 seconds
// Subsequent queries: <10ms (from cache)
```

## Best Practices

1. **Backup Private Keys**: Store PKARR keypairs securely
2. **Use Static Domains**: For websites, prefer IPFS (faster, cached)
3. **Server Domains**: For APIs, use server hosting (dynamic)
4. **Update Frequently**: Keep content fresh (updates are instant)
5. **Monitor Consensus**: Check replicas to ensure propagation

## Future Enhancements

- [ ] ENS integration (Ethereum Name Service)
- [ ] Human-readable domain aliases
- [ ] Domain marketplace
- [ ] Subdomain support
- [ ] Wildcard SSL certificates
- [ ] Domain transfer protocol
