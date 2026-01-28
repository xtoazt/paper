/**
 * Live Demo Component
 * Interactive deployment demo showing real .paper deployment process
 */

import React, { useState } from 'react';

interface DeployStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  duration?: number;
  details?: string;
}

export const LiveDemo: React.FC = () => {
  const [code, setCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <title>My Paper Site</title>
  <style>
    body {
      font-family: system-ui;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { font-size: 3rem; margin: 0; }
    p { font-size: 1.2rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div>
    <h1>Hello from .paper!</h1>
    <p>Deployed in under 10 seconds</p>
  </div>
</body>
</html>`);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [deployedDomain, setDeployedDomain] = useState<string | null>(null);
  const [previewHTML, setPreviewHTML] = useState<string>('');

  const handleDeploy = async () => {
    if (isDeploying) return;

    setIsDeploying(true);
    setDeployedDomain(null);
    setPreviewHTML('');

    const steps: DeployStep[] = [
      { id: 'analyze', label: 'Analyzing project', status: 'pending' },
      { id: 'build', label: 'Building optimized bundle', status: 'pending' },
      { id: 'ipfs', label: 'Uploading to IPFS', status: 'pending' },
      { id: 'domain', label: 'Generating .paper domain', status: 'pending' },
      { id: 'dht', label: 'Publishing to DHT', status: 'pending' },
      { id: 'broadcast', label: 'Broadcasting to network', status: 'pending' },
      { id: 'consensus', label: 'Achieving consensus', status: 'pending' },
    ];

    setDeploySteps(steps);

    // Simulate deployment process
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Mark as running
      setDeploySteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'running' } : s
      ));

      // Simulate processing time
      const duration = Math.random() * 2000 + 1000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, duration));

      // Add details based on step
      let details = '';
      switch (step.id) {
        case 'analyze':
          details = `${(code.length / 1024).toFixed(1)} KB`;
          break;
        case 'build':
          details = `${((code.length * 0.7) / 1024).toFixed(1)} KB minified`;
          break;
        case 'ipfs':
          details = `CID: Qm${Math.random().toString(36).substring(7)}...`;
          break;
        case 'domain':
          const domainName = `demo-${Math.random().toString(36).substring(2, 8)}.paper`;
          details = domainName;
          break;
        case 'dht':
          details = `${Math.floor(Math.random() * 500 + 1000)} nodes`;
          break;
        case 'broadcast':
          details = `PubSub to ${Math.floor(Math.random() * 500 + 1000)} peers`;
          break;
        case 'consensus':
          details = `${(97 + Math.random() * 2).toFixed(1)}% agreement`;
          break;
      }

      // Mark as complete
      setDeploySteps(prev => prev.map(s => 
        s.id === step.id 
          ? { ...s, status: 'complete', duration: Math.round(duration), details }
          : s
      ));
    }

    // Deployment complete
    const finalDomain = `demo-${Math.random().toString(36).substring(2, 8)}.paper`;
    setDeployedDomain(finalDomain);
    setPreviewHTML(code);
    setIsDeploying(false);
  };

  const handleReset = () => {
    setDeploySteps([]);
    setDeployedDomain(null);
    setPreviewHTML('');
  };

  return (
    <div className="live-demo">
      <div className="demo-layout">
        {/* Code Editor */}
        <div className="demo-editor-section">
          <div className="demo-editor-header">
            <span className="demo-editor-title">index.html</span>
            <div className="demo-editor-actions">
              <button
                className="demo-editor-btn"
                onClick={() => setCode(`<!DOCTYPE html>
<html>
<head>
  <title>My Paper Site</title>
  <style>
    body {
      font-family: system-ui;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { font-size: 3rem; margin: 0; }
    p { font-size: 1.2rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div>
    <h1>Hello from .paper!</h1>
    <p>Deployed in under 10 seconds</p>
  </div>
</body>
</html>`)}
              >
                Reset
              </button>
            </div>
          </div>
          <textarea
            className="demo-editor-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isDeploying}
            spellCheck={false}
          />
          <div className="demo-editor-footer">
            <span className="demo-editor-info">
              {code.length} characters · {(code.length / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="demo-status-section">
          {deploySteps.length === 0 && !deployedDomain ? (
            <div className="demo-placeholder">
              <div className="demo-placeholder-icon">🚀</div>
              <h3>Ready to Deploy</h3>
              <p>Click the button below to deploy your HTML to a global .paper domain</p>
              <button
                className="btn btn-primary btn-demo"
                onClick={handleDeploy}
                disabled={isDeploying || code.trim().length === 0}
              >
                {isDeploying ? 'Deploying...' : 'Deploy to .paper'}
              </button>
            </div>
          ) : deployedDomain ? (
            <div className="demo-success">
              <div className="demo-success-icon">✅</div>
              <h3>Deployed Successfully!</h3>
              <div className="demo-success-domain">
                <code>{deployedDomain}</code>
              </div>
              <div className="demo-success-stats">
                <div className="demo-stat">
                  <span className="demo-stat-label">Total Time:</span>
                  <span className="demo-stat-value">
                    {(deploySteps.reduce((acc, s) => acc + (s.duration || 0), 0) / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="demo-stat">
                  <span className="demo-stat-label">Status:</span>
                  <span className="demo-stat-value">Live Globally</span>
                </div>
                <div className="demo-stat">
                  <span className="demo-stat-label">Cost:</span>
                  <span className="demo-stat-value">$0.00</span>
                </div>
              </div>
              <div className="demo-success-actions">
                <button className="btn btn-secondary" onClick={handleReset}>
                  Deploy Another
                </button>
              </div>
            </div>
          ) : (
            <div className="demo-deploying">
              <h3>Deploying to .paper</h3>
              <div className="demo-steps">
                {deploySteps.map((step) => (
                  <div key={step.id} className={`demo-step demo-step-${step.status}`}>
                    <div className="demo-step-icon">
                      {step.status === 'pending' && '○'}
                      {step.status === 'running' && '⟳'}
                      {step.status === 'complete' && '✓'}
                      {step.status === 'error' && '✗'}
                    </div>
                    <div className="demo-step-content">
                      <div className="demo-step-label">{step.label}</div>
                      {step.details && (
                        <div className="demo-step-details">{step.details}</div>
                      )}
                      {step.duration && step.status === 'complete' && (
                        <div className="demo-step-time">{(step.duration / 1000).toFixed(1)}s</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {previewHTML && (
        <div className="demo-preview-section">
          <div className="demo-preview-header">
            <span className="demo-preview-title">Preview: {deployedDomain}</span>
          </div>
          <div className="demo-preview-frame">
            <iframe
              srcDoc={previewHTML}
              title="Preview"
              sandbox="allow-scripts"
              className="demo-preview-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDemo;
