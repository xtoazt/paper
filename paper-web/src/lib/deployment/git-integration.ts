/**
 * Git Integration
 * GitHub/GitLab webhook integration for automatic deployments
 */

import type { GitWebhook, GitRepository, DeploymentConfig, DeploymentStatus } from './types';
import type { Project } from '../build/types';
import { buildOrchestrator } from '../build';

export class GitIntegration {
  private deployments: Map<string, DeploymentStatus> = new Map();
  private webhookSecret: string = '';

  async initialize(secret?: string): Promise<void> {
    this.webhookSecret = secret || this.generateSecret();
    console.log('[GitIntegration] Git integration initialized');
  }

  async handleWebhook(webhook: GitWebhook): Promise<DeploymentStatus> {
    console.log(`[GitIntegration] Received ${webhook.event} webhook from ${webhook.repo.name}`);
    
    if (webhook.event === 'push') {
      return await this.handlePush(webhook);
    } else if (webhook.event === 'pull_request') {
      return await this.handlePullRequest(webhook);
    } else {
      console.log(`[GitIntegration] Ignoring ${webhook.event} event`);
      throw new Error(`Unsupported webhook event: ${webhook.event}`);
    }
  }

  private async handlePush(webhook: GitWebhook): Promise<DeploymentStatus> {
    console.log(`[GitIntegration] Processing push to ${webhook.branch}`);
    
    const deploymentId = this.generateDeploymentId();
    
    const status: DeploymentStatus = {
      id: deploymentId,
      projectId: webhook.repo.name,
      status: 'queued',
      startedAt: Date.now(),
      commitSha: webhook.commitSha,
      branch: webhook.branch
    };
    
    this.deployments.set(deploymentId, status);
    
    try {
      // Update status to building
      status.status = 'building';
      await this.updateCommitStatus(webhook, 'pending', 'Building...');
      
      // Clone repository
      const repo = await this.cloneRepo(webhook.repo, webhook.commitSha);
      
      // Detect framework
      const framework = await this.detectFramework(repo);
      console.log(`[GitIntegration] Detected framework: ${framework}`);
      
      // Build the project
      const buildArtifact = await buildOrchestrator.build({
        name: webhook.repo.name,
        files: repo.files,
        framework,
        hasPackageJson: repo.files.some(f => f.path === 'package.json'),
        buildCommand: this.getBuildCommand(framework)
      });
      
      // Update status to deploying
      status.status = 'deploying';
      
      // Deploy to .paper domain
      const url = await this.deploy(buildArtifact, webhook.repo.name);
      
      // Update status to ready
      status.status = 'ready';
      status.completedAt = Date.now();
      status.duration = status.completedAt - status.startedAt;
      status.url = url;
      
      await this.updateCommitStatus(webhook, 'success', `Deployed to ${url}`);
      
      console.log(`[GitIntegration] ✓ Deployment complete: ${url}`);
      
      return status;
    } catch (error: any) {
      console.error('[GitIntegration] Deployment failed:', error);
      
      status.status = 'failed';
      status.completedAt = Date.now();
      status.duration = status.completedAt - status.startedAt;
      status.error = error.message;
      
      await this.updateCommitStatus(webhook, 'failure', `Deployment failed: ${error.message}`);
      
      return status;
    }
  }

  private async handlePullRequest(webhook: GitWebhook): Promise<DeploymentStatus> {
    console.log(`[GitIntegration] Processing pull request #${webhook.commitSha}`);
    
    // Create preview deployment
    const status = await this.handlePush(webhook);
    
    // Add PR comment with preview URL
    if (status.url) {
      await this.addPRComment(webhook, `Preview deployed to: ${status.url}`);
    }
    
    return status;
  }

  private async cloneRepo(repo: GitRepository, commitSha: string): Promise<Project> {
    console.log(`[GitIntegration] Cloning ${repo.owner}/${repo.name}@${commitSha}`);
    
    // Mock: In real implementation, this would clone via GitHub API
    // For now, return a mock project structure
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: repo.name,
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0'
          }
        }),
        type: 'json' as const
      },
      {
        path: 'src/index.js',
        content: 'console.log("Hello from Git!");',
        type: 'javascript' as const
      },
      {
        path: 'public/index.html',
        content: '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
        type: 'html' as const
      }
    ];
    
    return {
      name: repo.name,
      files,
      framework: 'unknown',
      hasPackageJson: true
    };
  }

  private async detectFramework(project: Project): Promise<any> {
    // Check package.json for framework
    const pkgJson = project.files.find(f => f.path === 'package.json');
    if (pkgJson) {
      try {
        const pkg = JSON.parse(pkgJson.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.next) return 'nextjs';
        if (deps.gatsby) return 'gatsby';
        if (deps.react) return 'react';
        if (deps.vue) return 'vue';
        if (deps.svelte) return 'svelte';
        if (deps.express) return 'express';
        if (deps.fastify) return 'fastify';
        if (deps['@remix-run/react']) return 'remix';
        if (deps.astro) return 'astro';
      } catch (e) {
        console.warn('[GitIntegration] Failed to parse package.json');
      }
    }
    
    // Check for Python frameworks
    if (project.files.some(f => f.path === 'manage.py')) return 'django';
    if (project.files.some(f => f.path === 'app.py')) return 'flask';
    
    return 'static';
  }

  private getBuildCommand(framework: string): string {
    const commands: Record<string, string> = {
      'nextjs': 'npm run build',
      'gatsby': 'npm run build',
      'react': 'npm run build',
      'vue': 'npm run build',
      'svelte': 'npm run build',
      'remix': 'npm run build',
      'astro': 'npm run build',
      'static': 'echo "No build needed"'
    };
    return commands[framework] || 'npm run build';
  }

  private async deploy(artifact: any, projectName: string): Promise<string> {
    // Mock deployment
    const domain = `${projectName}.paper`;
    console.log(`[GitIntegration] Deploying to ${domain}`);
    
    // In real implementation, this would:
    // 1. Upload artifact to IPFS
    // 2. Register domain in Paper registry
    // 3. Update DNS records
    
    return `https://${domain}`;
  }

  private async updateCommitStatus(
    webhook: GitWebhook,
    state: 'pending' | 'success' | 'failure',
    description: string
  ): Promise<void> {
    console.log(`[GitIntegration] Updating commit status: ${state} - ${description}`);
    
    // Mock: In real implementation, this would call GitHub/GitLab API
    // to update the commit status check
  }

  private async addPRComment(webhook: GitWebhook, message: string): Promise<void> {
    console.log(`[GitIntegration] Adding PR comment: ${message}`);
    
    // Mock: In real implementation, this would add a comment to the PR
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | null> {
    return this.deployments.get(deploymentId) || null;
  }

  async listDeployments(projectId: string): Promise<DeploymentStatus[]> {
    return Array.from(this.deployments.values())
      .filter(d => d.projectId === projectId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  async cancelDeployment(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (status && (status.status === 'queued' || status.status === 'building')) {
      status.status = 'cancelled';
      status.completedAt = Date.now();
      console.log(`[GitIntegration] Deployment ${deploymentId} cancelled`);
    }
  }

  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  getWebhookURL(): string {
    // Return the webhook URL for GitHub/GitLab configuration
    return `https://paper.is-a.software/api/webhooks/git`;
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }
}

// Export singleton instance
export const gitIntegration = new GitIntegration();
