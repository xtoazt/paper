# How to Create the Bootstrap PDF

## Overview

The bootstrap PDF is a JavaScript-enabled PDF file that can bootstrap the Paper Network in a censorship-resistant way. It will be served via jsDelivr CDN at:

```
https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf
```

## Why a PDF?

- **Censorship Resistant**: PDFs with JavaScript can bypass many content filters
- **CDN Distribution**: jsDelivr provides global CDN with high availability
- **Reference**: Inspired by [linuxpdf](https://github.com/ading2210/linuxpdf) which demonstrates JavaScript in PDFs

## What the PDF Should Contain

The PDF should embed JavaScript that:

1. **Bootstraps the Paper Network**
   - Initializes libp2p node
   - Connects to bootstrap peers
   - Sets up DHT for domain resolution

2. **Registers Service Worker**
   - Installs the enhanced service worker
   - Enables `.paper` domain interception

3. **Provides Instructions**
   - Visual guide on what to do next
   - Link to paper.is-a.software
   - QR code for mobile access

## How to Create It

### Option 1: Using PDFKit (Node.js)

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create a document
const doc = new PDFDocument();

// Pipe to file
doc.pipe(fs.createWriteStream('bootstrap.pdf'));

// Add JavaScript action
doc.addJavaScript(`
  // Bootstrap Paper Network
  (function() {
    // Your bootstrap code here
    console.log('Paper Network bootstrapping...');
    
    // Redirect to main site
    if (typeof app !== 'undefined') {
      app.launchURL('https://paper.is-a.software/');
    }
  })();
`);

// Add content
doc
  .fontSize(25)
  .text('Paper Network Bootstrap', 100, 100)
  .fontSize(14)
  .text('This PDF bootstraps the Paper Network.', 100, 150)
  .text('Visit: https://paper.is-a.software/', 100, 180);

// Finalize PDF
doc.end();
```

### Option 2: Using pdf-lib (Modern)

```javascript
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';

async function createBootstrapPDF() {
  const pdfDoc = await PDFDocument.create();
  
  // Add JavaScript
  const jsAction = pdfDoc.context.obj({
    S: 'JavaScript',
    JS: `
      // Paper Network Bootstrap
      try {
        // Open main site
        app.launchURL('https://paper.is-a.software/', true);
      } catch (e) {
        console.log('Bootstrap initiated');
      }
    `
  });
  
  pdfDoc.catalog.set('OpenAction', jsAction);
  
  // Add a page
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('Paper Network Bootstrap', {
    x: 50,
    y: 350,
    size: 30,
    font
  });
  
  page.drawText('Censorship-resistant decentralized hosting', {
    x: 50,
    y: 300,
    size: 16,
    font
  });
  
  page.drawText('Visit: https://paper.is-a.software/', {
    x: 50,
    y: 250,
    size: 14,
    font
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile('bootstrap.pdf', pdfBytes);
}

createBootstrapPDF();
```

### Option 3: Manual with Adobe Acrobat

1. Create a PDF with content about Paper Network
2. In Acrobat, go to Tools → JavaScript → Document Actions
3. Add Document Open action with JavaScript:
   ```javascript
   app.launchURL('https://paper.is-a.software/', true);
   ```

## What to Include in the PDF

### Page 1: Welcome
- **Title**: "Paper Network Bootstrap"
- **Subtitle**: "Decentralized Web Hosting"
- **Logo**: Paper Network logo
- **Description**: Brief explanation of what Paper is
- **Action**: "This PDF will automatically redirect you to the Paper Network site"

### Page 2: Quick Start
- **Step 1**: Visit paper.is-a.software
- **Step 2**: Click "Get Started"
- **Step 3**: Deploy your first site
- **QR Code**: Link to main site

### Page 3: Technical Details
- **Bootstrap Peers**: List of bootstrap peer addresses
- **DHT Info**: Information about the DHT network
- **GitHub**: Link to source code

## JavaScript to Embed

```javascript
// Paper Network Bootstrap Script
(function() {
  'use strict';
  
  // Configuration
  const PAPER_URL = 'https://paper.is-a.software/';
  const BOOTSTRAP_PEERS = [
    '/dns4/bootstrap1.paper.network/tcp/443/wss',
    '/dns4/bootstrap2.paper.network/tcp/443/wss'
  ];
  
  // Function to launch URL
  function openPaperNetwork() {
    try {
      // Try Acrobat's launchURL
      if (typeof app !== 'undefined' && app.launchURL) {
        app.launchURL(PAPER_URL, true);
        return true;
      }
    } catch (e) {
      console.log('PDF JavaScript executed');
    }
    return false;
  }
  
  // Execute on document open
  openPaperNetwork();
  
  // Store bootstrap info in document
  if (typeof this !== 'undefined') {
    this.paperBootstrap = {
      url: PAPER_URL,
      peers: BOOTSTRAP_PEERS,
      timestamp: new Date().toISOString()
    };
  }
})();
```

## Deployment Steps

1. **Create the PDF**
   ```bash
   node create-bootstrap-pdf.js
   ```

2. **Test Locally**
   - Open `bootstrap.pdf` in various PDF readers
   - Adobe Acrobat (best JavaScript support)
   - Preview/Chrome (limited support)
   - Firefox PDF viewer (limited support)

3. **Commit to Repository**
   ```bash
   git add bootstrap.pdf
   git commit -m "Add bootstrap PDF for censorship resistance"
   git push origin main
   ```

4. **Verify jsDelivr URL**
   - Wait 5-10 minutes for CDN propagation
   - Visit: `https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf`
   - Should download the PDF

5. **Update Website Links**
   - The links are already in place in `UltimateLanding.tsx`
   - They currently point to GitHub repository
   - Once PDF is created, update them back to jsDelivr URL

## Security Considerations

- **PDF Readers**: Most modern PDF readers restrict JavaScript execution
- **Fallback**: PDF should work as documentation even without JS
- **Content**: Include clear instructions for manual access
- **QR Codes**: Add QR codes that work without JavaScript

## Testing Checklist

- [ ] PDF opens in Adobe Acrobat Reader
- [ ] JavaScript executes (check with console)
- [ ] PDF contains readable content without JS
- [ ] QR codes scan correctly
- [ ] Links are clickable
- [ ] File size < 500KB for fast downloads
- [ ] jsDelivr URL works globally
- [ ] PDF renders on mobile devices

## Alternative Approach

If JavaScript PDFs prove unreliable, consider:

1. **HTML page served via jsDelivr**
   - `https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.html`
   - Full JavaScript support
   - Still censorship-resistant via CDN

2. **Multiple fallbacks**
   - PDF with JavaScript
   - HTML bootstrap page
   - Direct GitHub Pages link
   - IPFS gateway links

## Current Status

⚠️ **PDF not yet created** - Links currently point to GitHub repository

To activate the PDF bootstrap:
1. Create the PDF following this guide
2. Commit to repository as `bootstrap.pdf`
3. Update links in `UltimateLanding.tsx` back to jsDelivr URL

## References

- [linuxpdf](https://github.com/ading2210/linuxpdf) - JavaScript in PDFs example
- [PDF-lib](https://pdf-lib.js.org/) - Modern PDF creation library
- [PDFKit](https://pdfkit.org/) - Node.js PDF generation
- [jsDelivr](https://www.jsdelivr.com/) - Free CDN for GitHub files

---

**Note**: The PDF bootstrap is optional. The Paper Network works perfectly fine by visiting https://paper.is-a.software/ directly. The PDF is just an additional censorship-resistant entry point.
