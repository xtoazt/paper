/**
 * Distributed Compute - Type Definitions
 */

export interface ComputeNode {
  id: string;
  peerId: string;
  capabilities: NodeCapabilities;
  resources: NodeResources;
  reputation: number;
  lastSeen: number;
  geolocation?: Geolocation;
  status: 'active' | 'idle' | 'busy' | 'offline';
}

export interface NodeCapabilities {
  cpu: {
    cores: number;
    speed: number; // GHz
    architecture: string;
  };
  memory: {
    total: number; // bytes
    available: number;
  };
  storage: {
    total: number;
    available: number;
  };
  network: {
    bandwidth: number; // Mbps
    latency: number; // ms
  };
  features: string[]; // webassembly, webgpu, etc.
}

export interface NodeResources {
  cpuUsage: number; // 0-1
  memoryUsage: number; // 0-1
  storageUsage: number; // 0-1
  networkUsage: number; // 0-1
  activeTasks: number;
}

export interface Geolocation {
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
}

export interface ComputeTask {
  id: string;
  type: 'compute' | 'storage' | 'proxy' | 'database' | 'cdn' | 'vps';
  priority: number; // 0-10
  payload: any;
  requirements: TaskRequirements;
  timeout: number;
  retries: number;
  created: number;
  assigned?: string; // node id
}

export interface TaskRequirements {
  cpu?: number; // cores needed
  memory?: number; // bytes needed
  storage?: number; // bytes needed
  network?: number; // Mbps needed
  geolocation?: string; // preferred region
  features?: string[]; // required features
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  nodeId: string;
}

export interface Workload {
  id: string;
  tasks: ComputeTask[];
  distribution: 'random' | 'round-robin' | 'least-loaded' | 'geo-aware';
  parallelism: number;
}

export interface LoadBalancerStrategy {
  name: string;
  weight: (node: ComputeNode, task: ComputeTask) => number;
}
