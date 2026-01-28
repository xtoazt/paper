/**
 * Framework Adapters - Main Export
 */

export * from './types';
export * from './nextjs-adapter';
export * from './python-adapter';
export * from './node-adapter';

export { nextjsAdapter } from './nextjs-adapter';
export { djangoAdapter, flaskAdapter } from './python-adapter';
export { expressAdapter, fastifyAdapter } from './node-adapter';

import type { Framework } from '../build/types';
import type { FrameworkAdapter } from './types';
import { nextjsAdapter } from './nextjs-adapter';
import { djangoAdapter, flaskAdapter } from './python-adapter';
import { expressAdapter, fastifyAdapter } from './node-adapter';

/**
 * Get the appropriate adapter for a framework
 */
export function getAdapter(framework: Framework): FrameworkAdapter | null {
  const adapters: Record<string, FrameworkAdapter> = {
    'nextjs': nextjsAdapter,
    'django': djangoAdapter,
    'flask': flaskAdapter,
    'express': expressAdapter,
    'fastify': fastifyAdapter
  };
  
  return adapters[framework] || null;
}
