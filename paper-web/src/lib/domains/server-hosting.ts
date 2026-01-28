/**
 * Server Hosting on .paper Domains
 * Allows users to host actual servers (HTTP/WebSocket) on .paper domains
 */

import { GlobalRegistry, type GlobalDomainRecord } from './global-registry';
import { P2PNode } from '../p2p/libp2p-node';
import { WebRTCTransport } from '../p2p/webrtc-transport';

export interface ServerConfig {
  domain: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  handlers: Map<string, RequestHandler>;
}

export type RequestHandler = (request: ServerRequest) => Promise<ServerResponse>;

export interface ServerRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query: Record<string, string>;
}

export interface ServerResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export class ServerHosting {
  private globalRegistry: GlobalRegistry;
  private p2pNode: P2PNode;
  private webrtc: WebRTCTransport;
  private servers: Map<string, ServerConfig> = new Map();
  private connections: Map<string, any> = new Map();

  constructor(
    globalRegistry: GlobalRegistry,
    p2pNode: P2PNode,
    webrtc: WebRTCTransport
  ) {
    this.globalRegistry = globalRegistry;
    this.p2pNode = p2pNode;
    this.webrtc = webrtc;

    this.setupServerListeners();
  }

  /**
   * Host a server on a .paper domain
   */
  async hostServer(domain: string, config: Partial<ServerConfig> = {}): Promise<boolean> {
    console.log('Hosting server on domain:', domain);

    try {
      // Create server config
      const serverConfig: ServerConfig = {
        domain,
        port: config.port || 80,
        protocol: config.protocol || 'http',
        handlers: config.handlers || new Map()
      };

      // Add default handler
      if (!serverConfig.handlers.has('/')) {
        serverConfig.handlers.set('/', async (req) => ({
          status: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `<h1>Server running on ${domain}</h1>`
        }));
      }

      // Register domain globally with server type
      const serverAddress = `${serverConfig.protocol}://${domain}:${serverConfig.port}`;
      
      const registered = await this.globalRegistry.registerGlobal(
        domain,
        serverAddress,
        'server'
      );

      if (!registered) {
        throw new Error('Failed to register server domain');
      }

      // Store server config
      this.servers.set(domain, serverConfig);

      // Announce server availability
      await this.announceServer(domain, serverConfig);

      console.log('Server hosted successfully on:', domain);
      return true;
    } catch (error) {
      console.error('Failed to host server:', error);
      return false;
    }
  }

  /**
   * Add request handler to server
   */
  addHandler(domain: string, path: string, handler: RequestHandler): void {
    const server = this.servers.get(domain);
    
    if (!server) {
      throw new Error('Server not found: ' + domain);
    }

    server.handlers.set(path, handler);
    console.log('Handler added:', domain, path);
  }

  /**
   * Remove request handler
   */
  removeHandler(domain: string, path: string): void {
    const server = this.servers.get(domain);
    
    if (server) {
      server.handlers.delete(path);
      console.log('Handler removed:', domain, path);
    }
  }

  /**
   * Handle incoming request to hosted server
   */
  async handleRequest(domain: string, request: ServerRequest): Promise<ServerResponse> {
    const server = this.servers.get(domain);

    if (!server) {
      return {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Server not found'
      };
    }

    // Find matching handler
    let handler = server.handlers.get(request.path);

    if (!handler) {
      // Try pattern matching
      for (const [pattern, h] of server.handlers) {
        if (this.matchPath(pattern, request.path)) {
          handler = h;
          break;
        }
      }
    }

    if (!handler) {
      // Use default handler
      handler = server.handlers.get('/');
    }

    if (!handler) {
      return {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Not found'
      };
    }

    try {
      const response = await handler(request);
      return response;
    } catch (error) {
      console.error('Handler error:', error);
      return {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal server error'
      };
    }
  }

