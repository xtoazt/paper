import sys
import os
import logging
import argparse
import asyncio
import socket

# Add lib to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.proxy import ProxyServer

def check_dns_resolution(domain="blog.paper"):
    """
    Checks if the OS is actually resolving the domain to 127.0.0.1
    """
    try:
        ip = socket.gethostbyname(domain)
        if ip == "127.0.0.1":
            return True, "OK"
        return False, f"Resolved to {ip}, expected 127.0.0.1"
    except socket.gaierror:
        return False, "NXDOMAIN (Not Found)"

def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%H:%M:%S')
    
    parser = argparse.ArgumentParser(description='Paper Local Ingress Proxy')
    parser.add_argument('--port', type=int, default=8080, help='Port to listen on')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to')
    
    args = parser.parse_args()
    
    server = ProxyServer(host=args.host, port=args.port)
    
    # 1. Start Server Logic
    try:
        # We manually run the install first to check status before async loop
        server.hosts_manager.install()
        
        # 2. Verify DNS
        is_resolved, msg = check_dns_resolution("blog.paper")
        
        print("\n" + "="*60)
        print(f"🚀 Paper Proxy listening on http://{args.host}:{args.port}")
        print("="*60)
        
        if is_resolved:
            print("\n✅ DNS Verification Passed: blog.paper -> 127.0.0.1")
            print("   You can access http://blog.paper in your browser.")
        else:
            print(f"\n❌ DNS Verification Failed: {msg}")
            
            if not server.hosts_manager.installed:
                print("\nReason: Hosts file not modified (Permission Denied).")
                print("👉 Solution: Run with sudo")
                print(f"   sudo {sys.executable} paper-proxy/src/main.py --port 80")
            else:
                print("\nReason: Hosts file modified, but browser/OS not picking it up yet.")
                print("👉 Potential Fixes:")
                print("   1. Disable 'Secure DNS' (DoH) in your browser settings.")
                print("      (Chrome: Settings > Privacy > Security > Use Secure DNS -> Off)")
                print("   2. Restart your browser.")
                print("   3. Wait 60 seconds for OS cache to clear.")
        
        print("\nPress Ctrl+C to stop.")
        
        asyncio.run(server.start())
        
    except KeyboardInterrupt:
        # Cleanup is handled by atexit in HostsManager
        print("\nShutting down Paper...")

if __name__ == '__main__':
    main()
