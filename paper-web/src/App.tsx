import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AppGrid } from './components/ui/AppGrid';
import { SetupCard } from './components/ui/SetupCard';
import { LogsView, LogEntry } from './components/ui/LogsView';
import { FileExplorer } from './components/ui/FileExplorer';
import { AppRenderer } from './components/ui/AppRenderer';
import { WebVMTerminal } from './components/ui/WebVMTerminal';
import { apps } from './lib/registry';
import { runtime } from './lib/runtime';
import { Plus } from 'lucide-react';

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
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Initialize Service Worker Gateway
  useEffect(() => {
      const handleGatewayMessage = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'GATEWAY_REQUEST') {
              const { domain, path } = event.data;
              const port = event.ports[0];
              
              const start = performance.now();
              try {
                  const result = await runtime.handleRequest(domain, path);
                  
                  // Log internal traffic too
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

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', handleGatewayMessage);
          navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW Registered'))
            .catch(e => console.error('SW Error', e));
      }
      return () => navigator.serviceWorker.removeEventListener('message', handleGatewayMessage);
  }, []);

  // Daemon Connection Logic (Optional for "Real TLD" users)
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');
      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
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
    <>
      {activeApp && (
          <AppRenderer domain={activeApp} onClose={() => setActiveApp(null)} />
      )}
      
      <WebVMTerminal />

      <div className="flex" style={{ height: '100vh', width: '100vw' }}>
      <Sidebar currentView={view} onNavigate={setView} />
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        <Header connected={connected} />
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {!connected && view === 'connect' ? (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <SetupCard />
                </div>
            ) : view === 'logs' ? (
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
                    {/* Pass handleOpenApp to open the App Renderer */}
                    <AppGrid apps={apps} onOpen={setActiveApp} />
                </div>
            )}
        </main>
      </div>
    </div>
    </>
  );
}

export default App;
