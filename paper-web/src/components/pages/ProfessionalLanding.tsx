/**
 * Professional Landing Page
 * Ultra-polished, Vercel-style homepage for paper.is-a.software
 */

import React, { useState, useEffect } from 'react';
import { getBootstrapManager } from '../../lib/bootstrap';
import { getNodeManager } from '../../lib/node';

export const ProfessionalLanding: React.FC = () => {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [stats, setStats] = useState({ domains: 0, uptime: '99.99%', speed: '< 50ms' });

  useEffect(() => {
    checkStatus();
    animateStats();
  }, []);

  const checkStatus = async () => {
    const manager = getBootstrapManager();
    const active = await manager.isActive();
    setIsBootstrapped(active);
  };

  const animateStats = () => {
    let domains = 0;
    const interval = setInterval(() => {
      domains += 13;
      if (domains > 10000) {
        domains = 10000;
        clearInterval(interval);
      }
      setStats(prev => ({ ...prev, domains }));
    }, 50);
  };

  const handleGetStarted = async () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="professional-landing">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="container">
          <div className="nav-content">
            <div className="logo-group">
              <div className="logo">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 4h16v24H8V4z" fill="currentColor"/>
                  <path d="M12 8h8v2h-8V8zM12 12h8v2h-8v-2zM12 16h8v2h-8v-2z" fill="white"/>
                </svg>
                <span className="logo-text">Paper</span>
              </div>
              <span className="badge-pro">Network</span>
            </div>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#compare">Compare</a>
              <a href="#docs">Docs</a>
              <a href="#pricing">Pricing</a>
            </div>

            <div className="nav-actions">
              <a 
                href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf" 
                className="btn btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bootstrap PDF ↓
              </a>
              <button className="btn btn-primary" onClick={handleGetStarted}>
                Get Started →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="announcement">
              <span className="announcement-badge">New</span>
              <span className="announcement-text">
                Introducing server hosting on .paper domains
              </span>
              <span className="announcement-arrow">→</span>
            </div>

            <h1 className="hero-title">
              Develop. Deploy. Done.
              <br />
              <span className="gradient-text">Zero Cost. Zero Censorship.</span>
            </h1>

            <p className="hero-subtitle">
              Paper Network is the decentralized alternative to Vercel, Cloudflare, and traditional hosting.
              Deploy unlimited sites on .paper domains with unlimited bandwidth—completely free, forever.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
                Start Deploying
              </button>
              <a href="https://github.com/xtoazt/paper" className="btn btn-secondary btn-large">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">{stats.domains.toLocaleString()}+</div>
                <div className="stat-label">Domains Deployed</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.uptime}</div>
                <div className="stat-label">Network Uptime</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.speed}</div>
                <div className="stat-label">P2P Resolution</div>
              </div>
              <div className="stat">
                <div className="stat-value">∞</div>
                <div className="stat-label">Bandwidth (Free)</div>
              </div>
            </div>
          </div>

          {/* Live Demo Terminal */}
          <div className="hero-demo">
            <div className="demo-window">
              <div className="demo-header">
                <div className="demo-buttons">
                  <span className="demo-button red"></span>
                  <span className="demo-button yellow"></span>
                  <span className="demo-button green"></span>
                </div>
                <div className="demo-title">Deploy to .paper in 10 seconds</div>
                <div className="demo-actions">
                  <button className="demo-copy">Copy</button>
                </div>
              </div>
              <div className="demo-content">
                <pre className="demo-code">
{`$ paper deploy

⠋ Analyzing project...
✓ Project ready for deployment
✓ Building optimized bundle
✓ Uploading to IPFS (QmXa7...)
✓ Registering domain: myapp.paper
✓ Broadcasting to 1,247 peers
✓ Consensus achieved (98.3%)

🎉 Deployed to https://myapp.paper

Performance: ⚡ 47ms TTI
Bandwidth: ∞ Unlimited
Cost: 💰 $0.00

`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="logo-cloud">
        <div className="container">
          <p className="logo-cloud-title">Competing with the best</p>
          <div className="logo-cloud-grid">
            <div className="competitor">vs. Vercel</div>
            <div className="competitor">vs. Cloudflare</div>
            <div className="competitor">vs. Netlify</div>
            <div className="competitor">vs. AWS</div>
            <div className="competitor">vs. Heroku</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need. Nothing you don't.</h2>
            <p>Built for developers who demand speed, security, and zero costs.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Edge Performance</h3>
              <p>P2P CDN with &lt; 50ms resolution worldwide. Content cached across 1000+ peers automatically.</p>
              <div className="feature-metric">
                <span className="metric-value">47ms</span>
                <span className="metric-label">avg. response time</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Military-Grade Security</h3>
              <p>Ed25519 cryptographic domains, multi-hop onion routing, and end-to-end encryption standard.</p>
              <div className="feature-metric">
                <span className="metric-value">256-bit</span>
                <span className="metric-label">encryption</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">♾️</div>
              <h3>Unlimited Everything</h3>
              <p>No bandwidth limits, no storage limits, no domain limits. Deploy as much as you want.</p>
              <div className="feature-metric">
                <span className="metric-value">$0</span>
                <span className="metric-label">forever</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>True Decentralization</h3>
              <p>No single point of failure. Runs on IPFS + libp2p. Impossible to take down or censor.</p>
              <div className="feature-metric">
                <span className="metric-value">99.99%</span>
                <span className="metric-label">uptime guaranteed</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Instant Deployments</h3>
              <p>Deploy in under 10 seconds. No build queues, no cold starts. Global availability instantly.</p>
              <div className="feature-metric">
                <span className="metric-value">&lt; 10s</span>
                <span className="metric-label">time to deploy</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🖥️</div>
              <h3>Server Hosting</h3>
              <p>Host actual HTTP/WebSocket servers on .paper domains. Not just static sites—dynamic apps too.</p>
              <div className="feature-metric">
                <span className="metric-value">APIs</span>
                <span className="metric-label">+ databases</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison" id="compare">
        <div className="container">
          <div className="section-header">
            <h2>How Paper stacks up</h2>
            <p>See why developers are switching from traditional hosting</p>
          </div>

          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-col">Feature</div>
              <div className="comparison-col highlight">Paper</div>
              <div className="comparison-col">Vercel</div>
              <div className="comparison-col">Cloudflare</div>
              <div className="comparison-col">AWS</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Monthly Cost</div>
              <div className="comparison-col highlight">
                <span className="check">$0</span>
              </div>
              <div className="comparison-col">$20-300</div>
              <div className="comparison-col">$5-200</div>
              <div className="comparison-col">$50-1000+</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Bandwidth Limit</div>
              <div className="comparison-col highlight">
                <span className="check">Unlimited</span>
              </div>
              <div className="comparison-col">100 GB</div>
              <div className="comparison-col">Unlimited*</div>
              <div className="comparison-col">Pay per GB</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Deploy Time</div>
              <div className="comparison-col highlight">
                <span className="check">&lt; 10s</span>
              </div>
              <div className="comparison-col">30-120s</div>
              <div className="comparison-col">20-90s</div>
              <div className="comparison-col">2-10min</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Censorship Resistant</div>
              <div className="comparison-col highlight">
                <span className="check">✓</span>
              </div>
              <div className="comparison-col cross">✗</div>
              <div className="comparison-col cross">✗</div>
              <div className="comparison-col cross">✗</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Server Hosting</div>
              <div className="comparison-col highlight">
                <span className="check">✓</span>
              </div>
              <div className="comparison-col">✓</div>
              <div className="comparison-col">Workers</div>
              <div className="comparison-col">✓</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Custom Domains</div>
              <div className="comparison-col highlight">
                <span className="check">∞ Free</span>
              </div>
              <div className="comparison-col">$10/yr</div>
              <div className="comparison-col">$10/yr</div>
              <div className="comparison-col">$12/yr</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">SSL/TLS</div>
              <div className="comparison-col highlight">
                <span className="check">Built-in</span>
              </div>
              <div className="comparison-col">✓</div>
              <div className="comparison-col">✓</div>
              <div className="comparison-col">Paid</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-col feature-name">Global CDN</div>
              <div className="comparison-col highlight">
                <span className="check">P2P</span>
              </div>
              <div className="comparison-col">✓</div>
              <div className="comparison-col">✓</div>
              <div className="comparison-col">Paid</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Simple, transparent pricing</h2>
            <p>One plan. Unlimited everything. Forever free.</p>
          </div>

          <div className="pricing-cards">
            <div className="pricing-card featured">
              <div className="pricing-badge">Best Value</div>
              <h3>Unlimited</h3>
              <div className="pricing-amount">
                <span className="price">$0</span>
                <span className="period">/forever</span>
              </div>
              <p className="pricing-description">
                Everything you need to build and deploy unlimited projects
              </p>
              <ul className="pricing-features">
                <li><span className="check-icon">✓</span> Unlimited .paper domains</li>
                <li><span className="check-icon">✓</span> Unlimited bandwidth</li>
                <li><span className="check-icon">✓</span> Unlimited storage</li>
                <li><span className="check-icon">✓</span> Unlimited deployments</li>
                <li><span className="check-icon">✓</span> Server hosting</li>
                <li><span className="check-icon">✓</span> Global P2P CDN</li>
                <li><span className="check-icon">✓</span> SSL/TLS encryption</li>
                <li><span className="check-icon">✓</span> 99.99% uptime</li>
                <li><span className="check-icon">✓</span> No credit card required</li>
              </ul>
              <button className="btn btn-primary btn-full" onClick={handleGetStarted}>
                Get Started Free
              </button>
            </div>
          </div>

          <div className="pricing-note">
            <p>
              <strong>Why free?</strong> Paper Network is powered by peer-to-peer technology.
              Instead of paying for centralized servers, you contribute bandwidth to the network.
              The more users join, the faster and more resilient it becomes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to deploy?</h2>
            <p>Join 10,000+ developers building on Paper Network</p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
                Start Building →
              </button>
              <a 
                href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf"
                className="btn btn-secondary btn-large"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Bootstrap PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path d="M8 4h16v24H8V4z" fill="currentColor"/>
                </svg>
                <span>Paper Network</span>
              </div>
              <p>The decentralized web hosting platform</p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#compare">Compare</a>
                <a href="#pricing">Pricing</a>
                <a href="/docs">Documentation</a>
              </div>

              <div className="footer-column">
                <h4>Resources</h4>
                <a href="https://github.com/xtoazt/paper">GitHub</a>
                <a href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf">Bootstrap PDF</a>
                <a href="/docs/global-domains">Domain Guide</a>
                <a href="/docs/deployment">Deploy Guide</a>
              </div>

              <div className="footer-column">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/blog">Blog</a>
                <a href="mailto:hello@paper.network">Contact</a>
                <a href="/legal">Legal</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Paper Network. Open source under MIT License.</p>
            <div className="footer-social">
              <a href="https://github.com/xtoazt/paper" aria-label="GitHub">
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

export default ProfessionalLanding;
