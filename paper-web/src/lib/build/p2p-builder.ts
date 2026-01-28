/**
 * P2P Build Workers
 * Distributed build system for complex frameworks requiring Node.js/system tools
 */

import type { Project, BuildArtifact, BuildJob, BuildResult, BuildWorker } from './types';

export class P2PBuilder {
  private dht: any; // DHT instance from p2p layer
  private workers: Map<string, BuildWorker> = new Map();

  constructor(dht?: any) {
    this.dht = dht;
  }

  async initialize(dht: any): Promise<void> {
    this.dht = dht;
    console.log('[P2PBuilder] P2P build worker system initialized');
  }

  async requestBuild(project: Project): Promise<BuildArtifact> {
    if (!this.dht) {
      throw new Error('[P2PBuilder] DHT not initialized. Cannot build via P2P.');
    }

    console.log(`[P2PBuilder] Requesting P2P build for ${project.framework} project: ${project.name}`);
    
    const startTime = Date.now();
    
    // Find available build workers
    const workers = await this.findWorkers({
      capabilities: project.requiredCapabilities || [project.framework],
      minReputation: 0.8
    });
    
    if (workers.length === 0) {
      throw new Error('[P2PBuilder] No build workers available. Consider using browser builder.');
    }
    
    console.log(`[P2PBuilder] Found ${workers.length} available workers`);
    
    // Upload project to IPFS
    const projectCID = await this.uploadToIPFS(project);
    console.log(`[P2PBuilder] Project uploaded to IPFS: ${projectCID}`);
    
    // Create build job
    const job: BuildJob = {
      id: this.generateJobId(),
      project: projectCID,
      framework: project.framework,
      buildCommand: project.buildCommand || this.getDefaultBuildCommand(project.framework),
      timeout: 600, // 10 minutes
      timestamp: Date.now(),
      requester: 'local' // TODO: Get actual peer ID
    };
    
    // Broadcast to workers
    console.log(`[P2PBuilder] Broadcasting build job ${job.id} to ${workers.length} workers`);
    const results = await this.broadcastBuildJob(job, workers);
    
    // Use consensus - require 3 workers to produce same hash
    const artifact = await this.consensusBuild(results);
    
    const buildTime = Date.now() - startTime;
    console.log(`[P2PBuilder] ✓ Build complete in ${buildTime}ms via P2P consensus`);
    
    return artifact;
  }

  private async findWorkers(criteria: {
    capabilities: string[];
    minReputation: number;
  }): Promise<BuildWorker[]> {
    // For now, return mock workers
    // TODO: Implement actual DHT-based worker discovery
    console.log(`[P2PBuilder] Searching for workers with capabilities: ${criteria.capabilities.join(', ')}`);
    
    // Simulate finding workers
    const mockWorkers: BuildWorker[] = [
      {
        id: 'worker_1',
        capabilities: ['react', 'nextjs', 'vue', 'svelte'],
        reputation: 0.95,
        lastSeen: Date.now(),
        address: 'p2p://mock-worker-1'
      },
      {
        id: 'worker_2',
        capabilities: ['django', 'flask', 'express', 'fastify'],
        reputation: 0.90,
        lastSeen: Date.now(),
        address: 'p2p://mock-worker-2'
      },
      {
        id: 'worker_3',
        capabilities: ['nextjs', 'gatsby', 'astro', 'remix'],
        reputation: 0.88,
        lastSeen: Date.now(),
        address: 'p2p://mock-worker-3'
      }
    ];
    
    // Filter by capabilities and reputation
    return mockWorkers.filter(worker => {
      const hasCapability = criteria.capabilities.some(cap => 
        worker.capabilities.includes(cap)
      );
      return hasCapability && worker.reputation >= criteria.minReputation;
    });
  }

  private async uploadToIPFS(project: Project): Promise<string> {
    // Mock IPFS upload
    // TODO: Implement actual IPFS upload via IPFS node
    const mockCID = `Qm${Math.random().toString(36).substr(2, 44)}`;
    console.log(`[P2PBuilder] Mock upload to IPFS: ${mockCID}`);
    return mockCID;
  }

  private async broadcastBuildJob(job: BuildJob, workers: BuildWorker[]): Promise<BuildResult[]> {
    // Broadcast build job to workers and collect results
    console.log(`[P2PBuilder] Broadcasting job to ${workers.length} workers...`);
    
    // Mock: simulate worker responses
    const results: BuildResult[] = await Promise.all(
      workers.slice(0, 3).map(async (worker, index) => {
        // Simulate build time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return {
          jobId: job.id,
          success: true,
          artifact: {
            id: `artifact_${job.id}_${worker.id}`,
            projectName: 'test-project',
            framework: job.framework,
            files: [],
            entryPoint: 'index.html',
            ipfsCID: `Qm${Math.random().toString(36).substr(2, 44)}`,
            timestamp: Date.now(),
            buildTime: 1000 + Math.random() * 2000,
            size: 1024 * 100,
            metadata: {
              framework: job.framework,
              version: '1.0.0',
              dependencies: {},
              environment: {},
              buildOptions: {}
            }
          },
          workerId: worker.id,
          buildTime: 1000 + Math.random() * 2000,
          logs: [
            `Worker ${worker.id} started build`,
            'Installing dependencies...',
            'Building project...',
            'Build successful!'
          ]
        };
      })
    );
    
    console.log(`[P2PBuilder] Received ${results.filter(r => r.success).length}/${results.length} successful builds`);
    return results;
  }

  private async consensusBuild(results: BuildResult[]): Promise<BuildArtifact> {
    // Require consensus from at least 3 workers
    const successful = results.filter(r => r.success && r.artifact);
    
    if (successful.length === 0) {
      throw new Error('[P2PBuilder] All build workers failed');
    }
    
    if (successful.length < 2) {
      console.warn('[P2PBuilder] Only 1 successful build, proceeding without full consensus');
      return successful[0].artifact!;
    }
    
    // Group by IPFS CID (hash of build output)
    const byCID = new Map<string, BuildResult[]>();
    for (const result of successful) {
      const cid = result.artifact!.ipfsCID || 'unknown';
      if (!byCID.has(cid)) {
        byCID.set(cid, []);
      }
      byCID.get(cid)!.push(result);
    }
    
    // Find most common CID (consensus)
    let maxCount = 0;
    let consensusCID = '';
    for (const [cid, group] of byCID.entries()) {
      if (group.length > maxCount) {
        maxCount = group.length;
        consensusCID = cid;
      }
    }
    
    console.log(`[P2PBuilder] Consensus reached: ${maxCount}/${successful.length} workers produced ${consensusCID}`);
    
    return byCID.get(consensusCID)![0].artifact!;
  }

  private getDefaultBuildCommand(framework: string): string {
    const commands: Record<string, string> = {
      'nextjs': 'npm run build',
      'gatsby': 'npm run build',
      'react': 'npm run build',
      'vue': 'npm run build',
      'svelte': 'npm run build',
      'django': 'python manage.py collectstatic --noinput',
      'flask': 'pip install -r requirements.txt',
      'express': 'npm install',
      'astro': 'npm run build',
      'remix': 'npm run build',
      'sveltekit': 'npm run build'
    };
    return commands[framework] || 'npm run build';
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const p2pBuilder = new P2PBuilder();
