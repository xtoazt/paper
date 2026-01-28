/**
 * CLI Utilities
 */

import * as fs from 'fs';
import * as path from 'path';

export async function detectProject(cwd: string): Promise<any> {
  let framework = 'static';
  let name = path.basename(cwd);
  
  // Check for paper.json
  const paperConfig = path.join(cwd, 'paper.json');
  if (fs.existsSync(paperConfig)) {
    const config = JSON.parse(fs.readFileSync(paperConfig, 'utf-8'));
    return {
      name: config.name || name,
      framework: config.framework || framework,
      files: await getProjectFiles(cwd)
    };
  }
  
  // Check for package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    name = pkg.name || name;
    
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.next) framework = 'nextjs';
    else if (deps.react) framework = 'react';
    else if (deps.vue) framework = 'vue';
    else if (deps.svelte) framework = 'svelte';
    else if (deps.express) framework = 'express';
  }
  
  return {
    name,
    framework,
    files: await getProjectFiles(cwd)
  };
}

async function getProjectFiles(cwd: string): Promise<any[]> {
  const files: any[] = [];
  const ignore = ['node_modules', '.git', 'dist', 'build', '.next', 'out'];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue;
      
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(cwd, fullPath);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        files.push({
          path: relativePath,
          fullPath
        });
      }
    }
  }
  
  walkDir(cwd);
  return files;
}

export async function createTarball(files: any[]): Promise<Buffer> {
  // Mock: Return empty buffer
  // In real implementation, use tar library
  return Buffer.from('mock-tarball');
}

export async function uploadToIPFS(data: Buffer): Promise<string> {
  // Mock IPFS upload
  return `Qm${Math.random().toString(36).substring(2, 46)}`;
}

export async function triggerBuild(config: any): Promise<any> {
  // Mock build trigger
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    id: `build_${Date.now()}`,
    duration: 2000 + Math.random() * 3000,
    size: 1024 * 100 + Math.random() * 1024 * 500
  };
}
