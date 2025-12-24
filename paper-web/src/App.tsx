import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AppGrid } from './components/ui/AppGrid';
import { LogsView, LogEntry } from './components/ui/LogsView';
import { FileExplorer } from './components/ui/FileExplorer';
import { WebVMTerminal } from './components/ui/WebVMTerminal';
import { apps } from './lib/registry';
import { runtime } from './lib/runtime';
import { Plus, ShieldCheck, CheckCircle } from 'lucide-react';

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
  const [view, setView] = useState('overview');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // AUTO-BOOT: Register Service Worker immediately (No user interaction)
  useEffect(() => {
      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => {
                console.log('[Paper] Service Worker Auto-Registered');
                // Force update
                reg.update();
                // Assume "connected" since SW handles routing
                setConnected(true);
            })
            .catch(e => console.error('[Paper] SW Registration Failed:', e));
      }

      // Setup Gateway Message Handler
      const handleGatewayMessage = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'GATEWAY_REQUEST') {
              const { domain, path } = event.data;
              const port = event.ports[0];
              
              const start = performance.now();
              try {
                  const result = await runtime.handleRequest(domain, path);
                  
                  const duration = Math.round(performance.now() - start);
                  setLogs(prev => [{
                      id: Math.random().toString(),
                      timestamp: new Date(),
                      method: 'GET',
                      domain,
                      path,
                      status: result.status,
                      duration
                  }, ...prev].slice(0, 100));

                  port.postMessage(result);
              } catch (e: any) {
                  port.postMessage({ error: e.message });
              }
          }
      };

      navigator.serviceWorker.addEventListener('message', handleGatewayMessage);
      
      return () => navigator.serviceWorker.removeEventListener('message', handleGatewayMessage);
  }, []);

  // Also try Daemon (for users who want native TLD)
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');
      socket.onopen = () => {
          setConnected(true);
          console.log('[Paper] Daemon Connected (Native Mode)');
      };
      socket.onclose = () => {
          retryTimeout = setTimeout(connect, 2000);
      };
      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as RequestPayload;
          const host = data.headers['Host'] || '';
          const domain = host.split(':')[0];
          
          const start = performance.now();
          const result = await runtime.handleRequest(domain, data.path);
          const duration = Math.round(performance.now() - start);
          
          setLogs(prev => [{
              id: data.id,
              timestamp: new Date(),
              method: data.method,
              domain,
              path: data.path,
              status: result.status,
              duration
          }, ...prev].slice(0, 100));

          socket.send(JSON.stringify({
            id: data.id,
            ...result
          }));
        } catch (e) {
          console.error(e);
        }
      };
      ws.current = socket;
    };
    connect();
    return () => { ws.current?.close(); clearTimeout(retryTimeout); };
  }, []);

  return (
    <div className="flex" style={{ height: '100vh', width: '100vw' }}>
      <WebVMTerminal />
      <Sidebar currentView={view} onNavigate={setView} />
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        <Header connected={connected} />
        
        {/* Privacy Banner */}
        <div style={{ background: '#000', borderBottom: '1px solid #333', padding: '0.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} color="#00ff00" />
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                <strong style={{ color: '#fff' }}>Auto-Running:</strong> Service Worker active. 
                <code style={{ marginLeft: '0.5rem', color: '#00ff00' }}>*.paper</code> domains work immediately.
            </span>
        </div>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {view === 'logs' ? (
                <LogsView logs={logs} />
            ) : view === 'files' ? (
                <FileExplorer />
            ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="flex justify-between items-center">
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Overview</h1>
                        <button className="btn btn-primary">
                            <Plus size={16} />
                            <span>New Project</span>
                        </button>
                    </div>
                    
                    {connected && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#00ff00', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={16} />
                            <strong>System Active:</strong> All <code>*.paper</code> domains are resolving. 
                            Click "Open App" to launch in a new tab.
                        </div>
                    )}
                    
                    <AppGrid apps={apps} onOpen={(domain) => {
                        // Open in new tab - Service Worker will intercept it
                        window.open(`http://${domain}`, '_blank');
                    }} />
                </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
