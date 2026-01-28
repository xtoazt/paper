/**
 * Services Dashboard
 * Unified dashboard for all Paper Network services
 */

import React, { useState, useEffect } from 'react';
import { getVPSService } from '../../lib/vps';
import { getDistributedDatabase } from '../../lib/database/distributed-db';
import { getDistributedCDN } from '../../lib/cdn/distributed-cdn';
import { getP2PTunnel } from '../../lib/tunneling/p2p-tunnel';
import { getDistributedCron } from '../../lib/cron/distributed-cron';
import { getOrchestrator } from '../../lib/compute/orchestrator';
import { getResourceManager } from '../../lib/compute/resource-manager';

export function ServicesDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const orchestrator = getOrchestrator();
    const resourceManager = getResourceManager();
    
    setStats({
      orchestrator: orchestrator.getStats(),
      resources: resourceManager.getStats()
    });
  };

  return (
    <div className="services-dashboard">
      <header className="dashboard-header">
        <h1>Paper Network Dashboard</h1>
        <p>Manage all your distributed services in one place</p>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'vps' ? 'active' : ''}
          onClick={() => setActiveTab('vps')}
        >
          🖥️ VPS
        </button>
        <button 
          className={activeTab === 'database' ? 'active' : ''}
          onClick={() => setActiveTab('database')}
        >
          🗄️ Database
        </button>
        <button 
          className={activeTab === 'cdn' ? 'active' : ''}
          onClick={() => setActiveTab('cdn')}
        >
          🌐 CDN
        </button>
        <button 
          className={activeTab === 'tunnel' ? 'active' : ''}
          onClick={() => setActiveTab('tunnel')}
        >
          🔒 Tunnels
        </button>
        <button 
          className={activeTab === 'cron' ? 'active' : ''}
          onClick={() => setActiveTab('cron')}
        >
          ⏰ Cron Jobs
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewPanel stats={stats} />}
        {activeTab === 'vps' && <VPSManager />}
        {activeTab === 'database' && <DatabaseManager />}
        {activeTab === 'cdn' && <CDNManager />}
        {activeTab === 'tunnel' && <TunnelManager />}
        {activeTab === 'cron' && <CronJobsManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>

      <style>{`
        .services-dashboard {
          max-width: 1600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .dashboard-header h1 {
          font-size: 3em;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dashboard-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          overflow-x: auto;
          padding-bottom: 10px;
        }
        .dashboard-tabs button {
          padding: 15px 30px;
          border: none;
          background: #f8f9fa;
          border-radius: 10px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .dashboard-tabs button:hover {
          background: #e9ecef;
        }
        .dashboard-tabs button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .dashboard-content {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

function OverviewPanel({ stats }: { stats: any }) {
  return (
    <div className="overview-panel">
      <h2>System Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🖥️</div>
          <div className="stat-value">{stats?.orchestrator?.nodes?.total || 0}</div>
          <div className="stat-label">Active Nodes</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{stats?.orchestrator?.tasks?.running || 0}</div>
          <div className="stat-label">Running Tasks</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-value">{stats?.resources?.usage?.memoryMB || 'N/A'}</div>
          <div className="stat-label">Memory Usage</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats?.resources?.usage?.cpuPercent || 'N/A'}</div>
          <div className="stat-label">CPU Usage</div>
        </div>
      </div>

      <div className="contribution-status">
        <h3>Your Contribution</h3>
        <p>Status: {stats?.resources?.activity?.isActive ? '🟡 Active' : '🟢 Idle'}</p>
        <p>Resources: {stats?.resources?.limits?.cpuCurrentPercent || '15%'} CPU, {stats?.resources?.limits?.memoryMB || '200 MB'} RAM</p>
        <p>Mode: Silent contribution enabled</p>
      </div>

      <style>{`
        .overview-panel h2 {
          margin-bottom: 30px;
          font-size: 2em;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
        }
        .stat-icon {
          font-size: 3em;
          margin-bottom: 10px;
        }
        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 1em;
          opacity: 0.9;
        }
        .contribution-status {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 15px;
        }
        .contribution-status h3 {
          margin-bottom: 15px;
        }
        .contribution-status p {
          margin: 10px 0;
          font-size: 1.1em;
        }
      `}</style>
    </div>
  );
}

function VPSManager() {
  const [vpsList, setVpsList] = useState<any[]>([]);

  useEffect(() => {
    const vpsService = getVPSService();
    setVpsList(vpsService.list());
  }, []);

  return (
    <div>
      <h2>VPS Instances</h2>
      <button className="btn-primary">+ Create VPS</button>
      <div className="vps-list">
        {vpsList.length === 0 && <p>No VPS instances yet. Create your first one!</p>}
        {vpsList.map(vps => (
          <div key={vps.id} className="vps-card">
            <h3>{vps.name}</h3>
            <p>Domain: {vps.domain}</p>
            <p>Status: {vps.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabaseManager() {
  return (
    <div>
      <h2>Databases</h2>
      <button className="btn-primary">+ Create Database</button>
      <p>No databases yet.</p>
    </div>
  );
}

function CDNManager() {
  return (
    <div>
      <h2>CDN Assets</h2>
      <button className="btn-primary">+ Upload Asset</button>
      <p>No assets yet.</p>
    </div>
  );
}

function TunnelManager() {
  return (
    <div>
      <h2>Active Tunnels</h2>
      <button className="btn-primary">+ Create Tunnel</button>
      <p>No tunnels yet.</p>
    </div>
  );
}

function CronJobsManager() {
  return (
    <div>
      <h2>Cron Jobs</h2>
      <button className="btn-primary">+ Schedule Job</button>
      <p>No cron jobs yet.</p>
    </div>
  );
}

function AnalyticsDashboard() {
  return (
    <div>
      <h2>Analytics</h2>
      <p>Real-time visitor statistics coming soon.</p>
    </div>
  );
}
