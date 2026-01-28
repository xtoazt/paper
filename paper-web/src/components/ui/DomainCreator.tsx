/**
 * Domain Creator Component
 * Create and register .paper domains with global consensus
 */

import React, { useState } from 'react';
import { getGlobalRegistry, type GlobalDomainRecord } from '../../lib/domains/global-registry';
import { getServerHosting } from '../../lib/domains/server-hosting';

interface DomainCreatorProps {
  onDomainCreated?: (domain: string) => void;
}

export const DomainCreator: React.FC<DomainCreatorProps> = ({ onDomainCreated }) => {
  const [domainName, setDomainName] = useState('');
  const [contentCID, setContentCID] = useState('');
  const [domainType, setDomainType] = useState<'static' | 'dynamic' | 'server'>('static');
  const [isRegistering, setIsRegistering] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [registeredDomain, setRegisteredDomain] = useState<GlobalDomainRecord | null>(null);

  const handleRegister = async () => {
    if (!domainName.trim()) {
      setError('Please enter a domain name');
      return;
    }

    // Add .paper if not present
    const fullDomain = domainName.endsWith('.paper')
      ? domainName
      : `${domainName}.paper`;

    setIsRegistering(true);
    setError('');
    setStatus('Preparing registration...');

    try {
      const globalRegistry = getGlobalRegistry(
        null as any, // Will be initialized by node manager
        null as any,
        null as any,
        null as any
      );

      if (domainType === 'server') {
        // Register and host server
        setStatus('Hosting server...');
        
        const serverHosting = getServerHosting(
          globalRegistry,
          null as any,
          null as any
        );

        const success = await serverHosting.hostServer(fullDomain);
        
        if (!success) {
          throw new Error('Failed to host server');
        }

        setStatus('Server hosted successfully!');
      } else {
        // Register static/dynamic content
        setStatus('Generating PKARR keypair...');
        
        const content = contentCID || `default-content-${Date.now()}`;
        
        setStatus('Publishing to DHT...');
        const success = await globalRegistry.registerGlobal(
          fullDomain,
          content,
          domainType
        );

        if (!success) {
          throw new Error('Failed to register domain');
        }

        setStatus('Broadcasting to network...');
      }

      // Wait for consensus
      setStatus('Achieving consensus...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify registration
      setStatus('Verifying registration...');
      const record = await globalRegistry.resolveGlobal(fullDomain);

      if (record) {
        setRegisteredDomain(record);
        setStatus('Domain registered successfully!');
        onDomainCreated?.(fullDomain);
      } else {
        throw new Error('Domain verification failed');
      }
    } catch (err) {
      setError((err as Error).message);
      setStatus('');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleReset = () => {
    setDomainName('');
    setContentCID('');
    setDomainType('static');
    setStatus('');
    setError('');
    setRegisteredDomain(null);
  };

  return (
    <div className="domain-creator card">
      <h2 className="title">Create .paper Domain</h2>
      <p className="description">
        Register a globally consistent .paper domain with cryptographic ownership
      </p>

      {!registeredDomain ? (
        <div className="form">
          <div className="form-group">
            <label htmlFor="domain-name">Domain Name</label>
            <div className="input-group">
              <input
                id="domain-name"
                type="text"
                className="input"
                placeholder="mysite"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                disabled={isRegistering}
              />
              <span className="input-suffix">.paper</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="domain-type">Domain Type</label>
            <select
              id="domain-type"
              className="input"
              value={domainType}
              onChange={(e) => setDomainType(e.target.value as any)}
              disabled={isRegistering}
            >
              <option value="static">Static (IPFS content)</option>
              <option value="dynamic">Dynamic (updateable)</option>
              <option value="server">Server (HTTP/WebSocket)</option>
            </select>
          </div>

          {(domainType === 'static' || domainType === 'dynamic') && (
            <div className="form-group">
              <label htmlFor="content-cid">Content CID (optional)</label>
              <input
                id="content-cid"
                type="text"
                className="input"
                placeholder="QmYourIPFSContentID"
                value={contentCID}
                onChange={(e) => setContentCID(e.target.value)}
                disabled={isRegistering}
              />
              <small className="help-text">
                Leave empty to generate a default page
              </small>
            </div>
          )}

          {status && (
            <div className="status-box">
              <div className="status-icon">⏳</div>
              <div className="status-text">{status}</div>
            </div>
          )}

          {error && (
            <div className="error-box">
              <div className="error-icon">❌</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={handleRegister}
            disabled={isRegistering || !domainName}
          >
            {isRegistering ? 'Registering...' : 'Register Domain'}
          </button>
        </div>
      ) : (
        <div className="success-view">
          <div className="success-icon">✅</div>
          <h3>Domain Registered!</h3>
          
          <div className="domain-info">
            <div className="info-row">
              <span className="info-label">Domain:</span>
              <span className="info-value font-mono">{registeredDomain.domain}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Type:</span>
              <span className="info-value">
                <span className="badge badge-primary">{registeredDomain.type}</span>
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Owner:</span>
              <span className="info-value font-mono">
                {registeredDomain.owner.substring(0, 16)}...
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Content:</span>
              <span className="info-value font-mono">
                {registeredDomain.content.substring(0, 24)}...
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value">
                <span className="badge badge-success">
                  Live ({registeredDomain.replicas} peers)
                </span>
              </span>
            </div>
            
            {registeredDomain.verified && (
              <div className="info-row">
                <span className="info-label">Verification:</span>
                <span className="info-value">
                  <span className="badge badge-success">✓ Verified</span>
                </span>
              </div>
            )}
          </div>

          <div className="success-actions">
            <a
              href={`http://${registeredDomain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Visit Domain →
            </a>
            <button className="btn btn-secondary" onClick={handleReset}>
              Register Another
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DomainCreator;
