/**
 * P2P Infrastructure Module
 * Exports all P2P networking components
 */

export * from './libp2p-node';
export * from './webrtc-transport';
export * from './peer-discovery';
export * from './connection-manager';

// Re-export main initialization function
import { initP2PNode, getP2PNode } from './libp2p-node';
import { getWebRTCTransport } from './webrtc-transport';
import { getPeerDiscovery } from './peer-discovery';
import { initConnectionManager } from './connection-manager';

/**
 * Initialize the complete P2P infrastructure
 */
export async function initP2PInfrastructure() {
  console.log('Initializing P2P infrastructure...');

  // Initialize P2P node
  const p2pNode = await initP2PNode();

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
