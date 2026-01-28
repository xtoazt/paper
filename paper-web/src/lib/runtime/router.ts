/**
 * Runtime Router
 * Routes requests to appropriate runtime (edge, container, or static)
 */

import type { Application } from './types';
import { edgeRuntime } from './edge-runtime';
import { containerRuntime } from './container-runtime';

export class RuntimeRouter {
  private edgeRuntime = edgeRuntime;
  private containerRuntime = containerRuntime;
  private ipfsGateway = 'https://ipfs.io/ipfs/';

  async initialize(): Promise<void> {
    await this.edgeRuntime.initialize();
    console.log('[RuntimeRouter] Runtime router initialized');
  }

  async route(request: Request, app: Application): Promise<Response> {
    const url = new URL(request.url);
    console.log(`[RuntimeRouter] Routing ${request.method} ${url.pathname} for ${app.name}`);
    
    // Check if edge function
    if (this.isEdgeFunction(url.pathname, app)) {
      console.log('[RuntimeRouter] → Edge function');
      return await this.routeToEdge(request, app);
    }
    
    // Check if static asset
    if (this.isStaticAsset(url.pathname)) {
      console.log('[RuntimeRouter] → Static asset');
      return await this.serveFromIPFS(request, app);
    }
    
    // Route to container
    console.log('[RuntimeRouter] → Container runtime');
    return await this.containerRuntime.route(request, app);
  }

  private isEdgeFunction(pathname: string, app: Application): boolean {
    // Check if path matches edge function pattern
    const edgePatterns = [
      '/api/',
      '/edge/',
      '/_functions/'
    ];
    
    return edgePatterns.some(pattern => pathname.startsWith(pattern));
  }

  private isStaticAsset(pathname: string): boolean {
    // Check if path is for a static asset
    const staticExtensions = [
      '.html', '.css', '.js', '.json',
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
      '.woff', '.woff2', '.ttf', '.eot',
      '.mp4', '.webm', '.mp3', '.wav',
      '.pdf', '.txt', '.xml'
    ];
    
    return staticExtensions.some(ext => pathname.endsWith(ext));
  }

  private async routeToEdge(request: Request, app: Application): Promise<Response> {
    const url = new URL(request.url);
    
    // Extract function name from path
    const pathParts = url.pathname.split('/');
    const functionName = pathParts[pathParts.length - 1] || 'index';
    
    // Find or create edge function
    const functionId = `${app.id}_${functionName}`;
    
    try {
      const response = await this.edgeRuntime.executeFunction(functionId, {
        url: request.url,
        method: request.method,
        headers: this.headersToObject(request.headers),
        body: await this.getRequestBody(request)
      });
      
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    } catch (error: any) {
      console.error('[RuntimeRouter] Edge function error:', error);
      return new Response(JSON.stringify({
        error: 'Edge function execution failed',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async serveFromIPFS(request: Request, app: Application): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Default to index.html for directory requests
    if (pathname === '/' || pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    
    // Construct IPFS URL
    const ipfsUrl = `${this.ipfsGateway}${app.buildArtifactCID}${pathname}`;
    
    console.log(`[RuntimeRouter] Fetching from IPFS: ${ipfsUrl}`);
    
    try {
      const response = await fetch(ipfsUrl);
      
      if (!response.ok) {
        return new Response('Not Found', { status: 404 });
      }
      
      // Return with appropriate caching headers
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('X-Served-By', 'Paper Network IPFS');
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    } catch (error: any) {
      console.error('[RuntimeRouter] IPFS fetch error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to fetch from IPFS',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private async getRequestBody(request: Request): Promise<string | ArrayBuffer | undefined> {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return undefined;
    }
    
    try {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json') || contentType.includes('text/')) {
        return await request.text();
      } else {
        return await request.arrayBuffer();
      }
    } catch (error) {
      return undefined;
    }
  }

  async getApplicationByDomain(domain: string): Promise<Application | null> {
    // Mock: In real implementation, this would query the domain registry
    console.log(`[RuntimeRouter] Looking up application for domain: ${domain}`);
    return null;
  }
}

// Export singleton instance
export const runtimeRouter = new RuntimeRouter();
