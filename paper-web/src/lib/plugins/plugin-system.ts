/**
 * Plugin System
 * Extensible architecture for community plugins
 */

import { log } from '../logging/logger';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: PluginHooks;
  config?: Record<string, any>;
}

export interface PluginHooks {
  onBeforeBuild?: (context: BuildContext) => Promise<void> | void;
  onAfterBuild?: (context: BuildContext) => Promise<void> | void;
  onBeforeDeploy?: (context: DeployContext) => Promise<void> | void;
  onAfterDeploy?: (context: DeployContext) => Promise<void> | void;
  onError?: (error: Error, context: any) => Promise<void> | void;
  onInit?: () => Promise<void> | void;
}

export interface BuildContext {
  files: Array<{ path: string; content: string }>;
  config: Record<string, any>;
  env: Record<string, string>;
}

export interface DeployContext {
  artifacts: Array<{ path: string; content: string }>;
  url: string;
  metadata: Record<string, any>;
}

export class PluginSystem {
  private plugins: Map<string, Plugin> = new Map();
  private enabled: Set<string> = new Set();

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    log.info(`[PluginSystem] Registering plugin: ${plugin.name}`);

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    // Register plugin
    this.plugins.set(plugin.id, plugin);

    // Call onInit hook
    if (plugin.hooks.onInit) {
      try {
        await plugin.hooks.onInit();
      } catch (error) {
        log.error(`[PluginSystem] Plugin init failed: ${plugin.name}`, error as Error);
      }
    }

    log.info(`[PluginSystem] Plugin registered: ${plugin.name}`);
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.id || !plugin.name || !plugin.version) {
      throw new Error('Plugin must have id, name, and version');
    }

    if (!plugin.hooks || typeof plugin.hooks !== 'object') {
      throw new Error('Plugin must have hooks object');
    }
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId: string): void {
    this.plugins.delete(pluginId);
    this.enabled.delete(pluginId);
    log.info(`[PluginSystem] Plugin unregistered: ${pluginId}`);
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginId: string): void {
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    this.enabled.add(pluginId);
    log.info(`[PluginSystem] Plugin enabled: ${pluginId}`);
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginId: string): void {
    this.enabled.delete(pluginId);
    log.info(`[PluginSystem] Plugin disabled: ${pluginId}`);
  }

  /**
   * Execute before build hooks
   */
  async executeBeforeBuild(context: BuildContext): Promise<void> {
    await this.executeHooks('onBeforeBuild', context);
  }

  /**
   * Execute after build hooks
   */
  async executeAfterBuild(context: BuildContext): Promise<void> {
    await this.executeHooks('onAfterBuild', context);
  }

  /**
   * Execute before deploy hooks
   */
  async executeBeforeDeploy(context: DeployContext): Promise<void> {
    await this.executeHooks('onBeforeDeploy', context);
  }

  /**
   * Execute after deploy hooks
   */
  async executeAfterDeploy(context: DeployContext): Promise<void> {
    await this.executeHooks('onAfterDeploy', context);
  }

  /**
   * Execute error hooks
   */
  async executeOnError(error: Error, context: Record<string, any>): Promise<void> {
      await this.executeHooks('onError', error as any, context);
  }

  /**
   * Execute hooks for all enabled plugins
   */
  private async executeHooks(hookName: keyof PluginHooks, ...args: any[]): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values()).filter(p =>
      this.enabled.has(p.id)
    );

    for (const plugin of enabledPlugins) {
      const hook = plugin.hooks[hookName];
      
      if (hook) {
        try {
          await (hook as any)(...args);
        } catch (error) {
          log.error(`[PluginSystem] Hook ${hookName} failed for ${plugin.name}`, error as Error);
        }
      }
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return this.getPlugins().filter(p => this.enabled.has(p.id));
  }

  /**
   * Get plugin by ID
   */
  getPlugin(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    return this.enabled.has(pluginId);
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
  } {
    return {
      total: this.plugins.size,
      enabled: this.enabled.size,
      disabled: this.plugins.size - this.enabled.size
    };
  }
}

// Singleton instance
let pluginSystemInstance: PluginSystem | null = null;

/**
 * Get singleton plugin system
 */
export function getPluginSystem(): PluginSystem {
  if (!pluginSystemInstance) {
    pluginSystemInstance = new PluginSystem();
  }
  return pluginSystemInstance;
}

/**
 * Create official plugins
 */
export const officialPlugins = {
  analytics: (): Plugin => ({
    id: 'analytics',
    name: 'Analytics Plugin',
    version: '1.0.0',
    description: 'Track deployments and performance',
    author: 'Paper Network',
    hooks: {
      async onAfterDeploy(context) {
        log.info('[Analytics] Deployment tracked:', { url: context.url });
      }
    }
  }),

  seo: (): Plugin => ({
    id: 'seo',
    name: 'SEO Optimizer',
    version: '1.0.0',
    description: 'Optimize meta tags and sitemap',
    author: 'Paper Network',
    hooks: {
      async onBeforeBuild(context) {
        log.info('[SEO] Optimizing build...');
        // TODO: Add meta tags, generate sitemap
      }
    }
  }),

  security: (): Plugin => ({
    id: 'security',
    name: 'Security Scanner',
    version: '1.0.0',
    description: 'Scan for vulnerabilities',
    author: 'Paper Network',
    hooks: {
      async onBeforeDeploy(context) {
        log.info('[Security] Scanning for vulnerabilities...');
        // TODO: Run security checks
      }
    }
  })
};
