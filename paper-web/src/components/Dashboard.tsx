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

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--color-bg-secondary);
        }

        .dashboard-header {
          background: var(--color-white);
          border-bottom: 1px solid var(--color-border-light);
          padding: var(--spacing-4) 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-6);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          text-decoration: none;
          color: var(--color-black);
        }

        .logo-icon {
          font-size: var(--font-size-2xl);
        }

        .nav {
          display: flex;
          gap: var(--spacing-1);
          flex: 1;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          padding: var(--spacing-2) var(--spacing-4);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-600);
          background: transparent;
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--color-black);
          background: var(--color-gray-100);
        }

        .nav-link.active {
          color: var(--color-black);
          background: var(--color-gray-100);
        }

        .dashboard-main {
          padding: var(--spacing-8) 0;
        }

        .tab-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: var(--spacing-8);
        }

        .page-header h1 {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-2);
        }

        .page-header p {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-8);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
          padding: var(--spacing-4);
        }

        .stat-icon {
          font-size: var(--font-size-3xl);
        }

        .stat-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-1);
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .quick-actions {
          margin-bottom: var(--spacing-8);
        }

        .quick-actions h2 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-4);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-4);
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-6);
          cursor: pointer;
          border: 1px solid var(--color-border-light);
          background: var(--color-white);
          transition: all var(--transition-base);
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-card-hover);
        }

        .action-icon {
          font-size: var(--font-size-4xl);
          margin-bottom: var(--spacing-3);
        }

        .action-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-2);
        }

        .action-description {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .recent-domains {
          margin-bottom: var(--spacing-8);
        }

        .recent-domains h2 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-4);
        }

        .domains-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-3);
        }

        .domain-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
          padding: var(--spacing-4);
        }

        .domain-icon {
          font-size: var(--font-size-2xl);
        }

        .domain-details {
          flex: 1;
        }

        .domain-name {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-mono);
          margin-bottom: var(--spacing-1);
        }

        .domain-status {
          font-size: var(--font-size-sm);
        }

        .btn-sm {
          padding: var(--spacing-1) var(--spacing-3);
          font-size: var(--font-size-sm);
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .nav {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .quick-stats,
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
