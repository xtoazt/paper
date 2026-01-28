/**
 * Database Manager Component
 * Create and manage databases
 */

import { useState } from 'react';

export function DatabaseManager() {
  const [databases, setDatabases] = useState([
    {
      id: '1',
      name: 'my-app-db',
      type: 'PostgreSQL',
      size: '245 MB',
      created: '2 days ago',
      status: 'active'
    },
    {
      id: '2',
      name: 'cache',
      type: 'Redis',
      size: '12 MB',
      created: '1 week ago',
      status: 'active'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="database-manager">
      <div className="manager-header">
        <h2>Databases</h2>
        <button
          className="create-db-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Database
        </button>
      </div>

      <div className="databases-grid">
        {databases.map(db => (
          <div key={db.id} className="database-card">
            <div className="db-header">
              <h3>{db.name}</h3>
              <span className="db-type">{db.type}</span>
            </div>

            <div className="db-stats">
              <div className="stat">
                <span className="stat-label">Size</span>
                <span className="stat-value">{db.size}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Created</span>
                <span className="stat-value">{db.created}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Status</span>
                <span className="stat-value status-active">{db.status}</span>
              </div>
            </div>

            <div className="db-actions">
              <button className="action-btn">Connect</button>
              <button className="action-btn">Backup</button>
              <button className="action-btn danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .database-manager {
          padding: 2rem;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .manager-header h2 {
          font-size: 1.5rem;
          margin: 0;
        }

        .create-db-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .databases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .database-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .db-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .db-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .db-type {
          padding: 0.25rem 0.75rem;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .db-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .stat-value {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .status-active {
          color: #10b981;
        }

        .db-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
        }

        .action-btn.danger {
          color: #ef4444;
          border-color: #fee2e2;
        }

        .action-btn.danger:hover {
          background: #fee2e2;
        }
      `}</style>
    </div>
  );
}
