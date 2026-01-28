/**
 * Tunnel Manager
 * Manages multiple tunnel connections with routing and failover
 */

import { OnionRouting, OnionCircuit, OnionNode } from './onion-routing';
import { WebRTCChannels } from './webrtc-channels';
import { EncryptionLayer } from './encryption';
import { PeerDiscovery } from '../p2p/peer-discovery';

export interface Tunnel {
  id: string;
  circuit: OnionCircuit;
  active: boolean;
  lastUsed: number;
  messagesSent: number;
}

export interface TunnelConfig {
  minTunnels?: number;
  maxTunnels?: number;
  tunnelLifetime?: number;
  recreateInterval?: number;
}

export class TunnelManager {
  private onionRouting: OnionRouting;
  private webrtcChannels: WebRTCChannels;
  private encryption: EncryptionLayer;
  private peerDiscovery: PeerDiscovery;
  private tunnels: Map<string, Tunnel> = new Map();
  private config: TunnelConfig;
  private maintenanceTimer: NodeJS.Timeout | null = null;

  constructor(
    onionRouting: OnionRouting,
    webrtcChannels: WebRTCChannels,
    encryption: EncryptionLayer,
    peerDiscovery: PeerDiscovery,
    config: TunnelConfig = {}
  ) {
    this.onionRouting = onionRouting;
    this.webrtcChannels = webrtcChannels;
    this.encryption = encryption;
    this.peerDiscovery = peerDiscovery;
    this.config = {
      minTunnels: 3,
      maxTunnels: 10,
      tunnelLifetime: 600000, // 10 minutes
      recreateInterval: 60000, // 1 minute
      ...config
    };
  }

  /**
   * Initialize tunnel manager
   */
  async initialize(): Promise<void> {
    console.log('Initializing tunnel manager...');

    // Create initial tunnels
    await this.ensureMinimumTunnels();

    // Start maintenance loop
    this.startMaintenance();

    console.log('Tunnel manager initialized');
  }

  /**
   * Shutdown tunnel manager
   */
  shutdown(): void {
    console.log('Shutting down tunnel manager...');

    // Stop maintenance
    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = null;
    }

    // Destroy all tunnels
    for (const tunnel of this.tunnels.values()) {
      this.onionRouting.destroyCircuit(tunnel.circuit.id);
    }
    this.tunnels.clear();

