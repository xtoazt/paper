// Unbreakable Firewall - Multi-layer protection
export class UnbreakableFirewall {
    constructor() {
        this.active = true;
        this.blockedIPs = new Set();
        this.allowedIPs = new Set();
        this.rateLimits = new Map();
        this.attackPatterns = this.initializeAttackPatterns();
        this.requestHistory = new Map();
        this.blockedDomains = new Set();
    }

    initializeAttackPatterns() {
        return {
            // SQL Injection
            sqlInjection: [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
                /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
                /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
                /(xp_cmdshell|sp_executesql|CONCAT|GROUP_CONCAT)/i,
                /(;\s*(DROP|DELETE|UPDATE|INSERT))/i,
                /('|(\\')|(;)|(\\;)|(--)|(\\--)|(\/\*)|(\\\/\*)|(\*\/)|(\\\*\/))/i,
            ],
            // XSS
            xss: [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/i,
                /on\w+\s*=/i,
                /<iframe[^>]*>/gi,
                /<object[^>]*>/gi,
                /<embed[^>]*>/gi,
                /eval\s*\(/i,
                /expression\s*\(/i,
                /vbscript:/i,
            ],
            // Command Injection
            commandInjection: [
                /[;&|`$(){}[\]]/,
                /(\b(cmd|command|sh|bash|powershell|exec|system|popen|shell_exec)\b)/i,
                /(\/\w+\/(bin|usr|etc)\/\w+)/i,
                /(\|\s*\w+)/,
                /(&&\s*\w+)/,
                /(;\s*\w+)/,
            ],
            // Path Traversal
            pathTraversal: [
                /\.\.(\/|\\)/,
                /\.\.%2[fF]/,
                /\.\.%5[cC]/,
                /\.\.%252[fF]/,
                /\.\.%255[cC]/,
                /(\/|\\|%2f|%5c)(etc|proc|sys|dev|boot|root|home|usr|var|tmp)(\/|\\|%2f|%5c)/i,
            ],
            // SSRF
            ssrf: [
                /(127\.0\.0\.1|localhost|0\.0\.0\.0|::1)/,
                /(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/,
                /(file:\/\/|gopher:\/\/|dict:\/\/)/i,
            ],
            // RCE
            rce: [
                /(\b(eval|exec|system|passthru|shell_exec|popen|proc_open|pcntl_exec)\s*\()/i,
                /(\$\{(.*?)\})/,
                /(\$\(.*?\))/,
            ],
        };
    }

    checkRequest(ip, method, path, headers = {}, body = '') {
        if (!this.active) {
            return { allowed: true };
        }

        // Allow whitelisted IPs
        if (this.allowedIPs.has(ip)) {
            return { allowed: true };
        }

        // Check IP block
        if (this.blockedIPs.has(ip)) {
            return { 
                allowed: false, 
                reason: 'IP Blocked by Firewall',
                severity: 'high'
            };
        }

        // Rate limiting
        const rateLimitCheck = this.checkRateLimit(ip);
        if (!rateLimitCheck.allowed) {
            this.blockedIPs.add(ip);
            return rateLimitCheck;
        }

        // Combine all inputs for pattern matching
        const allInputs = `${method} ${path} ${JSON.stringify(headers)} ${body}`.toLowerCase();

        // Check attack patterns
        for (const [attackType, patterns] of Object.entries(this.attackPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(allInputs)) {
                    this.blockedIPs.add(ip);
                    this.logAttack(ip, attackType, path);
                    return {
                        allowed: false,
                        reason: `${attackType} detected`,
                        severity: 'critical',
                        attackType
                    };
                }
            }
        }

        // Check for suspicious headers
        if (this.isSuspiciousHeaders(headers)) {
            this.blockedIPs.add(ip);
            return {
                allowed: false,
                reason: 'Suspicious headers detected',
                severity: 'high'
            };
        }

        // Check User-Agent for bots/scanners
        const userAgent = headers['user-agent'] || headers['User-Agent'] || '';
        if (this.isMaliciousUserAgent(userAgent)) {
            return {
                allowed: false,
                reason: 'Malicious user agent detected',
                severity: 'medium'
            };
        }

        return { allowed: true };
    }

    checkRateLimit(ip) {
        const now = Date.now();
        const window = 60000; // 1 minute
        const maxRequests = 100; // Max requests per minute
        const burstLimit = 20; // Max requests in 5 seconds

        if (!this.rateLimits.has(ip)) {
            this.rateLimits.set(ip, []);
        }

        const requests = this.rateLimits.get(ip);
        
        // Remove old requests outside the window
        const recent = requests.filter(timestamp => now - timestamp < window);
        
        // Check burst limit (last 5 seconds)
        const burstWindow = 5000;
        const burstRequests = recent.filter(timestamp => now - timestamp < burstWindow);
        
        if (burstRequests.length >= burstLimit) {
            return {
                allowed: false,
                reason: 'Burst rate limit exceeded',
                severity: 'high'
            };
        }

        // Check overall rate limit
        if (recent.length >= maxRequests) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded',
                severity: 'medium'
            };
        }

        // Add current request
        recent.push(now);
        this.rateLimits.set(ip, recent);

        return { allowed: true };
    }

    isSuspiciousHeaders(headers) {
        // Check for known attack headers
        const suspiciousHeaders = [
            'x-forwarded-for',
            'x-real-ip',
            'x-originating-ip',
            'x-remote-ip',
            'x-remote-addr'
        ];

        for (const header of suspiciousHeaders) {
            const value = headers[header] || headers[header.toLowerCase()];
            if (value) {
                // Check if header contains SQL injection or XSS
                const combined = `${header}:${value}`.toLowerCase();
                for (const patterns of Object.values(this.attackPatterns)) {
                    for (const pattern of patterns) {
                        if (pattern.test(combined)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    isMaliciousUserAgent(userAgent) {
        if (!userAgent) return false;

        const maliciousPatterns = [
            /sqlmap/i,
            /nikto/i,
            /nmap/i,
            /masscan/i,
            /zap/i,
            /burp/i,
            /w3af/i,
            /acunetix/i,
            /nessus/i,
            /openvas/i,
            /scanner/i,
            /crawler/i,
            /bot/i,
        ];

        // Allow legitimate bots
        const allowedBots = [
            /googlebot/i,
            /bingbot/i,
            /slurp/i,
        ];

        for (const pattern of allowedBots) {
            if (pattern.test(userAgent)) {
                return false;
            }
        }

        for (const pattern of maliciousPatterns) {
            if (pattern.test(userAgent)) {
                return true;
            }
        }

        return false;
    }

    logAttack(ip, attackType, path) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            ip,
            attackType,
            path,
            severity: 'critical'
        };

        // Keep last 1000 attack logs
        if (!this.requestHistory.has(ip)) {
            this.requestHistory.set(ip, []);
        }

        const history = this.requestHistory.get(ip);
        history.push(logEntry);
        
        // Keep only last 100 entries per IP
        if (history.length > 100) {
            history.shift();
        }

        console.error(`[Firewall] Attack blocked: ${attackType} from ${ip} on ${path}`);
    }

    blockIP(ip) {
        this.blockedIPs.add(ip);
    }

    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.rateLimits.delete(ip);
    }

    allowIP(ip) {
        this.allowedIPs.add(ip);
    }

    getAttackHistory(ip = null) {
        if (ip) {
            return this.requestHistory.get(ip) || [];
        }
        
        // Return all attack history
        const allHistory = [];
        for (const history of this.requestHistory.values()) {
            allHistory.push(...history);
        }
        return allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            allowedIPs: this.allowedIPs.size,
            totalAttacks: this.getAttackHistory().length,
            activeRateLimits: this.rateLimits.size
        };
    }

    enable() {
        this.active = true;
    }

    disable() {
        this.active = false;
    }

    isActive() {
        return this.active;
    }
}



