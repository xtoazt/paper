import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HostsManager {
    static MARKER_START = '### PAPER-TLD-START ###';
    static MARKER_END = '### PAPER-TLD-END ###';
    
    constructor() {
        this.domains = new Set();
        this.installed = false;
        this.hostsFile = this.getHostsFilePath();
    }

    getHostsFilePath() {
        const platform = os.platform();
        if (platform === 'win32') {
            return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        }
        return '/etc/hosts';
    }

    async addDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            throw new Error('Invalid domain');
        }
        
        // Validate domain format
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)) {
            throw new Error(`Invalid domain format: ${domain}`);
        }

        const wasNew = !this.domains.has(domain);
        this.domains.add(domain);
        
        if (wasNew) {
            await this.install();
        }
        
        return wasNew;
    }

    async addTLD(tld) {
        // Add wildcard support for TLDs
        // e.g., addTLD('paper') allows *.paper
        if (!tld || typeof tld !== 'string') {
            throw new Error('Invalid TLD');
        }
        
        // Remove leading dot if present
        const cleanTLD = tld.startsWith('.') ? tld.slice(1) : tld;
        
        // Add base domain for the TLD
        await this.addDomain(cleanTLD);
        
        // Store TLD for wildcard matching
        if (!this.tlds) {
            this.tlds = new Set();
        }
        this.tlds.add(cleanTLD);
        
        return true;
    }

    async removeDomain(domain) {
        this.domains.delete(domain);
        await this.install();
    }

    async flushDNS() {
        const platform = os.platform();
        try {
            if (platform === 'darwin') {
                // macOS
                await execAsync('killall -HUP mDNSResponder');
            } else if (platform === 'linux') {
                // Linux - try multiple methods
                try {
                    await execAsync('resolvectl flush-caches');
                } catch {
                    try {
                        await execAsync('systemd-resolve --flush-caches');
                    } catch {
                        // Fallback: restart network manager
                        await execAsync('sudo systemctl restart NetworkManager');
                    }
                }
            } else if (platform === 'win32') {
                // Windows
                await execAsync('ipconfig /flushdns');
            }
        } catch (error) {
            console.warn(`[HostsManager] DNS flush failed (may need sudo): ${error.message}`);
        }
    }

    async install() {
        try {
            // Read current hosts file
            let content = '';
            try {
                content = await fs.readFile(this.hostsFile, 'utf-8');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, create it
                    content = '';
                } else {
                    throw error;
                }
            }

            // Remove existing Paper block
            const lines = content.split(/\r?\n/);
            const newLines = [];
            let skip = false;
            let found = false;

            for (const line of lines) {
                if (line.includes(this.constructor.MARKER_START)) {
                    skip = true;
                    found = true;
                    continue;
                }
                if (line.includes(this.constructor.MARKER_END)) {
                    skip = false;
                    continue;
                }
                if (!skip) {
                    newLines.push(line);
                }
            }

            // Generate new block
            const block = this.generateBlock();

            // Write back
            const finalContent = newLines.join('\n') + 
                (newLines.length > 0 && !newLines[newLines.length - 1].endsWith('\n') ? '\n' : '') +
                block;

            // Use sudo if needed (will prompt for password)
            const platform = os.platform();
            if (platform !== 'win32') {
                // Unix-like: write to temp file, then use sudo cp
                const tmpFile = path.join(os.tmpdir(), `paper-hosts-${Date.now()}.tmp`);
                try {
                    await fs.writeFile(tmpFile, finalContent, 'utf-8');
                    
                    // Use sudo cp to copy temp file to hosts file
                    await execAsync(`sudo cp "${tmpFile}" "${this.hostsFile}"`);
                    
                    // Clean up temp file
                    await fs.unlink(tmpFile).catch(() => {});
                } catch (error) {
                    // Clean up temp file on error
                    await fs.unlink(tmpFile).catch(() => {});
                    throw error;
                }
            } else {
                // Windows: try direct write, may need admin
                try {
                    await fs.writeFile(this.hostsFile, finalContent, 'utf-8');
                } catch (error) {
                    // If permission denied, try with PowerShell as admin
                    throw new Error('Permission denied. Please run as administrator.');
                }
            }

            this.installed = true;
            await this.flushDNS();
            
            console.log(`[HostsManager] Installed ${this.domains.size} domains`);
        } catch (error) {
            if (error.message.includes('Permission denied') || error.message.includes('sudo')) {
                throw new Error(`Permission denied. Please run with sudo (Unix) or as Administrator (Windows).\nOriginal error: ${error.message}`);
            }
            throw error;
        }
    }

    generateBlock() {
        const lines = [this.constructor.MARKER_START];
        
        // Sort domains for stability
        const sortedDomains = Array.from(this.domains).sort();
        
        for (const domain of sortedDomains) {
            lines.push(`127.0.0.1 ${domain}`);
            // Also add with www prefix
            if (!domain.startsWith('www.')) {
                lines.push(`127.0.0.1 www.${domain}`);
            }
        }
        
        lines.push(this.constructor.MARKER_END);
        return lines.join('\n') + '\n';
    }

    async remove() {
        try {
            const content = await fs.readFile(this.hostsFile, 'utf-8');
            const lines = content.split(/\r?\n/);
            const newLines = [];
            let skip = false;
            let found = false;

            for (const line of lines) {
                if (line.includes(this.constructor.MARKER_START)) {
                    skip = true;
                    found = true;
                    continue;
                }
                if (line.includes(this.constructor.MARKER_END)) {
                    skip = false;
                    continue;
                }
                if (!skip) {
                    newLines.push(line);
                }
            }

            if (found) {
                const finalContent = newLines.join('\n') + '\n';
                
                const platform = os.platform();
                if (platform !== 'win32') {
                    // Unix-like: write to temp file, then use sudo cp
                    const tmpFile = path.join(os.tmpdir(), `paper-hosts-${Date.now()}.tmp`);
                    try {
                        await fs.writeFile(tmpFile, finalContent, 'utf-8');
                        await execAsync(`sudo cp "${tmpFile}" "${this.hostsFile}"`);
                        await fs.unlink(tmpFile).catch(() => {});
                    } catch (error) {
                        await fs.unlink(tmpFile).catch(() => {});
                        throw error;
                    }
                } else {
                    await fs.writeFile(this.hostsFile, finalContent, 'utf-8');
                }
                
                await this.flushDNS();
            }

            this.installed = false;
        } catch (error) {
            console.error(`[HostsManager] Failed to remove: ${error.message}`);
        }
    }

    getDomains() {
        return Array.from(this.domains);
    }

    hasDomain(domain) {
        return this.domains.has(domain);
    }
}

