#!/bin/bash
set -e

# Paper Background Daemon Installer
# Installs a system-level daemon to handle *.paper domains

PAPER_HOME="$HOME/.paper"

echo "📄 Installing Paper Daemon..."

# Check for sudo/root
if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  Please run as root (sudo) to enable domain mapping."
  exit 1
fi

# 1. Create hidden directory
mkdir -p "$PAPER_HOME"
# Ensure the user owns it even if created by sudo
chown -R $SUDO_USER "$PAPER_HOME"

# 2. Extract embedded python script
cat << 'EOF' > "$PAPER_HOME/paper_daemon.py"
import sys, os, socket, threading, subprocess, platform, time, signal

PORT = 8080
CONTROL_PATH = '/_paper_control'
HOSTS_FILE = r"C:\Windows\System32\drivers\etc\hosts" if os.name == 'nt' else "/etc/hosts"

def patch_hosts():
    domains = ["paper", "blog.paper", "shop.paper", "test.paper"]
    try:
        with open(HOSTS_FILE, 'r') as f: content = f.read()
        if "### PAPER-START ###" in content: return
        
        block = "\n### PAPER-START ###\n"
        for d in domains: block += f"127.0.0.1 {d}\n"
        block += "### PAPER-END ###\n"
        
        with open(HOSTS_FILE, 'a') as f: f.write(block)
        
        if platform.system() == 'Darwin':
            subprocess.run(['killall', '-HUP', 'mDNSResponder'], stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"Failed to patch hosts: {e}")

class Proxy:
    def __init__(self):
        self.control_ws = None
        self.lock = threading.Lock()
        self.running = True

    def start(self):
        patch_hosts()
        
        while self.running:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(('127.0.0.1', PORT))
                s.listen(50)
                print(f"Listening on {PORT}")
                
                while self.running:
                    c, a = s.accept()
                    threading.Thread(target=self.handle, args=(c,)).start()
            except Exception as e:
                print(f"Socket error: {e}")
                time.sleep(5)

    def handle(self, c):
        try:
            d = c.recv(4096)
            if not d: return
            req = d.decode('utf-8', errors='ignore')
            
            if f"GET {CONTROL_PATH}" in req:
                self.handshake(c, req)
            elif "GET /proxy.pac" in req:
                self.pac(c)
            else:
                self.route(c, d, req)
        except:
            c.close()

    def pac(self, c):
        p = f"""function FindProxyForURL(u,h){{if(shExpMatch(h,"*.paper"))return"PROXY 127.0.0.1:{PORT}";return"DIRECT";}}"""
        c.sendall(f"HTTP/1.1 200 OK\r\nContent-Type: application/x-ns-proxy-autoconfig\r\n\r\n{p}".encode())
        c.close()

    def handshake(self, c, req):
        import hashlib, base64
        key = None
        for l in req.split('\r\n'):
            if "Sec-WebSocket-Key:" in l: key = l.split(':')[1].strip()
        if not key: return
        
        acc = base64.b64encode(hashlib.sha1(key.encode() + b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest()).decode()
        c.sendall(f"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {acc}\r\n\r\n".encode())
        
        with self.lock: self.control_ws = c
        
        try:
            while True:
                if not c.recv(1): break
        except: pass
        finally:
            with self.lock: self.control_ws = None

    def route(self, c, data, req):
        with self.lock:
            if not self.control_ws:
                c.sendall(b"HTTP/1.1 503 Service Unavailable\r\n\r\nWebVM Offline")
                c.close()
                return
            
            # Keep-alive response for now, real proxying would go here
            c.sendall(b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nRequest Received")
            c.close()

if __name__ == '__main__':
    Proxy().start()
EOF

# 3. Detect OS and Install Service
OS="$(uname -s)"
if [ "$OS" == "Darwin" ]; then
    PLIST="/Library/LaunchDaemons/dev.paper.daemon.plist"
    cat << EOF > "$PLIST"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.paper.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$PAPER_HOME/paper_daemon.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/paper.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/paper.out</string>
</dict>
</plist>
EOF
    
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load "$PLIST"
    echo "✅ Paper Daemon installed on macOS (System Level)."

elif [ "$OS" == "Linux" ]; then
    SERVICE="/etc/systemd/system/paper-daemon.service"
    cat << EOF > "$SERVICE"
[Unit]
Description=Paper Local Ingress

[Service]
ExecStart=/usr/bin/python3 $PAPER_HOME/paper_daemon.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable paper-daemon
    systemctl restart paper-daemon
    echo "✅ Paper Daemon installed on Linux (System Level)."
fi

echo "🚀 Ready! Refresh your Paper Dashboard."
