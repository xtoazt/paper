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
        self.app.router.add_route('*', '/{tail:.*}', self.handle_request)
        
        self.control_ws = None
        self.pending_requests = {}
        self.hosts_manager = HostsManager()

    async def start(self):
        self.hosts_manager.install()
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
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
        
        self.control_ws = ws
        logger.info("WebVM Connected")
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        
                        # Handle Response to a Request
                        req_id = data.get('id')
                        if req_id and req_id in self.pending_requests:
                            if not self.pending_requests[req_id].done():
                                self.pending_requests[req_id].set_result(data)
                                
                        # Handle Command from WebVM (e.g., Register Domain)
                        if data.get('type') == 'register_domain':
                            domain = data.get('domain')
                            if domain:
                                logger.info(f"Registering new domain: {domain}")
                                self.hosts_manager.add_domain(domain)

                    except Exception as e:
                        logger.error(f"Error parsing WS message: {e}")
        finally:
            self.control_ws = None
            for fut in self.pending_requests.values():
                if not fut.done():
                    fut.cancel()
            self.pending_requests.clear()
            
        return ws

    async def handle_request(self, request):
        host = request.headers.get('Host', '')
        
        if not host.endswith('.paper') and not host.startswith('localhost') and not host.startswith('127.0.0.1'):
             if request.path == '/':
                 return web.Response(text="Paper Proxy Running. Connect WebVM to /_paper_control", status=200)

        if self.control_ws is None:
            return web.Response(text="WebVM not connected.", status=503)

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
            # 5 second timeout for local processing
            response_data = await asyncio.wait_for(fut, timeout=10.0)
            
            return web.Response(
                body=response_data.get('body'),
                status=response_data.get('status', 200),
                headers=response_data.get('headers')
            )
        except asyncio.TimeoutError:
             return web.Response(text="WebVM Timeout", status=504)
        except Exception as e:
            return web.Response(text=f"Proxy Error: {e}", status=500)
        finally:
            self.pending_requests.pop(req_id, None)

    def run(self):
        pass
