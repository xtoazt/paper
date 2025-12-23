import { useState, useEffect, useRef } from 'react';
import './index.css';
import { Terminal } from './components/Terminal';
import { CopyInstallBlock } from './components/Bootstrap';
import { VirtualBrowser } from './components/VirtualBrowser';
import { apps, defaultHandler, ResponseData, createRepoApp, registerApp } from './lib/registry';

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
  const [repoUrl, setRepoUrl] = useState('');
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [virtualDomain, setVirtualDomain] = useState<string | null>(null);
  // Force update to re-render when apps list changes
  const [, setTick] = useState(0);  
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
        // Handle sync or async
        const possiblePromise = app.handler(req.path, req.headers);
        if (possiblePromise instanceof Promise) {
            result = await possiblePromise;
        } else {
            result = possiblePromise;
        }
    } else {
        result = defaultHandler(domain);
    }

    return {
      id: req.id,
      ...result
    };
  };

  const handleImport = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!repoUrl) return;

      setLoadingRepo(true);
      log('SYSTEM', `Fetching repo ${repoUrl}...`);
      try {
          const app = await createRepoApp(repoUrl);
          registerApp(app);
          log('SYSTEM', `Registered new app: ${app.domain}`);
          
          // Send registration command to Proxy
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
             ws.current.send(JSON.stringify({
                 type: 'register_domain',
                 domain: app.domain
             }));
             log('SYSTEM', `Requested DNS registration for ${app.domain}`);
          }
          
          setRepoUrl('');
          setTick(t => t + 1);
      } catch (err: any) {
          log('ERROR', `Failed to import repo: ${err.message}`);
          alert(`Failed to import: ${err.message}`);
      } finally {
          setLoadingRepo(false);
      }
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
                <CopyInstallBlock />
              </div>
            )}

            {apps.map(app => (
              <div key={app.domain} className="app-card">
                <div className="app-card-header">
                  <span className="app-domain">{app.domain}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setVirtualDomain(app.domain)}
                        style={{ border: '1px solid #444', background: 'transparent', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                    >
                        Virtual View
                    </button>
                    <a 
                        href={`http://${app.domain}:8080`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="app-link"
                    >
                        Direct ↗
                    </a>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#888' }}>{app.description}</p>
              </div>
            ))}
            
            <div className="app-card" style={{ borderStyle: 'dashed', opacity: loadingRepo ? 0.5 : 1 }}>
               <div className="app-card-header">
                  <span className="app-domain">Import Repository</span>
               </div>
               <form onSubmit={handleImport} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input 
                        type="text" 
                        placeholder="user/repo" 
                        value={repoUrl}
                        onChange={e => setRepoUrl(e.target.value)}
                        disabled={loadingRepo}
                        style={{ background: 'transparent', border: '1px solid #333', color: 'white', padding: '0.5rem', flex: 1 }}
                    />
                    <button type="submit" disabled={loadingRepo || !repoUrl}>
                        {loadingRepo ? '...' : '+'}
                    </button>
               </form>
            </div>
          </div>

          <div className="right-panel">
            <h2>System Logs</h2>
            <Terminal logs={logs} />
          </div>
        </div>
      </main>
      
      {virtualDomain && (
          <VirtualBrowser domain={virtualDomain} onClose={() => setVirtualDomain(null)} />
      )}
    </>
  );
}

export default App;
