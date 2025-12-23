import { useState, useEffect, useRef } from 'react';
import './index.css';
import { Terminal } from './components/Terminal';
import { apps, defaultHandler, ResponseData } from './lib/registry';

interface RequestPayload {
  id: string;
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // Auto-connect loop
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      // For GitHub Actions deployment, we need to know where localhost is. 
      // It's always localhost for the user.
      const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');

      socket.onopen = () => {
        setConnected(true);
        log('SYSTEM', 'Control Channel Established');
      };

      socket.onclose = () => {
        if (connected) log('SYSTEM', 'Control Channel Disconnected');
        setConnected(false);
        retryTimeout = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
         // Silent fail on error, will retry on close
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as RequestPayload;
          const host = data.headers['Host'] || 'unknown';
          log('PROXY', `${data.method} ${host}${data.path}`);
          
          const response = await handleRequest(data);
          socket.send(JSON.stringify(response));
        } catch (e) {
          console.error("Error processing message", e);
        }
      };

      ws.current = socket;
    };

    connect();

    return () => {
      ws.current?.close();
      clearTimeout(retryTimeout);
    };
  }, []); // Remove dependency on 'connected' to avoid re-triggering loops

  const log = (source: string, msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [`[${time}] [${source}] ${msg}`, ...prev.slice(0, 100)]);
  };

  const handleRequest = async (req: RequestPayload): Promise<ResponseData & { id: string }> => {
    const host = req.headers['Host'] || '';
    const domain = host.split(':')[0]; // remove port

    const app = apps.find(a => a.domain === domain);
    let result: ResponseData;

    if (app) {
        result = app.handler(req.path, req.headers);
    } else {
        result = defaultHandler(domain);
    }

    return {
      id: req.id,
      ...result
    };
  };

  return (
    <>
      <header>
        <div className="container header-content">
          <h1>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            Paper
          </h1>
          <div className="status-badge">
            <div className={`status-dot ${connected ? 'connected' : ''}`}></div>
            {connected ? 'Ingress Active' : 'Connecting...'}
          </div>
        </div>
      </header>

      <main className="container">
        <div className="grid">
          <div className="left-panel">
            <h2>Active Runtimes</h2>
            
            {!connected && (
              <div className="setup-guide">
                <p><strong>Local Ingress Required</strong></p>
                <p>To bridge <code>*.paper</code> domains to this browser tab, run the helper:</p>
                <pre>python3 paper-proxy/src/main.py --port 8080</pre>
                <p><small>Or use <code>sudo</code> for port 80/443 auto-config.</small></p>
              </div>
            )}

            {apps.map(app => (
              <div key={app.domain} className="app-card">
                <div className="app-card-header">
                  <span className="app-domain">{app.domain}</span>
                  <a 
                    href={`http://${app.domain}:8080`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="app-link"
                  >
                    Open ↗
                  </a>
                </div>
                <p style={{ margin: 0, color: '#888' }}>{app.description}</p>
              </div>
            ))}
            
            <div className="app-card" style={{ borderStyle: 'dashed', opacity: 0.6 }}>
               <div className="app-card-header">
                  <span className="app-domain">new-project.paper</span>
               </div>
               <p style={{ margin: 0, color: '#666' }}>Drag & drop repo URL to deploy...</p>
            </div>
          </div>

          <div className="right-panel">
            <h2>System Logs</h2>
            <Terminal logs={logs} />
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
