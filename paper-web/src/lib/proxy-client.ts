// Client library to connect to Paper Proxy Server
export class PaperProxyClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private pendingRequests: Map<string, { resolve: (data: any) => void; reject: (error: Error) => void }> = new Map();

    constructor(proxyUrl: string = 'ws://127.0.0.1:8080/_paper_control') {
        this.url = proxyUrl;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('[PaperProxy] Connected to proxy server');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('[PaperProxy] Message parse error:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[PaperProxy] WebSocket error:', error);
                    reject(new Error('Failed to connect to proxy server'));
                };

                this.ws.onclose = () => {
                    console.log('[PaperProxy] WebSocket closed');
                    this.ws = null;
                    this.attemptReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[PaperProxy] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`[PaperProxy] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('[PaperProxy] Reconnect failed:', error);
            });
        }, delay);
    }

    private handleMessage(message: any) {
        // Handle responses to pending requests
        if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);
            
            if (message.type === 'error') {
                reject(new Error(message.error || 'Unknown error'));
            } else {
                resolve(message);
            }
            return;
        }

        // Handle event messages
        if (message.type) {
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message);
            }
        }
    }

    async registerDomain(domain: string): Promise<{ domain: string; wasNew: boolean; allDomains: string[] }> {
        return this.sendRequest({
            type: 'register_domain',
            domain
        });
    }

    async registerTLD(tld: string): Promise<{ tld: string; allDomains: string[] }> {
        return this.sendRequest({
            type: 'register_tld',
            tld
        });
    }

    async getStats(): Promise<any> {
        return this.sendRequest({
            type: 'get_stats'
        });
    }

    async blockIP(ip: string): Promise<void> {
        return this.sendRequest({
            type: 'firewall_block_ip',
            ip
        });
    }

    async unblockIP(ip: string): Promise<void> {
        return this.sendRequest({
            type: 'firewall_unblock_ip',
            ip
        });
    }

    private sendRequest(message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            message.id = id;

            this.pendingRequests.set(id, { resolve, reject });

            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                this.pendingRequests.delete(id);
                reject(error);
            }

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    on(event: string, handler: (data: any) => void) {
        this.messageHandlers.set(event, handler);
    }

    off(event: string) {
        this.messageHandlers.delete(event);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.pendingRequests.clear();
        this.messageHandlers.clear();
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}



