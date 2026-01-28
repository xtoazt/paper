/**
 * P2P Infrastructure Module
 * Exports all P2P networking components
 */

// export * from './libp2p-node'; // Old implementation
export * from './libp2p-real';
export * from './webrtc-transport';
export * from './peer-discovery';
export * from './connection-manager';

// Re-export main initialization function
// import { initP2PNode, getP2PNode } from './libp2p-node'; // Old implementation
import { getWebRTCTransport } from './webrtc-transport';
import { getPeerDiscovery } from './peer-discovery';
import { initConnectionManager } from './connection-manager';

/**
 * Initialize the complete P2P infrastructure
 */
export async function initP2PInfrastructure() {
  console.log('Initializing P2P infrastructure...');

  // Initialize P2P node (using new implementation)
  const { Libp2pNode } = await import('./libp2p-real');
  const p2pNode = new Libp2pNode();
  await p2pNode.start();

  // Initialize WebRTC transport
  const webrtcTransport = getWebRTCTransport();

  // Initialize peer discovery
  const peerDiscovery = getPeerDiscovery(p2pNode, webrtcTransport);

  // Initialize connection manager
  const connectionManager = await initConnectionManager(p2pNode, webrtcTransport, peerDiscovery);

  console.log('P2P infrastructure initialized successfully');

  return {
    p2pNode,
    webrtcTransport,
    peerDiscovery,
    connectionManager
  };
}
