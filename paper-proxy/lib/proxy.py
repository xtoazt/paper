import asyncio
import logging
import json
import uuid
from aiohttp import web, WSMsgType
from .hosts import HostsManager

logger = logging.getLogger(__name__)

class ProxyServer:
    def __init__(self, host='127.0.0.1', port=8080):
        self.host = host
        self.port = port
        self.app = web.Application()
        
        # Specific routes
        self.app.router.add_get('/_paper_control', self.handle_control_ws)
        self.app.router.add_get('/proxy.pac', self.handle_pac)
        
        # Catch-all route for everything else
        self.app.router.add_route('*', '/{tail:.*}', self.handle_request)
        
        self.control_ws = None
        self.pending_requests = {}
        
        # Initialize Hosts Manager
        self.hosts_manager = HostsManager()

    async def start(self):
        # Try to install hosts entries
        self.hosts_manager.install()
        
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        
        print("\n" + "="*50)
        print(f"🚀 Paper Proxy listening on http://{self.host}:{self.port}")
        print("="*50)
        
        if not self.hosts_manager.installed:
            print("\n⚠️  Hosts file not patched. To make *.paper domains work, choose one:")
            print(f"  A. Run with sudo:  sudo python3 paper-proxy/src/main.py")
            print(f"  B. Use PAC URL:    http://{self.host}:{self.port}/proxy.pac")
            print(f"  C. Launch Chrome:  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --host-resolver-rules=\"MAP *.paper 127.0.0.1\"")
        else:
             print("\n✅ Hosts file patched. You can access http://blog.paper:8080 directly.")

        print("\nPress Ctrl+C to stop.")
        
        await site.start()
        
        # Keep alive
        while True:
            await asyncio.sleep(3600)

    async def handle_pac(self, request):
        pac_content = f"""
        function FindProxyForURL(url, host) {{
            if (dnsDomainIs(host, ".paper") || shExpMatch(host, "*.paper")) {{
                return "PROXY {self.host}:{self.port}";
            }}
            return "DIRECT";
        }}
        """
        return web.Response(text=pac_content, content_type='application/x-ns-proxy-autoconfig')

    async def handle_control_ws(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        logger.info("WebVM Control Channel connected")
        self.control_ws = ws
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        req_id = data.get('id')
                        if req_id and req_id in self.pending_requests:
                            if not self.pending_requests[req_id].done():
                                self.pending_requests[req_id].set_result(data)
                    except Exception as e:
                        logger.error(f"Error parsing WS message: {e}")
                elif msg.type == WSMsgType.ERROR:
                    logger.error('ws connection closed with exception %s', ws.exception())
        finally:
            self.control_ws = None
            logger.info("WebVM Control Channel disconnected")
            for fut in self.pending_requests.values():
                if not fut.done():
                    fut.cancel()
            self.pending_requests.clear()
            
        return ws

    async def handle_request(self, request):
        host = request.headers.get('Host', '')
        
        # Simple health check
        if not host.endswith('.paper') and not host.startswith('localhost') and not host.startswith('127.0.0.1'):
             # If it's just an IP access, show info
             if request.path == '/':
                 return web.Response(text="Paper Proxy Running. Connect WebVM to /_paper_control", status=200)

        if self.control_ws is None:
            return web.Response(text="WebVM not connected. Please open the Master Tab.", status=503)

        req_id = str(uuid.uuid4())
        fut = asyncio.Future()
        self.pending_requests[req_id] = fut

        try:
            body = await request.read()
            body_str = body.decode('utf-8', errors='replace')
        except Exception:
            body_str = ""

        payload = {
            'id': req_id,
            'method': request.method,
            'url': str(request.url),
            'path': request.path,
            'headers': dict(request.headers),
            'body': body_str
        }
        
        try:
            await self.control_ws.send_json(payload)
            response_data = await fut
            
            return web.Response(
                body=response_data.get('body'),
                status=response_data.get('status', 200),
                headers=response_data.get('headers')
            )
        except asyncio.CancelledError:
            return web.Response(text="Request Cancelled (WebVM disconnected)", status=504)
        except Exception as e:
            logger.error(f"Error proxying request: {e}")
            return web.Response(text=f"Internal Proxy Error: {e}", status=500)
        finally:
            self.pending_requests.pop(req_id, None)

    def run(self):
        # We use asyncio.run in main, but here we provide a blocking entry point if needed
        # However, since start() is async, we should change the main entry pattern.
        pass
