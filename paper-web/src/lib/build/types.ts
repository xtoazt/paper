/**
 * Build System Types
 * Core types for the Paper Network build infrastructure
 */

export interface Project {
  name: string;
  files: ProjectFile[];
  framework: Framework;
  hasSSR?: boolean;
  isSPA?: boolean;
  hasPackageJson?: boolean;
  hasSystemDependencies?: boolean;
  buildCommand?: string;
  requiredCapabilities?: string[];
  memoryRequired?: number;
  cpuRequired?: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  type: FileType;
}

export type FileType = 
  | 'javascript' 
  | 'typescript' 
  | 'jsx' 
  | 'tsx' 
  | 'html' 
  | 'css' 
  | 'json' 
  | 'markdown'
  | 'other';

export type Framework = 
  | 'react' 
  | 'vue' 
  | 'svelte' 
  | 'static' 
  | 'nextjs' 
  | 'gatsby'
  | 'django'
  | 'flask'
  | 'express'
  | 'fastify'
  | 'sveltekit'
  | 'remix'
  | 'astro'
  | 'unknown';

export interface BuildArtifact {
  id: string;
  projectName: string;
  framework: Framework;
  files: BuildFile[];
  entryPoint: string;
  ipfsCID?: string;
  timestamp: number;
  buildTime: number;
  size: number;
  metadata: BuildMetadata;
}

export interface BuildFile {
  path: string;
  content: string | Uint8Array;
  mimeType: string;
  size: number;
}

export interface BuildMetadata {
  framework: Framework;
  version: string;
  dependencies: Record<string, string>;
  environment: Record<string, string>;
  buildOptions: Record<string, any>;
}

export interface BuildComplexity {
  canBuildInBrowser: boolean;
  requiresNodeModules: boolean;
  requiresNativeDeps: boolean;
  estimatedBuildTime: number;
  recommendedRuntime: 'browser' | 'p2p';
}

export interface BuildJob {
  id: string;
  project: string; // IPFS CID of project
  framework: Framework;
  buildCommand: string;
  timeout: number;
  timestamp: number;
  requester: string; // Peer ID
}

export interface BuildResult {
  jobId: string;
  success: boolean;
  artifact?: BuildArtifact;
  error?: string;
  workerId: string;
  buildTime: number;
  logs: string[];
}

export interface BuildWorker {
  id: string;
  capabilities: string[];
  reputation: number;
  lastSeen: number;
  address: string;
}
