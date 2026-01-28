/**
 * Main Dashboard
 * Central hub for managing .paper domains, content, and network
 */

import React, { useState } from 'react';
import NetworkStatus from './ui/NetworkStatus';
import DomainCreator from './ui/DomainCreator';
import ContentUploader from './ui/ContentUploader';

type Tab = 'overview' | 'domains' | 'content' | 'network';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [myDomains, setMyDomains] = useState<string[]>([]);

  const handleDomainCreated = (domain: string) => {
    setMyDomains(prev => [...prev, domain]);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">📄</span>
              <span className="logo-text">Paper Network</span>
            </div>

            <nav className="nav">
              <button
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`nav-link ${activeTab === 'domains' ? 'active' : ''}`}
                onClick={() => setActiveTab('domains')}
              >
                Domains
                {myDomains.length > 0 && (
                  <span className="badge badge-primary">{myDomains.length}</span>
                )}
              </button>
              <button
                className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button
                className={`nav-link ${activeTab === 'network' ? 'active' : ''}`}
                onClick={() => setActiveTab('network')}
              >
                Network
              </button>
            </nav>

            <a
              href="https://github.com/xtoazt/paper"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="page-header">
                <h1>Overview</h1>
                <p>Welcome to the Paper Network dashboard</p>
              </div>

              <div className="quick-stats">
                <div className="stat-card card">
                  <div className="stat-icon">🌐</div>
                  <div className="stat-details">
                    <div className="stat-value">{myDomains.length}</div>
                    <div className="stat-label">My Domains</div>
                  </div>
                </div>

                <div className="stat-card card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-details">
                    <div className="stat-value">Unlimited</div>
                    <div className="stat-label">Bandwidth</div>
                  </div>
                </div>

                <div className="stat-card card">
                  <div className="stat-icon">💾</div>
                  <div className="stat-details">
                    <div className="stat-value">Unlimited</div>
                    <div className="stat-label">Storage</div>
                  </div>
                </div>

                <div className="stat-card card">
                  <div className="stat-icon">🔒</div>
                  <div className="stat-details">
                    <div className="stat-value">100%</div>
                    <div className="stat-label">Encrypted</div>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                  <button
                    className="action-card card"
                    onClick={() => setActiveTab('domains')}
                  >
                    <div className="action-icon">➕</div>
                    <div className="action-title">Register Domain</div>
                    <div className="action-description">
                      Create a new .paper domain
                    </div>
                  </button>

                  <button
                    className="action-card card"
                    onClick={() => setActiveTab('content')}
                  >
                    <div className="action-icon">⬆️</div>
                    <div className="action-title">Upload Content</div>
                    <div className="action-description">
                      Deploy to IPFS instantly
                    </div>
                  </button>

                  <button
                    className="action-card card"
                    onClick={() => setActiveTab('network')}
                  >
                    <div className="action-icon">📊</div>
                    <div className="action-title">View Network</div>
                    <div className="action-description">
                      Monitor P2P status
                    </div>
                  </button>
                </div>
              </div>

              {myDomains.length > 0 && (
                <div className="recent-domains">
                  <h2>My Domains</h2>
                  <div className="domains-list">
                    {myDomains.map((domain, index) => (
                      <div key={index} className="domain-card card">
                        <div className="domain-icon">🌐</div>
                        <div className="domain-details">
                          <div className="domain-name">{domain}</div>
                          <div className="domain-status">
                            <span className="badge badge-success">Live</span>
                          </div>
                        </div>
                        <a
                          href={`http://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Visit →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="tab-content">
              <div className="page-header">
                <h1>Domains</h1>
                <p>Register and manage your .paper domains</p>
              </div>

              <DomainCreator onDomainCreated={handleDomainCreated} />
            </div>
          )}

          {activeTab === 'content' && (
            <div className="tab-content">
              <div className="page-header">
                <h1>Content</h1>
                <p>Upload and distribute content across the network</p>
              </div>

              <ContentUploader />
            </div>
          )}

          {activeTab === 'network' && (
            <div className="tab-content">
              <div className="page-header">
                <h1>Network</h1>
                <p>Monitor P2P network health and statistics</p>
              </div>

              <NetworkStatus />
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
