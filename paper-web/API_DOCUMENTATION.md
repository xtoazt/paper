# Paper Network API Documentation

## Overview

Complete API reference for Paper Network's revolutionary PaaS platform.

---

## Core Systems

### IPFS/Helia Client

**Location**: `src/lib/ipfs/helia-client.ts`

Provides browser-native IPFS functionality for distributed storage.

#### Methods

```typescript
class HeliaClient {
  // Start the IPFS node
  async start(): Promise<void>
  
  // Stop the IPFS node
  async stop(): Promise<void>
  
  // Add file to IPFS
  async addFile(content: Uint8Array): Promise<string>
  
  // Get file from IPFS
  async getFile(cid: string): Promise<Uint8Array>
  
  // Add JSON data
  async addJSON(data: any): Promise<string>
  
  // Get JSON data
  async getJSON(cid: string): Promise<any>
  
  // Pin content
  async pin(cid: string): Promise<void>
  
  // Unpin content
  async unpin(cid: string): Promise<void>
}
```

**Example**:

```typescript
import { getHeliaClient } from './lib/ipfs/helia-client';

const helia = getHeliaClient();
await helia.start();

const cid = await helia.addJSON({ hello: 'world' });
const data = await helia.getJSON(cid);
```

---

### libp2p Networking

**Location**: `src/lib/p2p/libp2p-real.ts`

Real P2P networking with WebRTC and gossipsub.

#### Methods

```typescript
class LibP2PNode {
  // Start P2P node
  async start(): Promise<void>
  
  // Stop P2P node
  async stop(): Promise<void>
  
  // Publish to topic
  async publish(topic: string, data: any): Promise<void>
  
  // Subscribe to topic
  async subscribe(topic: string, handler: (msg: any) => void): Promise<void>
  
  // Get connected peers
  getPeers(): PeerId[]
  
  // Get peer count
  getPeerCount(): number
}
```

**Example**:

```typescript
import { getLibP2PNode } from './lib/p2p/libp2p-real';

const node = getLibP2PNode();
await node.start();

// Subscribe to updates
await node.subscribe('deployments', (msg) => {
  console.log('New deployment:', msg);
});

// Publish event
await node.publish('deployments', { 
  url: 'example.paper',
  status: 'deployed' 
});
```

---

### AI Deployment Assistant

**Location**: `src/lib/ai/deployment-assistant.ts`

AI-powered deployment assistance using LLM7.io.

#### Methods

```typescript
class DeploymentAssistant {
  // Detect framework from files
  async detectFramework(files: Array<{path: string}>): Promise<string>
  
  // Optimize build configuration
  async optimizeBuild(framework: string, config: any): Promise<any>
  
  // Diagnose deployment errors
  async diagnoseError(error: string, context: any): Promise<string>
  
  // Generate configuration
  async generateConfig(framework: string): Promise<any>
}
```

**Example**:

```typescript
import { getDeploymentAssistant } from './lib/ai/deployment-assistant';

const assistant = getDeploymentAssistant();

// Auto-detect framework
const framework = await assistant.detectFramework(files);

// Get error help
const solution = await assistant.diagnoseError(
  'Build failed: Module not found',
  { framework: 'Next.js', files }
);
```

---

### Build Cache System

**Location**: `src/lib/build/cache-manager.ts`

Intelligent caching for instant rebuilds with P2P sharing.

#### Methods

```typescript
class CacheManager {
  // Get cached value
  async get(key: string): Promise<string | null>
  
  // Set cached value
  async set(key: string, value: string, dependencies?: string[]): Promise<void>
  
  // Invalidate cache
  invalidate(key: string): void
  
  // Export to IPFS
  async exportToIPFS(): Promise<string>
  
  // Import from IPFS
  async importFromIPFS(cid: string): Promise<void>
}
```

---

### Template Marketplace

**Location**: `src/lib/marketplace/template-manager.ts`

One-click deployment templates.

#### Methods

```typescript
class TemplateManager {
  // Get all templates
  getAllTemplates(): Template[]
  
  // Search templates
  searchTemplates(query: string): Template[]
  
  // Deploy template
  async deployTemplate(templateId: string, config?: any): Promise<{
    success: boolean;
    deploymentId?: string;
    url?: string;
  }>
  
  // Get popular templates
  getPopularTemplates(limit?: number): Template[]
}
```

**Example**:

```typescript
import { getTemplateManager } from './lib/marketplace/template-manager';

const manager = getTemplateManager();

// Browse templates
const templates = manager.getAllTemplates();

// Deploy a template
const result = await manager.deployTemplate('nextjs-blog', {
  name: 'my-blog'
});

console.log('Deployed to:', result.url);
```

---

### Plugin System

**Location**: `src/lib/plugins/plugin-system.ts`

Extensible plugin architecture.

#### Plugin Interface

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: {
    onBeforeBuild?: (context: BuildContext) => Promise<void>;
    onAfterBuild?: (context: BuildContext) => Promise<void>;
    onBeforeDeploy?: (context: DeployContext) => Promise<void>;
    onAfterDeploy?: (context: DeployContext) => Promise<void>;
    onError?: (error: Error, context: any) => Promise<void>;
    onInit?: () => Promise<void>;
  };
}
```

**Example Plugin**:

```typescript
import { getPluginSystem } from './lib/plugins/plugin-system';

