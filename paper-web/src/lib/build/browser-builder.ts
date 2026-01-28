/**
 * Browser-Based Build Engine
 * Builds simple applications entirely in the browser using WebAssembly and browser APIs
 */

import type { Project, BuildArtifact, BuildFile, Framework } from './types';

export class BrowserBuilder {
  private initialized = false;
  private babelWorker: Worker | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[BrowserBuilder] Initializing browser build engine...');
    this.initialized = true;
  }

  async build(project: Project): Promise<BuildArtifact> {
    await this.initialize();
    
    const startTime = Date.now();
    console.log(`[BrowserBuilder] Building ${project.framework} project: ${project.name}`);
    
    // Detect framework
    const framework = await this.detectFramework(project);
    
    // Choose appropriate builder
    let files: BuildFile[];
    switch (framework) {
      case 'react':
        files = await this.buildReact(project);
        break;
      case 'vue':
        files = await this.buildVue(project);
        break;
      case 'svelte':
        files = await this.buildSvelte(project);
        break;
      case 'static':
        files = await this.bundleStatic(project);
        break;
      default:
        throw new Error(`Framework ${framework} not supported in browser builder`);
    }
    
    const buildTime = Date.now() - startTime;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    const artifact: BuildArtifact = {
      id: this.generateId(),
      projectName: project.name,
      framework,
      files,
      entryPoint: this.findEntryPoint(files),
      timestamp: Date.now(),
      buildTime,
      size: totalSize,
      metadata: {
        framework,
        version: '1.0.0',
        dependencies: {},
        environment: {},
        buildOptions: { browser: true }
      }
    };
    
    console.log(`[BrowserBuilder] ✓ Build complete in ${buildTime}ms (${totalSize} bytes)`);
    return artifact;
  }

  private async detectFramework(project: Project): Promise<Framework> {
    if (project.framework !== 'unknown') {
      return project.framework;
    }
    
    // Auto-detect framework from files
    const hasPackageJson = project.files.some(f => f.path === 'package.json');
    if (hasPackageJson) {
      const pkgJson = project.files.find(f => f.path === 'package.json');
      if (pkgJson) {
        try {
          const pkg = JSON.parse(pkgJson.content);
          if (pkg.dependencies?.react || pkg.devDependencies?.react) return 'react';
          if (pkg.dependencies?.vue || pkg.devDependencies?.vue) return 'vue';
          if (pkg.dependencies?.svelte || pkg.devDependencies?.svelte) return 'svelte';
          if (pkg.dependencies?.next || pkg.devDependencies?.next) return 'nextjs';
        } catch (e) {
          console.warn('[BrowserBuilder] Failed to parse package.json', e);
        }
      }
    }
    
    // Check for framework-specific files
    if (project.files.some(f => f.path.endsWith('.jsx') || f.path.endsWith('.tsx'))) {
      return 'react';
    }
    if (project.files.some(f => f.path.endsWith('.vue'))) {
      return 'vue';
    }
    if (project.files.some(f => f.path.endsWith('.svelte'))) {
      return 'svelte';
    }
    
    return 'static';
  }

  private async buildReact(project: Project): Promise<BuildFile[]> {
    console.log('[BrowserBuilder] Building React application...');
    
    // Use @babel/standalone for JSX transformation
    const transformed: BuildFile[] = [];
    
    for (const file of project.files) {
      if (file.path.endsWith('.jsx') || file.path.endsWith('.tsx')) {
        try {
          // For now, use dynamic import of @babel/standalone
          const babel = await this.loadBabel();
          const result = babel.transform(file.content, {
            presets: ['react'],
            filename: file.path
          });
          
          transformed.push({
            path: file.path.replace(/\.(jsx|tsx)$/, '.js'),
            content: result.code || file.content,
            mimeType: 'application/javascript',
            size: result.code?.length || 0
          });
        } catch (error) {
          console.error(`[BrowserBuilder] Error transforming ${file.path}:`, error);
          // Fallback: include original file
          transformed.push(this.convertToBuilFile(file));
        }
      } else {
        transformed.push(this.convertToBuildFile(file));
      }
    }
    
    // Bundle with simple concatenation (can be improved with webpack WASM)
    return this.simpleBundle(transformed);
  }

  private async buildVue(project: Project): Promise<BuildFile[]> {
    console.log('[BrowserBuilder] Building Vue application...');
    
    // For now, return files as-is (Vue can compile at runtime)
    // TODO: Integrate Vue compiler
    return project.files.map(f => this.convertToBuildFile(f));
  }

  private async buildSvelte(project: Project): Promise<BuildFile[]> {
    console.log('[BrowserBuilder] Building Svelte application...');
    
    // For now, return files as-is
    // TODO: Integrate Svelte compiler (it's small enough to run in browser)
    return project.files.map(f => this.convertToBuildFile(f));
  }

  private async bundleStatic(project: Project): Promise<BuildFile[]> {
    console.log('[BrowserBuilder] Bundling static files...');
    
    // Static files need no processing
    return project.files.map(f => this.convertToBuildFile(f));
  }

  private convertToBuildFile(file: any): BuildFile {
    const content = typeof file.content === 'string' 
      ? file.content 
      : new TextDecoder().decode(file.content);
    
    return {
      path: file.path,
      content,
      mimeType: this.getMimeType(file.path),
      size: content.length
    };
  }

  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private simpleBundle(files: BuildFile[]): BuildFile[] {
    // Simple bundling: just return all files
    // TODO: Implement proper module bundling with dependency resolution
    return files;
  }

  private findEntryPoint(files: BuildFile[]): string {
    // Try to find entry point
    const candidates = ['index.html', 'index.js', 'main.js', 'app.js'];
    for (const candidate of candidates) {
      if (files.some(f => f.path === candidate || f.path.endsWith('/' + candidate))) {
        return candidate;
      }
    }
    return files[0]?.path || 'index.html';
  }

  private generateId(): string {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadBabel(): Promise<any> {
    // Dynamic import of @babel/standalone
    // In a real implementation, this would be loaded from CDN or bundled
    try {
      // @ts-ignore
      if (window.Babel) {
        // @ts-ignore
        return window.Babel;
      }
      
      // Fallback: mock transformer
      return {
        transform: (code: string, options: any) => {
          console.warn('[BrowserBuilder] Babel not available, returning original code');
          return { code };
        }
      };
    } catch (error) {
      console.error('[BrowserBuilder] Failed to load Babel:', error);
      return {
        transform: (code: string) => ({ code })
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.babelWorker) {
      this.babelWorker.terminate();
      this.babelWorker = null;
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const browserBuilder = new BrowserBuilder();
