/**
 * Plugin Loader
 * Load and manage plugin lifecycle
 */

import { getPluginSystem, Plugin } from './plugin-system';
import { log } from '../logging/logger';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
}

export class PluginLoader {
  private pluginSystem = getPluginSystem();
  private loaded: Set<string> = new Set();

  /**
   * Load plugin from URL
   */
  async loadFromURL(url: string): Promise<Plugin> {
    log.info(`[PluginLoader] Loading plugin from: ${url}`);

    try {
      // Fetch plugin code
      const response = await fetch(url);
      const code = await response.text();

      // Parse plugin
      const plugin = this.parsePlugin(code);

      // Register plugin
      await this.pluginSystem.registerPlugin(plugin);
      this.loaded.add(plugin.id);

      return plugin;
    } catch (error) {
      log.error('[PluginLoader] Failed to load plugin', error as Error);
      throw error;
    }
  }

  /**
   * Load plugin from manifest
   */
  async loadFromManifest(manifest: PluginManifest): Promise<Plugin> {
    log.info(`[PluginLoader] Loading plugin: ${manifest.name}`);

    // Check if already loaded
    if (this.loaded.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already loaded`);
    }

    // Create plugin stub
    const plugin: Plugin = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      hooks: {}
    };

    // Register plugin
    await this.pluginSystem.registerPlugin(plugin);
    this.loaded.add(plugin.id);

    return plugin;
  }

  /**
   * Parse plugin code
   */
  private parsePlugin(code: string): Plugin {
    // This is a simplified parser
    // In production, use a sandboxed environment
    
    try {
      // Create plugin factory
      const factory = new Function('return ' + code)();
      
      if (typeof factory !== 'function') {
        throw new Error('Plugin must export a factory function');
      }

      const plugin = factory();
      
      if (!plugin || !plugin.id || !plugin.name) {
        throw new Error('Invalid plugin structure');
      }

      return plugin;
    } catch (error) {
      throw new Error(`Failed to parse plugin: ${(error as Error).message}`);
    }
  }

  /**
   * Unload plugin
   */
  unloadPlugin(pluginId: string): void {
    this.pluginSystem.unregisterPlugin(pluginId);
    this.loaded.delete(pluginId);
    log.info(`[PluginLoader] Plugin unloaded: ${pluginId}`);
  }

  /**
   * Reload plugin
   */
  async reloadPlugin(pluginId: string, url: string): Promise<Plugin> {
    this.unloadPlugin(pluginId);
    return this.loadFromURL(url);
  }

  /**
   * Get loaded plugin IDs
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.loaded);
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loaded.has(pluginId);
  }
}

// Singleton instance
let pluginLoaderInstance: PluginLoader | null = null;

/**
 * Get singleton plugin loader
 */
export function getPluginLoader(): PluginLoader {
  if (!pluginLoaderInstance) {
    pluginLoaderInstance = new PluginLoader();
  }
  return pluginLoaderInstance;
}
