/**
 * Init Command
 * Initializes a Paper project
 */

import * as fs from 'fs';
import * as path from 'path';

export async function initCommand() {
  console.log('📦 Initializing Paper project...\n');
  
  try {
    const cwd = process.cwd();
    const paperConfigPath = path.join(cwd, 'paper.json');
    
    // Check if already initialized
    if (fs.existsSync(paperConfigPath)) {
      console.log('⚠️  Project already initialized!');
      return;
    }
    
    // Detect framework
    let framework = 'static';
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.next) framework = 'nextjs';
      else if (deps.react) framework = 'react';
      else if (deps.vue) framework = 'vue';
      else if (deps.svelte) framework = 'svelte';
      else if (deps.express) framework = 'express';
    }
    
    // Create paper.json
    const config = {
      name: path.basename(cwd),
      framework,
      version: '1.0.0',
      build: {
        command: framework === 'static' ? null : 'npm run build',
        outputDirectory: framework === 'nextjs' ? '.next' : 'dist'
      },
      env: {}
    };
    
    fs.writeFileSync(paperConfigPath, JSON.stringify(config, null, 2));
    
    console.log('✓ Project initialized!');
    console.log(`\n📝 Framework: ${framework}`);
    console.log(`📂 Config: ${paperConfigPath}`);
    console.log('\n💡 Deploy with: paper deploy');
    
  } catch (error: any) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  }
}
