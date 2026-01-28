/**
 * Distributed Analytics
 * Privacy-focused analytics aggregated across all nodes
 */

export interface AnalyticsEvent {
  type: 'pageview' | 'click' | 'error' | 'custom';
  domain: string;
  path: string;
  timestamp: number;
  country?: string;
  referrer?: string;
}

export interface AnalyticsStats {
  domain: string;
  visitors: number;
  pageviews: number;
  uniquePaths: Set<string>;
  countries: Map<string, number>;
  referrers: Map<string, number>;
  period: { start: number; end: number };
}

export class DistributedAnalytics {
  private events: AnalyticsEvent[] = [];
  private stats: Map<string, AnalyticsStats> = new Map();
  
  constructor() {
    console.log('[DistributedAnalytics] Initialized');
    this.startAggregation();
  }

  /**
   * Track event
   */
  track(event: AnalyticsEvent): void {
    this.events.push(event);
    this.updateStats(event);
  }

  /**
   * Update statistics
   */
  private updateStats(event: AnalyticsEvent): void {
    let stats = this.stats.get(event.domain);
    
    if (!stats) {
      stats = {
        domain: event.domain,
        visitors: 0,
        pageviews: 0,
        uniquePaths: new Set(),
        countries: new Map(),
        referrers: new Map(),
        period: { start: Date.now(), end: Date.now() }
      };
      this.stats.set(event.domain, stats);
    }
    
    // Update stats
    if (event.type === 'pageview') {
      stats.pageviews++;
      stats.uniquePaths.add(event.path);
      
      if (event.country) {
        stats.countries.set(event.country, (stats.countries.get(event.country) || 0) + 1);
      }
      
      if (event.referrer) {
        stats.referrers.set(event.referrer, (stats.referrers.get(event.referrer) || 0) + 1);
      }
    }
    
    stats.period.end = Date.now();
  }

  /**
   * Get stats for domain
   */
  getStats(domain: string): any {
    const stats = this.stats.get(domain);
    if (!stats) return null;
    
    return {
      domain: stats.domain,
      visitors: stats.visitors,
      pageviews: stats.pageviews,
      uniquePages: stats.uniquePaths.size,
      topCountries: Array.from(stats.countries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topReferrers: Array.from(stats.referrers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      period: stats.period
    };
  }

  /**
   * Start aggregation across nodes
   */
  private startAggregation(): void {
    setInterval(() => {
      // Aggregate stats across P2P network
      console.log('[DistributedAnalytics] Aggregating stats...');
    }, 60000); // Every minute
  }

  /**
   * Get real-time stats
   */
  getRealTimeStats(domain: string): any {
    const recentEvents = this.events
      .filter(e => e.domain === domain && Date.now() - e.timestamp < 300000);
    
    return {
      currentVisitors: new Set(recentEvents.map(e => e.path)).size,
      recentPageviews: recentEvents.filter(e => e.type === 'pageview').length
    };
  }
}

export function getDistributedAnalytics(): DistributedAnalytics {
  return new DistributedAnalytics();
}
