/**
 * Python Framework Adapter
 * Django and Flask support
 */

import type { FrameworkAdapter, PythonConfig } from './types';
import type { BuildArtifact } from '../build/types';
import type { Application } from '../runtime/types';
import { p2pBuilder } from '../build';
import { containerRuntime } from '../runtime/';

export class PythonAdapter implements FrameworkAdapter {
  framework: 'django' | 'flask' = 'django';

  constructor(framework: 'django' | 'flask') {
    this.framework = framework;
  }

  async build(project: any): Promise<BuildArtifact> {
    console.log(`[Python Adapter] Building ${this.framework} application...`);
    
    const config = await this.analyzeConfig(project);
    
    // Build via P2P workers
    const artifact = await p2pBuilder.requestBuild({
      ...project,
      framework: this.framework,
      buildCommand: this.getBuildCommand()
    });
    
    console.log(`[Python Adapter] ✓ ${this.framework} build complete`);
    
    return artifact;
  }

  async deploy(artifact: BuildArtifact): Promise<Application> {
    console.log(`[Python Adapter] Deploying ${this.framework} application...`);
    
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
          PYTHONUNBUFFERED: '1',
          ...config.environment
        },
        memoryRequired: 512,
        cpuRequired: 1
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Deploy to container runtime
    console.log(`[Python Adapter] → Deploying to containers`);
    await containerRuntime.deployContainer(app);
    
    console.log(`[Python Adapter] ✓ Deployed to https://${app.domain}`);
    
    return app;
  }

  private async analyzeConfig(project: any): Promise<PythonConfig> {
    // Check for requirements.txt or pyproject.toml
    const hasRequirements = project.files?.some((f: any) =>
      f.path === 'requirements.txt' || f.path === 'pyproject.toml'
    );
    
    // Detect WSGI/ASGI app
    let wsgiApp = undefined;
    let asgiApp = undefined;
    
    if (this.framework === 'django') {
      wsgiApp = 'myproject.wsgi:application';
      asgiApp = 'myproject.asgi:application';
    } else if (this.framework === 'flask') {
      wsgiApp = 'app:app';
    }
    
    return {
      runtime: 'container',
      buildCommand: this.getBuildCommand(),
      startCommand: this.getStartCommand(),
      pythonVersion: '3.11',
      wsgiApp,
      asgiApp,
      requiresNodeModules: false,
      requiresSystemDeps: true,
      environment: {
        PYTHONUNBUFFERED: '1'
      }
    };
  }

  private getBuildCommand(): string {
    if (this.framework === 'django') {
      return 'pip install -r requirements.txt && python manage.py collectstatic --noinput';
    } else {
      return 'pip install -r requirements.txt';
    }
  }

  private getStartCommand(): string {
    if (this.framework === 'django') {
      return 'gunicorn myproject.wsgi:application --bind 0.0.0.0:8000';
    } else {
      return 'gunicorn app:app --bind 0.0.0.0:8000';
    }
  }

  getConfig(): PythonConfig {
    return {
      runtime: 'container',
      buildCommand: this.getBuildCommand(),
      startCommand: this.getStartCommand(),
      pythonVersion: '3.11',
      wsgiApp: this.framework === 'django' ? 'myproject.wsgi:application' : 'app:app',
      requiresNodeModules: false,
      requiresSystemDeps: true,
      environment: {
        PYTHONUNBUFFERED: '1',
        DJANGO_SETTINGS_MODULE: this.framework === 'django' ? 'myproject.settings' : undefined
      }
    };
  }

  private generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export adapters
export const djangoAdapter = new PythonAdapter('django');
export const flaskAdapter = new PythonAdapter('flask');
