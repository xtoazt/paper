/**
 * Network Status Component
 * Real-time P2P network statistics and health monitoring
 */

import React, { useState, useEffect } from 'react';
import { getNodeManager } from '../../lib/node';
import { getGlobalRegistry } from '../../lib/domains/global-registry';
import { getBootstrapManager } from '../../lib/bootstrap';

interface NetworkStats {
  p2pConnected: boolean;
  peerCount: number;
  ipfsConnected: boolean;
  ipfsSize: string;
  dhtRecords: number;
  tunnelCount: number;
  bootstrapSource: string;
  uptime: number;
}

export const NetworkStatus: React.FC = () => {
  const [stats, setStats] = useState<NetworkStats>({
    p2pConnected: false,
    peerCount: 0,
    ipfsConnected: false,
    ipfsSize: '0 MB',
    dhtRecords: 0,
    tunnelCount: 0,
    bootstrapSource: 'Unknown',
    uptime: 0
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshStats = async () => {
    setIsRefreshing(true);

    try {
      const nodeManager = getNodeManager();
      // Old API methods removed, use new API
      const libp2pNode = null; // await nodeManager.getLibp2pNode();
      const ipfsNode = null; // await nodeManager.getIpfsNode();
      const tunnelManager = null; // await nodeManager.getTunnelManager();
      const globalRegistry = getGlobalRegistry(
        null as any,
        null as any,
        libp2pNode,
        null as any
      );
      const bootstrapManager = getBootstrapManager();

      // Get P2P stats
      const p2pConnected = libp2pNode.isRunning();
      const peerCount = 0; // libp2pNode.getPeerCount(); - TODO: implement

      // Get IPFS stats
      const ipfsConnected = ipfsNode !== null;
      let ipfsSize = '0 MB';
      
      if (ipfsNode) {
        try {
          const repoStats = await ipfsNode.repo.stat();
          const sizeMB = (Number(repoStats.repoSize) / 1024 / 1024).toFixed(2);
          ipfsSize = `${sizeMB} MB`;
        } catch (e) {
          // Ignore
        }
      }

      // Get DHT stats
      const registryStats = await globalRegistry.getStats();
      const dhtRecords = registryStats.localRecords || 0;

      // Get tunnel stats
      const tunnelCount = tunnelManager?.getActiveTunnels()?.length || 0;

      // Get bootstrap stats
      const bootstrapStats = bootstrapManager.getStats();
      const bootstrapSource = bootstrapStats.successfulSources[0]?.id || 'Unknown';

      // Calculate uptime
      const uptime = Math.floor((Date.now() - lastUpdate) / 1000);

      setStats({
        p2pConnected,
        peerCount,
        ipfsConnected,
        ipfsSize,
        dhtRecords,
        tunnelCount,
        bootstrapSource,
        uptime
      });

      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="network-status card">
      <div className="header">
        <h2 className="title">Network Status</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={refreshStats}
          disabled={isRefreshing}
        >
          {isRefreshing ? '⟳' : '↻'} Refresh
        </button>
      </div>

      <div className="stats-grid">
        {/* P2P Status */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🌐</span>
            <span className={`status-indicator ${stats.p2pConnected ? 'online' : 'offline'}`}></span>
          </div>
          <div className="stat-value">{stats.peerCount}</div>
          <div className="stat-label">Connected Peers</div>
        </div>

        {/* IPFS Status */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">💾</span>
            <span className={`status-indicator ${stats.ipfsConnected ? 'online' : 'offline'}`}></span>
          </div>
          <div className="stat-value">{stats.ipfsSize}</div>
          <div className="stat-label">IPFS Storage</div>
        </div>

        {/* DHT Records */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-value">{stats.dhtRecords}</div>
          <div className="stat-label">DHT Records</div>
        </div>

        {/* Tunnels */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🔒</span>
          </div>
          <div className="stat-value">{stats.tunnelCount}</div>
          <div className="stat-label">Active Tunnels</div>
        </div>
      </div>

      <div className="details">
        <div className="detail-row">
          <span className="detail-label">Bootstrap Source:</span>
          <span className="detail-value font-mono">{stats.bootstrapSource}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Uptime:</span>
          <span className="detail-value">{formatUptime(stats.uptime)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Network Health:</span>
          <span className="detail-value">
            {stats.p2pConnected && stats.ipfsConnected ? (
              <span className="badge badge-success">Healthy</span>
            ) : (
              <span className="badge badge-error">Degraded</span>
            )}
          </span>
        </div>
      </div>

    </div>
  );
};

export default NetworkStatus;
