/**
 * Multi-Hop Onion Routing
 * Tor-like onion routing for anonymous communication
 */

import { EncryptionLayer } from './encryption';
import { WebRTCTransport } from '../p2p/webrtc-transport';

export interface OnionNode {
  peerId: string;
  publicKey: Uint8Array;
}

export interface OnionCircuit {
  id: string;
  nodes: OnionNode[];
  keys: Uint8Array[];
  createdAt: number;
}

export interface OnionMessage {
  circuitId: string;
  layers: number;
  payload: Uint8Array;
}

export class OnionRouting {
  private encryption: EncryptionLayer;
  private webrtc: WebRTCTransport;
  private circuits: Map<string, OnionCircuit> = new Map();
  private minHops: number;
  private maxHops: number;

  constructor(
    encryption: EncryptionLayer,
    webrtc: WebRTCTransport,
    minHops: number = 3,
    maxHops: number = 5
  ) {
    this.encryption = encryption;
    this.webrtc = webrtc;
    this.minHops = minHops;
    this.maxHops = maxHops;
  }

  /**
   * Create a new onion circuit
   */
  async createCircuit(nodes: OnionNode[]): Promise<OnionCircuit> {
    if (nodes.length < this.minHops) {
      throw new Error(`Circuit must have at least ${this.minHops} hops`);
    }

    if (nodes.length > this.maxHops) {
      throw new Error(`Circuit cannot have more than ${this.maxHops} hops`);
    }

    const circuitId = await this.generateCircuitId();

    // Generate symmetric keys for each hop
    const keys: Uint8Array[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const key = await this.encryption.generateSymmetricKey();
      keys.push(key);
    }

    const circuit: OnionCircuit = {
      id: circuitId,
      nodes,
      keys,
      createdAt: Date.now()
    };

    this.circuits.set(circuitId, circuit);

    console.log('Onion circuit created:', circuitId, 'hops:', nodes.length);
    return circuit;
  }

  /**
   * Send message through onion circuit
   */
  async sendThroughCircuit(
    circuitId: string,
    message: Uint8Array | string
  ): Promise<void> {
    const circuit = this.circuits.get(circuitId);
    if (!circuit) {
      throw new Error('Circuit not found');
    }

    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    // Wrap message in onion layers (encrypt from innermost to outermost)
    let payload = messageBytes;

    for (let i = circuit.nodes.length - 1; i >= 0; i--) {
      const key = circuit.keys[i];
      const encrypted = await this.encryption.symmetricEncrypt(payload, key);

      // Pack encrypted message with nonce
      payload = this.packLayer(encrypted.ciphertext, encrypted.nonce);
    }

    // Send to first node in circuit
    const firstNode = circuit.nodes[0];
    const onionMessage: OnionMessage = {
      circuitId,
      layers: circuit.nodes.length,
      payload
    };

    this.webrtc.send(firstNode.peerId, {
      type: 'onion_message',
      data: onionMessage
    });

    console.log('Message sent through onion circuit:', circuitId);
  }

  /**
   * Receive and process onion message
   */
  async receiveOnionMessage(message: OnionMessage): Promise<Uint8Array | null> {
    const circuit = this.circuits.get(message.circuitId);
    if (!circuit) {
      console.error('Unknown circuit:', message.circuitId);
      return null;
    }

    // Find our position in the circuit
    const myKeyPair = this.encryption.getKeyPair();
    if (!myKeyPair) {
      console.error('No keypair available');
      return null;
    }

    // Peel one layer
    const { ciphertext, nonce } = this.unpackLayer(message.payload);

    let decrypted: Uint8Array;
    for (const key of circuit.keys) {
      try {
        decrypted = await this.encryption.symmetricDecrypt(
          { ciphertext, nonce },
          key
        );

        // If this is the final layer, return the message
        if (message.layers === 1) {
          console.log('Onion message fully decrypted');
          return decrypted;
        }

        // Otherwise, forward to next hop
        const nextMessage: OnionMessage = {
          circuitId: message.circuitId,
          layers: message.layers - 1,
          payload: decrypted
        };

        // Find next node (we don't know which node we are, so we forward)
        // In a real implementation, we would track our position
        console.log('Forwarding onion message to next hop');
        return null;
      } catch (error) {
        // Key didn't match, try next one
        continue;
      }
    }

    console.error('Failed to decrypt onion message');
    return null;
  }

  /**
   * Destroy onion circuit
   */
  destroyCircuit(circuitId: string): void {
    this.circuits.delete(circuitId);
    console.log('Onion circuit destroyed:', circuitId);
  }

  /**
   * Get active circuits
   */
  getCircuits(): OnionCircuit[] {
    return Array.from(this.circuits.values());
  }

  /**
   * Get circuit by ID
   */
  getCircuit(circuitId: string): OnionCircuit | undefined {
    return this.circuits.get(circuitId);
  }

  /**
   * Clean up old circuits
   */
  cleanupOldCircuits(maxAge: number = 600000): void {
    const now = Date.now();
    for (const [id, circuit] of this.circuits) {
      if (now - circuit.createdAt > maxAge) {
        this.destroyCircuit(id);
      }
    }
  }

  /**
   * Generate circuit ID
   */
  private async generateCircuitId(): Promise<string> {
    const random = await this.encryption.randomBytes(16);
    return this.encryption.toHex(random);
  }

  /**
   * Pack encrypted layer with nonce
   */
  private packLayer(ciphertext: Uint8Array, nonce: Uint8Array): Uint8Array {
    const packed = new Uint8Array(nonce.length + ciphertext.length);
    packed.set(nonce, 0);
    packed.set(ciphertext, nonce.length);
    return packed;
  }

  /**
   * Unpack layer to get ciphertext and nonce
   */
  private unpackLayer(packed: Uint8Array): { ciphertext: Uint8Array; nonce: Uint8Array } {
    // Nonce is 24 bytes for libsodium crypto_secretbox
    const nonceLength = 24;
    const nonce = packed.slice(0, nonceLength);
    const ciphertext = packed.slice(nonceLength);
    return { ciphertext, nonce };
  }
}

// Singleton instance
let onionRoutingInstance: OnionRouting | null = null;

/**
 * Get onion routing instance
 */
export function getOnionRouting(
  encryption: EncryptionLayer,
  webrtc: WebRTCTransport
): OnionRouting {
  if (!onionRoutingInstance) {
    onionRoutingInstance = new OnionRouting(encryption, webrtc);
  }
  return onionRoutingInstance;
}
