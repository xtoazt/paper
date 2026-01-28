/**
 * WebRTC Data Channels
 * Manages WebRTC data channels for peer-to-peer communication
 */

import { WebRTCTransport, PeerConnection } from '../p2p/webrtc-transport';
import { EncryptionLayer } from './encryption';

export interface ChannelConfig {
  ordered?: boolean;
  maxRetransmits?: number;
  reliable?: boolean;
}

export interface DataChannel {
  id: string;
  peerId: string;
  channel: RTCDataChannel | null;
  encrypted: boolean;
}

export class WebRTCChannels {
  private webrtc: WebRTCTransport;
  private encryption: EncryptionLayer;
  private channels: Map<string, DataChannel> = new Map();
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(webrtc: WebRTCTransport, encryption: EncryptionLayer) {
    this.webrtc = webrtc;
    this.encryption = encryption;
  }

  /**
   * Create data channel to peer
   */
  async createChannel(
    peerId: string,
    channelId: string,
    config: ChannelConfig = {},
    encrypted: boolean = true
  ): Promise<DataChannel> {
    const key = `${peerId}:${channelId}`;

    if (this.channels.has(key)) {
      return this.channels.get(key)!;
    }

    // Get peer connection
    const connection = this.webrtc.getConnection(peerId);
    if (!connection) {
      throw new Error('Peer connection not found');
    }

    // Create data channel
    // Note: SimplePeer doesn't expose createDataChannel directly,
    // so we'll use the connection's send functionality
    const channel: DataChannel = {
      id: channelId,
      peerId,
      channel: null,
      encrypted
    };

    this.channels.set(key, channel);

    console.log('Data channel created:', key);
    return channel;
  }

  /**
   * Send data through channel
   */
  async send(
    peerId: string,
    channelId: string,
    data: any
  ): Promise<boolean> {
    const key = `${peerId}:${channelId}`;
    const channel = this.channels.get(key);

    if (!channel) {
      console.error('Channel not found:', key);
      return false;
    }

    let payload = data;

    // Encrypt if enabled
    if (channel.encrypted) {
      const connection = this.webrtc.getConnection(peerId);
      if (!connection) {
        console.error('Peer connection not found');
        return false;
      }

      // Get peer's public key (in a real implementation)
      // For now, we'll skip encryption and just send
      // payload = await this.encryptData(data, peerPublicKey);
    }

    // Send through WebRTC transport
    return this.webrtc.send(peerId, {
      type: 'channel_data',
      channelId,
      data: payload
    });
  }

  /**
   * Receive data from channel
   */
  onMessage(
    peerId: string,
    channelId: string,
    handler: (data: any) => void
  ): void {
    const key = `${peerId}:${channelId}`;
    this.messageHandlers.set(key, handler);

    // Set up message handler on WebRTC transport
    this.webrtc.onMessage(peerId, (message) => {
      if (message.type === 'channel_data' && message.channelId === channelId) {
        this.handleChannelMessage(peerId, channelId, message.data);
      }
    });
  }

  /**
   * Handle incoming channel message
   */
  private async handleChannelMessage(
    peerId: string,
    channelId: string,
    data: any
  ): Promise<void> {
    const key = `${peerId}:${channelId}`;
    const channel = this.channels.get(key);

    if (!channel) {
      console.error('Channel not found for incoming message:', key);
      return;
    }

    let payload = data;

    // Decrypt if enabled
    if (channel.encrypted) {
      // payload = await this.decryptData(data, peerPublicKey);
    }

    // Call message handler
    const handler = this.messageHandlers.get(key);
    if (handler) {
      handler(payload);
    }
  }

  /**
   * Close channel
   */
  closeChannel(peerId: string, channelId: string): void {
    const key = `${peerId}:${channelId}`;
    const channel = this.channels.get(key);

    if (channel && channel.channel) {
      channel.channel.close();
    }

    this.channels.delete(key);
    this.messageHandlers.delete(key);

    console.log('Data channel closed:', key);
  }

  /**
   * Close all channels to peer
   */
  closePeerChannels(peerId: string): void {
    for (const [key, channel] of this.channels) {
      if (channel.peerId === peerId) {
        this.closeChannel(peerId, channel.id);
      }
    }
  }

  /**
   * Close all channels
   */
  closeAll(): void {
    for (const channel of this.channels.values()) {
      if (channel.channel) {
        channel.channel.close();
      }
    }
    this.channels.clear();
    this.messageHandlers.clear();
  }

  /**
   * Get channel
   */
  getChannel(peerId: string, channelId: string): DataChannel | undefined {
    const key = `${peerId}:${channelId}`;
    return this.channels.get(key);
  }

  /**
   * Get all channels
   */
  getChannels(): DataChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get channels for peer
   */
  getPeerChannels(peerId: string): DataChannel[] {
    return Array.from(this.channels.values())
      .filter(channel => channel.peerId === peerId);
  }

  /**
   * Check if channel exists
   */
  hasChannel(peerId: string, channelId: string): boolean {
    const key = `${peerId}:${channelId}`;
    return this.channels.has(key);
  }
}

// Singleton instance
let webrtcChannelsInstance: WebRTCChannels | null = null;

/**
 * Get WebRTC channels instance
 */
export function getWebRTCChannels(
  webrtc: WebRTCTransport,
  encryption: EncryptionLayer
): WebRTCChannels {
  if (!webrtcChannelsInstance) {
    webrtcChannelsInstance = new WebRTCChannels(webrtc, encryption);
  }
  return webrtcChannelsInstance;
}
