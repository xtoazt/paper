import React, { useState } from 'react';

const SCRIPT_CONTENT = `
import sys, os, socket, json, struct, threading, subprocess, time, platform

# --- CONFIG ---
PORT = 8080
CONTROL_PATH = '/_paper_control'
# --------------

def get_platform_hosts_file():
    return r"C:\\Windows\\System32\\drivers\\etc\\hosts" if os.name == 'nt' else "/etc/hosts"

def patch_hosts():
    """ Try to ensure essential domains map to 127.0.0.1 """
    domains = ["paper", "blog.paper", "shop.paper", "test.paper"]
    hosts_path = get_platform_hosts_file()
    
    # Check if we have write access
    if not os.access(hosts_path, os.W_OK):
        return False
        
    try:
        with open(hosts_path, 'r') as f:
            content = f.read()
            
        marker = "### PAPER-START ###"
        if marker in content: return True # Already patched
        
        block = "\\n" + marker + "\\n"
        for d in domains: block += f"127.0.0.1 {d}\\n"
        block += "### PAPER-END ###\\n"
        
        with open(hosts_path, 'a') as f:
            f.write(block)
            
        # Flush DNS
        if platform.system() == 'Darwin':
            subprocess.run(['killall', '-HUP', 'mDNSResponder'], stderr=subprocess.DEVNULL)
            
        return True
    except:
        return False

class SimpleProxy:
    def __init__(self):
        self.clients = {} # {id: socket} for keeping connections alive while waiting for WebVM
        self.control_socket = None
        self.lock = threading.Lock()
        
    def start(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server.bind(('127.0.0.1', PORT))
        except PermissionError:
            print(f"Error: Port {PORT} requires elevated privileges.")
            return

        server.listen(50)
        print(f"Paper Proxy running on 127.0.0.1:{PORT}")
        
        # Try to patch hosts if we can (e.g. user ran python with sudo)
        if patch_hosts():
            print("Hosts file patched.")
        else:
            print("Note: Hosts file not patched (run with sudo for auto-config).")
            print("Fallback: Use http://127.0.0.1:8080/proxy.pac")

        while True:
            client, addr = server.accept()
            threading.Thread(target=self.handle_client, args=(client,)).start()

    def handle_client(self, client):
        try:
            # Peek at the request to see if it's the control connection
            data = client.recv(4096)
            if not data: return
            
            req = data.decode('utf-8', errors='ignore')
            
            # 1. Handshake with WebVM
            if f"GET {CONTROL_PATH}" in req:
                self.handle_control_connection(client, req)
                return

            # 2. Serve PAC file
            if "GET /proxy.pac" in req:
                self.serve_pac(client)
                return

            # 3. Regular Traffic -> Route to WebVM
            self.route_traffic(client, data, req)
            
        except Exception as e:
            print(f"Error: {e}")
            try: client.close()
            except: pass

    def serve_pac(self, client):
        pac = """function FindProxyForURL(url, host) {
            if (shExpMatch(host, "*.paper")) return "PROXY 127.0.0.1:%d";
            return "DIRECT";
        }""" % PORT
        
        resp = "HTTP/1.1 200 OK\\r\\nContent-Type: application/x-ns-proxy-autoconfig\\r\\n\\r\\n" + pac
        client.sendall(resp.encode())
        client.close()

    def handle_control_connection(self, client, req):
        # Perform WebSocket Handshake
        key = None
        for line in req.split('\\r\\n'):
            if "Sec-WebSocket-Key:" in line:
                key = line.split(':')[1].strip()
        
        if not key: return
        
        # Magic string calculation for WS accept
        import hashlib, base64
        magic = b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        accept_key = base64.b64encode(hashlib.sha1(key.encode() + magic).digest()).decode()
        
        resp = f"HTTP/1.1 101 Switching Protocols\\r\\nUpgrade: websocket\\r\\nConnection: Upgrade\\r\\nSec-WebSocket-Accept: {accept_key}\\r\\n\\r\\n"
        client.sendall(resp.encode())
        
        with self.lock:
            if self.control_socket:
                try: self.control_socket.close()
                except: pass
            self.control_socket = client
            print("WebVM Connected.")

        # Keep alive / read loop
        try:
            while True:
                # Basic WS frame parsing (simplified for brevity)
                # In a real impl, we'd need full framing support
                head = client.recv(2)
                if not head: break
                
                # Check opcode (8 is close)
                if head[0] & 0x0F == 8: break
                
                # Payload length
                length = head[1] & 127
                if length == 126: length = struct.unpack(">H", client.recv(2))[0]
                elif length == 127: length = struct.unpack(">Q", client.recv(8))[0]
                
                # Mask
                masks = [0,0,0,0]
                if head[1] & 128:
                    masks = list(client.recv(4))
                
                # Data
                payload = bytearray(client.recv(length))
                for i in range(len(payload)):
                    payload[i] ^= masks[i % 4]
                
                # Process JSON message from WebVM
                try:
                    msg = json.loads(payload.decode())
                    # Handle responses... (not implemented in this minimal script)
                except: pass
                
        except:
            pass
        finally:
            print("WebVM Disconnected.")
            with self.lock:
                self.control_socket = None

    def route_traffic(self, client, initial_data, req_str):
        # Extract Host
        host = "unknown"
        for line in req_str.split('\\r\\n'):
            if "Host:" in line:
                host = line.split(':')[1].strip()
        
        # Only route .paper
        if ".paper" not in host and "localhost" not in host and "127.0.0.1" not in host:
            client.sendall(b"HTTP/1.1 404 Not Found\\r\\n\\r\\nPaper Proxy: Domain not allowed.")
            client.close()
            return

        with self.lock:
            if not self.control_socket:
                client.sendall(b"HTTP/1.1 503 Service Unavailable\\r\\n\\r\\nWebVM not connected.")
                client.close()
                return
                
            # Construct JSON payload for WebVM
            # Note: This requires the WebVM to handle raw socket data or a defined protocol
            # For this MVP, we just send the raw HTTP request as a string in JSON
            
            # Simple WS Frame Construction (Text)
            # 0x81 = Text, unmasked (server->client)
            # Length logic omitted for brevity in this snippet
            pass 

if __name__ == '__main__':
    SimpleProxy().start()
`;

export const CopyInstallBlock = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(SCRIPT_CONTENT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333', marginTop: '1rem' }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Bootstrap Paper</h3>
            <p style={{ color: '#888', marginBottom: '1rem' }}>
                Since browsers cannot natively bind to TCP ports (yet), you need a tiny bootstrap script.
                Paper can generate this for you on the fly.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                    onClick={handleCopy}
                    style={{ 
                        background: copied ? '#4caf50' : '#fff', 
                        color: copied ? '#fff' : '#000',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {copied ? 'Copied!' : 'Copy Script'}
                </button>
                <button 
                     onClick={() => {
                         const blob = new Blob([SCRIPT_CONTENT], { type: 'text/x-python' });
                         const url = URL.createObjectURL(blob);
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = 'paper_boot.py';
                         a.click();
                     }}
                     style={{ 
                        background: 'transparent', 
                        color: '#fff',
                        border: '1px solid #fff',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer'
                    }}
                >
                    Download
                </button>
            </div>
            
            <code style={{ display: 'block', background: '#000', padding: '1rem', color: '#0f0', fontSize: '0.9em', overflowX: 'auto' }}>
                python3 paper_boot.py
            </code>
        </div>
    );
};

