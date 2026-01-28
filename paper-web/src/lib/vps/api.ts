/**
 * VPS Service API
 * Manage VPS instances across the distributed network
 */

import type { VPS, VPSSpec, Snapshot } from './types';
import { getContainerRuntime } from './container-runtime';
import { getOrchestrator } from '../compute/orchestrator';

export class VPSService {
  private vpsList: Map<string, VPS> = new Map();
  private containerRuntime = getContainerRuntime();
  private orchestrator = getOrchestrator();
  
  constructor() {
    console.log('[VPSService] Initialized');
  }

  /**
   * Create a new VPS instance
   */
  async create(spec: VPSSpec): Promise<VPS> {
    const id = `vps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const domain = `vps-${id.split('-')[1]}.paper`;
    
    console.log('[VPSService] Creating VPS:', id);
    
    const vps: VPS = {
      id,
      name: spec.name,
      spec,
      status: 'starting',
      domain,
      nodes: [],
      created: Date.now(),
      lastAccessed: Date.now(),
      stats: {
        cpuUsage: 0,
        memoryUsage: 0,
        storageUsage: 0,
        networkIn: 0,
        networkOut: 0,
        requests: 0,
        uptime: 0
      }
    };
    
    try {
      // Select nodes for redundancy (3 nodes for high availability)
      const nodeCount = 3;
      const nodes = await this.selectNodes(spec, nodeCount);
      vps.nodes = nodes.map(n => n.id);
      
      // Create containers on selected nodes
      for (const node of nodes) {
        await this.containerRuntime.createContainer({
          vpsId: id,
          spec,
          nodeId: node.id
        });
      }
      
      vps.status = 'running';
      console.log('[VPSService] VPS started:', id, 'on nodes:', vps.nodes);
    } catch (error) {
      console.error('[VPSService] VPS creation failed:', error);
      vps.status = 'error';
    }
    
    this.vpsList.set(id, vps);
    return vps;
  }

  /**
   * Destroy a VPS instance
   */
  async destroy(id: string): Promise<void> {
    const vps = this.vpsList.get(id);
    if (!vps) {
      throw new Error('VPS not found');
    }
    
    console.log('[VPSService] Destroying VPS:', id);
    
    // Stop all containers
    const containers = this.containerRuntime.getVPSContainers(id);
    for (const container of containers) {
      await this.containerRuntime.removeContainer(container.id);
    }
    
    this.vpsList.delete(id);
  }

  /**
   * Resize a VPS instance
   */
  async resize(id: string, newSpec: VPSSpec): Promise<void> {
    const vps = this.vpsList.get(id);
    if (!vps) {
      throw new Error('VPS not found');
    }
    
    console.log('[VPSService] Resizing VPS:', id);
    
    // Update spec
    vps.spec = newSpec;
    
    // Recreate containers with new spec
    const containers = this.containerRuntime.getVPSContainers(id);
    for (const container of containers) {
      await this.containerRuntime.removeContainer(container.id);
      await this.containerRuntime.createContainer({
        vpsId: id,
        spec: newSpec,
        nodeId: container.nodeId
      });
    }
  }

  /**
   * Create a snapshot of VPS
   */
  async snapshot(id: string): Promise<Snapshot> {
    const vps = this.vpsList.get(id);
    if (!vps) {
      throw new Error('VPS not found');
    }
    
    console.log('[VPSService] Creating snapshot:', id);
    
    const snapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      vpsId: id,
      created: Date.now(),
      size: 0,
      data: {
        spec: vps.spec,
        // Would include container state, files, etc.
      }
    };
    
    return snapshot;
  }

  /**
   * Restore VPS from snapshot
   */
  async restore(snapshotId: string): Promise<VPS> {
    console.log('[VPSService] Restoring from snapshot:', snapshotId);
    
    // Would load snapshot data and create new VPS
    // For now, just create a basic VPS
    return this.create({
      name: 'Restored VPS',
      cpu: 1,
      memory: 512 * 1024 * 1024,
      storage: 10 * 1024 * 1024 * 1024,
      os: 'linux',
      runtime: 'node'
    });
  }

  /**
   * Get VPS by ID
   */
  get(id: string): VPS | undefined {
    return this.vpsList.get(id);
  }

  /**
   * List all VPS instances
   */
  list(): VPS[] {
    return Array.from(this.vpsList.values());
  }

  /**
   * Select nodes for VPS deployment
   */
  private async selectNodes(spec: VPSSpec, count: number): Promise<any[]> {
    // Get orchestrator stats to find available nodes
    const stats = this.orchestrator.getStats();
    
    // Mock node selection (in real implementation, would use orchestrator)
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node-${i}`,
        available: true
      });
    }
    
    return nodes;
  }

  /**
   * Route request to VPS
   */
  async routeRequest(vpsId: string, request: Request): Promise<Response> {
    const vps = this.vpsList.get(vpsId);
    if (!vps || vps.status !== 'running') {
      return new Response('VPS not available', { status: 503 });
    }
    
    // Update stats
    vps.stats.requests++;
    vps.lastAccessed = Date.now();
    
    // Get containers and load balance
    const containers = this.containerRuntime.getVPSContainers(vpsId);
    if (containers.length === 0) {
      return new Response('No containers available', { status: 503 });
    }
    
    // Simple round-robin load balancing
    const container = containers[vps.stats.requests % containers.length];
    
    return this.containerRuntime.routeRequest(container.id, request);
  }
}

// Singleton instance
let vpsServiceInstance: VPSService | null = null;

export function getVPSService(): VPSService {
  if (!vpsServiceInstance) {
    vpsServiceInstance = new VPSService();
  }
  return vpsServiceInstance;
}
