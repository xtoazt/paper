/**
 * Framework Adapter Types
 */

import type { Framework, BuildArtifact } from '../build/types';
import type { Application } from '../runtime/types';

export interface FrameworkAdapter {
  framework: Framework;
  build(project: any): Promise<BuildArtifact>;
  deploy(artifact: BuildArtifact): Promise<Application>;
  getConfig(): AdapterConfig;
}

export interface AdapterConfig {
  runtime: 'browser' | 'container' | 'hybrid' | 'edge';
  buildCommand: string;
  startCommand?: string;
  environment?: Record<string, string>;
  dependencies?: string[];
  requiresNodeModules: boolean;
  requiresSystemDeps: boolean;
}

export interface NextJSConfig extends AdapterConfig {
  hasSSR: boolean;
  hasAPIRoutes: boolean;
  hasISR: boolean;
  imageOptimization: boolean;
}

export interface PythonConfig extends AdapterConfig {
  pythonVersion: string;
  wsgiApp?: string;
  asgiApp?: string;
}

export interface NodeConfig extends AdapterConfig {
  nodeVersion: string;
  entryPoint: string;
}