    console.log('Tunnel manager shut down');
  }

  /**
   * Send message through a tunnel
   */
  async sendThroughTunnel(message: Uint8Array | string): Promise<void> {
    // Get an active tunnel
    const tunnel = this.getActiveTunnel();
    if (!tunnel) {
      throw new Error('No active tunnels available');
    }

    // Send through onion circuit
    await this.onionRouting.sendThroughCircuit(tunnel.circuit.id, message);

    // Update tunnel stats
    tunnel.lastUsed = Date.now();
    tunnel.messagesSent++;
  }

  /**
   * Route request through tunnel with load balancing
   */
  async routeRequest(destination: string, data: any): Promise<any> {
    const tunnel = this.getActiveTunnel();
    if (!tunnel) {
      throw new Error('No active tunnels available');
    }

    const request = {
      destination,
      data,
      timestamp: Date.now()
    };

    const serialized = JSON.stringify(request);
    await this.sendThroughTunnel(serialized);

    // In a real implementation, we would wait for response
    // For now, we'll return null
    return null;
  }

  /**
   * Create a new tunnel
   */
  async createTunnel(hopCount: number = 3): Promise<Tunnel> {
    // Get best peers for tunnel
    const bestPeers = this.peerDiscovery.getBestPeers(hopCount * 2);
    
    if (bestPeers.length < hopCount) {
      throw new Error('Not enough peers for tunnel');
    }

    // Select random peers for circuit
    const nodes: OnionNode[] = [];
    const selectedPeers = this.selectRandomPeers(bestPeers, hopCount);

    for (const peer of selectedPeers) {
      // Generate a public key for the peer (in real impl, get from peer)
      const keyPair = await this.encryption.generateKeyPair();
      nodes.push({
        peerId: peer.id,
        publicKey: keyPair.publicKey
      });
    }

    // Create onion circuit
    const circuit = await this.onionRouting.createCircuit(nodes);

    // Create tunnel
    const tunnel: Tunnel = {
      id: circuit.id,
      circuit,
      active: true,
      lastUsed: Date.now(),
      messagesSent: 0
    };

    this.tunnels.set(tunnel.id, tunnel);

    console.log('Tunnel created:', tunnel.id);
    return tunnel;
  }

  /**
   * Destroy tunnel
   */
  destroyTunnel(tunnelId: string): void {
    const tunnel = this.tunnels.get(tunnelId);
    if (tunnel) {
      this.onionRouting.destroyCircuit(tunnel.circuit.id);
      this.tunnels.delete(tunnelId);
      console.log('Tunnel destroyed:', tunnelId);
    }
  }

  /**
   * Get active tunnel (load balancing)
   */
  private getActiveTunnel(): Tunnel | null {
    const activeTunnels = Array.from(this.tunnels.values())
      .filter(t => t.active);

    if (activeTunnels.length === 0) {
      return null;
    }

    // Simple round-robin selection (could be improved with better load balancing)
    const sorted = activeTunnels.sort((a, b) => a.messagesSent - b.messagesSent);
    return sorted[0];
  }

  /**
   * Ensure minimum number of tunnels
   */
  private async ensureMinimumTunnels(): Promise<void> {
    const activeTunnels = Array.from(this.tunnels.values())
      .filter(t => t.active).length;

    const needed = this.config.minTunnels! - activeTunnels;
    
    if (needed > 0) {
      console.log('Creating', needed, 'tunnels to meet minimum');
      
      for (let i = 0; i < needed; i++) {
        try {
          await this.createTunnel();
        } catch (error) {
          console.error('Failed to create tunnel:', error);
        }
      }
    }
  }

  /**
   * Clean up old tunnels
   */
  private cleanupOldTunnels(): void {
    const now = Date.now();
    const lifetime = this.config.tunnelLifetime!;

    for (const [id, tunnel] of this.tunnels) {
      if (now - tunnel.lastUsed > lifetime) {
        this.destroyTunnel(id);
      }
    }
  }

  /**
   * Start maintenance loop
   */
  private startMaintenance(): void {
    this.maintenanceTimer = setInterval(async () => {
      // Clean up old tunnels
      this.cleanupOldTunnels();

      // Ensure minimum tunnels
      await this.ensureMinimumTunnels();

      // Recreate heavily used tunnels
      this.recreateHeavyTunnels();
    }, this.config.recreateInterval!);
  }

  /**
   * Recreate heavily used tunnels
   */
  private recreateHeavyTunnels(): void {
    const threshold = 1000; // messages
    
    for (const tunnel of this.tunnels.values()) {
      if (tunnel.messagesSent > threshold) {
        console.log('Recreating heavily used tunnel:', tunnel.id);
        this.destroyTunnel(tunnel.id);
        // New tunnel will be created by ensureMinimumTunnels
      }
    }
  }

  /**
   * Select random peers
   */
  private selectRandomPeers(peers: any[], count: number): any[] {
    const shuffled = [...peers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get tunnel stats
   */
  getStats(): any {
    const tunnels = Array.from(this.tunnels.values());
    const activeTunnels = tunnels.filter(t => t.active);

    return {
      total: tunnels.length,
      active: activeTunnels.length,
      totalMessages: tunnels.reduce((sum, t) => sum + t.messagesSent, 0),
      oldestTunnel: tunnels.length > 0
        ? Math.min(...tunnels.map(t => t.lastUsed))
        : null
    };
  }

  /**
   * Get all tunnels
   */
  getTunnels(): Tunnel[] {
    return Array.from(this.tunnels.values());
  }

  /**
   * Get tunnel by ID
   */
  getTunnel(tunnelId: string): Tunnel | undefined {
    return this.tunnels.get(tunnelId);
  }
}

// Singleton instance
let tunnelManagerInstance: TunnelManager | null = null;

/**
 * Get tunnel manager instance
 */
export function getTunnelManager(
  onionRouting: OnionRouting,
  webrtcChannels: WebRTCChannels,
  encryption: EncryptionLayer,
  peerDiscovery: PeerDiscovery
): TunnelManager {
  if (!tunnelManagerInstance) {
    tunnelManagerInstance = new TunnelManager(
      onionRouting,
      webrtcChannels,
      encryption,
      peerDiscovery
    );
  }
  return tunnelManagerInstance;
}

/**
 * Initialize tunnel manager
 */
export async function initTunnelManager(
  onionRouting: OnionRouting,
  webrtcChannels: WebRTCChannels,
  encryption: EncryptionLayer,
  peerDiscovery: PeerDiscovery,
  config?: TunnelConfig
): Promise<TunnelManager> {
  const manager = new TunnelManager(
    onionRouting,
    webrtcChannels,
    encryption,
    peerDiscovery,
    config
  );
  await manager.initialize();
  tunnelManagerInstance = manager;
  return manager;
}
