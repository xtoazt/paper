/**
 * Bootstrap Module
 * Exports all bootstrap components for redundant Service Worker registration
 */

export * from './bootstrap-sources';
export * from './bootstrap-loader';
export * from './bootstrap-manager';
export * from './bootstrap-discovery';
export * from './pdf-bootstrap';
export * from './pdf-generator';

// Re-export main functions
import { bootstrapServiceWorker, getBootstrapManager } from './bootstrap-manager';
import { getBootstrapDiscovery } from './bootstrap-discovery';
import { loadPDFBootstrap } from './pdf-bootstrap';
import type { ConnectionManager } from '../p2p/connection-manager';

export { bootstrapServiceWorker, getBootstrapManager, getBootstrapDiscovery, loadPDFBootstrap };

/**
 * Initialize complete bootstrap system
 */
export async function initBootstrapSystem(connectionManager?: ConnectionManager | null) {
  console.log('Initializing bootstrap system...');

  // Get bootstrap manager
  const manager = getBootstrapManager();

  // Get bootstrap discovery
  const discovery = getBootstrapDiscovery(connectionManager);

  // Start discovery if connection manager available
  if (connectionManager) {
    discovery.start();
  }

  console.log('Bootstrap system initialized');

  return {
    manager,
    discovery
  };
}
