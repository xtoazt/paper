import { useState, useEffect, useRef } from 'react'
import './index.css'

interface RequestPayload {
  id: string;
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

interface ResponsePayload {
  id: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, []);

  const connect = () => {
    // In a real scenario, port might be configurable or discovered
    const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');

    socket.onopen = () => {
      setConnected(true);
      log('Connected to Paper Proxy');
    };

    socket.onclose = () => {
      setConnected(false);
      log('Disconnected from Paper Proxy');
      // Retry connection
      setTimeout(connect, 3000);
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data) as RequestPayload;
        log(`Request: ${data.method} ${data.url}`);
        
        // Handle Request
        const response = await handleRequest(data);
        
        // Send Response
        socket.send(JSON.stringify(response));
      } catch (e) {
        console.error("Error processing message", e);
      }
    };

    ws.current = socket;
  };

  const log = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 50)]);
  };

  const handleRequest = async (req: RequestPayload): Promise<ResponsePayload> => {
    // Logic to route based on hostname
    // req.headers['Host'] -> e.g. blog.paper:8080
    const host = req.headers['Host'] || '';
    const domain = host.split(':')[0]; // remove port

    let body = `
      <html>
        <head>
           <style>body { font-family: sans-serif; padding: 2rem; background: #eee; color: #333; }</style>
        </head>
        <body>
           <h1>Paper</h1>
           <p>You accessed: <strong>${domain}</strong></p>
           <p>Path: ${req.path}</p>
        </body>
      </html>`;
    
    if (domain === 'blog.paper') {
        body = `
           <html>
            <head>
               <style>body { font-family: serif; padding: 2rem; background: white; color: black; max-width: 600px; margin: 0 auto; }</style>
            </head>
            <body>
               <h1>My Blog</h1>
               <p>Welcome to the blog hosted on Paper.</p>
               <hr/>
               <p>This content is served from the WebVM in your other tab!</p>
            </body>
          </html>
        `;
    } else if (domain === 'shop.paper') {
        body = `
           <html>
            <head>
               <style>body { font-family: sans-serif; padding: 2rem; background: #f0f0f0; color: #111; }</style>
            </head>
            <body>
               <h1>My Shop</h1>
               <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                  <div style="background: white; padding: 1rem;">Product A</div>
                  <div style="background: white; padding: 1rem;">Product B</div>
                  <div style="background: white; padding: 1rem;">Product C</div>
               </div>
            </body>
          </html>
        `;
    }

    return {
      id: req.id,
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Server': 'Paper-WebVM'
      },
      body
    };
  };

  return (
    <div>
      <header style={{display: 'flex', alignItems: 'center', marginBottom: '4rem'}}>
        <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
        <h1 style={{margin: 0}}>Paper</h1>
      </header>

      <div style={{marginBottom: '3rem'}}>
        <p style={{fontSize: '1.2em', color: '#ccc'}}>
            Local Ingress: 
            <span style={{fontFamily: 'monospace', marginLeft: '10px', color: 'white'}}>
                {connected ? 'Active (127.0.0.1:8080)' : 'Waiting...'}
            </span>
        </p>
        {!connected && (
            <div style={{border: '1px solid #333', padding: '1.5rem', marginTop: '1rem'}}>
                <p style={{marginTop: 0}}>To start the ingress, run this in your terminal:</p>
                <pre>python3 paper-proxy/src/main.py</pre>
            </div>
        )}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem'}}>
        <div>
            <h2>Active Routes</h2>
            <p style={{color: '#666', marginBottom: '1rem'}}>Access these domains to see Paper in action:</p>
            <ul style={{listStyle: 'none', padding: 0}}>
                <li style={{borderBottom: '1px solid #333', padding: '1rem 0', display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontFamily: 'monospace'}}>blog.paper:8080</span> 
                    <span style={{color: '#666'}}>&rarr; Demo Blog</span>
                </li>
                <li style={{borderBottom: '1px solid #333', padding: '1rem 0', display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontFamily: 'monospace'}}>shop.paper:8080</span> 
                    <span style={{color: '#666'}}>&rarr; Demo Shop</span>
                </li>
                 <li style={{borderBottom: '1px solid #333', padding: '1rem 0', display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontFamily: 'monospace'}}>*.paper:8080</span> 
                    <span style={{color: '#666'}}>&rarr; Default Handler</span>
                </li>
            </ul>
        </div>
        
        <div>
            <h2>Logs</h2>
            <div style={{
                fontFamily: 'monospace', 
                fontSize: '0.9em', 
                color: '#888', 
                height: '300px', 
                overflowY: 'auto',
                border: '1px solid #222',
                padding: '1rem'
            }}>
                {logs.length === 0 && <span style={{color: '#444'}}>Waiting for requests...</span>}
                {logs.map((l, i) => (
                    <div key={i} style={{marginBottom: '0.5rem'}}>{l}</div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}

export default App

