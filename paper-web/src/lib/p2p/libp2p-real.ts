/**
 * Real libp2p P2P Networking
 * WebRTC-based peer-to-peer networking for Paper Network
 */

import { createLibp2p, Libp2p } from 'libp2p';
import { webRTC } from '@libp2p/webrtc';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { bootstrap } from '@libp2p/bootstrap';
import type { PeerId } from '@libp2p/interface';

export interface LibP2PConfig {
  enableDHT?: boolean;
  enablePubSub?: boolean;
  bootstrapPeers?: string[];
}

export class LibP2PNode {
  private node: Libp2p | null = null;
  private config: LibP2PConfig;
  private messageHandlers: Map<string, (msg: any) => void> = new Map();

  constructor(config: LibP2PConfig = {}) {
    this.config = {
      enableDHT: true,
      enablePubSub: true,
      bootstrapPeers: [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
      ],
      ...config
    };
  }

  /**
   * Initialize and start libp2p node
   */
  async start(): Promise<void> {
    if (this.node) {
      console.log('[libp2p] Node already running');
      return;
    }

    console.log('[libp2p] Starting P2P node...');

    try {
      const libp2pOptions: any = {
        addresses: {
          listen: ['/webrtc']
        },
        transports: [webRTC()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        services: {
          identify: identify()
        }
      };

      // Add DHT if enabled
      if (this.config.enableDHT) {
        libp2pOptions.services.dht = kadDHT();
      }

      // Add PubSub if enabled
      if (this.config.enablePubSub) {
        libp2pOptions.services.pubsub = gossipsub({
          allowPublishToZeroTopicPeers: true,
          emitSelf: false
        });
      }

      // Add bootstrap if peers provided
      if (this.config.bootstrapPeers && this.config.bootstrapPeers.length > 0) {
        libp2pOptions.peerDiscovery = [
          bootstrap({
            list: this.config.bootstrapPeers
          })
        ];
      }

      this.node = await createLibp2p(libp2pOptions);

      // Start the node
      await this.node.start();

      console.log('[libp2p] Node started successfully');
      console.log('[libp2p] Peer ID:', this.node.peerId.toString());

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('[libp2p] Failed to start node:', error);
      throw error;
    }
  }

  /**
   * Stop libp2p node
   */
  async stop(): Promise<void> {
    if (!this.node) return;

    console.log('[libp2p] Stopping P2P node...');
    await this.node.stop();
    this.node = null;
    console.log('[libp2p] Node stopped');
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.node) return;

    // Peer discovery
    this.node.addEventListener('peer:discovery', (evt) => {
      console.log('[libp2p] Discovered peer:', evt.detail.id.toString());
    });

    // Peer connection
    this.node.addEventListener('peer:connect', (evt) => {
      console.log('[libp2p] Connected to peer:', evt.detail.toString());
    });

    // Peer disconnection
    this.node.addEventListener('peer:disconnect', (evt) => {
      console.log('[libp2p] Disconnected from peer:', evt.detail.toString());
    });

    // PubSub messages
    const pubsub = this.node.services['pubsub'] as any;
    if (pubsub && typeof pubsub.addEventListener === 'function') {
      pubsub.addEventListener('message', (evt: any) => {
        const topic = evt.detail.topic;
        const handler = this.messageHandlers.get(topic);
        
        if (handler) {
          try {
            const data = new TextDecoder().decode(evt.detail.data);
            const message = JSON.parse(data);
            handler(message);
          } catch (error) {
            console.error('[libp2p] Failed to parse message:', error);
          }
        }
      });
    }
  }

