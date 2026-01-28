/**
 * Lazy Loading Utilities
 * Optimized component and resource loading for better performance
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Creates a lazy-loaded component with preload support
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } {
  const Component = lazy(factory);
  (Component as any).preload = factory;
  return Component as any;
}

/**
 * Preload images with priority
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (priority === 'high') {
      img.loading = 'eager';
    }
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(src => preloadImage(src)));
}

/**
 * Lazy load component when it enters viewport
 */
export function lazyWithIntersection<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: IntersectionObserverInit = {}
): LazyExoticComponent<T> {
  let loadComponent: (() => Promise<{ default: T }>) | null = null;
  let loadPromise: Promise<{ default: T }> | null = null;

  const load = () => {
    if (!loadPromise) {
      loadPromise = factory();
    }
    return loadPromise;
  };

  const Component = lazy(() => {
    if (loadComponent) {
      return loadComponent();
    }
    return new Promise<{ default: T }>((resolve) => {
      loadComponent = () => {
        resolve(load());
        return load();
      };
    });
  });

  // Set up intersection observer
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && loadComponent) {
          loadComponent();
          observer.disconnect();
        }
      });
    }, options);

    // Store observer for later use
    (Component as any).observe = (element: Element) => {
      if (element) {
        observer.observe(element);
      }
    };
  }

  return Component;
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof document === 'undefined') return;

  // Preconnect to important domains
  const domains = [
    'https://cdn.jsdelivr.net',
    'https://ipfs.io',
    'https://gateway.ipfs.io'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Lazy load CSS
 */
export function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load script
 */
export function loadScript(src: string, async: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    // Check if script already exists
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Check if resource is in cache
 */
export async function isResourceCached(url: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;

  try {
    const cache = await caches.open('paper-network-v1');
    const response = await cache.match(url);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Cache resource for offline use
 */
export async function cacheResource(url: string): Promise<void> {
  if (typeof caches === 'undefined') return;

  try {
    const cache = await caches.open('paper-network-v1');
    await cache.add(url);
  } catch (error) {
    console.warn('Failed to cache resource:', url, error);
  }
}

/**
 * Prefetch route
 */
export function prefetchRoute(route: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(): 'webp' | 'avif' | 'jpg' {
  if (typeof document === 'undefined') return 'jpg';

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  // Check AVIF support
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }

  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }

  return 'jpg';
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
