/**
 * VPS Service - Type Definitions
 */

export interface VPSSpec {
  name: string;
  cpu: number; // cores
  memory: number; // bytes
  storage: number; // bytes
  os: 'linux' | 'alpine' | 'debian' | 'ubuntu';
  runtime: 'node' | 'python' | 'go' | 'rust' | 'php' | 'ruby';
  env?: Record<string, string>;
  ports?: number[];
}

export interface VPS {
  id: string;
  name: string;
  spec: VPSSpec;
  status: 'starting' | 'running' | 'stopped' | 'error';
  domain: string; // vps-{id}.paper
  nodes: string[]; // distributed across these nodes
  created: number;
  lastAccessed: number;
  stats: VPSStats;
}

export interface VPSStats {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkIn: number;
  networkOut: number;
  requests: number;
  uptime: number;
}

export interface Container {
  id: string;
  vpsId: string;
  nodeId: string;
  status: 'starting' | 'running' | 'stopped';
  port: number;
  runtime: any; // WebContainer instance
}

export interface ContainerConfig {
  vpsId: string;
  spec: VPSSpec;
  nodeId: string;
}

export interface Snapshot {
  id: string;
  vpsId: string;
  created: number;
  size: number;
  data: any; // serialized container state
}
