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
        self.domains = domains or ["paper", "blog.paper", "shop.paper", "test.paper"]
        self.installed = False

    def _generate_block(self):
        lines = [self.PAPER_MARKER_START]
        for domain in self.domains:
            lines.append(f"127.0.0.1 {domain}")
        lines.append(self.PAPER_MARKER_END)
        return "\n".join(lines) + "\n"

    def flush_dns(self):
        system = platform.system()
        try:
            if system == 'Darwin':
                # macOS
                subprocess.run(['killall', '-HUP', 'mDNSResponder'], check=False)
                logger.info("♻️  Flushed macOS DNS Cache")
            elif system == 'Linux':
                # Ubuntu/Debian often use systemd-resolve
                subprocess.run(['resolvectl', 'flush-caches'], check=False)
                # Or nscd
                subprocess.run(['/etc/init.d/nscd', 'restart'], check=False)
            elif system == 'Windows':
                subprocess.run(['ipconfig', '/flushdns'], check=False)
        except Exception as e:
            logger.debug(f"DNS flush failed (might be normal): {e}")

    def install(self):
        try:
            with open(self.HOSTS_FILE, 'r') as f:
                content = f.read()

            if self.PAPER_MARKER_START in content:
                self.remove(silent=True)
                with open(self.HOSTS_FILE, 'r') as f:
                    content = f.read()

            block = self._generate_block()
            
            with open(self.HOSTS_FILE, 'a') as f:
                f.write(block)
            
            self.installed = True
            logger.info(f"✅ Injected {len(self.domains)} domains into {self.HOSTS_FILE}")
            
            self.flush_dns()
            atexit.register(self.remove)
            
        except PermissionError:
            logger.warning("⚠️  Could not write to hosts file (Permission Denied). Run with sudo for automatic domain resolution.")
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
                if not silent:
                    logger.info("🧹 Cleaned up hosts file")
                    
            self.installed = False
            if found:
                self.flush_dns()

        except PermissionError:
            if not silent:
                logger.error("❌ Failed to clean up hosts file (Permission Denied)")
        except Exception as e:
            if not silent:
                logger.error(f"❌ Failed to clean hosts file: {e}")
