/**
 * Tunneling Module
 * Exports all tunneling components
 */

export * from './encryption';
export * from './onion-routing';
export * from './webrtc-channels';
export * from './tunnel-manager';

// Re-export initialization functions
import { getEncryptionLayer } from './encryption';
import { getOnionRouting } from './onion-routing';
import { getWebRTCChannels } from './webrtc-channels';
import { initTunnelManager } from './tunnel-manager';
import { WebRTCTransport } from '../p2p/webrtc-transport';
import { PeerDiscovery } from '../p2p/peer-discovery';

/**
 * Initialize complete tunneling infrastructure
 */
export async function initTunnelingInfrastructure(
  webrtcTransport: WebRTCTransport,
  peerDiscovery: PeerDiscovery
) {
  console.log('Initializing tunneling infrastructure...');

  // Initialize encryption layer
  const encryption = getEncryptionLayer();
  await encryption.generateKeyPair();

  // Initialize onion routing
  const onionRouting = getOnionRouting(encryption, webrtcTransport);

  // Initialize WebRTC channels
  const webrtcChannels = getWebRTCChannels(webrtcTransport, encryption);

  // Initialize tunnel manager
  const tunnelManager = await initTunnelManager(
    onionRouting,
    webrtcChannels,
    encryption,
    peerDiscovery
  );

  console.log('Tunneling infrastructure initialized successfully');

  return {
    encryption,
    onionRouting,
    webrtcChannels,
    tunnelManager
  };
}
