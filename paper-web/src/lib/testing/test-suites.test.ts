/**
 * Example Test Suites
 * Demonstrates testing capabilities
 */

import { test, getTestRunner } from './test-runner';
import { getCacheManager } from '../build/cache-manager';
import { getTemplateManager } from '../marketplace/template-manager';
import { getLogger } from '../logging/logger';

/**
 * Cache Manager Tests
 */
export const cacheManagerTests = test.suite('Cache Manager', [
  test.case('should cache and retrieve values', async () => {
    const cache = getCacheManager();
    await cache.set('test-key', 'test-value');
    const value = await cache.get('test-key');
    const expect = await test.expect(value);
    expect.toBe('test-value');
  }),

  test.case('should return null for missing keys', async () => {
    const cache = getCacheManager();
    const value = await cache.get('non-existent-key');
    const expect = await test.expect(value);
    expect.toBe(null);
  }),

  test.case('should handle cache invalidation', async () => {
    const cache = getCacheManager();
    await cache.set('test-key-2', 'test-value-2');
    cache.invalidate('test-key-2');
    const value = await cache.get('test-key-2');
    const expect = await test.expect(value);
    expect.toBe(null);
  })
]);

/**
 * Template Manager Tests
 */
export const templateManagerTests = test.suite('Template Manager', [
  test.case('should return all templates', async () => {
    const manager = getTemplateManager();
    const templates = manager.getAllTemplates();
    const expect = await test.expect(templates.length > 0);
    expect.toBeTruthy();
  }),

  test.case('should search templates', async () => {
    const manager = getTemplateManager();
    const results = manager.searchTemplates('blog');
    const expect = await test.expect(results.length > 0);
    expect.toBeTruthy();
  }),

  test.case('should filter by category', async () => {
    const manager = getTemplateManager();
    const templates = manager.getTemplatesByCategory('blog');
    const expect = await test.expect(Array.isArray(templates));
    expect.toBeTruthy();
  })
]);

/**
 * Logger Tests
 */
export const loggerTests = test.suite('Logger', [
  test.case('should log messages', async () => {
    const logger = getLogger();
    logger.info('Test message');
    const logs = logger.getAllLogs();
    const expect = await test.expect(logs.length > 0);
    expect.toBeTruthy();
  }),

  test.case('should search logs', async () => {
    const logger = getLogger();
    logger.info('Searchable message');
    const results = logger.searchLogs('Searchable');
    const expect = await test.expect(results.length > 0);
    expect.toBeTruthy();
  }),

  test.case('should get log statistics', async () => {
    const logger = getLogger();
    const stats = logger.getStats();
    const expect = await test.expect(stats.total >= 0);
    expect.toBeTruthy();
  })
]);

/**
 * Run all tests
 */
export async function runAllTests() {
  const runner = getTestRunner();
  
  runner.addSuite(cacheManagerTests);
  runner.addSuite(templateManagerTests);
  runner.addSuite(loggerTests);
  
  return runner.runAll();
}
