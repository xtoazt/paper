import os
import sys
import atexit
import logging

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
        # Wildcard support in hosts is not standard, so we list common ones.
        # For true wildcard, we rely on PAC or dnsmasq, but we list defaults here.
        lines.append(self.PAPER_MARKER_END)
        return "\n".join(lines) + "\n"

    def install(self):
        try:
            with open(self.HOSTS_FILE, 'r') as f:
                content = f.read()

            if self.PAPER_MARKER_START in content:
                # Already installed, maybe stale. Remove first.
                self.remove(silent=True)
                with open(self.HOSTS_FILE, 'r') as f:
                    content = f.read()

            block = self._generate_block()
            
            # Need sudo usually
            with open(self.HOSTS_FILE, 'a') as f:
                f.write(block)
            
            self.installed = True
            logger.info(f"✅ Injected {len(self.domains)} domains into {self.HOSTS_FILE}")
            atexit.register(self.remove)
            
        except PermissionError:
            logger.warning("⚠️  Could not write to hosts file (Permission Denied). Run with sudo for automatic domain resolution.")
        except Exception as e:
            logger.error(f"❌ Failed to update hosts file: {e}")

    def remove(self, silent=False):
        if not self.installed and silent:
            # Just try to clean up traces
            pass
            
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

        except PermissionError:
            if not silent:
                logger.error("❌ Failed to clean up hosts file (Permission Denied)")
        except Exception as e:
            if not silent:
                logger.error(f"❌ Failed to clean hosts file: {e}")

