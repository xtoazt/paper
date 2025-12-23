import os
import sys
import atexit
import logging
import platform
import subprocess

logger = logging.getLogger(__name__)

class HostsManager:
    PAPER_MARKER_START = "### PAPER-START ###"
    PAPER_MARKER_END = "### PAPER-END ###"
    HOSTS_FILE = "/etc/hosts" if os.name != 'nt' else r"C:\Windows\System32\drivers\etc\hosts"

    def __init__(self, domains=None):
        # We start with a base set, but allow dynamic additions
        self.domains = set(domains or ["paper", "blog.paper", "shop.paper", "test.paper"])
        self.installed = False

    def add_domain(self, domain):
        if domain in self.domains:
            return False
        self.domains.add(domain)
        # Re-install with new list
        self.install()
        return True

    def _generate_block(self):
        lines = [self.PAPER_MARKER_START]
        # Sort for stability
        for domain in sorted(list(self.domains)):
            lines.append(f"127.0.0.1 {domain}")
        lines.append(self.PAPER_MARKER_END)
        return "\n".join(lines) + "\n"

    def flush_dns(self):
        system = platform.system()
        try:
            if system == 'Darwin':
                subprocess.run(['killall', '-HUP', 'mDNSResponder'], check=False)
            elif system == 'Linux':
                subprocess.run(['resolvectl', 'flush-caches'], check=False)
            elif system == 'Windows':
                subprocess.run(['ipconfig', '/flushdns'], check=False)
        except Exception as e:
            logger.debug(f"DNS flush failed: {e}")

    def install(self):
        try:
            # Read current content
            with open(self.HOSTS_FILE, 'r') as f:
                content = f.read()

            # If we already have a block, we need to replace it carefully
            # But simpler: Remove old block in memory, then append new block
            
            lines = content.splitlines(keepends=True)
            new_lines = []
            skip = False
            
            # Remove existing Paper block
            for line in lines:
                if self.PAPER_MARKER_START in line:
                    skip = True
                    continue
                if self.PAPER_MARKER_END in line:
                    skip = False
                    continue
                if not skip:
                    new_lines.append(line)

            # Generate new block
            block = self._generate_block()
            
            # Write back everything
            with open(self.HOSTS_FILE, 'w') as f:
                f.writelines(new_lines)
                if not new_lines[-1].endswith('\n'):
                    f.write('\n')
                f.write(block)
            
            self.installed = True
            self.flush_dns()
            
            # Ensure we clean up on exit (only register once)
            if not hasattr(self, '_registered'):
                atexit.register(self.remove)
                self._registered = True
            
        except PermissionError:
            logger.warning("⚠️  Permission Denied: Cannot update hosts file for new domain.")
        except Exception as e:
            logger.error(f"❌ Failed to update hosts file: {e}")

    def remove(self, silent=False):
        if not self.installed and silent:
            return
            
        try:
            with open(self.HOSTS_FILE, 'r') as f:
                lines = f.readlines()

            new_lines = []
            skip = False
            found = False
            for line in lines:
                if self.PAPER_MARKER_START in line:
                    skip = True
                    found = True
                    continue
                if self.PAPER_MARKER_END in line:
                    skip = False
                    continue
                if not skip:
                    new_lines.append(line)

            if found:
                with open(self.HOSTS_FILE, 'w') as f:
                    f.writelines(new_lines)
                self.flush_dns()
                    
            self.installed = False

        except Exception:
            pass
