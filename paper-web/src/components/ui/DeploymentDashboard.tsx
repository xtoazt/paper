/**
 * Comprehensive Deployment Dashboard
 * Main dashboard for managing deployments, databases, and settings
 */

import { useState, useEffect } from 'react';
import { ProjectList } from './ProjectList';
import { DeploymentHistory } from './DeploymentHistory';
import { BuildLogs } from './BuildLogs';
import { EnvironmentVariables } from './EnvironmentVariables';
import { DomainSettings } from './DomainSettings';
import { DatabaseManager } from './DatabaseManager';
import { Analytics } from './Analytics';
import { TeamSettings } from './TeamSettings';

export function DeploymentDashboard() {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <div className="deployment-dashboard">
      <div className="dashboard-header">
        <h1>Paper Network Dashboard</h1>
        <p className="subtitle">Deploy to the decentralized web - $0 forever</p>
      </div>

      <div className="dashboard-nav">
        <button
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          📦 Projects
        </button>
        <button
          className={activeTab === 'deployments' ? 'active' : ''}
          onClick={() => setActiveTab('deployments')}
        >
          🚀 Deployments
        </button>
        <button
          className={activeTab === 'databases' ? 'active' : ''}
          onClick={() => setActiveTab('databases')}
        >
          🗄️ Databases
        </button>
        <button
          className={activeTab === 'domains' ? 'active' : ''}
          onClick={() => setActiveTab('domains')}
        >
          🌐 Domains
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'projects' && (
          <div className="tab-content">
            <ProjectList onSelect={setSelectedProject} />
          </div>
        )}

        {activeTab === 'deployments' && (
          <div className="tab-content">
            <DeploymentHistory projectId={selectedProject} />
            {selectedProject && <BuildLogs projectId={selectedProject} />}
          </div>
        )}

        {activeTab === 'databases' && (
          <div className="tab-content">
            <DatabaseManager />
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="tab-content">
            <DomainSettings projectId={selectedProject} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <Analytics projectId={selectedProject} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <EnvironmentVariables projectId={selectedProject} />
            <TeamSettings projectId={selectedProject} />
          </div>
        )}
      </div>

      <style>{`
        .deployment-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        .dashboard-nav {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #eee;
          padding-bottom: 0;
          overflow-x: auto;
        }

        .dashboard-nav button {
          padding: 1rem 1.5rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .dashboard-nav button:hover {
          color: #333;
          background: #f9f9f9;
        }

        .dashboard-nav button.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }

        .dashboard-content {
          min-height: 500px;
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .deployment-dashboard {
            padding: 1rem;
          }

          .dashboard-header h1 {
            font-size: 2rem;
          }

          .dashboard-nav {
            gap: 0.5rem;
          }

          .dashboard-nav button {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