  /**
   * Connect to remote server
   */
  async connectToServer(domain: string): Promise<boolean> {
    console.log('Connecting to server:', domain);

    try {
      // Resolve domain to get server address
      const record = await this.globalRegistry.resolveGlobal(domain);

      if (!record || record.type !== 'server') {
        throw new Error('Server not found or invalid type');
      }

      // Parse server address
      const url = new URL(record.content);
      const serverPeerId = record.owner;

      // Establish WebRTC connection to server peer
      const connection = await this.webrtc.createConnection(serverPeerId, true);

      if (connection.connected) {
        this.connections.set(domain, connection);
        console.log('Connected to server:', domain);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to connect to server:', error);
      return false;
    }
  }

  /**
   * Send request to remote server
   */
  async requestFromServer(
    domain: string,
    request: ServerRequest
  ): Promise<ServerResponse | null> {
    const connection = this.connections.get(domain);

    if (!connection || !connection.connected) {
      // Try to connect first
      const connected = await this.connectToServer(domain);
      if (!connected) {
        return null;
      }
    }

    try {
      // Send request via WebRTC
      const sent = this.webrtc.send(connection.id, {
        type: 'server_request',
        domain,
        request
      });

      if (!sent) {
        return null;
      }

      // Wait for response
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 30000);

        this.webrtc.onMessage(connection.id, (message) => {
          if (message.type === 'server_response') {
            clearTimeout(timeout);
            resolve(message.response);
          }
        });
      });
    } catch (error) {
      console.error('Server request failed:', error);
      return null;
    }
  }

  /**
   * Setup server listeners
   */
  private setupServerListeners(): void {
    // Listen for server announcements
    if (this.p2pNode.isRunning()) {
      this.p2pNode.subscribe('paper:server:announce', (data: Uint8Array) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(data));
          this.handleServerAnnouncement(message);
        } catch (error) {
          console.error('Failed to parse server announcement:', error);
        }
      });
    }
  }

  /**
   * Announce server to network
   */
  private async announceServer(domain: string, config: ServerConfig): Promise<void> {
    try {
      const announcement = {
        type: 'server_announce',
        domain,
        protocol: config.protocol,
        port: config.port,
        peerId: this.p2pNode.getPeerId(),
        timestamp: Date.now()
      };

      await this.p2pNode.publish(
        'paper:server:announce',
        new TextEncoder().encode(JSON.stringify(announcement))
      );

      console.log('Server announced:', domain);
    } catch (error) {
      console.error('Failed to announce server:', error);
    }
  }

  /**
   * Handle server announcement from peer
   */
  private handleServerAnnouncement(message: any): void {
    if (message.type !== 'server_announce') {
      return;
    }

    console.log('Server announcement received:', message.domain);
    
    // Store server info for future connections
    // In a full implementation, we'd maintain a server directory
  }

  /**
   * Match path pattern
   */
  private matchPath(pattern: string, path: string): boolean {
    // Simple pattern matching
    // In production, use a proper router like path-to-regexp
    
    if (pattern === path) {
      return true;
    }

    // Wildcard support
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }

    return false;
  }

  /**
   * Stop server
   */
  async stopServer(domain: string): Promise<boolean> {
    const server = this.servers.get(domain);

    if (!server) {
      return false;
    }

    // Remove from servers
    this.servers.delete(domain);

    // Close connections
    const connection = this.connections.get(domain);
    if (connection) {
      this.webrtc.closeConnection(connection.id);
      this.connections.delete(domain);
    }

    console.log('Server stopped:', domain);
    return true;
  }

  /**
   * Get hosted servers
   */
  getHostedServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get server config
   */
  getServer(domain: string): ServerConfig | undefined {
    return this.servers.get(domain);
  }

  /**
   * Check if hosting server
   */
  isHosting(domain: string): boolean {
    return this.servers.has(domain);
  }
}

// Singleton instance
let serverHostingInstance: ServerHosting | null = null;

/**
 * Get server hosting instance
 */
export function getServerHosting(
  globalRegistry: GlobalRegistry,
  p2pNode: P2PNode,
  webrtc: WebRTCTransport
): ServerHosting {
  if (!serverHostingInstance) {
    serverHostingInstance = new ServerHosting(globalRegistry, p2pNode, webrtc);
  }
  return serverHostingInstance;
}
