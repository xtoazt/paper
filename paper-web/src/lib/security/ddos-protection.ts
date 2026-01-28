/**
 * DDoS Protection
 * Distributed DDoS mitigation across all nodes
 */

export interface RateLimit {
  ip: string;
  requests: number;
  window: number;
  blocked: boolean;
  blockedUntil?: number;
}

export interface IPReputation {
  ip: string;
  score: number; // 0-1, lower is worse
  attackHistory: number;
  lastUpdate: number;
}

export class DDoSProtection {
  private rateLimits: Map<string, RateLimit> = new Map();
  private ipReputation: Map<string, IPReputation> = new Map();
  private blocklist: Set<string> = new Set();
  
  constructor() {
    console.log('[DDoSProtection] Initialized');
    this.startCleanup();
  }

  /**
   * Check if request should be allowed
   */
  async checkRequest(request: Request): Promise<boolean> {
    const ip = this.getClientIP(request);
    
    // Check blocklist
    if (this.blocklist.has(ip)) {
      console.log('[DDoSProtection] Blocked IP:', ip);
      return false;
    }
    
    // Check rate limit
    if (this.isRateLimited(ip)) {
      console.log('[DDoSProtection] Rate limited:', ip);
      return false;
    }
    
    // Check IP reputation
    const reputation = this.getReputation(ip);
    if (reputation.score < 0.3) {
      console.log('[DDoSProtection] Low reputation IP:', ip, reputation.score);
      return false;
    }
    
    // Update rate limit
    this.updateRateLimit(ip);
    
    return true;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: Request): string {
    // Try common headers
    const headers = request.headers;
    return (
      headers.get('cf-connecting-ip') ||
      headers.get('x-real-ip') ||
      headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown'
    );
  }

  /**
   * Check if IP is rate limited
   */
  private isRateLimited(ip: string): boolean {
    const limit = this.rateLimits.get(ip);
    
    if (!limit) return false;
    
    const now = Date.now();
    
    // Check if still blocked
    if (limit.blocked && limit.blockedUntil && now < limit.blockedUntil) {
      return true;
    }
    
    // Reset if window expired
    if (now - limit.window > 60000) {
      limit.requests = 0;
      limit.window = now;
      limit.blocked = false;
    }
    
    // Check if exceeded limit
    if (limit.requests > 100) { // 100 requests per minute
      limit.blocked = true;
      limit.blockedUntil = now + 300000; // Block for 5 minutes
      return true;
    }
    
    return false;
  }

  /**
   * Update rate limit for IP
   */
  private updateRateLimit(ip: string): void {
    const limit = this.rateLimits.get(ip) || {
      ip,
      requests: 0,
      window: Date.now(),
      blocked: false
    };
    
    limit.requests++;
    this.rateLimits.set(ip, limit);
  }

  /**
   * Get IP reputation
   */
  private getReputation(ip: string): IPReputation {
    return this.ipReputation.get(ip) || {
      ip,
      score: 1.0,
      attackHistory: 0,
      lastUpdate: Date.now()
    };
  }

  /**
   * Block IP
   */
  blockIP(ip: string, reason: string): void {
    this.blocklist.add(ip);
    
    // Update reputation
    const reputation = this.getReputation(ip);
    reputation.score = Math.max(0, reputation.score - 0.5);
    reputation.attackHistory++;
    reputation.lastUpdate = Date.now();
    this.ipReputation.set(ip, reputation);
    
    console.log('[DDoSProtection] IP blocked:', ip, reason);
  }

  /**
   * Unblock IP
   */
  unblockIP(ip: string): void {
    this.blocklist.delete(ip);
    console.log('[DDoSProtection] IP unblocked:', ip);
  }

  /**
   * Cleanup old entries
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean old rate limits
      for (const [ip, limit] of this.rateLimits) {
        if (now - limit.window > 300000) { // 5 minutes
          this.rateLimits.delete(ip);
        }
      }
      
      // Clean old reputations
      for (const [ip, rep] of this.ipReputation) {
        if (now - rep.lastUpdate > 86400000) { // 24 hours
          this.ipReputation.delete(ip);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get stats
   */
  getStats(): any {
    return {
      blocklist: this.blocklist.size,
      rateLimits: this.rateLimits.size,
      reputations: this.ipReputation.size
    };
  }
}

export function getDDoSProtection(): DDoSProtection {
  return new DDoSProtection();
}
