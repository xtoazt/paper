/**
 * PDF Bootstrap
 * Generates and handles PDF-based bootstrap for censorship resistance
 */

export interface PDFBootstrapConfig {
  serviceWorkerUrl: string;
  fallbackUrls: string[];
  version: string;
}

export class PDFBootstrap {
  private config: PDFBootstrapConfig;

  constructor(config: PDFBootstrapConfig) {
    this.config = config;
  }

  /**
   * Generate PDF JavaScript code for bootstrap
   * This code will be embedded in the PDF
   */
  generatePDFJavaScript(): string {
    return `
// Paper Network PDF Bootstrap
// This JavaScript runs inside a PDF when opened in a browser

(function() {
  'use strict';

  console.log('Paper PDF Bootstrap v${this.config.version}');

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('Not in browser environment');
    return;
  }

  // Service Worker registration function
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      return false;
    }

    const swUrls = [
      '${this.config.serviceWorkerUrl}',
      ${this.config.fallbackUrls.map(url => `'${url}'`).join(',\n      ')}
    ];

    for (const swUrl of swUrls) {
      try {
        console.log('Attempting to register Service Worker from:', swUrl);
        
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/'
        });

        console.log('Service Worker registered successfully from:', swUrl);
        
        // Wait for activation
        if (registration.installing) {
          await new Promise((resolve, reject) => {
            registration.installing.addEventListener('statechange', function handler(e) {
              const sw = e.target;
              if (sw.state === 'activated') {
                resolve();
              } else if (sw.state === 'redundant') {
                reject(new Error('Service Worker became redundant'));
              }
            });
          });
        }

        console.log('Service Worker activated successfully');
        
        // Notify parent if in iframe
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'paper:bootstrap:success',
            source: 'pdf',
            swUrl: swUrl
          }, '*');
        }

        return true;
      } catch (error) {
        console.error('Failed to register Service Worker from:', swUrl, error);
      }
    }

    console.error('All Service Worker registration attempts failed');
    
    // Notify parent if in iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'paper:bootstrap:failed',
        source: 'pdf'
      }, '*');
    }

    return false;
  }

  // Run bootstrap
  registerServiceWorker().then(success => {
    if (success) {
      console.log('PDF Bootstrap completed successfully');
    } else {
      console.error('PDF Bootstrap failed');
    }
  });
})();
`;
  }

  /**
   * Generate PDF metadata
   */
  generatePDFMetadata(): any {
    return {
      title: 'Paper Network Bootstrap',
      author: 'Paper Network',
      subject: 'Decentralized Web Bootstrap',
      keywords: 'paper, p2p, decentralized, bootstrap',
      creator: 'Paper Network',
      producer: 'Paper Network',
      creationDate: new Date(),
      modDate: new Date()
    };
  }

  /**
   * Generate complete PDF with embedded JavaScript
   * Note: This would require a PDF generation library like pdf-lib
   * For now, we'll provide the structure
   */
  async generatePDF(): Promise<Uint8Array> {
    console.log('Generating PDF bootstrap...');

    // In a real implementation, we would use pdf-lib or similar:
    // import { PDFDocument, StandardFonts } from 'pdf-lib';
    
    // For now, return a placeholder
    throw new Error('PDF generation requires pdf-lib library');

    /*
    Example implementation with pdf-lib:
    
    const pdfDoc = await PDFDocument.create();
    
    // Add metadata
    const metadata = this.generatePDFMetadata();
    pdfDoc.setTitle(metadata.title);
    pdfDoc.setAuthor(metadata.author);
    pdfDoc.setSubject(metadata.subject);
    pdfDoc.setKeywords([metadata.keywords]);
    pdfDoc.setProducer(metadata.producer);
    pdfDoc.setCreator(metadata.creator);
    pdfDoc.setCreationDate(metadata.creationDate);
    pdfDoc.setModificationDate(metadata.modDate);
    
    // Add a page with instructions
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText('Paper Network Bootstrap', {
      x: 50,
      y: height - 50,
      size: 20,
      font: helveticaFont
    });
    
    page.drawText('This PDF contains JavaScript to bootstrap the Paper Network.', {
      x: 50,
      y: height - 80,
      size: fontSize,
      font: helveticaFont
    });
    
    // Embed JavaScript
    const jsCode = this.generatePDFJavaScript();
    pdfDoc.addJavaScript('bootstrap', jsCode);
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    */
  }

  /**
   * Load PDF bootstrap from URL
   */
  async loadFromURL(url: string): Promise<boolean> {
    console.log('Loading PDF bootstrap from:', url);

    try {
      // Create hidden iframe to load PDF
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.src = url;

      // Listen for bootstrap completion
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          document.body.removeChild(iframe);
          reject(new Error('PDF bootstrap timeout'));
        }, 30000);

        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'paper:bootstrap:success') {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            resolve(true);
          } else if (event.data.type === 'paper:bootstrap:failed') {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            resolve(false);
          }
        };

        window.addEventListener('message', messageHandler);
        document.body.appendChild(iframe);
      });
    } catch (error) {
      console.error('PDF bootstrap loading failed:', error);
      return false;
    }
  }

  /**
   * Check if PDF bootstrap is supported
   */
  static isSupported(): boolean {
    // Check if browser supports:
    // 1. Service Workers
    // 2. PDF rendering (via PDF.js or native)
    // 3. JavaScript in PDFs

    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPDFSupport = 'application/pdf' in navigator.mimeTypes || 
                          navigator.userAgent.includes('Chrome') ||
                          navigator.userAgent.includes('Firefox');

    return hasServiceWorker && hasPDFSupport;
  }
}

/**
 * Create PDF bootstrap instance
 */
export function createPDFBootstrap(config: PDFBootstrapConfig): PDFBootstrap {
  return new PDFBootstrap(config);
}

/**
 * Load PDF bootstrap
 */
export async function loadPDFBootstrap(url: string): Promise<boolean> {
  const config: PDFBootstrapConfig = {
    serviceWorkerUrl: '/sw.js',
    fallbackUrls: [
      'https://paper.is-a.software/sw.js',
      'https://ipfs.io/ipfs/QmPaperSW/sw.js'
    ],
    version: '1.0.0'
  };

  const bootstrap = createPDFBootstrap(config);
  return await bootstrap.loadFromURL(url);
}
