/**
 * Domains Module
 * Exports all domain resolution and management components
 */

export * from './pkarr-resolver';
export * from './dht-resolver';
export * from './onion-generator';
export * from './domain-registry';
export * from './global-registry';
export * from './server-hosting';

// Re-export initialization functions
import { getPKARRResolver } from './pkarr-resolver';
import { getDHTResolver } from './dht-resolver';
import { getOnionGenerator } from './onion-generator';
import { getDomainRegistry } from './domain-registry';
import { getGlobalRegistry } from './global-registry';
import { getServerHosting } from './server-hosting';
import type { P2PNode } from '../p2p/libp2p-real';
import type { EncryptionLayer } from '../tunneling/encryption';
import type { PyodideDNSResolver } from '../pyodide-dns/dns-resolver';
import type { ConnectionManager } from '../p2p/connection-manager';
import type { WebRTCTransport } from '../p2p/webrtc-transport';

/**
 * Initialize complete domains infrastructure with global registry
 */
export async function initDomainsInfrastructure(
  p2pNode: P2PNode,
  encryption: EncryptionLayer,
  pyodideDNS: PyodideDNSResolver,
  connectionManager: ConnectionManager,
  webrtcTransport: WebRTCTransport
) {
  console.log('Initializing domains infrastructure with global registry...');

  // Initialize PKARR resolver
  const pkarrResolver = getPKARRResolver(encryption, p2pNode);

  // Initialize DHT resolver
  const dhtResolver = getDHTResolver(p2pNode, pkarrResolver, pyodideDNS);

  // Initialize onion generator
  const onionGenerator = getOnionGenerator(pkarrResolver);

  // Initialize domain registry
  const domainRegistry = getDomainRegistry(dhtResolver, pkarrResolver, onionGenerator);

  // Initialize global registry (ensures domains are globally consistent)
  const globalRegistry = getGlobalRegistry(
    pkarrResolver,
    dhtResolver,
    p2pNode,
    connectionManager
  );

  // Initialize server hosting
  const serverHosting = getServerHosting(globalRegistry, p2pNode, webrtcTransport);

  console.log('Domains infrastructure initialized successfully');

  return {
    pkarrResolver,
    dhtResolver,
    onionGenerator,
    domainRegistry,
    globalRegistry,
    serverHosting
  };
}
