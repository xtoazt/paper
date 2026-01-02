import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AppGrid } from './components/ui/AppGrid';
import { LogsView, LogEntry } from './components/ui/LogsView';
import { FileExplorer } from './components/ui/FileExplorer';
import { WebVMTerminal } from './components/ui/WebVMTerminal';
import { pyodideProxyServer } from './lib/pyodide-proxy-server';
import { VMStatus } from './components/ui/VMStatus';
import { SecurityDashboard } from './components/ui/SecurityDashboard';
import { DeploymentLogsView } from './components/ui/DeploymentLogsView';
import { ImportModal } from './components/ui/ImportModal';
import { DashboardSettings } from './components/ui/DashboardSettings';
import { DomainManager } from './components/ui/DomainManager';
import { unbreakableWall } from './lib/unbreakable-wall';
import { unbreakableFirewall } from './lib/unbreakable-firewall';
import { paperSelfHost } from './lib/paper-self-host';
import { firewall } from './lib/firewall';
import { apps } from './lib/registry';
import { runtime } from './lib/runtime';
import { NavigationInterceptor } from './lib/navigation-interceptor';
import { antiAccess } from './lib/anti-access';
import { BrowserExploit } from './lib/browser-exploit';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [appsList, setAppsList] = useState(apps);
  const ws = useRef<WebSocket | null>(null);

  // AUTO-BOOT: Service Worker + Navigation Interceptor + Anti-Access + Browser Exploit
  useEffect(() => {
      // Enable aggressive browser exploitation FIRST
      BrowserExploit.getInstance().exploit();
      BrowserExploit.getInstance().interceptAddressBar();
      
      // Enable unbreakable firewall (MOST STRICT - cannot be broken)
      unbreakableFirewall.enable();
      
      // Enable unbreakable wall (additional layer)
      unbreakableWall.enable();
      
      // Initialize self-hosting for paper.paper
      paperSelfHost.initialize();
      
      // Enable anti-access protection (invisibrowse-inspired)
      antiAccess.enable();
      
      // Initialize navigation interceptor (handles address bar, links, etc.)
      NavigationInterceptor.getInstance().init();
      
      if ('serviceWorker' in navigator) {
          // Register with maximum priority
          navigator.serviceWorker.register('/sw.js', { 
              scope: '/',
              updateViaCache: 'none'
          })
            .then(reg => {
                console.log('[Paper] Service Worker Auto-Running');
                
                // Force immediate activation
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                if (reg.installing) {
                    reg.installing.addEventListener('statechange', function() {
                        if (this.state === 'installed' && navigator.serviceWorker.controller) {
                            this.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
                
                // Update and claim
                reg.update();
                navigator.serviceWorker.ready.then(() => {
                    setConnected(true); // SW is our "daemon"
                    console.log('[Paper] Service Worker Ready and Controlling');
                });
            })
            .catch(e => console.error('[Paper] SW Failed:', e));
      }

      // Handle requests from Service Worker
      const handleGatewayMessage = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'GATEWAY_REQUEST') {
              const { domain, path, method, headers } = event.data;
              const port = event.ports[0];
              
              // Firewall check
              const firewallCheck = firewall.checkRequest(domain, path, headers || {}, method || 'GET');
              
              // Emit security event
              window.dispatchEvent(new CustomEvent('paper-security-event', {
                  detail: {
                      timestamp: new Date(),
                      type: firewallCheck.allowed ? 'allowed' : (firewallCheck.severity === 'medium' ? 'challenged' : 'blocked'),
                      reason: firewallCheck.reason || 'Allowed',
                      severity: firewallCheck.severity || 'low',
                      domain,
                      path
                  }
              }));
              
              if (!firewallCheck.allowed) {
                  port.postMessage({
                      status: 403,
                      headers: { 'Content-Type': 'text/html' },
                      body: `
                          <html>
                              <head><title>403 Forbidden</title></head>
                              <body style="font-family: sans-serif; padding: 2rem; text-align: center; background: #000; color: #fff;">
                                  <h1 style="color: #ff0000;">403 - Request Blocked</h1>
                                  <p>Reason: ${firewallCheck.reason}</p>
                                  <p>Severity: ${firewallCheck.severity}</p>
                                  <p style="margin-top: 2rem; color: #888; font-size: 0.9rem;">Protected by Paper Firewall</p>
                              </body>
                          </html>
                      `
                  });
                  return;
              }
              
              const start = performance.now();
              try {
                  const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
                  
                  // Check with Pyodide proxy server first (firewall + domain validation)
                  try {
                      const proxyCheck = await pyodideProxyServer.handleRequest(
                          method || 'GET',
                          path,
                          domain,
                          headers,
                          '',
                          clientIP,
                          `req-${Date.now()}-${Math.random()}`
                      );
                      
                      // If blocked or not found, return proxy response
                      if (proxyCheck.status === 403 || proxyCheck.status === 404) {
                          port.postMessage({
                              status: proxyCheck.status,
                              headers: proxyCheck.headers || {},
                              body: proxyCheck.body || ''
                          });
                          return;
                      }
                  } catch (proxyError: any) {
                      // If Pyodide fails, continue with basic domain check
                      console.warn('[App] Pyodide proxy check failed, using fallback:', proxyError.message);
                      if (!pyodideProxyServer.isDomainRegisteredSync(domain)) {
                          port.postMessage({
                              status: 404,
                              headers: { 'Content-Type': 'text/html' },
                              body: '<html><body><h1>404 - Domain Not Found</h1><p>Domain not registered.</p></body></html>'
                          });
                          return;
                      }
                  }
                  
                  // Process request with runtime
                  const result = await runtime.handleRequest(domain, path, clientIP);
                  
                  // WAF Fingerprinting
                  const waf = firewall.fingerprintWAF(result);
                  if (waf) {
                      console.log(`[Firewall] Detected WAF: ${waf}`);
                  }
                  
                  const duration = Math.round(performance.now() - start);
                  setLogs(prev => [{
                      id: Math.random().toString(),
                      timestamp: new Date(),
                      method: method || 'GET',
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
      
      // Handle domain registration messages
      const handleDomainRegistration = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'REGISTER_DOMAIN') {
          const { domain } = event.data;
          try {
            await webvmProxyServer.manageHostsFile('add', domain);
            // Notify Service Worker
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'DOMAIN_REGISTERED',
                domain
              });
            }
            console.log(`[Paper] Registered domain: ${domain}`);
          } catch (error: any) {
            console.error(`[Paper] Failed to register domain ${domain}:`, error);
          }
        } else if (event.data && event.data.type === 'REGISTER_TLD') {
          const { tld } = event.data;
          try {
            await webvmProxyServer.manageHostsFile('add', tld);
            // Also register as TLD
            const handler = (webvmProxyServer as any).requestHandlers?.get('register_tld');
            if (handler) {
              await handler({ tld });
            }
            console.log(`[Paper] Registered TLD: ${tld}`);
          } catch (error: any) {
            console.error(`[Paper] Failed to register TLD ${tld}:`, error);
          }
        }
      };
      
      window.addEventListener('message', handleDomainRegistration);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleGatewayMessage);
        window.removeEventListener('message', handleDomainRegistration);
      };
  }, []);

  // Also try native daemon (optional, for users who want OS-level TLD)
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    const connect = () => {
      const socket = new WebSocket('ws://127.0.0.1:8080/_paper_control');
      socket.onopen = () => {
          console.log('[Paper] Native Daemon Also Connected');
          setConnected(true);
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
          const clientIP = data.headers['x-forwarded-for'] || data.headers['x-real-ip'] || 'unknown';
          const result = await runtime.handleRequest(domain, data.path, clientIP);
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
        
        <div style={{ background: '#000', borderBottom: '1px solid #333', padding: '0.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} color="#00ff00" />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    <strong style={{ color: '#00ff00' }}>Auto-Running:</strong> Service Worker active. 
                    <code style={{ marginLeft: '0.5rem', color: '#00ff00' }}>*.paper</code> domains work immediately.
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} color="#00ff00" />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    <strong style={{ color: '#00ff00' }}>🛡️ INVINCIBLE:</strong> SafeLine WAF + invisibrowse protection active.
                </span>
            </div>
        </div>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {view === 'logs' ? (
                <LogsView logs={logs} />
            ) : view === 'files' ? (
                <FileExplorer />
            ) : view === 'deployments' ? (
                <DeploymentLogsView />
            ) : view === 'security' ? (
                <SecurityDashboard />
            ) : view === 'settings' ? (
                <DashboardSettings />
            ) : view === 'domains' ? (
                <DomainManager />
            ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="flex justify-between items-center">
                        <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Overview</h1>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowImportModal(true)}
                        >
                            <Plus size={16} />
                            <span>Import Repository</span>
                        </button>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                        <VMStatus />
                    </div>
                    
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#00ff00', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} />
                        <strong>System Active:</strong> Click "Open App" to launch <code>*.paper</code> domains. 
                        Service Worker + DNS VM intercepts all requests automatically.
                    </div>
                    
                    <AppGrid apps={appsList} onOpen={(domain) => {
                        // Open REAL .paper URL - Service Worker intercepts before DNS
                        // This works because SW can intercept navigation
                        // Use window.location for same-tab or window.open for new tab
                        const url = `http://${domain}`;
                        // Try to open in new tab, fallback to same tab
                        const newWindow = window.open(url, '_blank');
                        if (!newWindow) {
                            // Popup blocked, use same window
                            window.location.href = url;
                        }
                    }} onImport={() => setShowImportModal(true)} />
                </div>
            )}
        </main>
      </div>
      
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={() => {
            // Refresh apps list
            setAppsList([...apps]);
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