  /**
   * Publish message to topic
   */
  async publish(topic: string, data: any): Promise<void> {
    const pubsub = this.node?.services['pubsub'] as any;
    if (!pubsub || typeof pubsub.publish !== 'function') {
      throw new Error('PubSub not enabled');
    }

    try {
      const message = JSON.stringify(data);
      const encoded = new TextEncoder().encode(message);
      await pubsub.publish(topic, encoded);
      console.log('[libp2p] Published to topic:', topic);
    } catch (error) {
      console.error('[libp2p] Failed to publish:', error);
      throw error;
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribe(topic: string, handler: (msg: any) => void): Promise<void> {
    const pubsub = this.node?.services['pubsub'] as any;
    if (!pubsub || typeof pubsub.subscribe !== 'function') {
      throw new Error('PubSub not enabled');
    }

    try {
      this.messageHandlers.set(topic, handler);
      pubsub.subscribe(topic);
      console.log('[libp2p] Subscribed to topic:', topic);
    } catch (error) {
      console.error('[libp2p] Failed to subscribe:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribe(topic: string): Promise<void> {
    const pubsub = this.node?.services['pubsub'] as any;
    if (!pubsub || typeof pubsub.unsubscribe !== 'function') return;

    try {
      this.messageHandlers.delete(topic);
      pubsub.unsubscribe(topic);
      console.log('[libp2p] Unsubscribed from topic:', topic);
    } catch (error) {
      console.error('[libp2p] Failed to unsubscribe:', error);
    }
  }

  /**
   * Get DHT value
   */
  async getDHT(key: string): Promise<Uint8Array | null> {
    const dht = this.node?.services['dht'] as any;
    if (!dht || typeof dht.get !== 'function') {
      console.warn('[libp2p] DHT not available');
      return null;
    }

    try {
      const keyBytes = new TextEncoder().encode(key);
      const result = await dht.get(keyBytes);
      return result;
    } catch (error) {
      console.error('[libp2p] Failed to get from DHT:', error);
      return null;
    }
  }

  /**
   * Put DHT value
   */
  async putDHT(key: string, value: Uint8Array): Promise<void> {
    const dht = this.node?.services['dht'] as any;
    if (!dht || typeof dht.put !== 'function') {
      console.warn('[libp2p] DHT not available');
      return;
    }

    try {
      const keyBytes = new TextEncoder().encode(key);
      await dht.put(keyBytes, value);
      console.log('[libp2p] Put to DHT:', key);
    } catch (error) {
      console.error('[libp2p] Failed to put to DHT:', error);
      throw error;
    }
  }

  /**
   * Get connected peers
   */
  getPeers(): PeerId[] {
    if (!this.node) return [];
    return this.node.getPeers();
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.getPeers().length;
  }

  /**
   * Dial a peer
   */
  async dialPeer(peerId: PeerId): Promise<void> {
    if (!this.node) {
      throw new Error('Node not started');
    }

    try {
      await this.node.dial(peerId);
      console.log('[libp2p] Dialed peer:', peerId.toString());
    } catch (error) {
      console.error('[libp2p] Failed to dial peer:', error);
      throw error;
    }
  }

  /**
   * Get node info
   */
  getNodeInfo(): {
    peerId: string;
    addresses: string[];
    protocols: string[];
    peerCount: number;
  } | null {
    if (!this.node) return null;

    return {
      peerId: this.node.peerId.toString(),
      addresses: this.node.getMultiaddrs().map(ma => ma.toString()),
      protocols: Object.keys(this.node.services),
      peerCount: this.getPeerCount()
    };
  }

  /**
   * Check if node is running
   */
  isRunning(): boolean {
    return this.node !== null && this.node.status === 'started';
  }

  /**
   * Get libp2p instance
   */
  getNode(): Libp2p | null {
    return this.node;
  }
}

// Singleton instance
let libp2pNodeInstance: LibP2PNode | null = null;

/**
 * Get singleton libp2p node
 */
export function getLibP2PNode(): LibP2PNode {
  if (!libp2pNodeInstance) {
    libp2pNodeInstance = new LibP2PNode();
  }
  return libp2pNodeInstance;
}

/**
 * Initialize libp2p node
 */
export async function initLibP2PNode(config?: LibP2PConfig): Promise<LibP2PNode> {
  const node = getLibP2PNode();
  if (!node.isRunning()) {
    await node.start();
  }
  return node;
}

// Backward compatibility alias
export { LibP2PNode as P2PNode, LibP2PNode as Libp2pNode };
