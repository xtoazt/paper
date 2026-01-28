/**
 * Deployment History Component
 * Show deployment history with status and details
 */

interface Deployment {
  id: string;
  commit: string;
  branch: string;
  status: 'success' | 'building' | 'failed';
  duration: string;
  deployed: string;
  url: string;
}

export function DeploymentHistory({ projectId }: { projectId: string | null }) {
  const deployments: Deployment[] = [
    {
      id: '1',
      commit: 'feat: Add new homepage',
      branch: 'main',
      status: 'success',
      duration: '2m 14s',
      deployed: '2 hours ago',
      url: 'my-website.paper'
    },
    {
      id: '2',
      commit: 'fix: Update API endpoints',
      branch: 'main',
      status: 'success',
      duration: '1m 52s',
      deployed: '1 day ago',
      url: 'my-website.paper'
    },
    {
      id: '3',
      commit: 'chore: Update dependencies',
      branch: 'develop',
      status: 'failed',
      duration: '45s',
      deployed: '2 days ago',
      url: 'preview-123.my-website.paper'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✓';
      case 'building': return '⟳';
      case 'failed': return '✗';
      default: return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'building': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="deployment-history">
      <h2>Deployment History</h2>

      <div className="deployments-list">
        {deployments.map(deployment => (
          <div key={deployment.id} className="deployment-item">
            <div
              className="status-icon"
              style={{ backgroundColor: getStatusColor(deployment.status) }}
            >
              {getStatusIcon(deployment.status)}
            </div>

            <div className="deployment-details">
              <div className="deployment-header">
                <span className="commit-message">{deployment.commit}</span>
                <span className="deployment-time">{deployment.deployed}</span>
              </div>

              <div className="deployment-meta">
                <span className="branch">🌿 {deployment.branch}</span>
                <span className="duration">⏱️ {deployment.duration}</span>
                <a href={`https://${deployment.url}`} className="deployment-url">
                  {deployment.url}
                </a>
              </div>
            </div>

            <div className="deployment-actions">
              <button className="action-btn">Logs</button>
              <button className="action-btn">Rollback</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .deployment-history {
          padding: 2rem;
        }

        .deployment-history h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .deployments-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .deployment-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .deployment-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .status-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .deployment-details {
          flex: 1;
        }

        .deployment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .commit-message {
          font-weight: 600;
          color: #111827;
        }

        .deployment-time {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .deployment-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .branch {
          font-weight: 500;
        }

        .deployment-url {
          color: #667eea;
          text-decoration: none;
        }

        .deployment-url:hover {
          text-decoration: underline;
        }

        .deployment-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #667eea;
          color: #667eea;
        }
      `}</style>
    </div>
  );
}
