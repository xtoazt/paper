/**
 * Comparison Matrix Component
 * Comprehensive comparison showing Paper's advantages over competitors
 */

import React, { useState } from 'react';

interface Feature {
  name: string;
  paper: string | JSX.Element;
  vercel: string | JSX.Element;
  cloudflare: string | JSX.Element;
  aws: string | JSX.Element;
  important?: boolean;
}

const CheckIcon = () => (
  <span className="comparison-check">✓</span>
);

const CrossIcon = () => (
  <span className="comparison-cross">✗</span>
);

export const ComparisonMatrix: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'all' | 'advantages'>('all');

  const features: Feature[] = [
    {
      name: 'Monthly Cost',
      paper: <><strong>$0</strong> Forever</>,
      vercel: '$20-300',
      cloudflare: '$5-200',
      aws: '$50-1000+',
      important: true
    },
    {
      name: 'Bandwidth Limit',
      paper: <><strong>∞</strong> Unlimited</>,
      vercel: '100 GB/month',
      cloudflare: 'Unlimited*',
      aws: 'Pay per GB',
      important: true
    },
    {
      name: 'Storage Limit',
      paper: <><strong>∞</strong> Unlimited</>,
      vercel: '100 GB',
      cloudflare: '25 GB',
      aws: 'Pay per GB'
    },
    {
      name: 'Deploy Time',
      paper: <><strong>&lt; 10s</strong></>,
      vercel: '30-120s',
      cloudflare: '20-90s',
      aws: '2-10min',
      important: true
    },
    {
      name: 'Domain Cost',
      paper: <><strong>$0</strong>/domain</>,
      vercel: '$10/year',
      cloudflare: '$10/year',
      aws: '$12/year'
    },
    {
      name: 'Custom Domains',
      paper: <><strong>∞</strong> Unlimited</>,
      vercel: 'Paid only',
      cloudflare: 'Paid only',
      aws: 'Pay per zone'
    },
    {
      name: 'SSL/TLS',
      paper: <><CheckIcon /> Built-in</>,
      vercel: <CheckIcon />,
      cloudflare: <CheckIcon />,
      aws: 'Paid (ACM)'
    },
    {
      name: 'Censorship Resistant',
      paper: <><CheckIcon /> <strong>Impossible</strong></>,
      vercel: <CrossIcon />,
      cloudflare: <CrossIcon />,
      aws: <CrossIcon />,
      important: true
    },
    {
      name: 'Server Hosting',
      paper: <><CheckIcon /> <strong>Full servers</strong></>,
      vercel: 'Functions only',
      cloudflare: 'Workers only',
      aws: <CheckIcon />,
      important: true
    },
    {
      name: 'WebSocket Support',
      paper: <><CheckIcon /> Unlimited</>,
      vercel: 'Limited',
      cloudflare: 'Limited',
      aws: <CheckIcon />
    },
    {
      name: 'Build Minutes',
      paper: <><strong>∞</strong> Unlimited</>,
      vercel: '6000/month',
      cloudflare: '500/month',
      aws: 'Pay per minute'
    },
    {
      name: 'Team Seats',
      paper: <><strong>∞</strong> Unlimited</>,
      vercel: '10 max',
      cloudflare: '5 max',
      aws: 'IAM charges'
    },
    {
      name: 'Analytics',
      paper: <><CheckIcon /> Free</>,
      vercel: 'Paid addon',
      cloudflare: 'Paid addon',
      aws: 'CloudWatch cost'
    },
    {
      name: 'DDoS Protection',
      paper: <><CheckIcon /> <strong>P2P native</strong></>,
      vercel: <CheckIcon />,
      cloudflare: <CheckIcon />,
      aws: 'AWS Shield ($)'
    },
    {
      name: 'Global CDN',
      paper: <><CheckIcon /> <strong>1500+ P2P nodes</strong></>,
      vercel: '100+ PoPs',
      cloudflare: '200+ PoPs',
      aws: '400+ PoPs'
    },
    {
      name: 'Uptime SLA',
      paper: <><strong>99.99%</strong> Decentralized</>,
      vercel: '99.99%',
      cloudflare: '99.99%',
      aws: '99.99%'
    },
    {
      name: 'Lock-in Risk',
      paper: <><strong>Zero</strong> (P2P)</>,
      vercel: 'High',
      cloudflare: 'Medium',
      aws: 'Very High'
    },
    {
      name: 'Privacy',
      paper: <><strong>Anonymous</strong> DHT</>,
      vercel: 'Tracked',
      cloudflare: 'Tracked',
      aws: 'Tracked'
    }
  ];

  const displayedFeatures = selectedView === 'advantages'
    ? features.filter(f => f.important)
    : features;

  return (
    <div className="comparison-matrix">
      <div className="comparison-controls">
        <button
          className={`comparison-tab ${selectedView === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedView('all')}
        >
          All Features ({features.length})
        </button>
        <button
          className={`comparison-tab ${selectedView === 'advantages' ? 'active' : ''}`}
          onClick={() => setSelectedView('advantages')}
        >
          Key Advantages ({features.filter(f => f.important).length})
        </button>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="comparison-header-feature">Feature</th>
              <th className="comparison-header-paper">
                <div className="comparison-header-content">
                  <span className="comparison-logo">Paper</span>
                  <span className="comparison-badge">Best Value</span>
                </div>
              </th>
              <th className="comparison-header-other">Vercel</th>
              <th className="comparison-header-other">Cloudflare</th>
              <th className="comparison-header-other">AWS</th>
            </tr>
          </thead>
          <tbody>
            {displayedFeatures.map((feature, index) => (
              <tr key={index} className={feature.important ? 'comparison-row-important' : ''}>
                <td className="comparison-cell-feature">
                  {feature.name}
                  {feature.important && <span className="feature-badge">Important</span>}
                </td>
                <td className="comparison-cell-paper">{feature.paper}</td>
                <td className="comparison-cell-other">{feature.vercel}</td>
                <td className="comparison-cell-other">{feature.cloudflare}</td>
                <td className="comparison-cell-other">{feature.aws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-summary">
        <div className="summary-card">
          <div className="summary-title">Cost Comparison (12 months)</div>
          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">Paper:</span>
              <span className="summary-value paper-value">$0</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Vercel Pro:</span>
              <span className="summary-value">$240</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Cloudflare:</span>
              <span className="summary-value">$60-2400</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">AWS:</span>
              <span className="summary-value">$600-12000+</span>
            </div>
          </div>
          <div className="summary-savings">
            <strong>You save $240-12000+</strong> per year with Paper
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Why Paper Wins</div>
          <ul className="summary-list">
            <li><strong>Zero Cost:</strong> $0 forever vs $240-12000/year</li>
            <li><strong>True Ownership:</strong> Cryptographic keys vs account control</li>
            <li><strong>Censorship Proof:</strong> P2P architecture vs centralized</li>
            <li><strong>Unlimited:</strong> Bandwidth, storage, domains vs limits</li>
            <li><strong>Full Servers:</strong> HTTP/WebSocket vs functions only</li>
          </ul>
        </div>
      </div>

      <div className="comparison-note">
        <p>
          <strong>Note:</strong> Competitor pricing and limits accurate as of January 2026.
          Paper Network is free forever because it's built on P2P architecture where
          users share bandwidth—no server costs to pass on.
        </p>
      </div>
    </div>
  );
};

export default ComparisonMatrix;
