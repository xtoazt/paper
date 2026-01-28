"""
Pyodide DNS Server
Python-based DNS resolver for .paper domains using PKARR
"""

import asyncio
import json
from typing import Dict, Optional, List

class DNSServer:
    """DNS server for .paper domain resolution"""
    
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = 300  # 5 minutes default TTL
        self.pkarr_resolver = PKARRResolver()
    
    async def resolve(self, domain: str) -> Optional[Dict]:
        """
        Resolve .paper domain to IPFS CID or peer address
        
        Args:
            domain: Domain name to resolve (e.g., 'example.paper')
            
        Returns:
            Dictionary with resolution data or None if not found
        """
        # Check cache first
        if domain in self.cache:
            cached = self.cache[domain]
            if not self._is_expired(cached):
                print(f"DNS cache hit: {domain}")
                return cached['data']
        
        # Query PKARR/DHT for domain
        print(f"Resolving domain: {domain}")
        result = await self.pkarr_resolver.resolve(domain)
        
        if result:
            # Cache the result
            self.cache[domain] = {
                'data': result,
                'timestamp': self._current_timestamp()
            }
            print(f"Domain resolved: {domain} -> {result.get('cid', 'N/A')}")
            return result
        
        print(f"Domain not found: {domain}")
        return None
    
    async def register(self, domain: str, cid: str, metadata: Dict = None) -> bool:
        """
        Register .paper domain with IPFS CID
        
        Args:
            domain: Domain name to register
            cid: IPFS CID pointing to content
            metadata: Additional metadata
            
        Returns:
            True if registration successful
        """
        print(f"Registering domain: {domain} -> {cid}")
        
        record = {
            'domain': domain,
            'cid': cid,
            'type': 'A',  # DNS record type
            'ttl': self.cache_ttl,
            'metadata': metadata or {}
        }
        
        # Register via PKARR
        success = await self.pkarr_resolver.register(domain, record)
        
        if success:
            # Update cache
            self.cache[domain] = {
                'data': record,
                'timestamp': self._current_timestamp()
            }
            print(f"Domain registered successfully: {domain}")
            return True
        
        print(f"Domain registration failed: {domain}")
        return False
    
    def clear_cache(self):
        """Clear DNS cache"""
        self.cache.clear()
        print("DNS cache cleared")
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            'entries': len(self.cache),
            'domains': list(self.cache.keys())
        }
    
    def _is_expired(self, cached_entry: Dict) -> bool:
        """Check if cache entry is expired"""
        age = self._current_timestamp() - cached_entry['timestamp']
        ttl = cached_entry['data'].get('ttl', self.cache_ttl)
        return age > ttl
    
    def _current_timestamp(self) -> int:
        """Get current timestamp in seconds"""
        import time
        return int(time.time())


class PKARRResolver:
    """PKARR (Public Key Addressable Resource Records) resolver"""
    
    def __init__(self):
        self.records: Dict[str, Dict] = {}
    
    async def resolve(self, domain: str) -> Optional[Dict]:
        """
        Resolve domain via PKARR
        
        In a real implementation, this would:
        1. Extract public key from domain
        2. Query DHT for PKARR records
        3. Verify cryptographic signature
        4. Return validated records
        """
        # Simulate PKARR resolution
        # In production, this would query the DHT
        if domain in self.records:
            return self.records[domain]
        
        # Simulate DHT query
        return None
    
    async def register(self, domain: str, record: Dict) -> bool:
        """
        Register domain via PKARR
        
        In a real implementation, this would:
        1. Generate or use existing keypair
        2. Sign record with private key
        3. Publish to DHT
        4. Return success status
        """
        # Simulate PKARR registration
        self.records[domain] = record
        return True
    
    def generate_onion_domain(self, public_key: bytes) -> str:
        """
        Generate onion-like domain from public key
        
        Args:
            public_key: Ed25519 public key
            
        Returns:
            Domain name like 'abc123def456.paper'
        """
        import hashlib
        import base64
        
        # Hash the public key
        key_hash = hashlib.sha256(public_key).digest()
        
        # Take first 16 bytes and encode as base32 (lowercase)
        domain_part = base64.b32encode(key_hash[:16]).decode('ascii').lower().rstrip('=')
        
        return f"{domain_part}.paper"


# Export main functions for JavaScript bridge
def create_dns_server():
    """Create and return DNS server instance"""
    return DNSServer()


async def resolve_domain(server, domain):
    """Resolve domain (wrapper for JavaScript)"""
    return await server.resolve(domain)


async def register_domain(server, domain, cid, metadata=None):
    """Register domain (wrapper for JavaScript)"""
    return await server.register(domain, cid, metadata)


def get_cache_stats(server):
    """Get cache stats (wrapper for JavaScript)"""
    return server.get_cache_stats()


def clear_cache(server):
    """Clear cache (wrapper for JavaScript)"""
    server.clear_cache()
