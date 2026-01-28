/**
 * Browser Edge Runtime
 * Runs serverless functions in browser Service Workers
 * Similar to Cloudflare Workers but fully decentralized
 */

import type { EdgeFunction, EdgeFunctionRequest, EdgeFunctionResponse } from './types';

export class EdgeRuntime {
  private workers: Map<string, Worker> = new Map();
  private functions: Map<string, EdgeFunction> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[EdgeRuntime] Initializing browser edge runtime...');
    this.initialized = true;
  }

  async deployFunction(func: EdgeFunction): Promise<void> {
    await this.initialize();
    
    console.log(`[EdgeRuntime] Deploying edge function: ${func.name}`);
    this.functions.set(func.id, func);
    
    // Create worker for this function
    const worker = this.createWorker(func);
    this.workers.set(func.id, worker);
    
    console.log(`[EdgeRuntime] ✓ Function ${func.name} deployed`);
  }

  async executeFunction(
    functionId: string, 
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    const func = this.functions.get(functionId);
    if (!func) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Function not found' })
      };
    }

    console.log(`[EdgeRuntime] Executing function ${func.name} for ${request.method} ${request.url}`);
    
    const startTime = Date.now();
    
    try {
      // Execute based on runtime
      let response: EdgeFunctionResponse;
      
      switch (func.runtime) {
        case 'javascript':
          response = await this.executeJavaScript(func, request);
          break;
        case 'python':
          response = await this.executePython(func, request);
          break;
        case 'wasm':
          response = await this.executeWasm(func, request);
          break;
        default:
          throw new Error(`Unsupported runtime: ${func.runtime}`);
      }
      
      const executionTime = Date.now() - startTime;
      console.log(`[EdgeRuntime] ✓ Function executed in ${executionTime}ms`);
      
      return response;
    } catch (error: any) {
      console.error(`[EdgeRuntime] Function execution failed:`, error);
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Function execution failed',
          message: error.message 
        })
      };
    }
  }

  private async executeJavaScript(
    func: EdgeFunction,
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    // Create isolated execution context
    const worker = this.workers.get(func.id);
    
    if (!worker) {
      // Execute directly if no worker
      return await this.executeDirectly(func, request);
    }
    
    // Execute in worker with timeout
    return await Promise.race([
      this.runInWorker(worker, func.code, request),
      this.timeout(func.timeout)
    ]);
  }

  private async executeDirectly(
    func: EdgeFunction,
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    // Execute function directly (careful with sandboxing!)
    try {
      // Create a Request object
      const req = new Request(request.url, {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body
      });
      
      // Execute the function code
      const handler = new Function('request', `
        return (async () => {
          ${func.code}
          // Call the default export or handler
          if (typeof handler !== 'undefined') {
            return await handler(request);
          }
          return new Response('No handler found', { status: 500 });
        })();
      `);
      
      const response = await handler(req);
      
      // Convert Response to EdgeFunctionResponse
      const body = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });
      
      return {
        status: response.status,
        headers,
        body
      };
    } catch (error: any) {
      throw new Error(`Direct execution failed: ${error.message}`);
    }
  }

  private async executePython(
    func: EdgeFunction,
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    // Execute Python via Pyodide
    console.log('[EdgeRuntime] Executing Python function via Pyodide...');
    
    try {
      // Load Pyodide if not already loaded
      // @ts-ignore
      if (!window.pyodide) {
        console.log('[EdgeRuntime] Loading Pyodide...');
        // @ts-ignore
        window.pyodide = await loadPyodide();
      }
      
      // @ts-ignore
      const pyodide = window.pyodide;
      
      // Execute Python code
      await pyodide.runPythonAsync(func.code);
      
      // Call the handler
      const result = await pyodide.runPythonAsync(`
        import json
        request_data = {
          'url': '${request.url}',
          'method': '${request.method}',
          'headers': ${JSON.stringify(request.headers)},
          'body': ${JSON.stringify(request.body || '')}
        }
        response = handler(request_data)
        json.dumps(response)
      `);
      
      const response = JSON.parse(result);
      return {
        status: response.status || 200,
        headers: response.headers || { 'Content-Type': 'application/json' },
        body: response.body || ''
      };
    } catch (error: any) {
      throw new Error(`Python execution failed: ${error.message}`);
    }
  }

  private async executeWasm(
    func: EdgeFunction,
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    // Execute WebAssembly function
    console.log('[EdgeRuntime] Executing WASM function...');
    
    // For now, return not implemented
    return {
      status: 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'WASM runtime not yet implemented'
    };
  }

  private createWorker(func: EdgeFunction): Worker {
    // Create a Web Worker for the function
    const workerCode = `
      self.onmessage = async (e) => {
        const { code, request } = e.data;
        try {
          ${func.code}
          
          const req = new Request(request.url, {
            method: request.method,
            headers: new Headers(request.headers),
            body: request.body
          });
          
          const response = await handler(req);
          const body = await response.text();
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          
          self.postMessage({
            success: true,
            response: {
              status: response.status,
              headers,
              body
            }
          });
        } catch (error) {
          self.postMessage({
            success: false,
            error: error.message
          });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    return worker;
  }

  private runInWorker(
    worker: Worker,
    code: string,
    request: EdgeFunctionRequest
  ): Promise<EdgeFunctionResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Function execution timeout'));
      }, 30000);
      
      worker.onmessage = (e) => {
        clearTimeout(timeout);
        if (e.data.success) {
          resolve(e.data.response);
        } else {
          reject(new Error(e.data.error));
        }
      };
      
      worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      
      worker.postMessage({ code, request });
    });
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), ms);
    });
  }

  async removeFunction(functionId: string): Promise<void> {
    const worker = this.workers.get(functionId);
    if (worker) {
      worker.terminate();
      this.workers.delete(functionId);
    }
    this.functions.delete(functionId);
    console.log(`[EdgeRuntime] Function ${functionId} removed`);
  }

  async cleanup(): Promise<void> {
    for (const worker of this.workers.values()) {
      worker.terminate();
    }
    this.workers.clear();
    this.functions.clear();
    this.initialized = false;
  }
}

// Example edge function for testing
export const exampleEdgeFunction: EdgeFunction = {
  id: 'example-hello',
  name: 'hello-world',
  runtime: 'javascript',
  timeout: 30000,
  memory: 128,
  code: `
    async function handler(request) {
      const url = new URL(request.url);
      const name = url.searchParams.get('name') || 'World';
      
      return new Response(JSON.stringify({
        message: \`Hello, \${name}!\`,
        timestamp: new Date().toISOString(),
        region: 'p2p-distributed',
        cost: '$0'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Powered-By': 'Paper Edge Runtime'
        }
      });
    }
  `
};

// Export singleton instance
export const edgeRuntime = new EdgeRuntime();
