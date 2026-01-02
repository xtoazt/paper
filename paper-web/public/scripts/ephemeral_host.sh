#!/bin/bash
set -e

# Paper Ephemeral Host Injector
# Adds hosts entry and ensures cleanup on exit

HOSTS_FILE="/etc/hosts"
DOMAINS="paper blog.paper shop.paper test.paper"
MARKER_START="### PAPER-START ###"
MARKER_END="### PAPER-END ###"

function cleanup {
    echo "🧹 Cleaning up hosts file..."
    if [ -f "$HOSTS_FILE.bak" ]; then
        mv "$HOSTS_FILE.bak" "$HOSTS_FILE"
    else
        # Fallback sed cleanup
        sed -i.tmp "/$MARKER_START/,/$MARKER_END/d" "$HOSTS_FILE"
    fi
    
    # Flush DNS
    if [ "$(uname)" == "Darwin" ]; then
        killall -HUP mDNSResponder
    fi
    echo "✅ Cleanup complete."
}

# Trap exit signals for ultra-short-lived behavior
trap cleanup EXIT INT TERM

if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  Run with sudo for host injection."
  exit 1
fi

echo "💉 Injecting ephemeral host entries..."

# Backup
cp "$HOSTS_FILE" "$HOSTS_FILE.bak"

# Inject
echo "$MARKER_START" >> "$HOSTS_FILE"
for d in $DOMAINS; do
    echo "127.0.0.1 $d" >> "$HOSTS_FILE"
done
echo "$MARKER_END" >> "$HOSTS_FILE"

# Flush DNS
if [ "$(uname)" == "Darwin" ]; then
    killall -HUP mDNSResponder
fi

echo "✅ Hosts injected. Starting Proxy Daemon..."
echo "🌐 *.paper -> 127.0.0.1"
echo "PRESS CTRL+C TO STOP AND CLEANUP"

# Start the Python Proxy in background but keep script alive
python3 -c "
import socket, threading
def p():
 s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
 s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
 s.bind(('127.0.0.1',8080))
 s.listen(5)
 while 1:
  c,a=s.accept()
  c.sendall(b'HTTP/1.1 200 OK\r\n\r\nProxy Active')
  c.close()
p()
" &
PROXY_PID=$!

wait $PROXY_PID




