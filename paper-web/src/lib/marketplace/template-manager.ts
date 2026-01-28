/**
 * Template Manager
 * Manage deployment templates and one-click deploy
 */

import { getHeliaClient } from '../ipfs/helia-client';

export interface Template {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: 'blog' | 'ecommerce' | 'portfolio' | 'api' | 'fullstack' | 'other';
  author: string;
  version: string;
  cid: string; // IPFS CID of template files
  preview?: string;
  tags: string[];
  stars: number;
  downloads: number;
  lastUpdated: number;
  config?: {
    buildCommand?: string;
    outputDir?: string;
    envVars?: string[];
  };
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private heliaClient = getHeliaClient();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    const defaultTemplates: Template[] = [
      {
        id: 'nextjs-blog',
        name: 'Next.js Blog',
        description: 'Modern blog with MDX, dark mode, and SEO optimization',
        framework: 'Next.js',
        category: 'blog',
        author: 'Paper Network',
        version: '1.0.0',
        cid: 'QmExample1',
        tags: ['blog', 'mdx', 'seo', 'dark-mode'],
        stars: 245,
        downloads: 1893,
        lastUpdated: Date.now(),
        config: {
          buildCommand: 'npm run build',
          outputDir: '.next',
          envVars: ['NEXT_PUBLIC_SITE_URL']
        }
      },
      {
        id: 'react-portfolio',
        name: 'React Portfolio',
        description: 'Stunning portfolio with animations and contact form',
        framework: 'React',
        category: 'portfolio',
        author: 'Paper Network',
        version: '1.0.0',
        cid: 'QmExample2',
        tags: ['portfolio', 'animations', 'responsive'],
        stars: 189,
        downloads: 1234,
        lastUpdated: Date.now(),
        config: {
          buildCommand: 'npm run build',
          outputDir: 'dist'
        }
      },
      {
        id: 'django-api',
        name: 'Django REST API',
        description: 'Scalable REST API with authentication and docs',
        framework: 'Django',
        category: 'api',
        author: 'Paper Network',
        version: '1.0.0',
        cid: 'QmExample3',
        tags: ['api', 'rest', 'authentication', 'docs'],
        stars: 312,
        downloads: 2156,
        lastUpdated: Date.now(),
        config: {
          buildCommand: 'python manage.py collectstatic',
          envVars: ['DATABASE_URL', 'SECRET_KEY']
        }
      },
      {
        id: 'vue-ecommerce',
        name: 'Vue E-commerce',
        description: 'Full-featured online store with cart and checkout',
        framework: 'Vue',
        category: 'ecommerce',
        author: 'Paper Network',
        version: '1.0.0',
        cid: 'QmExample4',
        tags: ['ecommerce', 'cart', 'payments'],
        stars: 421,
        downloads: 3421,
        lastUpdated: Date.now(),
        config: {
          buildCommand: 'npm run build',
          outputDir: 'dist',
          envVars: ['VUE_APP_STRIPE_KEY']
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | null {
    return this.templates.get(id) || null;
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.framework.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter templates by category
   */
  getTemplatesByCategory(category: Template['category']): Template[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Filter templates by framework
   */
  getTemplatesByFramework(framework: string): Template[] {
    return this.getAllTemplates().filter(t => 
      t.framework.toLowerCase() === framework.toLowerCase()
    );
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 10): Template[] {
    return this.getAllTemplates()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get trending templates
   */
  getTrendingTemplates(limit: number = 10): Template[] {
    return this.getAllTemplates()
      .sort((a, b) => {
        const scoreA = b.stars * 2 + b.downloads;
        const scoreB = a.stars * 2 + a.downloads;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Deploy template
   */
  async deployTemplate(templateId: string, customConfig?: {
    name?: string;
    envVars?: Record<string, string>;
  }): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
    error?: string;
  }> {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      };
    }

    try {
      console.log('[TemplateManager] Deploying template:', template.name);

      // Download template files from IPFS
      // const files = await this.heliaClient.getFile(template.cid);

      // TODO: Implement actual deployment
      // For now, simulate deployment
      await new Promise(resolve => setTimeout(resolve, 2000));

      const deploymentId = `${templateId}-${Date.now()}`;
      const siteName = customConfig?.name || template.name.toLowerCase().replace(/\s+/g, '-');
      const url = `https://${siteName}.paper`;

      // Increment download count
      template.downloads++;

      console.log('[TemplateManager] Template deployed:', url);

      return {
        success: true,
        deploymentId,
        url
      };
    } catch (error) {
      console.error('[TemplateManager] Deployment failed:', error);
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Star a template
   */
  starTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    
    if (template) {
      template.stars++;
      return true;
    }
    
    return false;
  }

  /**
   * Add custom template
   */
  async addTemplate(template: Omit<Template, 'id' | 'downloads' | 'lastUpdated'>): Promise<string> {
    const id = `custom-${Date.now()}`;
    
    const fullTemplate: Template = {
      ...template,
      id,
      downloads: 0,
      lastUpdated: Date.now()
    };

    this.templates.set(id, fullTemplate);
    
    console.log('[TemplateManager] Added custom template:', id);
    
    return id;
  }

  /**
   * Get template statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    byFramework: Record<string, number>;
    totalDownloads: number;
  } {
    const templates = this.getAllTemplates();
    const byCategory: Record<string, number> = {};
    const byFramework: Record<string, number> = {};
    let totalDownloads = 0;

    templates.forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      byFramework[template.framework] = (byFramework[template.framework] || 0) + 1;
      totalDownloads += template.downloads;
    });

    return {
      total: templates.length,
      byCategory,
      byFramework,
      totalDownloads
    };
  }
}

// Singleton instance
let templateManagerInstance: TemplateManager | null = null;

/**
 * Get singleton template manager
 */
export function getTemplateManager(): TemplateManager {
  if (!templateManagerInstance) {
    templateManagerInstance = new TemplateManager();
  }
  return templateManagerInstance;
}
