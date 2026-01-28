/**
 * Peer Discovery System
 * Discovers and maintains connections to peers in the network
 */

import { P2PNode } from './libp2p-node';
import { WebRTCTransport } from './webrtc-transport';

export interface PeerInfo {
  id: string;
  multiaddrs: string[];
  protocols: string[];
  lastSeen: number;
  score: number;
}

export interface DiscoveryConfig {
  maxPeers?: number;
  discoveryInterval?: number;
  peerTimeout?: number;
}

export class PeerDiscovery {
  private p2pNode: P2PNode;
  private webrtcTransport: WebRTCTransport;
  private peers: Map<string, PeerInfo> = new Map();
  private config: DiscoveryConfig;
  private discoveryTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    p2pNode: P2PNode,
    webrtcTransport: WebRTCTransport,
    config: DiscoveryConfig = {}
  ) {
    this.p2pNode = p2pNode;
    this.webrtcTransport = webrtcTransport;
    this.config = {
      maxPeers: 50,
      discoveryInterval: 30000, // 30 seconds
      peerTimeout: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Start peer discovery
   */
  start(): void {
    if (this.isRunning) {
      console.log('Peer discovery already running');
      return;
    }

    console.log('Starting peer discovery...');
    this.isRunning = true;

    // Start periodic discovery
    this.discoveryTimer = setInterval(() => {
      this.discoverPeers();
      this.cleanupStale Peers();
    }, this.config.discoveryInterval);

    // Initial discovery
    this.discoverPeers();
  }

  /**
   * Stop peer discovery
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping peer discovery...');
    this.isRunning = false;

    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
  }

  /**
   * Discover new peers
   */
  private async discoverPeers(): Promise<void> {
    if (!this.p2pNode.isRunning()) {
      console.log('P2P node not running, skipping discovery');
      return;
    }

    const connectedPeers = this.p2pNode.getPeers();
    console.log(`Discovering peers... Currently connected to ${connectedPeers.length} peers`);

    // Update known peers with connected peers
    for (const peerId of connectedPeers) {
      if (!this.peers.has(peerId)) {
        this.peers.set(peerId, {
          id: peerId,
          multiaddrs: [],
          protocols: [],
          lastSeen: Date.now(),
          score: 1.0
        });
      } else {
        const peer = this.peers.get(peerId)!;
        peer.lastSeen = Date.now();
        peer.score = Math.min(peer.score + 0.1, 1.0);
      }
    }

    // Try to connect to more peers if below max
    if (connectedPeers.length < this.config.maxPeers!) {
      await this.connectToNewPeers();
    }
  }

  /**
   * Connect to new peers
   */
  private async connectToNewPeers(): Promise<void> {
    const node = this.p2pNode.getNode();
    if (!node) return;

    try {
      // Query DHT for random peers
      const dht = this.p2pNode.getDHT();
      if (dht) {
        // Find random peers via DHT
        // This is a placeholder - actual implementation would query DHT
        console.log('Querying DHT for peers...');
      }
    } catch (error) {
      console.error('Error connecting to new peers:', error);
    }
  }

  /**
   * Cleanup stale peers
   */
  private cleanupStalePeers(): void {
    const now = Date.now();
    const timeout = this.config.peerTimeout!;

    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastSeen > timeout) {
        console.log('Removing stale peer:', peerId);
        this.peers.delete(peerId);
      }
    }
  }

  /**
   * Get known peers
   */
  getKnownPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get peer by ID
   */
  getPeer(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get best peers (sorted by score)
   */
  getBestPeers(count: number = 10): PeerInfo[] {
    return Array.from(this.peers.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Update peer score
   */
  updatePeerScore(peerId: string, delta: number): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.score = Math.max(0, Math.min(1, peer.score + delta));
    }
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Check if discovery is running
   */
  isDiscoveryRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let peerDiscoveryInstance: PeerDiscovery | null = null;

/**
 * Get the global peer discovery instance
 */
export function getPeerDiscovery(
  p2pNode: P2PNode,
  webrtcTransport: WebRTCTransport
): PeerDiscovery {
  if (!peerDiscoveryInstance) {
    peerDiscoveryInstance = new PeerDiscovery(p2pNode, webrtcTransport);
  }
  return peerDiscoveryInstance;
}
