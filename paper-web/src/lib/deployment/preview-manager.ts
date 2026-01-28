/**
 * Preview Deployment Manager
 * Automatic PR previews and preview URLs
 */

import { getHeliaClient } from '../ipfs/helia-client';
import { log } from '../logging/logger';

export interface PreviewDeployment {
  id: string;
  url: string;
  branch: string;
  commit: string;
  prNumber?: number;
  status: 'building' | 'ready' | 'error';
  createdAt: number;
  expiresAt?: number;
  cid?: string;
}

export class PreviewManager {
  private previews: Map<string, PreviewDeployment> = new Map();
  private heliaClient = getHeliaClient();

  /**
   * Create a preview deployment
   */
  async createPreview(
    projectName: string,
    branch: string,
    commit: string,
    prNumber?: number
  ): Promise<PreviewDeployment> {
    const id = `preview-${projectName}-${branch}-${Date.now()}`;
    const url = this.generatePreviewURL(projectName, branch, prNumber);

    log.info(`[PreviewManager] Creating preview: ${url}`);

    const preview: PreviewDeployment = {
      id,
      url,
      branch,
      commit,
      prNumber,
      status: 'building',
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.previews.set(id, preview);

    return preview;
  }

  /**
   * Generate preview URL
   */
  private generatePreviewURL(projectName: string, branch: string, prNumber?: number): string {
    const slug = prNumber 
      ? `pr-${prNumber}`
      : branch.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `https://${slug}.${projectName}.paper`;
  }

  /**
   * Deploy preview
   */
  async deployPreview(previewId: string, files: Array<{ path: string; content: string }>): Promise<void> {
    const preview = this.previews.get(previewId);
    
    if (!preview) {
      throw new Error('Preview not found');
    }

    try {
      log.info(`[PreviewManager] Deploying preview: ${preview.url}`);

      // Upload to IPFS
      const cid = await this.uploadFiles(files);
      
      preview.cid = cid;
      preview.status = 'ready';

      log.info(`[PreviewManager] Preview deployed: ${preview.url} -> ${cid}`);
    } catch (error) {
      preview.status = 'error';
      log.error(`[PreviewManager] Preview deployment failed`, error as Error);
      throw error;
    }
  }

  /**
   * Upload files to IPFS
   */
  private async uploadFiles(files: Array<{ path: string; content: string }>): Promise<string> {
    // For now, simulate upload
    // TODO: Implement actual IPFS directory upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Qm${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get preview by ID
   */
  getPreview(id: string): PreviewDeployment | null {
    return this.previews.get(id) || null;
  }

  /**
   * Get previews by project
   */
  getPreviewsByProject(projectName: string): PreviewDeployment[] {
    return Array.from(this.previews.values()).filter(p =>
      p.url.includes(projectName)
    );
  }

  /**
   * Get previews by PR
   */
  getPreviewsByPR(prNumber: number): PreviewDeployment[] {
    return Array.from(this.previews.values()).filter(p =>
      p.prNumber === prNumber
    );
  }

  /**
   * Delete preview
   */
  async deletePreview(id: string): Promise<void> {
    const preview = this.previews.get(id);
    
    if (preview) {
      log.info(`[PreviewManager] Deleting preview: ${preview.url}`);
      
      // TODO: Unpin from IPFS if needed
      
      this.previews.delete(id);
    }
  }

  /**
   * Clean up expired previews
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, preview] of this.previews.entries()) {
      if (preview.expiresAt && preview.expiresAt < now) {
        await this.deletePreview(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log.info(`[PreviewManager] Cleaned up ${cleaned} expired previews`);
    }

    return cleaned;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    building: number;
    ready: number;
    error: number;
  } {
    const previews = Array.from(this.previews.values());

    return {
      total: previews.length,
      building: previews.filter(p => p.status === 'building').length,
      ready: previews.filter(p => p.status === 'ready').length,
      error: previews.filter(p => p.status === 'error').length
    };
  }
}

// Singleton instance
let previewManagerInstance: PreviewManager | null = null;

/**
 * Get singleton preview manager
 */
export function getPreviewManager(): PreviewManager {
  if (!previewManagerInstance) {
    previewManagerInstance = new PreviewManager();
  }
  return previewManagerInstance;
}
