/**
 * Build Logs Component
 * Real-time build logs display
 */

import { useState, useEffect } from 'react';

export function BuildLogs({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<string[]>([
    '[00:00] Starting build...',
    '[00:01] Installing dependencies...',
    '[00:05] npm install complete',
    '[00:06] Running build command...',
    '[00:10] Build successful!',
    '[00:11] Uploading to IPFS...',
    '[00:15] Deployed to IPFS: QmXx...',
    '[00:16] ✓ Deployment complete!'
  ]);

  return (
    <div className="build-logs">
      <div className="logs-header">
        <h3>Build Logs</h3>
        <button className="download-btn">Download</button>
      </div>

      <div className="logs-container">
        {logs.map((log, index) => (
          <div key={index} className="log-line">
            {log}
          </div>
        ))}
      </div>

      <style>{`
        .build-logs {
          margin-top: 2rem;
          background: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #2d2d2d;
          border-bottom: 1px solid #3d3d3d;
        }

        .logs-header h3 {
          margin: 0;
          color: white;
          font-size: 1rem;
        }

        .download-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid #4d4d4d;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .download-btn:hover {
          background: #3d3d3d;
        }

        .logs-container {
          padding: 1rem 1.5rem;
          max-height: 400px;
          overflow-y: auto;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          font-size: 0.9rem;
        }

        .log-line {
          color: #d4d4d4;
          padding: 0.25rem 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .log-line:hover {
          background: #2d2d2d;
        }
      `}</style>
    </div>
  );
}
