/**
 * Pyodide DNS Module
 * Exports all DNS resolution components
 */

export * from './dns-resolver';
export * from './dns-bridge';

// Re-export initialization functions
import { initPyodideDNSResolver } from './dns-resolver';
import { initDNSBridge } from './dns-bridge';

/**
 * Initialize complete Pyodide DNS infrastructure
 */
export async function initPyodideDNS() {
  console.log('Initializing Pyodide DNS infrastructure...');

  // Initialize DNS resolver
  const resolver = await initPyodideDNSResolver();

  // Initialize DNS bridge
  const bridge = await initDNSBridge(resolver);

  console.log('Pyodide DNS infrastructure initialized successfully');

  return {
    resolver,
    bridge
  };
}
