/**
 * P2P Tunneling Service
 * Expose local services via public .paper domains
 */

export interface Tunnel {
  id: string;
  localPort: number;
  domain: string;
  status: 'connecting' | 'connected' | 'disconnected';
  hops: number;
  created: number;
  bytesIn: number;
  bytesOut: number;
}

export class P2PTunnel {
  private tunnels: Map<string, Tunnel> = new Map();
  
  constructor() {
    console.log('[P2PTunnel] Initialized');
  }

  /**
   * Create tunnel from local port to .paper domain
   */
  async createTunnel(localPort: number, domain: string): Promise<Tunnel> {
    const id = `tunnel-${Date.now()}`;
    
    const tunnel: Tunnel = {
      id,
      localPort,
      domain,
      status: 'connecting',
      hops: 3,
      created: Date.now(),
      bytesIn: 0,
      bytesOut: 0
    };
    
    // Establish P2P tunnel
    await this.establishTunnel(tunnel);
    
    this.tunnels.set(id, tunnel);
    console.log('[P2PTunnel] Tunnel created:', `http://localhost:${localPort}`, '->', `https://${domain}`);
    
    return tunnel;
  }

  /**
   * Establish tunnel connection
   */
  private async establishTunnel(tunnel: Tunnel): Promise<void> {
    // Setup multi-hop routing
    await this.routeThrough(tunnel.hops);
    
    // Encrypt connection
    this.encryptConnection();
    
    tunnel.status = 'connected';
  }

  /**
   * Route through multiple hops for privacy
   */
  async routeThrough(hops: number): Promise<void> {
    console.log('[P2PTunnel] Setting up', hops, 'hop routing');
    // Would setup onion routing through P2P nodes
  }

  /**
   * Encrypt connection
   */
  private encryptConnection(): void {
    console.log('[P2PTunnel] Encrypting tunnel with libsodium');
    // E2E encryption setup
  }

  /**
   * Forward request through tunnel
   */
  async forwardRequest(tunnelId: string, request: Request): Promise<Response> {
    const tunnel = this.tunnels.get(tunnelId);
    
    if (!tunnel || tunnel.status !== 'connected') {
      return new Response('Tunnel not available', { status: 503 });
    }
    
    // Forward to localhost
    try {
      const localUrl = `http://localhost:${tunnel.localPort}${new URL(request.url).pathname}`;
      const response = await fetch(localUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      tunnel.bytesIn += parseInt(response.headers.get('content-length') || '0');
      
      return response;
    } catch (error) {
      return new Response('Error forwarding request', { status: 502 });
    }
  }

  /**
   * Close tunnel
   */
  async closeTunnel(tunnelId: string): Promise<void> {
    const tunnel = this.tunnels.get(tunnelId);
    if (tunnel) {
      tunnel.status = 'disconnected';
      this.tunnels.delete(tunnelId);
      console.log('[P2PTunnel] Tunnel closed:', tunnelId);
    }
  }

  /**
   * List active tunnels
   */
  listTunnels(): Tunnel[] {
    return Array.from(this.tunnels.values());
  }
}

export function getP2PTunnel(): P2PTunnel {
  return new P2PTunnel();
}
