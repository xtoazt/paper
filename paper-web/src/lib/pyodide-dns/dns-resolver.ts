/**
 * Pyodide DNS Resolver
 * Resolves .paper domains using Python DNS server in browser
 */

import { loadPyodide, type PyodideInterface } from 'pyodide';

export interface DNSRecord {
  domain: string;
  cid: string;
  type: string;
  ttl: number;
  metadata?: any;
}

export interface DNSCacheStats {
  entries: number;
  domains: string[];
}

export class PyodideDNSResolver {
  private pyodide: PyodideInterface | null = null;
  private dnsServer: any = null;
  private isInitialized = false;

  constructor() {}

  /**
   * Initialize Pyodide and load DNS server
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Pyodide DNS resolver already initialized');
      return;
    }

    console.log('Initializing Pyodide DNS resolver...');

    try {
      // Load Pyodide
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });

      console.log('Pyodide loaded');

      // Load Python DNS server code
      await this.loadDNSServer();

      this.isInitialized = true;
      console.log('Pyodide DNS resolver initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pyodide DNS resolver:', error);
      throw error;
    }
  }

  /**
   * Load Python DNS server code
   */
  private async loadDNSServer(): Promise<void> {
    if (!this.pyodide) {
      throw new Error('Pyodide not loaded');
    }

    // Load the Python DNS server code
    // In production, this would load from a file
    const pythonCode = await this.getPythonCode();

    await this.pyodide.runPythonAsync(pythonCode);

    // Create DNS server instance
    this.dnsServer = await this.pyodide.runPythonAsync('create_dns_server()');

    console.log('DNS server created');
  }

  /**
   * Resolve .paper domain
   */
  async resolve(domain: string): Promise<DNSRecord | null> {
    if (!this.isInitialized || !this.pyodide || !this.dnsServer) {
      throw new Error('DNS resolver not initialized');
    }

    try {
      console.log('Resolving domain via Pyodide:', domain);

      // Call Python resolve function
      const result = await this.pyodide.runPythonAsync(`
import asyncio
result = await resolve_domain(dns_server, "${domain}")
result
      `, {
        globals: {
          dns_server: this.dnsServer
        } as any
      });

      if (result && result.toJs) {
        const record = result.toJs();
        console.log('Domain resolved:', domain, record);
        return record as DNSRecord;
      }

      return result as DNSRecord | null;
    } catch (error) {
      console.error('Failed to resolve domain:', error);
      return null;
    }
  }

  /**
   * Register .paper domain
   */
  async register(domain: string, cid: string, metadata?: any): Promise<boolean> {
    if (!this.isInitialized || !this.pyodide || !this.dnsServer) {
      throw new Error('DNS resolver not initialized');
    }

    try {
      console.log('Registering domain via Pyodide:', domain, cid);

      const metadataJson = metadata ? JSON.stringify(metadata) : 'None';

      // Call Python register function
      const result = await this.pyodide.runPythonAsync(`
import asyncio
import json
metadata = ${metadataJson === 'None' ? 'None' : `json.loads('${metadataJson}')`}
success = await register_domain(dns_server, "${domain}", "${cid}", metadata)
success
      `, {
        globals: {
          dns_server: this.dnsServer
        } as any
      });

      console.log('Domain registration result:', result);
      return result as boolean;
    } catch (error) {
      console.error('Failed to register domain:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<DNSCacheStats> {
    if (!this.isInitialized || !this.pyodide || !this.dnsServer) {
      throw new Error('DNS resolver not initialized');
    }

    try {
      const result = await this.pyodide.runPythonAsync(`
stats = get_cache_stats(dns_server)
stats
      `, {
        globals: {
          dns_server: this.dnsServer
        } as any
      });

      if (result && result.toJs) {
        return result.toJs() as DNSCacheStats;
      }

      return result as DNSCacheStats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { entries: 0, domains: [] };
    }
  }

  /**
   * Clear DNS cache
   */
  async clearCache(): Promise<void> {
    if (!this.isInitialized || !this.pyodide || !this.dnsServer) {
      throw new Error('DNS resolver not initialized');
    }

    try {
      await this.pyodide.runPythonAsync(`
clear_cache(dns_server)
      `, {
        globals: {
          dns_server: this.dnsServer
        } as any
      });

      console.log('DNS cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if resolver is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Python code (in production, load from file)
   */
  private async getPythonCode(): Promise<string> {
    // In production, this would fetch from dns-server.py
    // For now, inline a minimal version
    return `
import asyncio
import json
from typing import Dict, Optional

class DNSServer:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300
    
    async def resolve(self, domain: str) -> Optional[Dict]:
        if domain in self.cache:
            return self.cache[domain]['data']
        return None
    
    async def register(self, domain: str, cid: str, metadata: Dict = None) -> bool:
        import time
        record = {
            'domain': domain,
            'cid': cid,
            'type': 'A',
            'ttl': self.cache_ttl,
            'metadata': metadata or {}
        }
        self.cache[domain] = {
            'data': record,
            'timestamp': int(time.time())
        }
        return True
    
    def clear_cache(self):
        self.cache.clear()
    
    def get_cache_stats(self) -> Dict:
        return {
            'entries': len(self.cache),
            'domains': list(self.cache.keys())
        }

def create_dns_server():
    return DNSServer()

async def resolve_domain(server, domain):
    return await server.resolve(domain)

async def register_domain(server, domain, cid, metadata=None):
    return await server.register(domain, cid, metadata)

def get_cache_stats(server):
    return server.get_cache_stats()

def clear_cache(server):
    server.clear_cache()

# Create global server instance
dns_server = create_dns_server()
`;
  }
}

// Singleton instance
let pyodideDNSResolverInstance: PyodideDNSResolver | null = null;

/**
 * Get the global Pyodide DNS resolver instance
 */
export function getPyodideDNSResolver(): PyodideDNSResolver {
  if (!pyodideDNSResolverInstance) {
    pyodideDNSResolverInstance = new PyodideDNSResolver();
  }
  return pyodideDNSResolverInstance;
}

/**
 * Initialize Pyodide DNS resolver
 */
export async function initPyodideDNSResolver(): Promise<PyodideDNSResolver> {
  const resolver = getPyodideDNSResolver();
  if (!resolver.isReady()) {
    await resolver.initialize();
  }
  return resolver;
}
