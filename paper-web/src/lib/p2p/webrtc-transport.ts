/**
 * WebRTC Transport Layer
 * Handles browser-to-browser connections with NAT traversal
 */

import SimplePeer from 'simple-peer';

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  enableTrickleICE?: boolean;
}

export interface PeerConnection {
  id: string;
  peer: SimplePeer.Instance;
  connected: boolean;
  dataChannel: RTCDataChannel | null;
}

export class WebRTCTransport {
  private connections: Map<string, PeerConnection> = new Map();
  private config: WebRTCConfig;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(config: WebRTCConfig = {}) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      enableTrickleICE: true,
      ...config
    };
  }

  /**
   * Create a new peer connection (initiator)
   */
  async createConnection(peerId: string, initiator: boolean = true): Promise<PeerConnection> {
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId)!;
    }

    const peer = new SimplePeer({
      initiator,
      trickle: this.config.enableTrickleICE,
      config: {
        iceServers: this.config.iceServers
      }
    });

    const connection: PeerConnection = {
      id: peerId,
      peer,
      connected: false,
      dataChannel: null
    };

    this.connections.set(peerId, connection);

    // Set up event handlers
    this.setupPeerHandlers(connection);

    return connection;
  }

  /**
   * Set up event handlers for a peer connection
   */
  private setupPeerHandlers(connection: PeerConnection): void {
    const { peer, id } = connection;

    peer.on('signal', (signal: any) => {
      console.log('WebRTC signal for peer:', id, signal);
      // Signal should be sent to the remote peer via signaling server
      // This will be handled by the P2P node's DHT or PubSub
    });

    peer.on('connect', () => {
      console.log('WebRTC connection established with peer:', id);
      connection.connected = true;
    });

    peer.on('data', (data: Uint8Array) => {
      console.log('Received data from peer:', id);
      const handler = this.messageHandlers.get(id);
      if (handler) {
        try {
          const message = JSON.parse(new TextDecoder().decode(data));
          handler(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          handler(data);
        }
      }
    });

    peer.on('error', (error: Error) => {
      console.error('WebRTC error with peer:', id, error);
      this.closeConnection(id);
    });

    peer.on('close', () => {
      console.log('WebRTC connection closed with peer:', id);
      connection.connected = false;
      this.connections.delete(id);
    });
  }

  /**
   * Send signal to peer (for ICE candidate exchange)
   */
  signal(peerId: string, signal: any): void {
    const connection = this.connections.get(peerId);
    if (!connection) {
      console.error('Connection not found for peer:', peerId);
      return;
    }

    connection.peer.signal(signal);
  }

  /**
   * Send data to peer
   */
  send(peerId: string, data: any): boolean {
    const connection = this.connections.get(peerId);
    if (!connection || !connection.connected) {
      console.error('Cannot send data: peer not connected:', peerId);
      return false;
    }

    try {
      const encoded = typeof data === 'string'
        ? data
        : JSON.stringify(data);
      connection.peer.send(encoded);
      return true;
    } catch (error) {
      console.error('Failed to send data to peer:', peerId, error);
      return false;
    }
  }

  /**
   * Register message handler for a peer
   */
  onMessage(peerId: string, handler: (data: any) => void): void {
    this.messageHandlers.set(peerId, handler);
  }

  /**
   * Close connection with peer
   */
  closeConnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.connections.delete(peerId);
      this.messageHandlers.delete(peerId);
    }
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const [peerId, connection] of this.connections) {
      connection.peer.destroy();
    }
    this.connections.clear();
    this.messageHandlers.clear();
  }

  /**
   * Get connection status
   */
  isConnected(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    return connection?.connected || false;
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.connected)
      .map(conn => conn.id);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.getConnectedPeers().length;
  }

  /**
   * Get connection by peer ID
   */
  getConnection(peerId: string): PeerConnection | undefined {
    return this.connections.get(peerId);
  }
}

// Singleton instance
let webrtcTransportInstance: WebRTCTransport | null = null;

/**
 * Get the global WebRTC transport instance
 */
export function getWebRTCTransport(): WebRTCTransport {
  if (!webrtcTransportInstance) {
    webrtcTransportInstance = new WebRTCTransport();
  }
  return webrtcTransportInstance;
}
