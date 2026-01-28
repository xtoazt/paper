/**
 * Build Orchestrator
 * Routes builds to browser builder or P2P workers based on complexity
 */

import type { Project, BuildArtifact, BuildComplexity } from './types';
import { browserBuilder } from './browser-builder';
import { p2pBuilder } from './p2p-builder';

export class BuildOrchestrator {
  private browserBuilder = browserBuilder;
  private p2pBuilder = p2pBuilder;

  async build(project: Project): Promise<BuildArtifact> {
    console.log(`[BuildOrchestrator] Analyzing project: ${project.name}`);
    
    // Analyze complexity
    const complexity = await this.analyzeComplexity(project);
    
    console.log('[BuildOrchestrator] Analysis:', {
      canBuildInBrowser: complexity.canBuildInBrowser,
      estimatedTime: `${complexity.estimatedBuildTime}ms`,
      recommendedRuntime: complexity.recommendedRuntime
    });
    
    // Route to appropriate builder
    if (complexity.canBuildInBrowser) {
      console.log('[BuildOrchestrator] → Routing to browser builder');
      return await this.browserBuilder.build(project);
    } else {
      console.log('[BuildOrchestrator] → Routing to P2P builder');
      return await this.p2pBuilder.requestBuild(project);
    }
  }

  private async analyzeComplexity(project: Project): Promise<BuildComplexity> {
    // Check framework
    const simpleBrowserFrameworks = ['react', 'vue', 'svelte', 'static'];
    const complexFrameworks = ['nextjs', 'gatsby', 'django', 'flask', 'express', 'remix', 'astro'];
    
    // Determine if can build in browser
    const canBuildInBrowser = 
      simpleBrowserFrameworks.includes(project.framework) &&
      !project.hasSSR &&
      !project.hasSystemDependencies &&
      !this.hasComplexDependencies(project);
    
    // Estimate build time
    const estimatedBuildTime = this.estimateBuildTime(project);
    
    return {
      canBuildInBrowser,
      requiresNodeModules: project.hasPackageJson || false,
      requiresNativeDeps: project.hasSystemDependencies || false,
      estimatedBuildTime,
      recommendedRuntime: canBuildInBrowser ? 'browser' : 'p2p'
    };
  }

  private hasComplexDependencies(project: Project): boolean {
    // Check package.json for complex dependencies
    const pkgJsonFile = project.files.find(f => f.path === 'package.json');
    if (!pkgJsonFile) return false;
    
    try {
      const pkg = JSON.parse(pkgJsonFile.content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      
      // List of dependencies that require native builds
      const complexDeps = [
        'node-sass',
        'node-gyp',
        'sqlite3',
        'better-sqlite3',
        'sharp',
        'canvas',
        'puppeteer',
        'playwright'
      ];
      
      return complexDeps.some(dep => allDeps[dep]);
    } catch (e) {
      return false;
    }
  }

  private estimateBuildTime(project: Project): number {
    // Estimate build time based on project characteristics
    let baseTime = 1000; // 1 second base
    
    // Add time for number of files
    baseTime += project.files.length * 10;
    
    // Add time for framework complexity
    const frameworkTimes: Record<string, number> = {
      'static': 0,
      'react': 2000,
      'vue': 2000,
      'svelte': 1500,
      'nextjs': 5000,
      'gatsby': 8000,
      'django': 3000,
      'flask': 2000,
      'express': 1000
    };
    baseTime += frameworkTimes[project.framework] || 3000;
    
    // Add time for dependencies
    if (project.hasPackageJson) {
      baseTime += 3000;
    }
    
    return baseTime;
  }

  async getBuildStrategy(project: Project): Promise<string> {
    const complexity = await this.analyzeComplexity(project);
    return complexity.recommendedRuntime;
  }
}

// Export singleton instance
export const buildOrchestrator = new BuildOrchestrator();