const analyticsPlugin = {
  id: 'my-analytics',
  name: 'My Analytics',
  version: '1.0.0',
  description: 'Track deployments',
  author: 'Me',
  hooks: {
    async onAfterDeploy(context) {
      console.log('Deployed to:', context.url);
      // Send analytics event
    }
  }
};

const pluginSystem = getPluginSystem();
await pluginSystem.registerPlugin(analyticsPlugin);
pluginSystem.enablePlugin('my-analytics');
```

---

### Logging System

**Location**: `src/lib/logging/logger.ts`

Structured logging with search and export.

#### Methods

```typescript
class Logger {
  // Log methods
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, error?: Error, context?: Record<string, any>): void
  
  // Query logs
  getLogs(level?: LogLevel, since?: number): LogEntry[]
  searchLogs(query: string): LogEntry[]
  
  // Export logs
  exportJSON(since?: number): string
  exportCSV(since?: number): string
  
  // Subscribe to logs
  subscribe(listener: (entry: LogEntry) => void): () => void
}
```

**Example**:

```typescript
import { log } from './lib/logging/logger';

// Simple logging
log.info('Deployment started', { projectId: '123' });
log.error('Build failed', new Error('Missing deps'), { step: 'build' });

// Search logs
import { getLogger } from './lib/logging/logger';
const logger = getLogger();
const errors = logger.searchLogs('failed');

// Export logs
const csv = logger.exportCSV();
```

---

### Error Handling

**Location**: `src/lib/utils/retry.ts`

Production-grade error handling utilities.

#### Retry Functions

```typescript
// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>

// Retry with jitter
async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>

// Circuit breaker
class CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T>
}
```

**Example**:

```typescript
import { retryWithBackoff, CircuitBreaker } from './lib/utils/retry';

// Retry API call
const data = await retryWithBackoff(
  () => fetch('/api/data').then(r => r.json()),
  { maxAttempts: 3, initialDelay: 1000 }
);

// Use circuit breaker
const breaker = new CircuitBreaker({ failureThreshold: 5 });
const result = await breaker.execute(() => apiCall());
```

---

## UI Components

### Design System

**Location**: `src/components/design-system/`

Apple-inspired reusable components.

#### Button

```typescript
<Button variant="primary" | "secondary" | "ghost" onClick={handler}>
  Click me
</Button>
```

#### Card

```typescript
<Card variant="default" | "elevated" | "outlined" padding="sm" | "md" | "lg">
  Content
</Card>
```

#### Input

```typescript
<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={handler}
  leftIcon={<Icon />}
  error="Error message"
/>
```

---

### Command Palette

**Location**: `src/components/ui/CommandPalette.tsx`

⌘K command palette for quick actions.

```typescript
import { useCommandPalette } from './components/ui/CommandPalette';

const commands = [
  {
    id: 'deploy',
    label: 'Deploy Project',
    description: 'Deploy to production',
    shortcut: '⌘D',
    action: () => deploy()
  }
];

const { CommandPalette } = useCommandPalette(commands);

// Render
<CommandPalette />
```

---

### Toast Notifications

**Location**: `src/components/ui/Toast.tsx`

Elegant notification system.

```typescript
import { useToast } from './components/ui/Toast';

const { showToast } = useToast();

// Show notifications
showToast('success', 'Deployment successful!');
showToast('error', 'Build failed');
showToast('warning', 'Low disk space');
showToast('info', 'Update available');
```

---

## Testing

### Test Runner

**Location**: `src/lib/testing/test-runner.ts`

Built-in test runner.

```typescript
import { test, getTestRunner } from './lib/testing/test-runner';

// Create test suite
const mySuite = test.suite('My Tests', [
  test.case('should work', async () => {
    const result = myFunction();
    const expect = await test.expect(result);
    expect.toBe(42);
  }),
  
  test.case('should handle errors', async () => {
    const expect = await test.expect(() => { throw new Error(); });
    expect.toThrow();
  })
]);

// Run tests
const runner = getTestRunner();
runner.addSuite(mySuite);
const results = await runner.runAll();
```

---

## Configuration

### TypeScript

Strict mode enabled for maximum type safety:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

---

## Best Practices

### 1. Always use type annotations

```typescript
// Good
function deploy(projectId: string): Promise<void> {
  // ...
}

// Bad
function deploy(projectId) {
  // ...
}
```

### 2. Handle errors properly

```typescript
import { retryWithBackoff } from './lib/utils/retry';

try {
  await retryWithBackoff(() => apiCall());
} catch (error) {
  log.error('API call failed', error as Error);
  throw error;
}
```

### 3. Use logging

```typescript
import { log } from './lib/logging/logger';

log.info('Starting deployment', { projectId });
log.error('Deployment failed', error, { projectId });
```

### 4. Leverage caching

```typescript
import { getCacheManager } from './lib/build/cache-manager';

const cache = getCacheManager();
const cached = await cache.get(key);
if (cached) return cached;

const result = await expensiveOperation();
await cache.set(key, result);
```

---

## Performance Tips

1. **Use lazy loading** for heavy components
2. **Enable build cache** for faster rebuilds
3. **Use parallel builds** for multiple projects
4. **Leverage P2P cache sharing** for team builds
5. **Monitor with metrics collector** for insights

---

## Support

For help, use the AI assistant:

```typescript
import { getDeploymentAssistant } from './lib/ai/deployment-assistant';

const assistant = getDeploymentAssistant();
const help = await assistant.diagnoseError(errorMessage, context);
```

---

**End of Documentation**
