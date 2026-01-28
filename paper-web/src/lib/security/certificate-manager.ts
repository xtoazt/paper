/**
 * Certificate Manager
 * Automatic SSL/TLS certificates via Let's Encrypt
 */

export interface Certificate {
  domain: string;
  cert: string;
  key: string;
  issued: number;
  expires: number;
  autoRenew: boolean;
}

export class CertificateManager {
  private certificates: Map<string, Certificate> = new Map();
  
  constructor() {
    console.log('[CertificateManager] Initialized');
    this.startAutoRenew();
  }

  /**
   * Get certificate for domain
   */
  async getCertificate(domain: string): Promise<Certificate | null> {
    let cert = this.certificates.get(domain);
    
    if (!cert) {
      // Auto-provision via Let's Encrypt
      cert = await this.provisionCertificate(domain);
    } else if (this.isExpiringSoon(cert)) {
      // Auto-renew
      cert = await this.renewCertificate(domain);
    }
    
    return cert;
  }

  /**
   * Provision certificate via Let's Encrypt
   */
  private async provisionCertificate(domain: string): Promise<Certificate> {
    console.log('[CertificateManager] Provisioning certificate for:', domain);
    
    // Would integrate with ACME protocol in real implementation
    const cert: Certificate = {
      domain,
      cert: 'mock-cert-data',
      key: 'mock-key-data',
      issued: Date.now(),
      expires: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
      autoRenew: true
    };
    
    this.certificates.set(domain, cert);
    return cert;
  }

  /**
   * Renew certificate
   */
  private async renewCertificate(domain: string): Promise<Certificate> {
    console.log('[CertificateManager] Renewing certificate for:', domain);
    return this.provisionCertificate(domain);
  }

  /**
   * Check if certificate is expiring soon
   */
  private isExpiringSoon(cert: Certificate): boolean {
    const daysUntilExpiry = (cert.expires - Date.now()) / (24 * 60 * 60 * 1000);
    return daysUntilExpiry < 30; // Renew 30 days before expiry
  }

  /**
   * Start auto-renewal process
   */
  private startAutoRenew(): void {
    setInterval(() => {
      for (const [domain, cert] of this.certificates) {
        if (cert.autoRenew && this.isExpiringSoon(cert)) {
          this.renewCertificate(domain);
        }
      }
    }, 86400000); // Check daily
  }

  /**
   * Upload custom certificate
   */
  async uploadCertificate(domain: string, cert: string, key: string): Promise<void> {
    const certificate: Certificate = {
      domain,
      cert,
      key,
      issued: Date.now(),
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      autoRenew: false
    };
    
    this.certificates.set(domain, certificate);
    console.log('[CertificateManager] Custom certificate uploaded for:', domain);
  }
}

export function getCertificateManager(): CertificateManager {
  return new CertificateManager();
}
