/**
 * libp2p Node Implementation
 * Core P2P networking node with WebRTC transport, DHT, and PubSub
 */

import { createLibp2p, Libp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webRTC } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { kadDHT, KadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@libp2p/gossipsub';
import { identify } from '@libp2p/identify';
import { bootstrap } from '@libp2p/bootstrap';

export interface P2PNodeConfig {
  bootstrapPeers?: string[];
  enableDHT?: boolean;
  enablePubSub?: boolean;
  enableWebRTC?: boolean;
}

export class P2PNode {
  private node: Libp2p | null = null;
  private dht: KadDHT | null = null;
  private config: P2PNodeConfig;
  private isStarted = false;

  constructor(config: P2PNodeConfig = {}) {
    this.config = {
      enableDHT: true,
      enablePubSub: true,
      enableWebRTC: true,
      bootstrapPeers: [
        // Default bootstrap peers (will be populated with real nodes)
        '/dns4/bootstrap.paper.network/tcp/443/wss/p2p/QmBootstrap1',
        '/dns4/bootstrap2.paper.network/tcp/443/wss/p2p/QmBootstrap2'
      ],
      ...config
    };
  }

  /**
   * Initialize and start the libp2p node
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      console.log('P2P node already started');
      return;
    }

    console.log('Starting P2P node...');

    try {
      const transports: any[] = [webSockets()];
      
      // Add WebRTC transport for browser-to-browser connections
      if (this.config.enableWebRTC) {
        transports.push(webRTC());
      }

      const services: any = {
        identify: identify()
      };

      // Enable DHT for peer discovery and content routing
      if (this.config.enableDHT) {
        services.dht = kadDHT({
          clientMode: false,
          validators: {},
          selectors: {}
        });
      }

      // Enable PubSub for real-time messaging
      if (this.config.enablePubSub) {
        services.pubsub = gossipsub({
          allowPublishToZeroPeers: true,
          emitSelf: false
        });
      }

      // Create libp2p node
      this.node = await createLibp2p({
        addresses: {
          listen: [
            '/webrtc',
            '/wss'
          ]
        },
        transports,
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        peerDiscovery: this.config.bootstrapPeers && this.config.bootstrapPeers.length > 0
          ? [
              bootstrap({
                list: this.config.bootstrapPeers
              })
            ]
          : [],
        services
      });

      // Start the node
      await this.node.start();
      this.isStarted = true;

      // Get DHT service
      if (this.config.enableDHT && this.node.services.dht) {
        this.dht = this.node.services.dht as KadDHT;
      }

      console.log('P2P node started successfully');
      console.log('Peer ID:', this.node.peerId.toString());
      console.log('Listening addresses:', this.node.getMultiaddrs());

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to start P2P node:', error);
      throw error;
    }
  }

  /**
   * Stop the libp2p node
   */
  async stop(): Promise<void> {
    if (!this.node || !this.isStarted) {
      return;
    }

    console.log('Stopping P2P node...');
    await this.node.stop();
    this.isStarted = false;
    this.node = null;
    this.dht = null;
    console.log('P2P node stopped');
  }

  /**
   * Get the libp2p node instance
   */
  getNode(): Libp2p | null {
    return this.node;
  }

  /**
   * Get the DHT instance
   */
  getDHT(): KadDHT | null {
    return this.dht;
  }

  /**
   * Get node peer ID
   */
  getPeerId(): string {
    return this.node?.peerId.toString() || '';
  }

  /**
   * Get connected peers
   */
  getPeers(): string[] {
    if (!this.node) return [];
    return Array.from(this.node.getPeers()).map(peer => peer.toString());
  }

  /**
   * Get number of connected peers
   */
  getPeerCount(): number {
    return this.getPeers().length;
  }

  /**
   * Check if node is started
   */
  isRunning(): boolean {
    return this.isStarted && this.node !== null;
  }

  /**
   * Publish message to PubSub topic
   */
  async publish(topic: string, data: Uint8Array): Promise<void> {
    if (!this.node || !this.config.enablePubSub) {
      throw new Error('PubSub not enabled');
    }

    const pubsub = this.node.services.pubsub as any;
    if (!pubsub) {
      throw new Error('PubSub service not available');
    }

    await pubsub.publish(topic, data);
  }

  /**
   * Subscribe to PubSub topic
   */
  subscribe(topic: string, handler: (data: Uint8Array) => void): void {
    if (!this.node || !this.config.enablePubSub) {
      throw new Error('PubSub not enabled');
    }

    const pubsub = this.node.services.pubsub as any;
    if (!pubsub) {
      throw new Error('PubSub service not available');
    }

    pubsub.subscribe(topic);
    pubsub.addEventListener('message', (evt: any) => {
      if (evt.detail.topic === topic) {
        handler(evt.detail.data);
      }
    });
  }

  /**
   * Store value in DHT
   */
  async putDHT(key: Uint8Array, value: Uint8Array): Promise<void> {
    if (!this.dht) {
      throw new Error('DHT not enabled');
    }

    await this.dht.put(key, value);
  }

  /**
   * Get value from DHT
   */
  async getDHT(key: Uint8Array): Promise<Uint8Array | null> {
    if (!this.dht) {
      throw new Error('DHT not enabled');
    }

    try {
      for await (const event of this.dht.get(key)) {
        if (event.name === 'VALUE') {
          return event.value;
        }
      }
      return null;
    } catch (error) {
      console.error('DHT get error:', error);
      return null;
    }
  }

  /**
   * Set up event listeners for the node
   */
  private setupEventListeners(): void {
    if (!this.node) return;

    this.node.addEventListener('peer:connect', (evt: any) => {
      console.log('Peer connected:', evt.detail.toString());
    });

    this.node.addEventListener('peer:disconnect', (evt: any) => {
      console.log('Peer disconnected:', evt.detail.toString());
    });

    this.node.addEventListener('peer:discovery', (evt: any) => {
      console.log('Peer discovered:', evt.detail.id.toString());
    });
  }
}

// Singleton instance
let p2pNodeInstance: P2PNode | null = null;

/**
 * Get the global P2P node instance
 */
export function getP2PNode(): P2PNode {
  if (!p2pNodeInstance) {
    p2pNodeInstance = new P2PNode();
  }
  return p2pNodeInstance;
}

/**
 * Initialize the global P2P node
 */
export async function initP2PNode(config?: P2PNodeConfig): Promise<P2PNode> {
  const node = getP2PNode();
  if (!node.isRunning()) {
    await node.start();
  }
  return node;
}
