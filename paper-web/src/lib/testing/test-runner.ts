/**
 * Test Runner
 * Built-in test runner with multiple test types
 */

import { log } from '../logging/logger';

export interface TestSuite {
  name: string;
  tests: Test[];
}

export interface Test {
  name: string;
  fn: () => Promise<void> | void;
  timeout?: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface TestRunResult {
  suite: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export class TestRunner {
  private suites: TestSuite[] = [];

  /**
   * Add test suite
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<TestRunResult[]> {
    log.info('[TestRunner] Running all test suites...');

    const results: TestRunResult[] = [];

    for (const suite of this.suites) {
      const result = await this.runSuite(suite);
      results.push(result);
    }

    this.printSummary(results);

    return results;
  }

  /**
   * Run a single test suite
   */
  async runSuite(suite: TestSuite): Promise<TestRunResult> {
    log.info(`[TestRunner] Running suite: ${suite.name}`);

    const startTime = Date.now();
    const results: TestResult[] = [];

    for (const test of suite.tests) {
      const result = await this.runTest(test);
      results.push(result);
    }

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;

    return {
      suite: suite.name,
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        duration
      }
    };
  }

  /**
   * Run a single test
   */
  private async runTest(test: Test): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const timeout = test.timeout || 5000;
      
      await Promise.race([
        test.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), timeout)
        )
      ]);

      const duration = Date.now() - startTime;
      log.info(`[TestRunner] ✓ ${test.name} (${duration}ms)`);

      return {
        name: test.name,
        passed: true,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`[TestRunner] ✗ ${test.name}`, error as Error);

      return {
        name: test.name,
        passed: false,
        duration,
        error: (error as Error).message
      };
    }
  }

  /**
   * Print summary
   */
  private printSummary(results: TestRunResult[]): void {
    const totalTests = results.reduce((sum, r) => sum + r.summary.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.summary.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.summary.failed, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.summary.duration, 0);

    console.log('\n' + '='.repeat(50));
    console.log(`Test Summary:`);
    console.log(`  Total: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Duration: ${totalDuration}ms`);
    console.log('='.repeat(50) + '\n');

    if (totalFailed > 0) {
      console.log('Failed tests:');
      results.forEach(suite => {
        suite.results.forEach(test => {
          if (!test.passed) {
            console.log(`  ✗ ${suite.suite} > ${test.name}`);
            console.log(`    ${test.error}`);
          }
        });
      });
    }
  }

  /**
   * Clear all suites
   */
  clear(): void {
    this.suites = [];
  }
}

// Singleton instance
let testRunnerInstance: TestRunner | null = null;

/**
 * Get singleton test runner
 */
export function getTestRunner(): TestRunner {
  if (!testRunnerInstance) {
    testRunnerInstance = new TestRunner();
  }
  return testRunnerInstance;
}

/**
 * Helper functions for writing tests
 */
export const test = {
  suite(name: string, tests: Test[]): TestSuite {
    return { name, tests };
  },

  case(name: string, fn: () => Promise<void> | void, timeout?: number): Test {
    return { name, fn, timeout };
  },

  async expect<T>(value: T): Promise<{
    toBe: (expected: T) => void;
    toEqual: (expected: T) => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
    toThrow: () => void;
  }> {
    return {
      toBe(expected: T) {
        if (value !== expected) {
          throw new Error(`Expected ${value} to be ${expected}`);
        }
      },
      toEqual(expected: T) {
        if (JSON.stringify(value) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toBeTruthy() {
        if (!value) {
          throw new Error(`Expected ${value} to be truthy`);
        }
      },
      toBeFalsy() {
        if (value) {
          throw new Error(`Expected ${value} to be falsy`);
        }
      },
      toThrow() {
        try {
          (value as any)();
          throw new Error('Expected function to throw');
        } catch (error) {
          // Expected
        }
      }
    };
  }
};
