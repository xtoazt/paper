/**
 * Deploy Command
 * Deploys current directory to Paper Network
 */

import * as fs from 'fs';
import * as path from 'path';
import { createTarball, detectProject, uploadToIPFS, triggerBuild } from '../utils/index.js';

export async function deployCommand(options: any) {
  console.log('🚀 Deploying to Paper Network...\n');
  
  try {
    const cwd = process.cwd();
    
    // Detect project
    console.log('📦 Detecting project...');
    const project = await detectProject(cwd);
    console.log(`✓ Detected ${project.framework} project: ${project.name}\n`);
    
    // Create tarball
    console.log('📁 Compressing files...');
    const tarball = await createTarball(project.files);
    console.log(`✓ Compressed ${project.files.length} files (${(tarball.length / 1024).toFixed(2)} KB)\n`);
    
    // Upload to IPFS
    console.log('☁️  Uploading to IPFS...');
    const cid = await uploadToIPFS(tarball);
    console.log(`✓ Uploaded to IPFS: ${cid}\n`);
    
    // Trigger build
    console.log('🔨 Building project...');
    const build = await triggerBuild({
      source: cid,
      framework: project.framework,
      projectName: options.project || project.name
    });
    
    const domain = `${options.project || project.name}.paper`;
    
    console.log('\n✨ Deployment successful!\n');
    console.log(`🌐 URL: https://${domain}`);
    console.log(`📝 Build ID: ${build.id}`);
    console.log(`⏱️  Build time: ${build.duration}ms`);
    console.log(`💾 Size: ${(build.size / 1024).toFixed(2)} KB`);
    
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}
