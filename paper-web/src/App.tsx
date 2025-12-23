import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AppGrid } from './components/ui/AppGrid';
import { SetupCard } from './components/ui/SetupCard';
import { LogsView, LogEntry } from './components/ui/LogsView';
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
  const ws = useRef<WebSocket | null>(null);

  // Auto-connect loop
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        retryTimeout = setTimeout(connect, 2000);
      };

      socket.onerror = () => {};

      socket.onmessage = async (event) => {
        const start = performance.now();
        try {
          const data = JSON.parse(event.data) as RequestPayload;
          const host = data.headers['Host'] || '';
          const domain = host.split(':')[0];
          
          // Use Runtime for everything
          const result = await runtime.handleRequest(domain, data.path);
          
          const duration = Math.round(performance.now() - start);
          
          // Log it
          const logEntry: LogEntry = {
              id: data.id,
              timestamp: new Date(),
              method: data.method,
              domain,
              path: data.path,
              status: result.status,
              duration
          };
          setLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100

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

    return () => {
      ws.current?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div className="flex" style={{ height: '100vh', width: '100vw' }}>
      <Sidebar currentView={view} onNavigate={setView} />
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        <Header connected={connected} />
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {!connected ? (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                     <div className="flex justify-between items-center">
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Overview</h1>
                    </div>
                    <SetupCard />
                </div>
            ) : view === 'logs' ? (
                <LogsView logs={logs} />
            ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="flex justify-between items-center">
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Overview</h1>
                        <button className="btn btn-primary">
                            <Plus size={16} />
                            <span>New Project</span>
                        </button>
                    </div>
                    <AppGrid apps={apps} onOpen={() => {}} />
                </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default App;
