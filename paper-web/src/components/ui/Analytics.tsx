/**
 * Analytics Component
 * Display application analytics and metrics
 */

export function Analytics({ projectId }: { projectId: string | null }) {
  const stats = {
    requests: '124.5K',
    bandwidth: '2.4 GB',
    latency: '42ms',
    uptime: '99.99%'
  };

  return (
    <div className="analytics">
      <h2>Analytics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.requests}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <span className="stat-value">{stats.bandwidth}</span>
            <span className="stat-label">Bandwidth Used</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">{stats.latency}</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <span className="stat-value">{stats.uptime}</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </div>

      <div className="chart-placeholder">
        <p>📈 Interactive charts coming soon!</p>
        <p className="subtitle">Request graphs, geographic distribution, and more</p>
      </div>

      <style>{`
        .analytics {
          padding: 2rem;
        }

        .analytics h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #111827;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .chart-placeholder {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 4rem 2rem;
          text-align: center;
        }

        .chart-placeholder p {
          font-size: 1.5rem;
          margin: 0;
        }

        .chart-placeholder .subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
