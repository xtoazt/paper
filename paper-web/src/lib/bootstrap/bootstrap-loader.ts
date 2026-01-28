/**
 * Bootstrap Loader
 * Loads and registers Service Worker from bootstrap sources
 */

import type { BootstrapSource } from './bootstrap-sources';

export interface LoadResult {
  success: boolean;
  source: BootstrapSource;
  swUrl?: string;
  registration?: ServiceWorkerRegistration;
  error?: string;
  latency: number;
}

export class BootstrapLoader {
  private serviceWorkerPath = '/sw.js';
  private scope = '/';

  /**
   * Load Service Worker from source
   */
  async loadFromSource(source: BootstrapSource): Promise<LoadResult> {
    const startTime = Date.now();

    console.log('Loading Service Worker from source:', source.id);

    try {
      // Check if Service Worker is already registered
      const existing = await this.getExistingRegistration();
      if (existing) {
        console.log('Service Worker already registered');
        return {
          success: true,
          source,
          registration: existing,
          latency: Date.now() - startTime
        };
      }

      // Load based on source type
      let swUrl: string;

      switch (source.type) {
        case 'pdf':
          swUrl = await this.loadFromPDF(source);
          break;
        case 'domain':
          swUrl = `${source.url}${this.serviceWorkerPath}`;
          break;
        case 'ipfs':
          swUrl = await this.loadFromIPFS(source);
          break;
        case 'cdn':
          swUrl = `${source.url}${this.serviceWorkerPath}`;
          break;
        case 'p2p':
          swUrl = await this.loadFromP2P(source);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Validate Service Worker URL
      if (!swUrl) {
        throw new Error('Failed to get Service Worker URL');
      }

      // Fetch and validate Service Worker code
      const swCode = await this.fetchServiceWorker(swUrl, source.timeout);
      if (!swCode) {
        throw new Error('Failed to fetch Service Worker code');
      }

      // Validate integrity (basic check)
      if (!this.validateServiceWorker(swCode)) {
        throw new Error('Service Worker validation failed');
      }

      // Register Service Worker
      const registration = await this.registerServiceWorker(swUrl);

      console.log('Service Worker loaded successfully from:', source.id);

      return {
        success: true,
        source,
        swUrl,
        registration,
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to load from source:', source.id, error);
      return {
        success: false,
        source,
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Load from PDF (JavaScript-enabled PDF)
   */
  private async loadFromPDF(source: BootstrapSource): Promise<string> {
    console.log('Loading from PDF:', source.url);

    // Create hidden iframe to load PDF
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = source.url;
    document.body.appendChild(iframe);

    // Wait for PDF to load and execute JavaScript
    // The PDF's JavaScript should register the Service Worker
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if Service Worker was registered
    const registration = await this.getExistingRegistration();
    if (registration) {
      document.body.removeChild(iframe);
      return registration.active?.scriptURL || '';
    }

    // Clean up
    document.body.removeChild(iframe);

    // If PDF didn't register SW, fall back to fetching directly
    // (PDF JavaScript may not work in all browsers)
    return source.url.replace('.pdf', '/sw.js');
  }

  /**
   * Load from IPFS gateway
   */
  private async loadFromIPFS(source: BootstrapSource): Promise<string> {
    console.log('Loading from IPFS:', source.url);
    
    // IPFS gateways serve content directly
    return `${source.url}/sw.js`;
  }

  /**
   * Load from P2P network
   */
  private async loadFromP2P(source: BootstrapSource): Promise<string> {
    console.log('Loading from P2P:', source.url);
    
    // P2P loading would query DHT for Service Worker
    // For now, return a placeholder
    throw new Error('P2P loading not yet implemented');
  }

  /**
   * Fetch Service Worker code
   */
  private async fetchServiceWorker(url: string, timeout: number): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const code = await response.text();
      return code;
    } catch (error) {
      console.error('Failed to fetch Service Worker:', error);
      return null;
    }
  }

  /**
   * Validate Service Worker code
   */
  private validateServiceWorker(code: string): boolean {
    // Basic validation checks
    if (!code || code.length < 100) {
      return false;
    }

    // Check for essential Service Worker features
    const requiredFeatures = [
      'addEventListener',
      'fetch',
      'install'
    ];

    return requiredFeatures.every(feature => code.includes(feature));
  }

  /**
   * Register Service Worker
   */
  private async registerServiceWorker(url: string): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register(url, {
        scope: this.scope,
        type: 'classic'
      });

      // Wait for Service Worker to activate
      await this.waitForActivation(registration);

      console.log('Service Worker registered:', url);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Wait for Service Worker activation
   */
  private async waitForActivation(registration: ServiceWorkerRegistration): Promise<void> {
    if (registration.active) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service Worker activation timeout'));
      }, 30000);

      if (registration.installing) {
        registration.installing.addEventListener('statechange', function handler(e: Event) {
          const sw = e.target as ServiceWorker;
          if (sw.state === 'activated') {
            clearTimeout(timeout);
            resolve();
          } else if (sw.state === 'redundant') {
            clearTimeout(timeout);
            reject(new Error('Service Worker became redundant'));
          }
        });
      } else if (registration.waiting) {
        registration.waiting.addEventListener('statechange', function handler(e: Event) {
          const sw = e.target as ServiceWorker;
          if (sw.state === 'activated') {
            clearTimeout(timeout);
            resolve();
          }
        });
      }
    });
  }

  /**
   * Get existing Service Worker registration
   */
  private async getExistingRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration(this.scope);
      return registration || null;
    } catch (error) {
      console.error('Failed to get Service Worker registration:', error);
      return null;
    }
  }

  /**
   * Unregister Service Worker
   */
  async unregister(): Promise<boolean> {
    const registration = await this.getExistingRegistration();
    if (registration) {
      return await registration.unregister();
    }
    return false;
  }

  /**
   * Update Service Worker
   */
  async update(): Promise<ServiceWorkerRegistration | null> {
    const registration = await this.getExistingRegistration();
    if (registration) {
      await registration.update();
      return registration;
    }
    return null;
  }

  /**
   * Check if Service Worker is registered and active
   */
  async isActive(): Promise<boolean> {
    const registration = await this.getExistingRegistration();
    return registration?.active !== undefined;
  }
}

// Singleton instance
let bootstrapLoaderInstance: BootstrapLoader | null = null;

/**
 * Get bootstrap loader instance
 */
export function getBootstrapLoader(): BootstrapLoader {
  if (!bootstrapLoaderInstance) {
    bootstrapLoaderInstance = new BootstrapLoader();
  }
  return bootstrapLoaderInstance;
}
