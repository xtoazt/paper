/**
 * Content Uploader Component
 * Upload content to IPFS and publish to .paper domains
 */

import React, { useState } from 'react';
import { getIpfsNode } from '../../lib/storage/ipfs-node';
import { uploadContent } from '../../lib/storage/content-distribution';
import { getGlobalRegistry } from '../../lib/domains/global-registry';

interface ContentUploaderProps {
  domain?: string;
  onUploadComplete?: (cid: string) => void;
}

export const ContentUploader: React.FC<ContentUploaderProps> = ({
  domain,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'html'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [uploadedCID, setUploadedCID] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    if (uploadMode === 'html' && !htmlContent.trim()) {
      setError('Please enter HTML content');
      return;
    }

    setIsUploading(true);
    setError('');
    setStatus('Preparing upload...');

    try {
      const ipfsNode = await getIpfsNode();

      if (!ipfsNode) {
        throw new Error('IPFS node not initialized');
      }

      let content: string | Uint8Array;
      
      if (uploadMode === 'file') {
        setStatus('Reading file...');
        const arrayBuffer = await file!.arrayBuffer();
        content = new Uint8Array(arrayBuffer);
      } else {
        content = htmlContent;
      }

      setStatus('Uploading to IPFS...');
      const cid = await uploadContent(content);

      setStatus('Content uploaded!');
      setUploadedCID(cid);

      // If domain specified, update domain record
      if (domain) {
        setStatus('Updating domain record...');
        
        const globalRegistry = getGlobalRegistry(
          null as any,
          null as any,
          null as any,
          null as any
        );

        await globalRegistry.registerGlobal(domain, cid, 'static');
        
        setStatus('Domain updated successfully!');
      }

      onUploadComplete?.(cid);
    } catch (err) {
      setError((err as Error).message);
      setStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setHtmlContent('');
    setStatus('');
    setError('');
    setUploadedCID('');
  };

  const getIPFSGatewayUrl = (cid: string): string => {
    return `https://ipfs.io/ipfs/${cid}`;
  };

  return (
    <div className="content-uploader card">
      <h2 className="title">Upload Content</h2>
      <p className="description">
        Upload files or HTML to IPFS for unlimited free hosting
      </p>

      {!uploadedCID ? (
        <div className="form">
          <div className="mode-selector">
            <button
              className={`mode-button ${uploadMode === 'file' ? 'active' : ''}`}
              onClick={() => setUploadMode('file')}
            >
              📁 File Upload
            </button>
            <button
              className={`mode-button ${uploadMode === 'html' ? 'active' : ''}`}
              onClick={() => setUploadMode('html')}
            >
              📝 HTML Editor
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div className="upload-area">
              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-label">
                {file ? (
                  <div className="file-info">
                    <div className="file-icon">📄</div>
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <div className="upload-icon">⬆️</div>
                    <div className="upload-text">
                      Click to select a file or drag and drop
                    </div>
                    <div className="upload-hint">
                      HTML, CSS, JS, images, or any file type
                    </div>
                  </div>
                )}
              </label>
            </div>
          ) : (
            <div className="html-editor">
              <textarea
                className="html-textarea"
                placeholder="<!DOCTYPE html>
<html>
<head>
  <title>My Paper Site</title>
</head>
<body>
  <h1>Hello, Paper Network!</h1>
</body>
</html>"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                disabled={isUploading}
              />
            </div>
          )}

          {domain && (
            <div className="domain-info">
              <span className="info-icon">🌐</span>
              <span>Will update: <strong>{domain}</strong></span>
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
            onClick={handleUpload}
            disabled={isUploading || (uploadMode === 'file' && !file) || (uploadMode === 'html' && !htmlContent)}
          >
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </button>
        </div>
      ) : (
        <div className="success-view">
          <div className="success-icon">✅</div>
          <h3>Upload Successful!</h3>
          
          <div className="cid-box">
            <div className="cid-label">IPFS CID:</div>
            <div className="cid-value font-mono">{uploadedCID}</div>
          </div>

          <div className="success-actions">
            <a
              href={getIPFSGatewayUrl(uploadedCID)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              View on IPFS →
            </a>
            {domain && (
              <a
                href={`http://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Visit Domain →
              </a>
            )}
            <button className="btn btn-secondary" onClick={handleReset}>
              Upload Another
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .content-uploader {
          max-width: 600px;
          margin: 0 auto;
        }

        .title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-2);
        }

        .description {
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-6);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .mode-selector {
          display: flex;
          gap: var(--spacing-2);
          background: var(--color-gray-100);
          padding: var(--spacing-1);
          border-radius: var(--border-radius-md);
        }

        .mode-button {
          flex: 1;
          padding: var(--spacing-2);
          background: transparent;
          border: none;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-600);
          transition: all var(--transition-fast);
        }

        .mode-button:hover {
          color: var(--color-black);
        }

        .mode-button.active {
          background: var(--color-white);
          color: var(--color-black);
          box-shadow: var(--shadow-sm);
        }

        .upload-area {
          border: 2px dashed var(--color-border-medium);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-8);
          transition: all var(--transition-base);
        }

        .upload-area:hover {
          border-color: var(--color-black);
          background: var(--color-gray-50);
        }

        .upload-label {
          display: block;
          cursor: pointer;
        }

        .upload-prompt {
          text-align: center;
        }

        .upload-icon {
          font-size: var(--font-size-5xl);
          margin-bottom: var(--spacing-3);
        }

        .upload-text {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--spacing-2);
        }

        .upload-hint {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .file-icon {
          font-size: var(--font-size-4xl);
        }

        .file-name {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--spacing-1);
        }

        .file-size {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .html-editor {
          width: 100%;
        }

        .html-textarea {
          width: 100%;
          min-height: 300px;
          padding: var(--spacing-4);
          font-family: var(--font-mono);
          font-size: var(--font-size-sm);
          border: 1px solid var(--color-border-light);
          border-radius: var(--border-radius-md);
          resize: vertical;
        }

        .html-textarea:focus {
          outline: none;
          border-color: var(--color-black);
        }

        .domain-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          padding: var(--spacing-3);
          background: var(--color-gray-50);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-sm);
        }

        .info-icon {
          font-size: var(--font-size-lg);
        }

        .status-box {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3);
          background: var(--color-blue);
          color: var(--color-white);
          border-radius: var(--border-radius-md);
        }

        .status-icon {
          font-size: var(--font-size-lg);
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3);
          background: var(--color-red);
          color: var(--color-white);
          border-radius: var(--border-radius-md);
        }

        .error-icon {
          font-size: var(--font-size-lg);
        }

        .btn-full {
          width: 100%;
        }

        .success-view {
          text-align: center;
        }

        .success-icon {
          font-size: var(--font-size-6xl);
          margin-bottom: var(--spacing-4);
        }

        .success-view h3 {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-6);
        }

        .cid-box {
          background: var(--color-gray-50);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-6);
          margin-bottom: var(--spacing-6);
        }

        .cid-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-2);
        }

        .cid-value {
          font-size: var(--font-size-sm);
          color: var(--color-black);
          word-break: break-all;
        }

        .success-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-3);
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default ContentUploader;
