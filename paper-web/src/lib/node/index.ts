/**
 * Node Module
 * Exports node lifecycle management components
 */

export * from './node-manager';
export * from './bootstrap';

// Re-export main initialization function
import { initNodeManager, getNodeManager } from './node-manager';
import { joinPaperNetwork } from './bootstrap';

export { initNodeManager, getNodeManager, joinPaperNetwork };
