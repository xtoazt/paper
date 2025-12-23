import sys
import os
import logging
import argparse
import asyncio

# Add lib to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.proxy import ProxyServer

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%H:%M:%S')
    
    parser = argparse.ArgumentParser(description='Paper Local Ingress Proxy')
    parser.add_argument('--port', type=int, default=8080, help='Port to listen on')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to')
    
    args = parser.parse_args()
    
    server = ProxyServer(host=args.host, port=args.port)
    
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        # Cleanup is handled by atexit in HostsManager
        print("\nShutting down Paper...")

if __name__ == '__main__':
    main()
