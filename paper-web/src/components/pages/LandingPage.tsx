/**
 * Landing Page
 * Vercel-inspired hero section and onboarding
 */

import React, { useState, useEffect } from 'react';
import { getBootstrapManager } from '../../lib/bootstrap';
import { getNodeManager } from '../../lib/node';

export const LandingPage: React.FC = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    const bootstrapManager = getBootstrapManager();
    const isActive = await bootstrapManager.isActive();
    setIsReady(isActive);
    
    if (!isActive) {
      setStatusMessage('Service Worker not registered');
    } else {
      setStatusMessage('Network ready');
    }
  };

  const handleGetStarted = async () => {
    setIsBootstrapping(true);
    setStatusMessage('Bootstrapping network...');

    try {
      // Bootstrap Service Worker
      const bootstrapManager = getBootstrapManager();
      const result = await bootstrapManager.bootstrapParallel();

      if (result.success) {
        setStatusMessage('Service Worker registered');

        // Initialize node manager
        setStatusMessage('Starting P2P nodes...');
        const nodeManager = getNodeManager();
        await nodeManager.startNodes();

        setStatusMessage('Network ready!');
        setIsReady(true);
      } else {
        setStatusMessage('Bootstrap failed: ' + result.error);
      }
    } catch (error) {
      setStatusMessage('Error: ' + (error as Error).message);
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              The Internet,
              <br />
              <span className="gradient-text">Uncensored</span>
            </h1>
            
            <p className="hero-description">
              Paper Network enables truly decentralized web hosting and domain registration.
              Create unlimited free .paper domains, host unlimited content, and join the
              censorship-resistant web.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGetStarted}
                disabled={isBootstrapping || isReady}
              >
                {isBootstrapping ? 'Bootstrapping...' : isReady ? 'Network Ready ✓' : 'Get Started →'}
              </button>
              
              <a href="https://github.com/xtoazt/paper" className="btn btn-secondary btn-lg">
                View on GitHub
              </a>
            </div>

            {statusMessage && (
              <div className="status-message">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Hero Visual */}
          <div className="hero-visual">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-buttons">
                  <span className="terminal-button red"></span>
                  <span className="terminal-button yellow"></span>
                  <span className="terminal-button green"></span>
                </div>
                <div className="terminal-title">paper@network:~</div>
              </div>
              <div className="terminal-body">
                <pre>
{`$ paper register mysite.paper

✓ Generating PKARR keypair...
✓ Publishing to DHT...
✓ Broadcasting to network...
✓ Consensus achieved (97% agreement)

Domain registered: mysite.paper
Owner: ed25519_abc123...
Status: Live globally

$ _`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Paper Network?</h2>
          
          <div className="features-grid">
            <div className="feature-card card">
              <div className="feature-icon">🌐</div>
              <h3>True Decentralization</h3>
              <p>
                No central servers. No registrars. No ICANN. Your domain is secured by
                cryptography and distributed across thousands of peers.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">🔒</div>
              <h3>Censorship Resistant</h3>
              <p>
                Multi-hop onion routing, DHT-based resolution, and P2P storage make it
                impossible to block or censor your content.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">⚡</div>
              <h3>Zero Cost</h3>
              <p>
                Unlimited free .paper domains, unlimited bandwidth, unlimited storage.
                No subscriptions, no hidden fees.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">🚀</div>
              <h3>Instant Setup</h3>
              <p>
                Register a domain and deploy in seconds. No DNS propagation, no waiting.
                Global availability in under 10 seconds.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">🔐</div>
              <h3>Cryptographic Ownership</h3>
              <p>
                Your domain is tied to your private key. Nobody can take it, nobody can
                censor it. True digital property rights.
              </p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon">🌍</div>
              <h3>Global Consensus</h3>
              <p>
                DHT + PKARR ensures green.paper is the same green.paper everywhere in the
                world. No conflicts, no disputes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Register Domain</h3>
                <p>
                  Generate a cryptographic keypair and register your .paper domain.
                  It's yours forever.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Upload Content</h3>
                <p>
                  Upload your website to IPFS. Content is automatically distributed
                  across the P2P network.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Go Live</h3>
                <p>
                  Your site is instantly accessible globally at yourdomain.paper.
                  No waiting, no configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to join the uncensored web?</h2>
            <p>Start hosting on .paper domains today. No sign-up required.</p>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGetStarted}
              disabled={isBootstrapping || isReady}
            >
              {isReady ? 'Launch Dashboard →' : 'Get Started →'}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: var(--color-white);
        }

        .hero {
          padding: var(--spacing-24) 0 var(--spacing-20);
          background: linear-gradient(to bottom, var(--color-gray-50), var(--color-white));
          border-bottom: 1px solid var(--color-border-light);
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-title {
          font-size: var(--font-size-6xl);
          font-weight: var(--font-weight-bold);
          line-height: var(--line-height-tight);
          margin-bottom: var(--spacing-6);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--color-blue), var(--color-black));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-8);
        }

        .hero-actions {
          display: flex;
          gap: var(--spacing-4);
          justify-content: center;
          margin-bottom: var(--spacing-6);
        }

        .btn-lg {
          padding: var(--spacing-3) var(--spacing-6);
          font-size: var(--font-size-base);
        }

        .status-message {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          font-family: var(--font-mono);
        }

        .hero-visual {
          max-width: 900px;
          margin: var(--spacing-16) auto 0;
        }

        .terminal-window {
          background: var(--color-black);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }

        .terminal-header {
          background: var(--color-gray-800);
          padding: var(--spacing-3);
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }

        .terminal-buttons {
          display: flex;
          gap: var(--spacing-2);
        }

        .terminal-button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .terminal-button.red { background: #ff5f56; }
        .terminal-button.yellow { background: #ffbd2e; }
        .terminal-button.green { background: #27c93f; }

        .terminal-title {
          font-size: var(--font-size-sm);
          color: var(--color-gray-400);
          font-family: var(--font-mono);
        }

        .terminal-body {
          padding: var(--spacing-6);
        }

        .terminal-body pre {
          color: var(--color-green);
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          line-height: 1.6;
          margin: 0;
        }

        .features {
          padding: var(--spacing-24) 0;
        }

        .section-title {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          text-align: center;
          margin-bottom: var(--spacing-12);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-6);
        }

        .feature-card {
          text-align: center;
        }

        .feature-icon {
          font-size: var(--font-size-4xl);
          margin-bottom: var(--spacing-4);
        }

        .feature-card h3 {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-3);
        }

        .feature-card p {
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .how-it-works {
          padding: var(--spacing-24) 0;
          background: var(--color-gray-50);
        }

        .steps {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-8);
        }

        .step {
          display: flex;
          gap: var(--spacing-6);
          align-items: start;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--color-black);
          color: var(--color-white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          flex-shrink: 0;
        }

        .step-content h3 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-2);
        }

        .step-content p {
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .cta {
          padding: var(--spacing-24) 0;
          border-top: 1px solid var(--color-border-light);
        }

        .cta-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-content h2 {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-4);
        }

        .cta-content p {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-8);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: var(--font-size-4xl);
          }

          .hero-actions {
            flex-direction: column;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
