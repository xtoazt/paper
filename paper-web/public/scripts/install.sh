#!/bin/bash
set -e

# Paper Background Daemon Installer
# This script sets up the local ingress proxy as a user service.

PAPER_HOME="$HOME/.paper"
PROXY_URL="https://raw.githubusercontent.com/rohan/paper/main/paper-proxy/src/main.py" 
# ^ In a real deployment, this would point to the bundled python script or download it
# For this dev environment, we assume we are running from the project root or downloading self-contained.

echo "📄 Installing Paper Daemon..."

# 1. Create hidden directory
mkdir -p "$PAPER_HOME"

# 2. Extract embedded python script (Bootstrap version)
# We embed the script directly here to avoid fetching issues during dev
cat << 'EOF' > "$PAPER_HOME/paper_daemon.py"
import sys, os, socket, json, struct, threading, subprocess, platform, time

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
    except:
        pass # Best effort without sudo

class Proxy:
    def __init__(self):
        self.clients = {}
        self.control_ws = None
        self.lock = threading.Lock()

    def start(self):
        # Retry loop for binding
        while True:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(('127.0.0.1', PORT))
                s.listen(50)
                break
            except:
                time.sleep(5)

        patch_hosts()
        
        while True:
            try:
                c, a = s.accept()
                threading.Thread(target=self.handle, args=(c,)).start()
            except: pass

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
        
        # Keep alive
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
            
            # In a full implementation, we would frame this into the WS
            # For this 'dumb' daemon, we just reply 200 OK to keep the connection alive
            # REAL implementation needs bidirectional WS framing here.
            pass

if __name__ == '__main__':
    Proxy().start()
EOF

# 3. Detect OS and Install Service
OS="$(uname -s)"
if [ "$OS" == "Darwin" ]; then
    # macOS LaunchAgent
    PLIST="$HOME/Library/LaunchAgents/dev.paper.daemon.plist"
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
    <string>$PAPER_HOME/error.log</string>
    <key>StandardOutPath</key>
    <string>$PAPER_HOME/out.log</string>
</dict>
</plist>
EOF
    
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load "$PLIST"
    echo "✅ Paper Daemon installed on macOS."

elif [ "$OS" == "Linux" ]; then
    # Linux Systemd (User)
    mkdir -p "$HOME/.config/systemd/user"
    SERVICE="$HOME/.config/systemd/user/paper-daemon.service"
    cat << EOF > "$SERVICE"
[Unit]
Description=Paper Local Ingress

[Service]
ExecStart=/usr/bin/python3 $PAPER_HOME/paper_daemon.py
Restart=always

[Install]
WantedBy=default.target
EOF
    
    systemctl --user daemon-reload
    systemctl --user enable paper-daemon
    systemctl --user restart paper-daemon
    echo "✅ Paper Daemon installed on Linux."
fi

echo "🚀 Ready! Refresh your Paper Dashboard."

