/**
 * Node Lifecycle Manager
 * Manages IPFS, libp2p, Pyodide DNS, and WebRTC tunnels
 */

import { initP2PInfrastructure } from '../p2p';
import { initStorageInfrastructure } from '../storage';
import { initTunnelingInfrastructure } from '../tunneling';
import { initPyodideDNS } from '../pyodide-dns';
import { initDomainsInfrastructure } from '../domains';
import { getP2PGateway } from '../p2p-gateway';

export interface NodeConfig {
  enableP2P?: boolean;
  enableStorage?: boolean;
  enableTunneling?: boolean;
  enableDNS?: boolean;
  autoStart?: boolean;
}

export interface NodeStatus {
  p2p: {
    running: boolean;
    peers: number;
    peerId: string;
  };
  storage: {
    running: boolean;
    size: number;
    pins: number;
  };
  tunneling: {
    running: boolean;
    tunnels: number;
  };
  dns: {
    running: boolean;
    cached: number;
  };
  gateway: {
    requests: number;
    cached: number;
  };
}

export class NodeManager {
  private config: NodeConfig;
  private components: any = {};
  private isInitialized = false;
  private isStarted = false;

  constructor(config: NodeConfig = {}) {
    this.config = {
      enableP2P: true,
      enableStorage: true,
      enableTunneling: true,
      enableDNS: true,
      autoStart: true,
      ...config
    };
  }

  /**
   * Initialize all node components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Node manager already initialized');
      return;
    }

    console.log('Initializing node manager...');

    try {
      // Initialize P2P infrastructure
      if (this.config.enableP2P) {
        console.log('Initializing P2P infrastructure...');
        this.components.p2p = await initP2PInfrastructure();
      }

      // Initialize storage infrastructure
      if (this.config.enableStorage) {
        console.log('Initializing storage infrastructure...');
        this.components.storage = await initStorageInfrastructure(
          this.components.p2p?.connectionManager
        );
      }

      // Initialize DNS resolver
      if (this.config.enableDNS) {
        console.log('Initializing DNS resolver...');
        this.components.dns = await initPyodideDNS();
      }

      // Initialize tunneling infrastructure
      if (this.config.enableTunneling && this.components.p2p) {
        console.log('Initializing tunneling infrastructure...');
        this.components.tunneling = await initTunnelingInfrastructure(
          this.components.p2p.webrtcTransport,
          this.components.p2p.peerDiscovery
        );
      }

      // Initialize domains infrastructure
      if (this.components.p2p && this.components.dns) {
        console.log('Initializing domains infrastructure...');
        this.components.domains = await initDomainsInfrastructure(
          this.components.p2p.p2pNode,
          this.components.tunneling?.encryption,
          this.components.dns.resolver
        );
      }

      // Initialize P2P gateway
      if (this.components.domains && this.components.storage) {
        console.log('Initializing P2P gateway...');
        this.components.gateway = getP2PGateway(
          this.components.domains.dhtResolver,
          this.components.storage.ipfsNode,
          this.components.storage.storageManager,
          this.components.storage.contentDistribution,
          this.components.tunneling?.tunnelManager
        );
      }

      this.isInitialized = true;
      console.log('Node manager initialized successfully');

      // Auto-start if enabled
      if (this.config.autoStart) {
        await this.start();
      }
    } catch (error) {
      console.error('Failed to initialize node manager:', error);
      throw error;
    }
  }

  /**
   * Start all node components
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isStarted) {
      console.log('Node already started');
      return;
    }

    console.log('Starting node...');

    // All components are started during initialization
    this.isStarted = true;

    console.log('Node started successfully');
  }

  /**
   * Stop all node components
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      console.log('Node not started');
      return;
    }

    console.log('Stopping node...');

    try {
      // Stop tunneling
      if (this.components.tunneling?.tunnelManager) {
        this.components.tunneling.tunnelManager.shutdown();
      }

      // Stop P2P
      if (this.components.p2p?.connectionManager) {
        await this.components.p2p.connectionManager.shutdown();
      }

      // Stop storage
      if (this.components.storage?.ipfsNode) {
        await this.components.storage.ipfsNode.stop();
      }

      this.isStarted = false;
      console.log('Node stopped successfully');
    } catch (error) {
      console.error('Failed to stop node:', error);
      throw error;
    }
  }

  /**
   * Restart node
   */
  async restart(): Promise<void> {
    console.log('Restarting node...');
    await this.stop();
    await this.start();
    console.log('Node restarted');
  }

  /**
   * Get node status
   */
  async getStatus(): Promise<NodeStatus> {
    const status: NodeStatus = {
      p2p: {
        running: false,
        peers: 0,
        peerId: ''
      },
      storage: {
        running: false,
        size: 0,
        pins: 0
      },
      tunneling: {
        running: false,
        tunnels: 0
      },
      dns: {
        running: false,
        cached: 0
      },
      gateway: {
        requests: 0,
        cached: 0
      }
    };

    // P2P status
    if (this.components.p2p?.p2pNode) {
      status.p2p.running = this.components.p2p.p2pNode.isRunning();
      status.p2p.peers = this.components.p2p.p2pNode.getPeerCount();
      status.p2p.peerId = this.components.p2p.p2pNode.getPeerId();
    }

    // Storage status
    if (this.components.storage?.ipfsNode) {
      status.storage.running = this.components.storage.ipfsNode.isRunning();
      
      try {
        const stats = await this.components.storage.ipfsNode.getStats();
        status.storage.size = stats.repoSize || 0;
        
        const pins = await this.components.storage.ipfsNode.listPins();
        status.storage.pins = pins.length;
      } catch (error) {
        console.error('Failed to get storage stats:', error);
      }
    }

    // Tunneling status
    if (this.components.tunneling?.tunnelManager) {
      const tunnelStats = this.components.tunneling.tunnelManager.getStats();
      status.tunneling.running = tunnelStats.active > 0;
      status.tunneling.tunnels = tunnelStats.active;
    }

    // DNS status
    if (this.components.dns?.resolver) {
      status.dns.running = this.components.dns.resolver.isReady();
      
      try {
        const dnsStats = await this.components.dns.resolver.getCacheStats();
        status.dns.cached = dnsStats.entries;
      } catch (error) {
        console.error('Failed to get DNS stats:', error);
      }
    }

    // Gateway status
    if (this.components.gateway) {
      const gatewayStats = this.components.gateway.getStats();
      status.gateway.requests = gatewayStats.totalRequests;
      status.gateway.cached = gatewayStats.cachedRequests;
    }

    return status;
  }

  /**
   * Get all components
   */
  getComponents(): any {
    return this.components;
  }

  /**
   * Get specific component
   */
  getComponent(name: string): any {
    return this.components[name];
  }

  /**
   * Check if node is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.isStarted;
  }

  /**
   * Get P2P gateway
   */
  getGateway() {
    return this.components.gateway;
  }
}

// Singleton instance
let nodeManagerInstance: NodeManager | null = null;

/**
 * Get node manager instance
 */
export function getNodeManager(): NodeManager {
  if (!nodeManagerInstance) {
    nodeManagerInstance = new NodeManager();
  }
  return nodeManagerInstance;
}

/**
 * Initialize node manager
 */
export async function initNodeManager(config?: NodeConfig): Promise<NodeManager> {
  if (!nodeManagerInstance) {
    nodeManagerInstance = new NodeManager(config);
  }
  
  if (!nodeManagerInstance.isReady()) {
    await nodeManagerInstance.initialize();
  }
  
  return nodeManagerInstance;
}
