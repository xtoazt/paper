/**
 * Node.js Framework Adapter
 * Express and Fastify support
 */

import type { FrameworkAdapter, NodeConfig } from './types';
import type { BuildArtifact } from '../build/types';
import type { Application } from '../runtime/types';
import { p2pBuilder } from '../build';
import { containerRuntime } from '../runtime/';

export class NodeAdapter implements FrameworkAdapter {
  framework: 'express' | 'fastify' = 'express';

  constructor(framework: 'express' | 'fastify') {
    this.framework = framework;
  }

  async build(project: any): Promise<BuildArtifact> {
    console.log(`[Node Adapter] Building ${this.framework} application...`);
    
    const config = await this.analyzeConfig(project);
    
    // For Node.js apps, build might just be installing dependencies
    const artifact = await p2pBuilder.requestBuild({
      ...project,
      framework: this.framework,
      buildCommand: 'npm install'
    });
    
    console.log(`[Node Adapter] ✓ ${this.framework} build complete`);
    
    return artifact;
  }

  async deploy(artifact: BuildArtifact): Promise<Application> {
    console.log(`[Node Adapter] Deploying ${this.framework} application...`);
    
    const config = this.getConfig();
    
    const app: Application = {
      id: this.generateId(),
      name: artifact.projectName,
      framework: this.framework,
      version: '1.0.0',
      domain: `${artifact.projectName}.paper`,
      buildArtifactCID: artifact.ipfsCID || '',
      runtime: 'container',
      config: {
        env: {
          NODE_ENV: 'production',
          PORT: '3000',
          ...config.environment
        },
        memoryRequired: 512,
        cpuRequired: 1
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Deploy to container runtime
    console.log(`[Node Adapter] → Deploying to containers`);
    await containerRuntime.deployContainer(app);
    
    console.log(`[Node Adapter] ✓ Deployed to https://${app.domain}`);
    
    return app;
  }

  private async analyzeConfig(project: any): Promise<NodeConfig> {
    // Find entry point
    let entryPoint = 'index.js';
    
    const packageJson = project.files?.find((f: any) => f.path === 'package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        entryPoint = pkg.main || 'index.js';
        
        // Check for start script
        if (pkg.scripts?.start) {
          // Parse start command for entry point
        }
      } catch (e) {
        console.warn('[Node Adapter] Failed to parse package.json');
      }
    }
    
    // Check for server.js, app.js, etc.
    const commonEntries = ['server.js', 'app.js', 'src/index.js', 'src/server.js'];
    for (const entry of commonEntries) {
      if (project.files?.some((f: any) => f.path === entry)) {
        entryPoint = entry;
        break;
      }
    }
    
    return {
      runtime: 'container',
      buildCommand: 'npm install',
      startCommand: `node ${entryPoint}`,
      nodeVersion: '18',
      entryPoint,
      requiresNodeModules: true,
      requiresSystemDeps: false,
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    };
  }

  getConfig(): NodeConfig {
    return {
      runtime: 'container',
      buildCommand: 'npm install',
      startCommand: 'npm start',
      nodeVersion: '18',
      entryPoint: 'index.js',
      requiresNodeModules: true,
      requiresSystemDeps: false,
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    };
  }

  private generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export adapters
export const expressAdapter = new NodeAdapter('express');
export const fastifyAdapter = new NodeAdapter('fastify');
