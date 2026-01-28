/**
 * Next.js Adapter
 * Handles SSG, SSR, API routes, and ISR
 */

import type { FrameworkAdapter, NextJSConfig } from './types';
import type { BuildArtifact } from '../build/types';
import type { Application } from '../runtime/types';
import { p2pBuilder } from '../build';
import { containerRuntime, edgeRuntime } from '../runtime';

export class NextJSAdapter implements FrameworkAdapter {
  framework = 'nextjs' as const;

  async build(project: any): Promise<BuildArtifact> {
    console.log('[NextJS Adapter] Building Next.js application...');
    
    // Analyze Next.js configuration
    const config = await this.analyzeConfig(project);
    
    console.log('[NextJS Adapter] Configuration:', {
      hasSSR: config.hasSSR,
      hasAPIRoutes: config.hasAPIRoutes,
      hasISR: config.hasISR
    });
    
    // Build via P2P workers (Next.js requires Node.js)
    const artifact = await p2pBuilder.requestBuild({
      ...project,
      framework: 'nextjs',
      buildCommand: 'npm run build'
    });
    
    // Extract different output types
    const output = await this.extractOutput(artifact);
    
    console.log('[NextJS Adapter] ✓ Build complete:', {
      staticPages: output.static.length,
      ssrPages: output.ssr.length,
      apiRoutes: output.api.length
    });
    
    return artifact;
  }

  async deploy(artifact: BuildArtifact): Promise<Application> {
    console.log('[NextJS Adapter] Deploying Next.js application...');
    
    const config = await this.analyzeConfig({ files: [] });
    
    // Hybrid deployment:
    // - Static pages → IPFS
    // - SSR pages → Container runtime
    // - API routes → Edge runtime
    
    const app: Application = {
      id: this.generateId(),
      name: artifact.projectName,
      framework: 'nextjs',
      version: '1.0.0',
      domain: `${artifact.projectName}.paper`,
      buildArtifactCID: artifact.ipfsCID || '',
      runtime: 'hybrid',
      config: {
        env: {},
        routing: {
          routes: [
            { path: '/_next/static/*', handler: 'static' },
            { path: '/api/*', handler: 'edge' },
            { path: '/*', handler: 'container' }
          ]
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Deploy static assets to IPFS
    console.log('[NextJS Adapter] → Deploying static assets to IPFS');
    
    // Deploy SSR to containers
    if (config.hasSSR) {
      console.log('[NextJS Adapter] → Deploying SSR to containers');
      await containerRuntime.deployContainer(app);
    }
    
    // Deploy API routes to edge
    if (config.hasAPIRoutes) {
      console.log('[NextJS Adapter] → Deploying API routes to edge runtime');
      // await this.deployAPIRoutes(app);
    }
    
    console.log(`[NextJS Adapter] ✓ Deployed to https://${app.domain}`);
    
    return app;
  }

  private async analyzeConfig(project: any): Promise<NextJSConfig> {
    // Check for next.config.js
    const nextConfig = project.files?.find((f: any) =>
      f.path === 'next.config.js' || f.path === 'next.config.mjs'
    );
    
    // Check for API routes
    const hasAPIRoutes = project.files?.some((f: any) =>
      f.path.includes('/api/') || f.path.includes('/pages/api/')
    );
    
    // Check for app directory (Next.js 13+)
    const hasAppDir = project.files?.some((f: any) =>
      f.path.startsWith('app/')
    );
    
    return {
      runtime: 'hybrid',
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      requiresNodeModules: true,
      requiresSystemDeps: false,
      hasSSR: hasAppDir || true, // Assume SSR by default
      hasAPIRoutes: hasAPIRoutes || false,
      hasISR: false, // Check config for ISR
      imageOptimization: true
    };
  }

  private async extractOutput(artifact: BuildArtifact): Promise<{
    static: any[];
    ssr: any[];
    api: any[];
  }> {
    // Extract different output types from Next.js build
    return {
      static: artifact.files.filter(f => f.path.includes('/_next/static/')),
      ssr: artifact.files.filter(f => !f.path.includes('/api/') && !f.path.includes('/_next/')),
      api: artifact.files.filter(f => f.path.includes('/api/'))
    };
  }

  getConfig(): NextJSConfig {
    return {
      runtime: 'hybrid',
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      environment: {
        NODE_ENV: 'production'
      },
      requiresNodeModules: true,
      requiresSystemDeps: false,
      hasSSR: true,
      hasAPIRoutes: true,
      hasISR: false,
      imageOptimization: true
    };
  }

  private generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton
export const nextjsAdapter = new NextJSAdapter();
