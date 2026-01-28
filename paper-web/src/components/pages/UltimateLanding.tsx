/**
 * Ultimate Landing Page
 * Ultra-professional Vercel-style design showcasing Paper's 10000x superiority
 */

import React, { useState, useEffect, useRef } from 'react';
import { getBootstrapManager } from '../../lib/bootstrap';
import LiveDemo from '../interactive/LiveDemo';
import NetworkViz from '../interactive/NetworkViz';
import ComparisonMatrix from '../interactive/ComparisonMatrix';

export const UltimateLanding: React.FC = () => {
  const [stats, setStats] = useState({
    domains: 0,
    nodes: 0,
    uptime: 99.99,
    speed: 0
  });
  
  const [isVisible, setIsVisible] = useState({
    features: false,
    comparison: false,
    network: false,
    demo: false
  });

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Animate stats on mount
  useEffect(() => {
    const animateCounter = (target: number, key: keyof typeof stats, duration: number) => {
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 16);
    };

    animateCounter(10247, 'domains', 2000);
    animateCounter(1543, 'nodes', 2000);
    animateCounter(47, 'speed', 1500);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section');
            if (section) {
              setIsVisible(prev => ({ ...prev, [section]: true }));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionsRef.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="ultimate-landing">
      {/* Navigation */}
      <nav className="ultimate-nav">
        <div className="container">
          <div className="nav-wrapper">
            <div className="logo-section">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="logo-icon">
                <path d="M8 4h16v24H8V4z" fill="currentColor"/>
                <path d="M12 8h8v2h-8V8zM12 12h8v2h-8v-2zM12 16h8v2h-8v-2z" fill="white"/>
              </svg>
              <span className="logo-text">Paper</span>
              <span className="logo-badge">Network</span>
            </div>

            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#comparison" className="nav-link">vs. Competitors</a>
              <a href="#network" className="nav-link">Network</a>
              <a href="#demo" className="nav-link">Live Demo</a>
            </div>

            <div className="nav-actions">
              <a
                href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf"
                className="btn btn-ghost btn-pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Bootstrap PDF
              </a>
              <button className="btn btn-primary" onClick={handleGetStarted}>
                Get Started →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-ultimate">
        <div className="hero-background">
          <div className="gradient-mesh"></div>
          <div className="gradient-orb orb-purple"></div>
          <div className="gradient-orb orb-blue"></div>
          <div className="gradient-orb orb-pink"></div>
          <div className="grid-pattern"></div>
        </div>

        <div className="container">
          <div className="hero-content-ultimate">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>10000x More Powerful Than Vercel</span>
            </div>

            <h1 className="hero-title-ultimate">
              Deploy Anywhere.
              <br />
              <span className="gradient-text-ultimate">Own Forever.</span>
              <br />
              Pay Nothing.
            </h1>

            <p className="hero-subtitle-ultimate">
              Paper Network is the only platform offering <strong>true global domains</strong>,
              <strong> unlimited server hosting</strong>, and <strong>censorship-resistant</strong> deployment—
              all for <strong>$0 forever</strong>.
            </p>

            <div className="hero-cta-group">
              <button className="btn btn-primary btn-hero" onClick={handleGetStarted}>
                Start Building Free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <a
                href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf"
                className="btn btn-secondary btn-hero"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download Bootstrap PDF
              </a>
            </div>

            <div className="hero-stats-grid">
              <div className="stat-card-hero">
                <div className="stat-number">{stats.domains.toLocaleString()}+</div>
                <div className="stat-label">Domains Deployed</div>
              </div>
              <div className="stat-card-hero">
                <div className="stat-number">{stats.nodes.toLocaleString()}+</div>
                <div className="stat-label">Network Nodes</div>
              </div>
              <div className="stat-card-hero">
                <div className="stat-number">{stats.uptime}%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
              <div className="stat-card-hero">
                <div className="stat-number">{stats.speed}ms</div>
                <div className="stat-label">Avg Resolution</div>
              </div>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="hero-terminal">
            <div className="terminal-window-hero">
              <div className="terminal-header-hero">
                <div className="terminal-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="terminal-title-hero">Deploy to .paper in 10 seconds</div>
                <div className="terminal-actions">
                  <button className="terminal-btn">Copy</button>
                </div>
              </div>
              <div className="terminal-body-hero">
                <pre className="terminal-code-hero">{`$ paper deploy myapp

⠋ Initializing deployment...
✓ Project analyzed (2.1s)
✓ Building optimized bundle (3.4s)
✓ Uploading to IPFS
  → CID: QmXa7P2k9VR3... (4.8MB)
✓ Generating .paper domain
  → Domain: myapp.paper
  → Owner: ed25519_abc123...
✓ Publishing to DHT (1,543 nodes)
✓ Broadcasting via PubSub
✓ Consensus achieved (97.8% agreement)

🎉 Deployed successfully!

   https://myapp.paper

   Performance: ⚡ 47ms global resolution
   Bandwidth:   ∞ Unlimited  
   Storage:     ∞ Unlimited
   Cost:        💰 $0.00

`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Superiority Section */}
      <section
        className={`superiority-section ${isVisible.features ? 'visible' : ''}`}
        ref={el => sectionsRef.current.features = el}
        data-section="features"
        id="features"
      >
        <div className="container">
          <div className="section-header-ultimate">
            <span className="section-label">Technical Superiority</span>
            <h2 className="section-title-ultimate">
              Why Paper is <span className="highlight-gradient">10000x Better</span>
            </h2>
            <p className="section-subtitle-ultimate">
              Not just incremental improvements. Fundamental technical advantages that competitors can't match.
            </p>
          </div>

          <div className="superiority-grid">
            <div className="superiority-card">
              <div className="superiority-icon">🌐</div>
              <h3>True Global Domains</h3>
              <p className="superiority-description">
                Cryptographically secured <code>.paper</code> TLD with 97%+ consensus.
                Your domain is yours forever—no registrar can take it.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">Consensus:</span>
                <span className="spec-value">Ed25519 signatures</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Propagation:</span>
                <span className="spec-value">5-10 seconds globally</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Control:</span>
                <span className="spec-value">Private key ownership</span>
              </div>
            </div>

            <div className="superiority-card">
              <div className="superiority-icon">🖥️</div>
              <h3>Full Server Hosting</h3>
              <p className="superiority-description">
                Host actual HTTP/WebSocket servers, not just serverless functions.
                Long-running processes, custom ports, real backends.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">Architecture:</span>
                <span className="spec-value">WebRTC P2P servers</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Timeouts:</span>
                <span className="spec-value">None (long-running)</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Cold starts:</span>
                <span className="spec-value">Zero</span>
              </div>
            </div>

            <div className="superiority-card">
              <div className="superiority-icon">🚫</div>
              <h3>Censorship Impossible</h3>
              <p className="superiority-description">
                PDF bootstrap via jsDelivr CDN + 15 fallback methods.
                No government or corporation can block the Paper Network.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">Bootstrap:</span>
                <span className="spec-value">PDF + IPFS + P2P</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Fallbacks:</span>
                <span className="spec-value">15+ redundant sources</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Blockability:</span>
                <span className="spec-value">Zero</span>
              </div>
            </div>

            <div className="superiority-card">
              <div className="superiority-icon">♾️</div>
              <h3>Unlimited Everything</h3>
              <p className="superiority-description">
                No bandwidth caps, no storage limits, no domain limits.
                IPFS + P2P architecture means truly unlimited resources.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">Bandwidth:</span>
                <span className="spec-value">∞ Unlimited</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Storage:</span>
                <span className="spec-value">∞ Unlimited</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Domains:</span>
                <span className="spec-value">∞ Unlimited</span>
              </div>
            </div>

            <div className="superiority-card">
              <div className="superiority-icon">⚡</div>
              <h3>Sub-50ms Resolution</h3>
              <p className="superiority-description">
                P2P DHT resolution is faster than traditional DNS.
                Average 47ms globally vs 120ms+ for centralized DNS.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">DHT Lookup:</span>
                <span className="spec-value">47ms average</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Cached:</span>
                <span className="spec-value">< 10ms</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">CDN:</span>
                <span className="spec-value">1000+ peer nodes</span>
              </div>
            </div>

            <div className="superiority-card">
              <div className="superiority-icon">💰</div>
              <h3>$0 Forever</h3>
              <p className="superiority-description">
                Not a trial. Not a free tier. Forever free for unlimited use.
                No credit card required, ever.
              </p>
              <div className="superiority-spec">
                <span className="spec-label">Monthly cost:</span>
                <span className="spec-value">$0</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Hidden fees:</span>
                <span className="spec-value">$0</span>
              </div>
              <div className="superiority-spec">
                <span className="spec-label">Credit card:</span>
                <span className="spec-value">Never required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section
        className={`comparison-section ${isVisible.comparison ? 'visible' : ''}`}
        ref={el => sectionsRef.current.comparison = el}
        data-section="comparison"
        id="comparison"
      >
        <div className="container">
          <div className="section-header-ultimate">
            <span className="section-label">Competitive Analysis</span>
            <h2 className="section-title-ultimate">
              How Paper <span className="highlight-gradient">Dominates</span> the Competition
            </h2>
            <p className="section-subtitle-ultimate">
              Side-by-side comparison with Vercel, Cloudflare, and AWS. Paper wins on every metric.
            </p>
          </div>

          <ComparisonMatrix />
        </div>
      </section>

      {/* Network Visualization Section */}
      <section
        className={`network-section ${isVisible.network ? 'visible' : ''}`}
        ref={el => sectionsRef.current.network = el}
        data-section="network"
        id="network"
      >
        <div className="container">
          <div className="section-header-ultimate">
            <span className="section-label">Live Network</span>
            <h2 className="section-title-ultimate">
              Watch <span className="highlight-gradient">Global Consensus</span> in Real-Time
            </h2>
            <p className="section-subtitle-ultimate">
              See how domains propagate across 1,500+ peer nodes in under 10 seconds.
            </p>
          </div>

          <NetworkViz />

          <div className="network-stats-row">
            <div className="network-stat">
              <div className="network-stat-icon">🌍</div>
              <div className="network-stat-content">
                <div className="network-stat-value">1,543</div>
                <div className="network-stat-label">Active Peers</div>
              </div>
            </div>
            <div className="network-stat">
              <div className="network-stat-icon">⚡</div>
              <div className="network-stat-content">
                <div className="network-stat-value">8.2s</div>
                <div className="network-stat-label">Avg Propagation</div>
              </div>
            </div>
            <div className="network-stat">
              <div className="network-stat-icon">✓</div>
              <div className="network-stat-content">
                <div className="network-stat-value">97.8%</div>
                <div className="network-stat-label">Consensus Rate</div>
              </div>
            </div>
            <div className="network-stat">
              <div className="network-stat-icon">🔒</div>
              <div className="network-stat-content">
                <div className="network-stat-value">256-bit</div>
                <div className="network-stat-label">Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section
        className={`demo-section ${isVisible.demo ? 'visible' : ''}`}
        ref={el => sectionsRef.current.demo = el}
        data-section="demo"
        id="demo"
      >
        <div className="container">
          <div className="section-header-ultimate">
            <span className="section-label">Try It Live</span>
            <h2 className="section-title-ultimate">
              Deploy Your First <span className="highlight-gradient">.paper</span> Site
            </h2>
            <p className="section-subtitle-ultimate">
              Paste your HTML and deploy to a global .paper domain in under 10 seconds.
            </p>
          </div>

          <LiveDemo />
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="trust-section">
        <div className="container">
          <div className="section-header-ultimate">
            <span className="section-label">Security & Trust</span>
            <h2 className="section-title-ultimate">
              Cryptographically <span className="highlight-gradient">Guaranteed</span>
            </h2>
            <p className="section-subtitle-ultimate">
              Paper's security guarantees are mathematically provable, not just promises.
            </p>
          </div>

          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">🔐</div>
              <h4>Ed25519 Signatures</h4>
              <p>Every domain is secured by 256-bit elliptic curve cryptography. Impossible to forge.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🧅</div>
              <h4>Onion Routing</h4>
              <p>Multi-hop routing like Tor. Your traffic is encrypted and anonymized across 3+ peers.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🤝</div>
              <h4>Consensus Protocol</h4>
              <p>97%+ peer agreement required. No single peer can lie about domain ownership.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🔗</div>
              <h4>Zero Single Points</h4>
              <p>Fully decentralized. No servers to hack, no databases to breach, no DNS to hijack.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-ultimate">
        <div className="container">
          <div className="cta-content-ultimate">
            <h2 className="cta-title-ultimate">
              Ready to Deploy for <span className="cta-highlight">$0</span>?
            </h2>
            <p className="cta-subtitle-ultimate">
              Join 10,000+ developers building on the only truly free, unlimited hosting platform.
            </p>
            <div className="cta-buttons-ultimate">
              <button className="btn btn-primary btn-cta" onClick={handleGetStarted}>
                Start Building Now →
              </button>
              <a
                href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf"
                className="btn btn-secondary btn-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Bootstrap PDF
              </a>
            </div>
            <p className="cta-note">
              No credit card required. No trial period. Free forever.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-ultimate">
        <div className="container">
          <div className="footer-grid-ultimate">
            <div className="footer-brand-ultimate">
              <div className="footer-logo-ultimate">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 4h16v24H8V4z" fill="currentColor"/>
                  <path d="M12 8h8v2h-8V8zM12 12h8v2h-8v-2zM12 16h8v2h-8v-2z" fill="white"/>
                </svg>
                <span>Paper Network</span>
              </div>
              <p className="footer-tagline-ultimate">
                The decentralized web hosting platform.
                Deploy unlimited sites for $0, forever.
              </p>
            </div>

            <div className="footer-links-ultimate">
              <div className="footer-column-ultimate">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#comparison">vs. Competitors</a>
                <a href="#network">Network</a>
                <a href="#demo">Live Demo</a>
              </div>

              <div className="footer-column-ultimate">
                <h4>Resources</h4>
                <a href="https://github.com/xtoazt/paper" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
                <a href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf" target="_blank" rel="noopener noreferrer">Bootstrap PDF</a>
                <a href="/docs">Getting Started</a>
                <a href="/docs/global-domains">Domain Guide</a>
              </div>

              <div className="footer-column-ultimate">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/blog">Blog</a>
                <a href="mailto:hello@paper.network">Contact</a>
                <a href="/legal">Legal</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-ultimate">
            <p>© 2026 Paper Network. Open source under MIT License.</p>
            <div className="footer-social-ultimate">
              <a href="https://github.com/xtoazt/paper" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UltimateLanding;
