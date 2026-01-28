/**
 * Connection Manager
 * Manages P2P connections and handles connection lifecycle
 */

import { P2PNode } from './libp2p-real';
import { WebRTCTransport } from './webrtc-transport';
import { PeerDiscovery } from './peer-discovery';

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  bytesReceived: number;
  bytesSent: number;
}

export class ConnectionManager {
  private p2pNode: P2PNode;
  private webrtcTransport: WebRTCTransport;
  private peerDiscovery: PeerDiscovery;
  private stats: ConnectionStats;

  constructor(
    p2pNode: P2PNode,
    webrtcTransport: WebRTCTransport,
    peerDiscovery: PeerDiscovery
  ) {
    this.p2pNode = p2pNode;
    this.webrtcTransport = webrtcTransport;
    this.peerDiscovery = peerDiscovery;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      bytesReceived: 0,
      bytesSent: 0
    };
  }

  /**
   * Initialize connection manager
   */
  async initialize(): Promise<void> {
    console.log('Initializing connection manager...');

    // Start P2P node if not running
    if (!this.p2pNode.isRunning()) {
      await this.p2pNode.start();
    }

    // Start peer discovery
    this.peerDiscovery.start();

    console.log('Connection manager initialized');
  }

  /**
   * Shutdown connection manager
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down connection manager...');

    // Stop peer discovery
    this.peerDiscovery.stop();

    // Close all WebRTC connections
    this.webrtcTransport.closeAll();

    // Stop P2P node
    await this.p2pNode.stop();

    console.log('Connection manager shut down');
  }

  /**
   * Connect to a peer
   */
  async connectToPeer(peerId: string, initiator: boolean = true): Promise<boolean> {
    try {
      console.log('Connecting to peer:', peerId);

      // Create WebRTC connection
      const connection = await this.webrtcTransport.createConnection(peerId, initiator);

      this.stats.totalConnections++;

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.stats.failedConnections++;
          resolve(false);
        }, 10000); // 10 second timeout

        const checkConnection = setInterval(() => {
          if (connection.connected) {
            clearTimeout(timeout);
            clearInterval(checkConnection);
            this.stats.activeConnections++;
            resolve(true);
          }
        }, 100);
      });
    } catch (error) {
      console.error('Failed to connect to peer:', peerId, error);
      this.stats.failedConnections++;
      return false;
    }
  }

  /**
   * Disconnect from a peer
   */
  disconnectFromPeer(peerId: string): void {
    console.log('Disconnecting from peer:', peerId);
    this.webrtcTransport.closeConnection(peerId);
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
  }

  /**
   * Send message to peer
   */
  sendToPeer(peerId: string, message: any): boolean {
    const sent = this.webrtcTransport.send(peerId, message);
    if (sent) {
      const size = JSON.stringify(message).length;
      this.stats.bytesSent += size;
    }
    return sent;
  }

  /**
   * Broadcast message to all connected peers
   */
  broadcast(message: any): number {
    const peers = this.webrtcTransport.getConnectedPeers();
    let sentCount = 0;

    for (const peerId of peers) {
      if (this.sendToPeer(peerId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Publish message to PubSub topic
   */
  async publishTopic(topic: string, data: any): Promise<void> {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    await this.p2pNode.publish(topic, encoded);
  }

  /**
   * Subscribe to PubSub topic
   */
  subscribeTopic(topic: string, handler: (data: any) => void): void {
    this.p2pNode.subscribe(topic, (data: Uint8Array) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(data));
        handler(decoded);
      } catch (error) {
        console.error('Failed to parse PubSub message:', error);
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    this.stats.activeConnections = this.webrtcTransport.getConnectionCount();
    return { ...this.stats };
  }

  /**
   * Get connected peer count
   */
  getPeerCount(): number {
    return this.webrtcTransport.getConnectionCount() + this.p2pNode.getPeerCount();
  }

  /**
   * Get list of connected peers
   */
  getConnectedPeers(): string[] {
    const webrtcPeers = this.webrtcTransport.getConnectedPeers();
    const libp2pPeers = this.p2pNode.getPeers().map((p: any) => 
      typeof p === 'string' ? p : p.toString()
    );
    return [...new Set([...webrtcPeers, ...libp2pPeers])];
  }

  /**
   * Check if connected to peer
   */
  isConnectedToPeer(peerId: string | any): boolean {
    const peerIdStr = typeof peerId === 'string' ? peerId : peerId.toString();
    return this.webrtcTransport.isConnected(peerIdStr) ||
           this.p2pNode.getPeers().map((p: any) => typeof p === 'string' ? p : p.toString()).includes(peerIdStr);
  }

  /**
   * Get P2P node instance
   */
  getP2PNode(): P2PNode {
    return this.p2pNode;
  }

  /**
   * Get WebRTC transport instance
   */
  getWebRTCTransport(): WebRTCTransport {
    return this.webrtcTransport;
  }

  /**
   * Get peer discovery instance
   */
  getPeerDiscovery(): PeerDiscovery {
    return this.peerDiscovery;
  }
}

// Singleton instance
let connectionManagerInstance: ConnectionManager | null = null;

/**
 * Get the global connection manager instance
 */
export function getConnectionManager(): ConnectionManager | null {
  return connectionManagerInstance;
}

/**
 * Initialize connection manager
 */
export async function initConnectionManager(
  p2pNode: P2PNode,
  webrtcTransport: WebRTCTransport,
  peerDiscovery: PeerDiscovery
): Promise<ConnectionManager> {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new ConnectionManager(p2pNode, webrtcTransport, peerDiscovery);
    await connectionManagerInstance.initialize();
  }
  return connectionManagerInstance;
}
