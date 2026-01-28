/**
 * Deployment System Types
 */

import type { Framework } from '../build/types';

export interface GitWebhook {
  event: 'push' | 'pull_request' | 'release';
  repo: GitRepository;
  commitSha: string;
  branch: string;
  author: string;
  message: string;
  timestamp: number;
  environment?: string;
}

export interface GitRepository {
  name: string;
  owner: string;
  url: string;
  provider: 'github' | 'gitlab' | 'gitea';
  branch: string;
}

export interface DeploymentConfig {
  projectName: string;
  framework: Framework;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
  nodeVersion?: string;
  pythonVersion?: string;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: Record<string, any>;
}

export interface DeploymentStatus {
  id: string;
  projectId: string;
  status: 'queued' | 'building' | 'deploying' | 'ready' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  error?: string;
  url?: string;
  commitSha?: string;
  branch?: string;
}

export interface ProjectSettings {
  id: string;
  name: string;
  repository?: GitRepository;
  config: DeploymentConfig;
  domains: string[];
  environmentVariables: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}
