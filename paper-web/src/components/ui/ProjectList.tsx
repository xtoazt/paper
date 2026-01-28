/**
 * Project List Component
 * Display and manage projects
 */

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  framework: string;
  domain: string;
  status: 'active' | 'building' | 'error';
  lastDeployed: string;
  deployments: number;
}

export function ProjectList({ onSelect }: { onSelect: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'my-website',
      framework: 'React',
      domain: 'my-website.paper',
      status: 'active',
      lastDeployed: '2 hours ago',
      deployments: 42
    },
    {
      id: '2',
      name: 'api-server',
      framework: 'Express',
      domain: 'api-server.paper',
      status: 'active',
      lastDeployed: '1 day ago',
      deployments: 15
    },
    {
      id: '3',
      name: 'blog',
      framework: 'Next.js',
      domain: 'blog.paper',
      status: 'building',
      lastDeployed: 'Just now',
      deployments: 8
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'building': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="project-list">
      <div className="list-header">
        <h2>Your Projects</h2>
        <button className="new-project-btn">+ New Project</button>
      </div>

      <div className="projects-grid">
        {projects.map(project => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => onSelect(project.id)}
          >
            <div className="project-header">
              <h3>{project.name}</h3>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(project.status) }}
              >
                {project.status}
              </span>
            </div>

            <div className="project-info">
              <div className="info-row">
                <span className="label">Framework:</span>
                <span className="value">{project.framework}</span>
              </div>
              <div className="info-row">
                <span className="label">Domain:</span>
                <span className="value">{project.domain}</span>
              </div>
              <div className="info-row">
                <span className="label">Last deployed:</span>
                <span className="value">{project.lastDeployed}</span>
              </div>
              <div className="info-row">
                <span className="label">Total deployments:</span>
                <span className="value">{project.deployments}</span>
              </div>
            </div>

            <div className="project-actions">
              <button className="action-btn">View</button>
              <button className="action-btn">Redeploy</button>
              <button className="action-btn">Settings</button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .project-list {
          padding: 2rem;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .list-header h2 {
          font-size: 1.8rem;
          margin: 0;
        }

        .new-project-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .new-project-btn:hover {
          transform: translateY(-2px);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .project-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .project-card:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .project-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .project-info {
          margin-bottom: 1.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-row .label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .info-row .value {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .project-actions {
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
          transition: all 0.2s;
          font-size: 0.9rem;
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
