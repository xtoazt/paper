/**
 * Runtime System Types
 */

import type { Framework } from '../build/types';

export interface Application {
  id: string;
  name: string;
  framework: Framework;
  version: string;
  domain: string;
  buildArtifactCID: string;
  runtime: RuntimeType;
  config: ApplicationConfig;
  createdAt: number;
  updatedAt: number;
}

export type RuntimeType = 'edge' | 'container' | 'static';

export interface ApplicationConfig {
  env: Record<string, string>;
  memoryRequired?: number;
  cpuRequired?: number;
  scaling?: ScalingConfig;
  routing?: RoutingConfig;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  autoScale: boolean;
  targetCPU?: number;
}

export interface RoutingConfig {
  routes: Route[];
  rewrites?: Rewrite[];
  headers?: Header[];
}

export interface Route {
  path: string;
  handler: 'static' | 'edge' | 'container';
  destination?: string;
}

export interface Rewrite {
  source: string;
  destination: string;
}

export interface Header {
  source: string;
  headers: Record<string, string>;
}

export interface Deployment {
  id: string;
  applicationId: string;
  url: string;
  nodes: string[];
  loadBalancer?: string;
  status: DeploymentStatus;
  createdAt: number;
}

export type DeploymentStatus = 
  | 'deploying' 
  | 'active' 
  | 'failed' 
  | 'stopped';

export interface ContainerNode {
  id: string;
  address: string;
  capabilities: string[];
  resources: NodeResources;
  reputation: number;
  lastSeen: number;
}

export interface NodeResources {
  cpuAvailable: number;
  memoryAvailable: number;
  storageAvailable: number;
  bandwidth: number;
}

export interface EdgeFunctionRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string | ArrayBuffer;
}

export interface EdgeFunctionResponse {
  status: number;
  headers: Record<string, string>;
  body: string | ArrayBuffer;
}

export interface EdgeFunction {
  id: string;
  name: string;
  code: string;
  runtime: 'javascript' | 'python' | 'wasm';
  timeout: number;
  memory: number;
}

export interface ContainerSpec {
  image: string;
  command?: string[];
  env: Record<string, string>;
  ports: number[];
  volumes?: VolumeMount[];
  resources: ResourceLimits;
}

export interface VolumeMount {
  name: string;
  mountPath: string;
}

export interface ResourceLimits {
  cpu: string;
  memory: string;
  storage?: string;
}

export interface LoadBalancer {
  id: string;
  address: string;
  backends: Backend[];
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
}

export interface Backend {
  address: string;
  weight: number;
  healthy: boolean;
  lastCheck: number;
}
