/**
 * Domain Settings Component
 * Manage custom domains and DNS settings
 */

import { useState } from 'react';

export function DomainSettings({ projectId }: { projectId: string | null }) {
  const [domains] = useState([
    { domain: 'my-website.paper', type: 'Paper Domain', ssl: true, primary: true },
    { domain: 'example.com', type: 'Custom Domain', ssl: true, primary: false },
    { domain: 'www.example.com', type: 'Custom Domain', ssl: true, primary: false }
  ]);

  return (
    <div className="domain-settings">
      <h2>Domains</h2>

      <div className="add-domain-section">
        <input type="text" placeholder="yourdomain.com" className="domain-input" />
        <button className="add-domain-btn">Add Domain</button>
      </div>

      <div className="domains-list">
        {domains.map((d, index) => (
          <div key={index} className="domain-item">
            <div className="domain-info">
              <span className="domain-name">{d.domain}</span>
              <span className="domain-type">{d.type}</span>
              {d.primary && <span className="primary-badge">Primary</span>}
            </div>

            <div className="domain-status">
              {d.ssl && <span className="ssl-badge">🔒 SSL</span>}
              <button className="settings-btn">Settings</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .domain-settings {
          padding: 2rem;
        }

        .domain-settings h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .add-domain-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .domain-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 1rem;
        }

        .add-domain-btn {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .domains-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .domain-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .domain-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .domain-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .domain-type {
          padding: 0.25rem 0.75rem;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .primary-badge {
          padding: 0.25rem 0.75rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .domain-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .ssl-badge {
          color: #10b981;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .settings-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
        }

        .settings-btn:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}
