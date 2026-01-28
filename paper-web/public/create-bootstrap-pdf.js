/**
 * Bootstrap PDF Creator
 * Creates a JavaScript-enabled PDF that bootstraps the Paper Network
 * 
 * Usage: node create-bootstrap-pdf.js
 * Requires: npm install pdf-lib
 */

import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function createBootstrapPDF() {
  console.log('Creating Paper Network Bootstrap PDF...');
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Add JavaScript action that runs on document open
  const bootstrapJS = `
    // Paper Network Bootstrap Script
    (function() {
      'use strict';
      
      var PAPER_URL = 'https://paper.is-a.software/';
      var BOOTSTRAP_MSG = 'Paper Network Bootstrap PDF loaded';
      
      // Try to open Paper Network site
      try {
        if (typeof app !== 'undefined' && typeof app.launchURL === 'function') {
          app.launchURL(PAPER_URL, true);
          console.println('Launching Paper Network...');
        } else {
          console.println(BOOTSTRAP_MSG);
        }
      } catch (e) {
        console.println('Bootstrap executed: ' + e.toString());
      }
      
      // Store bootstrap information
      if (typeof this !== 'undefined') {
        this.paperNetwork = {
          url: PAPER_URL,
          bootstrapTime: new Date().toISOString(),
          version: '1.0.0'
        };
      }
    })();
  `;
  
  // Add JavaScript to PDF (OpenAction)
  const jsAction = pdfDoc.context.obj({
    S: 'JavaScript',
    JS: bootstrapJS
  });
  
  pdfDoc.catalog.set('OpenAction', jsAction);
  
  // Page 1: Welcome
  const page1 = pdfDoc.addPage([600, 800]);
  const { width, height } = page1.getSize();
  
  // Title
  page1.drawText('Paper Network', {
    x: 50,
    y: height - 100,
    size: 40,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  // Subtitle
  page1.drawText('Bootstrap PDF', {
    x: 50,
    y: height - 140,
    size: 24,
    font: helveticaFont,
    color: rgb(0.4, 0.49, 0.92) // #667eea
  });
  
  // Description
  const description = [
    'Welcome to the Paper Network Bootstrap PDF!',
    '',
    'Paper Network is a decentralized web hosting platform that',
    'provides unlimited free hosting on .paper domains.',
    '',
    'Features:',
    '  • True global domains (cryptographically secured)',
    '  • Full HTTP/WebSocket server hosting',
    '  • Unlimited bandwidth and storage',
    '  • Censorship impossible (P2P + IPFS)',
    '  • Deploy in under 10 seconds',
    '  • $0 forever - no credit card required',
    '',
    'This PDF will automatically redirect you to the Paper Network',
    'site if your PDF reader supports JavaScript.',
  ];
  
  let yPos = height - 200;
  description.forEach(line => {
    page1.drawText(line, {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0)
    });
    yPos -= 20;
  });
  
  // Instructions
  page1.drawText('If not redirected automatically:', {
    x: 50,
    y: yPos - 20,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  page1.drawText('Visit: https://paper.is-a.software/', {
    x: 50,
    y: yPos - 45,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0.42, 0.95) // Blue link color
  });
  
  // Footer
  page1.drawText('Censorship-resistant • Decentralized • Free Forever', {
    x: 50,
    y: 50,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  // Page 2: Quick Start
  const page2 = pdfDoc.addPage([600, 800]);
  
  page2.drawText('Quick Start Guide', {
    x: 50,
    y: height - 100,
    size: 30,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  const quickStart = [
    'Step 1: Visit Paper Network',
    '  → Go to https://paper.is-a.software/',
    '  → No registration required',
    '',
    'Step 2: Start Building',
    '  → Click "Get Started" button',
    '  → Service Worker will be registered automatically',
    '',
    'Step 3: Deploy Your First Site',
    '  → Write or paste your HTML code',
    '  → Click "Deploy to .paper"',
    '  → Your site goes live in under 10 seconds',
    '',
    'Step 4: Access Your Site',
    '  → Visit yourname.paper in any browser',
    '  → Share your .paper domain with anyone',
    '  → It works globally, forever, for $0',
    '',
    'Alternative Access Methods:',
    '  • GitHub: https://github.com/xtoazt/paper',
    '  • IPFS Gateway: Via IPFS hash',
    '  • P2P Network: Direct peer connection',
  ];
  
  yPos = height - 160;
  quickStart.forEach(line => {
    const isBold = line.startsWith('Step') || line.startsWith('Alternative');
    page2.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: isBold ? helveticaBold : helveticaFont,
      color: rgb(0, 0, 0)
    });
    yPos -= 18;
  });
  
  // Page 3: Technical Details
  const page3 = pdfDoc.addPage([600, 800]);
  
  page3.drawText('Technical Architecture', {
    x: 50,
    y: height - 100,
    size: 30,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  });
  
  const technical = [
    'Paper Network uses cutting-edge web technologies:',
    '',
    'P2P Networking (libp2p)',
    '  • WebRTC for browser-to-browser connections',
    '  • DHT (Distributed Hash Table) for domain resolution',
    '  • PubSub for real-time updates',
    '',
    'Distributed Storage (IPFS)',
    '  • Content-addressed storage',
    '  • Automatic peer replication',
    '  • Permanent content availability',
    '',
    'Decentralized Naming (PKARR)',
    '  • Ed25519 cryptographic signatures',
    '  • Sovereign domain ownership',
    '  • Consensus-based resolution (97%+ agreement)',
    '',
    'Censorship Resistance',
    '  • Multiple bootstrap methods',
    '  • P2P peer discovery',
    '  • No single point of failure',
    '  • This PDF is one bootstrap method!',
    '',
    'Performance',
    '  • Sub-50ms domain resolution',
    '  • 5-10 second global propagation',
    '  • 99.99% uptime (decentralized)',
    '',
    'Security',
    '  • End-to-end encryption (libsodium)',
    '  • Multi-hop onion routing',
    '  • Cryptographic domain verification',
  ];
  
  yPos = height - 160;
  technical.forEach(line => {
    const isBold = !line.startsWith('  ') && line.length > 0;
    page3.drawText(line, {
      x: 50,
      y: yPos,
      size: 10,
      font: isBold ? helveticaBold : helveticaFont,
      color: rgb(0, 0, 0)
    });
    yPos -= 16;
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  // Write to file
  fs.writeFileSync('../bootstrap.pdf', pdfBytes);
  
  console.log('✅ Bootstrap PDF created successfully!');
  console.log('📄 File: ../bootstrap.pdf');
  console.log('📦 Size:', (pdfBytes.length / 1024).toFixed(2), 'KB');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test the PDF in Adobe Acrobat Reader');
  console.log('2. Commit to repository: git add bootstrap.pdf');
  console.log('3. Push to GitHub: git push origin main');
  console.log('4. Verify jsDelivr URL in 5-10 minutes');
  console.log('5. Update website links to use jsDelivr URL');
}

// Run if executed directly
createBootstrapPDF().catch(err => {
  console.error('❌ Error creating PDF:', err);
  process.exit(1);
});

export { createBootstrapPDF };
