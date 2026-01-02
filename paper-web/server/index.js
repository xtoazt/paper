#!/usr/bin/env node

import { ProxyServer } from './lib/proxy-server.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    host: '127.0.0.1',
    port: 8080
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host' && args[i + 1]) {
        options.host = args[i + 1];
        i++;
    } else if (args[i] === '--port' && args[i + 1]) {
        options.port = parseInt(args[i + 1], 10);
        i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
        console.log(`
Paper Proxy Server - Unlimited Local TLDs with Unbreakable Firewall

Usage: node server/index.js [options]

Options:
  --host <address>    Host to bind to (default: 127.0.0.1)
  --port <port>       Port to listen on (default: 8080)
  --help, -h          Show this help message

Examples:
  node server/index.js --port 80
  node server/index.js --host 0.0.0.0 --port 8080

Note: On Unix systems, you may need to run with sudo to modify /etc/hosts
      On Windows, you may need to run as Administrator
        `);
        process.exit(0);
    }
}

// Create and start server
const server = new ProxyServer(options);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Paper] Shutting down...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[Paper] Shutting down...');
    await server.stop();
    process.exit(0);
});

// Start server
server.start().catch((error) => {
    console.error(`[Paper] Failed to start: ${error.message}`);
    if (error.message.includes('Permission denied') || error.message.includes('EACCES')) {
        console.error('\n💡 Tip: You may need to run with sudo (Unix) or as Administrator (Windows)');
    }
    process.exit(1);
});



