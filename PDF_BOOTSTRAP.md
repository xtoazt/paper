# 📄 Paper Network PDF Bootstrap

## Overview

The Paper Network uses a **JavaScript-enabled PDF** as a censorship-resistant bootstrap mechanism. This PDF can be distributed via CDN (jsDelivr), direct download, or even email, and will automatically configure any browser to access `.paper` domains.

## How It Works

### 1. **LaTeX Document**
- Beautiful, professional-looking PDF
- Contains full documentation and instructions
- Embeds JavaScript using PDF annotations
- QR codes for easy sharing

### 2. **Embedded JavaScript**
- Auto-executes when PDF is opened
- Registers a Service Worker in the browser
- Service Worker intercepts `.paper` domain requests
- Routes requests through P2P network

### 3. **Service Worker**
- Persists across browser restarts
- Handles all `.paper` TLD requests
- Resolves domains via DHT/PKARR
- Fetches content from IPFS/P2P network
- Serves cached content for offline access

## Building the PDF

### Prerequisites

**macOS:**
```bash
brew install --cask mactex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-full
```

**Windows:**
Download from https://www.tug.org/texlive/

### Build Command

```bash
./build-pdf.sh
```

Or manually:
```bash
pdflatex bootstrap.tex
pdflatex bootstrap.tex  # Run twice for references
```

## Distribution

### Method 1: jsDelivr CDN (Recommended)

1. Commit the PDF to GitHub:
   ```bash
   git add bootstrap.pdf
   git commit -m "Add bootstrap PDF"
   git push
   ```

2. Access via CDN:
   ```
   https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf
   ```

3. Users can download and open the PDF from anywhere in the world

### Method 2: IPFS

1. Upload to IPFS:
   ```bash
   ipfs add bootstrap.pdf
   ```

2. Pin the hash for availability

3. Access via any IPFS gateway:
   ```
   https://ipfs.io/ipfs/<hash>
   ```

### Method 3: Direct Distribution

- Email the PDF
- Share via USB drive
- Print QR code from PDF
- Host on any web server

## Testing

### Local Test
```bash
open bootstrap.pdf  # macOS
xdg-open bootstrap.pdf  # Linux
start bootstrap.pdf  # Windows
```

### Browser Test

1. Open the PDF in a modern browser:
   - Chrome/Chromium
   - Firefox
   - Edge
   - Safari (limited JS support)
   - Brave

2. Allow JavaScript execution when prompted

3. Grant Service Worker registration permission

4. Navigate to `https://paper.paper`

5. You should see the Paper Network dashboard!

## Features

### PDF Content

✅ **Professional Design**
- Custom colors (Paper blue, purple, green)
- Fancy headers and footers
- TikZ graphics for logo
- Colored boxes for highlights
- QR codes for easy access

✅ **Comprehensive Documentation**
- How it works
- Getting started guide
- Technical specifications
- Security features
- FAQ section

✅ **Embedded JavaScript**
- Auto-executing bootstrap code
- Service Worker registration
- P2P network initialization
- Domain resolution setup

### Service Worker Capabilities

✅ **Domain Interception**
- Catches all `.paper` domain requests
- Routes through P2P network
- Caches responses locally

✅ **Bootstrap Pages**
- `paper.paper` - Main dashboard
- `*.paper` - Domain creation pages
- Styled with inline CSS

✅ **Offline Support**
- Works without internet (for cached domains)
- Service Worker persists across restarts

## Architecture

```
User opens PDF
    ↓
JavaScript executes
    ↓
Service Worker registered
    ↓
Service Worker intercepts .paper requests
    ↓
Resolves domain via DHT/PKARR
    ↓
Fetches content from IPFS/P2P
    ↓
Serves to browser
```

## Security

### PDF Security
- No external dependencies
- Self-contained JavaScript
- Read-only document
- Open source (inspectable)

### Service Worker Security
- HTTPS required (or localhost)
- Same-origin policy enforced
- User must grant permission
- Can be unregistered anytime

### Network Security
- End-to-end encryption (TLS)
- Content addressing (IPFS)
- Cryptographic domain ownership (PKARR)
- No central authority

## Censorship Resistance

### Why PDF?

1. **Universal Format** - Works on every device
2. **Self-Contained** - No external dependencies
3. **CDN Distribution** - jsDelivr is hard to block
4. **Multiple Backups** - Can be hosted anywhere
5. **Offline Capable** - Can be shared via USB/email

### Fallback Methods

If jsDelivr is blocked:
- IPFS gateways
- Direct GitHub download
- Email distribution
- DNS TXT records
- P2P sharing

## Customization

### Colors

Edit in `bootstrap.tex`:
```latex
\definecolor{paperblue}{RGB}{0,112,243}
\definecolor{paperpurple}{RGB}{124,58,237}
\definecolor{papergreen}{RGB}{16,185,129}
```

### Logo

Modify the TikZ picture:
```latex
\begin{tikzpicture}
  % Your custom logo here
\end{tikzpicture}
```

### JavaScript

Edit the JavaScript annotation:
```latex
\pdfannot width 0pt height 0pt depth 0pt {
  /Subtype /JavaScript
  /JS (
    // Your custom JavaScript here
  )
}
```

## Troubleshooting

### PDF doesn't execute JavaScript

**Solution:** Ensure you're using a JavaScript-enabled PDF viewer:
- Adobe Acrobat Reader
- Chrome/Edge (built-in viewer)
- Firefox (built-in viewer)

### Service Worker registration fails

**Solution:** Must be served over HTTPS or localhost:
```bash
# Serve locally for testing
python3 -m http.server 8000
# Visit http://localhost:8000/bootstrap.pdf
```

### .paper domains don't resolve

**Solution:** 
1. Check Service Worker is registered: DevTools → Application → Service Workers
2. Clear cache and reload
3. Check console for errors

## Advanced Usage

### Custom Bootstrap Script

You can modify the Service Worker code to:
- Add custom domain resolution logic
- Integrate with existing infrastructure
- Customize the UI/UX
- Add analytics (privacy-respecting)

### Multi-Network Support

The PDF can bootstrap multiple networks:
```javascript
// In PDF JavaScript
const networks = ['paper', 'onion', 'ipfs'];
networks.forEach(net => registerServiceWorker(net));
```

### Auto-Update

Add version checking:
```javascript
const CURRENT_VERSION = '1.0.0';
const UPDATE_URL = 'https://cdn.jsdelivr.net/gh/xtoazt/paper@main/version.json';
// Check for updates and prompt user
```

## Contributing

### Improving the LaTeX

- Better graphics
- More examples
- Additional languages
- Accessibility improvements

### Enhancing JavaScript

- Better error handling
- Progress indicators
- Network diagnostics
- Performance optimizations

### Testing

- Different PDF viewers
- Various browsers
- Mobile devices
- Offline scenarios

## Resources

- **LaTeX Documentation:** https://www.latex-project.org/
- **PDF JavaScript:** https://www.adobe.com/devnet/acrobat/javascript.html
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **jsDelivr CDN:** https://www.jsdelivr.com/

## License

MIT License - See LICENSE file

---

**Paper Network - Making the web truly decentralized, one PDF at a time.** 🎉
