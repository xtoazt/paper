/**
 * Storage Module
 * Exports all storage components
 */

export * from './ipfs-node';
export * from './storage-manager';
export * from './content-distribution';

// Re-export initialization functions
import { initIPFSNode, getIPFSNode } from './ipfs-node';
import { initStorageManager, getStorageManager } from './storage-manager';
import { initContentDistribution, getContentDistribution } from './content-distribution';
import type { ConnectionManager } from '../p2p/connection-manager';

/**
 * Initialize complete storage infrastructure
 */
export async function initStorageInfrastructure(connectionManager?: ConnectionManager | null) {
  console.log('Initializing storage infrastructure...');

  // Initialize IPFS node
  const ipfsNode = await initIPFSNode();

  // Initialize storage manager
  const storageManager = await initStorageManager(ipfsNode);

  // Initialize content distribution
  const contentDistribution = await initContentDistribution(
    ipfsNode,
    storageManager,
    connectionManager
  );

  console.log('Storage infrastructure initialized successfully');

  return {
    ipfsNode,
    storageManager,
    contentDistribution
  };
}
