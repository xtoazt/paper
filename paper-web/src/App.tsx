/**
 * Main App Component - Fixed version without circular dependencies
 */

import React, { useState, useEffect } from 'react';
import './styles/design-system.css';
import './styles/ultimate-design.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove loading screen immediately
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.remove();
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="app" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Paper Network</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#features" style={{ textDecoration: 'none', color: '#000' }}>Features</a>
            <a href="#pricing" style={{ textDecoration: 'none', color: '#000' }}>Pricing</a>
            <a href="/dashboard" style={{ textDecoration: 'none', background: '#000', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: 1.2 }}>
            Deploy Unlimited Sites<br />Free Forever
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
            Host unlimited sites on .paper domains with $0 cost forever. Better than Vercel, Cloudflare, and AWS combined.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/dashboard" style={{
              background: '#fff',
              color: '#667eea',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Get Started →
            </a>
            <a href="#features" style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '6rem 2rem',
        background: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '4rem' }}>
            Why Paper Network?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { title: '🌐 True Global Domains', desc: 'Your .paper domain works everywhere, forever. No DNS, no servers, no censorship.' },
              { title: '💰 $0 Forever', desc: 'Unlimited bandwidth, unlimited storage, unlimited domains. Always free.' },
              { title: '⚡ Lightning Fast', desc: 'P2P CDN with edge caching. Faster than traditional hosting.' },
              { title: '🔒 Cryptographically Secured', desc: 'End-to-end encryption, onion routing, DDoS protection built-in.' },
              { title: '🚀 Deploy in 10 Seconds', desc: 'No config, no setup. Just deploy and go live instantly.' },
              { title: '🌍 Censorship Impossible', desc: 'Distributed P2P network. No single point of failure or control.' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '2rem',
                border: '1px solid #eee',
                borderRadius: '1rem',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feature.title}</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '6rem 2rem',
        background: '#f9fafb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem' }}>
            Simple, Transparent Pricing
          </h2>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '3rem',
            background: '#fff',
            borderRadius: '1rem',
            border: '2px solid #667eea'
          }}>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#667eea', marginBottom: '1rem' }}>$0</div>
            <div style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Forever. No credit card required.</div>
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
              {[
                'Unlimited domains',
                'Unlimited bandwidth',
                'Unlimited storage',
                'Global CDN',
                'SSL certificates',
                'DDoS protection',
                'P2P tunneling',
                'VPS hosting',
                'Database hosting',
                'Cron jobs'
              ].map((item, i) => (
                <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  ✓ {item}
                </li>
              ))}
            </ul>
            <a href="/dashboard" style={{
              display: 'inline-block',
              marginTop: '2rem',
              background: '#667eea',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Get Started Now →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem',
        background: '#000',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Paper Network</div>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            The future of web hosting is here. Decentralized, free, and unstoppable.
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://github.com/xtoazt/paper" style={{ color: '#fff', textDecoration: 'none' }}>GitHub</a>
            <a href="/docs" style={{ color: '#fff', textDecoration: 'none' }}>Documentation</a>
            <a href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
